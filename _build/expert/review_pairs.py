import json, sys, os
sys.stdout.reconfigure(encoding='utf-8')

base = os.path.dirname(os.path.abspath(__file__))
jid, page = sys.argv[1], sys.argv[2]
w = json.load(open(os.path.join(base, 'work', f'{jid}-p{page}.json'), encoding='utf-8'))
bp = os.path.join(base, 'batches', f'{jid}-p{page}.json')
b = json.load(open(bp, encoding='utf-8')) if os.path.exists(bp) else {}
for i, p in enumerate(w):
    print(f'===== [{i}] {p["id"]} | {p["author"]} | {p["hash"][:10]}')
    print('--- EN ---')
    print(p['text'])
    print('--- FA ---')
    print(b.get(p['hash'], '<<<MISSING>>>'))
    print()
