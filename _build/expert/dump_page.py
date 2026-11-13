import json, sys, os, re

# usage: python _build/expert/dump_page.py <jid> <page> [only_ids]
jid, page = sys.argv[1], sys.argv[2]
only = set(sys.argv[3].split(',')) if len(sys.argv) > 3 else None
work = json.load(open(f'_build/expert/work/{jid}-p{page}.json', encoding='utf-8'))
batch = json.load(open(f'_build/expert/batches/{jid}-p{page}.json', encoding='utf-8'))
for post in work:
    if only and post['id'] not in only and post['hash'] not in only:
        continue
    print(f"### {post['id']} hash={post['hash']}")
    print('EN>>')
    print(post['text'])
    print('FA>>')
    print(batch.get(post['hash'], '<MISSING>'))
    print()
