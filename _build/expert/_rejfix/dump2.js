const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..','..','..');
const WORK=path.join(ROOT,'_build','expert','work');
const BAT=path.join(ROOT,'_build','expert','batches');
const lines=fs.readFileSync(path.join(__dirname,'rejects.txt'),'utf8').split('\n').filter(Boolean);
const cache={};
for(const line of lines){
  const [id,why]=line.split('|');
  const m=id.match(/^(.*)_p(\d+)_(\d+)$/);
  const base=m[1]+'-p'+m[2];
  if(!cache[base]){try{cache[base]={work:JSON.parse(fs.readFileSync(path.join(WORK,base+'.json'),'utf8')),batch:JSON.parse(fs.readFileSync(path.join(BAT,base+'.json'),'utf8'))};}catch(e){console.log('NOFILE '+base);continue;}}
  const {work,batch}=cache[base];
  const w=work.find(x=>x.id===id);
  if(!w){console.log('NOTFOUND '+id);continue;}
  const fa=batch[w.hash]||'';
  const toks=fa.split(/\s+/).filter(t=>t.length>=3&&!/^[\d.,٪%\-+]+$/.test(t));
  const seen=new Map();let rep='';
  for(let i=0;i+1<toks.length;i++){const k=toks[i]+' '+toks[i+1];const c=(seen.get(k)||0)+1;seen.set(k,c);if(c>=2&&!rep)rep=k;}
  console.log('===== '+id+' ['+base+'] '+why+' HASH '+w.hash+' =====');
  if(why==='echo') console.log('REPBIGRAM: '+rep);
  console.log('EN>>>'+w.text.replace(/\n/g,'\n'));
  console.log('FA>>>'+String(fa).replace(/\n/g,'\n'));
}
