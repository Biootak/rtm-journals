/*
 * OCR coverage + quality census.
 *
 * Answers: how many images were even attempted, how many returned nothing,
 * how fragmented the returned lines are, and what the known damage costs us.
 * Read-only; prints a report.
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'E:/Trade/journals';
const BUILD = path.join(ROOT, '_build');
const IMAGES = path.join(BUILD, 'images.json');
const RESULT = path.join(BUILD, 'ocr', 'results.jsonl');

const images = JSON.parse(fs.readFileSync(IMAGES, 'utf8'));
const byHash = new Map();
for (const im of images) if (im.hash) byHash.set(im.hash, im);

const results = new Map();
const errors = new Map();
for (const line of fs.readFileSync(RESULT, 'utf8').split(/\r?\n/)) {
  if (!line.trim()) continue;
  let o;
  try { o = JSON.parse(line); } catch { continue; }
  if (!o.hash) continue;
  if (o.error) errors.set(o.hash, o.error);
  else results.set(o.hash, o);
}

const extOf = (a) => (String(a).match(/\.(jpe?g|png|gif|webp|bmp|svg)$/i) || [, 'none'])[1].toLowerCase();

/* ---- coverage ---- */
const kind = new Map();
const attempted = new Set([...results.keys(), ...errors.keys()]);
let neverQueued = 0;
const neverList = [];
for (const im of images) {
  const h = im.hash || '';
  const k = h.startsWith('remote_') ? 'remote' : extOf(im.asset || '');
  kind.set(k, (kind.get(k) || 0) + 1);
  if (!attempted.has(h)) { neverQueued++; if (neverList.length < 8) neverList.push(im); }
}

/* ---- fragmentation over the lines we did get ---- */
let lineCount = 0, shortLine = 0, singleWord = 0, noEndPunct = 0, imagesWithLines = 0;
const digitSplit = [];   // "Tota l" style: a line whose last token is 1-2 letters
const lowerStart = [];
const suspicious = new Map();
for (const r of results.values()) {
  const ls = r.lines || [];
  if (ls.length) imagesWithLines++;
  for (const l of ls) {
    lineCount++;
    const t = String(l.text || '').trim();
    if (t.length < 3) shortLine++;
    const toks = t.split(/\s+/);
    if (toks.length === 1) singleWord++;
    if (!/[.!?:;)%\]"']$/.test(t)) noEndPunct++;
    const last = toks[toks.length - 1] || '';
    if (/^[a-z]{1,2}$/.test(last)) digitSplit.push(t);
    if (/^[a-z]/.test(t) && toks.length > 2) lowerStart.push(t);
    for (const w of toks) {
      if (/^(Tota|Fa|Consecutiv|Rclativ|Mur|Thl|weekl|bee|nobud|pouck|excpect|opps|intrest|importan|possibley|Off|E r)$/.test(w)) {
        suspicious.set(w, (suspicious.get(w) || 0) + 1);
      }
    }
  }
}

function top(map, n) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

const pct = (a, b) => (100 * a / Math.max(b, 1)).toFixed(1) + '%';

console.log('=== IMAGE CENSUS ===');
console.log('images.json entries:', images.length, '| unique hashes:', byHash.size);
for (const [k, v] of [...kind.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${k.padEnd(6)} ${String(v).padStart(6)}  ${pct(v, images.length)}`);
}
console.log('attempted (ok+error):', attempted.size, '| ok:', results.size, '| errored:', errors.size);
console.log('never attempted:', neverQueued, '| attempted but 0 lines:', results.size - imagesWithLines);
console.log('images that produced >=1 line:', imagesWithLines, `(${pct(imagesWithLines, results.size)} of decoded)`);

console.log('\n=== LINE QUALITY ===');
console.log('lines total:', lineCount);
console.log('  shorter than 3 chars:', shortLine, pct(shortLine, lineCount));
console.log('  single word:', singleWord, pct(singleWord, lineCount));
console.log('  no terminal punctuation:', noEndPunct, pct(noEndPunct, lineCount));
console.log('  end in a 1-2 letter lowercase token (mid-word split):', digitSplit.length);
console.log('  start lowercase mid-sentence-ish:', lowerStart.length);
console.log('  avg lines/image:', (lineCount / Math.max(results.size, 1)).toFixed(2));

console.log('\n=== KNOWN DAMAGE TOKENS ===');
for (const [w, n] of top(suspicious, 15)) console.log(`  ${w}: ${n}`);

console.log('\n=== SAMPLES ===');
for (const t of digitSplit.slice(0, 10)) console.log('  split?', JSON.stringify(t));
for (const t of lowerStart.slice(0, 6)) console.log('  case?', JSON.stringify(t));

console.log('\n=== ERRORS ===');
const errKinds = new Map();
for (const msg of errors.values()) {
  const key = String(msg).slice(0, 70);
  errKinds.set(key, (errKinds.get(key) || 0) + 1);
}
for (const [m, n] of top(errKinds, 8)) console.log(`  ${n}x ${m}`);

console.log('\n=== NEVER-ATTEMPTED SAMPLES ===');
for (const im of neverList) console.log(`  ${im.hash} ${im.ext || '?'} ${im.bytes || 0}b ${String(im.asset || '').split('/').pop()}`);
