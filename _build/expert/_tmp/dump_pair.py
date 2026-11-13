import json, sys, os
base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
page = sys.argv[1]
work = json.load(open(os.path.join(base,'work',page+'.json'),encoding='utf-8'))
batch = json.load(open(os.path.join(base,'batches',page+'.json'),encoding='utf-8'))
for p in work:
    h = p['hash']
    fa = batch.get(h,'<MISSING>')
    print('='*20, page, p['id'], p.get('author',''))
    print('--- EN ---')
    print(p['text'])
    print('--- FA ---')
    print(fa)
