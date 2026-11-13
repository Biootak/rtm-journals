#!/usr/bin/env python3
"""Inventory every parsed journal that has a PDF print source.

Writes _build/expert/pdf-inventory.json with the PDF folders, file count and
page count.  A journal's parsed dir can be HTML-only while its PDFs sit in a
separate drop folder, so a small alias map covers those.
"""
import json
import os
import re

import fitz

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BUILD = os.path.join(ROOT, '_build')
OUT = os.path.join(ROOT, '_build', 'expert', 'pdf-inventory.json')

EXTRA = {
    'mertch': ['Mertch'],
    'michal238': ['Michal'],
}


def walk_files(d):
    out = []
    for base, _, files in os.walk(d):
        for f in files:
            out.append(os.path.join(base, f))
    return out


def main():
    parsed = json.load(open(os.path.join(BUILD, 'parsed.json'), encoding='utf-8'))
    rows = []
    for j in parsed['journals']:
        dirs = []
        d = j.get('dir') or ''
        if d and not os.path.isabs(d):
            d = os.path.join(ROOT, d)
        if d and os.path.isdir(d):
            dirs.append(d)
        for extra in EXTRA.get(j['id'], []):
            p = os.path.join(ROOT, extra)
            if os.path.isdir(p) and p not in dirs:
                dirs.append(p)
        pdfs = []
        for d in dirs:
            pdfs += [f for f in walk_files(d) if f.lower().endswith('.pdf')]
        if not pdfs:
            continue
        pages = 0
        for f in pdfs:
            try:
                with fitz.open(f) as doc:
                    pages += doc.page_count
            except Exception:
                pass
        rows.append({
            'id': j['id'], 'name': j['name'], 'posts': len(j.get('posts') or []),
            'pdfCount': len(pdfs), 'pages': pages,
            'dirs': [os.path.relpath(x, ROOT).replace(os.sep, '/') for x in dirs],
        })
    rows.sort(key=lambda r: (r['pdfCount'], r['pages'], r['posts']))
    open(OUT, 'w', encoding='utf-8').write(json.dumps(rows, ensure_ascii=False, indent=1))
    print('journals with PDF', len(rows), 'files', sum(r['pdfCount'] for r in rows), 'pages', sum(r['pages'] for r in rows))
    for r in rows[:15]:
        print(f"  {r['pdfCount']:3} pdf {r['pages']:5} p  {r['id']}  {r['name']}")


if __name__ == '__main__':
    main()
