const fs=require('fs'),path=require('path');
const journals=process.argv[2].split(',');
const dir='batches';
const pd={'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9'};
const P='[\u0621-\u064A\u067E\u0686\u0698\u06AF]';
const toZ=new RegExp('([A-Za-z])('+P+')','g');
const fromZ=new RegExp('('+P+')([A-Za-z])','g');
let stats={files:0,vals:0};
for(const f of fs.readdirSync(dir)){
  const jid=f.split('-')[0];
  if(!journals.includes(jid))continue;
  let b;try{b=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'))}catch(e){console.log('PARSEFAIL',f);continue}
  let dirty=false;
  for(const k of Object.keys(b)){
    let v=b[k]; if(typeof v!=='string')continue;
    let nv=v;
    nv=nv.replace(/[۰-۹]/g,c=>pd[c]);
    nv=nv.replace(/کینک/g,'پیچش').replace(/اسکرین‌شات/g,'عکس از صفحه').replace(/اسکرین شات/g,'عکس از صفحه');
    nv=nv.replace(toZ,'$1\u200C$2').replace(fromZ,'$1\u200C$2');
    if(nv!==v){b[k]=nv;dirty=true;stats.vals++;}
  }
  if(dirty){fs.writeFileSync(path.join(dir,f),JSON.stringify(b,null,1));stats.files++;}
}
console.log(JSON.stringify(stats));
