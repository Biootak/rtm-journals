/*
 * OCR sampling for engine and preprocessing measurement.
 *
 *   --mode stratified (default) — picks images across the failure classes so an
 *     engine or preprocessing change can be measured instead of eyeballed:
 *       empty   - Windows OCR returned zero lines
 *       split   - a line ending in a 1-2 letter lowercase token ("Tota l")
 *       short   - very few lines for a big image (text missed)
 *       dense   - many lines (statements and tables, the text we most need)
 *       small   - tiny images, usually icons and decorations
 *       normal  - everything else, as a control
 *     Good for A/B. Deliberately biased, so it must not be used to estimate
 *     corpus-wide rates such as how often an image hits the block cap.
 *
 *   --mode random --n 150 — a deterministic uniform draw over all decoded
 *     images, for the corpus-wide rates.
 *
 * Writes _build/ocr/sample/<name>.tsv plus a manifest with the baseline text so
 * the same hashes can be compared run over run.
 *
 * Usage: node ocr-sample.js --per 6
 *        node ocr-sample.js --mode random --n 150
 */
const fs = require('fs');
const path = require('path');

const BUILD = 'E:/Trade/journals/_build';
const OCR_DIR = path.join(BUILD, 'ocr');
const SAMPLE_DIR = path.join(OCR_DIR, 'sample');

const args = process.argv.slice(2);
const argVal = (n, f) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : f; };
const PER = parseInt(argVal('--per', '6'), 10) || 6;
const MODE = argVal('--mode', 'stratified');
const N = parseInt(argVal('--n', '150'), 10) || 150;

const images = JSON.parse(fs.readFileSync(path.join(BUILD, 'images.json'), 'utf8'));
const results = new Map();
for (const line of fs.readFileSync(path.join(OCR_DIR, 'results.jsonl'), 'utf8').split(/\r?\n/)) {
  if (!line.trim()) continue;
  try { const o = JSON.parse(line); if (o.hash && !o.error) results.set(o.hash, o); } catch {}
}

const SPLIT = /\s[a-z]{1,2}$/;
const buckets = { empty: [], split: [], short: [], dense: [], small: [], normal: [] };
const poolAll = [];

for (const im of images) {
  const r = results.get(im.hash);
  if (!r) continue;
  const lines = r.lines || [];
  const bytes = Number(im.bytes) || 0;
  const textChars = lines.reduce((a, l) => a + String(l.text || '').length, 0);
  const rec = {
    hash: im.hash,
    asset: im.asset,
    journalId: im.journalId,
    bytes,
    lines: lines.length,
    chars: textChars,
    baseline: lines.map((l) => l.text),
    dim: [r.width, r.height],
  };
  poolAll.push(rec);
  if (lines.length === 0) buckets.empty.push(rec);
  else if (bytes < 15000) buckets.small.push(rec);
  else if (lines.some((l) => SPLIT.test(String(l.text || '').trim()))) buckets.split.push(rec);
  else if (textChars < 60 && bytes > 60000) buckets.short.push(rec);
  else if (lines.length >= 25) buckets.dense.push(rec);
  else buckets.normal.push(rec);
}

// Spread each bucket over different journals, then take the biggest first
// inside a journal so we sample the text-rich images rather than decorations.
function pick(list, n) {
  const byJournal = new Map();
  for (const rec of list) {
    if (!byJournal.has(rec.journalId)) byJournal.set(rec.journalId, []);
    byJournal.get(rec.journalId).push(rec);
  }
  for (const arr of byJournal.values()) arr.sort((a, b) => b.bytes - a.bytes);
  const out = [];
  const keys = [...byJournal.keys()];
  let round = 0;
  while (out.length < n && round < 20) {
    for (const k of keys) {
      const arr = byJournal.get(k);
      if (arr[round]) out.push(arr[round]);
      if (out.length >= n) break;
    }
    round++;
  }
  return out;
}

fs.mkdirSync(SAMPLE_DIR, { recursive: true });

// Deterministic draw so a later run measures the same images.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

if (MODE === 'all') {
  // Every image that actually exists on disk, whether or not Windows OCR ever
  // read it. This is the work list for a corpus run.
  const out = [];
  let missing = 0;
  for (const im of images) {
    const p = path.join('E:/Trade/journals/site', im.asset);
    if (!fs.existsSync(p)) { missing++; continue; }
    out.push(`${im.hash}\t${p}`);
  }
  fs.writeFileSync(path.join(SAMPLE_DIR, 'full.tsv'), out.join('\r\n'), 'utf8');
  console.log(`full: ${out.length} images on disk (${missing} entries missing) -> full.tsv`);
  process.exit(0);
}

if (MODE === 'random') {
  const rand = mulberry32(0x5EED);
  const chosen = [];
  const taken = new Set();
  while (chosen.length < Math.min(N, poolAll.length) && taken.size < poolAll.length) {
    const i = Math.floor(rand() * poolAll.length);
    if (taken.has(i)) continue;
    taken.add(i);
    chosen.push(poolAll[i]);
  }
  const tsv = chosen.map((c) => `${c.hash}\t${path.join('E:/Trade/journals/site', c.asset)}`).join('\r\n');
  fs.writeFileSync(path.join(SAMPLE_DIR, 'random.tsv'), tsv, 'utf8');
  fs.writeFileSync(path.join(SAMPLE_DIR, 'manifest-random.json'), JSON.stringify(chosen, null, 1), 'utf8');
  console.log(`random: ${chosen.length} of ${poolAll.length} decoded images -> random.tsv`);
  process.exit(0);
}

const manifest = {};
const all = [];
for (const [name, list] of Object.entries(buckets)) {
  const chosen = pick(list, PER);
  manifest[name] = chosen;
  all.push(...chosen.map((c) => ({ ...c, bucket: name })));
  const tsv = chosen.map((c) => `${c.hash}\t${path.join('E:/Trade/journals/site', c.asset)}`).join('\r\n');
  fs.writeFileSync(path.join(SAMPLE_DIR, `${name}.tsv`), tsv, 'utf8');
  console.log(`${name.padEnd(7)} pool ${String(list.length).padStart(5)}  picked ${String(chosen.length).padStart(3)}`);
}
// One combined list so a single PowerShell run covers every class.
const tsvAll = all.map((c) => `${c.hash}\t${path.join('E:/Trade/journals/site', c.asset)}`).join('\r\n');
fs.writeFileSync(path.join(SAMPLE_DIR, 'all.tsv'), tsvAll, 'utf8');
fs.writeFileSync(path.join(SAMPLE_DIR, 'manifest.json'), JSON.stringify(manifest, null, 1), 'utf8');
console.log('total sampled:', all.length, '->', path.join(SAMPLE_DIR, 'all.tsv'));
