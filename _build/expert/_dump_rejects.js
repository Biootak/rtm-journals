const fs=require('fs'),path=require('path');
const WORK=path.join(__dirname,'work'),BATCH=path.join(__dirname,'batches');
const only=process.argv[2]?new Set(process.argv[2].split(',')):null;
const rej=new Map();
const lines=fs.readFileSync(process.argv[3]||'_build/expert/_rej6.txt','utf8').split('\n');
for(const l of lines){
  const m=l.match(/^\s*([a-z0-9_]+?)_p(\d+)_(\d+)\s*\|\s*(.*)/);
  if(!m)continue;
  const jid=m[1],pg='p'+m[2],id=m[0].trim().split('|')[0].trim();
  if(only&&!only.has(jid))continue;
  const key=jid+'-'+pg+'.json';
  if(!rej.has(key))rej.set(key,[]);
  rej.get(key).push([id,m[4].trim()]);
}
for(const [file,list] of rej){
  const work=JSON.parse(fs.readFileSync(path.join(WORK,file),'utf8'));
  const batch=JSON.parse(fs.readFileSync(path.join(BATCH,file),'utf8'));
  for(const [id,issue] of list){
    const w=work.find(x=>x.id===id);
    if(!w){console.log('MISSING '+id);continue;}
    console.log('===== '+file+' '+id+' | '+issue);
    console.log('--- EN ---');console.log(w.text);
    console.log('--- FA ---');console.log(batch[w.hash]);
    console.log('');
  }
}
