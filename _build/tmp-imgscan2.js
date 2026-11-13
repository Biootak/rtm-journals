const fs=require('fs');
const p=JSON.parse(fs.readFileSync('_build/parsed.json','utf8'));
const J=p.journals; const k=Object.keys(J);
const first=J[k[0]];
console.log('journals',k.length,'-> entry keys',Array.isArray(first)?'array '+first.length:Object.keys(first).slice(0,15));
const sample=Array.isArray(first)?first[0]:(first.posts?first.posts[0]:first);
console.log('post keys',sample&&typeof sample==='object'?Object.keys(sample).slice(0,25):typeof sample);
console.log('stats keys',Object.keys(p.stats).slice(0,20));
