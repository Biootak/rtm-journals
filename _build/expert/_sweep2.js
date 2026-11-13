const fs=require('fs'),path=require('path');
const journals='josh,newjournal,projectsagana,capnp,shadowpit,hgblacksheep,jiri,fishing,robbie,whenever,constantine,whynotwork,3drive,finddecision,readingsession,academylite1,academylite2,flaglimits,its,moneydeep,ignoredlevel,fxeyes,einrikr,ftrpaz,bsz,warren,andrew'.split(',');
const reps=[
 [/کات‌لاس|کات لاس|کاتلاس/g,'قطع ضرر'],
 [/اسکلپ/g,'اسکالپ'],
 [/پولبک/g,'برگشت'],
 [/ری‌تریسمنت/g,'برگشت مجدد'],
 [/ری‌تریس|ری‌تست/g,'برگشت'],
 [/ritest/gi,'ret'],
 [/ritracement/gi,'retrace'],
 [/فیک‌اوت|فیک اوت/g,'فریب'],
 [/فیک شد/g,'فریب شد'],
 [/ویپ‌سا/g,'شلاق‌زدن'],
 [/بریک‌اوت/g,'شکست'],
 [/ریتریسمنت/g,'برگشت مجدد'],
 [/ریتریس/g,'برگشت'],
 [/ری‌تست/g,'برگشت'],
 [/پلن ترید|پلن معامله/g,'برنامهٔ معامله'],
 [/فلیپ/g,'برگشت نقش'],
 [/اسپایک/g,'جهش'],
 [/تریگر/g,'فعال'],
 [/ریلود کردم/g,'دوباره بارگذاری کردم'],
 [/ریلود/g,'بارگذاری مجدد'],
 [/پوزیشن/g,'موقعیت'],
 [/بایاس/g,'جهت‌گیری'],
 [/مومنتوم/g,'شتاب'],
 [/کانتکست/g,'زمینه'],
 [/فریم/g,'چارچوب'],
 [/سشن/g,'جلسه'],
 [/price action/gi,'رفتار قیمت'],
 [/fakeout/gi,'فریب'],[/whipsaw/gi,'شلاق‌زدن'],[/slippage/gi,'لغزش'],[/pullback/gi,'برگشت'],[/breakout/gi,'شکست'],[/retest/gi,'برگشت مجدد'],[/scalp/gi,'اسکالپ'],[/trade plan/gi,'برنامهٔ معامله'],[/manage/g,'مدیریت'],
];
let stats={files:0,vals:0};
for(const f of fs.readdirSync('batches')){
  const jid=f.split('-')[0];
  if(!journals.includes(jid))continue;
  let b;try{b=JSON.parse(fs.readFileSync(path.join('batches',f),'utf8'))}catch(e){continue}
  let dirty=false;
  for(const k of Object.keys(b)){
    let v=b[k]; if(typeof v!=='string')continue;
    let nv=v;
    for(const[r,t]of reps)nv=nv.replace(r,t);
    if(nv!==v){b[k]=nv;dirty=true;stats.vals++;}
  }
  if(dirty){fs.writeFileSync(path.join('batches',f),JSON.stringify(b,null,1));stats.files++;}
}
console.log(JSON.stringify(stats));
