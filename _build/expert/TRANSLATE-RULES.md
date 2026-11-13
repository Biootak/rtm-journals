# Hand-translation rules — RTM journal archive

You are translating one page of an RTM Academy forex journal from English into
professional, human-sounding Persian. The site shows the original and the
Persian paragraph by paragraph, side by side.

## Input / output
- Read: `E:/Trade/journals/_build/expert/work/<journal>-p<page>.json`
  — a JSON array of `{ id, hash, author, text }`.
- Write: `E:/Trade/journals/_build/expert/batches/<journal>-p<page>.json`
  — a single JSON object `{ "<hash>": "<فارسی>" }` containing **exactly** the
  hashes of that work file, no more, no less.
- Write valid JSON: escape every newline inside a string as `\n`; never paste a
  raw line break or a literal tab inside a string.
- Save the batch file as soon as the page is finished. Edit no other file.
  No bake/build, no subagents.

## Hard rules
1. **One Persian paragraph per source paragraph.** A blank line is the only
   paragraph break. Source line-wrapping is *not* a paragraph break. Join
   wrapped lines with a space. Never merge two paragraphs, never split one.
2. **Structural RTM acronyms stay Latin**: PA, FL, FLR, CP, CPAZ, PCP, QM, SF,
   MPL, DBD, FTR, FO, TT, PO, HS, LS, MM, ITs, FLAG, POLES, PAZ, CAPS.
   Never write «پرچم» for FL. The English word *flag* (not the acronym) is
   «فلگ»: «شکست فلگ». Site conventions:
   SL → استاپ‌لاس، TP → تارگت، PO → سفارش معلق، ENGULF → اینگالف،
   HTF → تایم‌فریم بالاتر، LTF → تایم‌فریم پایین‌تر.
3. **Numbers stay identical in Latin digits**: prices, pips, R multiples,
   percentages, volumes, dates, tickers. Never convert to Persian digits,
   never round, never drop a decimal point.
4. `Name wrote:` → `Name نوشت:` with the Latin handle untouched; keep the
   nesting order of quoted posts. Never add, drop or reorder a quote head.
5. Handles, member names, tickers and URLs stay Latin. No added text, no
   translator notes, no invented headings. A URL-only / ticker-only /
   signature-only post stays exactly that.
6. Natural contemporary Persian, correct نیم‌فاصله, Persian punctuation
   (، ؛ ؟). Avoid repeating a content word three times in a very short post.
   For videos write «ویدئو», never «فیلم» or «تماشا».
7. Quotes/BBcode that exist in the source stay in the source's shape; translate
   only the prose.

## Quality gate (mandatory)
After writing the batch, run:

```
node _build/expert/workflow.js --validate
```

Fix your own page's rejects until zero remain. The validator rejects:
- hash set different from the work file;
- Persian paragraph count != English paragraph count;
- a price / R / percentage / >=3-digit number missing;
- a `Name wrote:` without `Name نوشت:`;
- Persian digits, Latin welded to Persian, leftover English, echo,
  repetition, rambling.

Ignore rejects that belong to pages other than yours (other agents are
working at the same time). Report only: page, post count, and the validator
line.

## Slang and onomatopoeia (added after review)
- Never transliterate slang/onomatopoeia («کبوم»، «بام»، «داخ»). Translate the
  meaning naturally: kaboom → «انفجار»/«بمب», boom → «جهش», crash → «سقوط»,
  screenshot → «عکس از صفحه», yolo → «بی‌گدار به آب زدن» or natural equivalent.
- Keep the register of the original: casual trader talk stays casual Persian,
  not stiff formal prose. Forum interjections (lol, tbh, af) may stay Latin or
  become «هاها»/«راستش» naturally.

## Domain glossary (mandatory)
These are the terms that most often come out machine-like. The Persian must be
what an Iranian RTM trader actually writes, not a dictionary gloss.

- **If / If Myante / Mansor** — the founder. Keep the handle as «ایف» or
  «If»; never the conditional «اگر» when it addresses him. «سلام If» →
  «سلام ایف».
