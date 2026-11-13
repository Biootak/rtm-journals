import json,sys,os,io
sys.stdout=io.TextIOWrapper(sys.stdout.buffer,encoding='utf-8')
base=r'E:\Trade\journals\_build\expert'
for spec in sys.argv[1:]:
    jid,p=spec.rsplit('-p',1)
    w=json.load(open(os.path.join(base,'work',f'{jid}-p{p}.json'),encoding='utf-8'))
    b=json.load(open(os.path.join(base,'batches',f'{jid}-p{p}.json'),encoding='utf-8'))
    for post in w:
        h=post['hash']; fa=b.get(h,'<MISSING>')
        print(f"##### {jid}-p{p} {post['id']} hash={h}")
        print("---EN---");print(post['text'])
        print("---FA---");print(fa)
