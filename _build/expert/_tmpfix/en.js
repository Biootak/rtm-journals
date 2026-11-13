const fs=require('fs'),path=require('path');
const B='E:/Trade/journals/_build/expert';
const base=process.argv[2]; // e.g. paz-p1
const prefix=base.replace('-p','_p')+'_';
const rej=fs.readFileSync('C:/Users/Bioootak/AppData/Local/Temp/target_rejects.txt','utf8').split('\n').filter(Boolean);
const ids=new Set(rej.filter(l=>l.trim().startsWith(prefix)).map(l=>l.trim().split(' | ')[0]));
const work=JSON.parse(fs.readFileSync(path.join(B,'work',base+'.json'),'utf8'));
for(const w of work){ if(ids.has(w.id)){ console.log('@@@'+w.id); console.log(w.text); console.log('@@@END'); } }
