/*
 * Expert translation queue.
 *
 * Builds the work list for the human pass: every OCR line that the archive
 * shows Persian for (or should), deduplicated, ordered by how many times it
 * occurs, so the first entries fix the most pictures. Already-authored lines
 * are dropped from the list, which makes the job resumable.
 *
 *   node translation-queue.js            # rewrite _build/expert/queue-ocr.json
 *   node translation-queue.js --stats    # only print progress
 */
const fs = require('fs');
const path = require('path');

const lex = require('./lexicon.js');
const policy = require('./translation-policy.js');
const expert = require('./expert-store.js');

const BUILD = 'E:/Trade/journals/_build';
const RAW = path.join(BUILD, 'ocr', 'translations.json');
const QUEUE = path.join(BUILD, 'expert', 'queue-ocr.json');

const STATS_ONLY = process.argv.includes('--stats');

/* Only the classes that need a trader's judgement: machine output that may be
   wrong, and lines the archive currently shows without any Persian. The
   dictionary classes are already term-for-term. */
const modeArg = (process.argv.find(a => a.startsWith('--modes=')) || '').split('=')[1];
const MODES = (modeArg || 'machine,untranslated').split(',').filter(Boolean);

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

const raw = readJson(RAW, {});
const counts = new Map();

for (const entry of Object.values(raw)) {
  if (!entry || !Array.isArray(entry.blocks)) continue;
  for (const b of entry.blocks) {
    const original = String(b.original || '').trim();
    if (!original) continue;
    const key = expert.ocrKey(original);
    if (!key) continue;
    const prev = counts.get(key);
    if (prev) { prev.n++; continue; }
    const kind = policy.classify(original);
    if (kind === 'empty' || kind === 'chrome' || kind === 'noise') continue;
    const r = policy.renderBlock(original, lex.cleanText(b.persian || ''));
    counts.set(key, { key, en: lex.cleanText(original), n: 1, mode: r.mode, ref: r.fa || '' });
  }
}

const all = Array.from(counts.values()).sort((a, b) => b.n - a.n || a.en.localeCompare(b.en));
const authored = readJson(path.join(BUILD, 'expert', 'ocr.json'), {});
const queueAll = all.filter(row => MODES.includes(row.mode));
const skipped = all.length - queueAll.length;
const open = queueAll.filter(row => !Object.prototype.hasOwnProperty.call(authored, row.key));

const covered = queueAll.reduce((s, r) => s + r.n, 0);
const authoredOcc = queueAll.reduce((s, r) => s + (Object.prototype.hasOwnProperty.call(authored, r.key) ? r.n : 0), 0);

console.log(`صف (حالت‌های ${MODES.join('+')}): ${queueAll.length} کلید یک‌سان‌شده  |  occurrences: ${covered}  |  بایکот از واژه‌نامه: ${skipped}`);
console.log(`  نوشته‌شده: ${Object.keys(authored).length} کلید، ${authoredOcc} occurrence`);
console.log(`  مانده:     ${open.length} کلید، ${covered - authoredOcc} occurrence`);
const byMode = {};
for (const r of open) byMode[r.mode] = (byMode[r.mode] || 0) + 1;
console.log('  برچسب فعلی در صف:', JSON.stringify(byMode));

if (!STATS_ONLY) {
  fs.writeFileSync(QUEUE, JSON.stringify(open, null, 0), 'utf8');
  console.log(`نوشته شد: ${QUEUE}`);
  console.log('\n۱۵ صف اول:');
  open.slice(0, 15).forEach(r => console.log(`  ${String(r.n).padStart(3)}  ${r.en.slice(0, 58)}  ⟵ ${r.ref.slice(0, 44)}`));
}
