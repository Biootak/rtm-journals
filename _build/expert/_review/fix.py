import json, sys
path, h = sys.argv[1], sys.argv[2]
new = sys.argv[3] if len(sys.argv)>3 else sys.stdin.read()
data = json.load(open(path, encoding='utf-8'))
assert h in data, 'hash not found: '+h
data[h] = new.rstrip('\n')
with open(path,'w',encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=1)
    f.write('\n')
print('fixed', path, h[:12])
