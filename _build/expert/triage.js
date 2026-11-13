#!/usr/bin/env node
/*
 * Triage the expert layer: which posts/pages still read as English inside
 * Persian, and which are legitimately non-prose (ticker, URL, number, handle).
 *
 * Classes
 *   prose-missing   source has prose, Persian has (almost) none
 *   mixed-prose     Persian prose carries ordinary English words mid-sentence
 *   term-only       only trading terms/handles left Latin (acceptable-ish)
 *   non-prose       ticker/URL/number/signature only — nothing to translate
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const W = path.join(ROOT, '_build/expert/work');
const B = path.join(ROOT, '_build/expert/batches');
const STORE_FILE = path.join(ROOT, '_build/expert/posts.json');
const store = fs.existsSync(STORE_FILE) ? JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')) : {};

const FA = /[\u0621-\u063A\u0641-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06CC]/;
const EN_STOP = /\b(?:the|and|is|are|was|were|this|that|with|have|has|had|will|would|you|your|not|for|but|from|they|them|there|what|when|where|which|who|how|can|could|should|just|like|about|into|than|then|also|only|more|some|all|one|two|very|much|need|know|think|want|make|made|get|got|see|look|going|been|being|does|did|doing|because|after|before|over|under|again|still|even|well|good|bad|here|now|out|off|down|up)\b/gi;

// A source line is prose when it has a sentence of six-plus words containing
// a verb-like token; tickers, numbers and URLs do not qualify.
function hasProse(en) {
  const lines = String(en || '').split(/\n{2,}/);
  return lines.some(line => {
    const t = line.trim();
    if (!t || /^https?:\/\//i.test(t)) return false;
    const words = t.split(/\s+/).filter(Boolean);
    if (words.length < 6) return false;
    return /\b(?:is|are|was|were|be|been|have|has|had|do|does|did|can|could|will|would|should|may|might|must|need|want|think|see|look|go|get|make|take|put|move|price|market)\b/i.test(t);
  });
}

const pages = new Map();
const rows = [];
for (const file of fs.readdirSync(W).filter(f => f.endsWith('.json'))) {
  const page = file.replace(/\.json$/, '');
  const work = JSON.parse(fs.readFileSync(path.join(W, file), 'utf8'));
  const bf = path.join(B, file);
  const batch = fs.existsSync(bf) ? JSON.parse(fs.readFileSync(bf, 'utf8')) : {};
  for (const w of work) {
    const fa = String(batch[w.hash] || store[w.hash] || '');
    if (!fa.trim()) continue;
    const faWords = fa.split(/\s+/).filter(x => FA.test(x)).length;
    const enProse = hasProse(w.text);
    const enStops = (fa.match(EN_STOP) || []).length;
    let cls;
    if (!FA.test(fa)) cls = enProse ? 'prose-missing' : 'non-prose';
    else if (enStops >= 3 && faWords > 0) cls = 'mixed-prose';
    else if (enStops >= 1 && enStops > faWords * 0.15) cls = 'term-only';
    else cls = 'ok';
    const rec = { page, id: w.id, cls, faWords, enStops, head: fa.replace(/\s+/g, ' ').slice(0, 90) };
    rows.push(rec);
    if (!pages.has(page)) pages.set(page, { page, total: 0, proseMissing: 0, mixed: 0, term: 0 });
    const p = pages.get(page);
    p.total++;
    if (cls === 'prose-missing') p.proseMissing++;
    if (cls === 'mixed-prose') p.mixed++;
    if (cls === 'term-only') p.term++;
  }
}

const counts = {};
for (const r of rows) counts[r.cls] = (counts[r.cls] || 0) + 1;
console.log('posts', rows.length, counts);
const bad = [...pages.values()].filter(p => p.proseMissing + p.mixed > 0)
  .sort((a, b) => (b.proseMissing + b.mixed) - (a.proseMissing + a.mixed));
console.log(`pages with prose-missing/mixed: ${bad.length} of ${pages.size}`);
console.log('worst pages: page proseMissing mixed term total');
for (const p of bad.slice(0, 25)) console.log(`  ${p.page} ${p.proseMissing} ${p.mixed} ${p.term} ${p.total}`);
for (const cls of ['prose-missing', 'mixed-prose']) {
  console.log(`\n## ${cls} examples`);
  for (const r of rows.filter(x => x.cls === cls).slice(0, 20)) console.log(`  - ${r.page} ${r.id}: ${r.head}`);
}
fs.writeFileSync(path.join(ROOT, '_build/expert/triage.json'), JSON.stringify({ counts, pages: [...pages.values()], rows }, null, 1));
console.log('\nreport: _build/expert/triage.json');
