# Re-translation brief — IF, Salivan, Pedini (2026-11-12)

The shipped Persian is accurate in places but reads like a translation, and the
owner's native-review verdict is that the meaning drifts. This wave rebuilds the
Persian so it reads like an Iranian RTM trader wrote it, without moving the
meaning one inch.

Work order: **if → salivan → pedini → the rest**, page by page, lowest number
first. Nothing else changes: no parsing, no images, no site code.

## What "elite" means here

1. **Meaning first.** Read the English sentence, understand what the trader is
   actually saying about price, then write Persian. If the current Persian says
   something the English does not, rewrite the whole post.
2. **No calque.** «تو که این را پوشش داده‌ای» for "you got that covered" is a
   defect; «تو که این را از قبل داری» is the translation.
3. **Institutional register.** Technical posts read like a desk note: crisp,
   impersonal, no filler. Chat posts keep the author's voice: warm, dry, joking.
4. **One voice per author.** IF is a mentor: confident, generous, occasionally
   self-deprecating, British dry humour. Newbies are polite and a little
   hesitant. Banter is colloquial but never vulgar.
5. **Consistency across quotes.** When the same post is quoted again on the same
   page, reuse the identical Persian block. Never translate the same English
   twice differently on one page.

## Glossary (fixed)

| English | Persian |
|---|---|
| supply / demand | عرضه / تقاضا |
| zone / area / level | ناحیه / محدوده / سطح |
| compression | فشردگی (verb: فشرده شدن) |
| engulf / engulfing | اینگالف |
| fakeout | فیک‌اوت |
| flag (RTM) | **فلگ** — never پرچم |
| pole | پایه |
| base | بیس |
| spike | اسپایک |
| flip | فلیپ |
| retest | ریتست |
| swing high / low | سقف / کف سوئینگ |
| origin (of a move) | مبدأ (حرکت) |
| range / trend | رنج / روند |
| stop loss | حد ضرر |
| target | تارگت |
| break even | BE |
| take profit | TP |
| touch trade | ورود با تاچ سطح (never «معامله آزمایشی») |
| limit order | سفارش لیمیت |
| market maker | مارکت‌میکر |
| big boys / big guys | بازیگران بزرگ / نهنگ‌ها |
| liquidity | نقدینگی |
| order / position | سفارش / پوزیشن |
| long / short | لانگ / شورت |
| drawdown | افت سرمایه |
| account builder | حساب‌ساز |
| scalping | اسکالپ |
| swap | سوآپ |
| price action | PA |

Structural acronyms stay Latin capitals, exactly as written: PA, FL, FTR, CP,
CPAZ, PAZ, QM, MPL, FTB, DMP, BSZ, BUFL, DBD, HS, LS, SR, RN, TG, DP, BE, TP.
Tickers stay Latin (`EU`, `DX`, `EURUSD`, `Gasoline`). Handles, product names,
URLs and file names stay untouched. Latin digits only — never ۰-۹.

Quote heads: `Name wrote:` → `Name نوشت:` and nothing else. The name keeps its
Latin spelling.

## Procedure for one page

```bash
node _build/expert/para-map.js if-p4        # paragraph counts, EN preview
node _build/expert/review-dump.js if-p4     # full EN + current FA, read all of it
```

Write `_build/expert/redraft/if-p4.txt`:

```
### if_p4_1
پاراگراف اول

پاراگراف دوم

### if_p4_2
...
```

- One block per post, `### <post id>` on its own line, blocks separated by a
  blank line.
- Paragraphs inside a block separated by a blank line, **exactly as many as the
  English post** (the tool refuses a mismatch).
- Paragraphs that are only a name, a ticker, a URL, an emoticon or `\` are kept
  verbatim.
- A draft must cover every post on the page, even the ones that need no change —
  copy those through so the page is reviewed as a whole.

Apply and gate:

```bash
node _build/expert/retranslate.js if-p4 _build/expert/redraft/if-p4.txt
node _build/expert/workflow.js --validate --page if-p4
node _build/expert/review-checklist.js --mark if-p4 --verdict fixed --defects N
```

`retranslate.js` refuses a block whose paragraph count, numbers or quote heads
do not match. Fix the draft; never use `--force`. Only mark the page when the
gate prints `rejected 0`.

## Examples from the accepted wave (if-p1..p3)

| English | old Persian (rejected) | new Persian (accepted) |
|---|---|---|
| you got that covered | تو که این را از پیش پوشش داده‌ای | تو که این را از قبل داری |
| it never ceases to amuse me how frequently they come along | و همیشه برایم لذت‌بخش است که ببینم چقدر پیاپی از راه می‌رسند | و هنوز هم برایم خنده‌دار است که چقدر پشت سر هم از راه می‌رسند |
| Take your time you deserve it | با آرامش وقت بگذار، حقت همین است | عجله نکن، حقّت است |
| Lots of nice interaction. | تعامل‌های خوب زیادی داشته. | کلی تعامل قشنگ داشته‌ام. |
| a flag into an SR flip | پرچمی که به فلیپ SR می‌رسد | فلگ به سمت فلیپ SR |
| This mentality is sent to destroy the noob | این طرز فکر ساخته شده تا مبتدی را نابود کند | این طرز فکر دقیقاً برای نابودی تازه‌کارها طراحی شده |
| drive the analysis team hard | تیم تحلیل را سخت به کار می‌گیرم | تیم تحلیل را سخت می‌اندازم به کار |
| I have a feeling that today is my day! | حس می‌کنم امروز روز من است! | حس می‌کنم امروز روز من است! (accepted as is) |

## Guardrails

- Do not edit `parsed.json`, `posts.json`, other pages' batches, `sw.js`, site
  code or the checklist outside your pages.
- Do not run `audit-strict.js --write` (shared report) or `bake`/`build`; the
  wave lead runs those once at the end.
- Do not translate chart images or signatures.
- If a source line is truncated or garbled (print artefact), translate what is
  there and keep the same paragraph count; do not invent the missing words.
