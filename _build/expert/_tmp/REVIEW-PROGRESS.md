# Deep semantic review — progress (subagent run)

## Done this run
- fishing-p5: 4 fixes (PO fill, خرید AU, PA x2)
- robbie-p4: 2 fixes (price action→PA, انتها→سقف/کف)
- robbie-p5: 2 fixes («رو کردند» garble, پرایس اکشن→PA, پل‌ها→POLEها)
- robbie-p6: 5 fixes (areهای, سازنده→آموزنده, Mother Trucker, بیس پل→پایهٔ POLE, سکوت رادیویی→سکوت مطلق)
- robbie-p7: 3 fixes (prices a high→می‌خوره, EG→اینگالف x2)
- robbie-p10: 6 fixes (مرسی→ممنون x2, اکسترمم, پل→POLE, paragraph reorder p231/p235)
- whenever-p3: 6 fixes (رویکرد x2, لمس, نشانهٔ FO, نفوذ, ناحیهٔ مشکل)
- whenever-p8: reviewed, clean
- constantine-p6: کینک→پیچش x2 posts, معامله‌گران خرد→خرده‌معامله‌گران, تشنگی, جاهای گران‌قیمت→جاهای عزیز
- constantine-p7: 1 fix (I all need→باید روی همه‌اش کار کنم)
- academylite1-p1: clean. p2: کینک→پیچش x4. p3: POLE + کینک x2. p4: big kink/pole/Sallivan/LSای/منطق fixes. p5: کینک→پیچش x6 posts, RTMerها. p6: 2 fixes (didn't I?, شکستگی→پیچش)
- academylite2-p1: کینک→پیچش, خرده‌فروش→خرده‌معامله‌گران, flag→فلگ
- academylite2-p2: KINKS/flag→Persian in quotes x4, head→سر
- eurotrash-p5/p6/p7/p13: reviewed, clean
- readingsession-p6: reviewed to ~p174, clean so far (tail unseen)

## GLOBAL SWEEP applied to ALL batches/*.json
- کینک→پیچش (264), مرسی→ممنون (29), پرایس‌اکشن/پرایس اکشن→PA (135),
  خرده‌فروش→خرده‌معامله‌گران (71), اسکرین‌شات→عکس از صفحه (9),
  زون→ناحیه word-boundary (239), پرچم→فلگ word-boundary (404)

## KNOWN UNFINISHED / NEEDS FOLLOW-UP
- academylite2-p3: SEVERE — most posts are half-English (English chunks left
  untranslated inside FA). Needs full rewrite pass.
- academylite2-p4: same problem in p77/p78/p79 (long English quotes kept).
- readingsession-p6: tail (~p175+) and readingsession-p10 not reviewed.
- Still unreviewed assigned journals: art (p2,3,7,8,9,10,11,15),
  amit (p1,2,4,6,12,16,17,19,22), ftrretest (p2,p12), in2forex (p1,p3,p11),
  warren (p1,p5), andrew-p5, bsz (p2,3,4,5), cancan (no unreviewed),
  moneydeep/einrikr/fxeyes (all reviewed already).
- Plus ~370 other unreviewed batch files (see list in session; journals:
  dbrrbd 48, supplydemand 43, quasimodo 41, hs 33, classroom 28,
  aboutcompression 22, drswing 20, jurij 10, alex 11, mertch 13,
  newjournal 15, projectsagana 12, josh 8, homeoffinisher 8, astrokillah 2,
  etc.) — method: python _tmp/dump_pair.py <page> prints EN/FA pairs;
  fix via python json edit preserving hash keys & paragraph counts.
- Helper: _build/expert/_tmp/dump_pair.py <jid>-p<N>

## Added after resume
- ftrretest-p2, ftrretest-p12: reviewed, clean
- in2forex-p1, p3, p11: reviewed, clean (1 fix: pole-ENG→POLE-ENG)
- andrew-p5: reviewed to ~p114, clean
- bsz-p2: reviewed to ~p29, clean
- STILL TODO: andrew-p5 tail (~p115+), bsz-p3/4/5, readingsession-p6 tail + p10,
  art (8 pages), amit (9 pages), warren (p1,p5), academylite2-p3/p4 (severe
  half-English — needs rewrite pass), plus ~370 other unreviewed pages.
