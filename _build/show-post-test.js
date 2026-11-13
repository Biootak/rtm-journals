const fs=require('fs');
const cache=JSON.parse(fs.readFileSync('E:/Trade/journals/_build/posts/translations.json','utf8'));
const parsed=JSON.parse(fs.readFileSync('E:/Trade/journals/_build/parsed.json','utf8'));
const crypto=require('crypto');
function norm(t){return String(t||'').replace(/\r\n?/g,'\n').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();}
function h(t){return crypto.createHash('sha1').update(norm(t)).digest('hex');}
let n=0;
for(const j of parsed.journals){for(const p of j.posts){const text=norm(p.text||'');if(!text||!/[A-Za-z]/.test(text)||/[\u0600-\u06FF]/.test(text))continue;if(n>=3)break;if(cache[h(text)]){console.log('--- EN ---\n'+text.slice(0,800));console.log('--- FA ---\n'+cache[h(text)].slice(0,900));console.log();n++;}}}
