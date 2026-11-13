const fs=require('fs');
const p=process.argv[2];
const w=JSON.parse(fs.readFileSync(`E:/Trade/journals/_build/expert/work/if-p${p}.json`,'utf8'));
const b=JSON.parse(fs.readFileSync(`E:/Trade/journals/_build/expert/batches/if-p${p}.json`,'utf8'));
for(const post of w){
  console.log('=== '+post.id+' hash='+post.hash+' author='+post.author);
  console.log('EN: '+post.text.replace(/\n/g,'\n'));
  const fa=b[post.hash];
  console.log('FA: '+(fa===undefined?'<<<MISSING>>>':fa.replace(/\n/g,'\n')));
}
