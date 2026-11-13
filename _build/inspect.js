/*
 * Compact inspector for built site data.
 *
 * Printing a journal file whole fills the terminal with megabytes; this prints
 * only counts and short samples.
 *
 * Usage:
 *   node inspect.js journal salivan [postIdOrPage]
 *   node inspect.js stats
 *   node inspect.js ocr <hash|searchwords>
 *   node inspect.js quality [n]
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'E:/Trade/journals';
const SITE = path.join(ROOT, 'site');
const BUILD = path.join(ROOT, '_build');

function loadJournal(id) {
  const file = path.join(SITE, 'data', 'journals', encodeURIComponent(id) + '.js');
  const src = fs.readFileSync(file, 'utf8');
  const marker = src.indexOf('RTM_JOURNAL_CACHE[');
  const start = src.indexOf(']=', marker);
  if (start < 0) throw new Error('unexpected journal file shape: ' + file);
  return JSON.parse(src.slice(start + 2, src.lastIndexOf(';')));
}

function cut(s, n = 120) {
  const v = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  return v.length > n ? v.slice(0, n) + '…' : v;
}

function stats() {
  const src = fs.readFileSync(path.join(SITE, 'data', 'index.js'), 'utf8');
  const index = JSON.parse(src.slice(src.indexOf('=') + 1, src.lastIndexOf(';')));
  console.log(JSON.stringify(index.stats, null, 1));
}

function journal(id, needle) {
  const j = loadJournal(id);
  const posts = j.posts || [];
  const withFa = posts.filter(p => p.fa).length;
  const withPairs = posts.filter(p => Array.isArray(p.pa) && p.pa.length > 1).length;
  console.log(`${j.id}: ${posts.length} posts · ${withFa} with translation · ${withPairs} with sentence pairs · ${(j.images || []).length} images`);
  const images = j.images || [];
  const withOcr = images.filter(i => i.ocr).length;
  const translated = images.filter(i => i.ocr && i.ocr.translated > 0).length;
  console.log(`images: ${withOcr} with OCR text, ${translated} with real translations`);
  const list = needle ? posts.filter(p => p.id === needle || String(p.p) === String(needle) || String(p.n) === String(needle)) : [];
  for (const p of list.slice(0, 3)) {
    console.log(`\n--- ${p.id} (page ${p.p}) ${p.d} by ${p.a}`);
    console.log('EN:', cut(p.t, 400));
    console.log('FA:', cut(p.fa, 400) || '— (بدون ترجمه)');
    if (p.pa) p.pa.slice(0, 4).forEach((pair, i) => {
      console.log(`  pair ${i + 1} EN: ${cut(pair[0], 100)}`);
      console.log(`  pair ${i + 1} FA: ${cut(pair[1], 100) || '—'}`);
    });
    const im = images.filter(x => x.pid === p.id && x.ocr);
    for (const x of im.slice(0, 2)) {
      console.log(`  image ${x.k.slice(0, 8)} (${x.o}) translated=${x.ocr.translated} keepOnly=${x.ocr.keepOnly}`);
      x.ocr.blocks.slice(0, 8).forEach(b => {
        console.log(`    [${b[6] || '?'}] ${cut(b[0], 70)} → ${cut(b[1], 70) || '—'}`);
      });
    }
  }
}

function ocr(query) {
  const baked = JSON.parse(fs.readFileSync(path.join(BUILD, 'ocr', 'translations.baked.json'), 'utf8'));
  if (baked[query]) {
    for (const b of baked[query].blocks) console.log(`[${b.mode}] ${cut(b.original, 80)} → ${cut(b.persian, 80) || '—'}`);
    return;
  }
  let n = 0;
  for (const [hash, entry] of Object.entries(baked)) {
    for (const b of entry.blocks) {
      if (!String(b.original).toLowerCase().includes(query.toLowerCase())) continue;
      console.log(`${hash.slice(0, 8)} [${b.mode}] ${cut(b.original, 80)} → ${cut(b.persian, 80) || '—'}`);
      if (++n >= 20) return;
    }
  }
  console.log(n ? '' : 'no match');
}

function quality(n = 25) {
  const file = path.join(BUILD, 'quality-sample.txt');
  const lines = fs.readFileSync(file, 'utf8').split('\n').slice(0, n * 3 + 4);
  console.log(lines.join('\n'));
}

const [cmd, arg1, arg2] = process.argv.slice(2);
if (cmd === 'stats') stats();
else if (cmd === 'journal') journal(arg1, arg2);
else if (cmd === 'ocr') ocr(arg1);
else if (cmd === 'quality') quality(Number(arg2) || 25);
else console.log('usage: node inspect.js stats|journal|ocr|quality');
