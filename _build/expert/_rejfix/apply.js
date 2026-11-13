// usage: node apply.js fixes.json  — {"<base>":{"<hash>":"new fa"}}
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..','..','..');
const fixes=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
for(const [base,map] of Object.entries(fixes)){
  const f=path.join(ROOT,'_build','expert','batches',base+'.json');
  const b=JSON.parse(fs.readFileSync(f,'utf8'));
  for(const [h,v] of Object.entries(map)){ if(!(h in b)) console.log('NOHASH '+base+' '+h.slice(0,8)); b[h]=v; }
  fs.writeFileSync(f,JSON.stringify(b,null,0),'utf8');
  console.log('applied '+base+' '+Object.keys(map).length);
}
