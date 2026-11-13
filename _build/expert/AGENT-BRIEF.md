# Hand-translation brief — RTM journal archive

You are translating RTM Academy forex-journal posts from English into
**professional, specialised Persian — by hand, post by post**. The result is
real production content: on the reading site each Persian paragraph appears
directly under its English source paragraph.

## Absolute ban on machine translation

- Do **not** call any translation API, service, or external model endpoint.
- Do **not** run or reuse `_build/translate*.js`, `_build/ocr/*`,
  `_build/posts/translations.json`, `_build/posts/translations.baked.json` or
  any other existing machine-translation cache.
- Do **not** read, copy, paraphrase or "polish" the old machine translations.
  They are low quality and forbidden.
- You yourself read each English post, understand it, and write the Persian.
  Copying machine output — even lightly edited — is a failure of this task.

Also read `E:/Trade/journals/_build/expert/TRANSLATE-RULES.md` (authoritative
rulebook for input/output shapes).

## Files

For every assigned page `<page>`:

- source: `_build/expert/work/<page>.json` — JSON array of `{id, hash, author, text}`
- draft:  `_build/expert/drafts/<page>.txt` — what you write
- batch:  `_build/expert/batches/<page>.json` — written by the converter, never by hand

## Workflow

Work **one page at a time**: finish, convert and validate a page before opening
the next one's source.

1. Read that page's work file completely.
2. Translate **every** post. One Persian paragraph per English paragraph. A blank
   line is the only paragraph break; source line-wrapping is not a break — join
   wrapped lines with a space. Never merge, split or omit a clause.
3. Write the draft in exactly this shape (use the exact `id` from the work file):

   ```
   @@@ <post id>
   <Persian paragraph 1>
   <blank line>
   <Persian paragraph 2>
   @@@ <next post id>
   ...
   ```

   One block per post, in source order. No commentary, headings, English text or
   extra markers. Never put a blank line inside a single paragraph.
4. Run `cd E:/Trade/journals && node _build/expert/from-draft.js <page>`.
   It writes the batch JSON and verifies the hash set and paragraph counts.
   Fix the draft and re-run until it prints `paragraphs OK`.
5. Run `cd E:/Trade/journals && node _build/expert/workflow.js --validate --page <page1>,<page2>,...`
   (only your own pages, comma-separated). Fix every reject it reports until the
   line reads `rejected 0`. Other agents work in parallel; the `--page` filter
   keeps their files out of your check.
6. Report: each page, its post count, and the final validator line.

## Hard rules

- Every number stays **identical in Latin digits**: prices, pips, R multiples,
  percentages, volumes, dates, tickers, decimals and every integer >= 3 digits.
  Persian digits are forbidden.
- Keep structural RTM acronyms Latin: `PA, FL, FLR, CP, CPAZ, PCP, QM, SF, MPL,
  DBD, FTR, FO, TT, PO, HS, LS, MM, ITs, FLAG, POLES, PAZ, CAPS`.
  Conventions: `SL`→استاپلاس، `TP`→تارگت، `PO`→سفارش معلق،
  `ENGULF`→اینگالف، `HTF/LTF`→تایمفریم بالاتر/پایینتر.
- `Name wrote:` → `Name نوشت:` with the Latin handle untouched; preserve the
  nesting order of quoted posts. Never add, drop or reorder a quote head.
- Handles, member names, tickers and URLs stay Latin. A URL-only / ticker-only /
  signature-only post stays exactly as in the source. BBCode and quote furniture
  stay in the source's shape — translate only the prose.
- No added text, no translator notes, no invented headings.
- Natural contemporary Persian with correct نیمفاصله and Persian punctuation
  (، ؛ ؟). For videos write «ویدئو», never «فیلم» or «تماشا».

## Quality bar — meaning, not words

- Idioms must read as natural Persian, not calques: `no-brainer` → «کاملاً
  بدیهی»، `loose ends` → «نکتههای حلنشده»، `red flag` → «نشانهٔ هشدار»،
  `deadly accurate` → «فوقالعاده دقیق»، `I'll make a deal with you` → «با تو
  قرار میگذارم» (not «معامله میکنم», which sounds like trading).
- Never reverse a negation, never swap who does what, never turn a comparison
  upside down. Re-read every `not`, `unless`, `too ... to`, `before/after`.
- Trading terminology must be exact and consistent. If unsure of a Persian
  equivalent, keep the English term in Latin rather than inventing one.
- Anything that reads like Google Translate is a defect: rewrite it.

## Scope

Edit **only** your own draft files (and the batch files the converter generates).
No bake/build, no other pages, no subagents, no edits to rules or scripts.
