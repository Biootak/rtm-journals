const fs=require('fs');
const paragraphs=s=>String(s||'').split(/\n{2,}/).filter(x=>x.trim());
const page=process.argv[2];
const w=JSON.parse(fs.readFileSync(`_build/expert/work/drswing-p${page}.json`,'utf8'));
const b=JSON.parse(fs.readFileSync(`_build/expert/batches/drswing-p${page}.json`,'utf8'));
for(const p of w){
  if(!(p.hash in b)) {console.log('### MISSING '+p.id+' hash='+p.hash); continue;}
  const ep=paragraphs(p.text), fp=paragraphs(b[p.hash]);
  if(ep.length!==fp.length){
    console.log('### '+p.id+' hash='+p.hash+' eng='+ep.length+' per='+fp.length);
    console.log('--EN--');
    ep.forEach((t,i)=>console.log(`[${i+1}] ${t}`));
    console.log('--FA--');
    fp.forEach((t,i)=>console.log(`[${i+1}] ${t}`));
  }
}
