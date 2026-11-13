/*
 * Merge reviewer fix files into the per-page verdict files.
 *
 *   node _build/expert/merge-fixes.js _build/expert/fixes-flag-set-1.json ...
 *
 * Each input is `{ "<post id>": { ok, issue, why, fix } }`. The page file is
 * `review/<journal>-p<N>.review.json`, derived from the id (`if_p63_25` ->
 * `if-p63`). A later file wins for the same id.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.env.JOURNALS_ROOT || path.resolve(__dirname, '..', '..');
const REVIEW = path.join(ROOT, '_build/expert/review');

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: merge-fixes.js <fix-file.json> ...');
  process.exit(1);
}

const pageOf = id => {
  const m = /^(.+)_p(\d+)_\d+$/.exec(id);
  return m ? `${m[1]}-p${m[2]}` : null;
};

const byPage = new Map();
for (const file of files) {
  const abs = path.isAbsolute(file) ? file : path.join(ROOT, file);
  const data = JSON.parse(fs.readFileSync(abs, 'utf8'));
  for (const [id, entry] of Object.entries(data)) {
    const page = pageOf(id);
    if (!page) { console.error('skip (bad id)', id); continue; }
    if (!entry || !entry.fix) { console.error('skip (no fix)', id); continue; }
    if (!byPage.has(page)) byPage.set(page, new Map());
    byPage.get(page).set(id, { issue: entry.issue || '', why: entry.why || '', fix: entry.fix });
  }
}

let written = 0; let entries = 0;
for (const [page, map] of byPage) {
  const file = path.join(REVIEW, page + '.review.json');
  let current = {};
  if (fs.existsSync(file)) {
    try { current = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { current = {}; }
  }
  for (const [id, entry] of map) { current[id] = entry; entries++; }
  fs.writeFileSync(file, JSON.stringify(current, null, 1), 'utf8');
  written++;
}
console.log('pages', written, '| entries', entries);
