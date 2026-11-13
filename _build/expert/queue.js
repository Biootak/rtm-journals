/*
 * Turn remaining.json into an assignment queue for the translation waves.
 *
 *   node _build/expert/queue.js [--limit N] [--json]
 *
 * Smallest threads first: a translator finishes whole journals instead of
 * leaving every thread half translated. Each row is one page with its post
 * count, so a wave can be balanced by work, not by page number.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const remaining = JSON.parse(fs.readFileSync(path.join(__dirname, 'remaining.json'), 'utf8'));
const limit = Number((process.argv.find(a => a.startsWith('--limit=')) || '').slice(8)) || 0;

const rows = remaining.detail.map(p => ({
  page: `${p.journal}-p${p.page}`,
  journal: p.journal,
  number: p.page,
  posts: p.posts.length,
  chars: p.posts.reduce((n, x) => n + x.chars, 0),
  work: p.work,
}));

const byJournal = new Map();
for (const row of rows) {
  if (!byJournal.has(row.journal)) byJournal.set(row.journal, []);
  byJournal.get(row.journal).push(row);
}
const groups = [...byJournal.entries()].map(([id, pages]) => ({
  id,
  pages: pages.length,
  posts: pages.reduce((n, p) => n + p.posts, 0),
  chars: pages.reduce((n, p) => n + p.chars, 0),
  list: pages.sort((a, b) => a.number - b.number),
}));
groups.sort((a, b) => a.pages - b.pages || a.posts - b.posts);

const selected = limit ? groups.slice(0, limit) : groups;
const out = {
  generatedAt: new Date().toISOString(),
  pages: selected.reduce((n, g) => n + g.pages, 0),
  posts: selected.reduce((n, g) => n + g.posts, 0),
  groups: selected,
};
fs.writeFileSync(path.join(__dirname, 'queue.json'), JSON.stringify(out, null, 1));

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(out, null, 1));
  process.exit(0);
}
for (const g of selected) {
  console.log(`${g.id.padEnd(18)} pages ${String(g.pages).padStart(3)} posts ${String(g.posts).padStart(5)} | ${g.list.map(p => p.number).join(',')}`);
}
console.log(`queue: ${out.pages} pages, ${out.posts} posts in ${selected.length} threads`);
