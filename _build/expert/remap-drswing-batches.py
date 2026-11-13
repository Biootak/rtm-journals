#!/usr/bin/env python
"""Re-key drswing translation batches after the rank/date re-import.

The re-import cleaned post texts (attachment chrome stripped, hidden lines
recovered), so every post hash changed and the 481 existing batches went
stale. Post ids are stable (`<jid>_p<page>_<N>`), so this pairs each old
work-file hash with the new one via id and rewrites the batch keys.

Posts whose English text changed materially are listed for re-translation;
their old Persian is carried over only when the texts match after
whitespace normalisation (chrome-only diffs).

  python _build/expert/remap-drswing-batches.py          # report
  python _build/expert/remap-drswing-batches.py --write  # apply
"""
import glob
import hashlib
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WORK = os.path.join(ROOT, '_build', 'expert', 'work')
OLD_WORK = os.path.join(ROOT, '_build', 'expert', 'work-drswing-old')
BATCH = os.path.join(ROOT, '_build', 'expert', 'batches')
PARSED = os.path.join(ROOT, '_build', 'parsed.json')
WRITE = '--write' in sys.argv
JID = 'drswing'


def norm(s):
    return re.sub(r'\s+', ' ', s or '').strip()


def main():
    parsed = json.load(open(PARSED, encoding='utf-8'))
    journal = next(j for j in parsed['journals'] if j['id'] == JID)
    cur = {p['id']: p for p in journal['posts']}

    # old work files were moved aside before regeneration; fall back to the
    # live ones if the move has not happened yet
    old_dir = OLD_WORK if os.path.isdir(OLD_WORK) else WORK

    # old-hash -> new-hash, per post id; and flag real text changes
    id_map = {}
    changed = []
    for f in sorted(glob.glob(os.path.join(old_dir, JID + '-p*.json'))):
        page = os.path.basename(f)[:-5]
        try:
            new_posts = {p['id']: p for p in json.load(open(os.path.join(WORK, page + '.json'), encoding='utf-8'))}
        except OSError:
            continue
        for p in json.load(open(f, encoding='utf-8')):
            np = new_posts.get(p['id']) or cur.get(p['id'])
            if not np:
                continue
            new_hash = hashlib.sha1(np['text'].encode('utf-8')).hexdigest()
            id_map[p['hash']] = new_hash
            if norm(p['text']) != norm(np['text']):
                changed.append(p['id'])

    report = {'mapped': 0, 'missing_old': 0, 'real_changed': sorted(set(changed))}
    batches = sorted(glob.glob(os.path.join(BATCH, JID + '-p*.json')))
    for bf in batches:
        batch = json.load(open(bf, encoding='utf-8'))
        out = {}
        for old_h, fa in batch.items():
            new_h = id_map.get(old_h)
            if not new_h:
                report['missing_old'] += 1
                continue
            out[new_h] = fa
            report['mapped'] += 1
        name = os.path.basename(bf)
        if WRITE:
            with open(bf, 'w', encoding='utf-8') as fh:
                json.dump(out, fh, ensure_ascii=False)
        print(name, len(batch), '->', len(out))

    print('mapped', report['mapped'], 'unmapped', report['missing_old'],
          'posts with real text changes:', len(report['real_changed']))
    for pid in report['real_changed'][:30]:
        print('  changed:', pid)
    if WRITE:
        print('batches rewritten')


if __name__ == '__main__':
    main()
