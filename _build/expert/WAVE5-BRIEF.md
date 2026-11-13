# Wave 5 brief — final-quality hand translation, one pass

You are translating pages of the RTM Academy forex-journal archive at
`E:/Trade/journals` from English into Persian. There is **no review stage after
you**: what you write is what ships. So write it right the first time.

Also read `E:/Trade/journals/_build/expert/TRANSLATE-RULES.md` (input/output
shapes) and `AGENT-BRIEF.md` (workflow). This file overrides them where it is
more specific.

## Workflow per page

1. Read `_build/expert/work/<page>.json` completely — every post, in order.
2. Write `_build/expert/drafts/<page>.txt`:
   an `@@@ <post id>` line, then the Persian, one block per post, source order.
3. `cd E:/Trade/journals && node _build/expert/from-draft.js <page>`
   → must print `paragraphs OK`.
4. `node _build/expert/workflow.js --validate --page <your pages, comma separated>`
   → fix every reject naming one of your posts until `rejected 0`.
5. `node _build/expert/_glossary-check.js <your pages>`
   → must print `glossary clean`.

`from-draft.js` requires **every** post of the page, so translate the whole
page even if the batch file already holds a few entries. Never leave a post out.

## Shape rules (hard)

- One Persian paragraph per English paragraph. A blank line is the only
  paragraph break. Source line-wrapping is not a break — join it with a space.
- Never merge two paragraphs, never split one, never drop a clause.
- All numbers stay in Latin digits, unchanged: prices, pips, R multiples,
  percentages, levels. Never round, never localise.
- `Name wrote:` → `Name نوشت:` with the Latin handle untouched, nesting kept.
- Handles, member names, tickers, URLs stay Latin.
- Never invent a date or a member rank — they come from the data layer.
- A post that is only a ticker, a URL, an attachment line or a signature stays
  Latin exactly as the source, but keeps its own block and paragraph count.
- No translator notes, no added headings, no invented content.
- Images and OCR text are not translated.

## Acronyms stay Latin, always

PA, FL, FLR, CP, CPAZ, PCP, QM, SF, MPL, DBD, FTR, FO, TT, PO, HS, LS, MM, ITs,
BSZ, BUFL, S/D, S/R, RN, TG, BE, PB, HTF, LTF, RBD, RBR, BEOB, FTB, LQ, DP, SD.

Never translate them and never write «پرچم» for FL.
Site conventions: SL → استاپ‌لاس، TP → تارگت، PO → سفارش معلق،
ENGULF → اینگالف، HTF → تایم‌فریم بالاتر، LTF → تایم‌فریم پایین‌تر.

## Glossary — one wording across the whole archive

| English | Persian | do not write |
|---|---|---|
| supply | عرضه | ساپلای |
| demand | تقاضا | دیماند |
| zone | ناحیه | زون |
| base | بیس | پایه |
| compression | فشرده‌سازی | کمپرشن |
| bear flag / bull flag | فلگ نزولی / فلگ صعودی | بیرفِلگ، بول‌فلگ |
| engulf | اینگالف | — |
| spike | اسپایک | — |
| scalp | اسکالپ | — |
| target | تارگت | — |
| retest | ریتست | — |
| pullback | پولبک | — |
| position | پوزیشن | — |
| timeframe | تایم‌فریم | — |
| session | سشن | — |
| setup | ستاپ | — |
| momentum | مومنتوم | — |
| flip | فلیپ | — |
| pole | پل | پول |
| wick | سایه | — |
| trendline | ترندلاین | — |
| edge (advantage) | برتری | لبه |
| liquidity | نقدینگی | — |

## Meaning rules — the defects that actually happen

1. **Negations and conditionals.** "until", "unless", "as long as", "in case",
   "no longer" flip the meaning if handled loosely. Read the sentence twice.
2. **Who did what.** Keep subject and object straight, especially in quote
   replies and in "price did X to Y" sentences.
3. **Idioms are not literal.** Examples seen in this archive:
   - "get out of jail card" → «برگ برندهٔ نجات»
   - "kicking myself" → «خودم را می‌زدم / حسرت می‌خورم»
   - "the train left without me" → «قطار بدون من رفت»
   - "in the zone" (top form) → «در اوج فرم»، نه «در ناحیه»
   - "take it with a grain of salt" → «با تردید بخوان»
   - "at your own peril" → «به مسئولیت خودت»
   - "call the bet" → «کال کردن شرط»
   - "Great stuff" → «عالی بود» (تحسین، نه تصحیح)
4. **No English word order.** «فقط PA هستند برای اثبات اینکه…» is a calque;
   write Persian sentence order.
5. **Do not invent detail.** If the English does not say "retail buyers", the
   Persian must not add «خریداران خرد».
6. **Keep the author's voice.** These are traders writing fast: short lines,
   slang, typos, ALL CAPS for emphasis. Match the register — colloquial where
   the source is colloquial, precise where it is technical. Do not turn a
   two-word post into a paragraph.
7. **PDF artifacts.** A stray control character inside a word
   (`pro\x06le`, `engul\x06ng`, `\x06rst`) means the letter was eaten: translate
   the intended word (profile, engulfing, first) and drop the artifact.
8. **Broken source splits.** When the print cut a sentence across two
   paragraphs or spliced a fragment of the previous post into this one,
   translate the coherent intended sentence and keep the paragraph count.

## Quality bar

Natural contemporary Persian with correct نیم‌فاصله and Persian punctuation
(، ؛ ؟). A professional Iranian trader should read it and hear a colleague, not
a translation engine. Numbers exact, terms consistent, meaning complete.

## Report

One line per page (page — posts — paragraphs OK — validator status), then the
final `accepted … | rejected 0` line and `glossary clean`. Under 14 lines.
Touch only `drafts/<your pages>.txt` and `batches/<your pages>.json`. No bake,
no build, no git.
