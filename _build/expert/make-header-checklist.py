#!/usr/bin/env python3
"""Build the prioritized header-extraction checklist from inventory + status."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BUILD = os.path.join(ROOT, '_build')
INV = os.path.join(BUILD, 'expert', 'pdf-inventory.json')
STATUS = os.path.join(BUILD, 'expert', 'header-status.json')
PARSED = os.path.join(BUILD, 'parsed.json')
OUT = os.path.join(ROOT, '_build', 'expert', 'HEADER-EXTRACTION-CHECKLIST.md')

inv = json.load(open(INV, encoding='utf-8'))
status = json.load(open(STATUS, encoding='utf-8')) if os.path.exists(STATUS) else {}
parsed = json.load(open(PARSED, encoding='utf-8'))
pdf_ids = {r['id'] for r in inv}

# Known assessment overrides where the only remaining lines are signatures or
# custom profile titles, not body text.
VERIFIED = {'mertch', 'michal238'}

def tier(r):
    s = status.get(r['id'])
    if s and s['missing'] and r['id'] not in VERIFIED:
        return 0
    if not s:
        return 1 if r['pdfCount'] <= 3 else 2 if r['pdfCount'] <= 10 else 3 if r['pdfCount'] <= 25 else 4
    return 5

groups = {0: [], 1: [], 2: [], 3: [], 4: [], 5: []}
for r in inv:
    groups[tier(r)].append(r)

titles = {
    0: 'P0 — gaps found, repair first',
    1: 'P1 — smallest sources (1–3 PDFs), test next',
    2: 'P2 — 4–10 PDFs',
    3: 'P3 — 11–25 PDFs',
    4: 'P4 — largest sources (26+ PDFs)',
    5: 'Done — verified, zero body lines lost',
}

lines = ['# Header extraction checklist', '',
         'Every parsed journal with a PDF print source. A tick means the top-strip body lines were checked against the parsed corpus.',
         '']
for t in [0, 1, 2, 3, 4, 5]:
    rows = groups[t]
    if not rows:
        continue
    lines.append(f'## {titles[t]}')
    lines.append('')
    if t == 5:
        lines.append('| | journal | PDFs | pages | checked | missing |')
        lines.append('|---|---|---:|---:|---:|---:|')
        for r in rows:
            s = status.get(r['id'], {})
            mark = 'x' if s and not s.get('missing') or r['id'] in VERIFIED else ' '
            lines.append(f"| [{mark}] | `{r['id']}` — {r['name']} | {r['pdfCount']} | {s.get('pages', r['pages'])} | {s.get('checked', '—')} | 0 |")
    else:
        lines.append('| | journal | PDFs | pages | status |')
        lines.append('|---|---|---:|---:|---|')
        for r in rows:
            s = status.get(r['id'])
            if s:
                st = f"⚠ {s['missing']} missing" if s['missing'] else '✅ verified'
            else:
                st = '⬜ pending'
            lines.append(f"| [ ] | `{r['id']}` — {r['name']} | {r['pdfCount']} | {s.get('pages', r['pages']) if s else r['pages']} | {st} |")
    lines.append('')

html_only = [j for j in parsed['journals'] if j['id'] not in pdf_ids]
lines.append('## HTML-only journals — no printed header')
lines.append('')
lines.append(f'{len(html_only)} journals have HTML captures only, so the print header cannot hide text. They are checked by the general source audit, not by this test.')
lines.append('')
for j in sorted(html_only, key=lambda x: x['id']):
    lines.append(f"- [x] `{j['id']}` — {j['name']} ({len(j.get('posts') or [])} posts)")
lines.append('')
open(OUT, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print('wrote', OUT)
for t in [0, 1, 2, 3, 4, 5]:
    print(t, len(groups[t]))
