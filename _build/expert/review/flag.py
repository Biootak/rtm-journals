import json,sys,os,re,glob,io
sys.stdout=io.TextIOWrapper(sys.stdout.buffer,encoding='utf-8')
base=r'E:\Trade\journals\_build\expert'
JIDS='fishing robbie whenever constantine whynotwork finddecision readingsession academylite1 academylite2 flaglimits flaglimitshydra its moneydeep ignoredlevel fxeyes einrikr ftrpaz bsz warren andrew engulf gembel'.split()
STOP=set('''the and is are you your with for this that have has was were but not can will just like know think see look want need get got all some more most when what how why who would could should does did then than very really also from into about there here now only same other much many over under after before between during because while where which them they their its our out again still even back way good new first last long little own old right high low every never always often sometimes maybe please thanks thank sorry hello hey lol tbh yeah yep nope okay well going gone make made take took come came give gave find found tell told ask asked try tried use used work works call called put keep kept let say said buy sell sold trade traded price chart market time day week month year today tomorrow yesterday ago off on in at to of a an i we he she it me us him my am be been being do done having if or as by up down so no yes dumb match guys newsletter luli level levels'''.split())
TOK=re.compile(r'[A-Za-z]+')
res={}
for jid in JIDS:
    for bf in sorted(glob.glob(os.path.join(base,'batches',jid+'-p*.json'))):
        p=os.path.basename(bf)[:-5]; wf=os.path.join(base,'work',p+'.json')
        if not os.path.exists(wf): continue
        try: b=json.load(open(bf,encoding='utf-8')); w=json.load(open(wf,encoding='utf-8'))
        except Exception: res.setdefault('PARSEFAIL',[]).append(p); continue
        for post in w:
            h=post['hash']; v=b.get(h)
            if v is None: res.setdefault('MISSING',[]).append(f'{p}:{post["id"]}'); continue
            # remove URLs and "X wrote:" heads won't help; just collect stopwords
            hits=[t for t in TOK.findall(v) if t.lower() in STOP]
            pd='PDIGIT' if re.search(r'[۰-۹]',v) else None
            flags=sorted(set(hits))
            if flags or pd: res.setdefault(p,[]).append((post['id'],flags,pd))
for k in sorted(res):
    if k in ('PARSEFAIL','MISSING'): print(k,res[k]); continue
    print(k, len(res[k]),'posts')
    for i,fs,pd in res[k]: print('   ',i,pd,fs[:10])
