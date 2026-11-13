# چک‌لیست بازبینی ترجمه — کل آرشیو

تولید: 2026-11-12 14:20 — منبع: `parsed.json`, `batches/`, `review/`, `strict-report.json`, `reviewed.json`.

## پیشرفت

- پست‌های دارای متن: **34,354** در **1,485** صفحه و **89** ژورنال/تاپیک
- ترجمهٔ کامل (فایل دسته + انبار): **34,354** پست — 100.0%؛ هیچ صفحه‌ای ناقص نیست
- بازبینی معنایی این کارزار: **1485** صفحه از 1485 (100.0%) — در جریان
- بازبینی‌شده با نقص باز: **0** صفحه
- نقص‌های اعمال‌شده در این کارزار: **13414**
- سابقهٔ بازبینی دورهٔ اول (verdict قبلی): **547** صفحه — معیار پیشرفت این کارزار نیست
- نقص‌های واقعی که دورهٔ اول پیدا و اعمال کرد: **715**
- پست‌های نشان‌دار اسکن سخت‌گیرانه: **8,965** (کاندید بازبینی، نه حکم قطعی)

علامت‌ها: `[ ]` بازبینی‌نشده · `[~]` بازبینی‌شده با نقص باز · `[x]` بازبینی‌شده و پاک.
شمارهٔ «suspects» از `audit-strict.js` می‌آید: لاتین باقی‌مانده، پرانتز ناهماهنگ، اختلاف پاراگراف، خط غیرلاتین.

## نقطهٔ شروع — اولویت ۱ (if)

if آخرین ژورنالی است که verdict دورهٔ اول را برای هر ۱۳۹ صفحه دارد، پس این کارزار یک بازبینی دوم و سخت‌گیرانه‌تر است: همان ۷۳۸ پست suspects باید تک‌تک با انگلیسی مقایسه شوند.
ترتیب پیشنهادی: صفحه‌های پرحاشیه‌تر اول، بعد بقیه به ترتیب شماره.

```bash
node _build/expert/audit-strict.js --write --page if-p17   # اسکن همان صفحه
node _build/expert/review-dump.js if-p17                   # متن انگلیسی و فارسی کنار هم
node _build/expert/review-checklist.js --mark if-p17 --verdict clean
```

## وضعیت ژورنال‌ها

| ژورنال | صفحه | پست | ترجمه | بازبینی این کارزار | سابقهٔ دورهٔ اول | نقص دورهٔ اول | suspects | نقص این کارزار |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| if | 139 | 3401 | 100.0% | 139/139 | 139/139 | 199 | 473 | 597 |
| hs | 95 | 2338 | 100.0% | 95/95 | 2/95 | 9 | 838 | 1445 |
| dbrrbd | 66 | 1485 | 100.0% | 66/66 | 2/66 | 3 | 323 | 382 |
| supplydemand | 59 | 1436 | 100.0% | 59/59 | 1/59 | 7 | 297 | 643 |
| flaglimits | 53 | 1270 | 100.0% | 53/53 | 3/53 | 7 | 315 | 695 |
| quasimodo | 52 | 1220 | 100.0% | 52/52 | 5/52 | 11 | 237 | 431 |
| gembel | 48 | 1197 | 100.0% | 48/48 | 0/48 | 0 | 376 | 703 |
| classroom | 49 | 1196 | 100.0% | 49/49 | 4/49 | 8 | 370 | 618 |
| aboutcompression | 50 | 1179 | 100.0% | 50/50 | 4/50 | 14 | 244 | 435 |
| salivan | 46 | 1020 | 100.0% | 46/46 | 46/46 | 39 | 154 | 217 |
| alex | 36 | 818 | 100.0% | 36/36 | 2/36 | 2 | 162 | 236 |
| doctorpatient | 31 | 758 | 100.0% | 31/31 | 0/31 | 0 | 329 | 391 |
| smimon | 29 | 716 | 100.0% | 29/29 | 0/29 | 0 | 176 | 517 |
| pedini | 24 | 579 | 100.0% | 24/24 | 24/24 | 12 | 173 | 248 |
| jurij | 24 | 576 | 100.0% | 24/24 | 14/24 | 18 | 58 | 212 |
| staurum | 23 | 547 | 100.0% | 23/23 | 19/23 | 28 | 132 | 180 |
| josh | 24 | 523 | 100.0% | 24/24 | 0/24 | 0 | 186 | 270 |
| amit | 22 | 497 | 100.0% | 22/22 | 0/22 | 0 | 83 | 183 |
| drswing | 20 | 480 | 100.0% | 20/20 | 0/20 | 0 | 100 | 177 |
| astrokillah | 19 | 469 | 100.0% | 19/19 | 17/19 | 26 | 61 | 87 |
| projectsagana | 19 | 448 | 100.0% | 19/19 | 1/19 | 0 | 99 | 125 |
| lespaul | 18 | 434 | 100.0% | 18/18 | 18/18 | 38 | 77 | 95 |
| kruger | 21 | 420 | 100.0% | 21/21 | 21/21 | 5 | 54 | 127 |
| shadowpit | 15 | 356 | 100.0% | 15/15 | 0/15 | 0 | 117 | 72 |
| newjournal | 15 | 351 | 100.0% | 15/15 | 0/15 | 0 | 82 | 120 |
| mm | 16 | 337 | 100.0% | 16/16 | 16/16 | 3 | 25 | 34 |
| sniffing | 14 | 336 | 100.0% | 14/14 | 14/14 | 10 | 91 | 51 |
| art | 15 | 311 | 100.0% | 15/15 | 1/15 | 6 | 36 | 80 |
| hgblacksheep | 13 | 309 | 100.0% | 13/13 | 0/13 | 0 | 213 | 131 |
| sunnytrader | 13 | 306 | 100.0% | 13/13 | 0/13 | 0 | 88 | 182 |
| frosty | 13 | 300 | 100.0% | 13/13 | 13/13 | 15 | 75 | 54 |
| eurotrash | 13 | 281 | 100.0% | 13/13 | 0/13 | 0 | 64 | 152 |
| mertch | 13 | 278 | 100.0% | 13/13 | 0/13 | 0 | 61 | 102 |
| engulf | 11 | 273 | 100.0% | 11/11 | 0/11 | 0 | 123 | 208 |
| finddecision | 13 | 270 | 100.0% | 13/13 | 0/13 | 0 | 66 | 167 |
| ftrretest | 12 | 267 | 100.0% | 12/12 | 1/12 | 2 | 121 | 171 |
| fulljournal | 11 | 260 | 100.0% | 11/11 | 11/11 | 8 | 34 | 52 |
| extremerrage | 11 | 257 | 100.0% | 11/11 | 11/11 | 0 | 43 | 27 |
| fishing | 11 | 250 | 100.0% | 11/11 | 5/11 | 5 | 100 | 187 |
| jiri | 11 | 248 | 100.0% | 11/11 | 0/11 | 0 | 125 | 11 |
| omidfx | 10 | 248 | 100.0% | 10/10 | 10/10 | 4 | 70 | 12 |
| in2forex | 11 | 247 | 100.0% | 11/11 | 0/11 | 0 | 110 | 106 |
| vitaldrug | 10 | 245 | 100.0% | 10/10 | 10/10 | 7 | 43 | 61 |
| readingsession | 10 | 240 | 100.0% | 10/10 | 2/10 | 16 | 103 | 249 |
| warren | 11 | 238 | 100.0% | 11/11 | 1/11 | 0 | 85 | 98 |
| rinehart | 13 | 230 | 100.0% | 13/13 | 13/13 | 18 | 31 | 63 |
| robbie | 10 | 228 | 100.0% | 10/10 | 0/10 | 0 | 134 | 164 |
| diamond | 10 | 227 | 100.0% | 10/10 | 2/10 | 2 | 130 | 242 |
| 3drive | 10 | 223 | 100.0% | 10/10 | 1/10 | 0 | 119 | 91 |
| michal238 | 11 | 219 | 100.0% | 11/11 | 11/11 | 10 | 32 | 14 |
| linos | 9 | 215 | 100.0% | 9/9 | 9/9 | 4 | 21 | 56 |
| luska | 9 | 206 | 100.0% | 9/9 | 1/9 | 3 | 146 | 140 |
| paz | 9 | 200 | 100.0% | 9/9 | 0/9 | 0 | 100 | 127 |
| pucci | 8 | 194 | 100.0% | 8/8 | 0/8 | 0 | 111 | 106 |
| scotty | 8 | 193 | 100.0% | 8/8 | 0/8 | 0 | 88 | 84 |
| benhur | 9 | 192 | 100.0% | 9/9 | 9/9 | 5 | 39 | 55 |
| mukhcin | 9 | 191 | 100.0% | 9/9 | 9/9 | 2 | 76 | 41 |
| edges | 8 | 179 | 100.0% | 8/8 | 8/8 | 0 | 36 | 43 |
| constantine | 8 | 175 | 100.0% | 8/8 | 2/8 | 9 | 36 | 119 |
| homeoffinisher | 9 | 163 | 100.0% | 9/9 | 1/9 | 4 | 42 | 19 |
| whenever | 8 | 162 | 100.0% | 8/8 | 1/8 | 1 | 77 | 98 |
| aran | 8 | 161 | 100.0% | 8/8 | 8/8 | 2 | 28 | 43 |
| mel | 7 | 158 | 100.0% | 7/7 | 7/7 | 0 | 79 | 34 |
| einrikr | 6 | 126 | 100.0% | 6/6 | 6/6 | 0 | 16 | 6 |
| academylite1 | 6 | 125 | 100.0% | 6/6 | 0/6 | 0 | 21 | 30 |
| capnp | 6 | 121 | 100.0% | 6/6 | 0/6 | 0 | 49 | 14 |
| andrew | 5 | 120 | 100.0% | 5/5 | 4/5 | 1 | 24 | 25 |
| whynotwork | 5 | 106 | 100.0% | 5/5 | 0/5 | 0 | 67 | 79 |
| fxeyes | 5 | 105 | 100.0% | 5/5 | 5/5 | 1 | 35 | 130 |
| ftrpaz | 4 | 98 | 100.0% | 4/4 | 1/4 | 1 | 40 | 64 |
| academylite2 | 4 | 96 | 100.0% | 4/4 | 0/4 | 0 | 35 | 25 |
| bsz | 5 | 90 | 100.0% | 5/5 | 1/5 | 3 | 9 | 10 |
| ignoredlevel | 3 | 69 | 100.0% | 3/3 | 0/3 | 0 | 24 | 25 |
| moneydeep | 3 | 61 | 100.0% | 3/3 | 3/3 | 1 | 18 | 18 |
| its | 3 | 59 | 100.0% | 3/3 | 1/3 | 0 | 36 | 45 |
| cancan | 3 | 53 | 100.0% | 3/3 | 3/3 | 9 | 12 | 7 |
| flaglimitshydra | 3 | 51 | 100.0% | 3/3 | 3/3 | 34 | 2 | 9 |
| knowledgeismoney | 2 | 46 | 100.0% | 2/2 | 2/2 | 24 | 6 | 5 |
| dissection | 2 | 43 | 100.0% | 2/2 | 2/2 | 20 | 16 | 4 |
| pg | 2 | 41 | 100.0% | 2/2 | 2/2 | 9 | 2 | 4 |
| jc | 2 | 36 | 100.0% | 2/2 | 2/2 | 8 | 9 | 5 |
| bill | 2 | 35 | 100.0% | 2/2 | 2/2 | 0 | 10 | 3 |
| cppaz | 2 | 34 | 100.0% | 2/2 | 2/2 | 14 | 7 | 4 |
| fakeouts | 2 | 29 | 100.0% | 2/2 | 2/2 | 13 | 2 | 6 |
| sdcleared | 2 | 29 | 100.0% | 2/2 | 2/2 | 11 | 5 | 5 |
| enquiry | 2 | 23 | 100.0% | 2/2 | 2/2 | 3 | 2 | 3 |
| maxpain | 1 | 15 | 100.0% | 1/1 | 1/1 | 0 | 0 | 4 |
| dplocation | 1 | 9 | 100.0% | 1/1 | 1/1 | 1 | 0 | 3 |
| rinehartfl | 2 | 3 | 100.0% | 2/2 | 1/2 | 0 | 1 | 1 |

## اولویت ۱ — if — If

139 صفحه / 3401 پست — بازبینی 139 · سابقه 139 · suspects 473

پرحاشیه‌ترین صفحه‌ها: if-p56 (11) · if-p94 (9) · if-p12 (8) · if-p22 (8) · if-p79 (8) · if-p38 (7) · if-p50 (7) · if-p70 (7)

- [x] if-p1 — 25 posts · 2 suspects · pass-1 verdict · 5 fixed · pass2: altruism->فداکاری, I doubt calque, well-oiled machine, get stuck in
- [x] if-p2 — 25 posts · 5 suspects · pass-1 verdict · pass2: clean, quotes synced
- [x] if-p3 — 25 posts · 4 suspects · pass-1 verdict · 3 fixed · pass2: for-argument sake calque, prints->چاپ کند, take out->گرفتن ambiguous
- [x] if-p4 — 25 posts · 4 suspects · pass-1 verdict · 3 fixed · pass2: فشرده‌سازی->فشردگی, day trade calque, dbd decision phrasing
- [x] if-p5 — 25 posts · 3 suspects · pass-1 verdict · 3 fixed · pass2: attachment line back to Latin, shoot away calque, PA ENG->اینگالف, emoticon drift
- [x] if-p6 — 24 posts · 3 suspects · pass-1 verdict · 3 fix pass-1 · 3 fixed · pass2: quote drift vs if_p5_25 canonical, significance->سنگین‌تر mistranslation
- [x] if-p7 — 24 posts · 3 suspects · pass-1 verdict · 2 fix pass-1 · 2 fixed · pass2: quote drift cook/bottlewasher, فشرده‌سازی->فشردگی
- [x] if-p8 — 24 posts · 6 suspects · pass-1 verdict · 1 fix pass-1 · 3 fixed · pass2: birthday quote wording synced, جان بفهم->بفهم
- [x] if-p9 — 24 posts · 4 suspects · pass-1 verdict · 4 fix pass-1 · 1 fixed · pass2: quote drift on 40-something-% post synced to canonical
- [x] if-p10 — 23 posts · 4 suspects · pass-1 verdict · 2 fixed · pass2: two quote drifts synced to canonical posts
- [x] if-p11 — 25 posts · 1 suspects · pass-1 verdict · 12 fixed · pass2: Associates rank, touch trade, kaboom-free idioms, hay-while-sun-shines, missing question mark
- [x] if-p12 — 24 posts · 8 suspects · pass-1 verdict · 2 fixed · pass2: fulfilling life, kaboom->explosion, FTR feel phrasing
- [x] if-p13 — 25 posts · 2 suspects · pass-1 verdict · 23 fixed · pass2: systematic ZWNJ normalization + Associates rank fix
- [x] if-p14 — 24 posts · 6 suspects · pass-1 verdict · 1 fix pass-1 · 7 fixed · pass2: idioms (factors/flag respect/plague/hay/rabbit hole/keys)
- [x] if-p15 — 25 posts · 2 suspects · pass-1 verdict · 3 fix pass-1 · 2 fixed · pass2: silent observer wording
- [x] if-p16 — 25 posts · 5 suspects · pass-1 verdict · 3 fix pass-1 · 4 fixed · pass2: edit-needed phrasing, too-good-to-be-true
- [x] if-p17 — 25 posts · 4 suspects · pass-1 verdict · 2 fix pass-1 · 3 fixed · pass2: bucketshop idiom, stray parenthetical, cold-trading phrasing
- [x] if-p18 — 25 posts · 4 suspects · pass-1 verdict · 4 fix pass-1 · 2 fixed · pass2: shoulders->backs idiom, fascinating
- [x] if-p19 — 25 posts · 2 suspects · pass-1 verdict · 3 fixed · pass2: MM mindset phrasing, may-I-know calque
- [x] if-p20 — 25 posts · 3 suspects · pass-1 verdict · 1 fix pass-1 · 2 fixed · pass2: forum URL ellipsis, Croatia joke
- [x] if-p21 — 25 posts · 4 suspects · pass-1 verdict · 2 fix pass-1 · 6 fixed · pass2: idiom/terminology fixes
- [x] if-p22 — 25 posts · 8 suspects · pass-1 verdict · 3 fix pass-1 · 5 fixed · pass2: request/kudos/register fixes
- [x] if-p23 — 25 posts · 4 suspects · pass-1 verdict · 1 fix pass-1 · 5 fixed · pass2: quiz/FTR/Price Action fixes
- [x] if-p24 — 24 posts · 1 suspects · pass-1 verdict · 2 fix pass-1 · 5 fixed · pass2: pole/idiom fixes
- [x] if-p25 — 24 posts · 2 suspects · pass-1 verdict · 1 fix pass-1 · 8 fixed · pass2: ENG/bids/Price Action fixes
- [x] if-p26 — 24 posts · 2 suspects · pass-1 verdict · 2 fix pass-1 · 9 fixed · pass2: quiz/Academy/Fund/slang fixes
- [x] if-p27 — 23 posts · 6 suspects · pass-1 verdict · 2 fixed · pass2: rollicking/surprises fixes
- [x] if-p28 — 24 posts · 4 suspects · pass-1 verdict · 1 fixed · pass2: birthday register fix
- [x] if-p29 — 24 posts · 1 suspects · pass-1 verdict · 4 fixed · pass2: payment/dead-end/feedback fixes
- [x] if-p30 — 25 posts · 2 suspects · pass-1 verdict · 11 fixed · pass2: idiom/terminology/quote-sync fixes
- [x] if-p31 — 25 posts · 4 suspects · pass-1 verdict · 2 fix pass-1 · 3 fixed · pass2: smoothed PA-candles calque, fixed error-of-ways phrasing, restored hurt intensity in 'will hurt candle traders'
- [x] if-p32 — 24 posts · 1 suspects · pass-1 verdict · 1 fix pass-1 · 3 fixed · pass2: clarified 'why I keep coming back', restored derogation of jammy gits, fixed Present-section wording
- [x] if-p33 — 25 posts · pass-1 verdict · 7 fixed · pass2: swap mistranslated as position-swap fixed, dealing-desk term, context=زمینه, praise and question flow smoothed
- [x] if-p34 — 25 posts · 4 suspects · pass-1 verdict · 5 fixed · pass2: synced stale quote block to p33 canonical (swap level), fixed fly-fart/knowledge-own/knack calques, Den Hague->لاهه
- [x] if-p35 — 25 posts · 4 suspects · pass-1 verdict · 1 fix pass-1 · 4 fixed · pass2: truly-humbling calque fixed, DP-break phrasing, truth-in-observation idiom, unsurmountable-inbox wording
- [x] if-p36 — 25 posts · 2 suspects · pass-1 verdict · 1 fix pass-1 · 6 fixed · pass2: quote drift on p36_14 synced to canonical, discouraged-vs-disgraceful typo resolved, quasimodo=QM, community-measure calque, retail-sellers fidelity
- [x] if-p37 — 25 posts · 1 suspects · pass-1 verdict · 7 fixed · pass2: synced 3 stale nested quote blocks (p36 chain, QM, ftr->FTR, subjective line), pole->پایه, confidence idiom, stab-at trim
- [x] if-p38 — 25 posts · 7 suspects · pass-1 verdict · 1 fix pass-1 · 5 fixed · pass2: flag->فلگ, pole->پایه + فشردگی (فشرده‌سازی banned), touch trade->ورود با تاچ سطح, read-ability phrasing, quote synced
- [x] if-p39 — 25 posts · 5 suspects · pass-1 verdict · 3 fix pass-1 · 2 fixed · pass2: engulf-version parenthetical clarified, FLAG->فلگ
- [x] if-p40 — 25 posts · 2 suspects · pass-1 verdict · 2 fix pass-1 · 5 fixed · pass2: FLAG->فلگ throughout, preflag->پیش‌فلگ, consolidation->تثبیت, quote synced
- [x] if-p41 — 25 posts · 5 suspects · pass-1 verdict · 3 fix pass-1 · 3 fixed · pass2: calques (half cent, spanking trade, fire in belly), Hachiko phrasing
- [x] if-p42 — 24 posts · 3 suspects · pass-1 verdict · 5 fix pass-1 · 1 fixed · pass2: URL ellipsis not byte-identical
- [x] if-p43 — 25 posts · 4 suspects · pass-1 verdict · 3 fix pass-1 · 5 fixed · pass2: 2 URL ellipses, fallout, hamish quote (forward guidance/revaluation/strip serfs), goad
- [x] if-p44 — 25 posts · 1 suspects · pass-1 verdict · 1 fix pass-1 · 5 fixed · pass2: bait-and-switch calque, masterclass, 4 URL ellipses, Flag->فلگ
- [x] if-p45 — 25 posts · 2 suspects · pass-1 verdict · 3 fixed · pass2: warm birthday calque, legend-born calque, rinse&repeat/FL-be-FTR/mentally-get-past
- [x] if-p46 — 25 posts · 4 suspects · pass-1 verdict · 1 fix pass-1 · 1 fixed · pass2: same Rdk123 post fixes (rinse&repeat, FL-be-FTR, get-past)
- [x] if-p47 — 25 posts · 4 suspects · pass-1 verdict · 2 fix pass-1 · 3 fixed · pass2: screwed-me/blowing-smoke/ride calques, consistency+strugglers
- [x] if-p48 — 25 posts · 3 suspects · pass-1 verdict · 5 fix pass-1 · 5 fixed · pass2: ruffle-feathers, tearing-hair-out x3 quotes, count-me-in
- [x] if-p49 — 25 posts · 2 suspects · pass-1 verdict · 1 fixed · pass2: associates rank -> اعضای Associate
- [x] if-p50 — 24 posts · 7 suspects · pass-1 verdict · 3 fixed · pass2: absolutely->واقعاً, by-any-chance, during-or-just-before
- [x] if-p51 — 25 posts · 4 suspects · pass-1 verdict · 2 fix pass-1 · pass2: clean
- [x] if-p52 — 25 posts · 3 suspects · pass-1 verdict · 1 fixed · pass2: fingers-and-toes-crossed calque -> قفل کرده‌ام
- [x] if-p53 — 25 posts · 3 suspects · pass-1 verdict · 1 fixed · pass2: social exchange calque -> داد و ستد
- [x] if-p54 — 25 posts · 3 suspects · pass-1 verdict · 1 fix pass-1 · 5 fixed · pass2: ماده->محتوا x3, eng north calque, FLAG->فلگ
- [x] if-p55 — 24 posts · pass-1 verdict · 2 fix pass-1 · 3 fixed · pass2: naturalness fixes (level visited quote x2, prime case)
- [x] if-p56 — 25 posts · 11 suspects · pass-1 verdict · 2 fix pass-1 · 7 fixed · pass2: flag->فلگ x2, ppgolf quote meaning fix x5, screen->صفحه‌نمایش
- [x] if-p57 — 25 posts · 4 suspects · pass-1 verdict · 4 fixed · pass2: book title x3 (quote sync), dart question naturalness
- [x] if-p58 — 25 posts · 1 suspects · pass-1 verdict · 1 fixed · pass2: bear candle -> کندل نزولی
- [x] if-p59 — 25 posts · 1 suspects · pass-1 verdict · 2 fix pass-1 · 4 fixed · pass2: Blue Dot project name -> Latin x3 posts (quote sync), hat idiom
- [x] if-p60 — 25 posts · 3 suspects · pass-1 verdict · pass2: clean
- [x] if-p61 — 25 posts · 5 suspects · pass-1 verdict · 1 fix pass-1 · 3 fixed · pass2: idioms proof-of-pudding/kick/gold-nugget; rocket-scientist phrasing
- [x] if-p62 — 25 posts · 6 suspects · pass-1 verdict · 4 fix pass-1 · 3 fixed · pass2: hit-the-nail calque, movie->w_video kept, kill R/r idiom
- [x] if-p63 — 25 posts · 3 suspects · pass-1 verdict · 2 fix pass-1 · 6 fixed · pass2: sickens-me idiom, FLAG->فلگ, additional->اضافی, bastard->بدجنس
- [x] if-p64 — 25 posts · 2 suspects · pass-1 verdict · 2 fixed · pass2: no ching-and-datsu calque, spread-thinner->رقیق‌تر
- [x] if-p65 — 25 posts · 6 suspects · pass-1 verdict · 4 fixed · pass2: malarkey->حرف‌های الکی, throttle->اسکالپ, buckle-up idiom
- [x] if-p66 — 25 posts · 1 suspects · pass-1 verdict · 2 fix pass-1 · 6 fixed · pass2: ridiculous->دیوانه‌وار x2, QE acronym, variables phrasing, typical IF
- [x] if-p67 — 25 posts · 5 suspects · pass-1 verdict · 3 fixed · pass2: 2-cents->دو سنتی, double-edge->چاقوی دولبه, liquidity pools phrasing
- [x] if-p68 — 25 posts · 2 suspects · pass-1 verdict · 2 fix pass-1 · 5 fixed · pass2: rant wording (فول-ish group, بی‌ادعا, مزخرف‌فروش, WW3), throw-some-answer trio
- [x] if-p69 — 25 posts · 2 suspects · pass-1 verdict · 1 fixed · pass2: foibles->نکته‌های نه‌چندان پایدار
- [x] if-p70 — 25 posts · 7 suspects · pass-1 verdict · 3 fix pass-1 · 6 fixed · pass2: quote drift in nested smimon/DeepBlue/Ifmyante blocks, QM/MPL origin phrasing
- [x] if-p71 — 24 posts · 2 suspects · pass-1 verdict · 5 fix pass-1 · 6 fixed · pass2: calques (light/shorting/burdens), retracement mistranslation, subtitle, fable intro
- [x] if-p72 — 25 posts · 2 suspects · pass-1 verdict · 5 fix pass-1 · 2 fixed · pass2: dodgy->لق calque, یادمان دادی ambiguity
- [x] if-p73 — 25 posts · pass-1 verdict · 9 fix pass-1 · 3 fixed · pass2: pole->میله (now دکل), پرچم->فلگ, tricky-than-usual
- [x] if-p74 — 24 posts · 1 suspects · pass-1 verdict · 1 fix pass-1 · 2 fixed · pass2: awkward cry phrasing, CAP می‌کند calque
- [x] if-p75 — 25 posts · 2 suspects · pass-1 verdict · 6 fix pass-1 · 4 fixed · pass2: too-wrong-for-words idiom, جسارت نشه calque, pole->میله, Jurji typo, 。 drift
- [x] if-p76 — 25 posts · 7 suspects · pass-1 verdict · 3 fix pass-1 · 2 fixed · pass2: pole->میله x2, Muffler typo, فضاهای
- [x] if-p77 — 25 posts · 3 suspects · pass-1 verdict · 2 fix pass-1 · 6 fixed · pass2: pole->میله x5 (دکل), خرد‌ها plurals, thingy->گیر, sign-off; quote synced in p77_14
- [x] if-p78 — 25 posts · 4 suspects · pass-1 verdict · 8 fix pass-1 · 11 fixed · pass2: URL ellipsis+space x4 posts (synced quotes), فشرده‌سازی->فشردگی, pole->میله, M1-minute mistranslation, sign-offs
- [x] if-p79 — 25 posts · 8 suspects · pass-1 verdict · 5 fix pass-1 · 11 fixed · pass2: pole->میله x3 posts (synced), URL ellipsis x4 posts (synced), silver-platter calque, sign-off
- [x] if-p80 — 25 posts · 4 suspects · pass-1 verdict · 2 fix pass-1 · 4 fixed · pass2: pole->میله+تلویحی->ضمنی in syllabus, polluted-journal calque, lazy-birds calque, rule emphasis
- [x] if-p81 — 25 posts · 2 suspects · pass-1 verdict · 3 fix pass-1 · 6 fixed · pass2: idiom/terminology/quote-drift fixes
- [x] if-p82 — 25 posts · 5 suspects · pass-1 verdict · 7 fixed · pass2: idiom/terminology/quote-drift fixes
- [x] if-p83 — 25 posts · 5 suspects · pass-1 verdict · 7 fixed · pass2: idiom/terminology/quote-drift fixes
- [x] if-p84 — 25 posts · 3 suspects · pass-1 verdict · pass2: no defects found
- [x] if-p85 — 24 posts · 4 suspects · pass-1 verdict · 4 fixed · pass2: idiom/terminology/quote-drift fixes
- [x] if-p86 — 25 posts · 7 suspects · pass-1 verdict · 2 fix pass-1 · 12 fixed · pass2: idiom/terminology/quote-drift fixes
- [x] if-p87 — 25 posts · pass-1 verdict · 8 fixed · pass2: idiom/terminology/quote-drift fixes
- [x] if-p88 — 25 posts · 3 suspects · pass-1 verdict · 1 fix pass-1 · 5 fixed · pass2: idiom/terminology/quote-drift fixes
- [x] if-p89 — 25 posts · 5 suspects · pass-1 verdict · 1 fixed · pass2: idiom/terminology/quote-drift fixes
- [x] if-p90 — 25 posts · 5 suspects · pass-1 verdict · 1 fix pass-1 · 2 fixed · pass2: idiom/terminology/quote-drift fixes
- [x] if-p91 — 25 posts · 3 suspects · pass-1 verdict · 2 fix pass-1 · 3 fixed · pass2: fat-finger calque, tinfoil-hat/jeering, awkward SL quote
- [x] if-p92 — 24 posts · 4 suspects · pass-1 verdict · 1 fix pass-1 · 3 fixed · pass2: can't-imagine direction, lines->شعر, shoot-up calque
- [x] if-p93 — 25 posts · 5 suspects · pass-1 verdict · 4 fixed · pass2: trick translit, solstice, uniqueness, beatified
- [x] if-p94 — 25 posts · 9 suspects · pass-1 verdict · 4 fix pass-1 · 4 fixed · pass2: vibrant, owes-a-shit, retest, have-me-thinking
- [x] if-p95 — 22 posts · 1 suspects · pass-1 verdict · 1 fix pass-1 · 5 fixed · pass2: significant, Before, leftover Engulf/EG, take-to-heart
- [x] if-p96 — 23 posts · 5 suspects · pass-1 verdict · 2 fix pass-1 · 1 fixed · pass2: URL ellipsis drift jou… rnal -> jou...rnal
- [x] if-p97 — 25 posts · 5 suspects · pass-1 verdict · 1 fix pass-1 · 4 fixed · pass2: 3 URL ellipsis drifts, stray s->س, EG/shoot/retest
- [x] if-p98 — 25 posts · 3 suspects · pass-1 verdict · 1 fix pass-1 · 7 fixed · pass2: EG leftover, forums typo, price-approach Latin, drawing->نقاشی, cover-stop
- [x] if-p99 — 23 posts · 2 suspects · pass-1 verdict · 1 fix pass-1 · 1 fixed · pass2: leftover EG PA x3 -> اینگالف PA
- [x] if-p100 — 25 posts · 1 suspects · pass-1 verdict · 3 fixed · pass2: EG leftover, phrasing, healing->درمان
- [x] if-p101 — 25 posts · 1 suspects · pass-1 verdict · 3 fixed · pass2: symmetry idiom, jigga calque, 4xtradr connective
- [x] if-p102 — 25 posts · 2 suspects · pass-1 verdict · 3 fix pass-1 · 5 fixed · pass2: nod-of-approval calque, litany, stop-hunt term, MPL clause
- [x] if-p103 — 25 posts · 1 suspects · pass-1 verdict · 4 fixed · pass2: repetitious calque, meme tail, retrace dup, subscribing garble
- [x] if-p104 — 25 posts · 3 suspects · pass-1 verdict · 1 fix pass-1 · 2 fixed · pass2: compression term, RTM-there clause
- [x] if-p105 — 25 posts · 3 suspects · pass-1 verdict · 2 fix pass-1 · 3 fixed · pass2: poem rhythm line, geometrical dropped, makes-sense calque
- [x] if-p106 — 23 posts · pass-1 verdict · 6 fixed · pass2: loving-this calque synced x3, spilled fun, nuclear topic, retrace-form
- [x] if-p107 — 24 posts · 1 suspects · pass-1 verdict · 5 fix pass-1 · 1 fixed · pass2: push-past-R garble
- [x] if-p108 — 25 posts · 3 suspects · pass-1 verdict · 1 fix pass-1 · 2 fixed · pass2: other-insights calque, same-book playbook
- [x] if-p109 — 25 posts · pass-1 verdict · 2 fix pass-1 · 5 fixed · pass2: emoticon drift ^^/=) and dropped :(, FO-past phrasing, so-many-questions, better-comprehension
- [x] if-p110 — 25 posts · 4 suspects · pass-1 verdict · 1 fix pass-1 · 6 fixed · pass2: swap-level/pole term, blind-leading-blind x2, between-lines calque, R:R ratio, mind-of-trader polish
- [x] if-p111 — 25 posts · 2 suspects · pass-1 verdict · 2 fix pass-1 · 10 fixed · pass2: فشرده‌سازی→فشردگی, big eyes, lets say, stop hunt, swap orders, quote sync
- [x] if-p112 — 24 posts · 5 suspects · pass-1 verdict · 5 fixed · pass2: piece of slime, cook&bottle washer calque, bring down, by all means, missed=overlooked, detailed charts
- [x] if-p113 — 23 posts · 3 suspects · pass-1 verdict · 2 fix pass-1 · 2 fixed · pass2: went over my head calque, very middle zone
- [x] if-p114 — 24 posts · 6 suspects · pass-1 verdict · 1 fix pass-1 · 4 fixed · pass2: move on=leave RTM, moles=jاسوس, Compression Latin, rats metaphor
- [x] if-p115 — 25 posts · 2 suspects · pass-1 verdict · 4 fix pass-1 · 4 fixed · pass2: selfless, retail strategy, headache calque, to the pip, quote sync 24/25
- [x] if-p116 — 24 posts · 2 suspects · pass-1 verdict · 1 fix pass-1 · 7 fixed · pass2: نقاشی, last-but-not-least, to the pip, clunky, shadow letters, فرصت, quote sync
- [x] if-p117 — 23 posts · 3 suspects · pass-1 verdict · 1 fix pass-1 · 5 fixed · pass2: compress phrasing, SUPPLY DEMAND Latin, mutate calque, polluting=شلوغ, limonade
- [x] if-p118 — 25 posts · 2 suspects · pass-1 verdict · 1 fix pass-1 · 4 fixed · pass2: I hear ya, extremes consistency, kit duration, quote sync
- [x] if-p119 — 25 posts · 6 suspects · pass-1 verdict · 4 fixed · pass2: mutually exclusive calque, supercar, Markepedia, ugly kinks
- [x] if-p120 — 24 posts · 6 suspects · pass-1 verdict · 6 fixed · pass2: quote drift vs p119_24, polluting=شلوغ, roadmap, Markepedia, spread, next in line
- [x] if-p121 — 24 posts · 2 suspects · pass-1 verdict · 5 fixed · pass2: فشرده‌سازی→فشردگی; غیرامیدوارانه→غیرامیدمحور; digital Fiat source-slip; Kavya garbled target sentence; trash out→جارو
- [x] if-p122 — 25 posts · 1 suspects · pass-1 verdict · 3 fixed · pass2: talk-about calque fixed; PinkPanter rules-sentence quote drift synced (promoted better wording to canonical)
- [x] if-p123 — 21 posts · 1 suspects · pass-1 verdict · 1 fix pass-1 · 3 fixed · pass2: fcked register + circulating-money garble; pole→دکل; aha moment→Eureka
- [x] if-p124 — 23 posts · pass-1 verdict · 1 fix pass-1 · 4 fixed · pass2: 2B quote drift synced; راستش را بخواهی calque; Protocols title restored; نقل می‌کردند fix
- [x] if-p125 — 24 posts · 2 suspects · pass-1 verdict · 2 fixed · pass2: try-to-create wording; بینزاکتی→بی‌ادبی/مستهجن
- [x] if-p126 — 24 posts · 6 suspects · pass-1 verdict · 4 fix pass-1 · 5 fixed · pass2: ENG→اینگالف ×2 posts; فشرده‌سازی→فشردگی; torment phrasing; poles→دکل; lsk/fl caps
- [x] if-p127 — 23 posts · pass-1 verdict · 3 fix pass-1 · 4 fixed · pass2: هم‌اسکیل→هم‌مقیاس; clunky schedule-PA line rewritten in 3 quote copies
- [x] if-p128 — 25 posts · 3 suspects · pass-1 verdict · 5 fixed · pass2: URL jou… -if→jou...-if; missed→ندیدم; digits 1/2 pips; سوف→سی‌بس; RR phrasing; quote whitespace
- [x] if-p129 — 25 posts · 4 suspects · pass-1 verdict · 1 fix pass-1 · 6 fixed · pass2: پرچم→فلگ ×5 posts; URL jou… rnal fixed; RT-quote drift synced; missed-something; Blue Dot principles
- [x] if-p130 — 24 posts · 7 suspects · pass-1 verdict · 4 fixed · pass2: fancy calcs; I'd-say-that; market money; sell orders
- [x] if-p131 — 24 posts · 2 suspects · pass-1 verdict · 1 fix pass-1 · 3 fixed · pass2: flag->فلگ, 'more than tested' idiom, touch trade calque
- [x] if-p132 — 25 posts · 7 suspects · pass-1 verdict · 2 fix pass-1 · 5 fixed · pass2: input typo, پرچم->فلگ, 'safari'->harekat, 'gone through questions' calque, cute addition
- [x] if-p133 — 25 posts · 3 suspects · pass-1 verdict · 2 fix pass-1 · 5 fixed · pass2: quote sync, پرچم->فلگ x2, Diamond->الماس, 'safe'->درست, حل->درمان
- [x] if-p134 — 25 posts · 7 suspects · pass-1 verdict · 1 fix pass-1 · 4 fixed · pass2: نزد typo, 'get filled' sense, Diamond->الماس, insights phrasing
- [x] if-p135 — 25 posts · 6 suspects · pass-1 verdict · 8 fixed · pass2: پرچم ضمنی->فلگ ضمنی, Diamond->الماس, broken URL ellipses+spaces, quote sync
- [x] if-p136 — 25 posts · 1 suspects · pass-1 verdict · 13 fixed · pass2: فشرده‌سازی->فشردگی, پرچم ضمنی->فلگ ضمنی everywhere, ENG->اینگالف, LFT->LTF, pronoun fix
- [x] if-p137 — 25 posts · 4 suspects · pass-1 verdict · 1 fix pass-1 · 2 fixed · pass2: quote sync p135_23, zoom-out->بزرگ‌نمایی
- [x] if-p138 — 25 posts · 4 suspects · pass-1 verdict · 5 fixed · pass2: URL ellipsis repair x2, ENG->اینگالف, GGJJ quote resync to canonical, impulsive register
- [x] if-p139 — 5 posts · 2 suspects · pass-1 verdict · 2 fixed · pass2: humbled direction axis, last-thing-I-do phrasing

## hs — H's Trading Journal

95 صفحه / 2338 پست — بازبینی 95 · سابقه 2 · suspects 838

پرحاشیه‌ترین صفحه‌ها: hs-p59 (19) · hs-p73 (19) · hs-p69 (17) · hs-p70 (17) · hs-p72 (17) · hs-p43 (16) · hs-p60 (16) · hs-p66 (16)

- [x] hs-p1 — 25 posts · 8 suspects · 14 fixed · sem70: calques (retail traders, run through, on the table, speaking bollox), flag->پرچم banned form, associate->همکار, drawdown/scalp/pole Latin, extreme orders->شدید
- [x] hs-p2 — 25 posts · 13 suspects · 18 fixed · sem70: retail traders->خرده‌معامله‌گرانان calque, flag/Flag->پرچم/Latin, scalp Latin, touch trade untranslated, pullبازگشتا mixed-script, notion/fill/split Latin, ad nauseum calque, stop hunting->شکار استاپ
- [x] hs-p3 — 25 posts · 8 suspects · 13 fixed · sem70: diamond->Latin banned (الماس), flag->پرچم, اسکوپ calque, سطح S/R typo, scream->صدای بلند
- [x] hs-p4 — 25 posts · 2 suspects · 16 fixed · sem70: پرچم->فلگ everywhere (flag pattern), associate->همکار, pole->دکل, اسکوپ, Flag Limits title drift 'FLs', rusty->زنگار
- [x] hs-p5 — 25 posts · 5 suspects · 13 fixed · sem70: diamond Latin->الماس, پرچم/Flag->فلگ, سفارش شدید->مرزی, flip level->سطح سواپ, scalp->اسکالپ, rule of thumb->قاعده سرانگشتی, inputs->نظرات
- [x] hs-p6 — 25 posts · 8 suspects · 14 fixed · sem70: flag/پرچم->فلگ, flip->سواپ, blip/reap/rail calques, hanging in there, associate->همکار, pole/base->دکل/پایه, end-of-week mistranslation, Master->مستر تریدر
- [x] hs-p7 — 24 posts · 4 suspects · 18 fixed · sem70: پرچم/Flag->فلگ, Swap level->سطح سواپ, flip->سواپ, break out Latin, Doctor quote calques (plain Jane/penny/asset), take a loss, Cheers->موفق باشی, ENG->اینگالف
- [x] hs-p8 — 25 posts · 2 suspects · 14 fixed · sem70: flip/FLIP->سواپ, پرچم->فلگ, retest->ری‌تست, scalp->اسکالپ, order flow->جریان سفارش, base of the pole->پایهٔ دکل, input->نظرت, fueling calque, Nice one->آفرین, typo قرارّ
- [x] hs-p9 — 25 posts · 4 suspects · 11 fixed · sem70: پرچم->فلگ, flip->سواپ, base of the pole->پایهٔ دکل, transaction error->خطای محاسبهٔ لات, selloff Latin, stacked typo, got blown out->استاپم خورد
- [x] hs-p10 — 25 posts · 5 suspects · 11 fixed · sem70: پرچم->فلگ, flip->سواپ, retest->ری‌تست, scalp->اسکالپ, Cheers->سلام defect, consumption Latin, غاپرچمیر typo, Origin->مبدأ
- [x] hs-p11 — 24 posts · 6 suspects · 8 fixed · sem70: flip->سواپ, Cheers->سلام defect->موفق باشی, base->پایهٔ S/R, back in->در, نقاشی پرچم->فلگ, Nice picture->تصویر
- [x] hs-p12 — 25 posts · 6 suspects · 9 fixed · sem70: ناحیهٔ فلیپ/Flip->سواپ, پرچم->فلگ, momentum->شتاب, cp'd->CP خارج شد, scalp->اسکالپ, R;R->R:R
- [x] hs-p13 — 25 posts · 7 suspects · 10 fixed · sem70: flip/فلیپ->سواپ, پرچم->فلگ, scalp->اسکالپ, source flag->فلگ منبع, مارکت->بازار, pullback Latin, 'source' engulf->اینگالغ 'منبع'
- [x] hs-p14 — 25 posts · 8 suspects · 7 fixed · sem70: Flip/فلیپ->سواپ, پرچم->فلگ, pole->دکل
- [x] hs-p15 — 25 posts · 9 suspects · 5 fixed · sem70: calqued phrasing, terminology drift (flag/wick/compression), one Latin pole remnant
- [x] hs-p16 — 25 posts · 5 suspects · 7 fixed · sem70: slang/ononomatopoeia calques, foaming-at-the-mouth trigger-finger phrasing, flag term
- [x] hs-p17 — 25 posts · 3 suspects · 8 fixed · sem70: malformed nested quote head, calqued market slang, terminology fixes
- [x] hs-p18 — 24 posts · 10 suspects · 13 fixed · sem70: heavy calques, English leftovers, wick/flag/double terminology drift
- [x] hs-p19 — 24 posts · 13 suspects · 10 fixed · sem70: calqued idioms, terminology drift, English leftovers in prose
- [x] hs-p20 — 24 posts · 8 suspects · 12 fixed · sem70: literal calques, fair-value/follow-through phrasing, term consistency
- [x] hs-p21 — 25 posts · 7 suspects · pass-1 verdict · 8 fix pass-1 · 12 fixed · sem70: heavy calques, order/SL terminology, natural-Persian redrafts
- [x] hs-p22 — 24 posts · 10 suspects · 10 fixed · sem70: calqued slang, flag/wick/compression terminology fixes
- [x] hs-p23 — 25 posts · 11 suspects · 14 fixed · sem70: calqued idioms, base/pole terminology, heavy drift
- [x] hs-p24 — 25 posts · 10 suspects · 13 fixed · sem70: terminology drift (diamond/wick/flag), calqued phrasing
- [x] hs-p25 — 25 posts · 9 suspects · 11 fixed · sem70: calques, diamond/wick/flag terminology, English leftovers
- [x] hs-p26 — 25 posts · 7 suspects · 16 fixed · sem70: flag-limit terminology, diamond/engulf drift, Latin Flag remnant fixed
- [x] hs-p27 — 23 posts · 3 suspects · 16 fixed · sem70: flag-limit terminology (لبه‌های فلگ), diamond/wick drift, quote consistency
- [x] hs-p28 — 24 posts · 8 suspects · 21 fixed · sem70: flag-limit terminology, mixed-script remnants, calqued phrasing
- [x] hs-p29 — 25 posts · 6 suspects · 14 fixed · sem70: پرچم→فلگ, calques in 705/713/718, quote synced
- [x] hs-p30 — 24 posts · 3 suspects · 10 fixed · sem70: پرچم→فلگ, quote sync 727/737/741, polluting→شلوغ
- [x] hs-p31 — 25 posts · 6 suspects · 13 fixed · sem70: پرچم→فلگ quote sync 760-761-768 chain, 772/773/769 quote sync
- [x] hs-p32 — 25 posts · 4 suspects · 13 fixed · sem70: پرچم→فلگ, ponder leftover, ITها, quote chain sync 778-795, 781-796, 783-797, 787-799, 757-790, 763-792, 788-798
- [x] hs-p33 — 25 posts · 5 suspects · 11 fixed · sem70: پرچم→فلگ, order flow→جریان سفارش, price cap, quote sync 788-805/815-818/822-823
- [x] hs-p34 — 25 posts · 7 suspects · 12 fixed · sem70: اینگافل→اینگالیف, fakeout→فیک‌اوت, پرچم→فلگ, Diamond→الماس, quote chain 822-823-829, 842-844, 845-846
- [x] hs-p35 — 25 posts · 6 suspects · 14 fixed · sem70: اینگافل→اینگالیف, fakeout→فیک‌اوت, پرچم→فلگ, quote chains 846-851-853-867, 859-868-869, 870-871-872
- [x] hs-p36 — 25 posts · 10 suspects · 16 fixed · sem70: اینگافل→اینگالیف, fakeout→فیک‌اوت, supply/demand→عرضه/تقاضا, order flow→جریان سفارش, swap→سواپ, origin→مبدأ
- [x] hs-p37 — 25 posts · 5 suspects · 21 fixed · sem70: همان drift + ENG/ORFL حفظ, Engulf→اینگالیف, true supply→عرضه واقعی, Flag→فلگ, پرچم metaphor حفظ
- [x] hs-p38 — 24 posts · 7 suspects · 21 fixed · sem70: supply/demand, eng→اینگالیف, fake out→فیک‌اوت, EDIT note اصلاح
- [x] hs-p39 — 24 posts · 2 suspects · 21 fixed · sem70: IT‌ا→ITها, master/associate→Master/Associate, zero chaos→صفر آشوب, eng→اینگالیف
- [x] hs-p40 — 25 posts · 7 suspects · 21 fixed · sem70: engulf→اینگالیف, Orders جریان→جریان سفارش, essence→ماهیت, accumulation/distribution→انباشت/توزیع
- [x] hs-p41 — 25 posts · 12 suspects · 21 fixed · sem70: eng→اینگالیف, point X→نقطه X, Throw myself→خودم را خفه کنم, tricksy→مکار
- [x] hs-p42 — 24 posts · 11 suspects · 22 fixed · sem70: sl→SL, formation→شکل‌گیری, HOESHEC→Hoeschec, eng→اینگالیف
- [x] hs-p43 — 25 posts · 16 suspects · 19 fixed · sem70: calques+mixed-script supply/swap/demand/fun fixed; quotes synced
- [x] hs-p44 — 25 posts · 7 suspects · 23 fixed · sem70: supply/swap calques, glued forms, bird-view/hands-down calques, quote syncs
- [x] hs-p45 — 24 posts · 8 suspects · 18 fixed · sem70: اصلا-for-originally meaning flip, eng/real-time/backtest leftovers, glued forms, bird-view calque
- [x] hs-p46 — 25 posts · 15 suspects · 23 fixed · sem70: 1130 PAZ para had wrong-post contamination (was 1134 text) - rewritten; plus calques
- [x] hs-p47 — 25 posts · 14 suspects · 22 fixed · sem70: Diamond->الماس, pole->دکل, اصلا misuse, glued forms, quote syncs
- [x] hs-p48 — 25 posts · 12 suspects · 20 fixed · sem70: pole/base/flag/rally terms localized, URL ellipsis fix, decision-point calques, فشردگی typo
- [x] hs-p49 — 25 posts · 13 suspects · 21 fixed · sem70: nested quote chains resynced (1206/1207/1215-1219), swap->سواپ, supply/demand->عرضه/تقاضا, fakeout->فیک‌اوت, diamond->الماس, bird's eye->نمای کلی, eng->اینگافل
- [x] hs-p50 — 24 posts · 15 suspects · 12 fixed · sem70: engulf->اینگافل, fakeout->فیک‌اوت, supply/demand->عرضه/تقاضا, swap->سواپ, flag->فلگ, EG->اینگافل
- [x] hs-p51 — 24 posts · 6 suspects · pass-1 verdict · 1 fix pass-1 · 16 fixed · sem70: engulf->اینگافل, flag->فلگ, cp->CP, drawing->رسم, DP to FO->DPِ FO, give my left arm idiom
- [x] hs-p52 — 25 posts · 10 suspects · 17 fixed · sem70: fakeout->فیک‌اوت, engulf->اینگافل, flag->فلگ, supply/demand->عرضه/تقاضا, swap->سواپ, formed->شکل‌گرفته, demand zone->تقاضا
- [x] hs-p53 — 25 posts · 12 suspects · 18 fixed · sem70: engulf->اینگافل, fakeout->فیک‌اوت, supply->عرضه, setup->ستاپ, drawing typo rسی->رسم, EG->اینگافل
- [x] hs-p54 — 25 posts · 7 suspects · 20 fixed · sem70: eng->اینگافل, fakeout->فیک‌اوت, setup->ستاپ, swap->سواپ, urges/urge->وسوسه, drawing typo رس->رسم
- [x] hs-p55 — 25 posts · 10 suspects · 21 fixed · sem70: eng/اینگالغ->اینگافل, fakeout->فیک‌اوت, diamond->الماس, drawdown->افت سرمایه, setup->ستاپ, deep quote chains 1354-1357/1361-1370 resynced, nail on head idiom
- [x] hs-p56 — 23 posts · 1 suspects · 14 fixed · sem70: اورجین->مبدأ, اینگالغ->اینگافل, باکس FL->FL Box, اکستریم->انتهایِ انتهایی, ریتریس->RT, stop hunt->شکار استاپ
- [x] hs-p57 — 24 posts · 8 suspects · 22 fixed · sem70: calques+terminology drift (اینگالغ, supply/demand Latin, pole, reached/unreached, dissection room); 22 posts redrafted
- [x] hs-p58 — 25 posts · 12 suspects · 20 fixed · sem70: calques (hat off, hindsight, brain knot), supply/demand Latin, اینگالغ, quote sync
- [x] hs-p59 — 25 posts · 19 suspects · 21 fixed · sem70: Cyrillic diagрам leak, supply/demand Latin, calques (blue in the face), origin up/down consistency
- [x] hs-p60 — 25 posts · 16 suspects · 22 fixed · sem70: massive supply/demand Latin drift, calques (gives away, market mover), origin up/down
- [x] hs-p61 — 25 posts · 10 suspects · 18 fixed · sem70: inverted sentence 1509, فجو typo, market mover, برآورده‌نشده, IT‌ا ZWNJ artifacts
- [x] hs-p62 — 25 posts · 12 suspects · 21 fixed · sem70: calques (manage expectations, riffraff, taking loss), market mover, برآورده‌نشده, quote sync
- [x] hs-p63 — 25 posts · 11 suspects · 22 fixed · sem70: URL corruption jou…f-war fixed, swap zone, context Latin, origin up/down, IT‌ا, calques
- [x] hs-p64 — 25 posts · 7 suspects · 7 fixed · sem70: اینجa->اینجا, اینگالی->اینگالف, supply/demand Latin, IT‌ا->ITها, eng->EG, quote sync with corrected p63
- [x] hs-p65 — 25 posts · 15 suspects · 7 fixed · sem70: supply/demand Latin, IT‌ا, flag box->باکس فلگ, invented tail sentence removed
- [x] hs-p66 — 24 posts · 16 suspects · 8 fixed · sem70: اینجا, Latin supply/demand/bounce/accumulation, IT‌ا
- [x] hs-p67 — 25 posts · 9 suspects · 9 fixed · sem70: supply/demand Latin, draw down, اینجا, origin->مبدأ, IT‌ا
- [x] hs-p68 — 25 posts · 10 suspects · 5 fixed · sem70: اینجا, Latin swap, اینگالغ نزولیی typo, quote sync
- [x] hs-p69 — 24 posts · 17 suspects · 15 fixed · sem70: اینجا->اینجا, IT‌ا->ITها, اینگالغ نزولیی, breakout Latin->شکست, obvious->آشکار, quote sync
- [x] hs-p70 — 23 posts · 17 suspects · 17 fixed · sem70: second pass - پیچش->kink across 15 posts, اینگالفینگ->اینگالغ, quote sync
- [x] hs-p71 — 25 posts · 15 suspects · 13 fixed · sem70: calque cleanup (don't mind me joining, obvious->مشخص, no man's land->ناحیه بی‌صاحب, pockets of orders->باقی‌مانده سفارش, three drive/3-drive->سه درایو/سه‌درایو, real time->زمان واقعی, فضا space fix, upside fix)
- [x] hs-p72 — 25 posts · 17 suspects · 19 fixed · sem70: calque cleanup + quote sync (sharing->اشتراک گذاشتی, mind->اشکالی نداری/اذیت نشوی, fake out Latin->فیک‌اوت, pollute->شلوغ کنم synced in 1780/1781, 1785 garbled FA rewritten, invented text removed, misses->نمی‌رسد, compression up->فشردگی صعودی)
- [x] hs-p73 — 24 posts · 19 suspects · 14 fixed · sem70: calque cleanup (tunnel vision->دید تونلی, fake out->فیک‌اوت, IT‌ا->ITها, forward testing->تست آینده‌نگر, cope/real time Latin->کنار بیایم/لحظه واقعی, missed->ندیده‌ام, Demand->تقاضا, HDCE typo->HCDE, اینگالی->اینگالفی)
- [x] hs-p74 — 25 posts · 14 suspects · 15 fixed · sem70: quote sync 1826/1832, HUGE->خیلی بزرگ, on the line->در میان, Supply->عرضه, 'live'->'لایو', not created equal->یکسان نیستند, pole->دکل+base, supply level->عرضه, 'as above so below'->چنان که بالا چنین پایین, pocket of orders->باقی‌مانده سفارش, 3-drive->سه‌درایو
- [x] hs-p75 — 25 posts · 14 suspects · 12 fixed · sem70: can't help but->نمی‌توانم جلوی...بگیرم, desperate->بی‌تاب, FAR->خیلی خیلی, blown through->قیمت می‌شکند, common denominator->عامل مشترک, weed out->حذف, pole kept Latin (68 corpus uses), 1865/1866 + 1868/1869 quote sync, iQM typo->IQM
- [x] hs-p76 — 25 posts · 11 suspects · 12 fixed · sem70: stاپ‌لاس->استاپ‌لاس, supply zone->عرضه (direction fix), leave me in the dust->دست به هوا بدهد, unfolds->پیش می‌رود, too good to be true->برای باور کردن زیادی خوب, set in stone->قطعی, flag box پرچم->فلگ, جا انداختن->جا گذاشتن, out of perspective->به‌هم ریخته
- [x] hs-p77 — 25 posts · 11 suspects · 19 fixed · sem70: 19 fixes: calques (establishing/fakeout/breakout), terminology (kink/stack order/clean orders), quote sync 1915->1918, URL/number preservation; rejected 0
- [x] hs-p78 — 25 posts · 12 suspects · 17 fixed · sem70: 17 fixes: compression>fشردگی, swap zone>سواپ, fakeout, pole>دکل, سفارت typo, quote sync 1942->1943; rejected 0
- [x] hs-p79 — 25 posts · 10 suspects · 10 fixed · sem70: 10 fixes: فشرده‌سازی>فشردگی, سوآپ>سواپ, IT‌ا typo, hold-up/down calques, LQ/FO direction fix in 1971; rejected 0
- [x] hs-p80 — 23 posts · 8 suspects · 11 fixed · sem70: 11 fixes: stray kasra, سوآپ>سواپ, انحنای>kink, quote sync 1976->1978 & 1991->1992,Established Range>تثبیت‌شده, garbled source polish; rejected 0
- [x] hs-p81 — 24 posts · 11 suspects · 16 fixed · sem70: 16 fixes: quote sync 1989->2002/2003 & 2022->2024->2025, میله>دکل, demand>تقاضا, kink normalization, فشرده‌سازی>فشردگی; rejected 0
- [x] hs-p82 — 25 posts · 5 suspects · 14 fixed · sem70: 14 fixes: duplicate post 2026 synced to 2025, انگلفد>اینگالف, میله>دکل, quote sync 2011->2033 & 2048->2049, prayer direction fix, TNX>thanks; rejected 0
- [x] hs-p83 — 25 posts · 7 suspects · 12 fixed · sem70: 12 fixes: pole>دکل, انگلاف/انحنا/IT‌ا, quote sync 2033->2051 & 2056->2057 & 2064->2065, supply>عرضه, فشرده‌سازی>فشردگی; rejected 0
- [x] hs-p84 — 25 posts · 12 suspects · 6 fixed · sem70: 6 fixes: انحنا>kink, انگلفد>اینگالف, نقاشی>نگاشت, stray kasra/shadda, supply/demand>عرضه/تقاضا, missing colon; rejected 0
- [x] hs-p85 — 23 posts · 3 suspects · 17 fixed · sem70: fakeout Latin leftovers, money management calque, swap zone terminology, quote syncs
- [x] hs-p86 — 25 posts · 2 suspects · 14 fixed · sem70: inverted badge sentence, swap/kink terminology, calques in long 18-para post, quote syncs
- [x] hs-p87 — 25 posts · 3 suspects · 18 fixed · sem70: pollute->شلوغ, blue-sky calque, quote syncs across 3 nested posts, mid-sentence para splits kept
- [x] hs-p88 — 25 posts · 9 suspects · 18 fixed · sem70: URL ellipsis corruption, Elbert->Albert, supply/demand terms, stop hunt, quote chain syncs
- [x] hs-p89 — 25 posts · 3 suspects · 17 fixed · sem70: پرچم->فلگ banned form, touch-trade term, kink->کینک, hiccup->سکسکه, quote chain syncs
- [x] hs-p90 — 25 posts · 3 suspects · 24 fixed · sem70: swap->تعویض mistranslation, URL corruption x2, پرچم->فلگ, confluence->هم‌پوشانی, quote syncs
- [x] hs-p91 — 24 posts · 8 suspects · 20 fixed · sem70: swap zone->ناحیهٔ سواپ, confluence->هم‌پوشازی, first-person bugs, quote chain 2264-2268 sync
- [x] hs-p92 — 25 posts · 6 suspects · 21 fixed · sem70: swap zone->ناحیهٔ سواپ, flag limit->فلگ لیمیت, Box->کادر consistency, last spring->بهار پارسال, quote syncs
- [x] hs-p93 — 24 posts · 8 suspects · 16 fixed · sem70: swap level->سطح سواپ, win ratio->نرخ برد, quote syncs to p92 fixes, wisdom teeth->دندان‌های عقل
- [x] hs-p94 — 25 posts · 8 suspects · 21 fixed · sem70: confluence->هم‌خوانی, pole->دکل, kink->کینک, Latin pondering/tremendous/ap-said fixed, win ratio->نرخ برد
- [x] hs-p95 — 19 posts · 4 suspects · 17 fixed · sem70: ترید->معامله, Donchian->دانچین, kink->کینک, inner/outer FL consistency, cheers->دوستت دارم

## dbrrbd — Drop Base Rallies and Rally Base Drops

66 صفحه / 1485 پست — بازبینی 66 · سابقه 2 · suspects 323

پرحاشیه‌ترین صفحه‌ها: dbrrbd-p20 (16) · dbrrbd-p26 (16) · dbrrbd-p19 (12) · dbrrbd-p29 (12) · dbrrbd-p37 (12) · dbrrbd-p2 (11) · dbrrbd-p14 (11) · dbrrbd-p61 (11)

- [x] dbrrbd-p1 — 25 posts · 7 suspects · 7 fixed · compression ban, quote-drift x2, calques (slice/chew over/shoot away), پرچم->فلگ, remiss, extended-posts
- [x] dbrrbd-p2 — 24 posts · 11 suspects · 6 fixed · quote drift p1_18, rejection->ریجکشن, surprises/ghaparchmir, puf->پوف, Here goes, RBD/DBR garble
- [x] dbrrbd-p3 — 24 posts · 3 suspects · 5 fixed · compression->فشرده‌سازی x8 (p3_59+p3_62 quote sync), FL->فلگ, pole->دکل x2
- [x] dbrrbd-p4 — 23 posts · 7 suspects · 6 fixed · quote-chain drift p3_74+p4_76 (4 posts), پرچم->فلگ, pole->دکل, pattern names localized
- [x] dbrrbd-p5 — 22 posts · 1 suspects · 3 fixed · pole->دکل, quote drift Tyoon p4_96, غاپرچمیر typo->غافلگیر
- [x] dbrrbd-p6 — 24 posts · 5 suspects · 7 fixed · mid-word para split engulfing, quote drift p6_128, compression, اینگالفینگ, calques (programe eyes, more-than-welcomed), idioms
- [x] dbrrbd-p7 — 14 posts · 1 suspects · 1 fixed · touch trade->تاچ‌ترید fixed to ورود لیمیت با اولین برخورد
- [x] dbrrbd-p8 — 24 posts · 3 suspects · 2 fixed · source typo RDB->RBD, fun-trades بامزه->تفریحی
- [x] dbrrbd-p9 — 24 posts · 4 suspects · 13 fixed · RDB->RBD x12 (source typo), invented RBD/DBR removed, compression ban, hm transliteration
- [x] dbrrbd-p10 — 21 posts · 1 suspects · 4 fixed · RDB->RBD, undivided-attention calque, funnily-enough irony x2 (quote synced)
- [x] dbrrbd-p11 — 24 posts · 4 suspects · 3 fixed · gold era phrasing, quote-guillemet sync, 1st->اول
- [x] dbrrbd-p12 — 25 posts · 6 suspects · 3 fixed · فشرده‌سازی->فشردگی, goat calque, pass-a-zone meaning
- [x] dbrrbd-p13 — 21 posts · 5 suspects · 2 fixed · spelled-out DBR lost, LTF kept Latin
- [x] dbrrbd-p14 — 25 posts · 11 suspects · 7 fixed · URL corruption, فشرده‌سازی x3, پرچم->فلگ, Best->بهترین‌ها, quote sync
- [x] dbrrbd-p15 — 25 posts · 6 suspects · 1 fixed · X-ray calque -> نگاه عمیق‌تر
- [x] dbrrbd-p16 — 25 posts · 1 suspects · 1 fixed · فشرده‌سازی->فشردگی
- [x] dbrrbd-p17 — 24 posts · 4 suspects · 1 fixed · rejection->ریجکشن
- [x] dbrrbd-p18 — 25 posts · 7 suspects · 10 fixed · mettafort chain: touch trade, decision point, order book, engulfing, fakeout, engulf calques, meaning bugs
- [x] dbrrbd-p19 — 25 posts · 12 suspects · 11 fixed · Spongy/mettafort section: supply/demand/pole Latin purge, quote sync 459<->464
- [x] dbrrbd-p20 — 24 posts · 16 suspects · 13 fixed · Latin leftovers front run/compression/retrace/engulf, glued DBRagainst, DBD typo for DBR, OCO style->از نوع, firefight calque, fun/subconsciously leftovers, flag->فلگ pole->دکل in 487
- [x] dbrrbd-p21 — 22 posts · 9 suspects · 4 fixed · talk-about idiom calque, batmobile self-correction dropped, فشرده‌سازی->کامپرشن, Price Action normalization, acronym casing
- [x] dbrrbd-p22 — 25 posts · 8 suspects · 11 fixed · Cheers->سلام wrong farewell, reject/engulf Latin, RDB/LTR source typos, wick->ویک, swap zone->ناحیه سواپ, zone stack, lurk leftovers, ناحیهی->ناحیه‌ای, quote sync 547/548
- [x] dbrrbd-p23 — 23 posts · 7 suspects · 3 fixed · pole->دکل, ریتست->ریترِیس spelling, awkward appreciated sentence
- [x] dbrrbd-p24 — 25 posts · 7 suspects · 3 fixed · Cheers->ممنون farewell x2+quote sync, rejection->ریجکشن, close-below phrasing
- [x] dbrrbd-p25 — 23 posts · 7 fixed · پرچم->فلگ x3 + quote sync, swap level->سطح سواپ, URL ellipsis space corruption, RBR RBR->RBR RBD source typo x2, minor phrasing
- [x] dbrrbd-p26 — 25 posts · 16 suspects · 16 fixed · engulf->اینگالف ~20x, flag->فلگ, compression->کامپرشن, fakeout->فیک‌اوت, pole->دکل, rejection->ریجکشن, quote drift synced to canonical 624, sexy->جذاب, edیت glue, silly->مسخره x3
- [x] dbrrbd-p27 — 24 posts · 2 suspects · 7 fixed · رد شدن->ریجکشن x4, pole->دکل x4, retrace->ریترِیس, Victor signature Latin, Paint/Screencast Latin, calque shoot->حرکت, price action normalization
- [x] dbrrbd-p28 — 25 posts · 10 suspects · 15 fixed · compression/engulf Latin leftovers x9, decision point, retrace, drop->افت, Price Cap->کپ قیمت x2, hey->سلام, rdb typo, garbled welcome sentence, quote syncs 683/684 685/686 693/694 695/696 699/700
- [x] dbrrbd-p29 — 25 posts · 12 suspects · 12 fixed · engulf Latin->اینگالف, flag limits mistranslated as FLs, broken URLs, LOT/zoom/value calques, humble opinion, URL ellipsis, quote syncs
- [x] dbrrbd-p30 — 23 posts · 6 suspects · 4 fixed · unfinished sentence, prods calque, TF normalization, daneste typo
- [x] dbrrbd-p31 — 23 posts · 8 suspects · 8 fixed · Latin leftovers intimidating/master/cluttered, engulf->اینگالف, limit order glue, DRB typo, jà gozashtam, quote sync
- [x] dbrrbd-p32 — 25 posts · 6 suspects · pass-1 verdict · 2 fix pass-1 · 8 fixed · URL ellipsis corruption x5, compression->feshardezi, tirok->dekol, truncated EN completed, quote wording sync
- [x] dbrrbd-p33 — 25 posts · 6 suspects · 8 fixed · rejection->rijekshan, engulf/COMPRESSION/pole canonical quote sync x4, Latin leftovers NEED/link/intimidating-adjacent, bring-home idiom, lurking calque
- [x] dbrrbd-p34 — 25 posts · 2 suspects · 9 fixed · quote syncs (826/836/846), URL ellipsis, RBD&RBD source typo, went-crazy idiom, is-this-correct phrasing, nested quote variants
- [x] dbrrbd-p35 — 23 posts · 1 suspects · 3 fixed · quote sync 863, minor->kuchak transliteration fix + quote sync
- [x] dbrrbd-p36 — 19 posts · 6 fixed · Flag Limit->flag-limit consistency, risk-favors-shorts, trade-taken phrasing, harsh-and-good idiom + quote syncs
- [x] dbrrbd-p37 — 24 posts · 12 suspects · 14 fixed · dbrrbd-p37: fixed leftover EN prose (ponder x2, connected), RBR->RBD slip in 913, banned 'اینگالی'->engulf wording, Latin 'base'->بیس, calques (chime in->نظرت را بگی, translate into->تبدیل, digest->مرور, hand-holding->دست‌تحت‌بالا, 'به حساب این جا افتادیم'), 'کندل رد'->کندل ريجکشن, 'نقاشی'->ترسیم for chart drawing
- [x] dbrrbd-p38 — 21 posts · 6 suspects · 3 fixed · calque hang-of-things, QMای weld, GPB->GBP typo, compression->کامپرشن
- [x] dbrrbd-p39 — 22 posts · 6 suspects · 1 fixed · flag pattern پرچم->فلگ x4, caps->کپ
- [x] dbrrbd-p40 — 20 posts · 2 suspects · 6 fixed · quote drift vs p39_975, RBDهام glue, فشرده‌سازی, اینغالفینگ normalize, awkward shot-off
- [x] dbrrbd-p41 — 21 posts · 3 suspects · 7 fixed · URL ellipsis corruption x2, پرچم->فلگ, فشرده‌سازی->کامپرشن, pole->دکل, quote resync to canonical 998/999/1001
- [x] dbrrbd-p42 — 25 posts · 2 suspects · 7 fixed · swap level سطح تعویض->سطح سواپ x2, پرچم->فلگ, base->بیس, DBS->DBD typo, تکلیفق typo, line graph->نمودار خطی
- [x] dbrrbd-p43 — 25 posts · 4 suspects · 8 fixed · فشرده->کامپرشن, base->بیس, broken grammar, URL ellipsis, quote resync 1061, idiom flash-before-eyes
- [x] dbrrbd-p44 — 22 posts · 1 suspects · 6 fixed · اینگالغ->اینگالف x2, پرچم/pole->فلگ/دکل, Supply Cap->کپ عرضه, LFT->LTF, تکلیفع, زوم‌اوت
- [x] dbrrbd-p45 — 24 posts · 3 suspects · 7 fixed · cap->کپ normalization, تکلیفع, broken grammar می‌یابم/را نظر بده, Flags->فلگ
- [x] dbrrbd-p46 — 23 posts · 1 suspects · 4 fixed · Caps->کپ, broken ناحیه/ناحیه duplicate, FTR spacing, Caps->کپ
- [x] dbrrbd-p47 — 21 posts · 4 suspects · 21 posts; FA faithful; 'candle no 123' kept literal (guard blocks reading fix, borderline)
- [x] dbrrbd-p48 — 23 posts · 2 suspects · 1 fixed · p48_1176: پرچم->فلگ x3, restored dropped ending
- [x] dbrrbd-p49 — 8 posts · 2 suspects · 1 fixed · p49_1211: پرچم->فلگ x2, فشرده‌سازی->فشردگی, dup label G->J (source seq A-I), smoother phrasing
- [x] dbrrbd-p50 — 4 posts · 2 suspects · 1 fixed · p50_1244: added missing 'wick'->ویک, rejection->ریجکشن
- [x] dbrrbd-p51 — 10 posts · 1 fixed · p51_1275: source typo Timanog->Tirmanog (addressee)
- [x] dbrrbd-p52 — 21 posts · 1 suspects · 3 fixed · p52_1284 rejection->ریجکشن; p52_1286 decisions->کندل‌های تصمیم; p52_1291 quote synced to canonical p1_13
- [x] dbrrbd-p53 — 25 posts · 1 suspects · pass-1 verdict · 1 fix pass-1 · 25 posts; duy90 19-step walkthrough faithful; borderline: 'Cap' left Latin once
- [x] dbrrbd-p54 — 25 posts · 4 suspects · 25 posts; borderline: salivan uses ردشدن for reject-verb (noun case fixed on p52)
- [x] dbrrbd-p55 — 25 posts · 1 suspects · 25 posts; quotes/tickers/numbers intact; borderline: معاملهٔ تاچ for touch trade
- [x] dbrrbd-p56 — 25 posts · 1 suspects · 1 fixed · tense drift عاشقش شدم→عاشقشم
- [x] dbrrbd-p57 — 23 posts · 3 suspects · 1 fixed · nested quote drift in p1418 synced to canonical
- [x] dbrrbd-p58 — 23 posts · 5 suspects · 5 fixed · welded تکلیفع, baseها gluing, rejected→ریجکت synced x3, Base→بیس
- [x] dbrrbd-p59 — 24 posts · 6 suspects · 12 fixed · baseها→بیس‌ها systemic x11 posts + restored dropped quote chunk in 1455
- [x] dbrrbd-p60 — 25 posts · 8 suspects · 6 fixed · DPای weld, base→بیس, تکلیفع, pullback/clean-demand calque, پوزیشن معامله
- [x] dbrrbd-p61 — 25 posts · 11 suspects · 11 fixed · base/تکلیفع/IT‌ا welding, shake-out→شیک‌اوت, flag limits→فلگ لیمیت, rejections→ریجکشن, supply/demand calques
- [x] dbrrbd-p62 — 24 posts · 3 suspects · 8 fixed · Flag Limits→فلگ لیمیت, URL ellipsis space, خواندن wishes, could-simply-means calque, swap zone→زون سواپ, baseها
- [x] dbrrbd-p63 — 25 posts · 7 suspects · 7 fixed · quote sync to p62_1550 fix, cap→کپ, ponder/essence/bravo leftovers, stop hunt→شکار استاپ, zinc dropped
- [x] dbrrbd-p64 — 25 posts · 4 suspects · 12 fixed · cap→کپ, base→بیس, تکلیفع/بگوید, تماشا→دیدم for video, engulf/quasimodo/diamond Latin→فارسی, support&demand→عرضه, herd idiom, RBD‌ی weld
- [x] dbrrbd-p65 — 24 posts · 2 suspects · 14 fixed · cap→کپ systemic, fresh ones mistranslation, swap zone→زون سواپ, pole→دکل, URL ellipsis, base/flip
- [x] dbrrbd-p66 — 5 posts · 1 suspects · 5 fixed · stale quotes synced to p65 fixes, CAP→کپ, FO‌ها weld, retracement→ریتریس

## supplydemand — Supply and Demand, Support and Resistance, PA

59 صفحه / 1436 پست — بازبینی 59 · سابقه 1 · suspects 297

پرحاشیه‌ترین صفحه‌ها: supplydemand-p45 (11) · supplydemand-p26 (10) · supplydemand-p41 (10) · supplydemand-p13 (9) · supplydemand-p24 (9) · supplydemand-p28 (9) · supplydemand-p35 (9) · supplydemand-p49 (9)

- [x] supplydemand-p1 — 25 posts · 5 suspects · 10 fixed · sem70: سفارت→سفارش، پرچم/اموتیکون/کالک‌های p1؛ 10 پست اصلاح شد
- [x] supplydemand-p2 — 24 posts · 1 suspects · 3 fixed · sem70: فیبوی→فیب، بی‌دلیل→اتفاقی + سینک کوتیشن p2_39
- [x] supplydemand-p3 — 25 posts · 5 suspects · 9 fixed · sem70: اموتیکون :unsure:، اگر→ایف، غیرمتراکم→غیر فشرده، کالک‌ها؛ 9 پست
- [x] supplydemand-p4 — 25 posts · 3 suspects · 12 fixed · sem70: کالک‌ها، فلگ، حذف پاراگراف اضافه در p4_96، سینک کوتیشن‌ها
- [x] supplydemand-p5 — 25 posts · 6 suspects · 16 fixed · sem70: پرچم→فلگ، LOVELY/discretion/systematic لاتین، اموتیکون‌ها، سینک 5 کوتیشن
- [x] supplydemand-p6 — 25 posts · 1 suspects · 10 fixed · sem70: فلگ، لاتین pullback/symmetry، URL خراب، سینک p6_145
- [x] supplydemand-p7 — 25 posts · 8 suspects · 11 fixed · sem70: پرچم→فلگ، لاتین‌ها، pullback، correlation، سینک کوتیشن‌ها
- [x] supplydemand-p8 — 25 posts · 6 suspects · pass-1 verdict · 7 fix pass-1 · 9 fixed · sem70: پرچم→فلگ گسترده، پل→دکل، فشرده‌سازی→فشردگی، کالک on cloud nine/dستور پخت؛ سینک کوتیشن‌های زنجیره‌ای
- [x] supplydemand-p9 — 25 posts · 5 suspects · 6 fixed · sem70: [/کو→[/quo، ترد→تاپیک، capped→کپ، پرچم→فلگ، Cable→کیبل، سینک کوتیشن
- [x] supplydemand-p10 — 25 posts · 2 suspects · 9 fixed · sem70: respected→جواب داد، whooping، اسپایک‌ها، لندن، لاتین‌های باقی‌مانده
- [x] supplydemand-p11 — 24 posts · 8 suspects · 12 fixed · sem70: URLهای خراب 33-s....html، اموتیکون‌ها، discretion/systematic/Reload/senior لاتین، سینک کوتیشن‌های 3لایه
- [x] supplydemand-p12 — 25 posts · 3 suspects · 9 fixed · sem70: مدیریت می‌کنی→جا می‌شود، sticking out، اکستریم، سینک زنجیرهٔ 6 پست
- [x] supplydemand-p13 — 25 posts · 9 suspects · 13 fixed · sem70: پرچم→فلگ، تگ‌های brag لاتین، crappy/smelie/رنت، متن‌محور→کتابی، Alto→اگرچه، سینک کوتیشن‌ها
- [x] supplydemand-p14 — 25 posts · 4 suspects · 10 fixed · sem70: تردلاین/اسکلپ/ری‌تست/10p→پیپ، پول‌بک دیوار، «بالای LS»، آپلود شد، ادغام پاراگراف 342
- [x] supplydemand-p15 — 25 posts · 1 suspects · 7 fixed · sem70: پرچم→فلگ، سواپ ناحیه→ناحیهٔ سواپ، pin→پین‌بار، کانونی‌محور→کانونی
- [x] supplydemand-p16 — 25 posts · 3 suspects · 6 fixed · sem70: calques/awkward phrasing in 6 posts
- [x] supplydemand-p17 — 24 posts · 1 suspects · 5 fixed · sem70: calques, screen-time literal, BE phrasing
- [x] supplydemand-p18 — 25 posts · 1 suspects · 7 fixed · sem70: stared leftover EN, پرچم->فلگ, pole->دکل, dropped BIG CANDLES, quote sync
- [x] supplydemand-p19 — 25 posts · 7 suspects · 4 fixed · sem70: پرچم->فلگ, clear support mistranslated, calques
- [x] supplydemand-p20 — 25 posts · 2 suspects · 5 fixed · sem70: bull-of-circus calque, English leftovers, awkward phrasing
- [x] supplydemand-p21 — 25 posts · 7 suspects · 8 fixed · sem70: broken 'عجیبی‌ها enhancer', پرچم->فلگ, calques, leftover EN
- [x] supplydemand-p22 — 25 posts · 6 suspects · 6 fixed · sem70: 'compiling' EN leftover, divergence calque, decimal comma
- [x] supplydemand-p23 — 25 posts · 8 suspects · 5 fixed · sem70: grind calque, 'hurt heavily' calque, profanity mangled
- [x] supplydemand-p24 — 25 posts · 9 suspects · 11 fixed · sem70: pole->دکل, flag->فلگ, EN leftovers (launch/urgent/instrument/dissekt/fine tune), Persian digits, calques
- [x] supplydemand-p25 — 25 posts · 8 suspects · 13 fixed · sem70: corrupted URLs (ایندکس.php), پرچم->فلگ, candle close, stray 17, instrument leftovers
- [x] supplydemand-p26 — 25 posts · 10 suspects · 9 fixed · sem70: pole->دکل, cap->کپ, URL ellipsis fix, nail-on-head calque, shot->short
- [x] supplydemand-p27 — 25 posts · 8 suspects · 3 fixed · sem70: پرچم->فلگ x2, timezone calque, quote sync
- [x] supplydemand-p28 — 25 posts · 9 suspects · 6 fixed · sem70: pole->دکل, پرچم->فلگ, reversed attention direction, calques
- [x] supplydemand-p29 — 24 posts · 6 suspects · 6 fixed · sem70: پرچم->فلگ across nested quotes, spinning-top calque
- [x] supplydemand-p30 — 25 posts · 7 suspects · 10 fixed · sem70: pennant->پننت, پرچم->فلگ, آینده‌ها->فutures, item calque, awkward word order
- [x] supplydemand-p31 — 25 posts · 4 suspects · 19 fixed · sem70: calques, invented quote heads, pennant->پیرامید, quote sync 760-block
- [x] supplydemand-p32 — 25 posts · 6 suspects · 19 fixed · sem70: untranslated EN prose, calques, AUD/Aussie quote sync, account-implosion chain
- [x] supplydemand-p33 — 24 posts · 5 suspects · 10 fixed · sem70: untranslated topics, translated attachment filename, cp->CP, Loon mistranslation
- [x] supplydemand-p34 — 23 posts · 7 suspects · 15 fixed · sem70: invented head on 827, All-alone-again chain, QM spotting, pending->سفارش معلق, play->پلِی
- [x] supplydemand-p35 — 25 posts · 9 suspects · 19 fixed · sem70: hold-against-you idiom, alert->آلارم, PRS quote chain sync, missing head
- [x] supplydemand-p36 — 25 posts · 6 suspects · 22 fixed · sem70: missed-boat idiom, lot-size welds, chatroom prose, flag->فلگ, play->پلِی
- [x] supplydemand-p37 — 25 posts · 6 suspects · 14 fixed · sem70: corrupted URL, پرچم->فلگ, Hidden Gaps calque, invented head 920, pennant->پیرامید
- [x] supplydemand-p38 — 25 posts · 7 suspects · 15 fixed · sem70: trigger-rationale calque, pole->دکل, flag->فلگ, quote syncs
- [x] supplydemand-p39 — 24 posts · 3 suspects · 12 fixed · sem70: CP شدن calque, selloff->ریزش, flag->فلگ, tap->تاچ, tasty CP
- [x] supplydemand-p40 — 21 posts · 1 suspects · 4 fixed · sem70: corrupted lessons.tradingacademy URL, DP welds, @-calque, فشرده‌سازی
- [x] supplydemand-p41 — 24 posts · 10 suspects · 9 fixed · sem70: invented head 1022, friends-chain sync, Rally-Base-Drop gloss, engulfing
- [x] supplydemand-p42 — 25 posts · 3 suspects · 10 fixed · sem70: پرچم->فلگ, FL welds, hanging-man, mid-range/gap calques, stacked
- [x] supplydemand-p43 — 8 posts · 2 suspects · 4 fixed · sem70: Chief-Cook title, لانگ EU, 1058 English-term calques
- [x] supplydemand-p44 — 24 posts · 2 suspects · 7 fixed · sem70: welcome-back mistranslation, غاپرچمیری, Happy-trading sign-off, +46 pips
- [x] supplydemand-p45 — 24 posts · 11 suspects · 14 fixed · sem70: corrupted zones URL, fresh-consistency, flip-zone calque, bullspike
- [x] supplydemand-p46 — 24 posts · 3 suspects · 10 fixed · sem70: leftover EN (monthly/weekly, baby blue, Can Can, base/pole->پول), پرچم->فلگ, ریست->ریتریس, broken fib calque; quote chains synced
- [x] supplydemand-p47 — 25 posts · 18 fixed · sem70: پرچم->فلگ, پول->دکل, leftover EN (trigger/pin/play/Accumulation/ریجکشن/شیک‌اوت), FTR gloss, consumed->تمام شود; Tan quote chain synced; note work-vs-dump para drift on 1165
- [x] supplydemand-p48 — 25 posts · 6 suspects · 20 fixed · sem70: touch trade->ورود با تاچ, cap/engulf/trigger/watchlist/requirements leftover EN, افزودنی->افزونه, Ify->ایف, TRADER->تریدر, Viola->ووالا; quote chains synced
- [x] supplydemand-p49 — 24 posts · 9 suspects · 17 fixed · sem70: Viola quote synced to ووالا, touch trade->تاچ, engulf/indi leftover EN, عرضهای->عرضه‌ای, south->پایین, Decision Point->نقطهٔ تصمیم, taken out stops fixed
- [x] supplydemand-p50 — 25 posts · 3 suspects · 19 fixed · sem70: پرچم->فلگ, engulf/daily/s-d/cap/btw leftover EN, jفت‌ارز glue fixed, touch trade->ورود با تاچ, consumed->گرفته شده; quote chains synced
- [x] supplydemand-p51 — 25 posts · 4 suspects · 15 fixed · sem70: edge->نقطه ورود, rendezvous/alert/origin leftover EN, marketable->فوری, limit->لیمت, فلیپ->فلپ, north->بالا, cap->کپ; 1273/1274 quote synced
- [x] supplydemand-p52 — 24 posts · 4 suspects · 14 fixed · sem70: Edge handle mistranslated as لبه->fixed, فلیپ->فلپ, consumed->گرفته, قیمت اقدام->پرایس‌اکشن, compression->فشردگی, CanCan->کان‌کان, URL ellipsis corruption fixed; 1276/1281/1284/1286 quote chains synced
- [x] supplydemand-p53 — 25 posts · 5 suspects · 11 fixed · sem70: CanCan->کان‌کان, flip->فلپ, IT‌ا glue, دیاگرام->نمودار, wotnot->از این قبیل, banned->ممنوع; 1311/1316 and 1322/1323/1324 quote chains synced
- [x] supplydemand-p54 — 25 posts · 9 suspects · 13 fixed · sem70: دیاگرام->نمودار, RBR-Base-Rally garble, قطب->دکل, پرچم->فلگ, پول‌بک->ریتریس, گپ حرفه‌ای->گپ واقعی, 100٪->100%, rubber idiom; quote chains synced
- [x] supplydemand-p55 — 25 posts · 5 suspects · 19 fixed · sem70: [img] BBCode restored byte-identical, زون->ناحیه, قطب->دکل, پرچم->فلگ, north->بالا, sideways->افقی, homework->تکلیف, تاپیک->ترد, dive-in->درگیر; quote chains synced
- [x] supplydemand-p56 — 25 posts · 1 suspects · 19 fixed · sem70: زون->ناحیه corpus-wide on page, پول‌بک->ریتریس, تاپیک->ترد, کارکشته->آدم بی‌خبر, hindsight->بعدازوقوع, invented FTB clause removed, پر نشد->کاملاً پر نشد
- [x] supplydemand-p57 — 25 posts · 3 suspects · 8 fixed · sem70: زون->ناحیه, تصمیم نکته->نقطهٔ تصمیم, base/requote/charting leftovers, فلیپ->فلپ, کف پایین‌ترهای صعودی->کف‌های صعودی, requote->ریکوت
- [x] supplydemand-p58 — 22 posts · 9 fixed · sem70: پرچم لیمیت‌ها->FLها, فلیپ->فلپ, زون->ناحیه, base/landscape->پایه/نمای, pull the trigger->دکمه; quote chains synced
- [x] supplydemand-p59 — 24 posts · 4 suspects · 8 fixed · sem70: advice leftover->راهنمایی, دورهction weld->جهت, تاپیک->ترد, QM سطح->سطح QM, شدیدترین->نهایی‌ترین, تاپیک‌های دیگر->تردها

## flaglimits — Flag Limits

53 صفحه / 1270 پست — بازبینی 53 · سابقه 3 · suspects 315

پرحاشیه‌ترین صفحه‌ها: flaglimits-p47 (17) · flaglimits-p44 (16) · flaglimits-p46 (16) · flaglimits-p45 (12) · flaglimits-p48 (12) · flaglimits-p23 (11) · flaglimits-p27 (10) · flaglimits-p32 (10)

- [x] flaglimits-p1 — 25 posts · 5 suspects · 11 fixed · sem70: پرچم→فلگ, leftover Latin (hiccup/preliminary/first time back/fail to return/alienated), flag limit spelled out
- [x] flaglimits-p2 — 25 posts · 2 suspects · 12 fixed · sem70: URL ellipsis corruption x2, pole→پول bug, پرچم→فلگ, Hey leftover, calques
- [x] flaglimits-p3 — 25 posts · 8 suspects · 18 fixed · sem70: پرچم→فلگ mass, pole→پول bug, Hey leftover, cap→کپ, quote sync
- [x] flaglimits-p4 — 25 posts · 3 suspects · 20 fixed · sem70: پرچم→فلگ, pole→پول+hickup leftovers, big picture calque, quote sync x6
- [x] flaglimits-p5 — 25 posts · 8 suspects · 14 fixed · sem70: pole→پول+hickup, Hey/guys leftovers, quote sync, تماشا→نگاه, پرچم→فلگ
- [x] flaglimits-p6 — 25 posts · 2 suspects · 14 fixed · sem70: pole→پول (p133), پرچم→فلگ, FLای leftovers, cluster calque, quote sync
- [x] flaglimits-p7 — 25 posts · 6 suspects · 16 fixed · sem70: @Daft Trader handle translated (fixed), Hey leftover, پرچم→فلگ, pole→پول, quote sync
- [x] flaglimits-p8 — 25 posts · 9 suspects · 13 fixed · sem70: Daft Trader handle translated x5, pole→پول x2, hey/HI leftovers, پرچم, تشکیلات calque
- [x] flaglimits-p9 — 25 posts · 6 suspects · 13 fixed · sem70: fabricated quote head p212, Daft معامله‌گر, demand Latin, فشردگی dup, تماشا vids, quote desync
- [x] flaglimits-p10 — 25 posts · 7 suspects · 15 fixed · sem70: hi/HI/Yo leftovers, demand/supply Latin, quote desync, Markepedia typo, calques
- [x] flaglimits-p11 — 23 posts · 4 suspects · 15 fixed · sem70: Daft معامله‌گر 1, اینگالی misspell, boys بزرگ, pinch-of-salt calque, base→پایه
- [x] flaglimits-p12 — 25 posts · 6 suspects · 9 fixed · sem70: پرچم->فلگ (3), supply->عرضه, Bund->بوند, pinpoint/Flag Latin leftovers, truncated 'I would immediately'
- [x] flaglimits-p13 — 24 posts · 5 suspects · 4 fixed · sem70: supply->عرضه (pocket/zone), pinpoint Latin verb, 'my 10 pips' idiom, Cap of the high
- [x] flaglimits-p14 — 25 posts · 5 suspects · 11 fixed · sem70: demand/supply->تقاضا/عرضه, 'pennies drop' calque, 'mean‌t' Latin leftover, پرچم->فلگ, stray '... .'
- [x] flaglimits-p15 — 25 posts · 2 suspects · 5 fixed · sem70: پرچم->فلگ (pattern), pole->دکل (was 'پول'), supply/demand->عرضه/تقاضا, 'map'/'speak my brains' calques
- [x] flaglimits-p16 — 24 posts · 5 suspects · 13 fixed · sem70: پرچم->فلگ pervasive, demand->تقاضا, fakeout->فیک‌اوت, bounce/base/accumulation/education Latin leftovers, mist calque
- [x] flaglimits-p17 — 25 posts · 6 suspects · 12 fixed · sem70: پرچم->فلگ, FLAG ZONE->ناحیهٔ فلگ, pole->دکل, English leftovers (decision/extreme/significant/base/role/school), price action calque
- [x] flaglimits-p18 — 24 posts · 7 fixed · sem70: URL ellipsis 'homewo… mits' fixed, 'nervouس' garble, significance/dubbed-down/drilled calques, 'ride the ponies' idiom
- [x] flaglimits-p19 — 24 posts · 6 suspects · 13 fixed · sem70: FLAG->فلگ, pole->دکل, engulfed->اینگالف, price action/compression->پرایس اکشن/فشردگی, 'nervou' garble fixed p18, broken emoticon '..:)'
- [x] flaglimits-p20 — 25 posts · 4 suspects · 8 fixed · sem70: 'still'/'sake'/'decision point' Latin leftovers, پرچم->فلگ, accumulation/distribution->انباشت/توزیع, price action, word document
- [x] flaglimits-p21 — 25 posts · 5 suspects · pass-1 verdict · 4 fix pass-1 · 8 fixed · sem70: FL acronym expansion, flag->فلگ, Cap->کپ, pole->دکل, base->پایه, curve-fit calque, 'trying my hand' idiom
- [x] flaglimits-p22 — 24 posts · 1 suspects · 10 fixed · sem70: significance/Decision Point/screen time Latin leftovers, pole->دکل, پرچم->فلگ, retest->ری‌تست
- [x] flaglimits-p23 — 24 posts · 11 suspects · 20 fixed · sem70: calques (grain-of-salt, two-cents), engulf/fakeout/pole->دکل, پرچم->فلگ drift, URL ellipsis, Latin leftovers (Supply/Fake Out/master/thread)
- [x] flaglimits-p24 — 25 posts · 9 suspects · pass-1 verdict · 3 fix pass-1 · 22 fixed · sem70: پرچم->فلگ drift (terminology), pole->دکل, calques (grain of salt, beg-borrow-steal, boom->جهش), fakeout zones->فیک‌اوت, hiccup->خطا
- [x] flaglimits-p25 — 25 posts · 8 suspects · 30 fixed · sem70: pervasive engulf->اینگالف, پرچم/FLAG->فلگ, فشرده‌سازی->کامپرشن, calques (grain of salt, two cents, hit and miss, cheers->خداحافظ, lesson->درس), aud\usd->aud/usd latex
- [x] flaglimits-p26 — 23 posts · 2 suspects · 9 fixed · sem70: compression->کامپرشن, swing high/low mistransliteration های/لو->سقف/کف سوئینگ, slap->سرکوفت (idiom direction)
- [x] flaglimits-p27 — 24 posts · 10 suspects · 22 fixed · sem70: engulf/FLAG->اینگالف/فلگ, pole->دکل (پُل), calques (grain of salt, much appreciated->قدردانی, cheers->خداحافظ, thread->تاپیک), FA para-count mismatches fixed vs EN
- [x] flaglimits-p28 — 20 posts · 3 suspects · 6 fixed · sem70: پرچم->فلگ pattern term drift (3 posts)
- [x] flaglimits-p29 — 17 posts · 6 suspects · 15 fixed · sem70: پرچم/FLAG->فلگ, فشرده‌سازی->کامپرشن, pole->دکل (بیس پل->پایهٔ دکل), paz->PAZ caps
- [x] flaglimits-p30 — 25 posts · 7 suspects · 24 fixed · sem70: پرچم->فلگ, pole/base->دکل/پایهٔ دکل, اینگاف->اینگالف typo, fakeout->فیک‌اوت, calques (trend lines, bounce, refined zone), quote sync wom25
- [x] flaglimits-p31 — 21 posts · 4 suspects · 16 fixed · sem70: pole->دکل, لو پایین->کف, URL ellipsis byte-fix x2, quote sync whynotnaveen+Laksmi, رِنج->رنج, فشرده‌سازی->کامپرشن, پرچم->فلگ, two-cents calque, touch trade->تاچ
- [x] flaglimits-p32 — 25 posts · 10 suspects · 18 fixed · sem70: engulf->اینگالف everywhere, پرچم/FLAG->فلگ, fakeout->فیک‌اوت, pole base->پایهٔ دکل, calques (dodgy, demand/decision Latin)
- [x] flaglimits-p33 — 25 posts · 10 suspects · 14 fixed · sem70: پرچم/FLAG->فلگ, engulf->اینگالف, fake out->فیک‌اوت, پُل->دکل, PUZZLE->پازل, تک‌وکوچک->ریز
- [x] flaglimits-p34 — 24 posts · 5 suspects · 14 fixed · sem70: leftover EN decision/پرچم→فلگ, corrupted URL ellipsis, zoom-out calque, engulf→اینگالف
- [x] flaglimits-p35 — 25 posts · 2 suspects · 18 fixed · sem70: engulf/Engulf/ENG→اینگالف, pole→دکل, hiccup→مکث کوتاه, fakeout→فیک‌اوت, Flag Limit→فلگ لیمیت, FLAG→فلگ, nested quotes synced
- [x] flaglimits-p36 — 25 posts · 1 suspects · 6 fixed · sem70: Flag Limit→فلگ لیمیت, کپچر→عکس از صفحه, تایم‌چارچوب→تایم‌فریم
- [x] flaglimits-p37 — 25 posts · 1 suspects · 17 fixed · sem70: corrupted URL, diamond→الماس, FLAG LIMITS→فلگ لیمیت‌ها, eng→اینگالف, quote chain synced
- [x] flaglimits-p38 — 22 posts · 8 fixed · sem70: eng/ENG→اینگالف, پرچم→فلگ, boys بزرگ→بازیگران بزرگ, لایوم→لایو, FIRST TIME BACK→اولین بازگشت, PIPS→پیپ
- [x] flaglimits-p39 — 25 posts · 2 suspects · 8 fixed · sem70: پرچم→فلگ, پرچم limits→فلگ لیمیت, base pole→پایهٔ دکل, diamond→الماس, fresh/رزولوشن Latin leftovers
- [x] flaglimits-p40 — 22 posts · 2 suspects · 13 fixed · sem70: پرچم→فلگ, Flag limit→فلگ لیمیت, consumption→بلعیده‌شدن, ENG→اینگالف in gloss, تایم‌چارچوب→تایم‌فریم, تکلیف→تمرین, colloquial رو→را
- [x] flaglimits-p41 — 21 posts · 2 suspects · 10 fixed · sem70: flag limits→فلگ لیمیت‌ها, پرچم→فلگ, mpl/qm→MPL/QM caps, OPP dropped restored, جا گذاشت→از دست داد, تمپلیتت→قالب
- [x] flaglimits-p42 — 25 posts · 3 suspects · 16 fixed · sem70: ENGULF→اینگالف, eng→اینگالف, پرچم1→فلگ1, اینگالی→اینگالف, Caps→کپ, FO calques, سفر می‌کند→حرکت می‌کند, HI→سقف
- [x] flaglimits-p43 — 24 posts · 5 suspects · 19 fixed · sem70: engulf→اینگالف, pole→دکل, fake out→فیک‌اوت, FLAG→فلگ, Flag Limit→فلگ لیمیت, price action→رفتار قیمت, compression→فشردگی, corrupted URLs, nested quotes synced
- [x] flaglimits-p44 — 25 posts · 16 suspects · 17 fixed · sem70: corrupted URLs + PNG filename, micro structure→ریزساختار, eng→اینگالف, FLAG→فلگ, Diamonds→الماس‌ها, missing staurum wrote head, quote chains synced
- [x] flaglimits-p45 — 23 posts · 12 suspects · 13 fixed · sem70: leftover eng/ENG/engulf/compression/order flow/flag fixed to اینگالف/فشردگی/اوردر فلو/فلگ; URL ellipsis space removed; calques naturalized
- [x] flaglimits-p46 — 25 posts · 16 suspects · 17 fixed · sem70: eng/ENG/engulf/orderflow/whipsaw/pole/thread/hindsight/English-term leftovers normalized; quotes synced corpus-wide; URLs fixed
- [x] flaglimits-p47 — 25 posts · 17 suspects · 14 fixed · sem70: Engulf/ENG/engulf->اینگالف, pole->پایه, thread->ترد, orderflow->اوردر فلو, master->مستر, compression->فشردگی, calques (light bulb, game changer, bouncer); URLs unspaced; quotes synced
- [x] flaglimits-p48 — 24 posts · 12 suspects · 10 fixed · sem70: engulf/retrace/EG->اینگالف/بازگشت, seniors->پیشکسوت‌ها, thread->ترد, flaks/FLAGS->فلگ‌ها, calques (EUREKA, brain fart, respected); quotes synced 1193/1194
- [x] flaglimits-p49 — 24 posts · 10 suspects · pass-1 verdict · 6 fixed · sem70: پرچم->فلگ (2 posts synced), IC بازارها->IC Markets, SF->S/R, English article title localized, calques
- [x] flaglimits-p50 — 24 posts · 10 suspects · 7 fixed · sem70: engulf->اینگالف x3, Flag->فلگ in Flag Limit def, hindsight->نگاه به گذشته, seniors/thread->پیشکسوت/ترد, Bouncer calque, FL respected calque
- [x] flaglimits-p51 — 24 posts · 8 suspects · 11 fixed · sem70: Engulf/engulf->اینگالف, Base->بیس, FLAG->فلگ, پرچم avoided, peg->نرخ ثابت, master->مستر, thread->ترد, carte blanche->آزاد; Edge-post quote synced to p49 canonical; broken-quote fragments kept aligned
- [x] flaglimits-p52 — 24 posts · 5 suspects · 8 fixed · sem70: Ergo->بنابراین, pole->پایه, thread->ترد, FLAG->فلگ, brain fart calque, sucks->افتضاح, fails-to-spot calque, pronoun fix
- [x] flaglimits-p53 — 17 posts · 1 suspects · 6 fixed · sem70: پرچم->FL (banned glossary form), FL‌ی->FL, کامنت->نظر synced quote, room-to-target calque

## quasimodo — The Quasimodo

52 صفحه / 1220 پست — بازبینی 52 · سابقه 5 · suspects 237

پرحاشیه‌ترین صفحه‌ها: quasimodo-p10 (12) · quasimodo-p40 (11) · quasimodo-p1 (10) · quasimodo-p51 (10) · quasimodo-p13 (9) · quasimodo-p48 (9) · quasimodo-p2 (7) · quasimodo-p4 (7)

- [x] quasimodo-p1 — 25 posts · 10 suspects · 4 fixed · 2-cent idiom, capped->kapp, engulf->ingalf, pole->dekel, origin hamza
- [x] quasimodo-p2 — 23 posts · 7 suspects · 3 fixed · dam->la'nat, engulf->ingalf, gap normalized to gap
- [x] quasimodo-p3 — 20 posts · 4 suspects · 3 fixed · flag->flag (box flag), anatomy convention, quote synced
- [x] quasimodo-p4 — 23 posts · 7 suspects · 6 fixed · treasure direction, hone leftover, viola, south->down, quote synced
- [x] quasimodo-p5 — 24 posts · 1 suspects · 2 fixed · repost synced to p1 canonical, dashed line fix
- [x] quasimodo-p6 — 23 posts · 4 suspects · 3 fixed · missing QM sentence, quote synced, essence leftover, pole->dekel
- [x] quasimodo-p7 — 19 posts · 6 suspects · 2 fixed · quote synced to p5 canonical, shot->saqut calque
- [x] quasimodo-p8 — 21 posts · 6 suspects · 7 fixed · pardon moi, taken->gereft, pole->dekel, garbled comment line, smell->smell
- [x] quasimodo-p9 — 24 posts · 5 suspects · 9 fixed · calque expert call, Wow, salam, futures, baay typo, happy pipping
- [x] quasimodo-p10 — 24 posts · 12 suspects · 13 fixed · fakeout->فیک‌اوت, Latin leftovers fabulous/beast/hmmm/Hey, quote artifact نقل], garbled 245, confluence->کانفلون
- [x] quasimodo-p11 — 24 posts · 7 suspects · 14 fixed · numbers kept Latin (5:1,15M,3pip), Latin leftovers Hey/hatchery/gifted/crystal, typo->تایپی, garbled docent-pop clause
- [x] quasimodo-p12 — 25 posts · 6 suspects · pass-1 verdict · 15 fixed · quote drift synced (278->275, 279->271), emoticon position, QMای glue, hom calque, reversed do-i-care, calques value/first-your-question
- [x] quasimodo-p13 — 24 posts · 9 suspects · 15 fixed · quote drift synced to canonical, engulf->اینگالف x3, Latin Hey/Featured, perfect->ایده‌آل, hindsight-aside reversed, ace->تریدرهای Ace
- [x] quasimodo-p14 — 24 posts · 6 suspects · 8 fixed · calque QM homework order, pudding idiom localized, FTB/FTB gloss distinct, Hmmm/leg Latin, hindsight-direction fixes
- [x] quasimodo-p15 — 25 posts · 3 suspects · 10 fixed · home stretch calque+Latin, exotics->اگزوتیک, missed-the-party idiom, URL ellipsis restored, EUR/USH typo->EUR/USD, break-even clarity
- [x] quasimodo-p16 — 23 posts · 6 suspects · 14 fixed · Lower-High->سقف پایین‌تر mistranslation, Fake->فیک‌اوت, engulf->اینگالف, pole->دکل, FTB gloss synced, kicker bar, veterans calque
- [x] quasimodo-p17 — 24 posts · 5 suspects · 14 fixed · IF quote synced to if-p6 canonical, QM سطح->سطح QM x2, engulf Latin x2, result-orientated/go-south calques, extreme glued
- [x] quasimodo-p18 — 25 posts · 5 suspects · 16 fixed · QM سطح word order, quote chains synced (441/442,446/449/450,447/448), result-orientated->نتیجه‌محور, go-south, ITs preserved, HW->تکلیف
- [x] quasimodo-p19 — 25 posts · 6 suspects · 5 fixed · calques: QM سطح word order x2, QM الگو->شکل‌گیری, قدردانی passive, آبی 1 order
- [x] quasimodo-p20 — 25 posts · 7 suspects · 7 fixed · calques+leftover EN: engulf/alerts Latin, pinch-of-salt, itchy fingers, QM سطح inversion x3, meaningful->مهم
- [x] quasimodo-p21 — 25 posts · 6 suspects · pass-1 verdict · 1 fix pass-1 · 4 fixed · Dimond->الماس x2 quote pair, Forex Tester Latin, بی‌دردسر phrasing
- [x] quasimodo-p22 — 25 posts · 6 suspects · 12 fixed · quote-chain realigned to canonical (526-528), leftover EN 532/533/542, QM سطح inversions, futures calque, AHA/eyeballs idioms
- [x] quasimodo-p23 — 25 posts · 3 suspects · 13 fixed · BBCode img attr translated, sideways leftover EN, great-looking/ok-looking/alert Latin, QM سطح inversion, 3:1->سه‌به‌یک, calques (poetry in motion, thanks in advance)
- [x] quasimodo-p24 — 23 posts · 2 suspects · 2 fixed · quote 583 realigned to canonical 515, Sorry->متأسفانه sense, پولبک->ریتریس
- [x] quasimodo-p25 — 24 posts · 1 suspects · 14 fixed · banned اینگالی, EG->اینگالف, QM سطح inversions x3, quote sync 609/610+623/624, handle In2فارکس->In2forex, calques (pole->دکل, my 2 cents, multi-tasking, confidence)
- [x] quasimodo-p26 — 25 posts · 6 suspects · 17 fixed · URL corrupted+translated (642), engulf leftover x3, QM سطح inversions, capped leftover, quote sync vs p25 fixes, calques (Oh well->آها خوب,Thanks in advance)
- [x] quasimodo-p27 — 24 posts · 2 suspects · 11 fixed · leftover EN Science/Art/HISTORY, scorched-in-history calque, QM سطح x3, handle case in2forex, two-cents calque, suck register
- [x] quasimodo-p28 — 25 posts · 3 suspects · pass-1 verdict · 3 fix pass-1 · 4 fixed · فشردگی glossary fix + quote-chain sync
- [x] quasimodo-p29 — 25 posts · 2 suspects · 12 fixed · engulfing->اینگالف, nested quote sync
- [x] quasimodo-p30 — 24 posts · 1 suspects · pass-1 verdict · 1 fix pass-1 · 8 fixed · quote chain + PA wording fixes
- [x] quasimodo-p31 — 25 posts · 5 suspects · 16 fixed · deep nested quote-chain resync
- [x] quasimodo-p32 — 24 posts · 4 suspects · 16 fixed · quote chain + calque/naturalness fixes
- [x] quasimodo-p33 — 24 posts · 3 suspects · 8 fixed · English leftovers (headsup/engulfing/overshoot/clue), awkward wording
- [x] quasimodo-p34 — 25 posts · 2 suspects · 11 fixed · transliteration 'salam', quote sync, engulf->اینگالف, calques
- [x] quasimodo-p35 — 23 posts · 1 suspects · 10 fixed · meaning fixes, calques, quote sync check
- [x] quasimodo-p36 — 23 posts · 4 suspects · 16 fixed · colloquial register->standard, فشردگی/اینگالف glossary, quote sync, dup hash posts
- [x] quasimodo-p37 — 25 posts · 3 suspects · 1 fixed · p37_916 tweezer tops calqued as قله دوقلوی پنس -> موچین تاپ
- [x] quasimodo-p38 — 24 posts · 2 suspects · 14 fixed · residual Latin engulf/eg, corrupted URL in 950, calques (pan out, entry level, ss), glossary fixes
- [x] quasimodo-p39 — 23 posts · 4 suspects · 9 fixed · residual English hurt/engulf/Eg, calques, quote sync 967-969; +973 Eg->اینگالف
- [x] quasimodo-p40 — 25 posts · 11 suspects · 2 fixed · 976 فشرده‌سازی->فشردگی banned term; 989 beginner's luck plural
- [x] quasimodo-p41 — 25 posts · 4 suspects · 11 fixed · Latin leftovers engolfe/annotation/seniors, calques, quote sync chain 1004-1008, عرضهای typo
- [x] quasimodo-p42 — 24 posts · 2 suspects · 3 fixed · 1033 grammar, 1035 calques+typo از همین رو, 1041 convoluted engulf clause
- [x] quasimodo-p43 — 24 posts · 4 suspects · 6 fixed · پرچم banned in 1058, can-can mistranslated, homework->تمرین, calques
- [x] quasimodo-p44 — 25 posts · 4 suspects · 10 fixed · invented QM in 1077/1098, intery->entry mistranslation, eg engulf calques, direction errors 1084, quote sync 1095/1096
- [x] quasimodo-p45 — 25 posts · 3 suspects · 13 fixed · corrupted URLs 1123/1124, پرچم+ENG leftovers, quote chain 1111-1112-1120 synced, calques
- [x] quasimodo-p46 — 25 posts · 1 suspects · pass-1 verdict · 6 fix pass-1 · 1 fixed · pole calque پل→دکل, pullback phrasing
- [x] quasimodo-p47 — 21 posts · 2 suspects · 3 fixed · URL corrupted w/ Persian, Drop بیس Rally hybrid, پرچم→فلگ
- [x] quasimodo-p48 — 24 posts · 9 suspects · 3 fixed · residual ENG x3, hey استاد, quote sync
- [x] quasimodo-p49 — 17 posts · 3 suspects · 2 fixed · taken out mistranslated, URL+پرچم
- [x] quasimodo-p50 — 20 posts · 1 suspects · 1 fixed · فیکاوت→فیک‌اوت glossary
- [x] quasimodo-p51 — 23 posts · 10 suspects · 5 fixed · Engulfs leftover, Dear/MOST Latin, pole Latin, less reliable reversed, Crikey mixed-script
- [x] quasimodo-p52 — 11 posts · 1 suspects · 3 fixed · فشرده‌سازی→فشردگی, ENG residual, پل→دکل

## gembel — gembel journal trading

48 صفحه / 1197 پست — بازبینی 48 · سابقه 0 · suspects 376

پرحاشیه‌ترین صفحه‌ها: gembel-p36 (15) · gembel-p27 (14) · gembel-p28 (13) · gembel-p42 (13) · gembel-p47 (13) · gembel-p16 (12) · gembel-p18 (12) · gembel-p26 (12)

- [x] gembel-p1 — 25 posts · 6 suspects · 11 fixed · sem70: calques (shot->تلاش، tricky/backtesting/confluence Latin leftovers)، پرچم->فلگ، decision point فارسی شد
- [x] gembel-p2 — 25 posts · 2 suspects · 15 fixed · sem70: هhhh mixed-script، watchlist/limit/retrace leftovers، calques (trade plan/plug)، condom slang
- [x] gembel-p3 — 25 posts · 10 suspects · 9 fixed · sem70: پرچم->فلگ، اینگاففی->اینگالف، you're welcome direction fix، ZOI long-post rewrite
- [x] gembel-p4 — 25 posts · 5 suspects · 18 fixed · sem70: long smimon quote synced، bear trap/Eng Latin leftovers، master trader rank، نشستن خواندن calque، mapping garble
- [x] gembel-p5 — 25 posts · 3 suspects · 13 fixed · sem70: پلن->برنامه، hi there calque، hii mixed-script، take a bath idiom
- [x] gembel-p6 — 25 posts · 2 suspects · 16 fixed · sem70: پرچم c8->فلگ، atm/limit/tp Latin leftovers، hii mixed-script، backtesting->بک‌تست
- [x] gembel-p7 — 25 posts · 1 suspects · 18 fixed · sem70: invented wrote-head removed، پرچم->فلگ، pole->دکل، slap-in-face idiom، can can/source garble
- [x] gembel-p8 — 25 posts · 15 fixed · sem70: watch list/PO/CP leftovers، pole->دکل پایه، پرچم->فلگ، quote sync p7_169
- [x] gembel-p9 — 25 posts · 1 suspects · 16 fixed · sem70: بااکس typo، obviousnya Indonesian، پرچم->فلگ، pole->دکل، quote sync p8_198
- [x] gembel-p10 — 25 posts · 3 suspects · 15 fixed · sem70: drawdown/bias/backtesting leftovers، balls idiom، higher mixed-script، quote sync
- [x] gembel-p11 — 25 posts · 9 suspects · 15 fixed · sem70: backtesting/bias/atm/tricky leftovers، hii mixed-script، bull/bear خرس drift، got carried away idiom
- [x] gembel-p12 — 25 posts · 4 suspects · 17 fixed · sem70: همیشهshit mixed-script، nailed it->پیداش کردم، wear HTF glasses، tricky leftovers، hii mixed-script
- [x] gembel-p13 — 25 posts · 7 suspects · 18 fixed · sem70: calques, پرچم→فلگ, قطب→دکل, corrupted URL, IC Markets split
- [x] gembel-p14 — 24 posts · 5 suspects · 8 fixed · sem70: calques, IT glue, mistranslated Would-you-mind, quote sync
- [x] gembel-p15 — 25 posts · 3 suspects · 11 fixed · sem70: leftover English, yesterday→امروز fix, garbled sentences, decimal 0,1-0,2
- [x] gembel-p16 — 25 posts · 12 suspects · 14 fixed · sem70: embedded English, glued scripts, ass-hole direction, truncation in 391 quote
- [x] gembel-p17 — 25 posts · 9 suspects · 18 fixed · sem70: truncated 401, calques, ShadowPit terminology, PATIENCE split, drawdown leftovers
- [x] gembel-p18 — 25 posts · 12 suspects · 22 fixed · sem70: heavy calques, leftover English, untranslated para in 426, kaboom, watchlist/bias
- [x] gembel-p19 — 25 posts · 6 suspects · 11 fixed · sem70: pole→دکل, busted QM, truncation 457, capped leftovers, DD glue
- [x] gembel-p20 — 25 posts · 5 suspects · 10 fixed · sem70: پرچم→فلگ, tricky/capped leftovers, Great read calque
- [x] gembel-p21 — 25 posts · 4 suspects · 17 fixed · sem70: FLAG→فلگ, Dr Swing, watchlist/mid leftovers, draw down, quote sync 504-510
- [x] gembel-p22 — 25 posts · 9 suspects · 14 fixed · sem70: mid/watchlist leftovers, batu, exhausted, quote sync 540
- [x] gembel-p23 — 24 posts · 5 suspects · 18 fixed · sem70: الگوی لول→سطح/الماس, kalque leftovers, broken grammar 571
- [x] gembel-p24 — 25 posts · 10 suspects · 15 fixed · sem70: breach calque, push→هجوم, smart money, FTR fix
- [x] gembel-p25 — 25 posts · 6 suspects · 22 fixed · sem70: calques (pole/mid-range/otw calqued), rewritten 22/25 posts; pole kept Latin per gembel-p19 precedent
- [x] gembel-p26 — 25 posts · 12 suspects · 16 fixed · sem70: calque sweep p26, 16 posts rewritten naturally
- [x] gembel-p27 — 25 posts · 14 suspects · 15 fixed · sem70: calque sweep p27, hate-spamming direction fix, nested quotes preserved
- [x] gembel-p28 — 25 posts · 13 suspects · 9 fixed · sem70: calque sweep p28
- [x] gembel-p29 — 25 posts · 10 suspects · 15 fixed · sem70: calque sweep p29; fixed SL-lo glue, :lol: emoticon, diamond->الماس
- [x] gembel-p30 — 25 posts · 11 suspects · 9 fixed · sem70: calque sweep p30; diamond->الماس, breach->شکستن, quote synced
- [x] gembel-p31 — 25 posts · 12 suspects · 6 fixed · sem70: calque sweep p31; bye->BO seller typo, pollute->شلوغ, MM glue
- [x] gembel-p32 — 25 posts · 10 suspects · 8 fixed · sem70: calque sweep p32; diamond->الماس, busted fix, MM glue
- [x] gembel-p33 — 25 posts · 8 suspects · 9 fixed · sem70: calque sweep p33; shoulder->شانه, Manufacturing, quotes synced
- [x] gembel-p34 — 24 posts · 9 suspects · 7 fixed · sem70: calque sweep p34; پرچم->فلگ, عرضهی glue, long TheLastNail rewrite
- [x] gembel-p35 — 25 posts · 7 suspects · 8 fixed · sem70: calque sweep p35; پرچم->فلگ, suddenly, quote synced to p34-849
- [x] gembel-p36 — 25 posts · 15 suspects · 13 fixed · sem70: calque sweep p36; likely-the-second fix, hit-and-run, quote synced
- [x] gembel-p37 — 25 posts · 8 suspects · 19 fixed · sem70: calques, leftover EN, glossary terms (pole->پایه, bear trap->تله خرس, fake out->فیک‌اوت), quote chains synced
- [x] gembel-p38 — 25 posts · 6 suspects · 13 fixed · sem70: calques, leftover EN, pole->پایه, flag->فلگ, bear trap->تله خرس, whipsaw->ویپ‌ساو
- [x] gembel-p39 — 25 posts · 7 suspects · 15 fixed · sem70: calques, leftover EN (rational, cue, hedging, nailed, pls, reload), POL quote chains synced
- [x] gembel-p40 — 25 posts · 10 suspects · 14 fixed · sem70: calques, پرچم->فلگ, فریب->فیک‌اوت, تماشا->رصد, running like hell localized
- [x] gembel-p41 — 25 posts · 9 suspects · 14 fixed · sem70: calques (اكسترم, ترید leftovers), pole->پایه, retest->ری‌تست, quote chains synced
- [x] gembel-p42 — 25 posts · 13 suspects · 19 fixed · sem70: calques, leftover EN, diamond->الماس, pole->پایه, تماشا->رصد, retest->ری‌تست
- [x] gembel-p43 — 25 posts · 7 suspects · 17 fixed · sem70: calques, leftover EN (damn, base, otw), pole->پایه, تماشا->رصد, فریب->فیک‌اوت, NJ->UJ fix, quote chains synced
- [x] gembel-p44 — 25 posts · 10 suspects · 20 fixed · sem70: calques, leftover EN profanity, لوزی->الماس, pole->پایه, تماشا->رصد/نگاه, quote chains synced
- [x] gembel-p45 — 25 posts · 9 suspects · 21 fixed · sem70: calques, leftover EN (shittt, damn, bull), pole->پایه, تماشا->رصد, NJ->UJ fix, quote chains synced
- [x] gembel-p46 — 25 posts · 12 suspects · 21 fixed · sem70: calques, leftover EN (shittt, damn, f"cker, bull), تله خرس, تماشا->نگاه/رصد, quote chains synced
- [x] gembel-p47 — 25 posts · 13 suspects · 19 fixed · sem70: emoticon drift :)->:), associate glossary, تماشا->رصد, SH1tt->لعنتی, mrirfan->mirfan, quote chains synced
- [x] gembel-p48 — 25 posts · 12 suspects · 20 fixed · sem70: calques, leftover EN (damn, bull trap, otw, breach, hedging), لوزی->الماس, pole->پایه, تماشا->نگاه/رصد, quote chains synced

## classroom — The Classroom

49 صفحه / 1196 پست — بازبینی 49 · سابقه 4 · suspects 370

پرحاشیه‌ترین صفحه‌ها: classroom-p42 (17) · classroom-p46 (17) · classroom-p47 (16) · classroom-p48 (16) · classroom-p22 (14) · classroom-p45 (14) · classroom-p41 (13) · classroom-p43 (13)

- [x] classroom-p1 — 25 posts · 4 suspects · 6 fixed · sem70: calques (بسوزان پول reversed, می‌سوزی/get burned, عزیز zones),_if-question fix, m8->رفیق, کی->کدام ارز
- [x] classroom-p2 — 25 posts · 6 suspects · 16 fixed · sem70: calques (گلاما,لبخندها->imogi,می‌تراشد,اعصابت می‌خاری,اکسترمم,بهترین‌ها signoff,Hey Hornet), cap->کپ, quote sync x6, noobsville->تازه‌کار, decision->نقطه تصمیم
- [x] classroom-p3 — 25 posts · 7 suspects · 11 fixed · sem70: touch trade لمسی->تاچ, spurious Alientrader head, supply->عرضه D1 fix, calques (مغازه می‌بندم,صید, dip,BOOM), Keuger->Kruger, major/minor->اصلی/فرعی
- [x] classroom-p4 — 25 posts · 8 suspects · 11 fixed · sem70: flag->فلگ x6 (پرچم banned), consolidation->تثبیت, best->موفق باشی signoff+quote sync, Resistance/Support labels, RALLY BASE DROP, reordered paras p99, URL ellipsis fix
- [x] classroom-p5 — 25 posts · 7 suspects · 6 fixed · sem70: quote drift p5_103 synced, Hey Piptin, play out calque, URL ellipsis p5_113, room title Latin, beside->سطح S/R mistranslation
- [x] classroom-p6 — 25 posts · 5 suspects · 7 fixed · sem70: flag->فلگ, URL ellipsis, no go->رد, treat->رفتار calque fix, امکانات->احتمالات, Pin Bar mixed script, پاک->مصرف, خودگویان->خودگویا
- [x] classroom-p7 — 25 posts · 8 suspects · 7 fixed · sem70: دیده نمی‌شود, اینگالف, calque friends fix, Guilty->گناهکارم, Hey IF->سلام, پرچم->فلگ
- [x] classroom-p8 — 25 posts · 7 suspects · 9 fixed · sem70: پرچم->فلگ x2, OH leftover, decimate calque, 1،45->1,45, Erm->همم, اینگاف->اینگالف, flag limit->فلگ لیمیت, news release calque
- [x] classroom-p9 — 25 posts · 9 suspects · 13 fixed · sem70: quote drift p8 sync x3, QM level->سطح QM, فلگ لیمیت sync, پرچم->فلگ x2, truncated p9_218, see the light calque, doubled quote head p9_211, dead cert->قطعی
- [x] classroom-p10 — 25 posts · 5 suspects · 13 fixed · sem70: پرچم->فلگ x5, tg calque, obvious/hindsight/Okay/edge leftovers, ENG->اینگالف, great read calque + quote sync x3, دیتا->داده + quote sync, داده‌های قیمت
- [x] classroom-p11 — 24 posts · 5 suspects · 12 fixed · sem70: flag/engulf/cap terminology and prose fixes
- [x] classroom-p12 — 24 posts · 6 suspects · 7 fixed · sem70: flag-limit/POLE/coast-to-coast terminology
- [x] classroom-p13 — 25 posts · 3 suspects · 9 fixed · sem70: ticker/engulf/cap terminology
- [x] classroom-p14 — 25 posts · 3 suspects · 6 fixed · sem70: figure-out/ticker/topic terminology
- [x] classroom-p15 — 25 posts · 2 suspects · 8 fixed · sem70: compression/flag/engulf terminology
- [x] classroom-p16 — 25 posts · 6 suspects · 16 fixed · sem70: flag/engulf/compression/touch-trade fixes
- [x] classroom-p17 — 25 posts · 8 suspects · pass-1 verdict · 2 fix pass-1 · 5 fixed · sem70: flag/engulf/key-levels consistency
- [x] classroom-p18 — 25 posts · 4 suspects · 10 fixed · sem70: flag/engulf/diamond/prose fixes
- [x] classroom-p19 — 24 posts · 2 suspects · 5 fixed · sem70: cap/pennant/diamond/engulf fixes
- [x] classroom-p20 — 24 posts · 9 suspects · 14 fixed · sem70: flag-limit/cap/engulf/diamond fixes
- [x] classroom-p21 — 25 posts · 8 suspects · 19 fixed · sem70: banned پرچم→فلگ, فشرده‌سازی→فشردگی, untranslated post 524, leftover English (1st/cap/source/order flow), quote sync 510/519 515/517 521/525, calques
- [x] classroom-p22 — 25 posts · 14 suspects · 19 fixed · sem70: banned پرچم, Latin leftovers (paz/ftr/bar/stop/doubt/real time/level to level), Associate→تریدر سطح اَسوشیت, URL ellipsis fix 549, quote-chain sync 526-542
- [x] classroom-p23 — 25 posts · 7 suspects · 18 fixed · sem70: banned اینگالغ→اینگاف, پرچم→فلگ, فشرده‌سازی→فشردگی, URL ellipsis corruption (552,561/563), quote sync vs p21/p22 fixes, Latin leftovers
- [x] classroom-p24 — 25 posts · 5 suspects · pass-1 verdict · 2 fix pass-1 · 9 fixed · sem70: پرچم→فلگ/فلگ لیمیت, cap→کپ, flag limit mistranslated as FL, RRR→RR, سوئینگ→سوینگ, calques
- [x] classroom-p25 — 25 posts · 4 suspects · 17 fixed · sem70: untranslated post 620, quote sync 591/606 603/605 612/613, cap→کپ, FL→فلگ لیمیت, Latin leftovers (point b/wicks/fake out/obvious), calques
- [x] classroom-p26 — 22 posts · 5 suspects · 9 fixed · sem70: cap→کپ, پرچم→فلگ, URL ellipsis corruption 636, confirmed/engulf Latin leftover 631, touch entry→ورود با تاچ, seniors→سینیورها
- [x] classroom-p27 — 25 posts · 10 suspects · 12 fixed · sem70: پرچم→فلگ, FL→فلگ لیمیت, PA Bullish Engulf→اینگاف صعودی PA, فلیپ SR→سواپ SR, Pin Bar→پین‌بار, quote sync 657/658 661/662 666/667
- [x] classroom-p28 — 25 posts · 7 suspects · pass-1 verdict · 2 fix pass-1 · 4 fixed · sem70: پرچم‌گذاری→فلگ‌گذاری, cap→کپ, فشرده‌سازی→کامپرشن, FL→فلگ لیمیت/فلگ, دیلی→روزانه, quote sync 676/693
- [x] classroom-p29 — 25 posts · 5 suspects · 8 fixed · sem70: پرچم/FL→فلگ/فلگ لیمیت, BTW→راستی, فشرده‌سازی→کامپرشن, SRها calque, flag→فلگ; quote sync 707/708/710/714/717/718
- [x] classroom-p30 — 25 posts · 4 suspects · 14 fixed · sem70: compression/Engulf/bar/base calques→کامپرشن/اینگالف/کندل/پایه, leftover EN در 731, کوئینک، cap→کپ, اینگاففی/کهredsword11 typos, Eureka→یافتم; quote sync 742/746/747/748
- [x] classroom-p31 — 25 posts · 7 suspects · 15 fixed · sem70: 15 posts redrafted (untranslated EN, calque, flag->فلگ)
- [x] classroom-p32 — 25 posts · 11 suspects · 13 fixed · sem70: engulf->اینگالف, پرچم->فلگ, Diamond->الماس, removed leftover EN
- [x] classroom-p33 — 25 posts · 10 suspects · 21 fixed · sem70: engulf->اینگالف, Diamond->الماس, پرچم->فلگ, quote sync, URL byte-fix
- [x] classroom-p34 — 25 posts · 8 suspects · 12 fixed · sem70: engulf->اینگالف, quote sync, volatility contraction translated
- [x] classroom-p35 — 25 posts · 5 suspects · 17 fixed · sem70: engulf/پرچم/fakeout->اینگالف/فلگ/فیک‌اوت, calques (pole->پایه, cap->کپ)
- [x] classroom-p36 — 24 posts · 6 suspects · 20 fixed · sem70: engulf->اینگالف, پرچم->فلگ, cap->کپ, pole->پایه, URL ellipsis fix
- [x] classroom-p37 — 25 posts · 5 suspects · 12 fixed · sem70: engulf->اینگالف, quote sync, URL ellipsis byte-fix
- [x] classroom-p38 — 25 posts · 7 suspects · 16 fixed · sem70: engulf/diamond/پرچم->اینگالف/الماس/فلگ, supply->عرضه, a priori translated
- [x] classroom-p39 — 25 posts · 7 suspects · 13 fixed · sem70: engulf->اینگالف, quasimodo->کیوام, URL ellipsis fix, quote sync
- [x] classroom-p40 — 25 posts · 8 suspects · 14 fixed · sem70: engulf->اینگالف, pole->پایه, flag->فلگ, gap->گپ, quote sync
- [x] classroom-p41 — 25 posts · 13 suspects · 25 fixed · sem70: MT calque residue, leftover EN terms; retranslated all posts
- [x] classroom-p42 — 25 posts · 17 suspects · 25 fixed · sem70: heavy MT calque + residual EN; retranslated all
- [x] classroom-p43 — 25 posts · 13 suspects · 19 fixed · sem70: calques+residual EN (fakeout/bulltrap/eureka); retranslated
- [x] classroom-p44 — 25 posts · 5 suspects · 13 fixed · sem70: banned فشرده‌سازی→فشردگی, broken URL ellipsis, residual EN
- [x] classroom-p45 — 25 posts · 14 suspects · 17 fixed · sem70: diamond→الماس, فیک‌اوت, calques; retranslated
- [x] classroom-p46 — 25 posts · 17 suspects · 18 fixed · sem70: calques, residual EN, quote-sync across 5 quoting posts
- [x] classroom-p47 — 25 posts · 16 suspects · 14 fixed · sem70: broken URL ellipses, calques, quote-sync across chain
- [x] classroom-p48 — 25 posts · 16 suspects · 14 fixed · sem70: اینگالی→اینگالف banned variants, calques, quote-sync
- [x] classroom-p49 — 4 posts · 2 suspects · pass-1 verdict · 2 fix pass-1 · sem70: 4 posts, clean

## aboutcompression — About Compression

50 صفحه / 1179 پست — بازبینی 50 · سابقه 4 · suspects 244

پرحاشیه‌ترین صفحه‌ها: aboutcompression-p5 (11) · aboutcompression-p14 (11) · aboutcompression-p4 (10) · aboutcompression-p1 (9) · aboutcompression-p23 (9) · aboutcompression-p2 (8) · aboutcompression-p36 (8) · aboutcompression-p8 (7)

- [x] aboutcompression-p1 — 25 posts · 9 suspects · pass-1 verdict · 2 fix pass-1 · 6 fixed · sem70: فشرده‌سازی→فشردگی، flag→فلگ، bull flag→فلگ صعودی، pole→دکل، calques
- [x] aboutcompression-p2 — 25 posts · 8 suspects · 3 fixed · sem70: URL corruption acegazette (p53,p57), زون‌های پایه→ساده
- [x] aboutcompression-p3 — 22 posts · 6 suspects · 2 fixed · sem70: quote sync زون‌های ساده, چشم بازار calque, represents→نماینده
- [x] aboutcompression-p4 — 21 posts · 10 suspects · 8 fixed · sem70: پرچم→فلگ, فشرده‌سازی→فشردگی, پل→دکل, calques
- [x] aboutcompression-p5 — 23 posts · 11 suspects · 10 fixed · sem70: فشرده‌سازی→فشردگی, CPای glued, برداشتن→مصرف کردن (sync 141/142/144)
- [x] aboutcompression-p6 — 19 posts · 5 suspects · 6 fixed · sem70: فشرده‌سازی→فشردگی (sync 165/166), CP‌ا glued, چند فکر→نکته
- [x] aboutcompression-p7 — 25 posts · 5 suspects · 4 fixed · sem70: sore thumb idiom, Decision Point→نقطهٔ تصمیم, take the turn→ادامه
- [x] aboutcompression-p8 — 24 posts · 7 suspects · 2 fixed · sem70: take out→مصرف, factors→عوامل
- [x] aboutcompression-p9 — 21 posts · 6 suspects · 5 fixed · sem70: پرچم→فلگ, پل→دکل, بیس→پایه, آلوده→شلوغ, فشرده‌سازی→فشردگی
- [x] aboutcompression-p10 — 23 posts · 5 suspects · 11 fixed · sem70: kick yourself, فشرده‌سازی→فشردگی, پرچم→فلگ, CPهایت glued, calques
- [x] aboutcompression-p11 — 22 posts · 5 suspects · 4 fixed · sem70: glossary sweep (فشرده‌سازی→فشردگی, پرچم→فلگ, سوآپ→سواپ, pole→پول), calques, URL/quote sync
- [x] aboutcompression-p12 — 20 posts · 5 suspects · 9 fixed · sem70: glossary sweep (فشرده‌سازی→فشردگی, پرچم→فلگ, سوآپ→سواپ, pole→پول), calques, URL/quote sync
- [x] aboutcompression-p13 — 21 posts · 6 suspects · 7 fixed · sem70: glossary sweep (فشرده‌سازی→فشردگی, پرچم→فلگ, سوآپ→سواپ, pole→پول), calques, URL/quote sync
- [x] aboutcompression-p14 — 24 posts · 11 suspects · 6 fixed · sem70: glossary sweep (فشرده‌سازی→فشردگی, پرچم→فلگ, سوآپ→سواپ, pole→پول), calques, URL/quote sync
- [x] aboutcompression-p15 — 24 posts · 4 suspects · 14 fixed · sem70: glossary sweep (فشرده‌سازی→فشردگی, پرچم→فلگ, سوآپ→سواپ, pole→پول), calques, URL/quote sync
- [x] aboutcompression-p16 — 25 posts · 4 suspects · 5 fixed · sem70: glossary sweep (فشرده‌سازی→فشردگی, پرچم→فلگ, سوآپ→سواپ, pole→پول), calques, URL/quote sync
- [x] aboutcompression-p17 — 23 posts · 6 suspects · 10 fixed · sem70: glossary sweep (فشرده‌سازی→فشردگی, پرچم→فلگ, سوآپ→سواپ, pole→پول), calques, URL/quote sync
- [x] aboutcompression-p18 — 25 posts · 6 suspects · pass-1 verdict · 2 fix pass-1 · 10 fixed · sem70: glossary sweep (فشرده‌سازی→فشردگی, پرچم→فلگ, سوآپ→سواپ, pole→پول), calques, URL/quote sync
- [x] aboutcompression-p19 — 21 posts · 5 suspects · 10 fixed · sem70: glossary sweep (فشرده‌سازی→فشردگی, پرچم→فلگ, سوآپ→سواپ, pole→پول), calques, URL/quote sync
- [x] aboutcompression-p20 — 25 posts · 7 suspects · 8 fixed · sem70: glossary sweep (فشرده‌سازی→فشردگی, پرچم→فلگ, سوآپ→سواپ, pole→پول), calques, URL/quote sync
- [x] aboutcompression-p21 — 25 posts · 5 suspects · 6 fixed · sem70: meaning-fix dir-reversal + Latin leftovers
- [x] aboutcompression-p22 — 25 posts · 6 suspects · 10 fixed · sem70: پرچم->فلگ, Latin leftovers, Supply/Demand EN words, calques
- [x] aboutcompression-p23 — 25 posts · 9 suspects · 11 fixed · sem70: پرچم->فلگ, engulf->اینگالف, pole->دکل, EN leftovers
- [x] aboutcompression-p24 — 24 posts · 6 suspects · 9 fixed · sem70: gibberish ejemlpares, EN leftovers Breakout/sl/pole, Supply/Demand
- [x] aboutcompression-p25 — 25 posts · 2 suspects · 6 fixed · sem70: significance, swap->سواپ, pull down, pole, calque جیب
- [x] aboutcompression-p26 — 23 posts · 4 suspects · 15 fixed · sem70: banned فشرده‌سازی->فشردگی x12 posts, ENG->اینگالف, calques
- [x] aboutcompression-p27 — 23 posts · 2 suspects · 15 fixed · sem70: banned فشرده‌سازی x14 posts, بیس->base, grammar
- [x] aboutcompression-p28 — 22 posts · 5 suspects · 9 fixed · sem70: URL ellipsis, فشرده‌سازی, pole->دکل, bar->کندل
- [x] aboutcompression-p29 — 25 posts · 2 suspects · 11 fixed · sem70: فشرده‌سازی x7, کنده->کُند, عرضای typo, پولبک
- [x] aboutcompression-p30 — 25 posts · 6 fixed · sem70: فشرده‌سازی x5, پولبک->برگشت
- [x] aboutcompression-p31 — 24 posts · 3 fixed · sem70: فشرده‌سازی→فشردگی glossary fix in 3 posts
- [x] aboutcompression-p32 — 24 posts · 5 suspects · 3 fixed · sem70: پرچم→فلگ (bull flag), خوش‌آمده→خوش‌آمدن, calque fix
- [x] aboutcompression-p33 — 25 posts · 6 suspects · 4 fixed · sem70: speaks-volumes calque, FLیی doubled y, sign-off + meaning drift
- [x] aboutcompression-p34 — 25 posts · 5 suspects · 12 fixed · sem70: انگلاف→اینگالف x4, خوش‌آمده→خوش‌آمدن, path-of-least-resistance, misc
- [x] aboutcompression-p35 — 25 posts · 1 suspects · pass-1 verdict · 6 fix pass-1 · 21 fixed · sem70: page-wide MT register+فشرده‌سازی→فشردگی, colloquial redraft
- [x] aboutcompression-p36 — 25 posts · 8 suspects · 12 fixed · sem70: پرچم/انگلاف/Latin leftovers, ENTIRE, ENTIRE/ENTIRE
- [x] aboutcompression-p37 — 24 posts · 2 suspects · 14 fixed · sem70: IT‌ا→ITها, pennant→پننت, register, Hmm/که که typos
- [x] aboutcompression-p38 — 25 posts · 6 suspects · 19 fixed · sem70: فشرده‌سازی→فشردگی page-wide, pole→پایه, flag→فلگ, register
- [x] aboutcompression-p39 — 24 posts · 4 suspects · 22 fixed · sem70: فشرده‌سازی sweep, URL ellipsis fix, فرماسیون, Markepedia spelling, register
- [x] aboutcompression-p40 — 21 posts · 7 suspects · 18 fixed · sem70: فشرده‌سازی sweep, pole→پایه, whipsaw translit→Latin, register
- [x] aboutcompression-p41 — 24 posts · 1 suspects · 9 fixed · sem70: فشرده‌سازی>فشردگی x8 posts, quote sync, افراد بزرگ>بزرگواران
- [x] aboutcompression-p42 — 24 posts · 4 suspects · pass-1 verdict · 4 fix pass-1 · 4 fixed · sem70: URL ellipsis corruption x2 (homewo...sion), Liquidity>نقدینگی, آنومالی>ناهنجاری, خوش‌قیافه>بهترین
- [x] aboutcompression-p43 — 22 posts · 4 suspects · 17 fixed · sem70: فشرده‌سازی>فشردگی corpus-wide page, quote sync p42_1075, پل>دکل, دست زدن>تاچ, کانتکست>بافت, URL journa...rnal
- [x] aboutcompression-p44 — 23 posts · 3 suspects · 4 fixed · sem70: Latin Compression>فشردگی in prose x4 posts (filenames/links kept Latin)
- [x] aboutcompression-p45 — 24 posts · 2 suspects · 6 fixed · sem70: ENGULF>اینگالف, EG>اینگالف, Compression>فشردگی, swap>سواپ, Cp paz>CP PAZ, stray period/comma, hey>هی, کانتکست>زمینه, quote sync
- [x] aboutcompression-p46 — 23 posts · 2 suspects · 4 fixed · sem70: ENG>اینگالف x2, فشرده‌سازی>فشردگی, پرچم>فلگ, سوآپ>سواپ, dropped trailing AND
- [x] aboutcompression-p47 — 25 posts · 1 suspects · 7 fixed · sem70: Base>بیس, ENG>اینگالف, Swap Zone>ناحیهٔ سواپ, big boys>نهنگ‌ها calque, hey>هی x4, DEMAND>تقاضا, quote sync
- [x] aboutcompression-p48 — 25 posts · 2 suspects · 8 fixed · sem70: پرچم ENGULF>فلگ اینگالف, stray period, hey>هی x4, quote sync
- [x] aboutcompression-p49 — 25 posts · 6 suspects · 6 fixed · sem70: پرچم>فلگ x3, POLE>دکل, revisitted>تست شوند + quote sync x2, Supply/Demand/Compression Latin>عرضه/تقاضا/فشردگی in quoted homework, کانتکست>زمینه
- [x] aboutcompression-p50 — 22 posts · 3 suspects · 4 fixed · sem70: URL ellipsis hom...ession, Compression>فشردگی + quote sync, swap-out calque>تدریجی

## salivan — 'THE ART OF WAR'

46 صفحه / 1020 پست — بازبینی 46 · سابقه 46 · suspects 154

پرحاشیه‌ترین صفحه‌ها: salivan-p28 (8) · salivan-p45 (8) · salivan-p26 (7) · salivan-p31 (7) · salivan-p18 (6) · salivan-p22 (6) · salivan-p27 (6) · salivan-p33 (6)

- [x] salivan-p1 — 25 posts · 5 suspects · pass-1 verdict · 3 fix pass-1 · 8 fixed · sem2: flag->فلگ in castle metaphor, compression->فشردگی, DIAMOND->الماس, swapped zone, PAZ drop, 4H fix
- [x] salivan-p2 — 22 posts · 3 suspects · pass-1 verdict · 1 fix pass-1 · 9 fixed · sem2: اتاق فکری->اتاق فکر, DIAMOND->الماس, پرچم زد->فلگ زد, QM meaning fix, IT‌ها, SL clarity
- [x] salivan-p3 — 21 posts · 3 suspects · pass-1 verdict · 3 fixed · sem2: minor calques (at work, swing H/L order, TT ONE)
- [x] salivan-p4 — 9 posts · pass-1 verdict · 1 fix pass-1 · 2 fixed · sem2: can't-wait calque, minor
- [x] salivan-p5 — 14 posts · pass-1 verdict · 7 fixed · sem2: compression->فشردگی, penny-drop idiom, باارزش orthography, آفر/بید, WTF, pretty sure
- [x] salivan-p6 — 11 posts · 1 suspects · pass-1 verdict · 3 fixed · sem2: minor phrasing in philantrop liquidity post, handle case
- [x] salivan-p7 — 19 posts · 3 suspects · pass-1 verdict · 1 fix pass-1 · 4 fixed · sem2: quote sync w/ p6_11, price action wording, nice simple people
- [x] salivan-p8 — 17 posts · 4 suspects · pass-1 verdict · 4 fixed · sem2: cup-of-tea calque, homework, attachment Latin restore, WTF
- [x] salivan-p9 — 19 posts · 1 suspects · pass-1 verdict · 8 fixed · sem2: quote drift sync p3_4+p8_21, my-two-cents, thin difference, heads up, push price
- [x] salivan-p10 — 20 posts · 2 suspects · pass-1 verdict · 1 fix pass-1 · 11 fixed · sem2: quote syncs (p9_24, p10_15, p10_21), flag verb, 2-cents idiom, ahah moment, Brexit 3yrs
- [x] salivan-p11 — 16 posts · 2 suspects · pass-1 verdict · 6 fixed · sem2: calque fixes (priceless, eurocents, ENG->اینگالف), LES_PUAL typo->LES_Paul, quote-synced althoufx post
- [x] salivan-p12 — 25 posts · 4 suspects · pass-1 verdict · 1 fix pass-1 · 3 fixed · sem2: ENG->اینگالف acronym, orders-ahead phrasing synced with quote, emergency/casual/success phrasing in long post
- [x] salivan-p13 — 25 posts · 1 suspects · pass-1 verdict · 3 fix pass-1 · 2 fixed · sem2: ENG->اینگالف in big OK GUYS post, phrasing fix in DP post
- [x] salivan-p14 — 24 posts · 2 suspects · pass-1 verdict · 1 fix pass-1 · 1 fixed · sem2: priceless->جای بی‌قیمتی calque fixed
- [x] salivan-p15 — 24 posts · 3 suspects · pass-1 verdict · 3 fixed · sem2: Diamond->الماس, wrong-side phrasing, dont-sell-time
- [x] salivan-p16 — 19 posts · pass-1 verdict · sem2: clean; borderline cup-of-tea phrasing left consistent
- [x] salivan-p17 — 25 posts · 4 suspects · pass-1 verdict · 1 fix pass-1 · 4 fixed · sem2: youre-welcome calque (synced quote), shot-up/junction phrasing (synced gembel quote)
- [x] salivan-p18 — 25 posts · 6 suspects · pass-1 verdict · 2 fix pass-1 · 8 fixed · sem2: pole->دکل, welcome+ENG calques, touch-trade mistranslation, dive/timeline phrasing w/ quote sync
- [x] salivan-p19 — 25 posts · 2 suspects · pass-1 verdict · 1 fix pass-1 · sem2: clean
- [x] salivan-p20 — 24 posts · 3 suspects · pass-1 verdict · 2 fix pass-1 · 1 fixed · sem2: very-welcome calque->خواهش می‌کنم
- [x] salivan-p21 — 25 posts · 1 suspects · pass-1 verdict · 1 fix pass-1 · 2 fixed · sem2: welcome calque + Latin Diamond
- [x] salivan-p22 — 25 posts · 6 suspects · pass-1 verdict · 2 fixed · sem2: quote drift + welded FL/calque missing
- [x] salivan-p23 — 21 posts · pass-1 verdict · 5 fixed · sem2: savior calque, sucks weaken, ASAP quote drift, touch-trade glossary, FL/SR clause
- [x] salivan-p24 — 25 posts · 4 suspects · pass-1 verdict · 5 fixed · sem2: URL corruption, ENG->اینگالف, فشرده‌سازی->فشردگی, Max pain, pole->پایه, quote sync
- [x] salivan-p25 — 24 posts · 3 suspects · pass-1 verdict · 1 fixed · sem2: Compression left Latin -> کامپرشن
- [x] salivan-p26 — 24 posts · 7 suspects · pass-1 verdict · 1 fix pass-1 · 7 fixed · sem2: ENG/Diamond/Flag/پرچم terminology sweep + quote sync + agreement
- [x] salivan-p27 — 25 posts · 6 suspects · pass-1 verdict · 5 fixed · sem2: EG/ENG -> اینگالف sweep + 2 quote syncs
- [x] salivan-p28 — 25 posts · 8 suspects · pass-1 verdict · 2 fixed · sem2: ENG residual sweep x2 posts incl quote sync
- [x] salivan-p29 — 25 posts · 4 suspects · pass-1 verdict · 1 fix pass-1 · 6 fixed · sem2: quote drift, sucks intensity, stop subject, pole->پایه, shoted calque
- [x] salivan-p30 — 23 posts · 5 suspects · pass-1 verdict · 2 fix pass-1 · 5 fixed · sem2: rockstar calque, ENG, GREAT IF calque, stale quote sync, Berry->Burry
- [x] salivan-p31 — 25 posts · 7 suspects · pass-1 verdict · 1 fix pass-1 · 12 fixed · sem2: big Ifmyante quote - فیک‌اوت, تاچ سطح, Pole->دکل, whipsaw->ویپ‌ساو, flag->فلگ, فشردگی, PO acronym, truckload/lorryload mistranslation
- [x] salivan-p32 — 25 posts · 5 suspects · pass-1 verdict · 10 fixed · sem2: flag->فلگ (fakeout flag, other flags), ENG->اینگالف across FOF thread quotes
- [x] salivan-p33 — 23 posts · 6 suspects · pass-1 verdict · 2 fix pass-1 · 2 fixed · sem2: ENG->اینگالف in quoted FOF text, flag->فلگ in price-reading article
- [x] salivan-p34 — 23 posts · 4 suspects · pass-1 verdict · 1 fix pass-1 · 2 fixed · sem2: spike high->سقف ناگهانی calque, touch trade->تاچ سطح
- [x] salivan-p35 — 23 posts · 1 suspects · pass-1 verdict · 2 fix pass-1 · 1 fixed · sem2: touch trade->تاچ سطح in quote+reply (synced with p34)
- [x] salivan-p36 — 25 posts · 4 suspects · pass-1 verdict · 4 fixed · sem2: ENG->اینگالف x2 posts, intensifier reallyx4, grammar
- [x] salivan-p37 — 25 posts · 2 suspects · pass-1 verdict · 5 fixed · sem2: ENG->اینگالف in quote+reply, پرچم->فلگ, @handle restored, cheers calque, grammar
- [x] salivan-p38 — 25 posts · 3 suspects · pass-1 verdict · 1 fix pass-1 · 5 fixed · sem2: flag/ENG fixes, rank jumper+icing calques, broken URL ellipsis+tab, order-flow phrasing
- [x] salivan-p39 — 25 posts · 4 suspects · pass-1 verdict · 4 fix pass-1 · 2 fixed · sem2: ENG->اینگالف, 5 readthemarket URLs restored byte-identical
- [x] salivan-p40 — 25 posts · 3 suspects · pass-1 verdict · 2 fixed · sem2: ENG->اینگالف in Balzak quote+reply
- [x] salivan-p41 — 24 posts · 2 suspects · pass-1 verdict · 1 fix pass-1 · 11 fixed · sem2: پرچم→فلگ, flags mistranslated as limits, 2 broken URLs, misc calques
- [x] salivan-p42 — 25 posts · 5 suspects · pass-1 verdict · 1 fix pass-1 · 7 fixed · sem2: flags mistranslation in nested quote, 2 URL ellipsis spaces, synced rant quote, misc
- [x] salivan-p43 — 24 posts · 2 suspects · pass-1 verdict · 3 fix pass-1 · 8 fixed · sem2: پرچم→فلگ, quote desync fixed across 3 posts, engulf direction calques
- [x] salivan-p44 — 23 posts · 3 suspects · pass-1 verdict · 9 fixed · sem2: فشرده‌سازی→فشردگی, quote desyncs synced, materials→مطالب, misc
- [x] salivan-p45 — 25 posts · 8 suspects · pass-1 verdict · 8 fixed · sem2: Diamond→الماس, quote desyncs, بگذار بگویم calque, Peace!→سلامت
- [x] salivan-p46 — 4 posts · 2 suspects · pass-1 verdict · 2 fixed · sem2: broker ambiguity, synced moneydeep quote wording

## alex — Alex`s journal

36 صفحه / 818 پست — بازبینی 36 · سابقه 2 · suspects 162

پرحاشیه‌ترین صفحه‌ها: alex-p29 (13) · alex-p33 (12) · alex-p24 (10) · alex-p20 (9) · alex-p22 (9) · alex-p19 (8) · alex-p16 (7) · alex-p21 (7)

- [x] alex-p1 — 25 posts · 2 suspects · pass-1 verdict · 1 fix pass-1 · 4 fixed · gay-pastels calque + tatweel dashes fixed
- [x] alex-p2 — 25 posts · 4 fixed · DIAMOND->الماس, دیمند->تقاضا, para-split fix
- [x] alex-p3 — 21 posts · 2 suspects · 2 fixed · crib-sheet + banned اینگالفینگ; ticker slash was already correct (latex rule)
- [x] alex-p4 — 21 posts · pass-1 verdict · 1 fix pass-1 · 3 fixed · S-D inconsistency, homework calque, spacing
- [x] alex-p5 — 21 posts · 6 fixed · ENG->اینگالف in prose x5, FTRs plural, نیم‌فاصله
- [x] alex-p6 — 21 posts · 2 suspects · 4 fixed · Eng->اینگالف x2, level question, intraday
- [x] alex-p7 — 23 posts · 1 suspects · 1 fixed · dangling 'I want to have that' completed
- [x] alex-p8 — 24 posts · 4 suspects · 3 fixed · GBPCHE typo->GBPCHF, reversed reliability, engulf phrasing
- [x] alex-p9 — 24 posts · 5 suspects · 1 fixed · figure->چارتt, mentor kept
- [x] alex-p10 — 24 posts · 4 suspects · 3 fixed · Decision Point calque, free-time calque, work ethic
- [x] alex-p11 — 25 posts · 1 suspects · 2 fixed · Onwards-and-Upwards calque, sepâsgozâram ziâd word order
- [x] alex-p12 — 25 posts · 9 fixed · demand->taqâzâ, touch trade->vorrud bâ tâch, TG->target, drive->dariv, eternal-question calque
- [x] alex-p13 — 19 posts · 5 suspects · 6 fixed · ENG/Eng->ingâlf, ftr->FTR caps, subjective calque, pipped-out idiom
- [x] alex-p14 — 20 posts · 5 suspects · 5 fixed · ENG/RETRACE Latin, prachm->flag, missed TG1, jolted-memory calque
- [x] alex-p15 — 22 posts · 3 suspects · 10 fixed · Swap Level->sath-e savâp, ENG->ingâlf, Comments-welcome mistranslation, pros-help garble, IT-glue, retrace->ri-trace
- [x] alex-p16 — 25 posts · 7 suspects · 13 fixed · demand/supply->taqâzâ/arzé, Eng/eng->ingâlf, flag->flag, shed-light calque, URL ellipsis, AUCAD typo, stray token
- [x] alex-p17 — 22 posts · 5 suspects · 3 fixed · ENG->ingâlf, well-done calque, Eng Flag->flag-e ingâlf
- [x] alex-p18 — 24 posts · 6 suspects · 11 fixed · EnG/ENg/Eng->ingâlf, struggle/zone Latin, wonder leftover, اینگافلی banned variant, Supply/SWAP level, quote sync p17_422
- [x] alex-p19 — 23 posts · 8 suspects · 6 fixed · glossary: touch trade/retrace/demand; calque fixes; Latin level/supply
- [x] alex-p20 — 24 posts · 9 suspects · 15 fixed · calques (fill boots, hold a candle, inconsistent), supply/demand glossary, decision mistranslation, quote sync 481/483 495/500, source typos
- [x] alex-p21 — 23 posts · 7 suspects · 8 fixed · ENG->اینگالف glossary, pole->دکل, calques (2 cents, perfect, entry meaning)
- [x] alex-p22 — 24 posts · 9 suspects · 14 fixed · banned اینگلاف/EG/ITا variants, fakeout glossary, URL ellipsis, pole->دکل, quote syncs
- [x] alex-p23 — 22 posts · 6 suspects · 5 fixed · quote sync with alex_p22_548, ENG->اینگالف, eng residual, idiom direction
- [x] alex-p24 — 25 posts · 10 suspects · 13 fixed · ENG/key Latin leftovers -> اینگالف, touch trade glossary, quote syncs 575/579 585/587 596/597, URL ellipsis, horny idiom
- [x] alex-p25 — 24 posts · 3 suspects · 10 fixed · ENG/Guys/Regards leftovers, calques (2 cents, eureka, pro money action), supply/demand, quote sync
- [x] alex-p26 — 23 posts · 2 suspects · 7 fixed · ENG leftovers, touch trade glossary, material calque, SUBSCRIBED translit, wicked register
- [x] alex-p27 — 24 posts · 3 suspects · 15 fixed · flag/فلگ, Sell/ALL/BTW leftovers, touch-trade chain quote syncs 657-660 669-670, missed-charts direction, jeeezzz translit
- [x] alex-p28 — 23 posts · 7 suspects · 4 fixed · calques, Eng/EG leftovers, price->market swap, fakeout Latin
- [x] alex-p29 — 25 posts · 13 suspects · 7 fixed · supply/demand Latin, IT plural glue, kaboom->انفجار, EG leftover, 2cents calque
- [x] alex-p30 — 15 posts · 1 suspects · short page, all idioms already localized
- [x] alex-p31 — 24 posts · 4 suspects · 7 fixed · level/Eng Latin leftovers, supply/demand, garbled opener, edge/middle terms
- [x] alex-p32 — 25 posts · 3 suspects · 7 fixed · level Latin in triple-quoted post, Supply demand, flag, guys, missing verb
- [x] alex-p33 — 23 posts · 12 suspects · 10 fixed · level/KEY Latin, ENG acronym, supply/demand, IT plural, Weekly flag garble, price action
- [x] alex-p34 — 24 posts · 5 suspects · 7 fixed · mid-level/Middle level Latin chain, supply/demand, flag, Demand/Supply
- [x] alex-p35 — 24 posts · 7 suspects · 8 fixed · guys/Regards Latin, PART/closed leftovers, KEY/STRUCTURE, Trader glue, register fixes
- [x] alex-p36 — 12 posts · 1 suspects · 3 fixed · quote desync vs p35_875 canonical, Tons of Money rendering

## doctorpatient — The Doctor's patients

31 صفحه / 758 پست — بازبینی 31 · سابقه 0 · suspects 329

پرحاشیه‌ترین صفحه‌ها: doctorpatient-p6 (20) · doctorpatient-p23 (20) · doctorpatient-p5 (18) · doctorpatient-p28 (18) · doctorpatient-p25 (17) · doctorpatient-p8 (16) · doctorpatient-p22 (16) · doctorpatient-p20 (15)

- [x] doctorpatient-p1 — 25 posts · 13 suspects · 21 fixed · 21/25 posts: untranslated English leftovers (supply/demand/support/spike/heads up etc.), glossary fixes, calques, quote truncation
- [x] doctorpatient-p2 — 25 posts · 12 suspects · 21 fixed · 21/25 posts: heavy EN leftovers (support/demand/spike/pro money/chop/upside etc.), synced quotes to p1_24/p2_28/p2_32/p2_46 canonical
- [x] doctorpatient-p3 — 24 posts · 8 suspects · 13 fixed · 13/24 posts: spike→میخ fixes, pole→دکل, quote syncs to p1_24/p3_62/p3_72, calques (thread→ترد, haven→پناهگاه, in heat), leftover English
- [x] doctorpatient-p4 — 25 posts · 14 suspects · 19 fixed · calques, terminology (compression/flip/spike/tail/load up), quote sync
- [x] doctorpatient-p5 — 25 posts · 18 suspects · 17 fixed · pullback/retrace/compression terminology, calques, quote sync
- [x] doctorpatient-p6 — 25 posts · 20 suspects · 22 fixed · pullback/box/tail/retrace terminology, long decision-area post cleanup, quote sync
- [x] doctorpatient-p7 — 25 posts · 8 suspects · 17 fixed · idioms (tea in China, nose on face), buy/eat mistranslation, terminology, quote sync
- [x] doctorpatient-p8 — 25 posts · 16 suspects · 20 fixed · wick/tail/box terminology, idioms, quote sync
- [x] doctorpatient-p9 — 25 posts · 7 suspects · 23 fixed · Franglais mixing; English terms translated, PT terms normalized
- [x] doctorpatient-p10 — 25 posts · 13 fixed · price action/pullback/retest/breakout terminology normalized, quote resync to p10_238/240/247 and p9_222 canonical
- [x] doctorpatient-p11 — 25 posts · 5 fixed · fixed awkward calques: گازت می‌گیرد→لطمه‌اش سنگین; بگویی→باشی; در آن جایی پیدا کند→نخش آفرینی; سفارش‌های مجانی→آزاد; گله‌ی هار→جمعیت هیاهو; bullet out of nowhere→بی‌سروصدا
- [x] doctorpatient-p12 — 25 posts · 7 suspects · 15 fixed · rewrote transliterated slang-heavy posts (276-281,295,297,298); synced quotes to canonical; fixed Qross cross, Best of luck, thoughts calques
- [x] doctorpatient-p13 — 25 posts · 8 suspects · 8 fixed · fixed quote drift vs canonical, English leftovers (Greetings/Cheers/artistic license/fresh ground/fixate), باکس زنجاری→باکس زرد, ترد→تاپیک, calques
- [x] doctorpatient-p14 — 25 posts · 5 suspects · 4 fixed · bam→یک‌هو, oops→اوه نه, رد→ریجکشن, turn on a dime, chunk of target, emotion calques
- [x] doctorpatient-p15 — 25 posts · 1 suspects · 6 fixed · dropped :) emoticon in 358+quote, bail→بیرون می‌زنم→بیرون می‌شوم, زده شد→گرفتم, بد بسوزاند, بلوک قبلی, shake out
- [x] doctorpatient-p16 — 25 posts · 5 suspects · 8 fixed · direction error در 379 (از بین نرفت→پاک شد), synced 386+396 quotes to canonical, بن کنی→مسدود, دوشاخه→بستم, اعتقاد→نیرو/فشار, points→پوینت, landed on feet calque
- [x] doctorpatient-p17 — 25 posts · 10 suspects · 6 fixed · unwinding mistranslated as باز کردن پوزیشن‌ها (2x), چوپانی, raise you one, can't help thinking calque, Bonamassa LP, گزنده
- [x] doctorpatient-p18 — 25 posts · 14 suspects · 8 fixed · gbp/usd glued, points→پوینت, raise-you-one, compelling pun, revisit→بازدید calque, non event, big stomach, familiar shoes, second nature
- [x] doctorpatient-p19 — 25 posts · 9 suspects · 21 fixed · quote sync to canonical (451,453,461,463,468), ترید→معامله normalization, associate traders→سطح اَسوشیت, below→زیر direction fix in 475, Latin leftovers (consolidate/spike/retest/price action)
- [x] doctorpatient-p20 — 25 posts · 15 suspects · 17 fixed · bulls→خرس direction errors in 476, stop hunt→شکار استاپ, ترید→معامله, price action/retest/fakeout Latin leftovers, BRN tarǧet, high→سقف/کف, screen time
- [x] doctorpatient-p21 — 25 posts · 15 suspects · 9 fixed · calques, bulls->خرس mistranslation, S&R typo, garbled clauses
- [x] doctorpatient-p22 — 25 posts · 16 suspects · 13 fixed · bulls->خرس systematic in candle post, eur/gpb typo, EG acronym, calques
- [x] doctorpatient-p23 — 25 posts · 20 suspects · 10 fixed · quote sync with p22_550, bulls->خرس, retrace->ریتریس, consolidate calques
- [x] doctorpatient-p24 — 25 posts · 1 suspects · 11 fixed · truncated post 596, touch-trade glossary, bulls->گاو/صعودی drift, quote sync
- [x] doctorpatient-p25 — 25 posts · 17 suspects · 14 fixed · pro bulls->خرس صعودی, invented sentence, touch trade, فانتزی, latin leftovers
- [x] doctorpatient-p26 — 25 posts · 10 suspects · 5 fixed · pro bulls->خرس drift in candle lesson, pole->دکل, screen time, long AUD
- [x] doctorpatient-p27 — 25 posts · 15 suspects · 8 fixed · پرچم->فلگ, screenshot, bulls->گاو, emoticon drift, Latin leftovers
- [x] doctorpatient-p28 — 25 posts · 18 suspects · 13 fixed · پرچم->فلگ, Latin leftovers, Eur/cad correction sync, supply->عرضه
- [x] doctorpatient-p29 — 25 posts · 15 suspects · 13 fixed · failure term sync, supply->عرضه, Latin leftovers, origin->مبدأ
- [x] doctorpatient-p30 — 25 posts · 10 suspects · 11 fixed · flag->فلگ, Latin leftovers, screenshot->عکس از صفحه, decision point->نقطه تصمیم
- [x] doctorpatient-p31 — 9 posts · 2 suspects · link-sharing tail posts only, no prose defects

## smimon — Smimon's Journal

29 صفحه / 716 پست — بازبینی 29 · سابقه 0 · suspects 176

پرحاشیه‌ترین صفحه‌ها: smimon-p27 (14) · smimon-p20 (12) · smimon-p22 (12) · smimon-p19 (11) · smimon-p24 (11) · smimon-p21 (9) · smimon-p23 (9) · smimon-p11 (8)

- [x] smimon-p1 — 25 posts · 5 suspects · 18 fixed · calques (سرتکانی/کلیک/مومو/رم/پرواز), banned eng/اینگالی variants, Latin leftovers, quote sync
- [x] smimon-p2 — 25 posts · 17 fixed · Latin leftovers (invariably/correlation/no-brainer/hindsight/post mortem/Cheers), پرچم->FL, calques
- [x] smimon-p3 — 25 posts · 3 suspects · 17 fixed · Latin leftovers (eng/pole/Hey mate/basing/no-brainer), پرچم->فلگ, URL restore, calques
- [x] smimon-p4 — 24 posts · 2 suspects · 16 fixed · Latin leftovers (Hey pal/hotkey/hindsight/fakeout/hangover/succession/crosspair), پرچم->نوسان, calques, quote sync
- [x] smimon-p5 — 24 posts · 3 suspects · 16 fixed · Latin leftovers (eng/bear flag/statement/mare/confluence), broken URL ellipsis, calques (legs/blip/dead in water)
- [x] smimon-p6 — 25 posts · 3 suspects · 16 fixed · truncated p6_136, Latin leftovers (eng/confluence/momo/boring/crappy/Typical), touch trade glossary, wood/trees inversion
- [x] smimon-p7 — 25 posts · 6 suspects · 18 fixed · Latin leftovers (eng/confluence/crap/washout/supiqqly etc), calques, direction error surge, duplicate-post hash dedup
- [x] smimon-p8 — 25 posts · 3 suspects · 18 fixed · quote-sync chain p8_178-181 & p8_194, hopefullyhopefully garble, Latin leftovers heck/btw/vline/wick->saye, calques legs/moon/tell-me-about-it
- [x] smimon-p9 — 25 posts · 3 suspects · 16 fixed · flag->پرچم violation fixed, Latin leftovers indis/money management/over trading/buy limit/Comedy, quote-sync zhao chain, calques tradeware/PTSD phrasing
- [x] smimon-p10 — 25 posts · 1 suspects · 14 fixed · quote-sync chains (p10_225->228, p9_223->234, p10_239->240->242->243), flag->پرچم, pole->پول, Latin leftovers ENG/demand/Supply/hindsight, calques
- [x] smimon-p11 — 25 posts · 8 suspects · 15 fixed · calques+idioms (out the window, rate race, wolves at door), supply/demand Latin, eng/source Latin in zhao posts, پرچم->فلگ, pole->دکل, SAS/scalp-and-see, quote sync
- [x] smimon-p12 — 25 posts · 3 suspects · 13 fixed · quote sync w/ new p11 canonical (273/285/298), calques (fast forward, sweet spot, drawing board), reverse-engineer, day-in-day-out mistranslation, flag limit->حد فلگ
- [x] smimon-p13 — 25 posts · 3 suspects · 14 fixed · quote sync w/ p12 canonical; supply/demand+significance Latin leaks; پرچم->فلگ; pole->دکل; momo bar=momentum; RT->ریتریس; backwards rationalising
- [x] smimon-p14 — 25 posts · 7 suspects · 19 fixed · quote sync cascade (329->331->334->336, 298->338, 343->344, 345->346); supply/demand/demand Latin; pole->دکل; پرچم->فلگ; eng->اینگالف; compression->فشردگی; wedge->وتدج; Sminon typo->Smimon
- [x] smimon-p15 — 25 posts · 5 suspects · 22 fixed · quote sync cascade (347->354, 355->356, 365->370, 366->368); fakeout->فیک‌اوت, supply/demand Latin, pole->دکل, پرچم->فلگ, significance Latin, RT->ریترِیس, FOMO->ترس از جا ماندن, NFP hangover
- [x] smimon-p16 — 25 posts · 2 suspects · 21 fixed · flag limit->حد فلگ, پرچم->فلگ, pole->دکل, demand/supply->تقاضا/عرضه, compression->فشردگی, swap zone->ناحیهٔ سواپ, eng->اینگالف, momo bar=کندل مومنتوم, idioms (itchy finger, fed up, picture speaks)
- [x] smimon-p17 — 25 posts · 7 suspects · 24 fixed · eng/RT->اینگالف/ریترِیس, sweep->سویینگ, demand/supply->تقاضا/عرضه, context->بستر, indui->ایندی, idioms (killing it->تمیز می‌کنی, fingers crossed->دعا می‌کنم, waffle->پرحرفی)
- [x] smimon-p18 — 25 posts · 8 suspects · 19 fixed · pole->دکل, eng/RT->اینگالف/ریترِیس, context->بستر, indi->ایندی, swap zone->ناحیهٔ سواپ, origin->مبدأ, drawdown->دراوداون, slippage->اسلیپیج, idioms (root for you->پشتت هستم, speechless->بی‌کلام, low hanging fruit)
- [x] smimon-p19 — 25 posts · 11 suspects · 18 fixed · flag->فلگ, origin->مبدأ, context->بستر, house money->پول خانه, seed money->پول اولیه, demand/supply->تقاضا/عرضه, nutshel/l in nutshell->خلاصه, immensely->خیلی, zone fractals->فراکتال‌های ناحیه‌ای
- [x] smimon-p20 — 25 posts · 12 suspects · 22 fixed · انگاله/eng/EG->اینگالف, RT->ریترِیس, pole->دکل, compression->فشردگی, demand->تقاضا, fail->فیل, fake out->فیک‌اوت, zone->ناحیه, idioms (vent spleen, grindstone, crystal ball, abundance)
- [x] smimon-p21 — 25 posts · 9 suspects · 14 fixed · banned engulf variants (اینگاله/اینگالی), calques (amuse→غافلگیری, skin-a-cat, hats-off, paint diagrams), untranslated WHY/confluence/push, misc wording
- [x] smimon-p22 — 24 posts · 12 suspects · 16 fixed · residual اینگاله variant fixed post-mark
- [x] smimon-p23 — 23 posts · 9 suspects · 20 fixed · banned engulf variants + eng/fake English leftovers, diamant→الماس, calques (zen/cue/catch22/holy-grail/rabbit-in-headlights/shotgun), quote syncs
- [x] smimon-p24 — 25 posts · 11 suspects · 20 fixed · heavy English leftovers (confluence/whipsaw/overshoot/intent/yoy/Moving Average/returns/feel/HARD/spiral/self-sabotaging), banned engulf variants + eng/اینگاف/اینگاله/اینگالی, calques, pole→دکل, quote syncs 581-582,588-589,597-598
- [x] smimon-p25 — 25 posts · 7 suspects · 20 fixed · banned engulf variants + eng, leftover English (rtm/gurus/idol/bussiness/money management/risk reward/imagine/happy holidays/breakout trading/payday/gem), calques (zone out/cue/reset/food for thought), PO acronym, quote syncs 601-603/605-607/610-611/553-617
- [x] smimon-p26 — 24 posts · 7 suspects · 20 fixed · English leftovers (mental hacks/revenge/margin call/quick trade/physique/expert/cock up/breakeven/algos/fade/confluence/synthetic/basket/flow/hater/macro/boring/boogey man/average joe/trending/range/choppy/nonsens/notification/unsubscribe/rubbish/peak/education/fairness/angle/essence/Killer RR/noob/breakout/execution/frequent/in the black), calques (variation/catered/impulsively/half-assed/crack/snacking/hit the pipe/pump/demon/to 19324), engulf fix اینگاله, quote syncs 629->634, 635->636/638, 639->642/644/649
- [x] smimon-p27 — 25 posts · 14 suspects · 21 fixed · quote drift vs new p26 647/649, bogus smimon wrote head on own post 674, quote-chain resync after 652 idiom fix (653-665), leftover English (synthetic/feed/noob/algo/dosh/flatline), calques (panacea/volume profiling/fade/gap/Demand Supply/pole->پایه دکل), film->ضبط, live account
- [x] smimon-p28 — 25 posts · 8 suspects · 15 fixed · gap->شکاف consistency w/ p27, URL ellipsis fix, leftovers (importance/ITایی/surge/hairy->ژولیده/looong/synthetic/Index/Index charts), calques (price action/volume profiling/choppy/fade x4/confluence->هم‌پوشانی/sod's law->قانون مورفی), quote syncs 676->677, 686->687
- [x] smimon-p29 — 22 posts · 4 suspects · 18 fixed · quote-chain resync 703->704, 705/707/709->710->712->713, 715->716->717->718->720, missing sentence restored in 717 quote, subset-quote fixes in 710, leftovers (supply/demand/session/stop loss/touch trades/confluence->هم‌پوشانی/paz->PAZ/IT‌ا), calques (fade->ضد شرط, banker->واریز, sod, middle of nowhere, eye opening)

## pedini — Pedini's trades and setups

24 صفحه / 579 پست — بازبینی 24 · سابقه 24 · suspects 173

پرحاشیه‌ترین صفحه‌ها: pedini-p17 (14) · pedini-p20 (14) · pedini-p14 (13) · pedini-p23 (11) · pedini-p13 (10) · pedini-p21 (10) · pedini-p12 (9) · pedini-p15 (9)

- [x] pedini-p1 — 23 posts · 5 suspects · pass-1 verdict · 6 fixed · sem2: پرچم->فلگ, تاچ‌ترید, دکل/pole, هفتگی=TF, سفارش معلق, cut losses
- [x] pedini-p2 — 25 posts · 2 suspects · pass-1 verdict · 6 fixed · sem2: پرچم->فلگ x3, فشردگی, pinning, conventional, stopped out
- [x] pedini-p3 — 25 posts · 1 suspects · pass-1 verdict · 1 fix pass-1 · 6 fixed · sem2: پرچم->فلگ, فشردگی, sweet entry/eaten away, action=هیجان fix, farted around
- [x] pedini-p4 — 25 posts · 1 suspects · pass-1 verdict · 1 fix pass-1 · 8 fixed · sem2: associates->اسوشیت x2, فشردگی x3, invented clause beer, pin sentence garbled
- [x] pedini-p5 — 25 posts · 1 suspects · pass-1 verdict · 5 fixed · sem2: تاچ‌ترید->تاچ سطح, فشردگی x2, trades on a platter, gem setup, all time highs
- [x] pedini-p6 — 25 posts · 6 suspects · pass-1 verdict · 1 fix pass-1 · 8 fixed · sem2: تاچ‌ترید, فشردگی, D swing->DrSwing, عاشقشم->دوستش دارم, fill, cloud judgment, prediction->نکته
- [x] pedini-p7 — 25 posts · 5 suspects · pass-1 verdict · 5 fix pass-1 · 8 fixed · sem2: تاچ‌ترید x4, bread and butter calque x2, print->ثبت, خروج quote
- [x] pedini-p8 — 24 posts · 7 suspects · pass-1 verdict · 2 fix pass-1 · 6 fixed · sem2: cracker->معامله حسابی (quote synced), چاپ کرد->ساخت, bargain/bit, هدف->تارگت, ؟. punctuation
- [x] pedini-p9 — 24 posts · 7 suspects · pass-1 verdict · 19 fixed · sem2: calques (well asleep dir, YOU THE MAN, nice catch, Shit yeh), pole->دکل, flag limits->فلگ‌لیمیت, eureka->یوریکا, quote syncs
- [x] pedini-p10 — 24 posts · 6 suspects · pass-1 verdict · 14 fixed · sem2: پرچم->فلگ + اینگاف->اینگالف در پست PA، calques (every Tom Dick, 2 cents, Shit yeh), tell signs, charge->فضای تاپیک
- [x] pedini-p11 — 25 posts · 6 suspects · pass-1 verdict · 1 fix pass-1 · 12 fixed · sem2: Master Trader->مستر تریدر, پرچم->فلگ sync, had to bug report subject, Can-can, pearl idiom
- [x] pedini-p12 — 25 posts · 9 suspects · pass-1 verdict · 23 fixed · sem2: پرچم->فلگ, onomatopoeia Bang/Ka-ching localized, trapped-vs-consumed meaning, break/chart mode, quote syncs p12_14/19/21/25
- [x] pedini-p13 — 24 posts · 10 suspects · pass-1 verdict · 19 fixed · sem2: pole->دکل, old-shoes idiom, quote syncs, chase-a-trade, compentence->پلن, sloppy-entry register
- [x] pedini-p14 — 25 posts · 13 suspects · pass-1 verdict · 21 fixed · sem2: flag->فلگ fix, quote syncs, idioms, honeypot trap, money-terms
- [x] pedini-p15 — 25 posts · 9 suspects · pass-1 verdict · 1 fix pass-1 · 18 fixed · sem2: flag->فلگ (3x incl nested quote), scaling-in terms, idiom fixes
- [x] pedini-p16 — 24 posts · 7 suspects · pass-1 verdict · 15 fixed · sem2: gold-market idioms, rock-on register, quote syncs
- [x] pedini-p17 — 25 posts · 14 suspects · pass-1 verdict · 12 fixed · sem2: calques fixed (living crap, spot on, compression->فشردگی, CPAZ engulf, tging FTR, gap-down/gap-fill phrasing, lazy entry, second-last arrow); 25 posts ok
- [x] pedini-p18 — 25 posts · 6 suspects · pass-1 verdict · 11 fixed · sem2: flag->فلگ (joema), فشردگی not فشرده‌سازی, ENG acronym removed, Pro Money calque, decays/rank calques, long->لانگ, upthrust, hit/miss platform idiom
- [x] pedini-p19 — 25 posts · 8 suspects · pass-1 verdict · 5 fixed · sem2: flag->فلگ critical, loaded q calque, blown through->سوراخ, extremities->دو سر, minor
- [x] pedini-p20 — 25 posts · 14 suspects · pass-1 verdict · 6 fixed · sem2: cable->کیبل, map out calque, Faked->فیک‌اوت, minor polish
- [x] pedini-p21 — 25 posts · 10 suspects · pass-1 verdict · 4 fixed · sem2: touch trade->تاچ سطح + quote sync, فشرده‌سازی->فشردگی, model/lol calques
- [x] pedini-p22 — 25 posts · 9 suspects · pass-1 verdict · 5 fixed · sem2: shoots through calque, went flat->صفر شدم, get hit->استاپ می‌خورد, guilty/qualify calques
- [x] pedini-p23 — 25 posts · 11 suspects · pass-1 verdict · 7 fixed · sem2: فشردگی not فشرده‌سازی, touch-trade->ورود با تاچ سطح + quote sync x3, swing-trade translit, life changer
- [x] pedini-p24 — 11 posts · 6 suspects · pass-1 verdict · 4 fixed · sem2: ropes/2-cents/stoked calques, clarity-in-eyes calque, engulfed back fix, thrashing

## jurij — Jurij's Corner

24 صفحه / 576 پست — بازبینی 24 · سابقه 14 · suspects 58

پرحاشیه‌ترین صفحه‌ها: jurij-p9 (6) · jurij-p12 (6) · jurij-p10 (5) · jurij-p1 (4) · jurij-p11 (4) · jurij-p14 (4) · jurij-p16 (4) · jurij-p22 (4)

- [x] jurij-p1 — 25 posts · 4 suspects · pass-1 verdict · 3 fixed · flag->فلگ x2, ellipsis markup drift
- [x] jurij-p2 — 25 posts · pass-1 verdict · 2 fix pass-1 · 2 fixed · پرچم->فلگ x3, quote drift in p19
- [x] jurij-p3 — 21 posts · 1 suspects · pass-1 verdict · 3 fix pass-1 · 8 fixed · pole->دکل, flag->فلگ, compression->فشردگی, quote ellipsis
- [x] jurij-p4 — 18 posts · pass-1 verdict · 1 fix pass-1 · 6 fixed · پرچم->فلگ, فشرده‌سازی->فشردگی, IT‌ا->IT‌ها
- [x] jurij-p5 — 24 posts · pass-1 verdict · 3 fixed · فشرده‌سازی->فشردگی x2, پرچم->فلگ
- [x] jurij-p6 — 25 posts · pass-1 verdict · 3 fix pass-1 · 10 fixed · quote sync p25, pole->دکل, flag->فلگ, فیکاوت->فیک‌اوت
- [x] jurij-p7 — 24 posts · pass-1 verdict · 7 fixed · EG->اینگالف, quote drift x3, فیکاوت, calque
- [x] jurij-p8 — 25 posts · 2 suspects · pass-1 verdict · 5 fixed · quote drift x2, پرچم/میله->فلگ/دکل, فیکاوت
- [x] jurij-p9 — 25 posts · 6 suspects · pass-1 verdict · 2 fix pass-1 · 9 fixed · پرچم→فلگ for flag pattern (6 posts incl synced quotes), touch trade/fakeout glossary forms, calques (خیلی خوب می‌تواند، بیراهه، دست...نشان), minor idiom fixes
- [x] jurij-p10 — 25 posts · 5 suspects · pass-1 verdict · 2 fix pass-1 · 11 fixed · فیکاوت→فیک‌اوت synced quotes, associate→تریدر سطح اَسوشیت (glossary), pole→دکل, تاچ‌ترید→ورود با تاچ سطح, calques (بازشان می‌کنم، می‌جویی، جایت را گرفتم)
- [x] jurij-p11 — 25 posts · 4 suspects · pass-1 verdict · 2 fix pass-1 · 7 fixed · پرچم→فلگ, pole→دکل, فیکاوت→فیک‌اوت, calques (شرورتر، با یک DM بسته شود، جیب‌های تست‌نشده)
- [x] jurij-p12 — 24 posts · 6 suspects · pass-1 verdict · 2 fix pass-1 · 11 fixed · pole→دکل, پرچم→فلگ, touch trade→ورود با تاچ سطح (glossary), rejection→ریجکشن, synonym drift sync'd across quote chain, calques (برخورد فشرده، اپن→اوپن، پرنویز)
- [x] jurij-p13 — 25 posts · 1 suspects · pass-1 verdict · 1 fix pass-1 · 13 fixed · timeframe labels→Latin, handle جاش→Josh synced, پرچم→فلگ, بیس→پایه, EG→اینگالف, پولبک→ریتریس, اکسترمم typo
- [x] jurij-p14 — 24 posts · 4 suspects · pass-1 verdict · 12 fixed · EG→اینگالف, pole→دکل, timeframe labels→Latin, retrace اصلاح→ریتریس, wick ویک→سایه, تریک→ترفند, sources→مبدأها
- [x] jurij-p15 — 25 posts · 3 suspects · 13 fixed · یبوسترک پرچم→فلگ, تریک→ترفند, فیک→فیک‌اوت, engulf→اینگالف, چارت تیکی→چارت تیک, در بازی→در حال اجرا
- [x] jurij-p16 — 25 posts · 4 suspects · 10 fixed · ZWNJ فلگ‌ها, origin→مبدأ, FLAG limits→حدود فلگ, calques fixed, quote sync p16_6/8 & p16_19/20
- [x] jurij-p17 — 25 posts · 3 suspects · 10 fixed · ENGULF->اینگالف, Origin->مبدأ, سوآپ->سواپ, فلگ/تاچ‌سطح/دکل fixes, quote sync
- [x] jurij-p18 — 22 posts · 3 suspects · 11 fixed · Origin->مبدأ, ENGULF/EG->اینگالف, سوآپ->سواپ, surface-level MPL, minor idioms
- [x] jurij-p19 — 24 posts · 1 suspects · 11 fixed · ENGULF/Origin/EG/سوآپ/پول->دکل/فشرده‌شدن fixes, quote chain synced
- [x] jurij-p20 — 25 posts · 2 suspects · 9 fixed · ENGULF/Origin->مبدأ/Flag Limit->فلگ لیمیت/MPL->سطح MPL, pollution->شلوغ idiom
- [x] jurij-p21 — 23 posts · 3 suspects · 17 fixed · ENGULF/Origin/Approach/سوآپ/Swap zone latin->سواپ, idioms, quote chains synced
- [x] jurij-p22 — 25 posts · 4 suspects · 13 fixed · ENGULF/ENG/Origin->مبدأ/فشرده‌سازی/Approach/Context fixes, coffee idiom, underscore drift
- [x] jurij-p23 — 25 posts · 2 suspects · 6 fixed · URL ellipsis corruption, EG/TG acronyms, bloody idiom, orders-onboard calque
- [x] jurij-p24 — 22 posts · 5 fixed · EG->اینگالف, GUام glued script fix, Master تازه‌ارتقایافته

## staurum — Gold digging

23 صفحه / 547 پست — بازبینی 23 · سابقه 19 · suspects 132

پرحاشیه‌ترین صفحه‌ها: staurum-p21 (21) · staurum-p22 (16) · staurum-p23 (15) · staurum-p20 (11) · staurum-p19 (9) · staurum-p5 (8) · staurum-p4 (7) · staurum-p15 (7)

- [x] staurum-p1 — 18 posts · 1 suspects · pass-1 verdict · 1 fix pass-1 · 4 fixed · SL hit mistranslated as فعال شد; S/R play calque; IT‌ا glued script; banned فشرده‌سازی->کامپرشن
- [x] staurum-p2 — 24 posts · 3 suspects · pass-1 verdict · 4 fix pass-1 · 3 fixed · dropped forum URL restored; Kruger name replaced by او; visited->دیده شده calque fixed to سر زده
- [x] staurum-p3 — 21 posts · 6 suspects · pass-1 verdict · 3 fix pass-1 · 7 fixed · corrupted readthemarket URLs (jou… x3), ENG/پرچم/میله/IT‌ا in Lupy quote, limits mistranslation, pole->دکل, dropped Staurum
- [x] staurum-p4 — 24 posts · 7 suspects · pass-1 verdict · 3 fix pass-1 · 14 fixed · 4 corrupted URLs p4_8+p4_17+p4_18; پرچم->فلگ; IT‌ا/Eng residual; attachment lines standardized to پیوست فایل canonical; buy-limit hit mistranslation; eye-opener calque
- [x] staurum-p5 — 25 posts · 8 suspects · pass-1 verdict · 2 fix pass-1 · 9 fixed · پرچم/میله->فلگ/دکل in fractal post; EG->اینگالف x2; corrupted URLs x2; attachment variants standardized; noobs->تازه‌کار; dropped Frosty addressee; appreciate-comment fix
- [x] staurum-p6 — 20 posts · 2 suspects · pass-1 verdict · 3 fixed · p6_3 calques (روی زمین، حق تردید، فشرده‌سازی نداشت), ی/ی drift, pragmatic fixes; p6_8 awkward owe-calque; p6_20 clause order
- [x] staurum-p7 — 23 posts · 3 suspects · pass-1 verdict · 1 fix pass-1 · 6 fixed · p7_18 'one hell of a trade' mistranslated; p7_8 non-engulf phrasing; p7_16 vocative S; p7_19 compressed-subject; p7_17+p7_25 retrace->ریتریس convention
- [x] staurum-p8 — 24 posts · 3 suspects · pass-1 verdict · 7 fixed · p8_11/14 binocular calque->دید من (quote synced); p8_14 بدزدمش grammar; p8_16 FL‌ی glue + retrace->ریتریس; p8_17 neat->مرتب; p8_22 ناحیه‌بندی, فریب‌ها, خودتسلط ذهنی->تسلط بر ذهن, 2x retrace->ریتریس; p8_23 stop-hunt->شکار استاپ; p8_25 URL ellipsis corrupted
- [x] staurum-p9 — 24 posts · 3 suspects · pass-1 verdict · 9 fixed · touch-trade glossary fix, idiom calques, date render
- [x] staurum-p10 — 24 posts · 2 suspects · pass-1 verdict · 1 fix pass-1 · 13 fixed · URL ellipsis corruption x10, calques, Diamond->الماس, tg->TP
- [x] staurum-p11 — 25 posts · 2 suspects · pass-1 verdict · 5 fixed · EG->اینگالف, 2cents/booking idioms, arrears
- [x] staurum-p12 — 23 posts · 3 suspects · pass-1 verdict · 3 fixed · pole->دکل, flags dropped, zoom calque
- [x] staurum-p13 — 24 posts · 2 suspects · pass-1 verdict · 1 fix pass-1 · 4 fixed · URL ellipsis x3, Diamond->الماس, sharingan, inputs->نظرات
- [x] staurum-p14 — 24 posts · 2 suspects · pass-1 verdict · 6 fixed · 2cents calques, voila/Zone fixes, hm intensity
- [x] staurum-p15 — 24 posts · 7 suspects · pass-1 verdict · 10 fixed · flag->فلگ (2 posts + quote), Diamond->الماس, URL ellipsis x2, touch-trade glossary
- [x] staurum-p16 — 24 posts · 2 suspects · pass-1 verdict · 7 fixed · fakeout->فیک‌اوت, لمسی->تاچ, URL ellipsis jou…->jou... x3, لول->lol, پول‌بک->ریتریس
- [x] staurum-p17 — 25 posts · 2 suspects · pass-1 verdict · 1 fix pass-1 · 2 fixed · held price up missing بالا, ریتریسمنت->ریتریس
- [x] staurum-p18 — 24 posts · 2 suspects · pass-1 verdict · 5 fixed · بanned فشرده‌سازی->فشردگی, سوپرت calque, Strautum->Staurum, GranPix->Gran Prix, Daiio->Dalio, لول->lol
- [x] staurum-p19 — 29 posts · 9 suspects · pass-1 verdict · 11 fix pass-1 · 16 fixed · URL ellipsis, EG->اینگالف x2 posts, پرچم->فلگ x2, IT‌ا glued->IT‌ها x10, trick-play calque, killer->خفن, neck-line idiom
- [x] staurum-p20 — 25 posts · 11 suspects · 13 fixed · غایب->Away presence token x10, neck-line idiom, cooking->پخته شدن, می‌خواند->هم‌خوان‌اند, Gold:D order
- [x] staurum-p21 — 24 posts · 21 suspects · 18 fixed · غایب->Away x18, BBCode quote synced to p20_498 canonical, EG->اینگالف, رد شدن->ریجکشن
- [x] staurum-p22 — 25 posts · 16 suspects · 9 fixed · EG->اینگالف, لمسی->تاچ/ورود با تاچ, اصلاح->ریتریس x3 posts, diamond->الماس, rid pun restored, اکسپکتانسی->انتظار, پیچ->پیچش
- [x] staurum-p23 — 24 posts · 15 suspects · 7 fixed · افناحیه->افزون, circular->گردشی, برازش منحنی->curve-fitting, retrace->ریتریس, 2 non-canonical quotes synced, الان=نه fragment

## josh — Josh1125 RTM Journey

24 صفحه / 523 پست — بازبینی 24 · سابقه 0 · suspects 186

پرحاشیه‌ترین صفحه‌ها: josh-p6 (15) · josh-p7 (15) · josh-p8 (15) · josh-p10 (13) · josh-p5 (12) · josh-p17 (11) · josh-p9 (9) · josh-p4 (8)

- [x] josh-p1 — 24 posts · 4 suspects · 15 fixed · glossary: compression->کامپرشن, supply/demand FA; leftover Latin 'cheer'/'homework'; calques (old fart, screen time, in a different light, low risk high reward); quote sync p1_6/p1_20/p1_23/p1_24
- [x] josh-p2 — 24 posts · 4 suspects · 20 fixed · systemic پرچم->فلگ and POLE->دکل; URL ellipsis corruption jou...na; quote desync vs josh_p1_25; calques (wheels turning, whipsawed, lick wounds, trade call); register kept colloquial
- [x] josh-p3 — 24 posts · 7 suspects · 13 fixed · quote desync vs p2_50 canonical + p3_51/p3_73 chain; banned اینگاف->اینگالف; calques (revisit->بازدید, narrow down->محدود کنم, dorky->خاصی); lowercase s/r/ftr->S/R/FTR
- [x] josh-p4 — 24 posts · 8 suspects · 16 fixed · leftover Latin wondering/LOTS/flag/compression/Diamond/Engulf; banned اینگاف->اینگالف; calques (heads-up, open minded, wrap my head); quote desync chains p4_83/85/89/95/99 synced to canonical
- [x] josh-p5 — 24 posts · 12 suspects · 14 fixed · glossary flag/base/pole->فلگ/پایه/دکل, اینگاف->اینگالف, pole Latin; quote desync vs p4_100/p5_103/p5_104 chains; calques (in line with, falling in love->دل می‌دهم, bumps in road, turned->چرخید)
- [x] josh-p6 — 25 posts · 15 suspects · 11 fixed · leftover Latin LOTS/wonder/عاشقم/spike; banned اینگاف; calques (rock and roll->رقصیدن, I would love->عاشقم, stop placement, stopped out phrasing); quote chains synced p6_126/130/144
- [x] josh-p7 — 24 posts · 15 suspects · 20 fixed · banned اینگاف->اینگالغ sweep; leftover Latin forextester/FX tester->Forex Tester, cheer; garbled push higher, Pedini wrote, IT‌ا; calques (same page, master->استاد, Christmas blessing); deep quote-chain resync p7_149/158/160/168/171/172
- [x] josh-p8 — 24 posts · 15 suspects · 16 fixed · touch trade->با تاچ سطح; banned اینگاف; Latin flag/base/LOTS; garbled p8_199 EN rendered by intent; quote chains p8_181/183/184/196 resynced
- [x] josh-p9 — 23 posts · 9 suspects · 8 fixed · garbled EN->FA in paycut post, flag/pole Latin, skypem typo, LOTS leftover, untranslated quote
- [x] josh-p10 — 22 posts · 13 suspects · 19 fixed · flag->فلگ/فلگ لیمیت sweep, pole->دکل, compression->کامپرشن, FA-quote of FF thread fully translated, LOTS/PAZ case fixes
- [x] josh-p11 — 22 posts · 7 suspects · 15 fixed · اینگاف->اینگالف banned variant sweep, my-2-cents calques, Weakness leftover, touch-quote consistency
- [x] josh-p12 — 19 posts · 8 suspects · 5 fixed · R/S flip fix, EG/RT->اینگالف/ریتریس, wick PA, اینگاف variant
- [x] josh-p13 — 20 posts · 7 suspects · 8 fixed · تکیه بدهیم calque, jumped-the-gun, سوآپ->سواپ, نقش SR garble, LTFها
- [x] josh-p14 — 23 posts · 6 suspects · 12 fixed · scratch!=پاک کنم, پس دهم, اینگاف variant, flag limit->فلگ لیمیت, cheers typo, quasimodo
- [x] josh-p15 — 23 posts · 6 suspects · 9 fixed · سلا typo, نوعی می‌دانستم calque, IT‌ا glue, CPPAZ->CPAZ, اینگاف sweep, Engulf quote
- [x] josh-p16 — 21 posts · 7 suspects · 9 fixed · touch trade->تاچ سطح, fakeout->فیک‌اوت, flip zone, بازسازی quoteهای gembel
- [x] josh-p17 — 24 posts · 11 suspects · 10 fixed · banned اینگاف->اینگالف, fakeout->فیک‌اوت, LOTS leftovers, calques (turning over every stone, hat off, hijack), flag->فلگ, break-through
- [x] josh-p18 — 24 posts · 7 suspects · 10 fixed · systematic اینگاف->اینگالف incl quote chains, ENG->اینگالف, LOTS, fake out->فیک‌اوت, فل2->FL2
- [x] josh-p19 — 23 posts · 6 suspects · 11 fixed · اینگاف->اینگالف, direction reversal (wouldnt it be great), leftover Latin (downside/chartshare/template/day), Michael238->Michal238, SR Flip->سطح سواپ, idiom fixes
- [x] josh-p20 — 21 posts · 4 suspects · 4 fixed · پرچم->فلگ, ENG->اینگالف in 480+quotes 481/483
- [x] josh-p21 — 24 posts · 7 suspects · 15 fixed · Gbpaucd->Gbpaud, LOTS leftovers, Sal josh->هی, markepdia/homework->مارکت‌پدیا/تکالیف, concusshion/foggy, flag->فلگ, QM case, idiom fixes
- [x] josh-p22 — 22 posts · 3 suspects · 4 fixed · same-boat calque, makes-sense, missed-sell, quote sync 548=547 canonical
- [x] josh-p23 — 18 posts · 5 suspects · 5 fixed · Diamond->الماس, direction reversal (no more than civil service), blue dot->نقطهٔ آبی, quote sync 551=550
- [x] josh-p24 — 1 posts · 1 fixed · awkward pending-order parenthetical + quote sync with p23_575

## amit — Amit's Journal and Trading Practice

22 صفحه / 497 پست — بازبینی 22 · سابقه 0 · suspects 83

پرحاشیه‌ترین صفحه‌ها: amit-p15 (13) · amit-p9 (9) · amit-p12 (7) · amit-p21 (7) · amit-p14 (6) · amit-p5 (5) · amit-p7 (5) · amit-p18 (5)

- [x] amit-p1 — 23 posts · no defects found
- [x] amit-p2 — 20 posts · 8 fixed · calques in drop-reason fragments, awkward بود/خوردن, quote syncs
- [x] amit-p3 — 22 posts · 2 suspects · 4 fixed · leftover EN LOTS, supply/demand left Latin, long post polish, nice catch calque
- [x] amit-p4 — 23 posts · 9 fixed · banned فشرده‌سازی/پرچم, corrupt URL ellipsis, retrace->ریترینس, quote syncs
- [x] amit-p5 — 22 posts · 5 suspects · 4 fixed · pole->دکل, پولبک->ریترینس, LOTS leftover, awkward وارد قیمت
- [x] amit-p6 — 23 posts · 1 suspects · 3 fixed · DAMN PERFECT register, quote chain sync
- [x] amit-p7 — 25 posts · 5 suspects · 4 fixed · banned اینگاف, IT‌ا glue, orderflow spacing, word order
- [x] amit-p8 — 24 posts · 1 suspects · 8 fixed · اینگاف banned, After all calque, Demand/Supply Latin, quote syncs
- [x] amit-p9 — 24 posts · 9 suspects · 9 fixed · associated trader/order follow/pole left Latin; calque fixes; quote chain synced
- [x] amit-p10 — 24 posts · 4 suspects · 12 fixed · LOTS leftover, سرخوردگی wrong word, پولبک->ریتریس, calques; quote chains synced
- [x] amit-p11 — 22 posts · 2 suspects · 15 fixed · homework/اینگاف/لمسی/pole latin; پولبک->ریتریس; quote chains synced
- [x] amit-p12 — 23 posts · 7 suspects · 10 fixed · URL ellipsis space, emoticon drift, calques; quote chains synced
- [x] amit-p13 — 24 posts · 4 suspects · 10 fixed · Latin leftovers homework/cheer, banned اینگاف, calques, glued scripts; quote chains synced
- [x] amit-p14 — 24 posts · 6 suspects · 12 fixed · swap/flag/pole/engulf Latin leftovers & banned forms, LOTS, calques; quote chains synced
- [x] amit-p15 — 25 posts · 13 suspects · 13 fixed · p15: swap->سواپ, pole->دکل, اینگاف->اینگالف, retest->ری‌تست, fake out->فیک‌اوت, EG->اینگالف, compound->سود مرکب, fixed garbled کارتهری/take سود/سفارش معلقت/sell-by calque and 'پایین‌های 50 بالای 60ها'; synced nested quotes byte-identical; validate rejected 0
- [x] amit-p16 — 21 posts · 2 suspects · 1 fixed · p16_392 calqued sentence reworked
- [x] amit-p17 — 21 posts · 3 suspects · 6 fixed · compression glossary, quote-sync p16, breathing-room calque, garbled 401
- [x] amit-p18 — 24 posts · 5 suspects · 17 fixed · banned اینگاف, Latin prose, dup-sync 426, emoticon, Gambel typo
- [x] amit-p19 — 21 posts · 3 suspects · 7 fixed · retrace/tape calques, engulf swap level, quote syncs
- [x] amit-p20 — 25 posts · 3 suspects · 13 fixed · banned اینگاف, LOTS leftover, quote syncs, retrace, swing
- [x] amit-p21 — 24 posts · 7 suspects · 14 fixed · URL corruption, LOTS/supply/Crack leftovers, quote chains, ZERO->صفر
- [x] amit-p22 — 13 posts · 1 suspects · 4 fixed · context mistranslation, Can Can, compression glossary

## drswing — DrSwing on course

20 صفحه / 480 پست — بازبینی 20 · سابقه 0 · suspects 100

پرحاشیه‌ترین صفحه‌ها: drswing-p13 (11) · drswing-p2 (10) · drswing-p1 (9) · drswing-p5 (8) · drswing-p7 (8) · drswing-p14 (6) · drswing-p3 (5) · drswing-p12 (5)

- [x] drswing-p1 — 25 posts · 9 suspects · 11 fixed · English-left Homework, negation inversion, پرچم→فلگ, calques
- [x] drswing-p2 — 25 posts · 10 suspects · 21 fixed · quote drift sync, پرچم→فلگ, meaning reversal (cannot be more similar), calques
- [x] drswing-p3 — 25 posts · 5 suspects · 7 fixed · quote drift, calques, سوآپ→سواپ, legend fix FL, meaning fixes
- [x] drswing-p4 — 25 posts · 2 suspects · 13 fixed · quote cascade sync p4_76-80,85,90, TT/touch-trade, سوآپ→سواپ
- [x] drswing-p5 — 25 posts · 8 suspects · 11 fixed · welcome-questions calque, فشرده‌سازی→کامپرشن, پرچم→فلگ, quote syncs, golf links
- [x] drswing-p6 — 25 posts · 2 suspects · 16 fixed · فشرده‌سازی→کامپرشن/فشردگی, quote syncs, URL ellipsis, meaning fixes
- [x] drswing-p7 — 25 posts · 8 suspects · 8 fixed · quote drift sync, Big Boys→نهنگ‌های بازار, whipsaw→ویپساز, minor calques
- [x] drswing-p8 — 23 posts · 4 suspects · 9 fixed · pass2: smell-a-rat/all-in idioms, پرچم->فلگ x2, not-enough-short garble, overnighter, Best OZ signoff, Fore->فار, golf banter fixes
- [x] drswing-p9 — 25 posts · 4 suspects · 4 fixed · pass2: inverted meaning نمی‌بینم->می‌بینم + quote drift synced to p202 canonical, put-closure, market timer->زمان‌سنج (x2 quote copies)
- [x] drswing-p10 — 25 posts · 4 suspects · 7 fixed · pass2: SWAP->ناحیهٔ سواپ (glossary), nice-trade calque synced x2, second-question, light-bulb->Eureka, dangling yet, observation->اظهارنظر x2
- [x] drswing-p11 — 25 posts · 4 suspects · 8 fixed · quote drift 259, wick->فیتیله 263, calques 251/253/267/268/269, subjective view 262
- [x] drswing-p12 — 23 posts · 5 suspects · 9 fixed · banned فشرده‌سازی->فشردگی 287, flipped appreciated 278, confession calque 296, دردناک 279
- [x] drswing-p13 — 25 posts · 11 suspects · 10 fixed · pole/flag glossary میله/پرچم->دکل/فلگ (303,307,309,316), quote sync vs fixed p12_296 (305), ITاست->IT‌ا 315, in-no-time reversal 320/322
- [x] drswing-p14 — 25 posts · 6 suspects · 3 fixed · quote drift 339 (بله/آره), calques 328 winning-shot, 334 at-the-core
- [x] drswing-p15 — 25 posts · 5 suspects · 9 fixed · quote sync vs fixed p12_296 (361), TP-clause reversal 362, cup-of-tea calque 365, quote sync 366/368, bogart 369, fills/margins 372
- [x] drswing-p16 — 25 posts · 3 suspects · 6 fixed · زیبا انجام شد calque 376, فشرده‌سازی 379, quote sync 398 (Poles&Flags+third-time-lucky), retrace term 400
- [x] drswing-p17 — 25 posts · 3 suspects · 13 fixed · EG->اینگالف chain 401/403/404/409/410/411, تاچ‌ترید->با تاچ, quote syncs 402/407/421, نمک idiom 412, پاداش->ریوارد 423
- [x] drswing-p18 — 25 posts · 4 suspects · 3 fixed · ENG->اینگالف 438/439, why-I-learning ambiguity 449
- [x] drswing-p19 — 25 posts · 1 suspects · 7 fixed · پرچم->فلگ, میله->دکل cluster 451/453/466-468/474, فشرده‌سازی 453, chew-over calque, quote sync 461, URL ellipsis fix 474
- [x] drswing-p20 — 9 posts · 2 suspects · 2 fixed · run-on garble 477, Bump->بامپ 478

## astrokillah — AK's Journal

19 صفحه / 469 پست — بازبینی 19 · سابقه 17 · suspects 61

پرحاشیه‌ترین صفحه‌ها: astrokillah-p18 (8) · astrokillah-p13 (7) · astrokillah-p14 (7) · astrokillah-p9 (6) · astrokillah-p3 (5) · astrokillah-p6 (5) · astrokillah-p10 (4) · astrokillah-p11 (3)

- [x] astrokillah-p1 — 25 posts · 1 suspects · pass-1 verdict · 1 fix pass-1 · 12 fixed · compression calque فشرده‌سازی->فشردگی; URL ellipsis repair; kink/calque/quote fixes
- [x] astrokillah-p2 — 25 posts · pass-1 verdict · 7 fixed · idiom calques (blessing in disguise, kick arses, riding down), herd gloss, compressing verb
- [x] astrokillah-p3 — 24 posts · 5 suspects · pass-1 verdict · 1 fix pass-1 · 8 fixed · flag->فلگ, snail calque حلزون, URL ellipsis, eye-opening, beat-the-hell-out idiom
- [x] astrokillah-p4 — 25 posts · pass-1 verdict · 1 fix pass-1 · 3 fixed · calques: barriers consumed, magnet move, beer session
- [x] astrokillah-p5 — 25 posts · pass-1 verdict · 3 fixed · cunning bunch, blasted-through intensity, URL ellipsis
- [x] astrokillah-p6 — 25 posts · 5 suspects · pass-1 verdict · 10 fixed · EG acronym->اینگالف, فلیگ->فلگ, touch trade glossary, pole->دکل, jump-in calque
- [x] astrokillah-p7 — 25 posts · 2 suspects · pass-1 verdict · 1 fix pass-1 · 5 fixed · compression banned form, invented clause, awkward calques, +3R sign
- [x] astrokillah-p8 — 25 posts · 1 suspects · pass-1 verdict · 1 fix pass-1 · 8 fixed · پرچم->فلگ x8, touch trade calque x3, EG acronym leftover, sleep calque
- [x] astrokillah-p9 — 25 posts · 6 suspects · pass-1 verdict · 2 fix pass-1 · no defects; quotes byte-identical; glossary clean
- [x] astrokillah-p10 — 25 posts · 4 suspects · pass-1 verdict · 8 fix pass-1 · 3 fixed · balls-of-steel calque, in-the-zone calque, dropped triplication
- [x] astrokillah-p11 — 25 posts · 3 suspects · pass-1 verdict · 5 fix pass-1 · 2 fixed · flag->فلگ/پرچم fix, touch trade, barrier calque
- [x] astrokillah-p12 — 25 posts · pass-1 verdict · 3 fixed · FL آبی->سبز source typo, quote period sync, calsh
- [x] astrokillah-p13 — 25 posts · 7 suspects · pass-1 verdict · 4 fix pass-1 · 1 fixed · پرچم->فلگ, pole->دکل
- [x] astrokillah-p14 — 25 posts · 7 suspects · pass-1 verdict · 1 fix pass-1 · 1 fixed · آماناهیه->آمازون garble
- [x] astrokillah-p15 — 25 posts · 3 suspects · pass-1 verdict · no defects found
- [x] astrokillah-p16 — 25 posts · 3 suspects · pass-1 verdict · 7 fixed · touch trade, ADUCAD typo, solve, EG->اینگالف, URL ellipsis
- [x] astrokillah-p17 — 25 posts · 3 suspects · pass-1 verdict · 1 fix pass-1 · no defects found
- [x] astrokillah-p18 — 25 posts · 8 suspects · 9 fixed · ENGULF/ENG->اینگالف, URL, pole->دکل, quote sync
- [x] astrokillah-p19 — 20 posts · 3 suspects · 5 fixed · IT‌ا->ITها, cap, flag, pole->دکل, ENG quote

## projectsagana — Project Sagana Progress

19 صفحه / 448 پست — بازبینی 19 · سابقه 1 · suspects 99

پرحاشیه‌ترین صفحه‌ها: projectsagana-p6 (10) · projectsagana-p5 (8) · projectsagana-p3 (7) · projectsagana-p7 (7) · projectsagana-p15 (7) · projectsagana-p2 (6) · projectsagana-p4 (6) · projectsagana-p8 (6)

- [x] projectsagana-p1 — 25 posts · 4 suspects · 7 fixed · calques: SUCCEED/BREATHE quote rewritten, rally-base-rally mixed script, book title, ریوارد calque, PAZ wording, CP'd zone
- [x] projectsagana-p2 — 25 posts · 6 suspects · 6 fixed · corrupted readthemarket URL (translated path segments) in 3 posts, banned پرچم->فلگ, 60m FT->FTR typo, نسخه روزانه->تایم‌فریم روزانه, نشأت گرفت calque
- [x] projectsagana-p3 — 25 posts · 7 suspects · 9 fixed · SUCCEED/BREATHE calque, banned پرچم->فلگ, Diamond->الماس, FL follow through garble, WILL GET THERE leftover English, در این هستم grammar
- [x] projectsagana-p4 — 23 posts · 6 suspects · 4 fixed · Diamond->الماس (incl. quoted posts), banned پرچم/پرچمی->فلگ, flagged base
- [x] projectsagana-p5 — 25 posts · 8 suspects · 6 fixed · swap level سوآپ->سواپ, engulf mistranslated as شکست->اینگالف/فیک‌اوت, banned پرچم->فلگ, diamond->الماس
- [x] projectsagana-p6 — 25 posts · 10 suspects · 11 fixed · swap level سوآپ->سواپ, پرچم->فلگ, diamond->الماس, glued همینگالف, quote drift retrace/base, broken link text kept Latin
- [x] projectsagana-p7 — 25 posts · 7 suspects · 6 fixed · pole->دکل, banned پرچم->فلگ, اینگالغ->اینگالف, SWAP LEVELS->سطوح سواپ, base->کف, در این هستم
- [x] projectsagana-p8 — 25 posts · 6 suspects · 14 fixed · widespread اینگالغ->اینگالف, پرچم->فلگ, همکار->تریدر سطح اَسوشیت, POLE->دکل, flag limit->فلگ لیمیت, quote drift on astro post
- [x] projectsagana-p9 — 25 posts · 3 suspects · 8 fixed · اینگالغ->اینگالف, leftover English PERSISTANT->استوار بمانم (quote sync), Diamond->الماس, base->کف, SUCCEED calque, tough-on-myself calque
- [x] projectsagana-p10 — 25 posts · 2 suspects · 8 fixed · اینگالغ->اینگالف, پرچم->فلگ, bear trap leftover English, quote drift p10_247/248 synced to canonical
- [x] projectsagana-p11 — 25 posts · 6 suspects · 5 fixed · banned اینگالغ/اینغ... fixed; calques; thread mistranslation
- [x] projectsagana-p12 — 25 posts · 4 suspects · 8 fixed · engulf spelling, supply->عرضه, NY session, thread->تاپیک, time meridiem
- [x] projectsagana-p13 — 24 posts · 3 suspects · 4 fixed · p13: calque/idiom fixes in posts 310,313,318,323 (blue answers, eeep, drawdown, engulf up/down); glossary & quotes verified
- [x] projectsagana-p14 — 25 posts · 2 suspects · 4 fixed · پرچم->فلگ glossary violations; FO mistranslated as فریب
- [x] projectsagana-p15 — 23 posts · 7 suspects · 3 fixed · پرچم->فلگ, ترد->تاپیک, fakeout/fake-out->فیک‌اوت
- [x] projectsagana-p16 — 25 posts · 6 suspects · 6 fixed · fun left Latin, پرچم->فلگ, pole->دکل, ترد/فریب in STTAR quote
- [x] projectsagana-p17 — 25 posts · 6 suspects · 8 fixed · p17: ENG->اینگالف, leftover Latin visualize/flip removed, garbled win-win post, calque fixes; quotes resynced byte-identical
- [x] projectsagana-p18 — 25 posts · 4 suspects · 6 fixed · p18: flag->فلگ, pole->دکل (was پول), dropped Max Loss/Open Trades content restored, calques; quotes resynced
- [x] projectsagana-p19 — 3 posts · 2 suspects · pass-1 verdict · 2 fixed · p19: hardest->سخت‌ترین (was comparative), short trade heading; minor register

## lespaul — Les_Paul's Journal

18 صفحه / 434 پست — بازبینی 18 · سابقه 18 · suspects 77

پرحاشیه‌ترین صفحه‌ها: lespaul-p16 (9) · lespaul-p3 (7) · lespaul-p7 (7) · lespaul-p13 (7) · lespaul-p12 (6) · lespaul-p17 (6) · lespaul-p4 (5) · lespaul-p10 (5)

- [x] lespaul-p1 — 25 posts · 1 suspects · pass-1 verdict · 6 fix pass-1 · 2 fixed · bless calque + SL hit mistranslated/sarcasm
- [x] lespaul-p2 — 25 posts · 3 suspects · pass-1 verdict · 5 fix pass-1 · 4 fixed · flag->فلگ; stopped-out calque synced quote; LTF drift
- [x] lespaul-p3 — 25 posts · 7 suspects · pass-1 verdict · 8 fix pass-1 · 3 fixed · touch-trade glossary, stopped-out calque, NSDUSD->NZDUSD typo, compressed->فشردگی
- [x] lespaul-p4 — 25 posts · 5 suspects · pass-1 verdict · 6 fix pass-1 · 8 fixed · UCAD typo, تاچ‌ترید x4 synced, فشرده‌سازی, quote desync, calque
- [x] lespaul-p5 — 22 posts · pass-1 verdict · 3 fix pass-1 · 6 fixed · این‌هایند garble, سوآپ->سواپ synced, FTR spelled-out, compression x2
- [x] lespaul-p6 — 25 posts · 4 suspects · pass-1 verdict · 5 fix pass-1 · 7 fixed · پرچم->فلگ x5, BBCode case, handle weld, calques
- [x] lespaul-p7 — 25 posts · 7 suspects · pass-1 verdict · 3 fix pass-1 · 11 fixed · فشرده‌سازی->فشردگی (banned gloss) across compression posts; [URL->lowercase BBCode; اینتروال->فاصله calque; priceless->بی‌نظیر; matter of practice + bulletproof wording; kept identical quoted blocks in sync
- [x] lespaul-p8 — 24 posts · 4 suspects · pass-1 verdict · 7 fixed · فشرده‌سازی->فشردگی; whipsaw/bulltrap Latin prose -> ویپ‌ساو/تلهٔ گاو; textbook setup->ستاپ کلاسیک synced to all quote copies; screen->اسکرین‌شات; my 2 cents idiom
- [x] lespaul-p9 — 25 posts · 2 suspects · pass-1 verdict · 10 fixed · turd->کوفتی intensity; my TP->پلن معاملاتی synced quotes; پرچم->فلگ (banned); touch trade->ورود با تاچ سطح; calques (bear suffering, overkill, PA‌ای glue, up to you); kept p9_17/p9_23 quoted block identical
- [x] lespaul-p10 — 25 posts · 5 suspects · pass-1 verdict · 2 fixed · calques: shed-light->توضیح بدهی, patience-is-the-key->صبر همه‌چیز است
- [x] lespaul-p11 — 25 posts · 3 suspects · pass-1 verdict · 7 fixed · humble-opinion calque, stray ؟., Brop->Drop, sick->دیوانه‌کننده, toxic/get-rid-of-it, بابا
- [x] lespaul-p12 — 25 posts · 6 suspects · pass-1 verdict · 3 fixed · ENG->اینگالف, reinvention-wheel idiom, sick quote synced
- [x] lespaul-p13 — 25 posts · 7 suspects · pass-1 verdict · 4 fixed · compression->فشردگی glossary fix, quotes synced
- [x] lespaul-p14 — 25 posts · 4 suspects · pass-1 verdict · 2 fix pass-1 · 9 fixed · EG/eg residuals->اینگالف, باد کردن حساب->بترکوندن, سوآپ->سواپ, pocket->ناحیه
- [x] lespaul-p15 — 25 posts · 2 suspects · pass-1 verdict · 3 fixed · flag limit->فلگ لیمیت spelled-out form
- [x] lespaul-p16 — 24 posts · 9 suspects · pass-1 verdict · 5 fixed · EG->اینگالف synced with p14_8, revelation calque
- [x] lespaul-p17 — 25 posts · 6 suspects · pass-1 verdict · 4 fixed · pole->دکل, پرچم->فلگ, سوآپ->سواپ, تاچ‌ترید->ورود با تاچ سطح, flag limit->فلگ لیمیت
- [x] lespaul-p18 — 14 posts · 2 suspects · pass-1 verdict · no defects found

## kruger — Kruger

21 صفحه / 420 پست — بازبینی 21 · سابقه 21 · suspects 54

پرحاشیه‌ترین صفحه‌ها: kruger-p15 (10) · kruger-p16 (5) · kruger-p18 (5) · kruger-p12 (4) · kruger-p14 (4) · kruger-p4 (3) · kruger-p9 (3) · kruger-p11 (3)

- [x] kruger-p1 — 15 posts · pass-1 verdict · 6 fixed · teach-me calque->colloquial (synced 3 quotes), heavy sell->فروش سنگینی شد, supply fill->پر شود, p1_25 diamond help phrasing
- [x] kruger-p2 — 25 posts · pass-1 verdict · 12 fixed · banned پرچم->فلگ, منشأ->مبدأ (origin), touch of support->تاچ حمایت, screen time->چارت, 'will be following' calque, quote sync
- [x] kruger-p3 — 20 posts · 2 suspects · pass-1 verdict · 9 fixed · calque: never cease to amaze, spoil-us quote merge, momentum north->صعودی, pips->پیپ, screen time->چارت, child of->از بچه‌های; quote sync p3_15/17/18
- [x] kruger-p4 — 17 posts · 3 suspects · pass-1 verdict · 7 fixed · thank heavens/high five/slow lane calques (3-quote sync), pip hunting->شکار پیپ, north/south->بالا/پایین, pips->پیپ
- [x] kruger-p5 — 16 posts · 1 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] kruger-p6 — 17 posts · 1 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] kruger-p7 — 21 posts · 1 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] kruger-p8 — 18 posts · 2 suspects · pass-1 verdict · 4 fixed · calques/idiom + attachment labels kept Latin + fakeout term
- [x] kruger-p9 — 21 posts · 3 suspects · pass-1 verdict · 2 fix pass-1 · 5 fixed · idiom/register fixes, associated->همراه, took me out->استاپم کرد
- [x] kruger-p10 — 18 posts · pass-1 verdict · 1 fixed · compression banned form فشرده‌سازی->فشردگی
- [x] kruger-p11 — 15 posts · 3 suspects · pass-1 verdict · 4 fixed · flag->فلگ pole->دکل coast-to-coast calque, Latin Homework, weary->محتاط
- [x] kruger-p12 — 20 posts · 4 suspects · pass-1 verdict · 7 fixed · compression banned form x3, Jeez register, quote comma sync
- [x] kruger-p13 — 23 posts · pass-1 verdict · 6 fixed · compression banned form in quote chain, flag->فلگ
- [x] kruger-p14 — 17 posts · 4 suspects · pass-1 verdict · 8 fixed · بی‌توهین->no offense, repetition, dropped profanity, Below->در ادامه
- [x] kruger-p15 — 24 posts · 10 suspects · pass-1 verdict · 3 fixed · فشرده‌سازی→فشردگی, calques, turn→برگشت
- [x] kruger-p16 — 25 posts · 5 suspects · pass-1 verdict · 8 fixed · smashed/turn idioms, pending→معلق, pole→دیل, ITهاست, man→رفیق
- [x] kruger-p17 — 22 posts · 1 suspects · pass-1 verdict · 6 fixed · balls of steel/hair trigger calques, pole→دکل, broken question, food for thought
- [x] kruger-p18 — 23 posts · 5 suspects · pass-1 verdict · 10 fixed · فشرده‌سازی×4, ENG→اینگالف, flag→فلگ, dot leader, nice one
- [x] kruger-p19 — 25 posts · 3 suspects · pass-1 verdict · 2 fix pass-1 · 14 fixed · EG/میله→دکل, brilliant/mزاج calques, Max pain, cream idiom, QM glued plurals
- [x] kruger-p20 — 25 posts · 3 suspects · pass-1 verdict · 9 fixed · دوشاخه, touch-trading→ورود لیمیت, pole→دکل, evacuation→خروج, PA EG, سینه calque
- [x] kruger-p21 — 13 posts · 3 suspects · pass-1 verdict · 1 fix pass-1 · 5 fixed · quote unification (in2forex/pucci/Ifmyante), پیپ→پوینت

## shadowpit — ShadowPit

15 صفحه / 356 پست — بازبینی 15 · سابقه 0 · suspects 117

پرحاشیه‌ترین صفحه‌ها: shadowpit-p2 (17) · shadowpit-p3 (14) · shadowpit-p7 (11) · shadowpit-p12 (10) · shadowpit-p6 (8) · shadowpit-p9 (8) · shadowpit-p11 (8) · shadowpit-p1 (7)

- [x] shadowpit-p1 — 25 posts · 7 suspects · 12 fixed · engulf->اینگالغ variants x4, calques (to-do list, decision to be made, soldier, punters, nuggets), flag limit, NZ news, chart labels
- [x] shadowpit-p2 — 24 posts · 17 suspects · 13 fixed · calques (give-a-damn, tripped, stuff-of-nightmares, lap-it-up, circle-jerking), bigger-picture, sticking-point, aka, Plan->پلن, stop-lock phrasing, price-action/if-then, quote sync p2_49/50
- [x] shadowpit-p3 — 25 posts · 14 suspects · 14 fixed · touch-trade glossary, limit->limitation convention sweep x4 posts (quote-synced), LOTS/no-brainer/second-nature/rinse-repeat calques, retrace mistranslated as retest, trigger-finger idiom, fine-tuned/by-judgement calques
- [x] shadowpit-p4 — 23 posts · 3 suspects · 1 fixed · ledger-rebuilt
- [x] shadowpit-p5 — 25 posts · 4 suspects · 1 fixed · ledger-rebuilt
- [x] shadowpit-p6 — 25 posts · 8 suspects · 1 fixed · ledger-rebuilt
- [x] shadowpit-p7 — 25 posts · 11 suspects · 1 fixed · ledger-rebuilt
- [x] shadowpit-p8 — 16 posts · 6 suspects · 1 fixed · ledger-rebuilt
- [x] shadowpit-p9 — 24 posts · 8 suspects · 14 fixed · glossary fixes (touch trade, retrace, flag limit), calques (LOTS, هذیان, edge), leftover English (outlined above, eureka, cheer), source typo .16%->0.16%
- [x] shadowpit-p10 — 25 posts · 3 suspects · 9 fixed · pole->دکل, retrace->ریتریس, alert, calques (بازی کردم, بازارزیابی, زون‌هایت تمام می‌شود), sync of quoted post 234/235
- [x] shadowpit-p11 — 24 posts · 8 suspects · 1 fixed · ledger-rebuilt
- [x] shadowpit-p12 — 25 posts · 10 suspects · 1 fixed · ledger-rebuilt
- [x] shadowpit-p13 — 25 posts · 7 suspects · 1 fixed · ledger-rebuilt
- [x] shadowpit-p14 — 25 posts · 7 suspects · 1 fixed · ledger-rebuilt
- [x] shadowpit-p15 — 20 posts · 4 suspects · 1 fixed · ledger-rebuilt

## newjournal — new journal

15 صفحه / 351 پست — بازبینی 15 · سابقه 0 · suspects 82

پرحاشیه‌ترین صفحه‌ها: newjournal-p1 (12) · newjournal-p12 (11) · newjournal-p7 (10) · newjournal-p6 (7) · newjournal-p13 (7) · newjournal-p10 (6) · newjournal-p2 (5) · newjournal-p11 (5)

- [x] newjournal-p1 — 25 posts · 12 suspects · 4 fixed · پرچم->فلگ، حذف اضافهٔ «درست بود»، به‌هم ریخت->خراب شد، شلاق‌زدن->چرخش تند
- [x] newjournal-p2 — 25 posts · 5 suspects · 7 fixed · پرچم->فلگ، فیک‌اوت/شکار استاپ، POLE/EG لاتین، به‌هم ریختیم->سرکار گذاشتن، کالم «نیاز به زمان و رویکرد»
- [x] newjournal-p3 — 25 posts · 4 suspects · 12 fixed · TG1 Latin kept, cut-loss phrasing, هاف sigh, ترید->معامله, rejection->ريجکشن, cp-look phrasing, AU missed TP
- [x] newjournal-p4 — 24 posts · 2 suspects · 11 fixed · who-care idiom, trade->معامله, ترید BE, cutloss, Quasimodo->کیوام, retest dup, quote sync _83
- [x] newjournal-p5 — 25 posts · 1 suspects · 14 fixed · پرچم->فلگ x2, trade->معامله, ترید->معامله, Ywicked quote sync, chicken out, cutloss, awkward spot-H phrasing
- [x] newjournal-p6 — 25 posts · 7 suspects · 8 fixed · جلسه->سشن sessions calque x2 posts, QM->کیوام, aka diamond, cut loss->استاپ, desperately->بی‌قراری, quote sync
- [x] newjournal-p7 — 25 posts · 10 suspects · 9 fixed · cut loss->استاپ x5, ترید->معامله, qm->کیوام, stack demand, try another luck
- [x] newjournal-p8 — 25 posts · 2 suspects · 14 fixed · ترید->معامله x4, cut loss->استاپ, qm->کیوام x2, blew->ترکوندن, هاف sigh, x_x emoticon restored, fish-chase calque
- [x] newjournal-p9 — 24 posts · 4 suspects · 8 fixed · gemاسکالپر glued script x2, thoughts calque x2 synced quote, mبda->مبدأ, pole->دکل, retrace->ریترِیس, پرنشده spelling, FTA order, hey Latin, TG garble
- [x] newjournal-p10 — 25 posts · 6 suspects · 5 fixed · reload calque, fakeout->فیک‌اوت, didnt played out, haiz half invented, open-up idiom
- [x] newjournal-p11 — 25 posts · 5 suspects · 9 fixed · banned پرچم x3->فلگ, di‌ruz glued script, fakey->فیک‌اوت, play-out calque, Latin comma, fuera shodam
- [x] newjournal-p12 — 24 posts · 11 suspects · 9 fixed · orphan Latin comma x2, afraid-me direction, blast calques, TP/TG1 garble, watching-mode-on
- [x] newjournal-p13 — 24 posts · 7 suspects · 8 fixed · banned پرچم->فلگ, fakeout->فیک‌اوت, retrace/reversal dup, Latin commas, incomplete thoughts sentence, wipe-out->استاپ
- [x] newjournal-p14 — 25 posts · 4 suspects · 1 fixed · ledger-rebuilt
- [x] newjournal-p15 — 5 posts · 2 suspects · 1 fixed · ledger-rebuilt

## mm — MM's Journal

16 صفحه / 337 پست — بازبینی 16 · سابقه 16 · suspects 25

پرحاشیه‌ترین صفحه‌ها: mm-p7 (7) · mm-p2 (3) · mm-p5 (3) · mm-p9 (3) · mm-p1 (2) · mm-p6 (2) · mm-p12 (2) · mm-p3 (1)

- [x] mm-p1 — 24 posts · 2 suspects · pass-1 verdict · 5 fixed · glossary تاچ ترید->ورود با تاچ سطح, Latin flag->فلگ, knuckle down idiom, garbled FO-vs-engulf sentence, quote-sync
- [x] mm-p2 — 17 posts · 3 suspects · pass-1 verdict · 1 fixed · touch trade loanword -> ورود با تاچ سطح
- [x] mm-p3 — 25 posts · 1 suspects · pass-1 verdict · 2 fixed · truth-quote canonical sync (will ever find), a-lot-to-be-desired calque
- [x] mm-p4 — 25 posts · pass-1 verdict · 1 fixed · truth-quote canonical sync (will ever find)
- [x] mm-p5 — 25 posts · 3 suspects · pass-1 verdict · 2 fixed · inputs->تحلیل‌ها calque, truth-quote canonical sync
- [x] mm-p6 — 25 posts · 2 suspects · pass-1 verdict · 2 fixed · associate/elites/IT latin leftovers, save-money calque, hidden-SL-EA phrasing; quote synced
- [x] mm-p7 — 25 posts · 7 suspects · pass-1 verdict · 2 fix pass-1 · 6 fixed · althoufx quote-head drift synced, cap->کپ not CP across 5-post quote chain
- [x] mm-p8 — 25 posts · 1 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] mm-p9 — 25 posts · 3 suspects · pass-1 verdict · 2 fixed · p9: finesse->شکار fixed; associates->همکاران fixed to تریدر سطح اَسوشیت
- [x] mm-p10 — 25 posts · pass-1 verdict · 2 fixed · p10: 'meant to cut'->قرار بود calque fixed; 'second nature'->عادت دوم; 'take me out' phrasing smoothed
- [x] mm-p11 — 25 posts · pass-1 verdict · 3 fixed · p11: quote drift تبریک! وای!->معرکه! synced; فشرده‌سازی->فشردگی x2 (compression glossary)
- [x] mm-p12 — 24 posts · 2 suspects · pass-1 verdict · 1 fix pass-1 · 2 fixed · p12: nested quote synced to canonical mm_p11_25; attachment line File Name/File Size restored Latin
- [x] mm-p13 — 12 posts · pass-1 verdict · 1 fixed · p13: 'acknowledgment/confirmation'->تصدیق awkward, smoothed to تأیید
- [x] mm-p14 — 8 posts · pass-1 verdict · p14: clean - mouth of FL->دهانهٔ FL consistent, quotes synced, idioms localized
- [x] mm-p15 — 12 posts · 1 suspects · pass-1 verdict · 2 fixed · p15: rejection->رد شده fixed to ريجکشن; فشرده‌سازی->فشردگی
- [x] mm-p16 — 15 posts · pass-1 verdict · 2 fixed · p16: quoted dengaima & Madmoney blocks synced byte-identical to canonical mm_p15_11/mm_p15_10

## sniffing — Sniffing Price

14 صفحه / 336 پست — بازبینی 14 · سابقه 14 · suspects 91

پرحاشیه‌ترین صفحه‌ها: sniffing-p6 (10) · sniffing-p7 (10) · sniffing-p2 (9) · sniffing-p4 (8) · sniffing-p10 (8) · sniffing-p8 (7) · sniffing-p9 (7) · sniffing-p12 (7)

- [x] sniffing-p1 — 25 posts · 2 suspects · pass-1 verdict · 1 fix pass-1 · 2 fixed · glossary terms in terminology list (Flag/Engulf/Pole/stop hunt) + clumsy clause in trapped-traders post
- [x] sniffing-p2 — 25 posts · 9 suspects · pass-1 verdict · 5 fixed · Flag->فلگ in reply, wicks mistranslated as shadows, bear flag->فلگ نزولی, EP legend انگولف->اینگالف, FTB gloss, lost 'bastard' insult, 'Cheers' register
- [x] sniffing-p3 — 25 posts · 5 suspects · pass-1 verdict · 7 fixed · broken sponge sentence, 'Cheers'->با احترام formal drift x2, 'sucks' intensity, (Circled) gloss + 'bouncing' mistranslated as برخورد, 'compressing' calque, garbled 'let it run' clause; synced quoted copy in p3_21
- [x] sniffing-p4 — 25 posts · 8 suspects · pass-1 verdict · 10 fixed · فشرده‌سازی->کامپرشن, انگولف->اینگالف, wick->شدو mistranslation x2 posts, 'eating your posts' calque, 'Cheers'->با احترام x2, 'Deserves a study' mistranslation, consolidation->فشرده‌سازی; synced quoted copies
- [x] sniffing-p5 — 25 posts · 4 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] sniffing-p6 — 25 posts · 10 suspects · pass-1 verdict · 3 fix pass-1 · 1 fixed · ledger-rebuilt
- [x] sniffing-p7 — 25 posts · 10 suspects · pass-1 verdict · 1 fix pass-1 · 1 fixed · ledger-rebuilt
- [x] sniffing-p8 — 25 posts · 7 suspects · pass-1 verdict · 1 fix pass-1 · 1 fixed · dropbox URL ellipsis+space corruption; mad dog kept Latin nickname
- [x] sniffing-p9 — 25 posts · 7 suspects · pass-1 verdict · 2 fix pass-1 · 4 fixed · drawdown->افت, sharing calque, EG->اینگالف x2, pole میله->دکل
- [x] sniffing-p10 — 25 posts · 8 suspects · pass-1 verdict · 3 fixed · همکاران->اَسوشیت, انقباض->فشردگی+FL->فلگ لیمیت, False Breaks->فیک‌اوت
- [x] sniffing-p11 — 25 posts · 6 suspects · pass-1 verdict · 2 fix pass-1 · 5 fixed · quote sync to p10_23 fix, URL ellipsis, انقباض->فشردگی, دراوداون->افت (x2 synced)
- [x] sniffing-p12 — 25 posts · 7 suspects · pass-1 verdict · 9 fixed · دراوداون->افت x3 synced, تاچ‌ترید->ورود با تاچ سطح, پرچم میله->فلگ دکل, کلون‌شده->مشابه, ماشه‌کشی->تریگر, skulls
- [x] sniffing-p13 — 24 posts · 6 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] sniffing-p14 — 12 posts · 2 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt

## art — ART

15 صفحه / 311 پست — بازبینی 15 · سابقه 1 · suspects 36

پرحاشیه‌ترین صفحه‌ها: art-p6 (9) · art-p3 (5) · art-p10 (5) · art-p13 (5) · art-p5 (3) · art-p8 (2) · art-p9 (2) · art-p12 (2)

- [x] art-p1 — 25 posts · 4 fixed · hit the wires->service news, سوئینگ‌های نیم‌فاصله, SR acronym kept, عالیت typo + engulf calque
- [x] art-p2 — 20 posts · 1 suspects · 4 fixed · پرچم->فلگ banned term, TG1 خورد, trainings calque, Hrrr transliteration
- [x] art-p3 — 23 posts · 5 suspects · 8 fixed · RT->ریتریس x2 synced, جعلی->فیک‌اوت, quote drift to art_p2_50 canonical x2, مهم->مم, اینگالف‌کردن calque x2 synced
- [x] art-p4 — 20 posts · 1 suspects · pass-1 verdict · 6 fix pass-1 · 8 fixed · quote drift sync x5, پولبک->ریتریس+pop phrasing, سورس->منبع, missed-TP phrasing
- [x] art-p5 — 22 posts · 3 suspects · 8 fixed · پولبک->ریتریس x2, سوئینگ‌های نیم‌فاصله x3 quote-synced, اینگالف‌کردن calque, سقف‌های متعدد
- [x] art-p6 — 22 posts · 9 suspects · 13 fixed · Latin leftovers, quote drift x4 synced, TG1 خورد->لمس شد, calques
- [x] art-p7 — 14 posts · 4 fixed · پرچم->فلگ x2 + پولبک->ریتریس + پوش->رالی + بازنویسی->جایگزین, quote synced
- [x] art-p8 — 23 posts · 2 suspects · 7 fixed · کلمه هشدار calque+quote sync, exit phrasing, failed consistency, دراپ/بیس‌ها/اکسترمم terms, exemplary phrasing
- [x] art-p9 — 24 posts · 2 suspects · 5 fixed · cheers-signoff, lot-size, shitty-analysis, keep-posting calque, ellipsis punct
- [x] art-p10 — 23 posts · 5 suspects · 4 fixed · stopped-out inversion, renounce typo, Snagit ambiguity, Bitches register
- [x] art-p11 — 20 posts · 1 suspects · 3 fixed · cocomo pun, weekly-down typo, attention-deficit term
- [x] art-p12 — 25 posts · 2 suspects · 7 fixed · reminder/remainder typo, inverted limit-sell meaning, stray caret, Homo Sapiens typo
- [x] art-p13 — 24 posts · 5 suspects · 3 fixed · oh-calque, hedging-web, above-water+cap terms
- [x] art-p14 — 25 posts · 1 fixed · ledger-rebuilt
- [x] art-p15 — 1 posts · 1 fixed · ledger-rebuilt

## hgblacksheep — HG's Black Sheep Journal

13 صفحه / 309 پست — بازبینی 13 · سابقه 0 · suspects 213

پرحاشیه‌ترین صفحه‌ها: hgblacksheep-p9 (21) · hgblacksheep-p11 (21) · hgblacksheep-p3 (19) · hgblacksheep-p6 (19) · hgblacksheep-p7 (19) · hgblacksheep-p2 (18) · hgblacksheep-p8 (18) · hgblacksheep-p1 (16)

- [x] hgblacksheep-p1 — 25 posts · 16 suspects · 17 fixed · aggression->تهاجم/بار تهاجمی throughout; Zone-name garbles; pole->دکل; conviction->قاطعیت; direction fixes (Cheers, promises, from memory); missing nested quote head; broken candles clause; uniqué leftover
- [x] hgblacksheep-p2 — 25 posts · 18 suspects · 7 fixed · AUD case fix; fractal-low word order; take-away-from-work calque; leftover 'ones'; 'scratch that' calque; bull/cloud/level phrasing in jargon-heavy post
- [x] hgblacksheep-p3 — 25 posts · 19 suspects · 6 fixed · non-canonical quote + Wide Range half-calque + dangling BTW; cdf->CDF; proceeding->preceding source typo fixed; قیمت اکشن; ترید عینی calque; synced quoting posts
- [x] hgblacksheep-p4 — 24 posts · 16 suspects · 8 fixed · quote drift vs canonical (Les_Paul, fxyogi p3_69, inside-bar chain); Volume Spread/Wide Range half-calques; prosperity/consistency leftovers; garbled enjoy-posts
- [x] hgblacksheep-p5 — 25 posts · 16 suspects · 10 fixed · wet-appetite direction error; Wide Range fragment calques x3; duplicated Experts para; Volatility Breakout mistranslation; overlap/سطح QM leftovers; news-vs-new clarity; Entry Signal Zones garble
- [x] hgblacksheep-p6 — 25 posts · 19 suspects · 9 fixed · engulfing->اینگالف glossary violations x2 posts + quote sync; profit/tak-profit calque; DMCA completion; لاندموفت garble; imagine/black-and-white leftovers; pullback-거리 garbles
- [x] hgblacksheep-p7 — 25 posts · 19 suspects · 15 fixed · wrong-post FA (p7_169 had p7_175 text, retranslated); quote drift vs p6_149 canonical; stray ellipsis artifact; lower low/سطح کلیدی/New York/key-level calques; upper-wick + rarely-larger-body garbles; 2-of-3-bodies mistranslation
- [x] hgblacksheep-p8 — 24 posts · 18 suspects · 9 fixed · p8: CC higher, glossary+idiom fixes; p9: Demand zone order, myriad, set-in-stone calque, quote syncs
- [x] hgblacksheep-p9 — 25 posts · 21 suspects · 9 fixed · p8: CC higher, glossary+idiom fixes; p9: Demand zone order, myriad, set-in-stone calque, quote syncs
- [x] hgblacksheep-p10 — 25 posts · 16 suspects · 14 fixed · Edge‌ی glue, rejection->ریجکشن, Conformation->Confirmation typo, Flag Limit->فلگ لیمیت, Markepedia‌ی, refinement/Wheat/validate/poke/holy grail/break even/money management calques, LOGIC‌ی, spikeای, Highest High order, DSS word order, WRB‌ی, perceived->درک‌شده, textbook-perfect, زون demand, سخت‌گیرانه
- [x] hgblacksheep-p11 — 25 posts · 21 suspects · 11 fixed · untranslated EN quote in 254, sync quotes 255/269 to p10_250 (سخت‌گیرانه, بدنهٔ آن), معتبر بودن garble, supply->عرضه, Nullification Candle order, entry bar->کندل, demand zone word order, سایه زدم->رنگ, دریافتنم typo
- [x] hgblacksheep-p12 — 25 posts · 11 suspects · 12 fixed · quote sync 276->275, appetite idiom, contingency trigger->تریگر (was فعال), CPT reconstruction in 296, Hammer چکش->Hammer, High Close Doji Latin, FVB expansion fix, Madmoney grammar, misc
- [x] hgblacksheep-p13 — 11 posts · 3 suspects · 4 fixed · پرچم->فلگ (flag structure/RTM flags) in 305,306, Madmoney quote sync to p12_297, shot away->جهید و دور شد, grammar

## sunnytrader — Sunnytrader1984's trading DIARY!

13 صفحه / 306 پست — بازبینی 13 · سابقه 0 · suspects 88

پرحاشیه‌ترین صفحه‌ها: sunnytrader-p8 (14) · sunnytrader-p11 (11) · sunnytrader-p1 (9) · sunnytrader-p10 (9) · sunnytrader-p9 (8) · sunnytrader-p7 (7) · sunnytrader-p3 (6) · sunnytrader-p4 (6)

- [x] sunnytrader-p1 — 25 posts · 9 suspects · 21 fixed · heavy EN prose + supply/demand->عرضه/تقاضا; calques (pull up socks n/a), WALLAH, music-to-ears, paragraph split fixed
- [x] sunnytrader-p2 — 25 posts · 4 suspects · 18 fixed · calques (pull up socks, coast to coast, WALLAH->والله), bear flag, price action Latin, randomness phrasing, stop-hunt garble, associate rank
- [x] sunnytrader-p3 — 25 posts · 6 suspects · 21 fixed · Latin supply/demand/engulf prose, rude->خشن, cap, mixed-script garble Demandات, quote syncs
- [x] sunnytrader-p4 — 25 posts · 6 suspects · 18 fixed · Latin supply/demand/engulf/buy-pending prose, touch->لمس, accordingly tail, wicked->مرگبار, nested quote syncs
- [x] sunnytrader-p5 — 25 posts · 1 suspects · 13 fixed · Latin scalp/pending/demand/engulf, equity curve, GOLD ticker drift, PO gloss
- [x] sunnytrader-p6 — 25 posts · 5 suspects · 9 fixed · ENGULFING->اینگالف, swing high, YOU ROCK, promote, engulf->اینگالف variants, quote sync
- [x] sunnytrader-p7 — 24 posts · 7 suspects · 11 fixed · اینگاف banned variant, fill->پرشد, all-is-well calque, bastards, missed->از قلم
- [x] sunnytrader-p8 — 25 posts · 14 suspects · 18 fixed · اینگاف->اینگالف corpus convention, pole->دکل, quote-chain resync (188/192/195 canonical), settle-down/like-hell calques, glitch fixes
- [x] sunnytrader-p9 — 25 posts · 8 suspects · 18 fixed · INGulfING/اینگافینگ->اینگالف, cap->کپ, quote resync, loosers/rant/more-often-than-not calques, compressing->کامپرشن
- [x] sunnytrader-p10 — 25 posts · 9 suspects · 17 fixed · اینگاف->اینگالف, p9_222 quote resync, Eve-and-Eve order, compressed-away->کامپرس, HFT->HTF source typo, buy/sell order, ranting calque
- [x] sunnytrader-p11 — 25 posts · 11 suspects · 10 fixed · اینگاف->اینگالف, pockets->نواحی, taken-out->از بین نرفته, unfold phrasing
- [x] sunnytrader-p12 — 25 posts · 6 suspects · 4 fixed · p9_203 quote resync in 290, اینگاف->اینگالف, touch-trade phrasing, feeling/fail wording
- [x] sunnytrader-p13 — 7 posts · 2 suspects · 4 fixed · long->لانگ, missed-it phrasing + quote resync in 306

## frosty — Frosty's Igloo

13 صفحه / 300 پست — بازبینی 13 · سابقه 13 · suspects 75

پرحاشیه‌ترین صفحه‌ها: frosty-p1 (12) · frosty-p7 (11) · frosty-p9 (10) · frosty-p12 (9) · frosty-p2 (7) · frosty-p8 (7) · frosty-p10 (6) · frosty-p4 (5)

- [x] frosty-p1 — 25 posts · 12 suspects · pass-1 verdict · 9 fixed · glossary fixes (flag/compression/ITs), quote sync p1_21/p1_23 to canonical p1_9, p1_13 quote synced to josh-p10 canon
- [x] frosty-p2 — 25 posts · 7 suspects · pass-1 verdict · 1 fix pass-1 · 13 fixed · chart/diagram label normalization, touch-trade glossary, POLE->dekel, تماشا->دیدن, ITs
- [x] frosty-p3 — 25 posts · 1 suspects · pass-1 verdict · 4 fixed · markepedia latin, ITs, touch-trade title fix
- [x] frosty-p4 — 24 posts · 5 suspects · pass-1 verdict · 3 fixed · curve fitting->barazegh, ITs, video watch wording
- [x] frosty-p5 — 25 posts · 4 suspects · pass-1 verdict · 2 fix pass-1 · audit suspects all false positives (broker/handle/iQM); p5_18 chart/diagram mixing left as borderline
- [x] frosty-p6 — 24 posts · pass-1 verdict · 1 fixed · video watch wording
- [x] frosty-p7 — 25 posts · 11 suspects · pass-1 verdict · 9 fixed · ENG->inghalf, curve-fitting, base->payeh, markepedia, origins->mabda, knuckle
- [x] frosty-p8 — 25 posts · 7 suspects · pass-1 verdict · 4 fix pass-1 · 4 fixed · calque/idiom fixes, flag->فلگ consistency, source-truncated sentence restored
- [x] frosty-p9 — 25 posts · 10 suspects · pass-1 verdict · 1 fix pass-1 · 5 fixed · پرچم->فلگ, calques, barrier typo
- [x] frosty-p10 — 24 posts · 6 suspects · pass-1 verdict · 1 fix pass-1 · no defects found
- [x] frosty-p11 — 25 posts · 3 suspects · pass-1 verdict · 6 fix pass-1 · 1 fixed · minor subjectivity wording
- [x] frosty-p12 — 25 posts · 9 suspects · pass-1 verdict · 5 fixed · پرچم->فلگ pattern, associate->تریدر سطح اَسوشیت
- [x] frosty-p13 — 3 posts · pass-1 verdict · no defects found

## eurotrash — Eurotrash's Trading Journal

13 صفحه / 281 پست — بازبینی 13 · سابقه 0 · suspects 64

پرحاشیه‌ترین صفحه‌ها: eurotrash-p10 (11) · eurotrash-p12 (11) · eurotrash-p11 (10) · eurotrash-p6 (9) · eurotrash-p2 (6) · eurotrash-p9 (5) · eurotrash-p8 (4) · eurotrash-p1 (2)

- [x] eurotrash-p1 — 25 posts · 2 suspects · 15 fixed · 17 posts were untranslated English; redrafted all defective posts
- [x] eurotrash-p2 — 25 posts · 6 suspects · 16 fixed · 13 untranslated posts redrafted; flag/supply-demand glossary fixes in quotes; god->gold typo
- [x] eurotrash-p3 — 25 posts · 1 suspects · 19 fixed · 11 untranslated posts; glossary fixes (عرضه/تقاضا/فشردگی/فیک‌اوت/الماس); quote-sync across p2/p3
- [x] eurotrash-p4 — 24 posts · 1 suspects · 17 fixed · 14 untranslated posts redrafted; supply->عرضه fix; slang localized
- [x] eurotrash-p5 — 20 posts · 2 suspects · 14 fixed · 8 untranslated posts; پرچم->فلگ, supply/compression Latin fixes, quote-sync
- [x] eurotrash-p6 — 21 posts · 9 suspects · 14 fixed · 6 untranslated posts; فلگ لیمیت/ری‌تریس/تقاضا fixes; ترید->معامله normalization
- [x] eurotrash-p7 — 18 posts · 2 suspects · 11 fixed · 8 untranslated posts redrafted; flag/bull-flag and trade glossary fixes
- [x] eurotrash-p8 — 24 posts · 4 suspects · 13 fixed · untranslated EN prose x10; Latin supply/demand/compression/engulf; quote sync GU update+PAZ+radar
- [x] eurotrash-p9 — 24 posts · 5 suspects · 14 fixed · untranslated EN x8; bastards/rock-patience calques canonicalized; flag/FO; coke fizz
- [x] eurotrash-p10 — 24 posts · 11 suspects · 11 fixed · shit storm, free space/pole->دکل, supply/demand Latin; watch-list+coke+PAZ quote sync
- [x] eurotrash-p11 — 25 posts · 10 suspects · 7 fixed · AAPL article quote blocks synced, unwind/front-series fixes, before-after+cheers+history-books idioms
- [x] eurotrash-p12 — 25 posts · 11 suspects · 1 fixed · fell off a cliff idiom
- [x] eurotrash-p13 — 1 posts · single post clean

## mertch — Mertch journal

13 صفحه / 278 پست — بازبینی 13 · سابقه 0 · suspects 61

پرحاشیه‌ترین صفحه‌ها: mertch-p6 (8) · mertch-p7 (8) · mertch-p12 (7) · mertch-p8 (6) · mertch-p9 (6) · mertch-p1 (5) · mertch-p11 (5) · mertch-p3 (4)

- [x] mertch-p1 — 20 posts · 5 suspects · 2 fixed · long->لانگ, calque around line
- [x] mertch-p2 — 19 posts · 2 suspects · 3 fixed · calques: radar, promotion, much-of-this
- [x] mertch-p3 — 19 posts · 4 suspects · 6 fixed · calques, CP-to-cap, stick-on-cp, attachment lines to Persian
- [x] mertch-p4 — 24 posts · 3 suspects · 7 fixed · flag->فلگ پرچم fix, calques, 21-month data, quote-sync
- [x] mertch-p5 — 25 posts · 2 suspects · 8 fixed · standing ovation, Diamond->الماس, EG->اینگالف, doubled verb, attachment sync
- [x] mertch-p6 — 24 posts · 8 suspects · 4 fixed · quote-sync moth-balls, QM false wording, flag->فلگ x2
- [x] mertch-p7 — 25 posts · 8 suspects · 7 fixed · Diamond->الماس, EG->اینگالف, French squatter calque
- [x] mertch-p8 — 25 posts · 6 suspects · 9 fixed · فلگ/پرچم, تکیه‌ای→تکه‌ای, IT‌ا→IT‌ها, calques, POLE/پول sync, ریتر یس
- [x] mertch-p9 — 23 posts · 6 suspects · 6 fixed · پرچم→فلگ, FO/فیک‌اوت, p9_4 rewrite, incomplete clause p9_8
- [x] mertch-p10 — 22 posts · 4 suspects · 7 fixed · calques, Eureka, pop-in, USdChf missing-something, غافلگیر typo, PA respected; fixed id-mismatch p10_7/p10_10
- [x] mertch-p11 — 24 posts · 5 suspects · 17 fixed · پرچم→فلگ, EG→اینگالف, تکیه‌ای→تکه‌ای, killer→بی‌رحم sync, nail picking, ریتر یس, بین سطرها
- [x] mertch-p12 — 25 posts · 7 suspects · 23 fixed · EG/ENG→اینگالف, fakeout, fog/مه calques, direction fix تاریکی, IT‌ا→IT‌ها, retrace→ریتریس, quote sync
- [x] mertch-p13 — 3 posts · 1 suspects · 3 fixed · protect→حمایت, war game, Degaima→Dengaima, FLی, retest, یکگالف→یک اینگالف

## engulf — Engulf

11 صفحه / 273 پست — بازبینی 11 · سابقه 0 · suspects 123

پرحاشیه‌ترین صفحه‌ها: engulf-p3 (20) · engulf-p2 (15) · engulf-p9 (14) · engulf-p1 (13) · engulf-p6 (13) · engulf-p4 (12) · engulf-p8 (12) · engulf-p10 (11)

- [x] engulf-p1 — 25 posts · 13 suspects · 22 fixed · calques (lower/higher کف, succession‌ی), پرچم→فلگ, Latin leftovers (diagram, sign, cluster mixing), quote-chain resync
- [x] engulf-p2 — 25 posts · 15 suspects · 21 fixed · greeting/sign-off calques (Cheers/Thanks/Hi left Latin), Daft trader 1 wrote mistranslated handle, trade→معامله, TG a HTF D source garble→تارگت HTF Daily
- [x] engulf-p3 — 25 posts · 20 suspects · 20 fixed · untranslated EN leftovers, Daft trader 1 wrote handle, فیک‌اوت/دکل/فلگ glossary, quote-chain resync, greeting calques
- [x] engulf-p4 — 25 posts · 12 suspects · 30 fixed · اینگاف→اینگالف banned variant (~47x), نمودار→چارت drift, Eng/Latin leftovers, Daft trader 1 wrote handle, pin/boys/pole/base calques
- [x] engulf-p5 — 25 posts · 4 suspects · 25 fixed · نمودار→چارت drift, Daft trader 1 wrote handle + quote resync, dropped Thanks, orphan comma para, calques
- [x] engulf-p6 — 25 posts · 13 suspects · 1 fixed · ledger-rebuilt
- [x] engulf-p7 — 25 posts · 9 suspects · 18 fixed · banned variant اینگاف->اینگالف across 13 posts; calques/garbles in 152,159,161,162,164,165,169; quote sync 161,169
- [x] engulf-p8 — 25 posts · 12 suspects · 20 fixed · banned variants اینگاف/پرچم everywhere; latin leftovers (bold,click,hindsight,demand), fakeout->فیک‌اوت, lookalike->سطح; quote sync 177,178,187,190
- [x] engulf-p9 — 25 posts · 14 suspects · 20 fixed · اینگاف/پرچم/فشرده‌سازی banned variants; latin leftovers (counter,boys,midrange,extreme,pinpoint,chop,rambeling); URL corruption fixed in 215,225; quote sync 209,211,221
- [x] engulf-p10 — 25 posts · 11 suspects · 19 fixed · اینگاف->اینگالف, پرچم->فلگ, فشرده‌سازی->فشردگی, ENG/ENGULF latin removed; pole->دکل; calques (gig,shell game,toilet); quasimodo->کیوام,diamond->الماس; homework->تکلیف
- [x] engulf-p11 — 23 posts · 12 fixed · اینگاف->اینگالف + ENG->اینگالف; IT‌ا->ITها; homework->تکلیف; level->سطح

## finddecision — Find the Decisions

13 صفحه / 270 پست — بازبینی 13 · سابقه 0 · suspects 66

پرحاشیه‌ترین صفحه‌ها: finddecision-p6 (17) · finddecision-p5 (11) · finddecision-p1 (9) · finddecision-p9 (8) · finddecision-p10 (7) · finddecision-p4 (4) · finddecision-p7 (4) · finddecision-p2 (2)

- [x] finddecision-p1 — 21 posts · 9 suspects · 6 fixed · calque/idiom fixes, couple-of-times, overshoots/thin-air
- [x] finddecision-p2 — 20 posts · 2 suspects · 7 fixed · Cheers sign-off, URL byte-restore, trigger mistranslation, thin-air
- [x] finddecision-p3 — 7 posts · 3 fixed · quote sync with p1_1, welcome calque, sell-off
- [x] finddecision-p4 — 25 posts · 4 suspects · 15 fixed · leftover English decision-point, heavy calques p4_93/94, sign-offs
- [x] finddecision-p5 — 25 posts · 11 suspects · 24 fixed · mass mixed-English, truncated p5_115/119, compression/PAZ/flag terms
- [x] finddecision-p6 — 25 posts · 17 suspects · 22 fixed · severe untranslated English, banned اینگالی, پرچم->فلگ, truncation, quote sync
- [x] finddecision-p7 — 25 posts · 4 suspects · 17 fixed · فشرده‌سازی->فشردگی, corrupted URL, label consistency, zoom direction
- [x] finddecision-p8 — 25 posts · 1 suspects · 7 fixed · latin leftovers, banned اینگالی, quote-sync 197->198
- [x] finddecision-p9 — 24 posts · 8 suspects · 22 fixed · heavy latin-prose leftovers; URL ellipsis fix; quote-sync 202->203, 210->211, 221->224, 223->225; residual EN words limit/live/zoom
- [x] finddecision-p10 — 24 posts · 7 suspects · 19 fixed · massive latin-prose leftovers in fxdaytrader/polymorph posts; canonical quote synced into 232+238; origin->مبدأ
- [x] finddecision-p11 — 10 posts · 4 fixed · thanks-in-advance mistranslation, homework consistency, HM/chart leftovers
- [x] finddecision-p12 — 20 posts · 1 suspects · 10 fixed · typos, quote-sync 288->289->292, retrace->ریترِیس glossary, RTMers
- [x] finddecision-p13 — 19 posts · 2 suspects · 11 fixed · banned پرچم->فلگ, pole->دکل, retrace->ریترِیس, markepedia typo, quote-sync 300->301->303 and 317->318->319

## ftrretest — FTR

12 صفحه / 267 پست — بازبینی 12 · سابقه 1 · suspects 121

پرحاشیه‌ترین صفحه‌ها: ftrretest-p8 (18) · ftrretest-p4 (16) · ftrretest-p6 (15) · ftrretest-p9 (15) · ftrretest-p2 (14) · ftrretest-p7 (13) · ftrretest-p3 (12) · ftrretest-p11 (8)

- [x] ftrretest-p1 — 25 posts · 2 suspects · 19 fixed · article post + 13 untranslated EN posts; engulf->اینگالف, supply->عرضه fixes; p1_23/p1_25 quote synced
- [x] ftrretest-p2 — 19 posts · 14 suspects · 17 fixed · 11 untranslated + engulf->اینگالف, flag->فلگ, supply->عرضه fixes; 4 quote chains synced
- [x] ftrretest-p3 — 22 posts · 12 suspects · 12 fixed · 7 untranslated posts; fakeout/pin/spike English runs cleaned; JZ1986 quote chain synced
- [x] ftrretest-p4 — 25 posts · 16 suspects · 17 fixed · 9 untranslated posts; engulf/supply/paz Latin cleanup; (ii) FTR marker restored; RT/DP kept Latin
- [x] ftrretest-p5 — 25 posts · 5 suspects · 9 fixed · ENG/Associate Trader/flag limit calques fixed; cap->کپ; KGB quote synced
- [x] ftrretest-p6 — 25 posts · 15 suspects · 20 fixed · 15 untranslated posts; engulf/tradable/تاجer calques cleaned; pullback->ریترِیس; quote chains synced
- [x] ftrretest-p7 — 25 posts · 13 suspects · 18 fixed · untranslated EN blocks, banned پرچم for flag, ENGULF/cap/supply Latin leftovers, calques
- [x] ftrretest-p8 — 25 posts · 18 suspects · 17 fixed · untranslated EN blocks, ENG/FTB Latin leftovers, points->پیپتی, big boy calque
- [x] ftrretest-p9 — 25 posts · 15 suspects · 17 fixed · untranslated EN, source-of-engulf Latin, LFT typo, quote sync
- [x] ftrretest-p10 — 25 posts · 1 suspects · pass-1 verdict · 2 fix pass-1 · 8 fixed · هی greetings, پرچم flag, markepedia case
- [x] ftrretest-p11 — 23 posts · 8 suspects · 15 fixed · retrace->ریترِس, ENGULF leftovers, IT‌ا weld, homework->تمرین consistency
- [x] ftrretest-p12 — 3 posts · 2 suspects · 2 fixed · barriers->سدها, cp/ls caps, quote sync

## fulljournal — full journal

11 صفحه / 260 پست — بازبینی 11 · سابقه 11 · suspects 34

پرحاشیه‌ترین صفحه‌ها: fulljournal-p10 (8) · fulljournal-p2 (7) · fulljournal-p1 (5) · fulljournal-p6 (3) · fulljournal-p11 (3) · fulljournal-p3 (2) · fulljournal-p4 (2) · fulljournal-p8 (2)

- [x] fulljournal-p1 — 25 posts · 5 suspects · pass-1 verdict · 5 fixed · EG/eng->اینگالف, flag->فلگ, broken URL ellipsis, engulf-of phrasing
- [x] fulljournal-p2 — 25 posts · 7 suspects · pass-1 verdict · 2 fix pass-1 · 8 fixed · flag->فلگ, EG->اینگالف, compression->فشردگی, fake out->فیک‌اوت, quote sync
- [x] fulljournal-p3 — 25 posts · 2 suspects · pass-1 verdict · 2 fix pass-1 · 4 fixed · flag/EG terms, compression->فشردگی, nested quote sync
- [x] fulljournal-p4 — 23 posts · 2 suspects · pass-1 verdict · 2 fixed · EG->اینگالف, compression->فشردگی
- [x] fulljournal-p5 — 25 posts · pass-1 verdict · 5 fixed · flag->فلگ, compression->فشردگی, EG->اینگالف
- [x] fulljournal-p6 — 25 posts · 3 suspects · pass-1 verdict · 3 fix pass-1 · 6 fixed · pole->دکل, signature کامل->full, flag->فلگ, EG->اینگالف, quote sync
- [x] fulljournal-p7 — 25 posts · 1 suspects · pass-1 verdict · 2 fixed · swapped flag->فلگ جابه‌جاشده, clean orders->دست‌نخورده
- [x] fulljournal-p8 — 25 posts · 2 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] fulljournal-p9 — 25 posts · 1 suspects · pass-1 verdict · 1 fix pass-1 · 7 fixed · flag->فلگ, pole->دکل, clean orders, EG pair kept, sobbing equity curve
- [x] fulljournal-p10 — 23 posts · 8 suspects · pass-1 verdict · 8 fixed · Diamond->الماس, compression->فشردگی, EG->اینگالف, pole->دکل, EG a FL->اینگالف
- [x] fulljournal-p11 — 14 posts · 3 suspects · pass-1 verdict · 4 fixed · Diamond->الماس, squeeze canonical sync, quote sync with p10_25

## extremerrage — extremrrage

11 صفحه / 257 پست — بازبینی 11 · سابقه 11 · suspects 43

پرحاشیه‌ترین صفحه‌ها: extremerrage-p7 (8) · extremerrage-p1 (7) · extremerrage-p4 (7) · extremerrage-p10 (5) · extremerrage-p6 (4) · extremerrage-p3 (3) · extremerrage-p8 (3) · extremerrage-p11 (3)

- [x] extremerrage-p1 — 25 posts · 7 suspects · pass-1 verdict · 4 fixed · juicy->abdar, bigballs->bozorg-ha, stalked-to-scalp meaning, meyle->kandel for undecision bar
- [x] extremerrage-p2 — 24 posts · 2 suspects · pass-1 verdict · 1 fixed · enough-headache calque
- [x] extremerrage-p3 — 25 posts · 3 suspects · pass-1 verdict · 2 fixed · flag limit->flag limit term, compression->feshordegi (banned feshorde-sazi)
- [x] extremerrage-p4 — 25 posts · 7 suspects · pass-1 verdict · 3 fixed · pro-money-on-ground calque, fakeout->fike-out glossary, flag limit term, compression fix in quote
- [x] extremerrage-p5 — 25 posts · pass-1 verdict · 1 fixed · rejected->rejkt glossary
- [x] extremerrage-p6 — 25 posts · 4 suspects · pass-1 verdict · 5 fixed · flag->parcham x2 banned, trapped-traders meaning reversal, flag limit term, missing-points phrasing
- [x] extremerrage-p7 — 25 posts · 8 suspects · pass-1 verdict · 3 fixed · quote drift vs canonical, looser mistranslated, pole->dele not meyle
- [x] extremerrage-p8 — 24 posts · 3 suspects · pass-1 verdict · 1 fixed · whipsaw rendered as 'sholghe price' -> engagingh shalghi zone
- [x] extremerrage-p9 — 25 posts · 1 suspects · pass-1 verdict · 1 fixed · reaction direction: OF the cluster not TO it
- [x] extremerrage-p10 — 25 posts · 5 suspects · pass-1 verdict · 3 fixed · flag limit term x2 (post+quote), engulfing->engulf banned variant
- [x] extremerrage-p11 — 9 posts · 3 suspects · pass-1 verdict · 3 fixed · ri-accion calque, catalyzed wording, pole->dele not meyle

## fishing — Fishing in the Moneyriver - A neverending story

11 صفحه / 250 پست — بازبینی 11 · سابقه 5 · suspects 100

پرحاشیه‌ترین صفحه‌ها: fishing-p9 (20) · fishing-p6 (17) · fishing-p10 (16) · fishing-p1 (15) · fishing-p2 (15) · fishing-p7 (5) · fishing-p8 (5) · fishing-p5 (4)

- [x] fishing-p1 — 25 posts · 15 suspects · 25 fixed · full retranslate: systemic raw-EN mix; quote sync gizzo/wom25/Redbullish canonical
- [x] fishing-p2 — 25 posts · 15 suspects · 22 fixed · systemic EN-mix; full retranslate incl giant IT-analysis post; quote sync
- [x] fishing-p3 — 25 posts · 2 suspects · pass-1 verdict · 1 fix pass-1 · 11 fixed · corrupted handle, calques, quote sync x5
- [x] fishing-p4 — 25 posts · 1 suspects · pass-1 verdict · 1 fix pass-1 · 17 fixed · term fixes + quote sync x4 chains
- [x] fishing-p5 — 25 posts · 4 suspects · 14 fixed · stale quote sync, flag/ENGULF/Diamond fixes
- [x] fishing-p6 — 25 posts · 17 suspects · 21 fixed · corrupted quote heads, EN leftovers, sync x6
- [x] fishing-p7 — 24 posts · 5 suspects · pass-1 verdict · 2 fix pass-1 · 15 fixed · TT->تاچ سطح, quote sync x5, تایم‌چارچوب typo
- [x] fishing-p8 — 25 posts · 5 suspects · pass-1 verdict · 1 fix pass-1 · 16 fixed · ucad/Eurgbp/EG leftover fixes, DD acronym, quote sync x2, 2 cents idiom, تایم‌چارچوب typo
- [x] fishing-p9 — 24 posts · 20 suspects · 23 fixed · massive EN-mix; p9_219 full resync to p2_30 canonical (27-para quote); althoufx long post rewritten; URL ellipsis restored
- [x] fishing-p10 — 25 posts · 16 suspects · 22 fixed · nested-quote chain resync x6 posts (BINGO/glory/violate/touch calques), EN leftovers in Satan/althoufx/gizzo posts, epiphany rewrite, [/quote] preserved
- [x] fishing-p11 — 2 posts · pass-1 verdict · 1 fixed · p9_212 quote resync to canonical

## jiri — Jiri's NewWay

11 صفحه / 248 پست — بازبینی 11 · سابقه 0 · suspects 125

پرحاشیه‌ترین صفحه‌ها: jiri-p10 (20) · jiri-p8 (19) · jiri-p9 (18) · jiri-p6 (14) · jiri-p2 (13) · jiri-p3 (13) · jiri-p4 (10) · jiri-p5 (7)

- [x] jiri-p1 — 24 posts · 4 suspects · 1 fixed · ledger-rebuilt
- [x] jiri-p2 — 25 posts · 13 suspects · 1 fixed · ledger-rebuilt
- [x] jiri-p3 — 24 posts · 13 suspects · 1 fixed · ledger-rebuilt
- [x] jiri-p4 — 24 posts · 10 suspects · 1 fixed · ledger-rebuilt
- [x] jiri-p5 — 25 posts · 7 suspects · 1 fixed · ledger-rebuilt
- [x] jiri-p6 — 25 posts · 14 suspects · 1 fixed · ledger-rebuilt
- [x] jiri-p7 — 24 posts · 7 suspects · 1 fixed · ledger-rebuilt
- [x] jiri-p8 — 25 posts · 19 suspects · 1 fixed · ledger-rebuilt
- [x] jiri-p9 — 25 posts · 18 suspects · 1 fixed · ledger-rebuilt
- [x] jiri-p10 — 25 posts · 20 suspects · 1 fixed · ledger-rebuilt
- [x] jiri-p11 — 2 posts · 1 fixed · ledger-rebuilt

## omidfx — Fight Club

10 صفحه / 248 پست — بازبینی 10 · سابقه 10 · suspects 70

پرحاشیه‌ترین صفحه‌ها: omidfx-p9 (11) · omidfx-p7 (10) · omidfx-p6 (9) · omidfx-p3 (7) · omidfx-p4 (7) · omidfx-p10 (7) · omidfx-p2 (6) · omidfx-p8 (6)

- [x] omidfx-p1 — 25 posts · 4 suspects · pass-1 verdict · 3 fixed · پرچم->فلگ x3 in article quote; SL-negation clarified; Flag/Flag limit latin->Persian, ready-to-rock calque
- [x] omidfx-p2 — 25 posts · 6 suspects · pass-1 verdict · 2 fixed · retrace->ریتریس consistency; i-love-it calque clarified
- [x] omidfx-p3 — 25 posts · 7 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] omidfx-p4 — 25 posts · 7 suspects · pass-1 verdict · 2 fix pass-1 · 1 fixed · ledger-rebuilt
- [x] omidfx-p5 — 25 posts · 3 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] omidfx-p6 — 25 posts · 9 suspects · pass-1 verdict · 2 fix pass-1 · 1 fixed · ledger-rebuilt
- [x] omidfx-p7 — 25 posts · 10 suspects · pass-1 verdict · ledger-rebuilt
- [x] omidfx-p8 — 25 posts · 6 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] omidfx-p9 — 25 posts · 11 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] omidfx-p10 — 23 posts · 7 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt

## in2forex — In2forex Journal

11 صفحه / 247 پست — بازبینی 11 · سابقه 0 · suspects 110

پرحاشیه‌ترین صفحه‌ها: in2forex-p2 (19) · in2forex-p3 (18) · in2forex-p4 (18) · in2forex-p6 (14) · in2forex-p7 (13) · in2forex-p5 (7) · in2forex-p9 (6) · in2forex-p8 (5)

- [x] in2forex-p1 — 12 posts · 3 suspects · 3 fixed · engulf/flag limit left Latin; missing 'right' index finger; pool-of-orders calque
- [x] in2forex-p2 — 25 posts · 19 suspects · 19 fixed · 13 posts left untranslated (EN prose w/ Persian commas); flag/compression/demand left Latin; same-boat calque; پرچم→فلگ
- [x] in2forex-p3 — 23 posts · 18 suspects · 19 fixed · 13 untranslated posts; compression/flag/thread left Latin; Supply/Demand title; پرچم none
- [x] in2forex-p4 — 25 posts · 18 suspects · 19 fixed · 10 untranslated posts; پرچم→فلگ; Diamond→الماس; broken→broker; fake out→فیک‌اوت; quote synced to p3_74/p4_89
- [x] in2forex-p5 — 25 posts · 7 suspects · 2 fixed · ENG acronym left in prose; homework-section wording
- [x] in2forex-p6 — 25 posts · 14 suspects · 16 fixed · 8 untranslated posts; 3D Homework titles→تمرین 3D; homework→تمرین; quote synced to p6_146
- [x] in2forex-p7 — 24 posts · 13 suspects · 14 fixed · 9 untranslated posts; homework→تمرین; approach→رویکرد; SR Flip forming; interjection drift
- [x] in2forex-p8 — 25 posts · 5 suspects · 2 fixed · emoticon spacing; open-trades-on-my-mind calque; فشرده→کامپرشن
- [x] in2forex-p9 — 25 posts · 6 suspects · 10 fixed · KGB quote resynced to p8_200; pole→دکل; Supply→عرضه; ترد→تاپیک; sell limit/filled; struggling calque
- [x] in2forex-p10 — 25 posts · 4 suspects · 1 fixed · ledger-rebuilt
- [x] in2forex-p11 — 13 posts · 3 suspects · 1 fixed · ledger-rebuilt

## vitaldrug — Sweet drugs and bitter drugs

10 صفحه / 245 پست — بازبینی 10 · سابقه 10 · suspects 43

پرحاشیه‌ترین صفحه‌ها: vitaldrug-p1 (11) · vitaldrug-p6 (7) · vitaldrug-p8 (6) · vitaldrug-p4 (4) · vitaldrug-p5 (4) · vitaldrug-p3 (3) · vitaldrug-p7 (3) · vitaldrug-p9 (2)

- [x] vitaldrug-p1 — 24 posts · 11 suspects · pass-1 verdict · 1 fix pass-1 · 7 fixed · p1: فشرده‌سازی->فشردگی x5 posts, p1_1 phrasing, keep-up-the-spirit idiom
- [x] vitaldrug-p2 — 25 posts · 1 suspects · pass-1 verdict · 6 fixed · p2: فشرده‌سازی->فشردگی x3, شوت calque, target-reach phrasing, busy-job phrasing
- [x] vitaldrug-p3 — 25 posts · 3 suspects · pass-1 verdict · 6 fixed · p3: Deenius quotes: پرچم->فلگ, میله->دکل, تاچ‌ترید, فیک‌اوت, فشرده‌سازی, شوت; p3_6/7/9/10/12
- [x] vitaldrug-p4 — 24 posts · 4 suspects · pass-1 verdict · 4 fixed · p4: HTF/LTF labels->Latin, Come-on-man, URL ellipsis x2
- [x] vitaldrug-p5 — 25 posts · 4 suspects · pass-1 verdict · 2 fixed · p5: Flag-limit prose->فلگ‌لیمیت, kink->زانو, tricky->دردسر
- [x] vitaldrug-p6 — 24 posts · 7 suspects · pass-1 verdict · 1 fix pass-1 · 5 fixed · p6: فرمیشن->ساختار, نظرات را ارزش می‌گذارم calque, Approach FL English->FL رویکرد, LLs awkward, leave-it clarify
- [x] vitaldrug-p7 — 25 posts · 3 suspects · pass-1 verdict · 1 fix pass-1 · 6 fixed · p7: flag->فلگ x3 posts (quote-synced), سل->فروش, سل لیمیت->لیمیت فروش, URL ellipsis, bouncer->جهنده
- [x] vitaldrug-p8 — 25 posts · 6 suspects · pass-1 verdict · 1 fix pass-1 · 7 fixed · p8: quote-drift p8_1/p8_3 synced to canonical, flag->فلگ, سکسی->خفن, stop-hunt glossary, URL ellipsis, گپ unify
- [x] vitaldrug-p9 — 25 posts · 2 suspects · pass-1 verdict · 2 fix pass-1 · 10 fixed · p9: quote-sync p9_2/p9_18, ورودی calque, chief cook, dropped پیپ/#, flag->فلگ
- [x] vitaldrug-p10 — 23 posts · 2 suspects · pass-1 verdict · 1 fix pass-1 · 8 fixed · p10: nested quote-sync p10_6/p10_7, dropped #213, دامنه->رنج, دویدن calque, lTF->LTF, register, Err

## readingsession — Reading a Session

10 صفحه / 240 پست — بازبینی 10 · سابقه 2 · suspects 103

پرحاشیه‌ترین صفحه‌ها: readingsession-p1 (22) · readingsession-p2 (21) · readingsession-p4 (17) · readingsession-p3 (15) · readingsession-p7 (10) · readingsession-p5 (8) · readingsession-p8 (4) · readingsession-p9 (4)

- [x] readingsession-p1 — 25 posts · 22 suspects · 57 fixed · re-mark: ledger clobber
- [x] readingsession-p2 — 24 posts · 21 suspects · 57 fixed · re-mark: ledger clobber
- [x] readingsession-p3 — 25 posts · 15 suspects · 57 fixed · re-mark: ledger clobber
- [x] readingsession-p4 — 25 posts · 17 suspects · 17 fixed · 17 posts redrafted: پرچم->فلگ banned form fixed, EN leftovers, quote chains synced
- [x] readingsession-p5 — 22 posts · 8 suspects · 14 fixed · 14 posts redrafted: leftovers, touch trade->تاچ سطح, calques (clockwork, thing of beauty, naughty)
- [x] readingsession-p6 — 23 posts · 9 fixed · 9 posts redrafted: leftovers, register fixes, session kept Latin
- [x] readingsession-p7 — 25 posts · 10 suspects · 12 fixed · 12 posts redrafted: long rambling post retranslated, truncated p7_192 list restored, garbled Eurotrash posts, flip concept
- [x] readingsession-p8 — 25 posts · 4 suspects · pass-1 verdict · 11 fix pass-1 · 13 fixed · 13 posts redrafted: پرچم->فلگ, فشرده‌سازی->فشردگی, FL annotation fix, quote chains synced
- [x] readingsession-p9 — 25 posts · 4 suspects · pass-1 verdict · 5 fix pass-1 · 11 fixed · 11 posts redrafted: فشرده‌سازی->فشردگی, های->سقف‌ها, هوم‌ورک->تکلیف
- [x] readingsession-p10 — 21 posts · 2 suspects · 2 fixed · 2 posts polished: 255 visit wording, 266 FO phrasing; page otherwise clean

## warren — Warren

11 صفحه / 238 پست — بازبینی 11 · سابقه 1 · suspects 85

پرحاشیه‌ترین صفحه‌ها: warren-p8 (18) · warren-p10 (16) · warren-p6 (14) · warren-p9 (10) · warren-p1 (6) · warren-p4 (6) · warren-p3 (5) · warren-p2 (4)

- [x] warren-p1 — 21 posts · 6 suspects · 12 fixed · QMC/کانفلوئن‌ce garble, guy leftovers, تردبازارها, 0.05p mistranslation, بینای‌بین eye-opener, handle Pro Trader, deal-with-when-around, sync p1_21 quote
- [x] warren-p2 — 22 posts · 4 suspects · 10 fixed · mince calque, killer->پاداش direction flip, plug leftover, URL ellipsis corrupt, وارن handle Latin, court/chart pun, quote synced to p1_9 canonical
- [x] warren-p3 — 24 posts · 5 suspects · 6 fixed · Korean 늦에 leftover, poles->پایه پول garble->دکل, brain/mindset Latin, ego garble, coast-to-coast sync, wrote-heads Latin
- [x] warren-p4 — 24 posts · 6 suspects · 13 fixed · Warren wrote-heads Latin, mindset/volume/sublime/fantastic leftovers, ساحت Sir->جناب, demote garble, bounce!=pullback, ی_ingalph banned
- [x] warren-p5 — 23 posts · 4 suspects · 6 fixed · Pro Trader handle, Daft trader handle, لول slang, touch-trade لمسی->تاچ سطح, p5_111 quote resynced to p4_95 canonical
- [x] warren-p6 — 25 posts · 14 suspects · 9 fixed · shout-out caps/consistency (kept از due no-persian gate), p6_143 quote synced, p6_144 para order, pump->هیجان, سوییچ->سواری
- [x] warren-p7 — 25 posts · 2 suspects · 3 fixed · پرپاقدام calque, الآن->الان, دریای کارائیب->کارائیب
- [x] warren-p8 — 24 posts · 18 suspects · 16 fixed · nugget drift sync, noodle/sidelobe/doggy/vibe/wingman/nag/num leftovers, quote head Latin, awesome no-persian, flat/خفتم
- [x] warren-p9 — 23 posts · 10 suspects · 9 fixed · voice over/Mindset/pump leftovers, yooo/cheer, cracker idiom, sleepy-time+buy-limit synced 216/219, fluff/SHOUT me up, دراور->دراودان
- [x] warren-p10 — 24 posts · 16 suspects · 14 fixed · اینگاف/انگلف banned x3, badge->نشان, homework/mantra/trade explorer/crank/bright spark/urge/rinse-repeat/flat leftovers, not-broke direction flip, quote 226/227 sync, wrote-head Latin
- [x] warren-p11 — 3 posts · pass-1 verdict · clean, 3 posts

## rinehart — Rinehart's Journal

13 صفحه / 230 پست — بازبینی 13 · سابقه 13 · suspects 31

پرحاشیه‌ترین صفحه‌ها: rinehart-p10 (5) · rinehart-p11 (5) · rinehart-p12 (5) · rinehart-p2 (3) · rinehart-p3 (3) · rinehart-p4 (3) · rinehart-p6 (2) · rinehart-p1 (1)

- [x] rinehart-p1 — 11 posts · 1 suspects · pass-1 verdict · 1 fix pass-1 · 3 fixed · calque free ride, خوش‌آمد grammar, awkward profit phrasing
- [x] rinehart-p2 — 23 posts · 3 suspects · pass-1 verdict · 5 fixed · خوش‌آمد grammar, desync سیگنال/راه in quote, startum typo
- [x] rinehart-p3 — 16 posts · 3 suspects · pass-1 verdict · 1 fix pass-1 · 4 fixed · quote desync Mukhcin text, garbled USDCAD sentence, we-enter calque
- [x] rinehart-p4 — 20 posts · 3 suspects · pass-1 verdict · 1 fix pass-1 · 3 fixed · quote desync, خط‌ها orthography, broken URL ellipsis
- [x] rinehart-p5 — 15 posts · 1 suspects · pass-1 verdict · 1 fix pass-1 · 7 fixed · juicy calque synced x3, IT acronym lost, touch-trade glossary, GOLD fill
- [x] rinehart-p6 — 22 posts · 2 suspects · pass-1 verdict · 1 fix pass-1 · 5 fixed · فشرده‌سازی banned, ENG/Eng Latin in prose, touch trade, wick->سایه sync
- [x] rinehart-p7 — 18 posts · 1 suspects · pass-1 verdict · 2 fix pass-1 · 6 fixed · پرچم->فلگ, broken URL ellipsis x2, quote desyncs, strautum typo
- [x] rinehart-p8 — 18 posts · 1 suspects · pass-1 verdict · 5 fix pass-1 · 4 fixed · calques, quote drift, URL ellipsis, rep count
- [x] rinehart-p9 — 19 posts · 1 suspects · pass-1 verdict · 3 fixed · broken URLs, ENG acronym, minor calques
- [x] rinehart-p10 — 23 posts · 5 suspects · pass-1 verdict · 9 fixed · ENG acronym, quote byte-identity, touch calque
- [x] rinehart-p11 — 21 posts · 5 suspects · pass-1 verdict · 5 fix pass-1 · 9 fixed · لمسی->تاچ, ENG->اینگالف, wedge consistency, quote sync
- [x] rinehart-p12 — 17 posts · 5 suspects · pass-1 verdict · 1 fix pass-1 · 3 fixed · quote byte-identity, confluence consistency
- [x] rinehart-p13 — 7 posts · pass-1 verdict · 2 fixed · nested quote drift, retrace term

## robbie — Robbie's Journal _ Observations

10 صفحه / 228 پست — بازبینی 10 · سابقه 0 · suspects 134

پرحاشیه‌ترین صفحه‌ها: robbie-p8 (24) · robbie-p9 (22) · robbie-p2 (20) · robbie-p1 (18) · robbie-p3 (18) · robbie-p5 (7) · robbie-p6 (7) · robbie-p7 (7)

- [x] robbie-p1 — 24 posts · 18 suspects · 24 fixed · pass1: systemic raw-English/calque contamination + glossary (پرچم->فلگ); 23 posts replaced
- [x] robbie-p2 — 24 posts · 20 suspects · 24 fixed · pass1: untranslated English, quote drift, idiom issues; 24 posts replaced
- [x] robbie-p3 — 25 posts · 18 suspects · 25 fixed · pass1: dup-hash posts synced; Diamond->الماس, origin->مبدأ fixes
- [x] robbie-p4 — 21 posts · 4 suspects · 12 fixed · pass1: number-123 guard caught then fixed; quote head restored; 12 posts replaced
- [x] robbie-p5 — 21 posts · 7 suspects · 8 fixed · pass1: banned terms in PAZ quote (فشرده‌سازی/پرچم/POLE), Market Wizards title, aha->Eureka, flag limit
- [x] robbie-p6 — 21 posts · 7 suspects · 8 fixed · pass1: pole->دکل, Associate rank term, quote sync x2 (p2_49, p6_136), herd calque, recursive joke
- [x] robbie-p7 — 21 posts · 7 suspects · 6 fixed · pass1: EG->اینگالف x8, fakeout term, his/her joke restored, signature Latin, quote sync
- [x] robbie-p8 — 25 posts · 24 suspects · 25 fixed · pass1: systemic raw-English defect; retranslated all 25 posts; quote sync p7_173/p8_178/184/192; pole->دکل
- [x] robbie-p9 — 23 posts · 22 suspects · 23 fixed · pass1: systemic raw-English defect on all 23 posts; quote sync p8_200/p9_223
- [x] robbie-p10 — 23 posts · 7 suspects · 9 fixed · pass1: quote sync to p9_223/p9_225 + minor calques; pole->دکل; rest clean

## diamond — The Diamond

10 صفحه / 227 پست — بازبینی 10 · سابقه 2 · suspects 130

پرحاشیه‌ترین صفحه‌ها: diamond-p1 (21) · diamond-p7 (16) · diamond-p2 (15) · diamond-p3 (15) · diamond-p4 (15) · diamond-p5 (15) · diamond-p9 (15) · diamond-p8 (13)

- [x] diamond-p1 — 25 posts · 21 suspects · 50 fixed · re-mark: ledger clobber
- [x] diamond-p2 — 23 posts · 15 suspects · 50 fixed · re-mark: ledger clobber
- [x] diamond-p3 — 25 posts · 15 suspects · pass-1 verdict · 2 fix pass-1 · 50 fixed · re-mark: ledger clobber
- [x] diamond-p4 — 24 posts · 15 suspects · 18 fixed · raw-EN x5 retranslated incl long in2forex IT-vs-retail posts; پرچم->فلگ, engulf->اینگالف, fakeout->فیک‌اوت, pole->دکل, quote chains synced p76->p82, p77->p79/82, p97->p98, p98->p99/100
- [x] diamond-p5 — 25 posts · 15 suspects · 16 fixed · raw-EN x13 retranslated; quote chain synced; ENG->اینگالف sweep x2 posts; echo reject resolved
- [x] diamond-p6 — 23 posts · 4 suspects · 8 fixed · الآن->حالا x3, trade-failed ambiguity, spanked->می‌زنه, Kovalenko quote drift synced to p5.123, numbers-line simplified
- [x] diamond-p7 — 23 posts · 16 suspects · 14 fixed · raw-EN x14 retranslated; retest->ری‌تست, set up->ستاپ, stop losses->استاپ‌لاس, Pink Floyd title kept Latin
- [x] diamond-p8 — 24 posts · 13 suspects · 17 fixed · raw-EN x15 retranslated incl salivan long posts; ENGULF->اینگالف, retest, URL ellipsis x2, quote p186->p200 synced
- [x] diamond-p9 — 25 posts · 15 suspects · 15 fixed · Diamond->الماس throughout; FL->فلگ/فلگ لیمیت; compression kept فشردگی; quotes p201->p211, p206->p207, p220->p222 synced
- [x] diamond-p10 — 10 posts · 1 suspects · pass-1 verdict · 4 fixed · Diamond->الماس, flag limit->فلگ لیمیت, to the pip->تا سرحد پیپ, HW homework phrasing

## 3drive — About the 3Drive

10 صفحه / 223 پست — بازبینی 10 · سابقه 1 · suspects 119

پرحاشیه‌ترین صفحه‌ها: 3drive-p4 (19) · 3drive-p1 (17) · 3drive-p2 (14) · 3drive-p3 (13) · 3drive-p9 (12) · 3drive-p5 (11) · 3drive-p7 (11) · 3drive-p8 (11)

- [x] 3drive-p1 — 25 posts · 17 suspects · 15 fixed · systemic raw-English/mixed-Latin posts retranslated x15; homework->تکلیف, flag->فلگ, pole->دکل, quote synced to canonical
- [x] 3drive-p2 — 23 posts · 14 suspects · 9 fixed · quote drift synced to p1 canonical x2, compression->فشردگی in 4-post quote chain, amazing calque, trigger, gift->گیفت
- [x] 3drive-p3 — 24 posts · 13 suspects · 6 fixed · quote sync p2_49 canonical, help->held source typo, punched through TP1, blood type A, had-to-post phrasing
- [x] 3drive-p4 — 25 posts · 19 suspects · 14 fixed · Latin leftovers swept (base/swing/supply/demand/hook/homework), untranslated quote in p4_84, calques
- [x] 3drive-p5 — 25 posts · 11 suspects · 6 fixed · compression->فشردگی, playing-around calque synced quote, bear flags->فلگ‌های نزولی, minor phrasing
- [x] 3drive-p6 — 24 posts · 8 suspects · 7 fixed · Diamond->الماس x2, comments-welcome calque, would-have-been, missing-something idiom, edge slang
- [x] 3drive-p7 — 25 posts · 11 suspects · 17 fixed · p7_174 missing URL+truncated quote, p7_175 truncated post, p7_156 missing kaboom clause, Latin sweep homework/supply/compression, calques
- [x] 3drive-p8 — 23 posts · 11 suspects · 11 fixed · فشرده‌سازی->فشردگی x3, origin->مبدأ, touch trade->تاچ سطح, quote sync p7_175 canonical, calques
- [x] 3drive-p9 — 24 posts · 12 suspects · 5 fixed · فشرده‌سازی->فشردگی x2, comments-welcome, dive-in calque, inception pun kept
- [x] 3drive-p10 — 5 posts · 3 suspects · pass-1 verdict · 1 fixed · stack zones->ناحیه‌های پشته‌ای consistency

## michal238 — Michal's Journal

11 صفحه / 219 پست — بازبینی 11 · سابقه 11 · suspects 32

پرحاشیه‌ترین صفحه‌ها: michal238-p10 (6) · michal238-p5 (5) · michal238-p8 (4) · michal238-p2 (3) · michal238-p4 (3) · michal238-p9 (3) · michal238-p11 (3) · michal238-p7 (2)

- [x] michal238-p1 — 23 posts · 1 suspects · pass-1 verdict · 1 fix pass-1 · 3 fixed · p1_1 awkward appreciate calque; p1_12 embrace-the-concept calque; p1_23 riding down calque
- [x] michal238-p2 — 23 posts · 3 suspects · pass-1 verdict · 1 fix pass-1 · 1 fixed · p2_3 FA typo فکر کنم + garbled engulf/CP-on-approach sentence
- [x] michal238-p3 — 12 posts · 1 suspects · pass-1 verdict · 2 fix pass-1 · 2 fixed · p3_1+p3_7 touch trade rendered as معامله لمسی; fixed to ورود با تاچ سطح
- [x] michal238-p4 — 12 posts · 3 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] michal238-p5 — 23 posts · 5 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] michal238-p6 — 22 posts · 1 suspects · pass-1 verdict · 1 fix pass-1 · 1 fixed · ledger-rebuilt
- [x] michal238-p7 — 21 posts · 2 suspects · pass-1 verdict · 2 fix pass-1 · 1 fixed · ledger-rebuilt
- [x] michal238-p8 — 23 posts · 4 suspects · pass-1 verdict · 3 fix pass-1 · 1 fixed · ledger-rebuilt
- [x] michal238-p9 — 22 posts · 3 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] michal238-p10 — 25 posts · 6 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] michal238-p11 — 13 posts · 3 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt

## linos — Thought Delta

9 صفحه / 215 پست — بازبینی 9 · سابقه 9 · suspects 21

پرحاشیه‌ترین صفحه‌ها: linos-p9 (4) · linos-p1 (3) · linos-p4 (3) · linos-p5 (3) · linos-p2 (2) · linos-p6 (2) · linos-p8 (2) · linos-p3 (1)

- [x] linos-p1 — 24 posts · 3 suspects · pass-1 verdict · clean: glossary/quotes/numbers ok
- [x] linos-p2 — 25 posts · 2 suspects · pass-1 verdict · 2 fixed · approach-PA calque, Haa->ها
- [x] linos-p3 — 24 posts · 1 suspects · pass-1 verdict · 12 fixed · stop hunt->شکار استاپ drift x7 w/ quote sync; hindsight-bias, qualifies-PA calque, ؟. artifact
- [x] linos-p4 — 25 posts · 3 suspects · pass-1 verdict · 4 fixed · عند->روی calque; منهای->به‌جز (quote synced); لول/ترد
- [x] linos-p5 — 25 posts · 3 suspects · pass-1 verdict · 10 fixed · EG->اینگالف x2; forget direction flip (dup hash); لول->LOL; blasted; retailer sync; p5_24 canonical sync
- [x] linos-p6 — 25 posts · 2 suspects · pass-1 verdict · 1 fix pass-1 · 9 fixed · quote drift p6_5/p6_6/p6_2 synced to canonical; ENG->اینگالف; SL-hit فعال شد->خورد; لول->LOL; Ekim->Enkim
- [x] linos-p7 — 25 posts · 1 suspects · pass-1 verdict · 3 fix pass-1 · 5 fixed · quote sync p7_16 (ZWNJ+partial quote), پای idiom, ببخش->معذرت, میس/miss phrasing
- [x] linos-p8 — 25 posts · 2 suspects · pass-1 verdict · 10 fixed · LOL x2, $440, ITs in ponzi line, گمنام, entry-direction, دزدیدم->قاپیدم (p8_15), سال '11; fixed id slip p8_14/p8_15
- [x] linos-p9 — 17 posts · 4 suspects · pass-1 verdict · 4 fixed · flag->فلگ x2, حقوق->سود, Reserved->Reserve Bank of India (p9_5), نقدشوندگی phrasing; fixed id slip

## luska — Luska

9 صفحه / 206 پست — بازبینی 9 · سابقه 1 · suspects 146

پرحاشیه‌ترین صفحه‌ها: luska-p1 (22) · luska-p2 (20) · luska-p5 (20) · luska-p7 (19) · luska-p3 (17) · luska-p6 (16) · luska-p8 (15) · luska-p4 (14)

- [x] luska-p1 — 25 posts · 22 suspects · 20 fixed · raw-EN x7 retranslated; engulf->اینگالف, supply/base/retest/price-action cleanup, quote sync
- [x] luska-p2 — 25 posts · 20 suspects · 18 fixed · raw-EN x8 retranslated; supply/Scalp/Swing/buy-limit cleanup; comeback, fibo->فیبو
- [x] luska-p3 — 25 posts · 17 suspects · 17 fixed · raw-EN x4 retranslated; SL->استاپ‌لاس, touch-trade, sh*t->کثیف
- [x] luska-p4 — 25 posts · 14 suspects · 14 fixed · raw-EN x3 retranslated; SL->استاپ‌لاس, Engulfing->اینگالف, scalp/progress/shot cleanup, quote sync p4_97
- [x] luska-p5 — 25 posts · 20 suspects · 16 fixed · raw-EN x5 retranslated; wrong-pair p5_118 fixed; SL/Engulf/supply cleanup; quote sync
- [x] luska-p6 — 25 posts · 16 suspects · 15 fixed · raw-EN x6 retranslated; SL/sell-limit/demand Latin cleanup; Trump name, +30 pips
- [x] luska-p7 — 25 posts · 19 suspects · 20 fixed · heavy Latin cleanup; swap-level/stop-hunt/engulfing terms; quote chain p153-155-164 synced
- [x] luska-p8 — 25 posts · 15 suspects · 19 fixed · raw-EN x8 retranslated; SL/TP/scale-out spec lines, bear flag, spot gold
- [x] luska-p9 — 6 posts · 3 suspects · pass-1 verdict · 3 fix pass-1 · 1 fixed · quote drift p9_201 synced to p8_200 canonical

## paz — Price Action Zones – The last piece of the puzzle

9 صفحه / 200 پست — بازبینی 9 · سابقه 0 · suspects 100

پرحاشیه‌ترین صفحه‌ها: paz-p3 (22) · paz-p2 (18) · paz-p4 (16) · paz-p7 (16) · paz-p5 (14) · paz-p8 (10) · paz-p1 (3) · paz-p6 (1)

- [x] paz-p1 — 25 posts · 3 suspects · 20 fixed · re-mark: ledger clobber
- [x] paz-p2 — 25 posts · 18 suspects · 20 fixed · re-mark: ledger clobber
- [x] paz-p3 — 25 posts · 22 suspects · 22 fixed · raw-English x10 retranslated; engulf->اینگالف; quote resync chain p3_52/60/61/63/65/68/75; paragraph split p3_66
- [x] paz-p4 — 25 posts · 16 suspects · 16 fixed · raw-English x10 retranslated; p3_73 quote resync; Boby/Fxyogi quote chain synced; warms-my-heart idiom
- [x] paz-p5 — 25 posts · 14 suspects · 18 fixed · raw-English x11 retranslated; pole->دکل, پرچم->فلگ, flag limit->فلگ لیمیت; quote resync p5_101/107/110/114/117; link lines Latin
- [x] paz-p6 — 25 posts · 1 suspects · 7 fixed · ENG->اینگالف, daemons->شیطان‌های درونی, CP-phrase, slide calque, link lines Latin
- [x] paz-p7 — 25 posts · 16 suspects · 15 fixed · raw-English x11 retranslated; pole PAZ->PAZ دکل; surprise->بی‌خبر; obvious->بدیهی; Supply&Demand Latin
- [x] paz-p8 — 24 posts · 10 suspects · 8 fixed · EG/RT/ENG/engulf->اینگالف, pole->دکل, Persian digits->Latin, link lines Latin
- [x] paz-p9 — 1 posts · 1 fixed · link lines Latin for consistency, اینگالغی phrasing

## pucci — Pucci's Journal

8 صفحه / 194 پست — بازبینی 8 · سابقه 0 · suspects 111

پرحاشیه‌ترین صفحه‌ها: pucci-p5 (22) · pucci-p1 (21) · pucci-p3 (20) · pucci-p6 (19) · pucci-p4 (14) · pucci-p2 (13) · pucci-p8 (2)

- [x] pucci-p1 — 25 posts · 21 suspects · 18 fixed · 18 raw-EN/partially-translated posts retranslated (long technical analyses, condolences, returns); numbers and quote heads preserved
- [x] pucci-p2 — 25 posts · 13 suspects · 9 fixed · Persian digits->Latin in 9 long-analysis posts; emoticon spacing, visual-incompetence calque, کم‌عقلی->نابینا, FTA->FTR source typo
- [x] pucci-p3 — 25 posts · 20 suspects · 19 fixed · 19 raw-EN posts retranslated (Area 6/7/8 analyses + condolences + returns); quote blocks synced to canonical p3_58/p3_59; corrupted URL ellipsis fixed; classroom leftover
- [x] pucci-p4 — 25 posts · 14 suspects · 15 fixed · 15 raw-EN/mixed posts retranslated; truncated 'can't thank you enough' restored; flag/origine/mash-up leftovers; quote p4_93 kept synced
- [x] pucci-p5 — 25 posts · 22 suspects · 21 fixed · 21 raw-EN/mixed posts retranslated; p5_102 quote synced into p5_107/p5_111, p5_113 quote synced into p5_114/p5_117 (boasts/subliminal leftovers fixed canonically), antraxia para synced p5_107->p5_109
- [x] pucci-p6 — 25 posts · 19 suspects · 19 fixed · 19 raw-EN/mixed posts retranslated; p6_128 quote synced into p6_142 (cleaned statement/dissect leftovers), p6_135 quote synced p6_136, p6_144 canonical synced p6_145/p6_150
- [x] pucci-p7 — 25 posts · 2 fixed · p7_151 my inputss mistranslation; p7_152 Persian digits->Latin (3.27%, trade numbers)
- [x] pucci-p8 — 19 posts · 2 suspects · 3 fixed · p8_177 garbled Some up; p8_183 tp->TP; p8_191 rephrase->بیان دیگر

## scotty — Scotty's Journey!

8 صفحه / 193 پست — بازبینی 8 · سابقه 0 · suspects 88

پرحاشیه‌ترین صفحه‌ها: scotty-p6 (20) · scotty-p1 (19) · scotty-p2 (18) · scotty-p7 (16) · scotty-p3 (5) · scotty-p8 (5) · scotty-p5 (4) · scotty-p4 (1)

- [x] scotty-p1 — 25 posts · 19 suspects · 22 fixed · late catch: p1_19 raw-EN-with-commas QM post retranslated (total 22)
- [x] scotty-p2 — 25 posts · 18 suspects · 1 fixed · ledger-rebuilt
- [x] scotty-p3 — 24 posts · 5 suspects · 1 fixed · ledger-rebuilt
- [x] scotty-p4 — 25 posts · 1 suspects · 5 fixed · flag limits->لیمیت‌های فلگ x2, bad-ass direction fix, would-have-traded counterfactual, hiding-shorts phrasing, screen-time
- [x] scotty-p5 — 25 posts · 4 suspects · 13 fixed · pole->دکل, flag limits->لیمیت‌های فلگ x2, hindsight calque, Asian-open phrasing + quote sync p5_108, kick-ass/dumb-ass intensity, unclosed quote mirror
- [x] scotty-p6 — 25 posts · 20 suspects · 22 fixed · systemic raw-EN-with-commas x15 posts retranslated; NO trade/NO MORE leftover EN fixed; Retrace->ریتریس; quote synced p6_130
- [x] scotty-p7 — 25 posts · 16 suspects · 16 fixed · systemic raw-EN x9 posts incl long inventories post; p7_170 quote synced to p7_168 canonical; indicator/marker/دemand leftovers; swap->سواپ
- [x] scotty-p8 — 19 posts · 5 suspects · 4 fixed · پرچم->فلگ x2, URL ellipsis corruption journa… urney fixed byte-identical, read-crude phrasing

## benhur — Benhur Journal

9 صفحه / 192 پست — بازبینی 9 · سابقه 9 · suspects 39

پرحاشیه‌ترین صفحه‌ها: benhur-p6 (7) · benhur-p7 (7) · benhur-p3 (6) · benhur-p8 (6) · benhur-p1 (4) · benhur-p5 (4) · benhur-p2 (3) · benhur-p4 (2)

- [x] benhur-p1 — 22 posts · 4 suspects · pass-1 verdict · 1 fix pass-1 · 5 fixed · rust-cleaning calque, event-spike->سوزن mistranslation, master-defining grammar, little-by-little calque x2 identical posts, spam calque
- [x] benhur-p2 — 18 posts · 3 suspects · pass-1 verdict · 4 fixed · FTR/FTB calques->شکست در بازگشت/شکست‌نشده, spam calque, touch-scalp->اسکالپ تاچ + humble-brag, PIPS caps emphasis
- [x] benhur-p3 — 23 posts · 6 suspects · pass-1 verdict · 9 fixed · rocking calque, دراودان->افت, touch-trade->با تاچ سطح x2, free-to-go calque, garbled below-is-daily sentence, ENG->اینگالف, IT-seeking ambiguity->بازار
- [x] benhur-p4 — 25 posts · 2 suspects · pass-1 verdict · 1 fix pass-1 · 3 fixed · release-manual garble, pole->دکل (base of Pole), late-to-the-party calque
- [x] benhur-p5 — 25 posts · 4 suspects · pass-1 verdict · 6 fixed · Quasimodo->کیوام x2, ریسکت typo->ریسک, دراودان->افت, flag->فلگ ادامه‌دهنده, Cheers->درود x2, conviction/experience phrasing
- [x] benhur-p6 — 25 posts · 7 suspects · pass-1 verdict · 8 fixed · URL ellipsis corrupted x2 (journa…->journa...), Flag Limit->فلگ لیمیت, سوآپ->سواپ x4 synced quote chain, اینگالفی->اینگالف, taken-out->شکست
- [x] benhur-p7 — 25 posts · 7 suspects · pass-1 verdict · 1 fix pass-1 · 9 fixed · flag limit->فلگ لیمیت, پرچم->فلگ, quote drift x3 synced to canonical (p7_3,p7_9,p7_19,p7_10/p7_11 video para), تماشا->دیدن, Pole->دکل x2, Cheers->درود, shrug idiom
- [x] benhur-p8 — 25 posts · 6 suspects · pass-1 verdict · 2 fix pass-1 · 10 fixed · URL ellipsis x3, attachment labels->Latin, quote drift p8_4/p8_7->canonical p4_3, پرچم->فلگ x2+ناحیهٔ پرچم, میله->دکل pole, FL لیمیت->فلگ لیمیت x2, polluting->شلوغ, تماشا->دیدن, bump, زودرهاشده
- [x] benhur-p9 — 4 posts · pass-1 verdict · 1 fixed · quote drift on p8_25 Eureka post synced to canonical

## mukhcin — Mastering price reading

9 صفحه / 191 پست — بازبینی 9 · سابقه 9 · suspects 76

پرحاشیه‌ترین صفحه‌ها: mukhcin-p1 (15) · mukhcin-p3 (14) · mukhcin-p5 (11) · mukhcin-p4 (9) · mukhcin-p2 (8) · mukhcin-p6 (7) · mukhcin-p7 (6) · mukhcin-p8 (6)

- [x] mukhcin-p1 — 25 posts · 15 suspects · pass-1 verdict · 7 fixed · eng->اینگالف x2 posts, dropped good-work, garbled thank-you ending, IT grammar, ambiguous leave-order, true-one phrasing
- [x] mukhcin-p2 — 25 posts · 8 suspects · pass-1 verdict · 5 fixed · touch-trade calque لمسی->تاچ سطح, ITs->بازار wrong entity, broker-position meaning reversed, abBE->a BE, peak gloss
- [x] mukhcin-p3 — 25 posts · 14 suspects · pass-1 verdict · 3 fixed · Simply-Nice calque, eng->اینگالف + PCP garble, IT->ITها
- [x] mukhcin-p4 — 24 posts · 9 suspects · pass-1 verdict · 8 fixed · quote drift p4_1/p4_2 vs p3_20 canonical, ENG->اینگالف x3, staurum garble synced p4_22/p4_23, nuggets->نکته
- [x] mukhcin-p5 — 25 posts · 11 suspects · pass-1 verdict · 7 fixed · empty FA post filled, missed->از قلم انداختم, mpl-line garble, filled-with-broker calque
- [x] mukhcin-p6 — 19 posts · 7 suspects · pass-1 verdict · 1 fix pass-1 · 2 fixed · empty FA post filled, sad->غم‌انگیز wrong direction, paying attention
- [x] mukhcin-p7 — 23 posts · 6 suspects · pass-1 verdict · 3 fixed · اسپردت misspelling synced quote, pollute journal->شلوغ
- [x] mukhcin-p8 — 22 posts · 6 suspects · pass-1 verdict · 1 fix pass-1 · 5 fixed · truncated post completed, touch-trade variant, Granted->البته, IT nuts subject, slap-face/شرط fixes
- [x] mukhcin-p9 — 3 posts · pass-1 verdict · 1 fixed · Onward-and-upwards calque

## edges — Edges Journal 2.0

8 صفحه / 179 پست — بازبینی 8 · سابقه 8 · suspects 36

پرحاشیه‌ترین صفحه‌ها: edges-p3 (9) · edges-p7 (7) · edges-p1 (5) · edges-p2 (5) · edges-p5 (5) · edges-p6 (3) · edges-p4 (2)

- [x] edges-p1 — 25 posts · 5 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] edges-p2 — 25 posts · 5 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] edges-p3 — 23 posts · 9 suspects · pass-1 verdict · 11 fixed · p3: pole->دکل, kink->پیچش, TG رسیده, flag->فلگ + pass2 quote sync p3_4/p3_10/p3_11
- [x] edges-p4 — 24 posts · 2 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] edges-p5 — 24 posts · 5 suspects · pass-1 verdict · 9 fixed · p5: kink->پیچش convention normalized across 9 posts (was خمیدگی), quotes kept in sync
- [x] edges-p6 — 22 posts · 3 suspects · pass-1 verdict · 10 fixed · p6: touch trade, retrace->ریتریس, kink->پیچش sync + pass2 retracement->ریتریس
- [x] edges-p7 — 25 posts · 7 suspects · pass-1 verdict · 8 fixed · p7: تاچ‌ترید->تاچ سطح x2 + quote sync, FOed->فیک‌اوت, Flag->فلگ, above-board idiom + quote sync, خمیدگی->پیچش
- [x] edges-p8 — 11 posts · pass-1 verdict · 2 fixed · p8: touch trade->تاچ سطح, خرده‌معامله‌گران->معامله‌گران خرد

## constantine — Constantine

8 صفحه / 175 پست — بازبینی 8 · سابقه 2 · suspects 36

پرحاشیه‌ترین صفحه‌ها: constantine-p5 (10) · constantine-p1 (6) · constantine-p3 (5) · constantine-p8 (5) · constantine-p2 (3) · constantine-p6 (3) · constantine-p4 (2) · constantine-p7 (2)

- [x] constantine-p1 — 24 posts · 6 suspects · 27 fixed · re-mark: ledger clobber
- [x] constantine-p2 — 22 posts · 3 suspects · 27 fixed · re-mark: ledger clobber
- [x] constantine-p3 — 24 posts · 5 suspects · 9 fixed · پرچم->فلگ sweep (4 posts), ENG->اینگالف x2, corrupted URLs, pole->دکل, fakeout->فیک‌اوت, quote drift, 0 chaos
- [x] constantine-p4 — 21 posts · 2 suspects · pass-1 verdict · 3 fix pass-1 · 7 fixed · quote drift synced to p3_74, p91 paragraph realignment, پرچم->فلگ+quote sync, associates->تریدرهای اَسوشیت, Price Reading title
- [x] constantine-p5 — 25 posts · 10 suspects · 13 fixed · wrong-post FA on p119, پرچم->فلگ, DM->الماس, ENG->اینگالف, Markepedia case, quote syncs, dup word, ITs->IT‌ها
- [x] constantine-p6 — 21 posts · 3 suspects · 6 fixed · perچم->فلگ, retrace->ریتریس, PAZ target clause, quote sync p140/p143, hedge restore, vacation clause
- [x] constantine-p7 — 20 posts · 2 suspects · 3 fixed · FL-of-LSK phrasing, out-of-our-league idiom, Beatles title calque
- [x] constantine-p8 — 18 posts · 5 suspects · pass-1 verdict · 6 fix pass-1 · 27 fixed · re-mark: ledger clobber

## homeoffinisher — HomeOfFinisher

9 صفحه / 163 پست — بازبینی 9 · سابقه 1 · suspects 42

پرحاشیه‌ترین صفحه‌ها: homeoffinisher-p8 (15) · homeoffinisher-p7 (7) · homeoffinisher-p9 (7) · homeoffinisher-p4 (3) · homeoffinisher-p5 (3) · homeoffinisher-p6 (3) · homeoffinisher-p1 (2) · homeoffinisher-p2 (1)

- [x] homeoffinisher-p1 — 20 posts · 2 suspects · 1 fixed · ledger-rebuilt
- [x] homeoffinisher-p2 — 8 posts · 1 suspects · 1 fixed · ledger-rebuilt
- [x] homeoffinisher-p3 — 16 posts · 1 suspects · 1 fixed · ledger-rebuilt
- [x] homeoffinisher-p4 — 13 posts · 3 suspects · 1 fixed · ledger-rebuilt
- [x] homeoffinisher-p5 — 21 posts · 3 suspects · 1 fixed · ledger-rebuilt
- [x] homeoffinisher-p6 — 23 posts · 3 suspects · 2 fixed · نیت IT->ITs, PCP of MPL phrasing
- [x] homeoffinisher-p7 — 25 posts · 7 suspects · pass-1 verdict · 4 fix pass-1 · 4 fixed · پرچم->فلگ, moved-in-space phrasing, very-well-done calque, kink->پیچش consistency x2
- [x] homeoffinisher-p8 — 24 posts · 15 suspects · 6 fixed · flag/kink Latin leftovers, swing candle wording, no-no garble, AjantaPharma quote resynced to p7_174 canonical, Idea ticker transliterated
- [x] homeoffinisher-p9 — 13 posts · 7 suspects · 2 fixed · taken-out->برداشته شدند, ITs play->بازی ITs

## whenever — Whenever Journal

8 صفحه / 162 پست — بازبینی 8 · سابقه 1 · suspects 77

پرحاشیه‌ترین صفحه‌ها: whenever-p2 (18) · whenever-p4 (18) · whenever-p1 (16) · whenever-p7 (13) · whenever-p6 (6) · whenever-p5 (3) · whenever-p8 (2) · whenever-p3 (1)

- [x] whenever-p1 — 21 posts · 16 suspects · 21 fixed · all posts mixed EN/FA; full retranslate, quotes synced p1_10/11 and p1_14/16
- [x] whenever-p2 — 21 posts · 18 suspects · 21 fixed · all posts mixed EN/FA; full retranslate, Kovalenko quote synced
- [x] whenever-p3 — 17 posts · 1 suspects · 3 fixed · touch trade, flag->فلگ, minor phrasing
- [x] whenever-p4 — 23 posts · 18 suspects · 22 fixed · mixed EN/FA throughout; quote synced p4_82/83; dup post p4_92=94 synced
- [x] whenever-p5 — 24 posts · 3 suspects · pass-1 verdict · 1 fix pass-1 · 4 fixed · URL ellipsis fix, quote condensed-variant synced, mojo/mo-be-mo calques
- [x] whenever-p6 — 24 posts · 6 suspects · 8 fixed · mixed EN/FA in p6_135/136; big post p6_138 dedup+rewritten 66p; quote variants p6_143/148 resynced; terms swap level/اینگالف/ریجکشن
- [x] whenever-p7 — 25 posts · 13 suspects · 16 fixed · leftover Latin/garbled terms; quotes synced p7_155/158 and p7_160/161
- [x] whenever-p8 — 7 posts · 2 suspects · 3 fixed · p7_169 quote resynced to canonical; minor phrasing

## aran — Aran Jibril

8 صفحه / 161 پست — بازبینی 8 · سابقه 8 · suspects 28

پرحاشیه‌ترین صفحه‌ها: aran-p6 (6) · aran-p3 (5) · aran-p4 (5) · aran-p2 (4) · aran-p5 (4) · aran-p7 (4)

- [x] aran-p1 — 12 posts · pass-1 verdict · 5 fixed · attachment lines: restore source line break (پیوست فایل:نام فایل:/حجم فایل) in 5 posts
- [x] aran-p2 — 23 posts · 4 suspects · pass-1 verdict · 12 fixed · attachment line breaks x10, URL ellipsis jou… s->jou...s, Manouche quote word می‌شود->می‌توانی
- [x] aran-p3 — 25 posts · 5 suspects · pass-1 verdict · 8 fixed · attachment line breaks x6, master traders->تریدرهای استاد, goofy/got-me-high calque->شوخی/مست کرد (canonical for p4_3 quote)
- [x] aran-p4 — 25 posts · 5 suspects · pass-1 verdict · 1 fix pass-1 · 8 fixed · quote drift: UC/Enlightenme/PinkPanter blocks synced to p3 canonicals, attachment line breaks, really->واقعاً, inline attachment lines
- [x] aran-p5 — 25 posts · 4 suspects · pass-1 verdict · 4 fixed · attachment line breaks in 4 posts (incl. inside p5_8 quote)
- [x] aran-p6 — 24 posts · 6 suspects · pass-1 verdict · 1 fix pass-1 · 2 fixed · wear-your-hat idiom->کلاه به سر بگذارم; Flag Limits->فلگ‌لیمیت
- [x] aran-p7 — 21 posts · 4 suspects · pass-1 verdict · 2 fixed · killing-it calque می‌ترکونی->له‌اش می‌کنی; levels-get-hit garble fixed
- [x] aran-p8 — 6 posts · pass-1 verdict · 2 fixed · staurum quote drift synced to p7_25 canonical x2; his trade->معاملهٔ خودت

## mel — Trading & Life with Mel

7 صفحه / 158 پست — بازبینی 7 · سابقه 7 · suspects 79

پرحاشیه‌ترین صفحه‌ها: mel-p1 (17) · mel-p2 (14) · mel-p3 (13) · mel-p5 (11) · mel-p6 (11) · mel-p4 (10) · mel-p7 (3)

- [x] mel-p1 — 25 posts · 17 suspects · pass-1 verdict · 6 fixed · MOVE ON DOT COM calque; stop hunt->شکار استاپ; well-deserved->به‌جا; flag->فلگ x3 in plan; ASCII quotes->«»; Nice readings calque; کپچر->عکس بگیرم
- [x] mel-p2 — 25 posts · 14 suspects · pass-1 verdict · 3 fixed · update-you calque; in-play->روی میز calque; second ride literal
- [x] mel-p3 — 25 posts · 13 suspects · pass-1 verdict · 8 fixed · بلوپرچم banned->فلگ آبی x2 posts; glued digits 4ساعته/1ساعته/15دقیقه; دردسر->مشکل; استک‌شده->انباشته; cp'ed->فشرده; for-my-taste
- [x] mel-p4 — 25 posts · 10 suspects · pass-1 verdict · 5 fixed · پیپ‌های قطعی/برداشتی; shot->ورود; cp'ed->فشرده; فیکی->شبه‌فیک; glued digits
- [x] mel-p5 — 25 posts · 11 suspects · pass-1 verdict · 5 fixed · URL ellipsis corruption; فلت->بدون پوزیشن; فیکی->حرکت فیک; glued digits; closes-of-low clarity
- [x] mel-p6 — 25 posts · 11 suspects · pass-1 verdict · 4 fixed · Flag->FL acronym->فلگ; pole->میله‌ای->دکل; stop hunt->شکار استاپ; touch trade phrasing; 4ساعته
- [x] mel-p7 — 8 posts · 3 suspects · pass-1 verdict · 3 fixed · zoom out calque; Master Trader consistency; Markepedia typo->Marketpedia

## einrikr — Einrikr figuring out the market

6 صفحه / 126 پست — بازبینی 6 · سابقه 6 · suspects 16

پرحاشیه‌ترین صفحه‌ها: einrikr-p4 (9) · einrikr-p1 (2) · einrikr-p2 (2) · einrikr-p5 (2) · einrikr-p3 (1)

- [x] einrikr-p1 — 25 posts · 2 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] einrikr-p2 — 24 posts · 2 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] einrikr-p3 — 25 posts · 1 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] einrikr-p4 — 24 posts · 9 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] einrikr-p5 — 24 posts · 2 suspects · pass-1 verdict · 1 fixed · ledger-rebuilt
- [x] einrikr-p6 — 4 posts · pass-1 verdict · 1 fixed · ledger-rebuilt

## academylite1 — Academy Lite, Part 1. Quasimodo and the Diamond

6 صفحه / 125 پست — بازبینی 6 · سابقه 0 · suspects 21

پرحاشیه‌ترین صفحه‌ها: academylite1-p4 (13) · academylite1-p6 (4) · academylite1-p3 (3) · academylite1-p1 (1)

- [x] academylite1-p1 — 21 posts · 1 suspects · 3 fixed · retrace->ریتریس, sharpened calque x2 (dup post same hash), rambling length
- [x] academylite1-p2 — 21 posts · 4 fixed · پرچم->فلگ, ویرایشت typo, small doubt->ابهام, cluster->تجمع سفارش‌ها
- [x] academylite1-p3 — 23 posts · 3 suspects · 2 fixed · killer trader->درجه‌یک, north->بالا, FO verb->فیک‌اوت
- [x] academylite1-p4 — 24 posts · 13 suspects · 9 fixed · retrace->ریتریس, curve-fitting unify, english-left x2, URL ellipsis x2, پرچم->فلگ
- [x] academylite1-p5 — 21 posts · 6 fixed · retrace->ریتریس synced x4, It can take it calque, FO-verb->فیک‌اوت x2
- [x] academylite1-p6 — 15 posts · 4 suspects · 6 fixed · quote drift sync x3 (p5_104,p5_125,p6_133), hats off calque, retrace->ریتریس, footer consistency

## capnp — Cap'n P's - S/D Momo and Pointy Places

6 صفحه / 121 پست — بازبینی 6 · سابقه 0 · suspects 49

پرحاشیه‌ترین صفحه‌ها: capnp-p1 (17) · capnp-p4 (12) · capnp-p5 (11) · capnp-p3 (6) · capnp-p2 (3)

- [x] capnp-p1 — 25 posts · 17 suspects · 1 fixed · ledger-rebuilt
- [x] capnp-p2 — 25 posts · 3 suspects · 1 fixed · ledger-rebuilt
- [x] capnp-p3 — 25 posts · 6 suspects · 1 fixed · ledger-rebuilt
- [x] capnp-p4 — 23 posts · 12 suspects · 5 fixed · pass1: fat cat->گربهٔ چاق consistency, POINTY->نقطهٔ نوک‌تیز, Stop Profit->تارگت, bloody hell intensity
- [x] capnp-p5 — 19 posts · 11 suspects · 6 fixed · pass1: پوینتی->نقطهٔ نوک‌تیز consistency, حد سود->تارگت, Take Loss->استاپ‌لاس, abstract->مفاهیم اصلی x3 quote-synced
- [x] capnp-p6 — 4 posts · pass1: clean, 4 posts

## andrew — Andrew's JOURNEY

5 صفحه / 120 پست — بازبینی 5 · سابقه 4 · suspects 24

پرحاشیه‌ترین صفحه‌ها: andrew-p1 (7) · andrew-p4 (6) · andrew-p5 (5) · andrew-p2 (4) · andrew-p3 (2)

- [x] andrew-p1 — 25 posts · 7 suspects · pass-1 verdict · 2 fixed · URL ellipsis corruption x2 (nested quote sync), مارکت‌پدیا kept as thread convention, otherwise clean
- [x] andrew-p2 — 25 posts · 4 suspects · pass-1 verdict · 2 fixed · سرابی بیش نیستند->سراب‌اند calque, quote drift sync (shit->shift typo repaired to canonical)
- [x] andrew-p3 — 25 posts · 2 suspects · pass-1 verdict · 6 fixed · touch trade->ورود با تاچ سطح, catch stops->شکار استاپ, fakeout->فیک‌اوت, Price Reading title, minor calques
- [x] andrew-p4 — 24 posts · 6 suspects · pass-1 verdict · 1 fix pass-1 · 10 fixed · quote sync x4 (Ifmyante p3_24, Rinehart URL x2, Kavya p4_21, billmac3 FOF), URL ellipsis x2, FOF mangled 'Free سفارش Flow', HTF/LTF->تایم‌فریم, touch trade, minor
- [x] andrew-p5 — 21 posts · 5 suspects · 5 fixed · URL ellipsis x2+quote sync, HTF/LTF->تایم‌فریم x3, sell limit mistranslated as سلف لیمیت

## whynotwork — My _Why did it not work__ thread. Help is appreciated!

5 صفحه / 106 پست — بازبینی 5 · سابقه 0 · suspects 67

پرحاشیه‌ترین صفحه‌ها: whynotwork-p2 (18) · whynotwork-p3 (18) · whynotwork-p4 (18) · whynotwork-p1 (12) · whynotwork-p5 (1)

- [x] whynotwork-p1 — 25 posts · 12 suspects · 18 fixed · leftover EN x8 (eng,importance,bounce,swapped,concepts,engulf-related), پرچم->فلگ, quote chain sync x4, calques
- [x] whynotwork-p2 — 25 posts · 18 suspects · 18 fixed · leftover EN x14 (concepts,diagrams,significant,FLAGS,tips,decision,upside,pole,My thread), پرچم->فلگ, quote chain sync x5, calques
- [x] whynotwork-p3 — 25 posts · 18 suspects · 18 fixed · leftover EN x10 (formed,data,interpret,concept,bookmark,input,reaction,decely,investigation,suggestion,timescale,bounce), پرچم->فلگ x3, no-man's land->سرزمین هیچ‌کس, quote chain sync x5
- [x] whynotwork-p4 — 22 posts · 18 suspects · 20 fixed · leftover EN x8 (spot on,clean,mouth,ticker,time,lol,scale,drill down,plan,course,blood,predicted,true supply), پرچم->فلگ, quote chain sync x6, swap zone->ناحیه سواپ
- [x] whynotwork-p5 — 9 posts · 1 suspects · 5 fixed · quote sync x3 (fendt trick, blue box), URL ellipsis corruption, تایم‌فریم پایین‌تر, minor calques

## fxeyes — My Trading Journal

5 صفحه / 105 پست — بازبینی 5 · سابقه 5 · suspects 35

پرحاشیه‌ترین صفحه‌ها: fxeyes-p2 (12) · fxeyes-p1 (11) · fxeyes-p3 (6) · fxeyes-p5 (5) · fxeyes-p4 (1)

- [x] fxeyes-p1 — 25 posts · 11 suspects · pass-1 verdict · 29 fixed · re-mark: ledger clobber
- [x] fxeyes-p2 — 25 posts · 12 suspects · pass-1 verdict · 29 fixed · re-mark: ledger clobber
- [x] fxeyes-p3 — 24 posts · 6 suspects · pass-1 verdict · 29 fixed · re-mark: ledger clobber
- [x] fxeyes-p4 — 12 posts · 1 suspects · pass-1 verdict · 29 fixed · re-mark: ledger clobber
- [x] fxeyes-p5 — 19 posts · 5 suspects · pass-1 verdict · 1 fix pass-1 · 14 fixed · kink drift unified x6 posts, Mad Scalper name, boom->جهش already, itchy-fingers/overload calques, See-entry phrasing

## ftrpaz — FTR PAZ

4 صفحه / 98 پست — بازبینی 4 · سابقه 1 · suspects 40

پرحاشیه‌ترین صفحه‌ها: ftrpaz-p3 (15) · ftrpaz-p2 (11) · ftrpaz-p1 (9) · ftrpaz-p4 (5)

- [x] ftrpaz-p1 — 25 posts · 9 suspects · 12 fixed · پرچم->فلگ x7 posts contexts, touch-trade لمسی->تاچ سطح, 2-cents idiom
- [x] ftrpaz-p2 — 24 posts · 11 suspects · 10 fixed · handle Daft معامله‌گر->Daft trader 1 x2, quote drift synced p2_38/p2_50, noted/important Latin leftovers, calques (2-cents, sealed, kind soul, plugging)
- [x] ftrpaz-p3 — 25 posts · 15 suspects · 30 fixed · heavy English leftovers (believe/obvious/suppose/gusto/choppy/glitch/Christmas/holy grail/live/clue/off-topic/retace), Daft معامله‌گر handle x3, quote drift synced p64/p75, touch-trade, flag->فلگ, garbled clauses
- [x] ftrpaz-p4 — 24 posts · 5 suspects · pass-1 verdict · 1 fix pass-1 · 12 fixed · پرچم->فلگ x4, SR-flip term, nicking->می‌گیرم, homework->تمرین, 'At text 1'->نقطهٔ 1, dormant/RTM-material phrasing

## academylite2 — Academy Lite, Part 2. Where to look for PA

4 صفحه / 96 پست — بازبینی 4 · سابقه 0 · suspects 35

پرحاشیه‌ترین صفحه‌ها: academylite2-p2 (14) · academylite2-p4 (12) · academylite2-p3 (6) · academylite2-p1 (3)

- [x] academylite2-p1 — 22 posts · 3 suspects · 2 fixed · پرچم->فلگ x5, part 2->بخش 2, footer consistency
- [x] academylite2-p2 — 24 posts · 14 suspects · 8 fixed · پرچم->فلگ/FLAG sync across quote chain, quote drift p1_25+p2_27, fakeout, bring on, push
- [x] academylite2-p3 — 25 posts · 6 suspects · 4 fixed · quote drift p2_49 sync, URL ellipsis x2, MPL فلگ مخالف->FL x2
- [x] academylite2-p4 — 25 posts · 12 suspects · 11 fixed · l‌طفاً latin artifact x3, URL ellipsis x3, نقاشی->رسم, اوردر->سفارش تمیز sync, برادر->رفیق, footer

## bsz — BSZ

5 صفحه / 90 پست — بازبینی 5 · سابقه 1 · suspects 9

پرحاشیه‌ترین صفحه‌ها: bsz-p1 (3) · bsz-p2 (2) · bsz-p4 (2) · bsz-p3 (1) · bsz-p5 (1)

- [x] bsz-p1 — 20 posts · 3 suspects · pass-1 verdict · 3 fix pass-1 · clean; quotes synced
- [x] bsz-p2 — 19 posts · 2 suspects · 4 fixed · فشرده‌سازی->فشردگی x2 (quote-synced), retailer-pronoun ambiguity, LS Kink->پیچش LS convention
- [x] bsz-p3 — 17 posts · 1 suspects · 1 fixed · unmet-TG phrasing
- [x] bsz-p4 — 23 posts · 2 suspects · 2 fixed · quote drift تایی->تاپیک synced to canonical, homework->تمرین
- [x] bsz-p5 — 11 posts · 1 suspects · 3 fixed · kink->شکستگی wrong word fixed to پیچش, homework->تمرین, Trading->معامله section title

## ignoredlevel — Ignored Levels

3 صفحه / 69 پست — بازبینی 3 · سابقه 0 · suspects 24

پرحاشیه‌ترین صفحه‌ها: ignoredlevel-p3 (17) · ignoredlevel-p1 (6) · ignoredlevel-p2 (1)

- [x] ignoredlevel-p1 — 24 posts · 6 suspects · 5 fixed · clean orders on retrace mistranslated as اصلاح سفارش, پرچم->فلگ, retrace->ریتریس, quote sync, HTF/LTF->تایم‌فریم, باکس->ناحیه
- [x] ignoredlevel-p2 — 20 posts · 1 suspects · 6 fixed · URL ellipsis corruption, LTF->تایم‌فریم پایین‌تر x3+quote sync, ترید->معامله, minor calque
- [x] ignoredlevel-p3 — 25 posts · 17 suspects · 14 fixed · quote sync x6 (Astrokillah hypothesis x2, alirezat x1, staurum x1, Astrokillah p57 x2), URL ellipsis x2, پرچم->فلگ x5, LTF/HTF->تایم‌فریم, touch trade, calques

## moneydeep — Let there be light

3 صفحه / 61 پست — بازبینی 3 · سابقه 3 · suspects 18

پرحاشیه‌ترین صفحه‌ها: moneydeep-p1 (12) · moneydeep-p3 (4) · moneydeep-p2 (2)

- [x] moneydeep-p1 — 25 posts · 12 suspects · pass-1 verdict · 1 fix pass-1 · 7 fixed · پرچم->فلگ, sore-thumb calque, touch-trade loanwords->معامله با تاچ سطح, انقباض->فشردگی, @bro handle, شرّ لازم
- [x] moneydeep-p2 — 25 posts · 2 suspects · pass-1 verdict · 6 fixed · touch-trade loanword, انقباض->فشردگی, quote-block sync (دیجیتال نومد->عشایر دیجیتال), kink خم->پیچش drift, Mariana Trench joke
- [x] moneydeep-p3 — 11 posts · 4 suspects · pass-1 verdict · 5 fixed · htf->تایم‌فریم بالاتر (+synced quote), پرچم->فلگ x3, چارت->نمودار

## its — ITs

3 صفحه / 59 پست — بازبینی 3 · سابقه 1 · suspects 36

پرحاشیه‌ترین صفحه‌ها: its-p1 (22) · its-p2 (14)

- [x] its-p1 — 25 posts · 22 suspects · 25 fixed · systemic: thread->تاپیک, pole->دکل, pin bar->پین‌بار, fade->فید, limit->لیمیت, panic/obvious/consolidate/chop/curve/braindead/business/player leftovers, book title Latin, gap->گپ نقدینگی; long Aaron analysis posts retain translationese register (borderline)
- [x] its-p2 — 25 posts · 14 suspects · 20 fixed · full redrafts: HotRod informed/uninformed essay, AERO HFT post, pucci five-year-level post (+synced quote in p2_43, fixed old 15/16 para defect); fade->فید, limit->لیمیت, panic->وحوط, net لانگ->لانگ خالص, drawdown->افت, algo->الگوریتم, market makers->مارکت‌میکر
- [x] its-p3 — 9 posts · pass-1 verdict · short page, all posts clean; F _ _ _ L blank preserved, FL! acronym ok

## cancan — Can Can

3 صفحه / 53 پست — بازبینی 3 · سابقه 3 · suspects 12

پرحاشیه‌ترین صفحه‌ها: cancan-p1 (7) · cancan-p2 (3) · cancan-p3 (2)

- [x] cancan-p1 — 25 posts · 7 suspects · pass-1 verdict · 2 fix pass-1 · 1 fixed · pole->دکل x3, flag->فلگ x3, compression phrasing
- [x] cancan-p2 — 21 posts · 3 suspects · pass-1 verdict · 7 fix pass-1 · 6 fixed · فشرده‌سازی->فشردگی x3 posts, pole->دکل x4, drive->موج, flag->فلگ
- [x] cancan-p3 — 7 posts · 2 suspects · pass-1 verdict · clean

## flaglimitshydra — Flag limits by Hydra

3 صفحه / 51 پست — بازبینی 3 · سابقه 3 · suspects 2

پرحاشیه‌ترین صفحه‌ها: flaglimitshydra-p1 (2)

- [x] flaglimitshydra-p1 — 19 posts · 2 suspects · pass-1 verdict · 11 fix pass-1 · 7 fixed · پرچم->فلگ x6 posts, dropped flag-limits gloss, retrace->ریترایس
- [x] flaglimitshydra-p2 — 24 posts · pass-1 verdict · 22 fix pass-1 · 1 fixed · پرچم->فلگ
- [x] flaglimitshydra-p3 — 8 posts · pass-1 verdict · 1 fix pass-1 · 1 fixed · garbled 'واقع' in orders-stack sentence

## knowledgeismoney — Knowledge is MONEY. Do you agree_

2 صفحه / 46 پست — بازبینی 2 · سابقه 2 · suspects 6

پرحاشیه‌ترین صفحه‌ها: knowledgeismoney-p1 (6)

- [x] knowledgeismoney-p1 — 24 posts · 6 suspects · pass-1 verdict · 10 fix pass-1 · 2 fixed · flag Latin->فلگ, fakey->فیک‌اوت
- [x] knowledgeismoney-p2 — 22 posts · pass-1 verdict · 14 fix pass-1 · 3 fixed · touch trade->ورود با تاچ سطح, hate-this calque, fakeout/short-heavily garble

## dissection — Dissection Room

2 صفحه / 43 پست — بازبینی 2 · سابقه 2 · suspects 16

پرحاشیه‌ترین صفحه‌ها: dissection-p1 (10) · dissection-p2 (6)

- [x] dissection-p1 — 25 posts · 10 suspects · pass-1 verdict · 9 fix pass-1 · 1 fixed · extended FO phrasing
- [x] dissection-p2 — 18 posts · 6 suspects · pass-1 verdict · 11 fix pass-1 · 3 fixed · Diamond->الماس x2 (quote synced), URL ellipsis repair, FO/MPL phrasing

## pg — PG's Journal

2 صفحه / 41 پست — بازبینی 2 · سابقه 2 · suspects 2

پرحاشیه‌ترین صفحه‌ها: pg-p2 (2)

- [x] pg-p1 — 25 posts · pass-1 verdict · 1 fixed · FLAG->فلگ
- [x] pg-p2 — 16 posts · 2 suspects · pass-1 verdict · 9 fix pass-1 · 3 fixed · 3 Drive Latin, Fakeouts->فیک‌اوت‌ها, Flag->فلگ

## jc — JC's Journal

2 صفحه / 36 پست — بازبینی 2 · سابقه 2 · suspects 9

پرحاشیه‌ترین صفحه‌ها: jc-p1 (5) · jc-p2 (4)

- [x] jc-p1 — 24 posts · 5 suspects · pass-1 verdict · 2 fix pass-1 · 4 fixed · flag->فلگ x2, URL ellipsis repair x2
- [x] jc-p2 — 12 posts · 4 suspects · pass-1 verdict · 6 fix pass-1 · 1 fixed · URL ellipsis repair x2

## bill — Bill's Journal

2 صفحه / 35 پست — بازبینی 2 · سابقه 2 · suspects 10

پرحاشیه‌ترین صفحه‌ها: bill-p1 (10)

- [x] bill-p1 — 25 posts · 10 suspects · pass-1 verdict · 2 fixed · سوآپ->سواپ, crystal-ball drift, URL ellipsis repair
- [x] bill-p2 — 10 posts · pass-1 verdict · 1 fixed · FLAG->فلگ

## cppaz — CP PAZ

2 صفحه / 34 پست — بازبینی 2 · سابقه 2 · suspects 7

پرحاشیه‌ترین صفحه‌ها: cppaz-p2 (6) · cppaz-p1 (1)

- [x] cppaz-p1 — 22 posts · 1 suspects · pass-1 verdict · 8 fix pass-1 · 4 fixed · minor register fixes: nice->قشنگ, failed->جواب نداد, clipping wicks, stop phrasing
- [x] cppaz-p2 — 12 posts · 6 suspects · pass-1 verdict · 6 fix pass-1 · read all posts; quotes consistent; no defects

## fakeouts — Fakeouts

2 صفحه / 29 پست — بازبینی 2 · سابقه 2 · suspects 2

پرحاشیه‌ترین صفحه‌ها: fakeouts-p1 (2)

- [x] fakeouts-p1 — 25 posts · 2 suspects · pass-1 verdict · 13 fix pass-1 · 5 fixed · touch trade->تاچ سطح; Flag->فلگ; buy engulf; zoom-in calque; Pedini quote
- [x] fakeouts-p2 — 4 posts · pass-1 verdict · 1 fixed · at the end->انتهای مقاله ambiguity

## sdcleared — S/D cleared, explanation_

2 صفحه / 29 پست — بازبینی 2 · سابقه 2 · suspects 5

پرحاشیه‌ترین صفحه‌ها: sdcleared-p1 (4) · sdcleared-p2 (1)

- [x] sdcleared-p1 — 25 posts · 4 suspects · pass-1 verdict · 8 fix pass-1 · 3 fixed · digging-out calque, took-out->مصرف, SL was taken->استاپ خورد
- [x] sdcleared-p2 — 4 posts · 1 suspects · pass-1 verdict · 3 fix pass-1 · 2 fixed · Happy trading calque->معاملهٔ پرسود (canonical+quote synced)

## enquiry — Enquiry

2 صفحه / 23 پست — بازبینی 2 · سابقه 2 · suspects 2

پرحاشیه‌ترین صفحه‌ها: enquiry-p1 (2)

- [x] enquiry-p1 — 20 posts · 2 suspects · pass-1 verdict · 3 fix pass-1 · 2 fixed · stray 8 dropped; roadmap->نقشهٔ راه
- [x] enquiry-p2 — 3 posts · pass-1 verdict · 1 fixed · rejected->ريجکت per glossary

## maxpain — Max Pain Level

1 صفحه / 15 پست — بازبینی 1 · سابقه 1 · suspects 0

- [x] maxpain-p1 — 15 posts · pass-1 verdict · 4 fixed · pullback phrasing, turns below MPL, ready-to-be-taken, singular cap

## dplocation — DP Location

1 صفحه / 9 پست — بازبینی 1 · سابقه 1 · suspects 0

- [x] dplocation-p1 — 9 posts · pass-1 verdict · 1 fix pass-1 · 3 fixed · pole میله->دکل; breakout traders mistranslated; quote synced

## rinehartfl — Rinehart's FL homework

2 صفحه / 3 پست — بازبینی 2 · سابقه 1 · suspects 1

پرحاشیه‌ترین صفحه‌ها: rinehartfl-p1 (1)

- [x] rinehartfl-p1 — 1 posts · 1 suspects · 1 fixed · residual engulf->اینگالف; pull back a lot misread as کمی
- [x] rinehartfl-p2 — 2 posts · pass-1 verdict · 2 posts, both clean

## به‌روزرسانی چک‌لیست

```bash
# ثبت بازبینی یک صفحه
node _build/expert/review-checklist.js --mark if-p2 --verdict clean
node _build/expert/review-checklist.js --mark if-p3 --verdict fixed --defects 3 --note "QM calque"
node _build/expert/review-checklist.js --mark if-p4 --verdict flagged --note "residual English in 4 posts"
# برگرداندن یک صفحه به حالت بازبینی‌نشده
node _build/expert/review-checklist.js --unmark if-p3

# پیش از ثبت: اسکن تازه + دروازهٔ ماشینی
node _build/expert/audit-strict.js --write
node _build/expert/workflow.js --validate --page if-p1
```

پس از هر موج بازبینی: `apply-review.js` → `bake-translations.js` → `build-site.js` → `qa-translations.js`.
