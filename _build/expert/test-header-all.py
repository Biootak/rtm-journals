#!/usr/bin/env python3
"""Header-line survival test for any journal in pdf-inventory.json.

For every PDF page, the body-looking lines in the top strip (y <= 115) are
checked against the journal's parsed text by five-word shingles.  Results are
merged into header-status.json so the checklist can be rebuilt incrementally.

  python test-header-all.py dplocation maxpain ...
  python test-header-all.py --all
"""
import json
import os
import re
import sys

import fitz

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BUILD = os.path.join(ROOT, '_build')
INV = os.path.join(ROOT, '_build', 'expert', 'pdf-inventory.json')
STATUS = os.environ.get('HEADER_STATUS') or os.path.join(ROOT, '_build', 'expert', 'header-status.json')

LEGAL = re.compile(
    r'cookie|copyright|educational purposes|web ?site uses|website is started|'
    r'read the market|all rights reserved|terms|privacy', re.I)
CHROME = re.compile(
    r'^(?:\d+/\d+/\d+|home|education|forum|more|logout|index|recent topics|'
    r'new topic|no replies|my topics|welcome,?.*|last login:.*|'
    r'forum members.*|journals|reply topic|favorite|page:.*|topic:.*|'
    r'readthemarket\.com|the only school.*|quick reply|reply|quote|thank you|'
    r'posts:.*|thank you received:.*|the following user\(s\) said thank you.*|'
    r'warning: spoiler.*|click to expand.*)$', re.I)
SIGNATURE = re.compile(
    r'chief cook|piece of truth|gently dig it out|random fakeouts|'
    r'until we know for sure|never be satisfied|rabbi|'
    r'posts:\s*\d+', re.I)
URL = re.compile(r'https?://|readthemarket\.com/index\.php')


def words(s):
    return re.sub(r'[^a-z0-9]+', ' ', str(s).lower()).strip()


def shingles(text, n=5):
    w = words(text).split()
    return set(' '.join(w[i:i + n]) for i in range(max(0, len(w) - n + 1)))


def has_window(corpus, text, n=5):
    w = words(text).split()
    if len(w) < n:
        return True
    return bool(shingles(text, n) & corpus)


def page_lines(page):
    rows, seen = [], set()
    for b in page.get_text('dict')['blocks']:
        for line in b.get('lines', []):
            spans = [s for s in line['spans'] if s['text'].strip()]
            if not spans:
                continue
            text = ''.join(s['text'] for s in spans).strip()
            size = max(s['size'] for s in spans)
            y, x = line['bbox'][1], line['bbox'][0]
            key = (round(y, 1), text)
            if key in seen:
                continue
            seen.add(key)
            rows.append((y, x, size, text))
    rows.sort()
    return rows


def candidates(page):
    out = []
    for y, x, size, text in page_lines(page):
        if not (60 <= y <= 115 and 11.4 <= size <= 13.0):
            continue
        if x < 55 or x > 600 or len(text) < 25:
            continue
        if CHROME.match(text) or URL.search(text) or LEGAL.search(text) or SIGNATURE.search(text):
            continue
        out.append((y, text))
    return out


def walk_pdfs(dirs):
    out = []
    for d in dirs:
        base = d if os.path.isabs(d) else os.path.join(ROOT, d)
        for root, _, files in os.walk(base):
            for f in files:
                if f.lower().endswith('.pdf'):
                    out.append(os.path.join(root, f))
    return sorted(out)


def main():
    inventory = json.load(open(INV, encoding='utf-8'))
    status = json.load(open(STATUS, encoding='utf-8')) if os.path.exists(STATUS) else {}
    only = [a for a in sys.argv[1:] if not a.startswith('--')]
    run_all = '--all' in sys.argv
    rows = inventory if run_all or not only else [r for r in inventory if r['id'] in set(only)]
    parsed = json.load(open(os.path.join(BUILD, 'parsed.json'), encoding='utf-8'))
    posts = {j['id']: j.get('posts') or [] for j in parsed['journals']}

    for r in rows:
        corpus = shingles(' '.join(p.get('text', '') for p in posts.get(r['id'], [])))
        missing = {}
        checked = pages = 0
        pdfs = walk_pdfs(r['dirs'])
        for f in pdfs:
            try:
                doc = fitz.open(f)
            except Exception:
                continue
            for pno, page in enumerate(doc):
                pages += 1
                for y, text in candidates(page):
                    checked += 1
                    if has_window(corpus, text):
                        continue
                    key = words(text)
                    if key not in missing:
                        missing[key] = {
                            'file': os.path.basename(f), 'page': pno + 1,
                            'y': round(y, 1), 'text': text[:200],
                        }
            doc.close()
        status[r['id']] = {
            'pages': pages, 'checked': checked, 'missing': len(missing),
            'examples': list(missing.values())[:12],
            'testedAt': __import__('datetime').datetime.now().isoformat(timespec='seconds'),
        }
        print(f"{r['id']}: pdf={len(pdfs)} pages={pages} checked={checked} missing={len(missing)}", flush=True)
        open(STATUS, 'w', encoding='utf-8').write(json.dumps(status, ensure_ascii=False, indent=1))
    print('status written', STATUS)


if __name__ == '__main__':
    main()
