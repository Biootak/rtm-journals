#!/usr/bin/env python3
"""Parallel per-PDF header test for the heavy H S Trading Journal source."""
import json
import os
import re
import sys
from multiprocessing import Pool

import fitz

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BUILD = os.path.join(ROOT, '_build')
INV = os.path.join(ROOT, '_build', 'expert', 'pdf-inventory.json')
OUT = os.path.join(ROOT, '_build', 'expert', 'status-hs.json')

LEGAL = re.compile(r'cookie|copyright|educational purposes|web ?site uses|website is started|read the market|all rights reserved|terms|privacy', re.I)
CHROME = re.compile(r'^(?:\d+/\d+/\d+|home|education|forum|more|logout|index|recent topics|new topic|no replies|my topics|welcome,?.*|last login:.*|forum members.*|journals|reply topic|favorite|page:.*|topic:.*|readthemarket\.com|the only school.*|quick reply|reply|quote|thank you|posts:.*|thank you received:.*|the following user\(s\) said thank you.*|warning: spoiler.*|click to expand.*)$', re.I)
SIGNATURE = re.compile(r'chief cook|piece of truth|gently dig it out|random fakeouts|until we know for sure|never be satisfied|rabbi|posts:\s*\d+', re.I)
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


def run_file(args):
    path, corpus = args
    missing, checked, pages = {}, 0, 0
    try:
        doc = fitz.open(path)
        for pno, page in enumerate(doc):
            pages += 1
            for y, text in candidates(page):
                checked += 1
                if has_window(corpus, text):
                    continue
                key = words(text)
                if key not in missing:
                    missing[key] = {'file': os.path.basename(path), 'page': pno + 1, 'y': round(y, 1), 'text': text[:200]}
        doc.close()
    except Exception as e:
        return path, pages, checked, {}, str(e)
    return path, pages, checked, missing, ''


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else OUT
    inv = json.load(open(INV, encoding='utf-8'))
    r = [x for x in inv if x['id'] == 'hs'][0]
    parsed = json.load(open(os.path.join(BUILD, 'parsed.json'), encoding='utf-8'))
    j = [x for x in parsed['journals'] if x['id'] == 'hs'][0]
    corpus = shingles(' '.join(p.get('text', '') for p in j['posts']))
    files = []
    for d in r['dirs']:
        base = d if os.path.isabs(d) else os.path.join(ROOT, d)
        for root, _, fs in os.walk(base):
            files += [os.path.join(root, f) for f in fs if f.lower().endswith('.pdf')]
    files.sort()
    print('files', len(files), 'pages', r['pages'], flush=True)

    agg = {'pages': 0, 'checked': 0, 'missing': 0, 'examples': [], 'testedAt': __import__('datetime').datetime.now().isoformat(timespec='seconds')}
    seen = {}
    with Pool(8) as pool:
        for path, pages, checked, missing, err in pool.imap_unordered(run_file, [(p, corpus) for p in files]):
            agg['pages'] += pages
            agg['checked'] += checked
            for k, v in missing.items():
                if k not in seen:
                    seen[k] = v
                    agg['examples'].append(v)
                    agg['missing'] += 1
            print(f"{os.path.basename(path)}: pages={pages} checked={checked} missing={len(missing)} {'ERR '+err if err else ''}", flush=True)
    agg['examples'] = agg['examples'][:20]
    json.dump({'hs': agg}, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('status written', out, 'missing', agg['missing'], flush=True)


if __name__ == '__main__':
    main()
