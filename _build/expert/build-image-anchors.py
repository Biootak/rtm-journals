#!/usr/bin/env python3
"""Derive print-order image anchors for every parsed post.

For each print PDF we rebuild the post blocks exactly as the importer does:
text blocks become paragraphs, image blocks remember how many paragraphs came
before them.  The result is an array parallel to `post['images']`, so the
reader can put each chart back between the paragraphs where it was printed.

This script only writes a report; `--apply` copies compatible anchors into
`_build/parsed.json` as `post['ib']`.  Image-count mismatches are skipped, never
guessed.

Usage:
  python _build/expert/build-image-anchors.py [journal ...]
  python _build/expert/build-image-anchors.py --all
  python _build/expert/build-image-anchors.py --all --apply
"""
import glob
import importlib.util
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BUILD = os.path.join(ROOT, '_build')
OUT = os.path.join(ROOT, '_build', 'expert', 'image-anchors.json')
PARSED = os.path.join(BUILD, 'parsed.json')
INV = os.path.join(ROOT, '_build', 'expert', 'pdf-inventory.json')

spec = importlib.util.spec_from_file_location('rtm_import', os.path.join(BUILD, 'import-drswing.py'))
imp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(imp)


def pdf_files(dirs, order=None, include_unnumbered=False):
    out = []
    extra = []
    for d in dirs:
        base = d if os.path.isabs(d) else os.path.join(ROOT, d)
        for f in glob.glob(os.path.join(base, '*.pdf')):
            name = os.path.basename(f)
            m = re.search(r'Page\s+(\d+)', name)
            if m:
                out.append((int(m.group(1)), f))
            else:
                extra.append(f)
    # Journals whose prints are a single PDF (or numbered 1.pdf..N.pdf) carry no
    # "Page N" in the name. pageNum is the slot the importer gave the file, so
    # order by the journal's pageFiles list, not by filename digits.
    if not out:
        rank = {n: i for i, n in enumerate(order or [])}
        for d in dirs:
            base = d if os.path.isabs(d) else os.path.join(ROOT, d)
            files = sorted(glob.glob(os.path.join(base, '*.pdf')),
                           key=lambda f: (rank.get(os.path.basename(f), 1 << 30),
                                          os.path.basename(f)))
            for i, f in enumerate(files, 1):
                out.append((i, f))
    if include_unnumbered:
        # Prints with no "Page N" still hold posts (frosty's first page is a
        # bare "<journal> - RTM Community.pdf"); give them slots past the end.
        have = {os.path.abspath(f) for _, f in out}
        top = max((n for n, _ in out), default=0)
        i = 0
        for f in sorted(extra):
            if os.path.abspath(f) in have:
                continue
            i += 1
            out.append((top + i, f))
    return sorted(out)


def paragraph_count(text):
    return len([p for p in re.split(r'\n{2,}', str(text or '')) if p.strip()])


