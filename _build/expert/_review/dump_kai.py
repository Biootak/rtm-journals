import json,sys,re
page=sys.argv[1]
work=json.load(open(f'work/if-p{page}.json',encoding='utf-8'))
batch=json.load(open(f'batches/if-p{page}.json',encoding='utf-8'))
def paras(t): return [p for p in re.split(r'\n\s*\n',t) if p.strip()]
out=[]
for p in work:
    fa=batch.get(p['hash'],'<MISSING>')
    en=paras(p['text'])
    fus=paras(fa) if fa!='<MISSING>' else ['<MISSING>']
    out.append(f"===== {p['id']} | {p['author']} | {p['hash']} =====")
    for i in range(max(len(en),len(fus))):
        e=en[i] if i<len(en) else '<NONE>'
        f=fus[i] if i<len(fus) else '<NONE>'
        out.append(f"[EN{i}] {e}")
        out.append(f"[FA{i}] {f}")
    if len(en)!=len(fus):
        out.append(f"!!! PARAGRAPH COUNT EN={len(en)} FA={len(fus)}")
open(f'_review/kai-p{page}.txt','w',encoding='utf-8').write('\n'.join(out))
