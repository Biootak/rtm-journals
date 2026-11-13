const fs=require('fs');
// usage: node _drswing-apply.js <page> <jsonfile>
const page=process.argv[2], file=process.argv[3];
const fix=JSON.parse(fs.readFileSync(file,'utf8'));
const bf=`_build/expert/batches/drswing-p${page}.json`;
const b=JSON.parse(fs.readFileSync(bf,'utf8'));
for(const h in fix) b[h]=fix[h];
fs.writeFileSync(bf, JSON.stringify(b,null,1)+'\n');
console.log('applied', Object.keys(fix).length);
