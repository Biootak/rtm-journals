# Header extraction checklist

PDF print sources: **67 journals / 1045 files / 35,725 pages**.
Tested: **67/67**. Top-strip body lines checked: **15,412**.

- **43** journals: verified clean, no line lost.
- **13** journals: only signature/custom title/URL/attachment chrome was flagged; no body text lost.
- **10 of 11** journals with real body lines have been repaired (**34 of 45 lines**); **1** remains: `readingsession` (11 lines) needs a full Page 1 re-import because its parsed page starts at #26.
- **22** HTML-only journals: no printed header, listed at the end.

Method: body-looking spans in the top strip (`y 60–115`, `11.4–13 pt`) were matched against the parsed journal text with five-word shingles. White shadow copies, navigation, legal footer, signatures and custom titles are excluded.

## P0 — real body text (10 repaired, 1 pending)

| | journal | PDFs | pages | checked | body lines | raw flagged |
|---|---|---:|---:|---:|---:|---:|
| [ ] | `readingsession` — Reading a Session (needs Page 1 re-import) | 11 | 287 | 173 | **11** | 11 |
| [x] | `in2forex` — in2forex | 11 | 350 | 169 | **10** | 10 |
| [x] | `frosty` — Frosty | 13 | 352 | 510 | **5** | 5 |
| [x] | `capnp` — Cap'n P's | 6 | 188 | 130 | **5** | 5 |
| [x] | `supplydemand` — Supply and Demand — Support and Resistance | 59 | 2006 | 681 | **3** | 3 |
| [x] | `jiri` — Jiri | 11 | 349 | 143 | **3** | 3 |
| [x] | `rinehartfl` — Rinehart FL Homework | 2 | 21 | 4 | **3** | 3 |
| [x] | `hs` — H S Trading Journal | 58 | 2844 | 1509 | **2** | 3 |
| [x] | `dbrrbd` — DBR RBD | 66 | 2409 | 801 | **1** | 2 |
| [x] | `flaglimits` — Flag Limits | 53 | 1094 | 632 | **1** | 1 |
| [x] | `mm` — MM | 16 | 587 | 166 | **1** | 2 |

Details and exact PDF pages: `_build/expert/HEADER-GAPS.md`.

Post-repair check: `frosty`, `kruger`, `capnp`, `jiri`, `supplydemand`, `rinehartfl`, `in2forex`, `dbrrbd`, `flaglimits` and `mm` all test with **0 missing body lines**. The only remaining `capnp`/`mm` flags are a custom page title and a signature, not post text. `hs` needed no corpus change: the “expert” line was already present and the “thanks” line is chrome.

## Verified — no body text lost

| | journal | PDFs | pages | checked | note |
|---|---|---:|---:|---:|---|
| [x] | `aboutcompression` — About Compression | 50 | 1801 | 529 | clean |
| [x] | `3drive` — About the 3Drive | 10 | 393 | 52 | clean |
| [x] | `academylite1` — Academy Lite — Part 1 | 6 | 91 | 53 | clean |
| [x] | `academylite2` — Academy Lite — Part 2 | 4 | 72 | 103 | clean |
| [x] | `art` — Art | 15 | 573 | 165 | clean |
| [x] | `bill` — Bill | 2 | 21 | 10 | clean |
| [x] | `bsz` — BSZ | 5 | 80 | 18 | clean |
| [x] | `cancan` — Can Can | 3 | 39 | 6 | clean |
| [x] | `constantine` — Constantine | 8 | 146 | 123 | clean |
| [x] | `cppaz` — CP PAZ | 2 | 42 | 12 | clean |
| [x] | `dissection` — Dissection Room | 5 | 231 | 28 | clean |
| [x] | `dplocation` — DP Location | 1 | 7 | 0 | clean |
| [x] | `drswing` — DrSwing | 20 | 655 | 345 | clean |
| [x] | `engulf` — Engulf | 11 | 286 | 233 | clean |
| [x] | `enquiry` — Enquiry | 2 | 19 | 0 | clean |
| [x] | `eurotrash` — Eurotrash | 13 | 464 | 47 | clean |
| [x] | `ftrretest` — Failed to Retest FTR | 12 | 188 | 111 | clean |
| [x] | `fakeouts` — Fakeouts | 2 | 37 | 14 | clean |
| [x] | `finddecision` — Find The Decision | 13 | 313 | 148 | clean |
| [x] | `flaglimitshydra` — Flag Limits by Hydra | 3 | 39 | 2 | clean |
| [x] | `ftrpaz` — FTR PAZ | 5 | 77 | 56 | clean |
| [x] | `hgblacksheep` — HG Black Sheep | 13 | 518 | 379 | clean |
| [x] | `homeoffinisher` — HomeOfFinisher | 9 | 351 | 39 | clean |
| [x] | `ignoredlevel` — Ignored Level | 3 | 55 | 54 | clean |
| [x] | `its` — ITs | 3 | 70 | 161 | clean |
| [x] | `jc` — JC | 2 | 25 | 6 | clean |
| [x] | `josh` — Josh | 24 | 855 | 245 | clean |
| [x] | `knowledgeismoney` — Knowledge is money — do you agree | 2 | 31 | 12 | clean |
| [x] | `luska` — Luska | 9 | 287 | 66 | clean |
| [x] | `maxpain` — Max Pain Level | 1 | 10 | 5 | clean |
| [x] | `newjournal` — New Journal | 15 | 656 | 26 | clean |
| [x] | `pg` — PG | 2 | 61 | 10 | clean |
| [x] | `paz` — Price Action Zone | 9 | 147 | 141 | clean |
| [x] | `pucci` — Pucci | 8 | 354 | 200 | clean |
| [x] | `robbie` — Robbie | 10 | 385 | 188 | clean |
| [x] | `sdcleared` — S/D Cleared Explanation | 2 | 24 | 14 | clean |
| [x] | `scotty` — Scotty | 8 | 280 | 54 | clean |
| [x] | `smimon` — Smimon | 29 | 1210 | 966 | clean |
| [x] | `sunnytrader` — SunnyTrader | 13 | 526 | 195 | clean |
| [x] | `diamond` — The Diamond | 10 | 369 | 104 | clean |
| [x] | `quasimodo` — The Quasimodo | 52 | 1979 | 506 | clean |
| [x] | `warren` — Warren | 11 | 302 | 233 | clean |
| [x] | `whynotwork` — Why did it not work | 5 | 82 | 65 | clean |

