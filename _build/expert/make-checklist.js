#!/usr/bin/env node
/*
 * Build the review checklist from the corpus, the strict audit and the
 * reviewed ledger.
 *
 *   node _build/expert/audit-strict.js --write   # refresh strict-report.json
 *   node _build/expert/make-checklist.js         # rewrite CHECKLIST.md/.json
 *
 * A page is checked only when reviewed.json records a completed rewrite for it
 * and the latest strict snapshot has no flags on it. Everything else is listed
 * with its current flag count, so the checklist cannot claim work that the
 * data does not support.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const BUILD = path.join(ROOT, '_build');
const REPORT = path.join(__dirname, 'strict-report.json');
const REVIEWED = path.join(__dirname, 'reviewed.json');
const OUT_MD = path.join(__dirname, 'CHECKLIST.md');
const OUT_JSON = path.join(__dirname, 'CHECKLIST.json');

const readJson = (f, fallback) => {
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return fallback; }
};

const parsed = readJson(path.join(BUILD, 'parsed.json'), null);
if (!parsed) throw new Error('parsed.json missing');
const strict = readJson(REPORT, { rows: [] });
const reviewed = readJson(REVIEWED, { pages: {} });

const flagByPage = new Map();
for (const row of strict.rows || []) {
  flagByPage.set(row.page, (flagByPage.get(row.page) || 0) + 1);
}

const journals = [];
for (const journal of parsed.journals) {
  const pages = new Map();
  for (const post of journal.posts || []) {
    if (!String(post.text || '').trim()) continue;
    const n = post.pageNum ?? 1;
    pages.set(n, (pages.get(n) || 0) + 1);
  }
  if (!pages.size) continue;
  const nums = [...pages.keys()].sort((a, b) => a - b);
  let done = 0, reviewedN = 0, flags = 0;
  const rows = nums.map(n => {
    const id = `${journal.id}-p${n}`;
    const f = flagByPage.get(id) || 0;
    const rec = reviewed.pages[id];
    flags += f;
    let status = 'todo';
    if (rec && rec.validated) { reviewedN++; status = f ? 'reviewed-flagged' : 'done'; }
    if (status === 'done') done++;
    return { id, page: n, posts: pages.get(n), flags: f, status, note: rec ? rec.note || '' : '' };
  });
  journals.push({
    id: journal.id,
    title: journal.title || journal.id,
    pages: nums.length,
    posts: rows.reduce((s, r) => s + r.posts, 0),
    done,
    reviewed: reviewedN,
    flags,
    rows,
  });
}

const total = journals.reduce((s, j) => ({
  pages: s.pages + j.pages,
  posts: s.posts + j.posts,
  done: s.done + j.done,
  reviewed: s.reviewed + j.reviewed,
  flags: s.flags + j.flags,
}), { pages: 0, posts: 0, done: 0, reviewed: 0, flags: 0 });

const priority = ['if'];
const ordered = [
  ...priority.map(id => journals.find(j => j.id === id)).filter(Boolean),
  ...journals.filter(j => !priority.includes(j.id)).sort((a, b) => b.flags - a.flags),
];

const pct = (a, b) => b ? `${(a / b * 100).toFixed(1)}%` : '0%';
const md = [];
md.push('# Translation review checklist', '');
md.push(`Generated ${new Date().toISOString().slice(0, 10)} from \`parsed.json\`, \`strict-report.json\` and \`reviewed.json\`.`);
md.push('A page is `[x]` only when it was rewritten in this campaign and the latest strict audit shows zero flags.');
md.push('');
md.push('## Progress', '');
md.push(`- Corpus: **${total.posts.toLocaleString('en-US')}** posts on **${total.pages.toLocaleString('en-US')}** pages across **${journals.length}** journals`);
md.push(`- Reviewed and clean: **${total.done}** pages (${pct(total.done, total.pages)})`);
md.push(`- Reviewed but flagged: **${total.reviewed - total.done}** pages`);
md.push(`- Remaining: **${total.pages - total.reviewed}** pages`);
md.push(`- Open strict flags: **${total.flags}**`);
md.push('');

for (const j of ordered) {
  md.push(`## ${j.id === 'if' ? 'Priority 1 — ' : ''}${j.id} — ${j.title}`, '');
  md.push(`${j.pages} pages / ${j.posts} posts — reviewed ${j.reviewed}, clean ${j.done}, strict flags ${j.flags}`, '');
  for (const r of j.rows) {
    const box = r.status === 'done' ? '[x]' : r.status === 'reviewed-flagged' ? '[~]' : '[ ]';
    const flag = r.flags ? `${r.flags} flagged` : 'clean';
    md.push(`- ${box} ${r.id} — ${r.posts} posts, ${flag}${r.note ? ` — ${r.note}` : ''}`);
  }
  md.push('');
}

fs.writeFileSync(OUT_MD, md.join('\n'), 'utf8');
fs.writeFileSync(OUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), total, journals: ordered }, null, 1), 'utf8');
console.log(JSON.stringify({ total, journals: ordered.length, priorityRows: ordered[0] ? ordered[0].pages : 0 }, null, 1));
