import json, sys, os
page = sys.argv[1]  # e.g. shadowpit-p4
work = f"E:/Trade/journals/_build/expert/work/{page}.json"
src = f"E:/Trade/journals/_build/expert/scratch/{page}.py"
out = f"E:/Trade/journals/_build/expert/batches/{page}.json"
ns = {}
exec(open(src, encoding='utf8').read(), ns)
T = ns['T']  # dict id -> persian text with \n
posts = json.load(open(work, encoding='utf8'))
batch = {}
missing = []
for p in posts:
    pid = p['id']
    if pid not in T:
        missing.append(pid); continue
    batch[p['hash']] = T[pid]
if missing:
    print("MISSING:", missing); sys.exit(1)
# verify unique hashes count
assert len(batch) == len(set(p['hash'] for p in posts))
json.dump(batch, open(out, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print(page, "posts:", len(posts), "unique:", len(batch), "->", out)
