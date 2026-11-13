const core=require('E:/Trade/journals/_build/translate.js');
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
"She has been long for three days."
];
for(const s of samples){
  const p=core.protect(s);
  const masked=p.masked.replace(/\[\[(\d+)\]\]/g,'<$1>').replace(/\uE000p(\d+)q\uE001/g,'<$1>');
  const out=await core.bingTranslateBatch([masked]);
  console.log('EN:',s);console.log('FA:',core.restoreText(out,p.restore));console.log();
}
})().catch(e=>console.error(e));
