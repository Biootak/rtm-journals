const fs=require('fs');
const p=JSON.parse(fs.readFileSync('_build/parsed.json','utf8'));
console.log('top keys',Array.isArray(p)?'array len '+p.length:Object.keys(p).slice(0,8));
const first=Array.isArray(p)?p[0]:p[Object.keys(p)[0]];
console.log('entry keys',first&&typeof first==='object'?Object.keys(first).slice(0,20):typeof first);
