/*
 * Progress of the current wave, page by page.
 *   node _build/expert/wave-progress.js
 */
const fs = require('fs');
const path = require('path');

const WAVE = path.join(__dirname, 'WAVE.json');
const WORK = path.join(__dirname, 'work');
const BATCHES = path.join(__dirname, 'batches');

const wave = JSON.parse(fs.readFileSync(WAVE, 'utf8'));
let done = 0;
let missing = 0;
const pending = [];
for (const file of wave.expect || []) {
  const wp = path.join(WORK, file);
  if (!fs.existsSync(wp)) continue;
  const work = JSON.parse(fs.readFileSync(wp, 'utf8'));
  const hashes = [...new Set(work.map(w => w.hash))];
  let batch = {};
  const bp = path.join(BATCHES, file);
  if (fs.existsSync(bp)) { try { batch = JSON.parse(fs.readFileSync(bp, 'utf8')); } catch { batch = {}; } }
  const m = hashes.filter(h => !(typeof batch[h] === 'string' && batch[h].trim())).length;
  if (!m) done++;
  else { missing += m; pending.push([file.slice(0, -5), m]); }
}
console.log('wave ' + wave.name + ' — pages done ' + done + '/' + (wave.expect || []).length +
  ', posts missing ' + missing);
if (pending.length) {
  pending.sort((a, b) => b[1] - a[1]);
  console.log('pending: ' + pending.slice(0, 12).map(([p, m]) => p + '(' + m + ')').join(', '));
}
