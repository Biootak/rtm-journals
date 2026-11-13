/*
 * Professional translation workflow for the archive.
 *
 *   node _build/expert/make-batch.js --journal if --pages 6-9
 *       → _build/expert/work/if-p6.json … (hash, id, author, text per post)
 *
 * Translate each work file (by hand or with a translator agent) into
 *   _build/expert/batches/if-p6.json   { "<hash>": "فارسی" }
 * Keeping one paragraph per source paragraph.
 *
 *   node _build/expert/validate.js
 *       → accepts or rejects each batch: hash set, paragraph count,
 *         Persian digits, policy audit. Exit code 1 if anything fails.
 *
 *   node _build/bake-translations.js && node _build/build-site.js
 *       → the site serves the new translations.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.env.JOURNALS_ROOT || path.resolve(__dirname, '..', '..');
const BUILD = path.join(ROOT, '_build');
const WORK = path.join(BUILD, 'expert', 'work');
const BATCHES = path.join(BUILD, 'expert', 'batches');

const policy = require(path.join(BUILD, 'translation-policy.js'));
const lex = require(path.join(BUILD, 'lexicon.js'));

const normalize = t => String(t || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n').trim();
const hashOf = t => crypto.createHash('sha1').update(normalize(t)).digest('hex');
const paragraphs = s => String(s || '').split(/\n{2,}/).filter(x => x.trim()).length;
const digitsOnly = s => String(s || '').replace(/[^\d]/g, '');

/* Prices and R multiples are the one thing a translation must never lose or
   change: a wrong 16.8 is worse than an awkward sentence. */
function numberLosses(english, persian) {
  const tokens = [...new Set(String(english || '').match(/\d+(?:[.,]\d+)?%?/g) || [])]
    .filter(t => /[.,]\d/.test(t) || String(t).replace(/\D/g, '').length >= 3);
  if (!tokens.length) return [];
  const faRuns = (String(persian || '').match(/\d+(?:[.,]\d+)?/g) || []).map(digitsOnly);
  const faSet = new Set(faRuns);
  const present = t => {
    if (faSet.has(digitsOnly(t))) return true;
    const parts = String(t).split(/[.,]/).filter(Boolean);
    // "1,2,3" or "1,2" is a list; each item may be localised as "1، 2، 3"
    // and no longer sit in one run.
    return parts.length >= 2 && parts.every(p => faSet.has(digitsOnly(p)));
  };
  return tokens.filter(t => !present(t));
}

function sourceRepeats(en) {
  const toks = String(en || '').toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ').split(/\s+/)
    .filter(t => t.length >= 2 && !/^\d+$/.test(t));
  const seen = new Set();
  for (let i = 0; i + 1 < toks.length; i++) {
    const key = toks[i] + ' ' + toks[i + 1];
    if (seen.has(key)) return key;
    seen.add(key);
  }
  return '';
}

function quoteHeadLosses(english, persian) {
  const heads = String(english || '').match(/(?:^|\n)\s*(?!(?:i|you|we|they|he|she|it|who)\b)[A-Za-z][A-Za-z0-9_.\-+]{1,32}\s*(?:wrote|writes)\s*:/gi) || [];
  if (!heads.length) return null;
  const faHeads = String(persian || '').match(/نوشت\s*:/g) || [];
  return faHeads.length < heads.length ? `${heads.length} wrote: / ${faHeads.length} نوشت:` : null;
}

/* The machine audit is strict because machine output is cheap to regenerate.
   A hand translation may legitimately keep a source name, an acronym with a
   Persian plural suffix, or repeat a sentence the English also repeats. Only
   keep a defect here when it cannot be explained by the source. */
