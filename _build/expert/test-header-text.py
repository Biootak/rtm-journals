#!/usr/bin/env python3
"""Check whether body lines printed at the top of each PDF page survived import.

The print repeats the site chrome at y~42 and the author card down to y~160.
Body text is 12 pt.  For every PDF page we take the topmost body-looking lines
in the page's upper zone and look for a five-word window of each line in the
journal's parsed text.  A line with no window is a candidate loss: the text is
in the PDF's text layer but not in the corpus.  This is a diagnostic, not a
repair; it writes a Markdown report with concrete examples.
"""
import json
import os
import re
import sys

import fitz

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BUILD = os.path.join(ROOT, '_build')
OUT = os.path.join(ROOT, '_build', 'expert', 'header-text-report.md')

JOURNALS = [
    ('drswing', 'Dr Swing'),
    ('kruger', 'Kruger'),
    ('frosty', 'frosty igloo'),
    ('mertch', 'Mertch'),
    ('michal238', 'Michal'),
]

CHROME = re.compile(
    r'^(?:\d+/\d+/\d+|home|education|forum|more|logout|index|recent topics|'
    r'new topic|no replies|my topics|welcome,?.*|last login:.*|logout|'
    r'forum members.*|journals|reply topic|favorite|page:.*|topic:.*|'
    r'readthemarket\.com|the only school.*|quick reply|reply|quote|thank you|'
    r'posts:.*|thank you received:.*|the following user\(s\) said thank you.*|'
    r'drs?wing on course.*|klik.*)$', re.I)
URL = re.compile(r'https?://|readthemarket\.com/index\.php')


def words(s):
    return re.sub(r'[^a-z0-9]+', ' ', str(s).lower()).strip()


def has_window(corpus, text, n=5):
    w = words(text).split()
    if len(w) < n:
        return True
    for i in range(len(w) - n + 1):
        if ' ' + ' '.join(w[i:i + n]) + ' ' in corpus:
            return True
    return False


def body_lines(page):
    rows = []
    seen = set()
    for b in page.get_text('dict')['blocks']:
        for line in b.get('lines', []):
            spans = [s for s in line['spans'] if s['text'].strip()]
            if not spans:
                continue
            text = ''.join(s['text'] for s in spans).strip()
            size = max(s['size'] for s in spans)
            y = line['bbox'][1]
            x = line['bbox'][0]
            key = (round(y, 1), text)
            if key in seen:
                continue
            seen.add(key)
            if not (11.4 <= size <= 13.0):
                continue
            if y < 60 or y > 300:
                continue
            if x < 55 or x > 600:
                continue
            if len(text) < 25:
                continue
            if CHROME.match(text) or URL.search(text):
                continue
            if text.startswith('The following user'):
                continue
            rows.append((y, text))
    rows.sort()
    return rows


def main():
    parsed = json.load(open(os.path.join(BUILD, 'parsed.json'), encoding='utf-8'))
    journals = {j['id']: j for j in parsed['journals']}
    report = ['# Header text survival report', '',
              'Lines in the PDF text layer that have no five-word window in the parsed corpus.',
              '']
    total_pages = total_lines = total_missing = 0
    for jid, folder in JOURNALS:
        j = journals.get(jid)
        fdir = os.path.join(ROOT, folder)
        if not j or not os.path.isdir(fdir):
            report.append(f'## {jid}\n\njournal or folder missing ({folder})\n')
            continue
        corpus = ' ' + words(' '.join(p.get('text', '') for p in j.get('posts', []))) + ' '
        pdfs = sorted(f for f in os.listdir(fdir) if f.lower().endswith('.pdf'))
        missing = []
        pages = lines = 0
        for fn in pdfs:
            doc = fitz.open(os.path.join(fdir, fn))
            for pno, page in enumerate(doc):
                pages += 1
                tops = body_lines(page)[:4]
                lines += len(tops)
                for y, text in tops:
                    if not has_window(corpus, text):
                        missing.append((fn, pno + 1, round(y, 1), text))
            doc.close()
        total_pages += pages
        total_lines += lines
        total_missing += len(missing)
        report.append(f'## {jid} — {folder}')
        report.append('')
        report.append(f'- PDFs: {len(pdfs)}, pages: {pages}, top body lines checked: {lines}')
        report.append(f'- lines absent from parsed text: **{len(missing)}**')
        report.append('')
        for fn, pno, y, text in missing[:12]:
            report.append(f'- `{fn}` p{pno} y={y}: {text[:150]}')
        if len(missing) > 12:
            report.append(f'- … and {len(missing) - 12} more')
        report.append('')
        print(f'{jid}: pages={pages} checked={lines} missing={len(missing)}')
    report.insert(4, f'Checked **{total_pages} pages**, {total_lines} top lines; '
                     f'**{total_missing}** absent.\n')
    open(OUT, 'w', encoding='utf-8').write('\n'.join(report) + '\n')
    print('wrote', OUT)


if __name__ == '__main__':
    main()
