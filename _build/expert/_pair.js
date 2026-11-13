const fs=require('fs');
const [,,w,b]=process.argv;
const work=JSON.parse(fs.readFileSync(w,'utf8'));
const batch=JSON.parse(fs.readFileSync(b,'utf8'));
work.forEach((p,i)=>{
  const fa=batch[p.hash];
  console.log(`===POST ${i} ${p.id}===`);
  console.log('---EN---');console.log(p.text);
  console.log('---FA---');console.log(fa===undefined?'***MISSING***':fa);
});
