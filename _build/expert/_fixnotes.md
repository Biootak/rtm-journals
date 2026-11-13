# Fix notes — QA review of 10 journals' batches
# Status: mechanical check done (_review_check.py, flags in _review_flags.json).
# Semantic review in progress. Dumps in _dump/<jid>.txt (EN/FA pairs).

## DONE reviewing: mukhcin, aran, benhur, homeoffinisher(partial->done soon)

## FIXES TO APPLY (journal, post-id, hash, issue)
1. mukhcin_p1_13 / hash 1fb470b09c1f5c3817ee25c92af6e709e3b527cf:
   FA wrongly «وقتی بازار می‌خواهد بفروشد» for "when ITs want to sell" -> should be ITs;
   and garbled sentence for "I used to think that breaking important areas create a strong bounce during FTB to the strong FL made".
2. mukhcin_p6_21 / e670a39476a27cd1d4ac3a240ce2962c45c0b02d and
   mukhcin_p6_23 / 4080a1c8cafc990e544a4ef62fd35fd01cfad312:
   «لحظهٔ «یافتم»» -> «لحظهٔ Eureka» (appears twice in p6_23 incl. quoted copy).
3. omidfx پرچم->فلگ (rule bans پرچم for flag/FL) in:
   - p4 hash 1f845b8ba485fe704a6814aa3f091ca3aa88dfca («یک پرچم صعودی» -> «یک فلگ صعودی»)
   - p5 hashes 0492f155808e99d8a75e4615f598f08a71729cd7 («خود پرچم»),
     868a990363716df9d12b46db6b7c231e1440a23c («چند پرچم»),
     9f4eec992849128ff9467d0f9df43e5a7d0f5672 («چند پرچم»)
   - p6 hashes fcbc7ed6dde0e3fc9073a75015208d23e704c9d0 (4x پرچم),
     a03bee19a22ad0671316b5001f0686f1230dfd48 (2x پرچم)
   Also omidfx_p6 fcbc7ed6: "the origins" -> «اورجین‌ها» borderline; leave.
4. edges_p5_2: "U2 mate" -> FA dropped U2; restore («U2 رفیق» or «رفیق U2»). Need hash from work/edges-p5.json.
5. homeoffinisher_p8_176: Persian digit «۱ ساعته» -> «1 ساعته». Need hash.
6. omidfx_p8_20: "30 nov" -> «30 نوامبر» (minor; decide).
7. benhur_p3_13: «نصف در شکست ناکام عرضه + cp» -> «نصف هنگام شکست ناموفق عرضه + cp» (minor).

## Still to review: homeoffinisher tail, linos, mel, michal238, omidfx, vitaldrug, edges
## Apply fixes via python script editing batch JSON (indent=1, ensure_ascii=False), then re-run _review_check.py.

## homeoffinisher fixes (hashes from p8/p9 work files - fill via script by post id)
- p8_176: «۱ ساعته» -> «1 ساعته» (Persian digit)
- p8_179/p8_180: «دیماند» -> «تقاضا»; «order bookها» -> «دفترهای سفارش»; «breakout» Latin -> «شکست»; awkward «نه نه به هیچ فرضیه‌ای برای breakout»
- p8_182: «analysis paralysis» -> «فلج تحلیلی»
- p8_186: half-English FA — rewrite: Origin->مبدأ, engulf->اینگالف, limit->محدوده, qualify->واجد شرایط, tg->تارگت, bulls->گاوها
- p9_206: colloquial «می‌تونیم/رو/رفتن» -> formal
- p9_208: «یه مطالعه» -> «یک مطالعه»
- p9_209: «نیست،،» double comma fix
- p9_211: «داره می‌گیره» -> «دارد ... می‌گیرد»

## linos (reviewed, fixes):
- kink translated inconsistently: «خمیدگی» in p6_7, p6_9, p9_17, p9_18 vs «کینک» elsewhere -> normalize to «کینک» (get hashes via work files).
- p9_12: "flag" Latin inside prose — acceptable? it's generic word; leave.

## REVIEW STATUS (updated)
DONE full review: mukhcin, aran, benhur, homeoffinisher, linos, mel
IN PROGRESS: edges (p1 read, need p2-p8)
TODO: vitaldrug, omidfx, michal238
## edges notes so far: quality good; p1_8 flag NUMMISS '3' -> check "3D phase" FA «مرحلهٔ سه‌بعدی» contains no digit 3? FA has «سه‌بعدی» spelled out -> fix to «3D» or «سه‌بعدی»? Rule: numbers Latin -> «مرحلهٔ 3بعدی» awkward; better «مرحلهٔ سه‌بعدی» acceptable? NUMMISS flags EN '3' missing in FA -> use «3D».
