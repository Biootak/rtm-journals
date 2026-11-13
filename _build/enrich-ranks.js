/*
 * Recover the forum rank for the HTML-capture journals.
 *
 * The original build-data.js parsed author/date/body from each `table.kmsg`
 * but never read the rank, so every old journal shipped rank="". The rank is
 * source data: the author card prints a rank badge `<img src="…rankN.png"
 * alt="Master Trader">` and a `<li>Master Trader</li>`. This reads it back and
 * fills ONLY empty rank fields, matched by the exact post id build-data.js
 * assigned (`<id>_p<page>_<tableIndex>`). Post text is never touched, so the
 * validated translation layer (keyed by text hash) is unaffected.
 *
 *   node _build/enrich-ranks.js            # dry-run, report only
 *   node _build/enrich-ranks.js --write    # backup + fill empty ranks
 *
 * A print that never contained a rank leaves the field empty — nothing is
 * inferred or fabricated.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, '_build');
const PARSED = path.join(BUILD, 'parsed.json');
const WRITE = process.argv.includes('--write');

const RANKS = new Set([
  'Master Trader', 'Expert Trader', 'Senior Trader', 'Associate Trader',
  'Trader', 'Junior Trader', 'Student', 'Newbie', 'Moderator', 'Administrator',
  'Fresh Boarder', 'Platinum Boarder', 'Gold Boarder', 'Expert Boarder',
  'Senior Boarder', 'Junior Boarder', 'Boarder', 'Guest',
]);
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();

function rankOf($, table) {
  // 1) The rank badge image alt is the unambiguous forum rank.
  let rank = '';
  $(table).find('img').each((_, img) => {
    if (rank) return;
    const src = String($(img).attr('src') || '');
    const alt = clean($(img).attr('alt') || '');
    if (/rank\d*\./i.test(src) && RANKS.has(alt)) rank = alt;
  });
  if (rank) return rank;
  // 2) Fallback: a card <li> that is exactly a rank word, never inside the body.
  $(table).find('li').each((_, li) => {
    if (rank) return;
    if ($(li).closest('.kmsgtext').length) return;
    const t = clean($(li).text());
    if (RANKS.has(t)) rank = t;
  });
  return rank;
}

const parsed = JSON.parse(fs.readFileSync(PARSED, 'utf8'));
let filled = 0, scanned = 0, journalsTouched = 0;
const rows = [];

for (const journal of parsed.journals || []) {
  const pageFiles = journal.pageFiles || [];
  if (!pageFiles.length || !/\.html?$/i.test(pageFiles[0])) continue; // HTML captures only
  const dir = path.join(ROOT, journal.dir || '');
  if (!fs.existsSync(dir)) continue;
  const byId = new Map((journal.posts || []).map(p => [p.id, p]));
  const before = (journal.posts || []).filter(p => clean(p.rank)).length;
  let added = 0;
  for (let pi = 0; pi < pageFiles.length; pi++) {
    let html;
    try { html = fs.readFileSync(path.join(dir, pageFiles[pi]), 'utf8'); } catch { continue; }
    const $ = cheerio.load(html);
    const tables = $('table.kmsg');
    for (let ti = 0; ti < tables.length; ti++) {
      const id = `${journal.id}_p${pi + 1}_${ti + 1}`;
      const post = byId.get(id);
      if (!post) continue;
      scanned++;
      if (clean(post.rank)) continue;
      const rank = rankOf($, tables[ti]);
      if (!rank) continue;
      if (WRITE) post.rank = rank;
      added++;
    }
  }
  const after = before + added;
  if (added) journalsTouched++;
  filled += added;
  rows.push({ id: journal.id, posts: (journal.posts || []).length, before, added, after });
}

rows.sort((a, b) => b.added - a.added);
console.log('journal        posts  hadRank  +added  nowRank');
for (const r of rows) {
  console.log(r.id.padEnd(14), String(r.posts).padStart(5), String(r.before).padStart(7),
    String(r.added).padStart(7), String(r.after).padStart(8));
}
console.log(`\nscanned ${scanned} posts, ${filled} ranks recoverable across ${journalsTouched} journals`);
console.log(WRITE ? 'WRITE mode' : 'dry-run (no changes)');

if (WRITE && filled) {
  const backup = path.join(BUILD, 'parsed.before-ranks.json');
  if (!fs.existsSync(backup)) fs.copyFileSync(PARSED, backup);
  fs.writeFileSync(PARSED, JSON.stringify(parsed));
  console.log('written', PARSED, '(backup at parsed.before-ranks.json)');
}