#!/usr/bin/env python3
"""Second pass: only the top strip of each printed page (y<=115), where the
fixed site header overlaps the body.  Legal boilerplate, signatures and custom
titles are filtered out so the report contains body lines only."""
import json
import os
import re
import sys

import fitz

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BUILD = os.path.join(ROOT, '_build')
OUT = os.path.join(ROOT, '_build', 'expert', 'header-text-top.md')

JOURNALS = [
    ('drswing', 'Dr Swing'),
    ('kruger', 'Kruger'),
    ('frosty', 'frosty igloo'),
    ('mertch', 'Mertch'),
    ('michal238', 'Michal'),
]

LEGAL = re.compile(
    r'cookie|copyright|educational purposes|web ?site uses|website is started|'
    r'read the market|all rights reserved|terms|privacy', re.I)
CHROME = re.compile(
    r'^(?:\d+/\d+/\d+|home|education|forum|more|logout|index|recent topics|'
    r'new topic|no replies|my topics|welcome,?.*|last login:.*|'
    r'forum members.*|journals|reply topic|favorite|page:.*|topic:.*|'
    r'readthemarket\.com|the only school.*|quick reply|reply|quote|thank you|'
    r'posts:.*|thank you received:.*|the following user\(s\) said thank you.*)$', re.I)
SIGNATURE = re.compile(
    r'chief cook|piece of truth|gently dig it out|random fakeouts|'
    r'until we know for sure|never be satisfied|rabbi|'
    r'^\W*[\w\s,]{0,30}posts:\s*\d+', re.I)
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
        if text.startswith('The following user'):
            continue
        out.append((y, text))
    return out


def main():
    parsed = json.load(open(os.path.join(BUILD, 'parsed.json'), encoding='utf-8'))
    journals = {j['id']: j for j in parsed['journals']}
    only = set(sys.argv[1:])
    report = ['# Top-strip text survival (y <= 115)', '',
              'Body-looking lines in the header band that have no five-word window in the parsed corpus.', '']
    grand = 0
    for jid, folder in JOURNALS:
        if only and jid not in only:
            continue
        j = journals.get(jid)
        fdir = os.path.join(ROOT, folder)
        if not j or not os.path.isdir(fdir):
            report.append(f'## {jid}\n\nmissing journal/folder\n')
            continue
        corpus = shingles(' '.join(p.get('text', '') for p in j.get('posts', [])))
        missing, pages, checked = [], 0, 0
        for fn in sorted(f for f in os.listdir(fdir) if f.lower().endswith('.pdf')):
            doc = fitz.open(os.path.join(fdir, fn))
            for pno, page in enumerate(doc):
                pages += 1
                rows = page_lines(page)
                cands = candidates(page)
                checked += len(cands)
                for y, text in cands:
                    if has_window(corpus, text):
                        continue
                    after = [t for yy, xx, sz, t in rows if yy > y][:2]
                    missing.append((fn, pno + 1, round(y, 1), text, after))
            doc.close()
        grand += len(missing)
        report.append(f'## {jid} — {folder}')
        report.append(f'\n- pages: {pages}; top-strip candidates: {checked}; absent: **{len(missing)}**\n')
        for fn, pno, y, text, after in missing:
            report.append(f'- `{fn}` p{pno} y={y}: {text[:160]}')
            for a in after:
                report.append(f'  - next: {a[:120]}')
        report.append('')
        print(f'{jid}: pages={pages} candidates={checked} missing={len(missing)}')
    report.insert(4, f'Total absent top-strip lines: **{grand}**.\n')
    open(OUT, 'w', encoding='utf-8').write('\n'.join(report) + '\n')
    print('wrote', OUT)


if __name__ == '__main__':
    main()
