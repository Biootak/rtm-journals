/*
 * Build review packets for the hand-translated layer.
 *
 *   node _build/expert/review-packet.js --journal if --pages 41-45
 *     → _build/expert/review/if-p41.txt … (EN + FA side by side, one post at a time)
 *
 * A reviewer reads the packet, then writes
 *   _build/expert/review/if-p41.json
 *   { "<id>": { "ok": true } | { "ok": false, "issue": "…", "fix": "<FA replacement>" } }
 * Only posts that are wrong need an entry; missing ids are treated as approved.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.env.JOURNALS_ROOT || path.resolve(__dirname, '..', '..');
const WORK = path.join(ROOT, '_build/expert/work');
const BATCHES = path.join(ROOT, '_build/expert/batches');
const STORE = path.join(ROOT, '_build/expert/posts.json');
const OUT = path.join(ROOT, '_build/expert/review');

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const parsePages = s => String(s || '').split(',').flatMap(part => {
  const m = part.match(/^(\d+)-(\d+)$/);
  if (!m) return [Number(part)];
  const out = [];
  for (let i = +m[1]; i <= +m[2]; i++) out.push(i);
  return out;
}).filter(Boolean);

const journal = String(flag('--journal', 'if')).toLowerCase();
const pages = parsePages(flag('--pages', '1'));
const store = fs.existsSync(STORE) ? JSON.parse(fs.readFileSync(STORE, 'utf8')) : {};

fs.mkdirSync(OUT, { recursive: true });
for (const page of pages) {
  const base = `${journal}-p${page}`;
  const workFile = path.join(WORK, base + '.json');
  const batchFile = path.join(BATCHES, base + '.json');
  if (!fs.existsSync(workFile)) { console.log('skip', base); continue; }
  const work = JSON.parse(fs.readFileSync(workFile, 'utf8'));
  const batch = fs.existsSync(batchFile) ? JSON.parse(fs.readFileSync(batchFile, 'utf8')) : {};
  const lines = [];
  let n = 0;
  for (const w of work) {
    const fa = String(batch[w.hash] || store[w.hash] || '').trim();
    if (!fa) continue;
    n++;
    lines.push(`### ${w.id}`);
    lines.push(`EN: ${w.text.replace(/\n{2,}/g, '\n\n')}`);
    lines.push(`FA: ${fa}`);
    lines.push('');
  }
  const file = path.join(OUT, base + '.txt');
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  console.log('packet', path.relative(ROOT, file), n, 'posts');
}
