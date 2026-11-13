const fs=require('fs');
const t=fs.readFileSync('_build/expert/redraft/supplydemand-p47-fix.txt','utf8');
const skip=new Set(['supplydemand_p47_1162','supplydemand_p47_1165']);
const parts=t.split(/(?=^### )/m);
const keep=parts.filter(p=>{const m=p.match(/^### (\S+)/);return !m||!skip.has(m[1]);});
fs.writeFileSync('_build/expert/redraft/supplydemand-p47-fix3.txt',keep.join(''));
console.log('blocks kept:',keep.filter(p=>p.startsWith('###')).length);
