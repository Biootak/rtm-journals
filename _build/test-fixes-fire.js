/*
 * How many post-edit rules actually fire on the real cached translations,
 * with Persian-aware boundaries versus the dead \b versions.
 */
const fs = require('fs');
const path = require('path');
const lex = require('./lexicon.js');
const { compileFixes, LEFT, RIGHT, FA_SPACE } = require('./fa-boundary.js');

const BUILD = 'E:/Trade/journals/_build';

const rawMap = (p) => Object.entries(JSON.parse(fs.readFileSync(p, 'utf8')))
  .filter(([, v]) => typeof v === 'string' && v);

const ocrRows = rawMap(path.join(BUILD, 'ocr/phrase-cache.json'));
const postRows = rawMap(path.join(BUILD, 'posts/translations.json'));
const rows = [...ocrRows, ...postRows];
console.log('raw machine translations probed:', rows.length, `(ocr ${ocrRows.length} / posts ${postRows.length})`);

/* Rules as authored (dead) versus compiled (live): undo the two substitutions
 * the compiler made so the same table can be measured the old, broken way. */
const dead = lex.MT_FIXES.map(([re, rep]) => {
  const src = re.source.split(LEFT).join('\\b').split(RIGHT).join('\\b').split(FA_SPACE).join('\\s');
  return [new RegExp(src, re.flags), rep];
});

function fireCount(table) {
  const hits = new Map();
  let changed = 0;
  for (const [, fa] of rows) {
    let s = fa;
    for (const [re, rep] of table) {
      const before = s;
      s = s.replace(re, rep);
      if (s !== before) hits.set(re.source, (hits.get(re.source) || 0) + 1);
    }
    if (s !== fa) changed++;
  }
  return { hits, changed };
}

const live = fireCount(lex.MT_FIXES);
const before = fireCount(dead);

console.log('\nrules that fire  dead-\\b:', before.hits.size, ' compiled:', live.hits.size);
console.log('rows rewritten   dead-\\b:', before.changed, ' compiled:', live.changed);

console.log('\n=== TOP LIVE RULES ===');
const top = [...live.hits.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
for (const [src, n] of top) console.log(`  ${String(n).padStart(6)}  ${src.slice(0, 70)}`);

console.log('\n=== RULES STILL DEAD AFTER COMPILING ===');
const silent = lex.MT_FIXES.map(([re]) => re.source).filter((s) => !live.hits.has(s));
console.log('  count:', silent.length);
for (const s of silent.slice(0, 12)) console.log('   ', s.slice(0, 70));

console.log('\n=== SAMPLE OUTPUTS ===');
const sampleTargets = [
  'بیشترین متوالی سود:',
  'مجموع تجارت:',
  'موقعیت های طولانی (برنده %):',
  'عامل سود:',
  'درادان نسبی:',
  'تایم فریم',
  'استاپ لاس',
  'پول باک',
  'تریدرها',
  'تریدرهای حرفه ای',
  'کندل استیک',
  'ناحیه عرضه و تقاضا',
  'دفترچه',
  'تاجران نهادی',
  'فروش کوتاه مدت',
  'حق‌السهم',
  'انگولف',
  'فراگیر',
];
for (const s of sampleTargets) {
  const out = lex.postEdit(s, '');
  console.log(`  ${(out === s ? '  (unchanged)' : '->').padEnd(12)} ${s}  =>  ${out}`);
}