function expertIssues(fa, en) {
  const clean = policy.cleanMachine(fa, en);
  let issues = lex.audit(clean, en).filter(i => i !== 'untranslated');
  if (issues.includes('latin-junk')) {
    const welds = clean.match(/[\u0600-\u06FF][A-Za-z]{3,}|[A-Za-z]{3,}[\u0600-\u06FF]/g) || [];
    // "FLها", "PAZهای", "RTM،": an acronym next to Persian is deliberate.
    const deliberate = welds.length > 0 && welds.every(s =>
      /^[A-Z][A-Z0-9]{1,6}[\u0600-\u06FF]$/.test(s)
      || /^[\u0600-\u06FF][A-Z][A-Z0-9]{1,6}$/.test(s)
      // "TheLastNail،": a Latin handle closed by Persian punctuation.
      || /^[A-Za-z][A-Za-z0-9_.\-]*[،؛:؟]$/.test(s));
    if (deliberate) issues = issues.filter(i => i !== 'latin-junk');
  }
  if (issues.includes('english-left')) {
    // Member handles, names and URL pieces come from the source.
    const src = new Set((String(en).match(/[A-Za-z]{3,}/g) || []).map(w => w.toLowerCase()));
    const left = (clean.match(/\b[A-Za-z]{3,}\b/g) || []).filter(w => !src.has(w.toLowerCase()));
    if (!left.length) issues = issues.filter(i => i !== 'english-left');
  }
  // A punctuation-only source (".." or "?!") or a bare signature has nothing
  // to translate, so a Latin-only body is correct.
  if (issues.includes('no-persian') && (!/[A-Za-z\u0600-\u06FF]/.test(String(en || '')) || !lex.hasProse(en))) {
    issues = issues.filter(i => i !== 'no-persian');
  }
  // A source that is only a link needs no Persian; the link itself is the
  // content and must stay Latin.
  const enNoLinks = String(en || '').replace(/https?:\/\/\S+|www\.\S+|\b[\w-]+(?:\.[\w-]+)+\S*/g, ' ').trim();
  if (issues.includes('no-persian') && !/[A-Za-z\u0600-\u06FF]/.test(enNoLinks)) {
    issues = issues.filter(i => i !== 'no-persian');
  }
  // "دانلود"/"فیلم"/... are only suspicious when the source never said it.
  if (issues.includes('hallucination') && policy.hallucinationJustified(clean, en)) {
    issues = issues.filter(i => i !== 'hallucination');
  }
  // Quote-heavy replies repeat the quoted lines on purpose, and a member may
  // describe two similar trades with the same phrase. Accept when the English
  // itself repeats a bigram, including short tokens such as "EU".
  if (issues.includes('echo') && (lex.repeatedPhrase(String(en || '')) || sourceRepeats(en))) {
    issues = issues.filter(i => i !== 'echo');
  }
  return issues;
}

function makeBatch(journalId, pages) {
  const parsed = JSON.parse(fs.readFileSync(path.join(BUILD, 'parsed.json'), 'utf8'));
  const journal = parsed.journals.find(j => String(j.id).toLowerCase() === journalId);
  if (!journal) throw new Error('journal not found: ' + journalId);
  fs.mkdirSync(WORK, { recursive: true });
  fs.mkdirSync(BATCHES, { recursive: true });
  for (const page of pages) {
    const rows = (journal.posts || [])
      .filter(p => (p.page ?? p.pageNum ?? 1) === page && (p.text || '').trim())
      .map(p => ({ id: p.id, hash: hashOf(p.text), author: p.author || '', text: p.text.trim() }));
    if (!rows.length) continue;
    const file = path.join(WORK, journalId + '-p' + page + '.json');
    fs.writeFileSync(file, JSON.stringify(rows, null, 1), 'utf8');
    console.log('wrote', path.relative(ROOT, file), rows.length, 'posts');
  }
}

