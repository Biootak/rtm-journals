const fs=require('fs'),path=require('path');
const ROOT='E:/Trade/journals';
const B=path.join(ROOT,'_build','expert');
const rej=fs.readFileSync('C:/Users/Bioootak/AppData/Local/Temp/target_rejects.txt','utf8').split('\n').filter(Boolean);
const groups={};
for(const line of rej){
  const m=line.match(/^\s*(\S+) \| (.*)$/); if(!m)continue;
  const id=m[1]; const base=id.replace(/_p\d+_\d+$/,'');
  const pg=id.match(/_p(\d+)_\d+$/)[1];
  (groups[base]=groups[base]||{})[pg]=groups[base]?.[pg]||[];
  groups[base][pg].push({id,issue:m[2]});
}
const out=[];
for(const j of Object.keys(groups)){
  for(const p of Object.keys(groups[j])){
    const wf=path.join(B,'work',`${j}-p${p}.json`);
    const bf=path.join(B,'batches',`${j}-p${p}.json`);
    const work=JSON.parse(fs.readFileSync(wf,'utf8'));
    const batch=JSON.parse(fs.readFileSync(bf,'utf8'));
    const wm=new Map(work.map(w=>[w.id,w]));
    for(const r of groups[j][p]){
      const w=wm.get(r.id);
      out.push('===== '+r.id+' | '+r.issue+' =====');
      out.push('--- EN ---'); out.push(w?w.text:'<no work>');
      out.push('--- FA ---'); out.push(w?JSON.stringify(batch[w.hash]||'<missing>'):'');
      out.push('');
    }
  }
}
fs.writeFileSync('E:/Trade/journals/_build/expert/_tmpfix/reject_dump.txt',out.join('\n'),'utf8');
console.log('written',out.length,'lines');
