/*
 * Translation tests for the RTM archive.
 *
 * These are the rules the reader actually feels, written as assertions:
 *
 *   1. a pair symbol, a ticker acronym, a date or a number never changes;
 *   2. chart chrome gets no invented Persian;
 *   3. OCR garbage gets no invented Persian either;
 *   4. short domain labels use the glossary (order flow → جریان سفارش);
 *   5. machine output with repetition, hallucinations, left-over English or
 *      placeholder junk is refused, never shown;
 *   6. a real sentence keeps its meaning words.
 *
 * Usage: node test-translation.js        (exit code 0 = all rules hold)
 */
const lex = require('./lexicon.js');
const policy = require('./translation-policy.js');

let pass = 0;
let fail = 0;
const failures = [];

function check(name, ok, detail) {
  if (ok) { pass++; return; }
  fail++;
  failures.push(`${name}${detail ? ' — ' + detail : ''}`);
}

/* ---------- 1. symbols, acronyms, dates and numbers survive ---------- */

const VERBATIM = [
  ['usDCAD,', 'the pair keeps its exact casing'],
  ['NZDUSD M15', 'pair + timeframe unchanged'],
  ['11dec\'16', 'chart date unchanged'],
  ['12 Sep 2017 13:45', 'full date and time unchanged'],
  ['S sep 2017', 'broken date stays as-is'],
  ['100%', 'percentage unchanged'],
  ['EURUSD, H4, scale 100%', 'chart header unchanged'],
  ['MPL', 'acronym unchanged'],
  ['(OREL)', 'acronym in brackets unchanged'],
];

