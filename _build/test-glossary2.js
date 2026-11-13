const core=require('E:/Trade/journals/_build/translate.js');
function expand(t){
  return t
    .replace(/\bengs\b/gi,'engulfing patterns')
    .replace(/\beng\b/gi,'engulfing pattern')
    .replace(/\bIT's\b/g,"institutional traders'")
    .replace(/\bIT\b/g,'institutional traders')
    .replace(/\bHTF\b/g,'higher timeframe')
    .replace(/\bLTF\b/g,'lower timeframe')
    .replace(/\bBOS\b/g,'break of structure')
    .replace(/\bCHoCH\b/g,'change of character')
    .replace(/\bFVG\b/g,'fair value gap')
    .replace(/\bOB\b/g,'order block')
    .replace(/\bS\/R\b/g,'support/resistance')
    .replace(/\bS\/D\b/g,'supply/demand')
    .replace(/\bSL\b/g,'stop loss')
    .replace(/\bTP\b/g,'take profit')
    .replace(/\bRR\b/g,'risk-reward')
    .replace(/\bBE\b/g,'break-even')
    .replace(/\bTG\b(?!\d)/g,'target');
}
(async()=>{
const samples=[
"Price made an eng at the HTF FL. The IT's accumulation led to a BOS and a CHoCH. Wait for an FVG or OB, then target the S/R or S/D zone. SL below the low, TP at the QM level, RR 1:3, BE at 1R. TG1 and TG2.",
"This eng on LTF after IT accumulation is a good entry. TG is the HTF FL. My SL is below the QM low and RR is 1:4.",
"I was long EU, moved SL to BE, TP hit at the FL. The eng was clear."
];
for(const s of samples){
  const e=expand(s);
  const p=core.protect(e);
  const masked=p.masked.replace(/\[\[(\d+)\]\]/g,'<$1>').replace(/\uE000p(\d+)q\uE001/g,'<$1>');
  const out=await core.bingTranslateBatch([masked]);
  console.log('EN :',s);console.log('EXP:',e);console.log('FA :',core.restoreText(out,p.restore));console.log();
}
})().catch(e=>console.error(e));
