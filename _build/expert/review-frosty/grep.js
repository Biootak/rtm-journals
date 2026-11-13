const fs=require("fs");
const dir="batches";
for(const f of process.argv.slice(2)){
  const s=fs.readFileSync(dir+"/"+f,"utf8");
  console.log("=== "+f);
  for(const pat of ["کپ","kink","اوریجین","رانر","میله"," SL","TP","معامله‌گران خرد","پرچم"]){
    let idx=0,c=0;
    while((idx=s.indexOf(pat,idx))!==-1&&c<5){
      console.log(" ",pat,"=>",s.slice(Math.max(0,idx-40),idx+45).replace(/\n/g," "));
      idx+=pat.length;c++;
    }
  }
}
