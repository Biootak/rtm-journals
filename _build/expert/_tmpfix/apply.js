// usage: node apply.js <journal>-p<N> <fixes.json>
// fixes.json: { "<postid>": "<persian>" }
const fs=require('fs'),path=require('path');
const B='E:/Trade/journals/_build/expert';
const base=process.argv[2], fixFile=process.argv[3];
const work=JSON.parse(fs.readFileSync(path.join(B,'work',base+'.json'),'utf8'));
const bf=path.join(B,'batches',base+'.json');
const batch=JSON.parse(fs.readFileSync(bf,'utf8'));
const fixes=JSON.parse(fs.readFileSync(fixFile,'utf8'));
const wm=new Map(work.map(w=>[w.id,w]));
let n=0;
for(const [id,fa] of Object.entries(fixes)){
  const w=wm.get(id);
  if(!w){console.log('NO WORK',id);continue;}
  batch[w.hash]=fa; n++;
}
fs.writeFileSync(bf,JSON.stringify(batch,null,1),'utf8');
console.log(base,'applied',n,'fixes; batch size',Object.keys(batch).length);
