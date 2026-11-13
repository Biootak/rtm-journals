#!/usr/bin/env node
/*
 * Persian-purity census across the expert layer.
 *
 * Mechanical QA counts categories; this scan asks whether a reader actually
 * gets Persian prose. A post is flagged when:
 *   untranslated     FA has no Persian letter at all
 *   english-run      a run of 3+ ordinary English words survives inside FA
 *   latin-heavy      Latin word count is a large share of Persian word count
 *   translated-handle a quote head is not the Latin handle the source used
 *   broken-word      a Persian word is split by a Latin fragment ("اسکالپer")
 *
 * Read-only. Writes _build/expert/purity-report.json.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const W = path.join(ROOT, '_build/expert/work');
const B = path.join(ROOT, '_build/expert/batches');
const STORE_FILE = path.join(ROOT, '_build/expert/posts.json');
const store = fs.existsSync(STORE_FILE) ? JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')) : {};

const FA_LETTER = /[\u0621-\u063A\u0641-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06CC]/;
const EN_STOP = /\b(?:the|and|is|are|was|were|this|that|with|have|has|had|will|would|you|your|not|for|but|from|they|them|there|what|when|where|which|who|how|can|could|should|just|like|about|into|than|then|also|only|more|some|all|one|two|very|much|need|know|think|want|make|made|get|got|see|look|going|been|being|does|did|doing|because|after|before|over|under|again|still|even|well|good|bad|here|now|out|off|down|up)\b/gi;
const ALLOW = /^(?:[A-Z]{2,6}|[A-Za-z]+\/[A-Za-z]+|[A-Za-z0-9._-]*\d[A-Za-z0-9._-]*|[A-Za-z]{1,3})$/;

const rows = [];
let posts = 0;
const byKind = {};
const ex = {};
function add(kind, rec, detail) {
  byKind[kind] = (byKind[kind] || 0) + 1;
  rows.push({ kind, id: rec.id, page: rec.page, detail });
  (ex[kind] = ex[kind] || []);
  if (ex[kind].length < 15) ex[kind].push({ id: rec.id, page: rec.page, detail });
}

const seen = new Set();
for (const file of fs.readdirSync(W).filter(f => f.endsWith('.json'))) {
  const page = file.replace(/\.json$/, '');
  const work = JSON.parse(fs.readFileSync(path.join(W, file), 'utf8'));
  const bf = path.join(B, file);
  const batch = fs.existsSync(bf) ? JSON.parse(fs.readFileSync(bf, 'utf8')) : {};
  for (const w of work) {
    if (seen.has(w.hash)) continue;
    seen.add(w.hash);
    const fa = String(batch[w.hash] || store[w.hash] || '');
    if (!fa.trim()) continue;
    posts++;
    const rec = { id: w.id, page };
    const faLetters = (fa.match(/[\u0600-\u06FF]/g) || []).length;
    if (!FA_LETTER.test(fa)) { add('untranslated', rec, fa.slice(0, 80)); continue; }
    const enWords = fa.match(EN_STOP) || [];
    if (enWords.length >= 3) add('english-run', rec, enWords.slice(0, 8).join(' ') + ' || ' + fa.slice(0, 90));
    const faWords = fa.split(/\s+/).filter(x => FA_LETTER.test(x)).length;
    const latin = (fa.match(/[A-Za-z][A-Za-z0-9._-]{1,}/g) || []);
    const latinBad = latin.filter(t => !ALLOW.test(t));
    if (latinBad.length >= 4 && latinBad.length > faWords * 0.25) add('latin-heavy', rec, latinBad.slice(0, 10).join(', '));
    const broken = fa.match(/[\u0600-\u06FF]+[A-Za-z]{2,}[\u0600-\u06FF]+/g) || [];
    if (broken.length) add('broken-word', rec, broken.slice(0, 6).join(' | '));
    const faHeads = [...fa.matchAll(/(?:^|[^A-Za-z0-9_.@-])([^\s:]{2,})\s*نوشت\s*:/g)].map(m => m[1]);
    const enHeads = [...String(w.text).matchAll(/(?:^|[^A-Za-z0-9_.@-])([A-Za-z0-9_.@-]{2,})\s+wrote\s*:/g)].map(m => m[1]);
    for (const h of faHeads) {
      if (!/[A-Za-z]/.test(h)) { add('translated-handle', rec, h + ' (EN heads: ' + enHeads.join(',') + ')'); break; }
    }
  }
}

console.log(`posts checked ${posts}`);
for (const [k, v] of Object.entries(byKind).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`);
for (const [k, list] of Object.entries(ex)) {
  console.log(`\n## ${k}`);
  for (const e of list) console.log(`  - ${e.page} ${e.id}: ${e.detail}`);
}
fs.writeFileSync(path.join(ROOT, '_build/expert/purity-report.json'), JSON.stringify({ posts, byKind, examples: ex, rows }, null, 1));
console.log('\nreport: _build/expert/purity-report.json');