def main():
    inventory = json.load(open(INV, encoding='utf-8'))
    parsed = json.load(open(PARSED, encoding='utf-8'))
    by_journal = {j['id']: j for j in parsed['journals']}
    only = {a for a in sys.argv[1:] if not a.startswith('--')}
    run_all = '--all' in sys.argv
    apply = '--apply' in sys.argv
    anchors = json.load(open(OUT, encoding='utf-8')) if os.path.exists(OUT) else {}
    stats_all = {}

    rows = [r for r in inventory if run_all or not only or r['id'] in only]
    for r in rows:
        jid = r['id']
        if jid not in by_journal:
            continue
        if jid in anchors and '--force' not in sys.argv:
            continue
        posts = by_journal[jid]['posts']
        has_mid = any(p.get('mid') is not None for p in posts)
        files = pdf_files(r['dirs'], (by_journal.get(jid) or {}).get('pageFiles'),
                          include_unnumbered=not has_mid)
        if not files:
            continue
        pages = imp.collect(files)
        # Forum post numbers are unique across the whole thread, and some
        # topics were imported with renumbered pageNums (empty cover pages
        # shift every index), so match on `mid` alone.
        by_mid = {}
        for p in posts:
            m = p.get('mid')
            if m is None:
                continue
            by_mid.setdefault(m, []).append(p)
        jout, stats = {}, {'posts': 0, 'withImages': 0, 'anchored': 0,
                           'imageMismatch': 0, 'paragraphMismatch': 0, 'missingPost': 0}

        def scan(post):
            """Plate paragraph positions inside one collected post."""
            blocks = imp.build_text(post['content'])
            paras = 0
            after = []
            seen_xref = set()
            for block in blocks:
                if block['type'] == 'text':
                    paras += 1
                    continue
                item = block['item']
                disp = item.get('disp') or (0, 0)
                # Printed cards and tracking pixels are tiny; a plate is not.
                if max(disp) < 80:
                    continue
                xref = item.get('xref')
                if xref in seen_xref:
                    continue
                seen_xref.add(xref)
                after.append(paras)
            return after, paras, blocks

        if has_mid:
            for page in pages:
                for post in page['posts']:
                    stats['posts'] += 1
                    matches = by_mid.get(post['number'])
                    if not matches:
                        stats['missingPost'] += 1
                        continue
                    target = matches[0]
                    after, paras, _ = scan(post)
                    if not after:
                        continue
                    stats['withImages'] += 1
                    if len(after) != len(target.get('images') or []):
                        stats['imageMismatch'] += 1
                        continue
                    if paras != paragraph_count(target.get('text')):
                        stats['paragraphMismatch'] += 1
                        # Keep the geometry, but flag it in the report.
                    jout[target['id']] = after
                    stats['anchored'] += 1
        else:
            # Journals imported without forum numbers (mm, kruger, frosty):
            # filenames and pageNums cannot be trusted — 'Page 4' once held
            # forum page 2 — so pair posts by their text instead.
            def key_of(text):
                return re.sub(r'\s+', '', str(text or '')).lower()[:140]

            pdf_items = []
            for page in pages:
                for post in page['posts']:
                    stats['posts'] += 1
                    after, paras, blocks = scan(post)
                    if not after:
                        continue
                    body = ' '.join(' '.join(l['text'] for l in b['lines'])
                                    for b in blocks if b['type'] == 'text')
                    pdf_items.append({'key': key_of(body), 'after': after,
                                      'paras': paras, 'num': post['number']})
            pmap = {}
            for p in posts:
                pmap.setdefault(key_of(p.get('text')), []).append(p)
            pdf_keys = {}
            for it in pdf_items:
                pdf_keys[it['key']] = pdf_keys.get(it['key'], 0) + 1
            for it in pdf_items:
                if not it['key'] or pdf_keys[it['key']] != 1:
                    continue
                cands = pmap.get(it['key']) or []
                live = [c for c in cands
                        if not c.get('id') or c['id'] not in jout]
                if len(live) != 1:
                    continue
                target = live[0]
                stats['withImages'] += 1
                if len(it['after']) != len(target.get('images') or []):
                    stats['imageMismatch'] += 1
                    continue
                # These journals were imported by a different parser, so a
                # paragraph-count gap means the block indexes drift; only
                # anchor the posts whose segmentation agrees exactly.
                if it['paras'] != paragraph_count(target.get('text')):
                    stats['paragraphMismatch'] += 1
                    continue
                jout[target['id']] = it['after']
                stats['anchored'] += 1
            stats['missingPost'] = (len(pdf_items) - stats['anchored']
                                    - stats['imageMismatch'])
        anchors[jid] = {'anchors': jout, 'stats': stats}
        stats_all[jid] = stats
        print(f"{jid}: posts={stats['posts']} withImages={stats['withImages']} "
              f"anchored={stats['anchored']} imgMismatch={stats['imageMismatch']} "
              f"paraMismatch={stats['paragraphMismatch']} missing={stats['missingPost']}",
              flush=True)
        open(OUT, 'w', encoding='utf-8').write(json.dumps(anchors, ensure_ascii=False, indent=1))

    if apply:
        changed = 0
        for jid, row in anchors.items():
            journal = by_journal.get(jid)
            if not journal or not row.get('anchors'):
                continue
            by_id = {p['id']: p for p in journal['posts']}
            # Anchors are regenerated wholesale; drop stale ib values on posts
            # this run no longer anchors so they cannot drift out of sync.
            for post in journal['posts']:
                post.pop('ib', None)
            for pid, arr in row['anchors'].items():
                post = by_id.get(pid)
                if not post:
                    continue
                if len(arr) != len(post.get('images') or []):
                    continue
                limit = paragraph_count(post.get('text'))
                post['ib'] = [min(max(0, int(a)), limit) for a in arr]
                changed += 1
        open(PARSED, 'w', encoding='utf-8').write(json.dumps(parsed, ensure_ascii=False))
        print('applied', changed, 'posts')

    print('report written', OUT)


if __name__ == '__main__':
    main()
