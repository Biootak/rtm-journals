/*
 * Resumable OCR runner using the built-in Windows.Media.Ocr engine.
 *
 * Usage:
 *   node ocr-run.js [--limit 50] [--chunk 400] [--journal if] [--retry]
 *
 * Results are appended to _build/ocr/results.jsonl.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = 'E:/Trade/journals';
const BUILD = path.join(ROOT, '_build');
const OCR_DIR = path.join(BUILD, 'ocr');
const LIST_DIR = path.join(OCR_DIR, 'lists');
const RESULT = path.join(OCR_DIR, 'results.jsonl');
const PS1 = path.join(BUILD, 'ocr.ps1');
fs.mkdirSync(LIST_DIR, { recursive: true });

const args = process.argv.slice(2);
function argVal(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
}
const LIMIT = parseInt(argVal('--limit', '0'), 10) || 0;
const CHUNK = parseInt(argVal('--chunk', '400'), 10) || 400;
const JOURNAL = argVal('--journal', '');
const RETRY = args.includes('--retry');

const images = JSON.parse(fs.readFileSync(path.join(BUILD, 'images.json'), 'utf8'));

// Read previous results.
const done = new Map();
if (fs.existsSync(RESULT)) {
  for (const line of fs.readFileSync(RESULT, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const o = JSON.parse(line);
      if (o.hash) done.set(o.hash, o.error ? 'error' : 'ok');
    } catch {}
  }
}
console.log(`Already processed: ${done.size}`);

let queue = images.filter(im => {
  if (!im.hash || im.hash.startsWith('remote_')) return false;
  if (!/\.(?:jpe?g|png|gif|webp|bmp)$/i.test(im.asset || '')) return false;
  if ((Number(im.bytes) || 0) < 512) return false;
  if (JOURNAL && im.journalId !== JOURNAL) return false;
  if (!im.asset || !fs.existsSync(path.join(ROOT, 'site', im.asset))) return false;
  const state = done.get(im.hash);
  if (state === 'ok') return false;
  if (state === 'error' && !RETRY) return false;
  return true;
});

// Process the biggest/most informative images first.
queue.sort((a, b) => (b.bytes || 0) - (a.bytes || 0));
if (LIMIT) queue = queue.slice(0, LIMIT);
console.log(`Queued: ${queue.length}`);

let batchNo = 0;
for (let i = 0; i < queue.length; i += CHUNK) {
  const batch = queue.slice(i, i + CHUNK);
  batchNo++;
  const listPath = path.join(LIST_DIR, `batch-${String(batchNo).padStart(4, '0')}.tsv`);
  const outPath = path.join(OCR_DIR, `batch-${String(batchNo).padStart(4, '0')}.jsonl`);
  const lines = batch.map(im => `${im.hash}\t${path.join(ROOT, 'site', im.asset)}`);
  fs.writeFileSync(listPath, lines.join('\r\n'), 'utf8');
  console.log(`\n=== Batch ${batchNo}: ${batch.length} images ===`);
  const res = spawnSync('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-File', PS1,
    '-ListPath', listPath,
    '-OutPath', outPath,
  ], { stdio: 'inherit', windowsHide: true });
  if (res.error) console.error('PowerShell error:', res.error.message);
  if (fs.existsSync(outPath)) {
    fs.appendFileSync(RESULT, fs.readFileSync(outPath));
  }
  if (res.status !== 0) {
    console.error('Batch failed with status', res.status);
    break;
  }
}
console.log('\nOCR run complete.');
