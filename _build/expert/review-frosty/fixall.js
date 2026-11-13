const fs=require("fs");
function apply(file,repls){
  const bf="batches/"+file;
  const b=JSON.parse(fs.readFileSync(bf,"utf8"));
  let total=0;
  for(const h in b){
    let nt=b[h];
    for(const [o,n] of repls){
      const c=nt.split(o).length-1;
      if(c){nt=nt.split(o).join(n);total+=c;}
    }
    nt=nt.replace(/\bkink\b/g,"پیچش").replace(/\bSL\b/g,"استاپ‌لاس").replace(/\bTP\b/g,"تارگت");
    b[h]=nt;
  }
  fs.writeFileSync(bf,JSON.stringify(b,null,1)+"\n");
  console.log(file,"done,",total,"explicit + regex pass");
}
apply("frosty-p1.json",[["معامله‌گران خرد","خرده‌معامله‌گران"]]);
apply("frosty-p10.json",[["معامله‌گران خرد","خرده‌معامله‌گران"]]);
apply("frosty-p7.json",[
 ["کپ‌های قیمت","سقف‌های قیمت"],["کپ‌هایی","سقف‌هایی"],["کپ‌ها","سقف‌ها"],
 ["کپ قیمت","سقف قیمت"],["کپ","سقف"],
 ["معامله‌گران خرد","خرده‌معامله‌گران"]
]);
apply("frosty-p9.json",[
 ["اوریجین","مبدأ"],["رانر","معاملهٔ بازمانده"],["یک میله (گپ LQ","یک POLE (گپ LQ"]
]);
