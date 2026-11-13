# -*- coding: utf-8 -*-
import json, glob, re, os, sys

J = ['michal238','omidfx','vitaldrug','benhur','homeoffinisher','linos','mukhcin','aran','edges','mel']
flags = json.load(open('_review_flags.json', encoding='utf-8'))
want = {}
for j, bf, tid, msg in flags:
    m = re.search(r'p(\d+)\.json$', bf.replace('\\', '/'))
    want.setdefault((j, int(m.group(1))), []).append(tid)

out = []
for (j, p), tids in sorted(want.items()):
    wf = 'work/%s-p%d.json' % (j, p)
    bf = 'batches/%s-p%d.json' % (j, p)
    w = json.load(open(wf, encoding='utf-8'))
    b = json.load(open(bf, encoding='utf-8'))
    wmap = {}
    for x in w:
        wmap.setdefault(x['hash'], x)
    for x in w:
        if x['id'] in tids:
            out.append('===== %s %s =====' % (j, x['id']))
            out.append('--- EN ---')
            out.append(x['text'])
            out.append('--- FA ---')
            out.append(b.get(x['hash'], '<MISSING>'))
            out.append('')
open('_flag_dump.txt', 'w', encoding='utf-8').write('\n'.join(out))
print('wrote', len(out), 'lines')
