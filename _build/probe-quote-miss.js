/* ---------------------------------------------------------- probe one not-found
 * Why does an image-only quote fail to find its parent? Print the quote block's
 * own attachment names and every older post by that author with theirs.
 *
 *   node _build/probe-quote-miss.js <jid> <pid> [authorHint]
 */
'use strict';
const fs = require('fs'), path = require('path');
const cheerio = require('cheerio');
const ROOT = path.resolve(__dirname, '..');
const parsed = JSON.parse(fs.readFileSync(path.join(ROOT, '_build', 'parsed.json'), 'utf8'));
const jid = process.argv[2] || 'andrew', pid = process.argv[3] || 'andrew_p1_4';
const J = parsed.journals.find(x => x.id === jid);
const post = J.posts.find(p => p.id === pid);
const m = /^(.*)_p(\d+)_(\d+)$/.exec(pid);
const page = +m[2], row = +m[3];
const file = J.pageFiles[page - 1];
const $ = cheerio.load(fs.readFileSync(path.join(ROOT, J.dir, file), 'utf8'));
const tbl = $('table.kmsg').eq(row - 1);
console.log(pid, '| author', post.author, '| date', post.date, '| page', page, 'row', row, '|', file);
tbl.find('blockquote').each((i, b) => {
  const bq = $(b);
  const txt = bq.text().replace(/\s+/g, ' ').trim();
  console.log(`\nquote ${i} header: ${JSON.stringify(txt.slice(0, 90))}`);
  console.log('  img srcs in the quote:');
  bq.find('img').each((_, im) => console.log('   ', $(im).attr('src')));
  console.log('  a hrefs in the quote:');
  bq.find('a').each((_, a) => console.log('   ', $(a).attr('href')));
});
const hint = (process.argv[4] || '').toLowerCase();
const pool = J.posts.filter(p => hint ? String(p.author).toLowerCase().includes(hint) : true);
console.log('\nposts by that author:', pool.length);
for (const p of pool.slice(0, 12)) {
  const names = (p.images || []).map(h => {
    const r = (J.images || []).find(x => x.hash === h);
    return r ? `${r.originalName}|${r.type}` : h.slice(0, 8) + '|?';
  });
  console.log(' ', p.id, p.date, JSON.stringify((p.text || '').replace(/\s+/g, ' ').slice(0, 50)), names.join(' '));
}
