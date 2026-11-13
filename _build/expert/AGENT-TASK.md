# Translator brief — one page of the RTM archive

You are hand-translating pages of an RTM Academy forex forum journal from
English into professional Persian, for a bilingual archive site that shows the
English original and the Persian side by side, paragraph by paragraph.

Workspace: `E:\Trade\journals` (Windows; a bash shell is available).

## Read first

1. `E:\Trade\journals\_build\expert\TRANSLATE-RULES.md` — the full rules.
2. This brief.

## The loop, per page

For each page `N` assigned to you:

1. Read `E:\Trade\journals\_build\expert\work\<thread>-p<N>.json`
   — a JSON array of `{ id, hash, author, text }`.
2. Write `E:\Trade\journals\_build\expert\batches\<thread>-p<N>.json`
   — one JSON object mapping **every** hash in that work file to its Persian
   translation. Exactly the same hash set: no extras, none missing.
3. Validate:
   `cd "E:/Trade/journals" && node _build/expert/workflow.js --validate --page <thread>-p<N>`
4. If your page reports rejects, fix the Persian and re-run until your page is
   clean. Ignore rejects belonging to other pages (other translators are
   working at the same time).

## What the validator enforces

- **Paragraphs.** One Persian paragraph per English paragraph. A blank line is
  the ONLY paragraph break; source line-wrapping is not. Join wrapped lines
  with a space. Never merge two paragraphs, never split one.
- **Stay Latin, exactly as written:** RTM structural acronyms (PA, FL, FLR, CP,
  CPAZ, PCP, QM, SF, MPL, DBD, DBR, RBD, RBR, FTR, FO, TT, PO, HS, LS, MM, ITs,
  FLAG, POLES, PAZ, CAPS), member handles and names, tickers, timeframes
  (H1, H4, D1, M5, W1), URLs.
- **Never** write «پرچم» or «فلگ لیمیت» for FL. Site conventions:
  SL → استاپ‌لاس، TP → تارگت، PO → سفارش معلق، ENGULF → اینگالف،
  HTF → تایم‌فریم بالاتر، LTF → تایم‌فریم پایین‌تر.
- **Numbers** stay in Latin digits with an identical value (prices, pips,
  R multiples, percentages, dates). Never Persian digits (۰۱۲۳), never round,
  never drop a decimal.
- **Quote heads.** `Name wrote:` becomes `Name نوشت:` with the Latin handle
  untouched; same order, same nesting, none added or dropped.
- **No welding.** No English word glued to Persian letters without a space.
  An acronym plus a Persian suffix is fine («PAها»); an English word is not
  («chartها» must become «چارت‌ها»).
- **Voice.** Natural contemporary Persian, correct نیم‌فاصله, Persian
  punctuation (، ؛ ؟). For videos write «ویدئو».
- **Nothing to translate.** A post that is only a handle, a ticker, a number, a
  URL, or something like `1-20` stays exactly that — do not invent Persian.
- **Valid JSON.** Escape newlines inside strings as `\n`.

## Domain

These pages are forum replies about supply/demand trading: compression zones,
decision points, DBR/RBD/DBR homework, pole/flag, order flow, R multiples.
Keep the trading sense; never translate mechanically word for word.

## Boundaries

- Do NOT run `bake-translations.js`, `build-site.js`, `qa-translations.js` or
  any other script.
- Do NOT edit any file except your own batch files.
- Report in under 120 words: pages done, post count per page, and the final
  validator line per page.
