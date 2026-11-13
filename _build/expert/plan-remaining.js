/* Pack the remaining pages into subagent assignments: same journal, at most
 * two pages, at most ~15k source chars, at most ~35 posts per agent.
 * Usage: node _build/expert/plan-remaining.js
 * Read-only. Emits _build/expert/plan-remaining.json.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const BUILD = path.resolve(__dirname, '..');
const r = JSON.parse(fs.readFileSync(path.join(BUILD, 'expert', 'remaining.json'), 'utf8'));

const MAX_CHARS = 15000;
const MAX_PAGES = 2;
const MAX_POSTS = 35;

const byJournal = {};
for (const p of r.detail) (byJournal[p.journal] = byJournal[p.journal] || []).push(p);

const groups = [];
for (const [journal, pages] of Object.entries(byJournal)) {
  pages.sort((a, b) => a.page - b.page);
  let cur = null;
  for (const p of pages) {
    const chars = p.posts.reduce((n, x) => n + x.chars, 0);
    if (!cur) { cur = { journal, pages: [p.page], posts: p.posts.length, chars, keys: [journal + '-p' + p.page] }; continue; }
    if (cur.pages.length < MAX_PAGES && cur.chars + chars <= MAX_CHARS && cur.posts + p.posts.length <= MAX_POSTS) {
      cur.pages.push(p.page); cur.posts += p.posts.length; cur.chars += chars; cur.keys.push(journal + '-p' + p.page);
    } else { groups.push(cur); cur = { journal, pages: [p.page], posts: p.posts.length, chars, keys: [journal + '-p' + p.page] }; }
  }
  if (cur) groups.push(cur);
}
// big single pages that are still over the char cap stay alone (nothing to do)

const out = { generatedAt: new Date().toISOString(), groups };
fs.writeFileSync(path.join(BUILD, 'expert', 'plan-remaining.json'), JSON.stringify(out, null, 1));
console.log('groups', groups.length, 'pages', groups.reduce((n, g) => n + g.pages.length, 0));
for (const g of groups) console.log((g.journal + ' p' + g.pages.join(',')).padEnd(24), String(g.posts).padStart(3), 'posts', String(g.chars).padStart(6), 'chars');
