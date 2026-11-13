const fs=require('fs');
const d=JSON.parse(fs.readFileSync('E:/Trade/journals/_build/parsed.json','utf8'));
const terms=['eng','IT','FL','TG','BE','RR','QM','BOS','CHoCH','FVG','OB','HTF','LTF','SL','TP','S/R','S/D','IDM','POI'];
const counts={}; const samples={};
for(const j of d.journals)for(const p of j.posts){
  const t=String(p.text||'');
  for(const term of terms){
    const re=new RegExp('\\b'+term.replace('/','\\/')+'\\b','g');
    const m=t.match(re);
    if(m){counts[term]=(counts[term]||0)+m.length; (samples[term]=samples[term]||[]); if(samples[term].length<3){const i=t.search(re); samples[term].push(t.slice(Math.max(0,i-50),i+70).replace(/\n/g,' '));}}
  }
}
for(const term of terms){console.log(term, counts[term]||0); for(const s of samples[term]||[]) console.log('   ...'+s+'...');}