- **Associates / Associate Traders** — verified forum rank, not company
  partners: «تریدرهای سطح اَسوشیت» or «اعضای Associate». Never «شرکا».
- **Touch trade** — entering with a limit at first contact: «ورود با تاچ سطح» /
  «ورود لیمیت با اولین برخورد». Never «معامله آزمایشی».
- **Swap level** — a price level where roles swap: «سطح سواپ». Never
  «سواپ شبانه» (that is the broker's overnight fee).
- **Flag** — the continuation pattern: «فلگ» / «فلگ لیمیت». Never «پرچم».
- **Taking the trade** — «ورود به معامله» / «گرفتن پوزیشن». Never
  «برداشتن معامله» or «برداشتن تجارت».
- **Trade** (the noun) — «معامله»; «تجارت» only when the source really means
  business/commerce.
- **Cap** — «کَپ قیمت» / «سقف نگه‌دارنده»; **Compression** — «فشردگی» /
  «کامپرشن»; **QM** — «کیوام» / «سطح کیوام‌ال»; **MPL** — «سطح MPL»;
  **FTR** — «FTR» / «شکست در بازگشت»; **FTB** — «FTB» / «اولین برگشت به سطح».
- **Supply / Demand** — «عرضه / تقاضا»; **Fakeout** — «فیک‌اوت»;
  **Engulfing** — «اینگالف» — ONLY this spelling. Never «اینگالغ»،
  «اینگالیف»، «انگالف»، «انگولف»، or leftover Latin `eng`/`ENG`/`EG`.

## Meaning, not words
- Translate the intent of the sentence, then keep the technical content exact.
  "What we are looking at" → «ستاپی که مد نظر داریم», not «چیزی که داریم
  نگاهش می‌کنیم».
- A typo in the source ("rational" for *rationale*, "brak" for *break*) is
  translated by its intended meaning, never reproduced.
- Never add analysis, filler, greetings or translator notes that the author did
  not write. Never summarize.

## Idiom & register traps (learned from human review, if-p3 score 9/10)
English slang whose Persian calque reverses or flattens the register. Before
finalizing, check the *direction* of the idiom (boast vs. humility), its
*intensity*, and its *idiomatic completeness* — not just the dictionary gloss.

### Calque detection protocol — apply to EVERY post
These three fixes were symptoms of one disease: **calquing** — translating
English word-by-word into Persian that no Iranian would actually say. It is
the #1 defect class of the old pipeline. For every sentence ask:

> «اگر این فارسی را کلمه‌به‌کلمه برگردانم به انگلیسی، آیا طبیعی به نظر
> می‌رسد؟ اگر نه → کالک است، بازنویسی کن.»

A calque fails on at least one of four axes — check all four:
1. **Direction** — does the Persian reverse or flatten the stance?
   (humble-brag → pure humility; criticism → praise; certainty → doubt)
2. **Intensity** — is the Persian weaker/stronger than the source?
   (EPIC → «حماسی» = epic-scale, not hype; "destroyed it" → «خردش کرد»)
3. **Completeness** — is the idiom chopped into pieces that don't recombine?
   ("had their fill" → «سیرشان کامل شود» — Persian needs «کاملاً سیر شوند»)
4. **Naturalness** — would an Iranian trader actually SAY this sentence?
   («مایهٔ فروتنی است» — grammatically fine, pragmatically dead)

### Calque-prone categories — scan for all of these
- **Phrasal verbs** — give up, hang in there, pipe down, kick off, bail out,
  step up, carry on: find the Persian verb traders use, not «دادن+پایین».
- **Idioms & fixed phrases** — "only time will tell", "the proof is in the
  pudding", "back to the drawing board", "bite the bullet", "let the cat out
  of the bag": localize the meaning, keep the forum tone.
- **Hyperbole & intensifiers** — epic, insane, crazy, legendary, massive,
  brutal, filthy rich: match the trader-register equivalent
  («دیوانه‌وار»، «خونین»، «فوق‌العاده»، «عالی»), not a flat adjective.
- **Understatement & irony** — "not bad", "interesting choice", "bless your
  heart": preserve the dry/sarcastic edge; never upgrade to literal praise.
- **Metaphors** — "rabbit hole", "elephant in the room", "tip of the iceberg",
  "green shoots": render the image if Persian traders use it, else the meaning.
- **Wordplay & puns** — trader jokes, ticker puns, acronym jokes: translate
  the joke's *point*; if untranslatable, keep it natural, never explain it.
- **Cultural references** — films, memes («epic fail»), historical figures,
  brands: keep what Iranians know (BMW club → «انجمن‌های BMW»), gloss only
  when the source itself glosses.
- **Euphemisms & slang** — "the market gods", "getting rekt", "paper hands",
  "diamond hands": use the Persian crypto/trading slang Iranians actually use.
- **Discourse markers** — "to be honest", "at the end of the day", "long
  story short", "fwiw": natural Persian equivalents («راستش»، «آخرسر»،
  «خلاصه»), not calqued connectors.
