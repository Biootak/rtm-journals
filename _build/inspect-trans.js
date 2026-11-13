const fs=require('fs');
const t=JSON.parse(fs.readFileSync('E:/Trade/journals/_build/ocr/translations.json','utf8'));
const keys=Object.keys(t);
console.log('entries',keys.length);
console.log('first keys',keys.slice(0,3));
const e=t[keys[0]];
console.log(JSON.stringify(e,null,1).slice(0,1500));
let withBlocks=0,withText=0;
for(const k of keys){ if(Array.isArray(t[k]?.blocks)&&t[k].blocks.length) withBlocks++; if(t[k]?.text||t[k]?.persian) withText++; }
console.log({withBlocks,withText});
