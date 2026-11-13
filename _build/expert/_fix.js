// usage: node _build/expert/_fix.js <batchfile-noext> <fixes.json>
// fixes.json: { "<postid>": "persian text" }  OR { "<hash>": "..." } if key is 40-hex
const fs=require('fs'),path=require('path');
const WORK=path.join(__dirname,'work'),BATCH=path.join(__dirname,'batches');
const base=process.argv[2], fixes=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
const work=JSON.parse(fs.readFileSync(path.join(WORK,base+'.json'),'utf8'));
const bfile=path.join(BATCH,base+'.json');
const batch=JSON.parse(fs.readFileSync(bfile,'utf8'));
let n=0;
for(const [k,v] of Object.entries(fixes)){
  let w=work.find(x=>x.id===k);
  if(!w&&/^[0-9a-f]{40}$/.test(k)) w=work.find(x=>x.hash===k);
  if(!w){console.log('NO MATCH',k);continue;}
  batch[w.hash]=v;n++;
}
fs.writeFileSync(bfile,JSON.stringify(batch,null,1),'utf8');
console.log(base,'applied',n);
