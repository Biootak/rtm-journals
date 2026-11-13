/*
 * Re-key the batches of a named set of pages after a source re-import.
 *
 * A batch is keyed by SHA-1 of the English text. When parsed.json is re-imported
 * (Dr Swing was re-imported at 03:35 and moved 227 hashes), the batch keys no
 * longer match the work file and the validator reports "stale source hash".
 * The translations themselves are still good: the post id did not move and the
 * paragraph count is what the reader aligns on.
 *
 *   node _build/expert/_rekey-pages.js <journal> <pages>   e.g. drswing 1-20
 *
 * For each page: keep the old work+batch in _rekey-backup/, regenerate the work
 * file from the current corpus, then carry every translation across by post id.
 * A post whose paragraph count changed is left untranslated rather than guessed.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const WORK = path.join(__dirname, 'work');
const BATCHES = path.join(__dirname, 'batches');
const BACKUP = path.join(__dirname, '_rekey-backup');

const journal = process.argv[2];
const spec = process.argv[3] || '';
if (!journal) { console.error('usage: _rekey-pages.js <journal> <pages>'); process.exit(1); }

const pages = String(spec).split(',').flatMap(part => {
  const m = part.match(/^(\d+)-(\d+)$/);
  if (!m) return [Number(part)];
  const out = [];
  for (let i = +m[1]; i <= +m[2]; i++) out.push(i);
  return out;
}).filter(Boolean);

const paragraphs = s => String(s || '').split(/\n{2,}/).filter(x => x.trim()).length;
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };

fs.mkdirSync(BACKUP, { recursive: true });

/* Snapshot first: a crash mid-way must not leave a half-migrated page. */
const before = new Map();
for (const page of pages) {
  const name = `${journal}-p${page}.json`;
  const w = readJson(path.join(WORK, name), []);
  const b = readJson(path.join(BATCHES, name), {});
  before.set(name, { w, b });
  fs.writeFileSync(path.join(BACKUP, name.replace(/\.json$/, '.work.json')), JSON.stringify(w), 'utf8');
  fs.writeFileSync(path.join(BACKUP, name.replace(/\.json$/, '.batch.json')), JSON.stringify(b), 'utf8');
}

/* Regenerate the work files from the current corpus. */
execFileSync(process.execPath, [path.join(__dirname, 'workflow.js'), '--journal', journal, '--pages', pages.join(',')], { stdio: 'inherit' });

let carried = 0;
let dropped = 0;
const drops = [];
for (const page of pages) {
  const name = `${journal}-p${page}.json`;
  const old = before.get(name);
  if (!old) continue;
  const oldById = new Map(old.w.map(w => [w.id, w]));
  const newWork = readJson(path.join(WORK, name), []);
  const out = {};
  for (const row of newWork) {
    const prev = oldById.get(row.id);
    if (!prev) { dropped++; drops.push(row.id + ' new post'); continue; }
    const fa = old.b[prev.hash];
    if (typeof fa !== 'string' || !fa.trim()) { dropped++; drops.push(row.id + ' no translation'); continue; }
    if (paragraphs(prev.text) !== paragraphs(row.text)) {
      dropped++;
      drops.push(row.id + ' paragraphs ' + paragraphs(prev.text) + ' -> ' + paragraphs(row.text));
      continue;
    }
    out[row.hash] = fa;
    carried++;
  }
  fs.writeFileSync(path.join(BATCHES, name), JSON.stringify(out, null, 1), 'utf8');
}

console.log('carried ' + carried + ' | dropped ' + dropped);
if (drops.length) console.log(drops.slice(0, 30).join('\n'));
