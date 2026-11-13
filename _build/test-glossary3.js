const fs=require('fs');
let src=fs.readFileSync('E:/Trade/journals/_build/translate-posts.js','utf8');
const start=src.indexOf('const PAIR_SHORTHAND');
const end=src.indexOf('function findCut');
const snippet=src.slice(start,end);
const core=require('E:/Trade/journals/_build/translate.js');
eval(snippet);
(async()=>{
const samples=[
"I went long EURUSD at 1.1200, stop loss below the swing low.",
"I was long EU from 1.12 and moved my stop to break-even.",
"I am short GU, target at the FL.",
"Long positions were stopped out.",
"He is long from the FL.",
"I'm waiting for HHs to short EJ.",
"I took a short on EU and closed it at the support.",
"Price is in a long consolidation, so I will wait.",
"She has been long for three days.",
"I am going long EU now.",
"I'm long.",
"He held buy positions EU and shorts GU.",
"It took a long time, but I went short at the FL.",
"The short-term trend is down, and I have a long bias."
];
for(const s of samples){
  const e=expandAbbreviations(s);
  const p=core.protect(e);
  const masked=p.masked.replace(/\[\[(\d+)\]\]/g,'<$1>').replace(/\uE000p(\d+)q\uE001/g,'<$1>');
  const out=await core.bingTranslateBatch([masked]);
  console.log('EN :',s);console.log('EXP:',e);console.log('FA :',core.restoreText(out,p.restore));console.log();
}
})().catch(e=>console.error(e));
