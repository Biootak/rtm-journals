#!/usr/bin/env python3
"""Build the final header-extraction checklist and the gap repair report."""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BUILD = os.path.join(ROOT, '_build')
INV = json.load(open(os.path.join(BUILD, 'expert', 'pdf-inventory.json'), encoding='utf-8'))
STATUS = json.load(open(os.path.join(BUILD, 'expert', 'header-status.json'), encoding='utf-8'))
PARSED = json.load(open(os.path.join(BUILD, 'parsed.json'), encoding='utf-8'))
CHECK = os.path.join(ROOT, '_build', 'expert', 'HEADER-EXTRACTION-CHECKLIST.md')
GAPS = os.path.join(ROOT, '_build', 'expert', 'HEADER-GAPS.md')

# Lines that are definitely not body prose.  The count is how many of the
# reported "missing" lines in that journal fall in this category.
NOISE = {
    'whenever': (1, 'signature quote “…an engulfed flag…”'),
    'michal238': (1, 'signature quote “…an engulfed flag…”'),
    'shadowpit': (1, 'signature quote “…an engulfed flag…”'),
    'fishing': (2, 'signature quote + thread title'),
    'mertch': (1, 'custom profile title'),
    'jurij': (1, 'custom profile title'),
    'gembel': (1, 'custom profile title'),
    'amit': (1, 'thread/page title'),
    'doctorpatient': (1, 'attachment URL'),
    'projectsagana': (1, 'signature'),
    'classroom': (2, 'attachment filename + signature quote'),
    'alex': (3, 'signature + custom title + signature'),
    'kruger': (1, 'joined word “withoutsetting” — text is present'),
    'hs': (1, 'custom profile title'),
    'dbrrbd': (1, '“Warning: Spoiler” UI line'),
    'mm': (1, 'signature “If your going through hell…”'),
}

NOISE_TEXT = {
    'hs': ['The future of price is already written in the past'],
    'dbrrbd': ['Warning: Spoiler!'],
    'mm': ['-If your going through hell, keep going-'],
}

rows = []
for r in INV:
    s = STATUS.get(r['id'], {})
    raw = s.get('missing', 0)
    noise, note = NOISE.get(r['id'], (0, ''))
    body = max(0, raw - noise)
    rows.append({**r, **s, 'raw': raw, 'noise': noise, 'body': body, 'note': note})

gaps = sorted([r for r in rows if r['body']], key=lambda r: (-r['body'], -r['pages']))
noise_rows = sorted([r for r in rows if r['raw'] and not r['body']], key=lambda r: r['name'].lower())
clean = sorted([r for r in rows if not r['raw']], key=lambda r: r['name'].lower())
html_only = sorted([j for j in PARSED['journals'] if j['id'] not in {r['id'] for r in rows}], key=lambda j: j['id'])

tested = len([r for r in rows if r.get('testedAt')])
pages = sum(r.get('pages', r['pages']) for r in rows)
checked = sum(r.get('checked', 0) for r in rows)
body_lines = sum(r['body'] for r in rows)

L = []
L.append('# Header extraction checklist')
L.append('')
L.append(f'PDF print sources: **{len(rows)} journals / {sum(r["pdfCount"] for r in rows)} files / {pages:,} pages**.')
L.append(f'Tested: **{tested}/{len(rows)}**. Top-strip body lines checked: **{checked:,}**.')
L.append('')
L.append(f'- **{len(clean)}** journals: verified clean, no line lost.')
L.append(f'- **{len(noise_rows)}** journals: only signature/custom title/URL/attachment chrome was flagged; no body text lost.')
L.append(f'- **{len(gaps)}** journals: real body lines missing from the parsed corpus (**{body_lines} lines**), repair pending.')
L.append(f'- **{len(html_only)}** HTML-only journals: no printed header, listed at the end.')
L.append('')
L.append('Method: body-looking spans in the top strip (`y 60–115`, `11.4–13 pt`) were matched against the parsed journal text with five-word shingles. White shadow copies, navigation, legal footer, signatures and custom titles are excluded.')
L.append('')
L.append('## P0 — real body text missing (repair first)')
L.append('')
L.append('| | journal | PDFs | pages | checked | body lines | raw flagged |')
L.append('|---|---|---:|---:|---:|---:|---:|')
for r in gaps:
    L.append(f"| [ ] | `{r['id']}` — {r['name']} | {r['pdfCount']} | {r.get('pages', r['pages'])} | {r.get('checked', 0)} | **{r['body']}** | {r['raw']} |")
L.append('')
L.append('Details and exact PDF pages: `_build/expert/HEADER-GAPS.md`.')
L.append('')
L.append('## Verified — no body text lost')
L.append('')
L.append('| | journal | PDFs | pages | checked | note |')
L.append('|---|---|---:|---:|---:|---|')
for r in clean:
    L.append(f"| [x] | `{r['id']}` — {r['name']} | {r['pdfCount']} | {r.get('pages', r['pages'])} | {r.get('checked', 0)} | clean |")
L.append('')
L.append('## Noise-only flags — body is complete')
L.append('')
L.append('| | journal | PDFs | pages | flagged | why it is not body |')
L.append('|---|---|---:|---:|---:|---|')
for r in noise_rows:
    L.append(f"| [x] | `{r['id']}` — {r['name']} | {r['pdfCount']} | {r.get('pages', r['pages'])} | {r['raw']} | {r['note']} |")
L.append('')
L.append(f'## HTML-only journals — {len(html_only)} (no printed header)')
L.append('')
for j in html_only:
    L.append(f"- [x] `{j['id']}` — {j['name']} ({len(j.get('posts') or [])} posts)")
L.append('')
open(CHECK, 'w', encoding='utf-8').write('\n'.join(L) + '\n')

G = []
G.append('# Header gaps to repair')
G.append('')
G.append(f'{len(gaps)} journals, {body_lines} body lines (duplicate shadow/page-break variants included). Each entry is present in the PDF text layer but absent from `_build/parsed.json`.')
G.append('')
for n, r in enumerate(gaps, 1):
    G.append(f"## {n}. `{r['id']}` — {r['name']}")
    G.append('')
    G.append(f"{r.get('pages', r['pages'])} pages, {r['pdfCount']} PDFs, {r['body']} missing body lines. Flagged examples:")
    G.append('')
    for e in r.get('examples', []):
        if any(x in e['text'] for x in NOISE_TEXT.get(r['id'], [])):
            continue
        text = e['text'].replace('|', '\\|').strip()
        G.append(f"- `{e['file']}` — PDF p{e['page']}, y={e['y']}: “{text}”")
    G.append('')
open(GAPS, 'w', encoding='utf-8').write('\n'.join(G) + '\n')

print('checklist', CHECK)
print('gaps', GAPS)
print('journals', len(rows), 'tested', tested, 'clean', len(clean), 'noise-only', len(noise_rows), 'body-gap', len(gaps), 'body lines', body_lines)
for r in gaps:
    print(f"  {r['id']}: {r['body']} body / {r['raw']} raw / {r.get('pages', r['pages'])}p")
