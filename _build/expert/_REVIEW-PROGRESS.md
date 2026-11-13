# Resume notes — classroom/frosty retranslation (subagent task)

## Conventions confirmed (from reviewed batches)
- retest→ری‌تست/تست مجدد, flip→فلیپ, cap→cap (Latin), pole→پایه/POLE, fakeout→فیک‌اوت, engulf→اینگالف, compression→فشرده‌سازی, drawdown→افت سرمایه, consolidation→تجمیع, price action→PA, high/low→سقف/کف, supply/demand→عرضه/تقاضا, zone→ناحیه, screenshot→عکس از صفحه, spike→اسپایک, cheers→ممنون, Hi X→سلام X, ps→پ‌ن, edit→ویرایش, source→منبع, homework→تمرین خانگی, thread→تاپیک, flag pattern→پرچم, flag limit→FL, pole→پایه, pennant→پرچم/الگوی پرچمی, quasimodo→QM (Quasimodo), HH/LL/LH→سقف/کف بالاتر/پایین‌تر, swing high/low→سقف/کف سوینگ, big boys→نهنگ‌های بازار, Eureka→Eureka/یافتم, GR8→GR8 (keep digit), RTM acronyms stay Latin (PA,FL,FLR,CP,CPAZ,PCP,QM,SF,MPL,DBD,FTR,FO,TT,PO,HS,LS,MM,ITs,FLAG,POLES,PAZ,CAPS,DP used widely).

## Helpers (in C:/Users/Bioootak/AppData/Local/Temp/jx/)
- dump.js <jid> <page> → full EN+FA dump; dumpids.js <jid> <page> id1,id2 → selective
- patch.js <jid> <page> <patchfile> → merge {hash:persian} into batches/<jid>-p<page>.json (keys untouched)
- check.js <jid> <page> → PARA/NUM mismatch report
- scan2.js <jid> pages... → suspect Latin/glued detector (run from _build/expert cwd)
- prio2.txt / sus_rest.txt / issues_rest.txt → prioritized suspect lists for classroom p17-49

## DONE (patched & check-clean)
classroom p13 (20), p14 (19), p15 (22), p16 (22), p17 (5), p18 (21), p19 (19), p20 (22), p21 (20), p22 (12) — all `check.js` clean.

## TODO (resume here)
- classroom p23-p38, p49: NOT REVIEWED. Suspect lists: Temp/jx/prio2.txt (205 ids incl. glued), issues_rest.txt (PARA/NUM). p24 has no flagged posts.
- classroom p27,p29,p30,p31: systematic fa≈2×en duplication — flagged posts need FULL retranslation.
- frosty p1-p13: NOT STARTED. Run scan2.js + check.js for frosty.
- Helpers & conventions at top of this file.
