const fs=require('fs');
const c=JSON.parse(fs.readFileSync('E:/Trade/journals/_build/posts/translations.json','utf8'));
const ks=Object.keys(c);
console.log('cached',ks.length);
for(const k of ks.slice(-5)) console.log('---',k,'\n',c[k].slice(0,300));
