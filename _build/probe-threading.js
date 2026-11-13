/* ------------------------------------------------------------- probe threading
 * Read-only look at what the saved Kunena pages actually carry about reply
 * structure, before any of it is written into parsed.json:
 *   - the numeric message id per row (kreplyNNN_form / /report/NNN),
 *   - the header pieces the site showed a reader (post number, permalink, date),
 *   - the quote blocks inside a body ("Author wrote:" + quoted text).
 * Nothing is modified; the numbers it prints decide the shape of reply-graph.js.
 *
 *   node _build/probe-threading.js [journalDir] [pageFilePart]
 */
'use strict';
const fs = require('fs'), path = require('path');
const cheerio = require('cheerio');
const ROOT = path.resolve(__dirname, '..');

const dir = path.join(ROOT, process.argv[2] || 'Astrokillah');
const part = process.argv[3] || 'Page 13';
const file = fs.readdirSync(dir).filter(f => /\.html?$/i.test(f) && f.includes(part))[0];
const html = fs.readFileSync(path.join(dir, file), 'utf8');
const $ = cheerio.load(html);
const tables = $('table.kmsg'), headers = $('.kmsg-header');
console.log(file);
console.log('table.kmsg rows      :', tables.length, ' .kmsg-header      :', headers.length);

for (let i = 0; i < Math.min(6, tables.length); i++) {
  const t = tables.eq(i), h = headers.eq(i);
  const idText = h.find('.kmsg-id').text().replace(/\s+/g, ' ').trim();
  const idHref = h.find('.kmsg-id a').attr('href');
  const name = t.find('.kpost-username a').first().text().trim();
  const date = h.find('.kmsgdate').text().replace(/\s+/g, ' ').trim();
  const body = t.find('.kmsgtext').first();
  const quotes = body.find('blockquote');
  let q0 = null;
  if (quotes.length) {
    q0 = {
      header: quotes.first().find('p').first().text().replace(/\s+/g, ' ').trim().slice(0, 90),
      attr: quotes.first().attr(),
      htmlHead: quotes.first().html().replace(/\s+/g, ' ').slice(0, 160),
    };
  }
  console.log(`\nrow ${i + 1}  author=${name}  date=${date}  kmsg-id=${JSON.stringify(idText)}  href=${idHref}`);
  console.log('  blockquotes:', quotes.length, q0 ? JSON.stringify(q0) : '');
  const replyBtn = $.html(t[0]).match(/kreply(\d+)_form/g);
  const reportLink = $.html(t[0]).match(/\/report\/(\d+)/);
  console.log('  kreply ids on row:', replyBtn ? [...new Set(replyBtn)].join(',') : '-', ' report id:', reportLink ? reportLink[1] : '-');
  console.log('  row html length:', $.html(t[0]).length);
}

/* how the message id is reachable for every row on the page */
let withId = 0, ids = [];
tables.each((_, el) => {
  const m = $.html(el).match(/kreply(\d+)_form/) || $(el).outerHTML().match(/\/report\/(\d+)/);
  if (m) { withId++; ids.push(m[1]); }
});
console.log('\nrows with a numeric message id:', withId, '/', tables.length);
console.log('ids:', ids.slice(0, 30).join(' '));

/* quote-header authors across the page */
const authors = {};
let qBlocks = 0;
$('blockquote').each((_, b) => {
  qBlocks++;
  const m = $(b).children('p').first().text().match(/^\s*([^\s][^:]{0,60}?)\s*writes?\s*:/);
  if (m) authors[m[1].trim()] = (authors[m[1].trim()] || 0) + 1;
});
console.log('blockquote blocks on page:', qBlocks, 'with "X wrote:" header:', Object.values(authors).reduce((a, b) => a + b, 0));
console.log('quoted authors:', JSON.stringify(authors));