- **Boast/humble formulas** — "humble brag", "just my two cents", "no BS",
  "eat the elephant one bite at a time": localize the ritual, keep the move.

### Worked examples (from human review)
- "Next week should be truly EPIC" → ~~«حماسی»~~ → «شاهکار/فوق‌العاده»
  (intensity axis: hype ≠ scale)
- "truly humbling to be a part of this" → ~~«مایهٔ فروتنی»~~ →
  «حضورم در این جمع افتخار است و به من حس تواضع می‌دهد»
  (direction axis: boast+humility, not humility alone)
- "'til they've had their fill" → ~~«سیرشان کامل شود»~~ →
  «تا وقتی کاملاً سیر شوند» (completeness axis)
- "it's a bugger to get it back" → «برگرداندنش واقعاً دردسر است»
  (naturalness axis: bugger → دردسر, not «بِگار»)
- "polluting your journal" → «شلوغ کردن ژورنالت» not «آلوده کردن»
  (naturalness axis: trader usage, not ecology)
- "Children of the Stop" → «فرزندان حد ضرر» — keep the grim joke intact
- "Eat the elephant one bite at a time" → «فیل را لقمه‌لقمه بخور»
- "knuckle down" → «کمر همت ببند» not «بند angi در»
- "my humble opinion" → «نظر فروتنانهٔ من» — humble-OPINION is correct;
  only the humble-BRAG formula needed rework (see worked examples)
- "Epic Fail" (fixed meme) → «شکست حماسی» is ACCEPTABLE — the meme, not hype

- **General rule:** when an English idiom has no clean Persian equivalent,
  translate the *pragmatic meaning the author intends* (often excitement,
  pride, teasing) into the register Iranian traders actually use — not a
  word-for-word calque that sounds translated.

## Source-fidelity rule (owner directive)
The English source is authoritative for *what was said*, but not immune to
the author's own typos and mistakes. When the source itself is wrong
(factual error, self-contradiction, broken sentence), fix it by intended
meaning — and where a local resource (`parsed.json`, thread context,
glossary, sibling posts quoting the same text) proves the intended reading,
apply it. Never reproduce a source error literally. Never invent content
the author did not write.

## Pre-publish checklist — 33 mandatory checks
Run every page through all 33 before `--mark`. Any failure = redraft.

**A. Meaning & completeness (1–6)**
1. Every English sentence has a Persian counterpart — no summarizing,
   merging, or dropping clauses.
2. Numbers, prices, dates, percentages, ticket/time values identical.
3. Paragraph count and order preserved (one FA paragraph per EN paragraph).
4. Quote structure preserved: `X wrote:` → `X نوشت:` heads intact,
   nested quotes still nested.
5. No translator notes, explanations, or added greetings.
6. Author's intent register kept: boast stays boast, question stays
   question, insult/tease stays teasing — never flattened to neutral.

**B. Idiom, slang & register (7–12)**
7. English idioms localized by pragmatic meaning, not calqued
   (see traps section above: EPIC, humbling, had their fill).
