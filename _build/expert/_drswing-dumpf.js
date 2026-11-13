const fs=require('fs');
const paragraphs=s=>String(s||'').split(/\n{2,}/).filter(x=>x.trim());
const page=process.argv[2];
const w=JSON.parse(fs.readFileSync(`_build/expert/work/drswing-p${page}.json`,'utf8'));
const b=JSON.parse(fs.readFileSync(`_build/expert/batches/drswing-p${page}.json`,'utf8'));
let out='';
for(const p of w){
  if(!(p.hash in b)) {out+='### MISSING '+p.id+' hash='+p.hash+'\n'; continue;}
  const ep=paragraphs(p.text), fp=paragraphs(b[p.hash]);
  if(ep.length!==fp.length){
    out+='### '+p.id+' hash='+p.hash+' eng='+ep.length+' per='+fp.length+'\n--EN--\n';
    ep.forEach((t,i)=>{out+=`[${i+1}] ${JSON.stringify(t)}\n`});
    out+='--FA--\n';
    fp.forEach((t,i)=>{out+=`[${i+1}] ${JSON.stringify(t)}\n`});
  }
}
fs.writeFileSync(`_build/expert/_fix/dump-p${page}.txt`,out);
console.log('wrote',out.length);
