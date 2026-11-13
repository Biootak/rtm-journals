import json, sys, os, re
base = r"E:/Trade/journals/_build/expert"
def show(batchpath):
    b = os.path.basename(batchpath)
    m = re.match(r'(.+)-p(\d+)\.json', b)
    j, p = m.group(1), m.group(2)
    wf = os.path.join(base, 'work', f'{j}-p{p}.json')
    batch = json.load(open(batchpath, encoding='utf-8'))
    posts = json.load(open(wf, encoding='utf-8')) if os.path.exists(wf) else []
    print(f"########## FILE {b} ({len(posts)} posts) ##########")
    for i, post in enumerate(posts):
        h = post['hash']
        fa = batch.get(h, '<<MISSING>>')
        print(f"=== [{i}] {post.get('author','')} hash={h} ===")
        print("EN:", post['text'].replace('\n',' | '))
        print("FA:", fa.replace('\n',' | '))
        print()
for a in sys.argv[1:]:
    show(a)
