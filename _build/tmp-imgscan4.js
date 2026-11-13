const fs=require('fs');
const t=JSON.parse(fs.readFileSync('_build/ocr/translations.baked.json','utf8'));
const keys=Object.keys(t);
const acct=/\b\d{7,12}\b/;
const broker=/roboforex|alpari|forex4u|exness|instamarket|liteforex|amarketing|fbs|ic-markets|xm\.com|myfxbook/i;
const stmt=/net profit|gross profit|gross loss|total trades|win rate|account (balance|equity|number)|deposit|withdraw|performance statement|expectancy|profit factor/i;
const terms=/market watch|terminal|navigator|account:\s*/i;
let nAcct=0,nBroker=0,nStmt=0,nTerms=0,any=0,ok=0,empty=0;
const ex=[];
for(const h of keys){
  const e=t[h]; const blocks=(e&&e.blocks)||[];
  const txt=blocks.map(b=>(b.original||'')+' ').join('');
  if(!txt.trim()){empty++;continue;}
  const a=acct.test(txt),b=broker.test(txt),s=stmt.test(txt),m=terms.test(txt);
  if(a)nAcct++; if(b)nBroker++; if(s)nStmt++; if(m)nTerms++;
  if(a||b||s||m){any++; if(ex.length<12)ex.push({h:h.slice(0,10),a,b,s,m,sample:txt.replace(/\s+/g,' ').slice(0,110)});}
  else ok++;
}
console.log('ocr image records',keys.length,'empty',empty);
console.log('long digit run      :',nAcct);
console.log('broker name         :',nBroker);
console.log('statement words     :',nStmt);
console.log('terminal/account hdr:',nTerms);
console.log('flagged images      :',any,'   clean images:',ok);
console.log('--- examples ---');
for(const e of ex)console.log(JSON.stringify(e));
