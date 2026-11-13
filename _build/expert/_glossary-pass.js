/*
 * Glossary normalisation for the wave-4 pages.
 *
 * The archive's own term table (lexicon.js / report-labels.js) and the shipped
 * corpus overwhelmingly use عرضه / تقاضا / ناحیه. A few of the new pages used
 * the transliterations ساپلای / دیماند / زون instead, which reads as a different
 * translator at work. This pass rewrites only those words, word by word, and
 * leaves everything else untouched.
 *
 *   node _build/expert/_glossary-pass.js [--write]
 */
const fs = require('fs');
const path = require('path');

const BATCHES = path.join(__dirname, 'batches');
const WRITE = process.argv.includes('--write');

const PAGES = [
  'constantine-p8', 'art-p4', 'bsz-p1', 'constantine-p4', 'aboutcompression-p42',
  'fishing-p7', 'flaglimits-p49', 'ftrpaz-p4', 'hs-p51', 'quasimodo-p30',
  'whenever-p5', 'aboutcompression-p1', 'aboutcompression-p18',
  'aboutcompression-p35', 'classroom-p17', 'classroom-p24', 'classroom-p28',
  'dbrrbd-p32', 'dbrrbd-p53', 'diamond-p3', 'fishing-p3', 'fishing-p4',
  'fishing-p8', 'flaglimits-p21', 'flaglimits-p24', 'ftrretest-p10',
  'homeoffinisher-p7', 'hs-p21', 'quasimodo-p12', 'quasimodo-p21',
  'quasimodo-p28', 'quasimodo-p46', 'readingsession-p8', 'readingsession-p9',
  'supplydemand-p8', 'staurum-p19',
];

/* A Persian word boundary: ZWNJ belongs to the word, so «کیل‌زون» stays whole
   and «زون» only matches when it stands alone. */
const B = '(^|[\\s،؛:.!؟()«»\\[\\]\\-—/])';
const E = '(?=$|[\\s،؛:.!؟()«»\\[\\]\\-—/])';

const RULES = [
  // plural / ezafe forms first so the bare word does not eat their suffix
  [new RegExp(B + 'ساپلای(ها|های|هایی)' + E, 'g'), '$1عرضه$2'],
  [new RegExp(B + 'ساپلای' + E, 'g'), '$1عرضه'],
  [new RegExp(B + 'دیماند(ها|های|هایی)' + E, 'g'), '$1تقاضا$2'],
  [new RegExp(B + 'دیماند' + E, 'g'), '$1تقاضا'],
  [new RegExp(B + 'زون(ها|های|هایی)' + E, 'g'), '$1ناحیه$2'],
  [new RegExp(B + 'زون' + E, 'g'), '$1ناحیه'],
];

let touched = 0;
const perPage = [];
for (const page of PAGES) {
  const file = path.join(BATCHES, page + '.json');
  const batch = JSON.parse(fs.readFileSync(file, 'utf8'));
  let n = 0;
  for (const hash of Object.keys(batch)) {
    const before = batch[hash];
    if (typeof before !== 'string') continue;
    let after = before;
    for (const [re, rep] of RULES) after = after.replace(re, rep);
    if (after !== before) {
      batch[hash] = after;
      n++;
      touched++;
    }
  }
  if (n) perPage.push([page, n]);
  if (WRITE && n) fs.writeFileSync(file, JSON.stringify(batch, null, 1), 'utf8');
}

perPage.forEach(([p, n]) => console.log(p, n));
console.log((WRITE ? 'rewrote' : 'would rewrite') + ' ' + touched + ' posts');