function validate() {
  fs.mkdirSync(BATCHES, { recursive: true });
  let accepted = 0;
  const bad = [];
  const onlyArg = process.argv.indexOf('--page');
  const selected = [];
  if (onlyArg >= 0) {
    for (const arg of process.argv.slice(onlyArg + 1)) {
      if (arg.startsWith('--')) break;
      selected.push(...arg.split(',').filter(Boolean));
    }
    if (!selected.length) bad.push(['--page', 'no pages specified']);
  }
  const names = onlyArg >= 0 ? [...new Set(selected)]
    : fs.readdirSync(BATCHES).filter(n => n.endsWith('.json')).map(n => n.slice(0, -5));
  if (onlyArg < 0 && !names.length) bad.push(['batches', 'no batch files']);
  const parsed = JSON.parse(fs.readFileSync(path.join(BUILD, 'parsed.json'), 'utf8'));
  const sourcePages = new Map();
  for (const journal of parsed.journals) {
    for (const post of journal.posts || []) {
      if (!normalize(post.text)) continue;
      const base = `${journal.id}-p${post.page ?? post.pageNum ?? 1}`;
      if (!sourcePages.has(base)) sourcePages.set(base, new Map());
      sourcePages.get(base).set(post.id, hashOf(post.text));
    }
  }
  for (const base of names) {
    if (!/^[a-z0-9_-]+-p\d+$/i.test(base)) { bad.push([base, 'invalid page name']); continue; }
    const name = base + '.json';
    if (!fs.existsSync(path.join(BATCHES, name))) { bad.push([base, 'no batch file']); continue; }
    const workFile = path.join(WORK, name);
    if (!fs.existsSync(workFile)) { bad.push([base, 'no work file']); continue; }
    const work = JSON.parse(fs.readFileSync(workFile, 'utf8'));
    const source = sourcePages.get(base);
    if (!source) { bad.push([base, 'no source posts']); continue; }
    const seen = new Set();
    const before = bad.length;
    for (const w of work) {
      if (seen.has(w.id)) bad.push([w.id, 'duplicate work post']);
      seen.add(w.id);
      if (!source.has(w.id)) bad.push([w.id, 'post not on source page']);
      else if (source.get(w.id) !== w.hash || hashOf(w.text) !== w.hash) {
        bad.push([w.id, 'stale source hash']);
      }
    }
    for (const id of source.keys()) if (!seen.has(id)) bad.push([id, 'missing work post']);
    if (bad.length !== before) continue;
    let batch;
    try { batch = JSON.parse(fs.readFileSync(path.join(BATCHES, name), 'utf8')); }
    catch (e) { bad.push([base, 'JSON: ' + e.message]); continue; }
    const hashes = new Set(work.map(w => w.hash));
    for (const h of Object.keys(batch)) if (!hashes.has(h)) bad.push([base, 'extra hash ' + h.slice(0, 8)]);
    for (const w of work) {
      const fa = batch[w.hash];
      if (typeof fa !== 'string' || !fa.trim()) { bad.push([w.id, 'missing']); continue; }
      const issues = expertIssues(fa, w.text);
      const np = paragraphs(w.text);
      const fp = paragraphs(fa);
      if (issues.length) bad.push([w.id, issues.join(',')]);
      else if (np !== fp) bad.push([w.id, 'paragraphs ' + np + ' / ' + fp]);
      else {
        const missing = numberLosses(w.text, fa);
        const heads = quoteHeadLosses(w.text, fa);
        if (missing.length) bad.push([w.id, 'numbers missing ' + missing.slice(0, 6).join(', ')]);
        else if (heads) bad.push([w.id, 'quote heads ' + heads]);
        else accepted++;
      }
    }
  }
  console.log('accepted', accepted, '| rejected', bad.length);
  for (const b of bad) console.log('  ' + b.join(' | '));
  if (bad.length) process.exitCode = 1;
}

function parsePages(spec) {
  return String(spec || '').split(',').flatMap(part => {
    const m = part.match(/^(\d+)-(\d+)$/);
    if (!m) return [Number(part)];
    const out = [];
    for (let i = Number(m[1]); i <= Number(m[2]); i++) out.push(i);
    return out;
  }).filter(Boolean);
}

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};

if (args.includes('--validate')) validate();
else {
  const journal = flag('--journal', 'if');
  const pages = parsePages(flag('--pages', '1'));
  makeBatch(journal.toLowerCase(), pages);
}