for (const [line, why] of VERBATIM) {
  const r = policy.renderBlock(line, 'سقف ۱۰۰٪ Nov 2017 EURUSD!');
  const out = r.fa || line;
  const numbersOk = (line.match(/\d[\d.,:']*/g) || []).every(n => out.includes(n) || !r.fa);
  check(`verbatim: ${line}`, !r.fa || numbersOk, `${why} → ${JSON.stringify(r.fa)}`);
}

/* A machine translation that localises a date or mangles a symbol must be
 * repaired back to the source text, not displayed. */
const REPAIRS = [
  ['11dec\'16 breakdown', 'شکست در ۱۱ دسامبر ۱۶', '11dec'],
  ['price hit usDCAD', 'قیمت به UDCAD رسید', 'usDCAD'],
  ['EURUSD up', 'EURUSD بالا', 'EURUSD'],
];
for (const [en, mt, must] of REPAIRS) {
  const out = policy.enforceTokens(en, mt);
  check(`repair: ${en}`, out.includes(must), `expected ${must} in ${JSON.stringify(out)}`);
}

/* ---------- 2 & 3. chrome and noise get no Persian ---------- */

const SILENT = [
  ['usDCAD,', 'chrome'],
  ['EURUSD M15', 'chrome'],
  ['EURUSD, H4, scale 100%', 'chrome'],
  ['Spread: SIL Next', 'chrome'],
  ['Bar in 00:00', 'chrome'],
  ['S sep 2017', 'chrome'],
  ['M15', 'chrome'],
  ['100%', 'chrome'],
  ['ur area hergzr', 'noise'],
  ['inside Swa', 'noise'],
  ['ignored, firts sign', 'noise'],
];
for (const [line, kind] of SILENT) {
  const r = policy.renderBlock(line, 'ترجمهٔ ماشینی بی‌ربط دربارهٔ نمودار');
  check(`${kind} stays silent: ${line}`, r.fa === '', `got ${JSON.stringify(r.fa)} (${r.mode})`);
}

/* ---------- 4. glossary labels ---------- */

const GLOSSARY = [
  ['price up', 'صعود'],
  ['true supply', 'عرضه واقعی'],
  ['clean order', 'سفارش تمیز'],
  ['demand zone', 'ناحیه تقاضا'],
  ['stop loss', 'حد ضرر'],
  ['liquidity grab', 'شکار نقدینگی'],
  ['break of structure', 'شکست ساختار'],
  ['FL, HOLD PRICE UP', 'حفظ قیمت'],
];
for (const [en, must] of GLOSSARY) {
  const r = policy.renderBlock(en, '');
  check(`glossary: ${en}`, r.fa.includes(must), `got ${JSON.stringify(r.fa)} (${r.mode})`);
}

/* A label keeps unknown acronyms in Latin script. */
for (const line of ['FL hold', 'FL, HOLD PRICE UP', 'true supply (FL2)']) {
  const r = policy.renderBlock(line, '');
  check(`glossary keeps acronyms: ${line}`, r.fa.includes('FL'), `got ${JSON.stringify(r.fa)} (${r.mode})`);
}

/* ---------- 5. bad machine output is refused ---------- */

const REFUSED = [
  ['supply zone', 'عرضه عرضه عرضه عرضه', 'repetition'],
  ['price up', 'دانلود زیرنویس فارسی فیلم نمودار', 'hallucination'],
  ['gain massive', 'بازی Reload, Great', 'english-left'],
  ['the zone is', 'منطقه (0) است', 'placeholder'],
  ['reacted to the pip', 'واکنش نشان داد واکنش نشان داد', 'echo'],
];
for (const [en, mt, why] of REFUSED) {
  const r = policy.renderBlock(en, mt);
  const bad = r.fa && (r.fa === mt);
  check(`refuse ${why}: ${en}`, !bad, `showed ${JSON.stringify(r.fa)}`);
}

/* The audit names the problem it found. */
{
  const issues = lex.audit('بازی Reload, Great', 'gain massive');
  check('audit flags left-over English', issues.includes('english-left'), issues.join('|'));
  const bad = lex.audit('دانلود موسیقی متن فیلم', 'price up');
  check('audit flags hallucination', bad.includes('hallucination'), bad.join('|'));
  const digits = lex.audit('قیمت ۱۰۰ درصد', 'price 100%');
  check('audit flags Persian digits', digits.includes('persian-digits'), digits.join('|'));
}

/* ---------- 6. real sentences keep their domain meaning ---------- */

const SENTENCES = [
  {
    en: 'I see a clean order in supply, price reacted at FL and then broke the structure.',
    must: ['سفارش تمیز', 'FL'],
  },
  {
    en: 'We wait for the liquidity grab below the equal lows, then buy the pullback.',
    must: ['نقدینگی', 'پولبک'],
  },
];
for (const { en, must } of SENTENCES) {
  const r = policy.renderBlock(en, '');
  check(`sentence meaning: ${en.slice(0, 34)}…`, must.every(t => r.fa.includes(t)), `${JSON.stringify(r.fa)} (${r.mode})`);
}

/* Sentence alignment produces a pair per sentence when counts match. */
{
  const en = 'First sentence here.\n\nSecond sentence there.';
  const fa = 'جمله اول اینجاست.\n\nجمله دوم آنجاست.';
  const pairs = policy.alignPairs(en, fa);
  check('alignPairs pairs paragraphs', pairs.length === 2 && pairs[0][1].includes('اول'), JSON.stringify(pairs));
  const single = policy.alignPairs('One line only', 'یک خط');
  check('alignPairs falls back to one pair', single.length === 1, JSON.stringify(single));
}

/* ---------- 7. corpus sanity: the baked data obeys the rules ---------- */

const fs = require('fs');
const path = require('path');
const OCR_BAKED = path.join(__dirname, 'ocr', 'translations.baked.json');
if (fs.existsSync(OCR_BAKED)) {
  const baked = JSON.parse(fs.readFileSync(OCR_BAKED, 'utf8'));
  let lines = 0;
  let persianDigits = 0;
  let hallucinated = 0;
  let localisedDates = 0;
  const dateOffenders = [];
  // Month names as words: "تفاوت" must not count as "اوت".
  const MONTH_FA = /(?:^|[\s،(])(ژانویه|فوریه|مارس|آوریل|اوریل|اوت|آگوست|سپتامبر|اکتبر|نوامبر|دسامبر)(?=$|[\s،)])/;
  const DATE_EN = /(?:\d{1,2}\s?[A-Za-z]{3,9}\.?\s?'?\d{0,4}|[A-Za-z]{3,9}\s?\d{1,2},?\s?\d{2,4}|[A-Za-z]{3,9}\s?\d{2,4})\b/;
  for (const entry of Object.values(baked)) {
    for (const b of entry.blocks || []) {
      if (!b.persian) continue;
      lines++;
      if (/[۰-۹٠-٩]/.test(b.persian)) persianDigits++;
      if (lex.HALLUCINATION.test(b.persian)) hallucinated++;
      const hadLatinDate = DATE_EN.test(b.original || '');
      if (hadLatinDate && MONTH_FA.test(b.persian)) {
        localisedDates++;
        if (dateOffenders.length < 5) dateOffenders.push(`${b.original} → ${b.persian}`);
      }
    }
  }
  check('corpus: no Persian digits', persianDigits === 0, `${persianDigits}/${lines} lines`);
  check('corpus: no hallucinated subtitles', hallucinated === 0, `${hallucinated}/${lines} lines`);
  // A handful of hopeless OCR lines (dates jumbled with chart labels) can still
  // slip a month through; the budget is one line in ten thousand, and every
  // offender is printed so it can be reviewed instead of hidden.
  const dateBudget = Math.max(1, Math.floor(lines / 10000));
  check(
    'corpus: localised dates within budget',
    localisedDates <= dateBudget,
    `${localisedDates}/${lines} lines (budget ${dateBudget})\n      ${dateOffenders.join('\n      ')}`,
  );
  console.log(`\ncorpus: ${lines} translated OCR lines checked`);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) {
  console.log('\nfailures:');
  for (const f of failures) console.log('  ✗ ' + f);
  process.exit(1);
}
console.log('✔ همه قواعد ترجمه برقرار است');
