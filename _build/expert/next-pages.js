/*
 * Pick the next pages to translate and split them into balanced agent groups.
 *
 *   node _build/expert/next-pages.js --pages 60 --agents 6
 *     → prints one line per agent: "A: page1,page2,… (N posts)"
 *
 * Ordering is smallest page first, so journals close out one at a time and a
 * wave always leaves whole threads finished rather than half-open ones.
 * A page counts as done when every unique hash in its work file has a
 * non-empty Persian entry in the batch.
 */
const fs = require('fs');
const path = require('path');

const WORK = path.join(__dirname, 'work');
const BATCHES = path.join(__dirname, 'batches');

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? Number(args[i + 1]) : d; };
const budget = flag('--pages', 60);
const agents = flag('--agents', 6);

/* Pages already handed to running agents must not be handed out twice:
   from-draft.js rewrites the whole batch, so two agents on one page lose work. */
const busy = new Set();
if (fs.existsSync(path.join(__dirname, 'WAVE.json'))) {
  try {
    const wave = JSON.parse(fs.readFileSync(path.join(__dirname, 'WAVE.json'), 'utf8'));
    for (const f of wave.expect || []) busy.add(String(f).replace(/\.json$/, ''));
  } catch { /* ignore */ }
}

const rows = [];
for (const name of fs.readdirSync(WORK).filter(n => n.endsWith('.json'))) {
  const page = name.slice(0, -5);
  if (busy.has(page)) continue;
  let work;
  try { work = JSON.parse(fs.readFileSync(path.join(WORK, name), 'utf8')); } catch { continue; }
  const hashes = [...new Set(work.map(w => w.hash))];
  if (!hashes.length) continue;
  let batch = {};
  const bf = path.join(BATCHES, name);
  if (fs.existsSync(bf)) { try { batch = JSON.parse(fs.readFileSync(bf, 'utf8')); } catch { batch = {}; } }
  const missing = hashes.filter(h => !(typeof batch[h] === 'string' && batch[h].trim())).length;
  if (!missing) continue;
  rows.push({ page, missing, total: hashes.length });
}

rows.sort((a, b) => a.total - b.total || a.missing - b.missing);
const picked = rows.slice(0, budget);

/* Greedy balance: biggest remaining page into the lightest group. */
const groups = Array.from({ length: agents }, () => ({ pages: [], posts: 0 }));
for (const row of [...picked].sort((a, b) => b.missing - a.missing)) {
  groups.sort((a, b) => a.posts - b.posts);
  groups[0].pages.push(row.page);
  groups[0].posts += row.missing;
}

let totalPosts = 0;
groups.forEach((g, i) => {
  totalPosts += g.posts;
  console.log(String.fromCharCode(65 + i) + ': ' + g.pages.join(',') + '  (' + g.posts + ' posts)');
});
console.log('---');
console.log('picked ' + picked.length + ' pages, ' + totalPosts + ' posts');
console.log('queue left: ' + (rows.length - picked.length) + ' pages, ' +
  rows.slice(picked.length).reduce((s, r) => s + r.missing, 0) + ' posts');
