/*
 * Deterministic glossary gate for a set of pages.
 *
 *   node _build/expert/_glossary-check.js <page> [<page> ...]
 *
 * The archive has one wording per term. A translator who drifts (ساپلای for
 * supply, زون for zone, پایه for base, بیرفِلگ for bear flag) produces pages
 * that read like a different book, so the drift is caught here before the
 * page is reported as done. Exit code 1 when anything is off.
 */
const fs = require('fs');
const path = require('path');

const BATCHES = path.join(__dirname, 'batches');

const BAD = [
  ['ساپلای', 'supply', 'عرضه'],
  ['دیماند', 'demand', 'تقاضا'],
  ['زون', 'zone', 'ناحیه'],
  ['بیرفِلگ', 'bear flag', 'فلگ نزولی'],
  ['بول‌فِلگ', 'bull flag', 'فلگ صعودی'],
  ['بیرفلگ', 'bear flag', 'فلگ نزولی'],
  ['کمپرشن', 'compression', 'فشرده‌سازی'],
  ['پرچم', 'FL', 'FL (هرگز پرچم)'],
];

const pages = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (!pages.length) { console.error('usage: _glossary-check.js <page> ...'); process.exit(1); }

let bad = 0;
for (const page of pages) {
  const file = path.join(BATCHES, page + '.json');
  if (!fs.existsSync(file)) { console.log(page + ' | no batch file'); bad++; continue; }
  let batch;
  try { batch = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { console.log(page + ' | bad json'); bad++; continue; }
  for (const [word, en, good] of BAD) {
    const hits = Object.entries(batch).filter(([, v]) => typeof v === 'string' && v.includes(word));
    if (!hits.length) continue;
    bad++;
    console.log(page + ' | «' + word + '» x' + hits.reduce((s, [, v]) => s + (v.split(word).length - 1), 0) +
      ' — use «' + good + '» for ' + en);
  }
}
console.log(bad ? 'glossary: ' + bad + ' problem(s)' : 'glossary clean');
process.exitCode = bad ? 1 : 0;