## Noise-only flags — body is complete

| | journal | PDFs | pages | flagged | why it is not body |
|---|---|---:|---:|---:|---|
| [x] | `alex` — Alex | 36 | 1057 | 3 | signature + custom title + signature |
| [x] | `amit` — Amit | 22 | 732 | 1 | thread/page title |
| [x] | `fishing` — Fishing in the Moneyriver | 11 | 354 | 2 | signature quote + thread title |
| [x] | `gembel` — Gembel | 48 | 2027 | 1 | custom profile title |
| [x] | `jurij` — Jurij | 24 | 1183 | 1 | custom profile title |
| [x] | `kruger` — Kruger | 21 | 661 | 1 | joined word “withoutsetting” — text is present |
| [x] | `mertch` — Mertch | 13 | 417 | 1 | custom profile title |
| [x] | `michal238` — Michal238 | 10 | 392 | 1 | signature quote “…an engulfed flag…” |
| [x] | `projectsagana` — Project Sagana | 19 | 584 | 1 | signature |
| [x] | `shadowpit` — Shadowpit | 15 | 569 | 1 | signature quote “…an engulfed flag…” |
| [x] | `classroom` — The Classroom | 49 | 1694 | 2 | attachment filename + signature quote |
| [x] | `doctorpatient` — The Doctor's Patient | 31 | 1130 | 1 | attachment URL |
| [x] | `whenever` — Whenever | 8 | 287 | 1 | signature quote “…an engulfed flag…” |

## HTML-only journals — 22 (no printed header)

- [x] `andrew` — Andrew's JOURNEY (123 posts)
- [x] `aran` — Aran Jibril (180 posts)
- [x] `astrokillah` — Astrokillah (470 posts)
- [x] `benhur` — Benhur (204 posts)
- [x] `edges` — Edges Journal 2.0 (185 posts)
- [x] `einrikr` — Einrikr (129 posts)
- [x] `extremerrage` — extremerrage (259 posts)
- [x] `fulljournal` — full journal (264 posts)
- [x] `fxeyes` — fxeyes (125 posts)
- [x] `if` — IF (3448 posts)
- [x] `lespaul` — Les_Paul (438 posts)
- [x] `linos` — Linos (218 posts)
- [x] `mel` — Mel (158 posts)
- [x] `moneydeep` — Moneydeep (61 posts)
- [x] `mukhcin` — Mukhcin (203 posts)
- [x] `omidfx` — Omidfx (249 posts)
- [x] `pedini` — Pedini (586 posts)
- [x] `rinehart` — Rinehart (307 posts)
- [x] `salivan` — Salivan (1127 posts)
- [x] `sniffing` — Sniffing (337 posts)
- [x] `staurum` — staurum (578 posts)
- [x] `vitaldrug` — ViTaLDRuG (249 posts)

