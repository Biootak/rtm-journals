// usage: node repeq.js <journal-pN> <postid>
const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..','..','..');
const lex=require(path.join(ROOT,'_build','lexicon.js'));
const base=process.argv[2], id=process.argv[3];
const work=JSON.parse(fs.readFileSync(path.join(ROOT,'_build','expert','work',base+'.json'),'utf8'));
const batch=JSON.parse(fs.readFileSync(path.join(ROOT,'_build','expert','batches',base+'.json'),'utf8'));
const w=work.find(x=>x.id===id);
const fa=batch[w.hash];
const toks=String(fa).split(/\s+/).filter(t=>t.length>=3&&!/^[\d.,٪%\-+]+$/.test(t));
const seen=new Map();
for(let i=0;i+1<toks.length;i++){const k=toks[i]+' '+toks[i+1];seen.set(k,(seen.get(k)||0)+1);}
for(const [k,c] of seen) if(c>=2) console.log('BIGRAM x'+c+': '+k);
console.log('FA-REPEATED-EN?', lex.repeatedPhrase(w.text)?'yes':'no');
