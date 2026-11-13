#!/usr/bin/env python3
"""Rebuild one printed post from its PDF by marker range and body column."""
import json
import os
import re
import sys
from collections import Counter

import fitz

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
INV = json.load(open(os.path.join(ROOT, '_build', 'expert', 'pdf-inventory.json'), encoding='utf-8'))
MARK = re.compile(r'^#(\d+)$')
CHROME = re.compile(
    r'^(?:quick reply|reply|quote|thank you|home|education|forum|more|logout|'
    r'attachments?:|file name:|file size:|posts:|thank you received:|'
    r'offline|online|away|the following user\(s\) said thank you.*|'
    r'page:|contact us|faq|rtm fund|our trades|website privacy policy|'
    r'about cookies|copyright.*|privacy policy|terms of use|risk warning|'
    r'your privacy:.*|disclaimer:.*|powered by.*|.*wrote:)$', re.I)
RANK = re.compile(r'^(?:master trader|expert trader|senior trader|associate trader|trader|junior trader|student|newbie|moderator|administrator|fresh boarder|platinum boarder|gold boarder|expert boarder|senior boarder|junior boarder|boarder|guest)$', re.I)
DATE = re.compile(r'^\d{1,2}\s+[A-Z][a-z]{2}\s+\d{4}(?:\s+\d{1,2}:\d{2})?$')
LEGAL = re.compile(r'(YOUR PRIVACY:|^DISCLAIMER:|^MORE INFORMATION$|Powered by Kunena)', re.I)


def find(jid, base):
    if os.path.exists(base):
        return base
    r = [x for x in INV if x['id'] == jid][0]
    for d in r['dirs']:
        p = d if os.path.isabs(d) else os.path.join(ROOT, d)
        for root, _, fs in os.walk(p):
            for f in fs:
                if f == base:
                    return os.path.join(root, f)
    raise FileNotFoundError(base)


def normalized(t):
    return re.sub(r'[^a-z0-9]+', ' ', t.lower()).strip()


def lines_of(doc):
    out = []
    for pno, page in enumerate(doc):
        for b in page.get_text('dict')['blocks']:
            for l in b.get('lines', []):
                spans = [s for s in l['spans'] if s['text'].strip()]
                if not spans:
                    continue
                text = ''.join(s['text'] for s in spans).strip()
                size = max(s['size'] for s in spans)
                x, y = l['bbox'][0], l['bbox'][1]
                out.append({'page': pno + 1, 'y': round(y, 1), 'x': round(x, 1), 'size': round(size, 1), 'text': text})
    return out


def body_column(lines):
    xs = Counter()
    for l in lines:
        if 11.4 <= l['size'] <= 12.6 and len(l['text']) >= 40 and l['x'] < 540 and not CHROME.match(l['text']):
            xs[round(l['x'])] += 1
    return xs.most_common(1)[0][0] if xs else 0


def extract(jid, base, number):
    doc = fitz.open(find(jid, base))
    lines = lines_of(doc)
    marks = [l for l in lines if MARK.fullmatch(l['text']) and l['size'] >= 10.5 and l['x'] > 450]
    start = next((l for l in marks if int(MARK.fullmatch(l['text']).group(1)) == number), None)
    if not start:
        raise SystemExit('marker not found: #%s (found %s)' % (number, [m['text'] for m in marks]))
    nxt = next((l for l in marks if (l['page'], l['y']) > (start['page'], start['y'])), None)
    chunk = [l for l in lines if (l['page'], l['y']) > (start['page'], start['y'] - 2)
             and (not nxt or (l['page'], l['y']) < (nxt['page'], nxt['y']))]
    bx = body_column([l for l in chunk if len(l['text']) >= 30])
    raw = []
    for l in chunk:
        if not (11.4 <= l['size'] <= 12.6):
            continue
        if not (bx - 3 <= l['x'] <= bx + 45):
            continue
        t = l['text']
        if CHROME.match(t) or RANK.match(t) or DATE.match(t) or LEGAL.search(t):
            continue
        if len(t) < 2:
            continue
        raw.append(l)
    # Shadow copies print the same line at the same y with slightly different
    # spans; keep the longest copy for each printed line.
    buckets = {}
    for l in raw:
        key = (l['page'], round(l['y'] / 2))
        buckets.setdefault(key, []).append(l)
    kept = []
    for group in buckets.values():
        group.sort(key=lambda l: len(l['text']), reverse=True)
        kept.append(group[0])
    kept.sort(key=lambda l: (l['page'], l['y']))
    # A shadow/quote copy can print the same sentence a few points lower with
    # one fragment missing; keep the fuller line when one contains the other.
    dedup = []
    for l in kept:
        if dedup and l['page'] == dedup[-1]['page'] and l['y'] - dedup[-1]['y'] < 34:
            a, b = normalized(dedup[-1]['text']), normalized(l['text'])
            if a and b and (a in b or b in a):
                if len(b) > len(a):
                    dedup[-1] = l
                continue
        dedup.append(l)
    kept = dedup
    paras, cur, prev = [], [], None
    for l in kept:
        if prev and (l['page'] != prev['page'] or l['y'] - prev['y'] > 26):
            if cur:
                paras.append(' '.join(cur))
            cur = []
        cur.append(l['text'])
        prev = l
    if cur:
        paras.append(' '.join(cur))
    clean = []
    for p in paras:
        n = normalized(p)
        if n and not any(n in normalized(q) or normalized(q) in n for q in clean):
            clean.append(p)
    doc.close()
    return bx, clean


if __name__ == '__main__':
    jid, base, num = sys.argv[1], sys.argv[2], int(sys.argv[3])
    bx, paras = extract(jid, base, num)
    print('body column', bx, 'paragraphs', len(paras))
    print('\n\n'.join(paras))