8. Intensifiers match: epic/insane/legendary → «فوق‌العاده/دیوانه‌وار/افسانه‌ای»
   by context, never a weaker or stronger word than the source.
9. Trader slang rendered in Iranian trader slang
   («ripping it up» →Natural, «yolo» → natural equivalent).
10. Humor, sarcasm, and deadpan preserved — the joke must still land.
11. Colloquialisms stay colloquial; mentor/authority posts stay authoritative.
12. No stiff dictionary-Persian where the source was casual.

**C. RTM terminology (13–20)**
13. `Flag` → «فلگ» (never «پرچم») except proven literal false-flag contexts.
14. `Touch trade` → «ورود با تاچ سطح» / limit-at-first-contact — never
    «معاملهٔ آزمایشی/لمسی».
15. `Compression` → «فشردگی/کامپرشن» — never «فشرده‌سازی».
16. `Engulf/Engulfing` → «اینگالف» — no residual `eng`, `ENG`,
    «انغلف», «ENG‌های».
17. `Diamond` pattern → «الماس» — no Latin `Diamond` left.
18. `Associate(s)` → «تریدر(های) سطح اَسوشیت» — never «همکار/شرکا»
    unless genuinely non-rank context.
19. Established acronyms stay Latin caps: FTR FL QM MPL FTB PAZ BE TP SL
    DP CP SR LTF HTF RR MA CAPS IT — with natural Persian phrasing.
20. `If/Ifmyante/Mansor` identity → «ایف/IF» never «اگر»; usernames and
    handles stay Latin where they are handles.

**D. Source-error & typo resolution (21–24)**
21. Obvious source typos translated by intended meaning
    («brak»→شکست, «supprot»→حمایت), never reproduced literally.
22. When source contradicts itself or a sibling quote of the same post,
    the canonical/original wording wins — quotes synced byte-for-byte.
23. Source factual errors corrected only when a local resource proves the
    right reading; otherwise keep the author's claim as written.
24. `pole` in chart context → one settled convention («پایه» or «دکل»,
    never financial «میله»); `implied flag` → «فلگ ضمنی» consistently.

**E. Formatting & markup integrity (25–30)**
25. URLs byte-identical — no inserted spaces, no broken ellipses
    (`jou… urney` → `jou...urney`).
26. Emoticons preserved exactly: `:)`, `:D`, `:(`, `:/`, `xD`, `:blush:` —
    never `(خنده)`, `☺`, `^^` drift.
27. BBCode/markup, attachment lines, image refs unchanged.
28. No stray artifacts: leading line numbers (`1 `), isolated Latin
    fragments, doubled spaces at line starts.
29. Latin-only lines (tickers, URLs, attachment lines) stay Latin;
    prose-only posts with no translatable text are not defects.
30. Inverted/odd punctuation from the source handled naturally
    (e.g., `?`/`!` placement per Persian convention where fluent).

**F. Final gate (31–33)**
31. `workflow.js --validate --page <id>` ends `rejected 0`.
32. Page marked via `review-checklist.js --mark` with defect count + note.
33. After each wave: `bake-translations.js` → `build-site.js` →
    `qa-translations.js`; bump `site/sw.js` VERSION; eyeball one built
    page before claiming done.

**G. Source integrity & completeness (34–40)** — compare EN↔FA end to end
34. Post is NOT truncated: FA covers the EN text to its last sentence;
    check the final paragraph explicitly.
35. Nothing invented: no clause, explanation, or content absent from EN
    (source-fidelity in BOTH directions).
36. Embedded long quotes, articles, lists, tables, and code blocks fully
    present — not summarized or cut.
37. Suspicious gaps: any EN sentence/clause with NO FA counterpart =
    defect, even if "minor".
38. If the batch looks truncated/garbled, cross-check `parsed.json` and
    `units.json` — the batch must match the corpus, not drift from it.
39. Quote heads and attributions (`X wrote:` → `X نوشت:`) present for
    every quoted block; nested levels preserved.
