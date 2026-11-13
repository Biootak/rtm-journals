const fs=require('fs');
const d=JSON.parse(fs.readFileSync('E:/Trade/journals/_build/parsed.json','utf8'));
const phrases=[/\b(?:i'?m|i am|was|went|going|go|still|stay|stayed|be|been)\s+long\b/gi,/\b(?:i'?m|i am|was|went|going|go|still|stay|stayed|be|been)\s+short\b/gi,/\blong\s+(?:EU|GU|UJ|EJ|GJ|AU|UC|EURUSD|GBPUSD|USDJPY|XAUUSD)\b/gi,/\bshort\s+(?:EU|GU|UJ|EJ|GJ|AU|UC|EURUSD|GBPUSD|USDJPY|XAUUSD)\b/gi];
const labels=['was long','was short','long PAIR','short PAIR'];
const seen=labels.map(()=>0);
for(const j of d.journals)for(const p of j.posts){
  const t=String(p.text||'');
  phrases.forEach((re,k)=>{ if(seen[k]>=6)return; const m=re.exec(t); if(m){seen[k]++; const i=m.index; console.log(labels[k],'::',t.slice(Math.max(0,i-80),i+120).replace(/\n/g,' '));}});
}
