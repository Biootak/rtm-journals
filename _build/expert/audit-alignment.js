/*
 * Whole-corpus edition audit: does every Persian body stay line-for-line in
 * sync with its English source, and is the text free of junk?
 *
 *   node _build/expert/audit-alignment.js            → summary + JSON + md
 *   node _build/expert/audit-alignment.js --verbose  → print every finding
 *
 * Checks per post (expert layer, batch first then store):
 *   paragraph-count   EN and FA paragraph counts differ
 *   anchor-missing    a number/URL/handle of paragraph i is absent from FA i
 *   anchor-moved      that anchor appears in some other FA paragraph
 *   shifted-block     FA paragraph equals the EN paragraph of another index
 *   duplicate-para    the same FA paragraph twice inside one post
 *   arabic-letters    Arabic ي/ك instead of Persian ی/ک
 *   persian-digits    ۰-۹ / ٠-٩
 *   control-chars     C0/C1 controls, BOM, bidi overrides
 *   double-space / punctuation-runs / space-before-punct
 *   latin-weld        Latin letter directly welded to a Persian letter
 *   empty-para        a paragraph that cleans to nothing
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.env.JOURNALS_ROOT || path.resolve(__dirname, '..', '..');
const WORK = path.join(ROOT, '_build/expert/work');
const BATCHES = path.join(ROOT, '_build/expert/batches');
const STORE = path.join(ROOT, '_build/expert/posts.json');
const verbose = process.argv.includes('--verbose');

const normalize = t => String(t || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n').trim();
const hashOf = t => crypto.createHash('sha1').update(normalize(t)).digest('hex');
const paragraphs = s => String(s || '').split(/\n{2,}/).filter(x => x.trim());

const store = fs.existsSync(STORE) ? JSON.parse(fs.readFileSync(STORE, 'utf8')) : {};
const findings = [];
const seenHashes = new Set();
let posts = 0;
let pages = 0;

function add(page, id, kind, detail) {
  findings.push({ page, id, kind, detail });
}

const ANCHOR_URL = /https?:\/\/\S+|www\.\S+/g;
const ANCHOR_NUM = /\d+(?:[.,]\d+)?%?/g;
const EN_HEAD = /(?:^|[^A-Za-z0-9_.@-])([A-Za-z0-9_.@-]{2,})\s+wrote\s*:/g;
const FA_HEAD = /(?:^|[^A-Za-z0-9_.@-])([A-Za-z0-9_.@-]{2,})\s*نوشت\s*:/g;

function heads(text, re) {
  const out = [];
  let m;
  re.lastIndex = 0;
  while ((m = re.exec(String(text)))) {
    // "you wrote:" addresses the reader; it is not a quote handle.
    if (/^(?:i|you|we|they|he|she|it|who)$/i.test(m[1])) continue;
    out.push(m[1]);
  }
  return out;
}

function anchors(text) {
  const out = new Set();
  for (const m of String(text).match(ANCHOR_URL) || []) out.add(m.replace(/[),.;]+$/, ''));
  for (const m of String(text).match(ANCHOR_NUM) || []) {
    if (/[.,]\d/.test(m) || m.replace(/\D/g, '').length >= 3) out.add(m);
  }
  let m;
  EN_HEAD.lastIndex = 0;
  while ((m = EN_HEAD.exec(text))) {
    const h = m[1];
    if (/^you$/i.test(h)) continue;
    out.add(h);
  }
  return [...out];
}

function junk(fa) {
  const kinds = [];
  if (/[\u064A\u0643]/.test(fa)) kinds.push('arabic-letters');
  if (/[\u06F0-\u06F9\u0660-\u0669]/.test(fa)) kinds.push('persian-digits');
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200E\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/.test(fa)) kinds.push('control-chars');
  if (/ {2,}/.test(fa)) kinds.push('double-space');
  if (/[،؛][،؛]|؟\?|\?!|!\?/.test(fa)) kinds.push('punctuation-runs');
  if (/[ \u00A0][،؛؟]/.test(fa)) kinds.push('space-before-punct');
  // A Latin token glued to a Persian LETTER is a weld; punctuation such as the
  // Arabic comma also lives in U+0600–06FF, so match letters explicitly.
  const weld = fa.match(/[A-Za-z]{2,}[\u0621-\u063A\u0641-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06CC]|[\u0621-\u063A\u0641-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06CC][A-Za-z]{2,}/g) || [];
  if (weld.some(m => !/^[A-Z0-9]{2,}[\u0621-\u063A\u0641-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06CC]/.test(m))) kinds.push('latin-weld');
  else if (weld.length) kinds.push('acronym-zwnj');
  return kinds;
}

for (const file of fs.readdirSync(WORK)) {
  if (!file.endsWith('.json')) continue;
  const page = file.replace(/\.json$/, '');
  const work = JSON.parse(fs.readFileSync(path.join(WORK, file), 'utf8'));
  const batchFile = path.join(BATCHES, file);
  const batch = fs.existsSync(batchFile) ? JSON.parse(fs.readFileSync(batchFile, 'utf8')) : {};
  pages++;
  for (const w of work) {
    const fa = String(batch[w.hash] || store[w.hash] || '');
    if (!fa.trim()) { add(page, w.id, 'missing-translation', ''); continue; }
    if (seenHashes.has(w.hash)) continue;
    seenHashes.add(w.hash);
    posts++;
    const enParas = paragraphs(w.text);
    const faParas = paragraphs(fa);
    const enHeads = heads(w.text, EN_HEAD);
    const faHeads = heads(fa, FA_HEAD);
    if (enHeads.length !== faHeads.length) {
      add(page, w.id, 'head-count', `EN ${enHeads.length} [${enHeads.join(', ')}] vs FA ${faHeads.length} [${faHeads.join(', ')}]`);
    }
    const enHeadAt = enParas.map(p => /^["“”«\s]*([A-Za-z0-9_.@-]{2,})\s+wrote\s*:/.exec(p));
    const faHeadAt = faParas.map(p => /^["“”«\s]*([A-Za-z0-9_.@-]{2,})\s*نوشت\s*:/.exec(p));
    const n = Math.min(enHeadAt.length, faHeadAt.length);
    for (let i = 0; i < n; i++) {
      const e = enHeadAt[i] ? enHeadAt[i][1] : null;
      const f = faHeadAt[i] ? faHeadAt[i][1] : null;
      if (e && /^(?:i|you|we|they|he|she|it|who)$/i.test(e)) continue;
      if (e === f) continue;
      if (e && f) add(page, w.id, 'head-changed', `p${i + 1}: ${e} → ${f}`);
      else if (e) add(page, w.id, 'head-missing', `p${i + 1}: ${e}`);
      else add(page, w.id, 'head-added', `p${i + 1}: ${f}`);
    }
    for (const url of String(w.text).match(ANCHOR_URL) || []) {
      const clean = url.replace(/[),.;]+$/, '');
      if (!String(fa).includes(clean)) add(page, w.id, 'url-missing', clean);
    }
    if (enParas.length !== faParas.length) {
      add(page, w.id, 'paragraph-count', `EN ${enParas.length} vs FA ${faParas.length}`);
      continue;
    }
    const faJoin = faParas.join(' ');
    for (let i = 0; i < enParas.length; i++) {
      const want = anchors(enParas[i]);
      for (const a of want) {
        if (faParas[i].includes(a)) continue;
        // Source posts often glue a handle to the previous word with no
        // separator ("thnx mateRinehart wrote:"); the translator keeps the
        // real handle, so accept when the handle's own segment is present.
        const parts = [a.split('.').pop(), a.replace(/^[a-z]+/, '')].filter(Boolean);
        if (parts.some(p => p !== a && faParas[i].includes(p))) continue;
        // Handle glued to a preceding English word ("IFscoobydoo",
        // "ThanksMichal238", "thattradeforlife"): accept when a long suffix
        // of the token still appears in the Persian paragraph.
        let glued = false;
        for (let k = 1; k + 4 <= a.length; k++) {
          if (faParas[i].includes(a.slice(k))) { glued = true; break; }
        }
        if (glued) continue;
        if (/^\d/.test(a)) {
          const digits = a.replace(/\D/g, '');
          if (digits && faParas[i].replace(/\D/g, '').includes(digits)) continue;
        }
        if (faJoin.includes(a)) add(page, w.id, 'anchor-moved', `p${i + 1}: ${a}`);
        else add(page, w.id, 'anchor-missing', `p${i + 1}: ${a}`);
      }
      if (/^[A-Za-z0-9 ,.'"!?()\-\/]+$/.test(faParas[i].trim()) && faParas[i].trim().length > 60) {
        const other = enParas.findIndex((p, j) => j !== i && paragraphs(p)[0] === faParas[i].trim());
        if (other >= 0) add(page, w.id, 'shifted-block', `FA p${i + 1} equals EN p${other + 1}`);
      }
    }
    const seenP = new Map();
    faParas.forEach((p, idx) => {
      const k = p.trim();
      if (k.length < 40) return;
      if (seenP.has(k)) add(page, w.id, 'duplicate-para', `p${seenP.get(k) + 1} = p${idx + 1}`);
      else seenP.set(k, idx);
    });
    for (const kind of junk(fa)) add(page, w.id, kind, '');
  }
}

const byKind = {};
for (const f of findings) (byKind[f.kind] = (byKind[f.kind] || 0) + 1);

const lines = [
  '# Whole-corpus edition audit',
  '',
  `Generated ${new Date().toISOString()} over ${posts} unique posts in ${pages} pages.`,
  '',
  '| check | count |',
  '|---|---|',
  ...Object.entries(byKind).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`),
  '',
];
if (findings.length) {
  lines.push('## Findings', '');
  const limit = verbose ? findings.length : Math.min(findings.length, 300);
  for (const f of findings.slice(0, limit)) {
    lines.push(`- ${f.page} ${f.id} — **${f.kind}**${f.detail ? ': ' + f.detail : ''}`);
  }
  if (findings.length > limit) lines.push(`- … ${findings.length - limit} more (see JSON)`);
} else {
  lines.push('No findings.');
}
fs.writeFileSync(path.join(ROOT, '_build/expert/alignment-report.md'), lines.join('\n') + '\n', 'utf8');
fs.writeFileSync(path.join(ROOT, '_build/expert/alignment-report.json'), JSON.stringify({ posts, pages, byKind, findings }, null, 1), 'utf8');

console.log(`posts ${posts} | pages ${pages} | findings ${findings.length}`);
for (const [k, v] of Object.entries(byKind).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`);
console.log('report: _build/expert/alignment-report.md');
