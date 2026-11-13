const core=require('E:/Trade/journals/_build/translate.js');
(async()=>{
const samples=[
"Price made an eng at the HTF FL. The IT's accumulation led to a BOS and a CHoCH. Wait for an FVG or OB, then target the S/R or S/D zone. SL below the low, TP at the QM level, RR 1:3, BE at 1R. TG1 and TG2.",
"We have a QM pattern at the FL. Institutional traders (IT) accumulated before the break of structure. Lower timeframe supply was swept.",
"Buy at support, stop loss below the swing low, take profit at resistance. Risk-reward is 1:2."
];
for(const s of samples){
  const p=core.protect(s);
  const masked=p.masked.replace(/\[\[(\d+)\]\]/g,'<$1>').replace(/\uE000p(\d+)q\uE001/g,'<$1>');
  const out=await core.bingTranslateBatch([masked]);
  console.log('EN:',s);console.log('FA:',core.restoreText(out,p.restore));console.log();
}
})().catch(e=>console.error(e));
