// Progress + stream statistics for the running corpus OCR (OCR-10).
// Reads only complete JSON lines: a tail cut mid-write is skipped, not guessed at.
// Usage: node _build/ocr-progress.js [path]
const fs = require('fs');

const file = process.argv[2] || '_build/ocr/results-rapid.jsonl';
const text = fs.readFileSync(file, 'utf8');
let parts = text.split('\n');
if (!text.endsWith('\n')) parts.pop(); // the row still being written; not data yet

let ok = 0, err = 0, empty = 0, blocks = 0, secs = 0, lowScore = 0, linesTotal = 0;
const errors = [];
for (const line of parts) {
  if (!line.trim()) continue;
  let j;
  try { j = JSON.parse(line); } catch { continue; }
  if (j.error) { err++; errors.push(`${j.hash.slice(0, 10)} ${String(j.error).slice(0, 60)}`); continue; }
  ok++;
  secs += j.secs || 0;
  const al = (j.lines || []).filter(l => /[A-Za-z]{3,}/.test(l.text || ''));
  for (const l of al) { linesTotal++; if ((l.score ?? 1) < 0.6) lowScore++; }
  blocks += al.length;
  if (al.length === 0) empty++;
}

const mean = ok ? secs / ok : 0;
console.log(JSON.stringify({
  rows: ok + err, ok, err,
  seconds_per_image: +mean.toFixed(2),
  alphabetic_blocks_per_image: +(blocks / Math.max(1, ok)).toFixed(1),
  images_with_no_text_pct: +(100 * empty / Math.max(1, ok)).toFixed(1),
  lines_below_0_6_confidence_pct: +(100 * lowScore / Math.max(1, linesTotal)).toFixed(1),
  file_mb: +(fs.statSync(file).size / 1048576).toFixed(1),
}, null, 2));
if (errors.length) console.log('errors:\n  ' + errors.join('\n  '));
