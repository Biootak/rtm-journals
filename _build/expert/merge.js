const fs=require('fs');
const [jid,p]=process.argv[2].split('-');
const page=p.replace('p','');
const w=JSON.parse(fs.readFileSync(`E:/Trade/journals/_build/expert/work/${jid}-${p}.json`,'utf8'));
const b=JSON.parse(fs.readFileSync(`E:/Trade/journals/_build/expert/batches/${jid}-${p}.json`,'utf8'));
let i=0;
for(const post of w){
  i++;
  console.log(`=== [${i}] ${post.id} hash=${post.hash} author=${post.author||''}`);
  console.log('--- EN ---'); console.log(post.text);
  console.log('--- FA ---'); console.log(b[post.hash] ?? '<<<MISSING>>>');
}
const extra=Object.keys(b).filter(h=>!w.some(p=>p.hash===h));
if(extra.length) console.log('EXTRA HASHES:',extra.join(','));
