const fs=require('fs');
const s=fs.readFileSync('site/data/posts.js','utf8');
const rows=JSON.parse(s.slice(s.indexOf('=[')+1,s.lastIndexOf(']')+1));
const accNum=/\b\d{7,10}\b/;
const broker=/roboforex|alpari|forex4u|exness|xm\b|amarketing|instamarket|alpakant|liteforex|fbs\b|okx|binance/i;
const money=/(بالانس|اکوئیتی|مانده|مارجین|حساب (شماره|قدرت)|سود خالص|ضرر خالص|وین‌ریت|دارایی)/;
const moneyEn=/(account\s*(number|equity|balance)|net profit|gross loss|balance:|equity:)/i;
let nAcc=0,nBroker=0,nMoney=0,nAny=0,clean=0,withImg=0,cleanWithImg=0;
for(const r of rows){
  const txt=(r[5]||'')+'\n'+(typeof r[7]==='string'?r[7]:'');
  const a=accNum.test(txt), b=broker.test(txt), m=money.test(txt)||moneyEn.test(txt);
  if(a)nAcc++; if(b)nBroker++; if(m)nMoney++;
  if(a||b||m)nAny++; else clean++;
  if(r[6]>0){withImg++; if(!(a||b||m))cleanWithImg++;}
}
console.log('posts total',rows.length);
console.log('with >=7-digit number :',nAcc);
console.log('with broker name      :',nBroker);
console.log('with money/label text  :',nMoney);
console.log('ANY of the three       :',nAny,'  clean:',clean);
console.log('posts with images      :',withImg,'  of which clean:',cleanWithImg);
