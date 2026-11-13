/* What is still not hand-translated, grouped by journal page.
 * Reads the parsed corpus, the expert store and every batch file.
 * Usage: node _build/expert/remaining.js [--json]
 * Read-only. Emits _build/expert/remaining.json.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const BUILD = path.join(ROOT, '_build');
const read = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };

const normalize = t => String(t || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n').trim();
const hashOf = t => crypto.createHash('sha1').update(normalize(t)).digest('hex');

const parsed = read(path.join(BUILD, 'parsed.json'), { journals: [] });
const expert = { ...read(path.join(BUILD, 'expert', 'posts.json'), {}) };
const batchDir = path.join(BUILD, 'expert', 'batches');
for (const f of fs.readdirSync(batchDir).filter(n => n.endsWith('.json'))) {
  Object.assign(expert, read(path.join(batchDir, f), {}));
}

const workDir = path.join(BUILD, 'expert', 'work');
const workFiles = new Set(fs.readdirSync(workDir).filter(n => n.endsWith('.json')));

const pages = {};
for (const journal of parsed.journals || []) {
  for (const post of journal.posts || []) {
    const text = String(post.text || '').trim();
    if (!text) continue;
    const hash = hashOf(text);
    if (Object.prototype.hasOwnProperty.call(expert, hash)) continue;
    const page = post.pageNum || 1;
    const key = journal.id + '-p' + page;
    if (!pages[key]) pages[key] = { journal: journal.id, page, posts: [] };
    pages[key].posts.push({ id: post.id || hash.slice(0, 8), hash, chars: text.length });
  }
}

const list = Object.values(pages).sort((a, b) =>
  a.journal === b.journal ? a.page - b.page : a.journal.localeCompare(b.journal));
for (const p of list) {
  p.work = workFiles.has(p.journal + '-p' + p.page + '.json');
  p.batch = fs.existsSync(path.join(batchDir, p.journal + '-p' + p.page + '.json'));
}
const out = {
  generatedAt: new Date().toISOString(),
  pages: list.length,
  posts: list.reduce((n, p) => n + p.posts.length, 0),
  chars: list.reduce((n, p) => n + p.posts.reduce((m, x) => m + x.chars, 0), 0),
  missingWork: list.filter(p => !p.work).map(p => p.journal + ' p' + p.page),
  byJournal: {},
  detail: list,
};
for (const p of list) {
  const j = out.byJournal[p.journal] || (out.byJournal[p.journal] = { pages: 0, posts: 0, chars: 0 });
  j.pages++; j.posts += p.posts.length; j.chars += p.posts.reduce((m, x) => m + x.chars, 0);
}

fs.writeFileSync(path.join(BUILD, 'expert', 'remaining.json'), JSON.stringify(out, null, 1));
if (process.argv.includes('--json')) { console.log(JSON.stringify(out, null, 1)); process.exit(0); }

console.log(`remaining: ${out.posts} posts in ${out.pages} pages (${out.chars} chars)`);
console.log(`pages needing a work file: ${out.missingWork.length}${out.missingWork.length ? ' — ' + out.missingWork.slice(0, 12).join(', ') + (out.missingWork.length > 12 ? ' …' : '') : ''}`);
console.log('journal        pages  posts  chars');
for (const [id, j] of Object.entries(out.byJournal).sort((a, b) => b[1].posts - a[1].posts)) {
  console.log(id.padEnd(14), String(j.pages).padStart(4), String(j.posts).padStart(7), String(j.chars).padStart(7));
}
