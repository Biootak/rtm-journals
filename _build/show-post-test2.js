const fs=require('fs');const crypto=require('crypto');
const cache=JSON.parse(fs.readFileSync('E:/Trade/journals/_build/posts/translations.json','utf8'));
const parsed=JSON.parse(fs.readFileSync('E:/Trade/journals/_build/parsed.json','utf8'));
function norm(t){return String(t||'').replace(/\r\n?/g,'\n').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();}
function h(t){return crypto.createHash('sha1').update(norm(t)).digest('hex');}
let n=0;
for(const j of parsed.journals){for(const p of j.posts){const text=norm(p.text||'');const fa=cache[h(text)];if(!fa||text.length<300)continue;console.log('=== EN ===\n'+text.slice(0,1200));console.log('=== FA ===\n'+fa.slice(0,1400));console.log();if(++n>=4)process.exit(0);}}
