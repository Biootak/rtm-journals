/* Final comparison report generator.
   Writes _compare-report.json and _compare-report.md next to the batches. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const E = 'E:/Trade/journals/_build/expert';
const WORK = path.join(E, 'work');
const BATCH = path.join(E, 'batches');
const OUT_JSON = path.join(BATCH, '_reports', '_compare-report.json');
const OUT_MD = path.join(BATCH, '_reports', '_compare-report.md');

const norm = t => String(t || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
const paras = s => String(s || '').split(/\n{2,}/).filter(x => x.trim()).length;
const faChars = s => (String(s || '').match(/[\u0600-\u06FF]/g) || []).length;
const latWords = s => (String(s || '').match(/[A-Za-z]{3,}/g) || []);
const isTrivialLatin = t => faChars(t) === 0 && !/[.!?]\s+[A-Z]/.test(t) && t.length < 120;

const STAGE4 = {
  jurij: [1, 14], staurum: [8, 19], lespaul: [8, 18], fulljournal: [1, 11],
  extremerrage: [1, 11], astrokillah: [8, 17], omidfx: [1, 10], vitaldrug: [1, 8],
};
const EXCLUDED = new Set(['jurij', 'omidfx', 'vitaldrug']);

const bNames = fs.readdirSync(BATCH).filter(n => n.endsWith('.json') && !n.startsWith('_'));
const wNames = fs.readdirSync(WORK).filter(n => n.endsWith('.json'));

// global scan
const pages = [];
const anomalies = [];
let totalPosts = 0, totalKeys = 0, emptyVals = 0, extraHashes = 0, paraMismatch = 0, latinLegit = 0;

for (const name of bNames) {
  const base = name.replace(/\.json$/, '');
  const b = JSON.parse(fs.readFileSync(path.join(BATCH, name), 'utf8'));
  const wp = path.join(WORK, name);
  const w = fs.existsSync(wp) ? JSON.parse(fs.readFileSync(wp, 'utf8')) : null;
  const rec = { page: base, posts: w ? w.length : 0, keys: Object.keys(b).length, distinctHashes: w ? new Set(w.map(x => x.hash)).size : 0, issues: [] };
  totalPosts += rec.posts; totalKeys += rec.keys;
  if (!w) { rec.issues.push('no-work-file'); anomalies.push({ page: base, type: 'NO_WORK' }); pages.push(rec); continue; }
  const hs = new Set(w.map(x => x.hash));
  for (const k of Object.keys(b)) if (!hs.has(k)) { extraHashes++; rec.issues.push('extra-hash'); anomalies.push({ page: base, type: 'EXTRA_HASH', hash: k.slice(0, 10) }); }
  const seen = new Map();
  for (const row of w) {
    const fa = b[row.hash];
    if (typeof fa !== 'string' || !fa.trim()) { emptyVals++; rec.issues.push(`empty:${row.id}`); anomalies.push({ page: base, type: 'EMPTY', id: row.id }); continue; }
    if (paras(row.text) !== paras(fa)) { paraMismatch++; rec.issues.push(`para:${row.id}`); anomalies.push({ page: base, type: 'PARA', id: row.id, detail: `${paras(row.text)}/${paras(fa)}` }); }
    if (norm(fa) === norm(row.text) && faChars(fa) === 0) {
      latinLegit++;
      anomalies.push({ page: base, type: 'LATIN_ONLY_SAME_AS_SOURCE', id: row.id, detail: JSON.stringify(row.text).slice(0, 80) });
    }
    const key = norm(fa);
    if (key.length > 40) {
      if (seen.has(key)) anomalies.push({ page: base, type: 'SHARED_HASH_VALUE', id: row.id, detail: 'same as ' + seen.get(key) });
      else seen.set(key, row.id);
    }
  }
  rec.issues = [...new Set(rec.issues)];
  pages.push(rec);
}

const missing = wNames.filter(n => !bNames.includes(n)).map(n => n.replace(/\.json$/, ''));
const batchOnly = bNames.map(n => n.replace(/\.json$/, '')).filter(p => !wNames.includes(p + '.json'));

// stage4 rows
const stage4Rows = [];
for (const [j, [from, to]] of Object.entries(STAGE4)) {
  for (let p = from; p <= to; p++) {
    const page = `${j}-p${p}`;
    const rec = pages.find(x => x.page === page);
    const excluded = EXCLUDED.has(j);
    stage4Rows.push({
      page,
      excluded,
      status: !rec ? 'MISSING_BATCH' : (rec.issues.length ? 'ISSUES' : 'OK'),
      posts: rec ? rec.posts : null,
      keys: rec ? rec.keys : null,
      distinctHashes: rec ? rec.distinctHashes : null,
      issues: rec ? rec.issues : [],
    });
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  batchFiles: bNames.length,
  workFiles: wNames.length,
  postsCovered: totalPosts,
  batchKeys: totalKeys,
  emptyTranslations: emptyVals,
  extraHashes,
  paragraphMismatches: paraMismatch,
  latinOnlyPostsKeptAsSource: latinLegit,
  missingPagesCount: missing.length,
  missingPages: missing.sort(),
  batchOnlyPages: batchOnly,
  stage4: stage4Rows,
  anomalies,
};
fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 1), 'utf8');

const ok = stage4Rows.filter(r => !r.excluded);
const okOk = ok.filter(r => r.status === 'OK');
const md = [];
md.push('# Ú¯Ø²Ø§Ø±Ø´ Ù…Ù‚Ø§ÛŒØ³Ù‡Ù” batches Ø¨Ø§ work â€” Ù…ÙˆØ¬ stage4');
md.push('');
md.push(`ØªÙˆÙ„ÛŒØ¯: ${new Date().toISOString()} (snapshot)`);
md.push('');
md.push('## Ø®Ù„Ø§ØµÙ‡');
md.push('');
md.push('| Ø³Ù†Ø¬Ù‡ | Ù…Ù‚Ø¯Ø§Ø± |');
md.push('|---|---|');
md.push(`| ÙØ§ÛŒÙ„â€ŒÙ‡Ø§ÛŒ batches | ${bNames.length} |`);
md.push(`| ÙØ§ÛŒÙ„â€ŒÙ‡Ø§ÛŒ work | ${wNames.length} |`);
md.push(`| Ù¾Ø³Øªâ€ŒÙ‡Ø§ÛŒ Ù¾ÙˆØ´Ø´â€ŒØ¯Ø§Ø¯Ù‡â€ŒØ´Ø¯Ù‡ | ${totalPosts} |`);
md.push(`| Ú©Ù„ÛŒØ¯Ù‡Ø§ÛŒ ØªØ±Ø¬Ù…Ù‡ | ${totalKeys} |`);
md.push(`| ØªØ±Ø¬Ù…Ù‡Ù” Ø®Ø§Ù„ÛŒ | ${emptyVals} |`);
md.push(`| hash Ø§Ø¶Ø§ÙÛŒ | ${extraHashes} |`);
md.push(`| Ù†Ø§Ø³Ø§Ø²Ú¯Ø§Ø±ÛŒ ØªØ¹Ø¯Ø§Ø¯ Ù¾Ø§Ø±Ø§Ú¯Ø±Ø§Ù | ${paraMismatch} |`);
md.push(`| ØµÙØ­Ù‡Ù” Ø¨Ø¯ÙˆÙ† batch (Ø¨Ø§Ù‚ÛŒâ€ŒÙ…Ø§Ù†Ø¯Ù‡Ù” stage5 Ùˆ IF p1) | ${missing.length} |`);
md.push(`| ÙØ§ÛŒÙ„ batch Ø¨Ø¯ÙˆÙ† work | ${batchOnly.length} |`);
md.push('');
md.push('## ØµÙØ­Ø§Øª stage4 Ø¨Ù‡â€ŒØ¬Ø² jurij/omidfx/vitaldrug');
md.push('');
md.push(`- Ù…Ø¬Ù…ÙˆØ¹: ${ok.length} ØµÙØ­Ù‡ØŒ ${ok.reduce((a, r) => a + (r.posts || 0), 0)} Ù¾Ø³Øª`);
md.push(`- Ø³Ø§Ù„Ù… Ùˆ Ú©Ø§Ù…Ù„: ${okOk.length} Ø§Ø² ${ok.length}`);
md.push(`- Ù†Ø§Ù‚Øµ/Ø¯Ø§Ø±Ø§ÛŒ Ø§ÛŒØ±Ø§Ø¯: ${ok.length - okOk.length}`);
md.push('');
md.push('| ØµÙØ­Ù‡ | Ù¾Ø³Øª | Ú©Ù„ÛŒØ¯ | ÙˆØ¶Ø¹ÛŒØª |');
md.push('|---|---|---|---|');
for (const r of ok) md.push(`| ${r.page} | ${r.posts ?? '-'} | ${r.keys ?? '-'} | ${r.status}${r.issues.length ? ' â€” ' + r.issues.join(', ') : ''} |`);
md.push('');
md.push('## ØµÙØ­Ø§Øª Ù…Ø³ØªØ«Ù†ÛŒ (Ø®Ø§Ø±Ø¬ Ø§Ø² Ø¯Ø§Ù…Ù†Ù‡Ù” Ø§ÛŒÙ† Ø§ØµÙ„Ø§Ø­)');
md.push('');
md.push('| ØµÙØ­Ù‡ | Ù¾Ø³Øª | Ú©Ù„ÛŒØ¯ | ÙˆØ¶Ø¹ÛŒØª |');
md.push('|---|---|---|---|');
for (const r of stage4Rows.filter(x => x.excluded)) md.push(`| ${r.page} | ${r.posts ?? '-'} | ${r.keys ?? '-'} | ${r.status} |`);
md.push('');
md.push('## ÛŒØ§Ø¯Ø¯Ø§Ø´Øª anomalies');
md.push('');
md.push(`- ${latinLegit} Ù¾Ø³Øª Ø¹Ù…Ø¯Ø§Ù‹ Ù„Ø§ØªÛŒÙ† Ù…Ø§Ù†Ø¯Ù‡â€ŒØ§Ù†Ø¯: ØªÛŒÚ©Ø±/Ø§Ù…Ø¶Ø§/URL/Ø¨Ø±Ú†Ø³Ø¨ Ù†Ù…ÙˆØ¯Ø§Ø± Ú©Ù‡ Ø·Ø¨Ù‚ Ù‚ÙˆØ§Ø¹Ø¯ Ù†Ø¨Ø§ÛŒØ¯ ØªØ±Ø¬Ù…Ù‡ Ø´ÙˆÙ†Ø¯.`);
md.push('- hash ØªÚ©Ø±Ø§Ø±ÛŒ ÙÙ‚Ø· Ø¯Ø± ØµÙØ­Ù‡â€ŒÙ‡Ø§ÛŒÛŒ Ø§Ø³Øª Ú©Ù‡ Ø®ÙˆØ¯Ù Ù…Ù†Ø¨Ø¹ Ù¾Ø³Øª ØªÚ©Ø±Ø§Ø±ÛŒ Ø¯Ø§Ø±Ø¯ (Ù…ØªÙ† ÛŒÚ©Ø³Ø§Ù†)Ø› ÛŒÚ© ØªØ±Ø¬Ù…Ù‡ Ø¨Ø±Ø§ÛŒ Ù‡Ø± Ø¯Ùˆ Ú©Ù„ÛŒØ¯ Ú©Ø§ÙÛŒ Ø§Ø³Øª.');
md.push('- Ù†Ø³Ø®Ù‡Ù” Ø«Ø¨Øªâ€ŒØ´Ø¯Ù‡ Ø¯Ø± `_compare-report.json` Ø´Ø§Ù…Ù„ ÙÙ‡Ø±Ø³Øª Ú©Ø§Ù…Ù„ ØµÙØ­Ù‡â€ŒØ¨Ù‡â€ŒØµÙØ­Ù‡ Ùˆ Ù‡Ù…Ù‡Ù” Ù…ÙˆØ§Ø±Ø¯ Ø§Ø³Øª.');
fs.writeFileSync(OUT_MD, md.join('\n'), 'utf8');

console.log('wrote', OUT_JSON);
console.log('wrote', OUT_MD);
console.log('stage4 non-excluded OK:', okOk.length, '/', ok.length);
console.log('anomalies:', anomalies.length, '| empty:', emptyVals, '| extraHash:', extraHashes, '| paraMismatch:', paraMismatch);

