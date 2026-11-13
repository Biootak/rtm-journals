const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..','..','..');
const WORK=path.join(ROOT,'_build','expert','work');
const BAT=path.join(ROOT,'_build','expert','batches');
const rejects=`academylite1_p4_90|echo
academylite2_p3_60|echo
academylite2_p3_61|echo
academylite2_p4_94|echo
andrew_p5_104|num
art_p1_18|echo
art_p13_315|echo
art_p14_340|no-persian
art_p14_341|no-persian
art_p14_343|no-persian
art_p14_344|heads
art_p14_345|no-persian
art_p14_347|no-persian
cancan_p3_57|no-persian
constantine_p2_45|para
constantine_p3_66|echo
constantine_p3_68|rambling
constantine_p5_105|echo
constantine_p5_119|echo
constantine_p5_121|echo
constantine_p8_184|echo
dbrrbd_p28_694|echo
dbrrbd_p28_699|echo
dbrrbd_p28_700|echo
dbrrbd_p43_1063|echo
dbrrbd_p44_1086|latex
dbrrbd_p59_1457|num
dbrrbd_p61_1525|echo
dbrrbd_p62_1527|echo
dbrrbd_p63_1566|echo
dbrrbd_p65_1617|ech
doctorpatient_p27_673|echo
drswing_p12_288|no-persian
drswing_p2_50|rambling
frosty_p12_10|echo
ftrpaz_p2_35|echo
ftrpaz_p3_63|echo
gembel_p18_450|echo
hgblacksheep_p1_22|echo
hgblacksheep_p8_199|echo
hgblacksheep_p9_210|echo
hgblacksheep_p9_214|echo
if_p117_2|echo
if_p41_13|num
if_p41_15|num
if_p41_17|num
if_p47_5|echo
ignoredlevel_p3_73|echo
its_p1_24|echo
its_p2_26|num
its_p2_39|echo
jiri_p1_5|echo
jiri_p3_57|echo
jiri_p4_91|echo
jiri_p4_98|placeholder
jiri_p4_100|placeholder
jiri_p5_102|placeholder
jiri_p5_106|placeholder
jiri_p5_118|echo
jiri_p8_193|echo
jiri_p9_211|ech
newjournal_p11_263|echo
newjournal_p2_30|echo
newjournal_p3_55|echo
newjournal_p4_89|echo
newjournal_p4_90|echo
newjournal_p4_96|echo
newjournal_p5_120|echo
newjournal_p7_155|echo
newjournal_p9_223|echo
pedini_p3_10|para
projectsagana_p9_221|echo
readingsession_p4_102|echo
readingsession_p5_127|echo
readingsession_p7_196|echo
robbie_p1_20|para
robbie_p1_21|para
robbie_p3_56|echo
robbie_p3_60|echo
robbie_p3_65|echo
robbie_p8_183|echo
robbie_p9_213|no-persian
salivan_p32_4|echo
shadowpit_p7_165|echo
sunnytrader_p1_7|echo
sunnytrader_p1_12|echo
sunnytrader_p1_13|echo
sunnytrader_p2_38|echo
sunnytrader_p8_179|echo
sunnytrader_p8_188|echo
sunnytrader_p9_215|echo
warren_p10_226|echo
warren_p10_232|echo
warren_p4_76|echo
warren_p7_170|no-persian
warren_p9_208|echo
warren_p9_210|no-persian
warren_p9_225|echo
whenever_p2_46|echo
whenever_p6_135|num
whenever_p6_136|num
whenever_p6_138|num
whenever_p6_139|num
whenever_p6_140|num
whenever_p6_143|num
whenever_p6_148|num
whenever_p7_169|echo
whenever_p8_177|echo
whenever_p8_181|echo
whynotwork_p1_4|echo
whynotwork_p2_33|echo
whynotwork_p4_84|echo`.split('\n').filter(Boolean);
const cache={};
for(const line of rejects){
  const [id,why]=line.split('|');
  const m=id.match(/^(.*)_p(\d+)_(\d+)$/);
  const base=m[1]+'-p'+m[2];
  const key=base;
  if(!cache[key]){
    try{cache[key]={work:JSON.parse(fs.readFileSync(path.join(WORK,key+'.json'),'utf8')),batch:JSON.parse(fs.readFileSync(path.join(BAT,key+'.json'),'utf8'))};}
    catch(e){console.log('NOFILE '+base+' '+e.message);continue;}
  }
  const {work,batch}=cache[key];
  const w=work.find(x=>x.id===id);
  if(!w){console.log('NOTFOUND '+id);continue;}
  console.log('===== '+id+' ['+base+'] '+why+' =====');
  console.log('HASH '+w.hash);
  console.log('--- EN ---');console.log(w.text);
  console.log('--- FA ---');console.log(batch[w.hash]||'(MISSING)');
}
