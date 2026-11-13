// usage: node review-frosty/merge.js p<N>  -> applies review-frosty/fixes-p<N>.json into batches/frosty-p<N>.json
const fs=require("fs");
const p=process.argv[2];
const fixes=JSON.parse(fs.readFileSync(`review-frosty/fixes-${p}.json`,"utf8"));
const bf=`batches/frosty-${p}.json`;
const b=JSON.parse(fs.readFileSync(bf,"utf8"));
let n=0, missing=[];
for(const [h,t] of Object.entries(fixes)){
  if(h in b){b[h]=t;n++;}else missing.push(h);
}
fs.writeFileSync(bf, JSON.stringify(b,null,1)+"\n");
console.log(`applied ${n} fixes to ${bf}${missing.length?" MISSING:"+missing.join(","):""}`);
