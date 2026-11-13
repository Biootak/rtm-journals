/*
 * Compare two OCR result files over the same image set.
 *
 * Usage: node ocr-eval.js a.jsonl b.jsonl [--diff]
 * Reports per-bucket line/character deltas and the actual text differences for
 * the images that changed, so a preprocessing or engine change is judged on
 * evidence rather than on a vibe.
 */
const fs = require('fs');
const path = require('path');

const [fileA, fileB] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const showDiff = process.argv.includes('--diff');
const SAMPLE = 'E:/Trade/journals/_build/ocr/sample';

function load(f) {
  const m = new Map();
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    if (o.hash && !o.error) m.set(o.hash, o);
  }
  return m;
}

const a = load(fileA);
const b = load(fileB);

const bucket = new Map();
const manifestPath = path.join(SAMPLE, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  const man = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  for (const [name, rows] of Object.entries(man)) for (const r of rows) bucket.set(r.hash, name);
}

const SPLIT = /(^|\s)[A-Za-z]{1,2}(\s|$)/;   // "Tota l", "Fa ctor", "12 m"
const norm = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/*
 * Damage is only meaningful as a rate: an engine that reads more text also
 * returns more short tokens. These are the split patterns the bake step already
 * knows how to repair, so the count tracks real defects, not yield.
 */
const REPORT = require('./report-labels.js');
const DAMAGE = REPORT.REPAIR.map(([re]) => re);
function damageCount(lines) {
  let n = 0;
  for (const t of lines) for (const re of DAMAGE) if (re.test(t)) { n++; break; }
  return n;
}
const rate = (a, b) => (b ? (100 * a) / b : 0).toFixed(1) + '%';

const hashes = [...new Set([...a.keys(), ...b.keys()])];
const sum = { aLines: 0, bLines: 0, aChars: 0, bChars: 0, aSplit: 0, bSplit: 0, aDmg: 0, bDmg: 0, aEmpty: 0, bEmpty: 0, newEmpty: 0, fixedEmpty: 0 };
const perBucket = new Map();
const changed = [];

for (const h of hashes) {
  const ra = a.get(h) || { lines: [] };
  const rb = b.get(h) || { lines: [] };
  const la = (ra.lines || []).map((l) => l.text);
  const lb = (rb.lines || []).map((l) => l.text);
  const ca = la.join('').length, cb = lb.join('').length;
  const sa = la.filter((t) => SPLIT.test(t)).length;
  const sb = lb.filter((t) => SPLIT.test(t)).length;
  const da = damageCount(la), db = damageCount(lb);
  sum.aLines += la.length; sum.bLines += lb.length;
  sum.aChars += ca; sum.bChars += cb;
  sum.aSplit += sa; sum.bSplit += sb;
  sum.aDmg += da; sum.bDmg += db;
  if (!la.length) sum.aEmpty++;
  if (!lb.length) sum.bEmpty++;
  if (la.length && !lb.length) sum.newEmpty++;
  if (!la.length && lb.length) sum.fixedEmpty++;

  const k = bucket.get(h) || 'other';
  const p = perBucket.get(k) || { n: 0, aLines: 0, bLines: 0, aChars: 0, bChars: 0, aDmg: 0, bDmg: 0 };
  p.n++; p.aLines += la.length; p.bLines += lb.length; p.aChars += ca; p.bChars += cb; p.aDmg += da; p.bDmg += db;
  perBucket.set(k, p);

  const setA = new Set(la.map(norm));
  const gained = lb.filter((t) => t && !setA.has(norm(t)));
  const lost = la.filter((t) => t && !new Set(lb.map(norm)).has(norm(t)));
  if (gained.length || lost.length) changed.push({ h, bucket: k, gained, lost });
}

console.log('images compared:', hashes.length);
console.log('             lines    chars   damaged-lines   empty-images');
console.log(`A (base)    ${sum.aLines}     ${sum.aChars}     ${sum.aDmg} (${rate(sum.aDmg, sum.aLines)})        ${sum.aEmpty}`);
console.log(`B (new)     ${sum.bLines}     ${sum.bChars}     ${sum.bDmg} (${rate(sum.bDmg, sum.bLines)})        ${sum.bEmpty}`);
console.log(`delta       ${sum.bLines - sum.aLines >= 0 ? '+' : ''}${sum.bLines - sum.aLines}     ${sum.bChars - sum.aChars >= 0 ? '+' : ''}${sum.bChars - sum.aChars}     ${sum.bDmg - sum.aDmg >= 0 ? '+' : ''}${sum.bDmg - sum.aDmg} (${rate(sum.bDmg, sum.bLines)} vs ${rate(sum.aDmg, sum.aLines)})    empty fixed: ${sum.fixedEmpty}, newly empty: ${sum.newEmpty}`);

console.log('\nper bucket');
for (const [k, p] of perBucket) {
  console.log(`  ${k.padEnd(7)} n=${String(p.n).padStart(2)}  lines ${p.aLines}->${p.bLines}  chars ${p.aChars}->${p.bChars}  damaged ${p.aDmg}(${rate(p.aDmg, p.aLines)})->${p.bDmg}(${rate(p.bDmg, p.bLines)})`);
}

if (showDiff) {
  console.log('\n=== TEXT CHANGES ===');
  for (const c of changed) {
    console.log(`\n${c.h.slice(0, 12)} [${c.bucket}]`);
    for (const t of c.gained.slice(0, 8)) console.log(`   + ${t}`);
    for (const t of c.lost.slice(0, 8)) console.log(`   - ${t}`);
  }
}
