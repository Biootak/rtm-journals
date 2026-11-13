import json, sys
# usage: python fix_kai.py <page> <fixes.json>
# fixes.json: {"<hash>": {"old substring": "new substring", ...}, ...}
page = sys.argv[1]
fixes = json.load(open(sys.argv[2], encoding='utf-8'))
path = f'batches/if-p{page}.json'
d = json.load(open(path, encoding='utf-8'))
for h, subs in fixes.items():
    if h not in d:
        print('MISSING HASH', h); continue
    v = d[h]
    for old, new in subs.items():
        if old not in v:
            print('NOT FOUND in', h[:8], ':', old.encode('unicode_escape').decode()[:80]); continue
        v = v.replace(old, new)
    d[h] = v
json.dump(d, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('done', page)