40. Multi-paragraph posts: paragraph ORDER and COUNT match EN exactly.

**H. Numbers, facts & entities (41–46)**
41. Every number identical: prices, pips, percentages, dates, times,
    quantities, RR ratios, ticket/order ids.
42. Currency pairs, tickers, instrument names correct and never swapped
    (EUR/USD ≠ USD/EUR).
43. Entry/SL/TP/RR figures internally consistent — a fix in one place
    must not contradict the same numbers elsewhere in the post.
44. Dates/times/timezones rendered correctly (no AM/PM flips, no
    Jalali/Gregorian mix-ups the author didn't make).
45. Names of people, companies, brokers, platforms, products correct —
    check against thread context when unsure (e.g., Michael Burry not
    "Berry", Big Short reference).
46. Author's factual claims kept as claims — do not "correct" the author's
    market opinion, only proven source typos.

**I. Structural artifacts & markup (47–54)**
47. No OCR/print artifacts leaked into prose: page numbers, nav headers,
    "Posts:/Thank you received:" card lines, print chrome.
48. No duplicated paragraphs inside a post (same sentence twice).
49. No fused posts (two posts' text merged) and no split posts.
50. Signature blocks excluded from translation — they are card chrome,
    not content.
51. BBCode/markup balanced: [QUOTE]…[/QUOTE], [spoiler], code blocks —
    tags preserved or correctly mirrored.
52. Image/attachment/plate references intact (filenames, counts).
53. No mixed-script garbling: Persian and Latin glued wrongly
    («تحویلde»، «priceها» without proper joining), except sanctioned
    acronym usage.
54. Persian digit convention consistent with corpus (source digits stay
    as in EN; no half-converted numbers like ۱.۵ mixing scripts).

**J. Cross-consistency (55–60)**
55. Identical/quoted posts byte-identical everywhere they appear —
    run a corpus-level duplicate check, not just within the page.
56. Terminology consistent ACROSS journals, not just within a page
    (the glossary binds all 89 threads).
57. Author handles/ranks consistent — same person spelled the same
    everywhere (Ifmyante/IfMyante drift is a defect).
58. Recurring thread-specific terms stay consistent within the thread
    (e.g., a coach's coined vocabulary).
59. When two posts quote each other, both directions tell the same story.
60. Convention drift between agents is a defect: pole→دکل,
    implied flag→فلگ ضمنی, associate→تریدر سطح اَشوشیت — one form corpus-wide.

**K. Language purity & suspicious content (61–66)**
61. No untranslated English PROSE hiding inside Persian paragraphs —
    scan for Latin runs >3 words that aren't URLs/acronyms/handles.
62. No Persian sentence that doesn't correspond to ANY English sentence
    (wrong-post assignment / copy-paste contamination).
63. Length-ratio sanity: FA not suspiciously shorter (heavy omission)
    or longer (invented content) vs EN — investigate outliers.
64. Machine-translation smell test: if a sentence reads like a dictionary
    gloss with Persian grammar pasted on, rewrite it naturally.
65. Register still right after all fixes: a rant must still rant, a
    eulogy must still eulogize — fixes must not sterilize tone.
66. Suspicious-source check: if EN itself is garbled/nonsensical, the FA
    must render the INTENDED meaning (per source-fidelity rule) — and if
    two sibling posts quote the same text, they must agree on the reading.

**L. Audit & corpus-level sweeps (67–70)**
67. `audit-strict.js` suspects for the page: each one either fixed or
    explicitly justified (URL, ticker, handle, acronym).
68. Reused-Persian-block report (`qa-translations.js`): duplicated
    blocks must be genuinely duplicate EN, not copy-paste errors.
69. Systematic pattern sweeps per journal after review: calque words,
    banned glossary forms, emoticon drift, URL ellipsis corruption —
    grep the whole journal, not just flagged posts.
70. Final read-aloud test on the 5 longest posts of the journal:
    does the Persian sound like a human trader wrote it? If any
    sentence sounds translated, it isn't done.

