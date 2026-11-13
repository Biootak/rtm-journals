const fs=require("fs");
// checks: persian digits, leftover long english words, wrote: heads
for(let i=1;i<=13;i++){
  const b=JSON.parse(fs.readFileSync(`batches/frosty-p${i}.json`,"utf8"));
  const w=JSON.parse(fs.readFileSync(`work/frosty-p${i}.json`,"utf8"));
  const issues=[];
  for(const [h,t] of Object.entries(b)){
    if(/[۰-۹]/.test(t))issues.push("persian-digit:"+h.slice(0,6));
    const en=(t.match(/[A-Za-z]{4,}/g)||[]).filter(x=>!/^(RTM|FL|FTR|PAZ|MPL|LTF|HTF|SL|TP|CP|QM|DM|FO|IT|PA|SD|SR|LS|RS|BSZ|iQM|iSR|DBR|RBD|D1|H4|H1|W1|M15|M1|M30|MN|GILD|AJ|AJ|AUD|JPY|EUR|GBP|USD|CAD|NZD|CHF|NOK|SEK|XAU|IDR|PLN|JPN|Nikkei|FXPro|Pepperstone|Dukascopy|JForex|MT4|IDX|LQ45|USDCAD|USDIDR|USDPLN|CADJPY|CHFJPY|NZDJPY|GBPCHF|NZDUSD|EURJPY|EURUSD|USDCHF|USDCAD|GOLD|PA|CAPS|POLE|POLES|FLAG|FLR|CPAZ|PCP|SF|MPL|DBD|FTR|FO|TT|PO|HS|LS|MM|ITs|PAZ|ORFL|UFL|LFL|CTG|TG|DP|FOF|LQ|LQG|LSK|S_D|QD|RT|BBCode|URL|LOL|RSI|MA|EMA|SMA|R:R|RR|PF|PnL|YoY|QoQ|PM|AM|OK|TV|PC|AD|BC|AD|DIY|DIY|DIY)/.test(x));
    const bad=en.filter(x=>!(/^(Frosty|Staurum|Ifmyante|HCDE|Kavya|Zee|linos|Astrokillah|billmac3|franc464|dengaima|jacktrader|moneydeep|Mukhcin|Rinehart|Ysbail|Edge|Salivan|Mertch|Gregg|VitalDrug|Constantine|DKD|Josh1125|Rdk123|Moogroo|Hugo|Lupy|Shantala|Les_Paul|Smimon|FXYogi|Batus|Paulo|Coelho|Alchemist|Babylon|Richest|Man|Indonesian|Jakarta|Bandung|Batagor|batagor|waitbutwhy|forexfactory|showthread|post|google|Maxwell|Maltz|Psychocybernetics|Enlightenment|Engulf|Flag|Limits|Find|Decisions|Fake|Out|Order|Flow|Reversal|Continuation|Engulfs|Free|Compression|Diamond|DM|PO|TM|RTMA|Lite|Video|IF|FF|RTMers|RTMer|RTM|PA|SD|SR|LS|RS|CP|CPPAZ|MPL|LQ|FTR|FL|QM|DM|FO|IT|ITs|H|L|HH|LL|LH|HL|G|A|B|C|D|X|Y|Z|F|W|V|U|N|O|P|Q|R|S|T|E|I|J|K|M|1|2|3|4|5|6|7|8|9|0|P|W|V|U|H|M|L|D|T|R|C|B|A|F|E|G|I|J|K|N|O|Q|S|X|Y|Z)$/).test(x)&&x.length>2&&!/^\d+$/.test(x));
    if(bad.length)issues.push("latin:"+bad.slice(0,6).join(","));
  }
  // wrote heads
  const enText=w.map(p=>p.text).join("\n");
  const faText=Object.values(b).join("\n");
  const enW=enText.match(/[A-Za-z0-9_]+ wrote:/g)||[];
  const faW=faText.match(/[A-Za-z0-9_]+ نوشت:/g)||[];
  if(enW.length!==faW.length)issues.push(`wrote ${enW.length} vs ${faW.length}`);
  // paragraph counts
  w.forEach((p,i)=>{
    const fa=b[p.hash];
    const enC=p.text.split(/\n\s*\n/).length, faC=(fa||"").split(/\n\s*\n/).length;
    if(enC!==faC)issues.push(`para post${i+1} en${enC}/fa${faC}`);
  });
  console.log(`p${i}:`,issues.length?issues.join(" | "):"OK");
}
