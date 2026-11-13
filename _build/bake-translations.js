/*
 * Bake the raw machine translations into policy-checked output.
 *
 * The machine cache (_build/ocr/translations.json, _build/posts/translations.json)
 * is expensive to produce and is never edited by hand. This step reads it,
 * runs every block through translation-policy (glossary → machine → silence)
 * and writes the files the site build consumes:
 *
 *   _build/ocr/translations.baked.json
 *   _build/posts/translations.baked.json
 *   _build/quality-sample.txt     (human review sample)
 *
 * Usage:
 *   node bake-translations.js            # rewrite the baked files
 *   node bake-translations.js --report   # only print the quality report
 */
const fs = require('fs');
const path = require('path');
const lex = require('./lexicon.js');
const policy = require('./translation-policy.js');
const { relaxExpert } = require('./audit-relax.js');
const expert = require('./expert-store.js');

const ROOT = process.env.JOURNALS_ROOT || path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, '_build');
const OCR_DIR = path.join(BUILD, 'ocr');
const POSTS_DIR = path.join(BUILD, 'posts');

const REPORT_ONLY = process.argv.includes('--report');

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function writeJson(file, value) {
  fs.writeFileSync(file, JSON.stringify(value), 'utf8');
}

const MODE_LABEL = {
  expert: 'ترجمهٔ تخصصی',
  glossary: 'واژه‌نامه',
  machine: 'ماشینی پاک‌سازی‌شده',
  chrome: 'بدون نیاز به ترجمه',
  noise: 'OCR نامعتبر',
  untranslated: 'بدون ترجمه',
  empty: 'خالی',
};

function bakeOcr() {
  const raw = readJson(path.join(OCR_DIR, 'translations.json'), {});
  const out = {};
  const modes = {};
  let blocks = 0;
  let kept = 0;
  let dropped = 0;
  const sample = [];

  for (const [hash, entry] of Object.entries(raw)) {
    if (!entry || !Array.isArray(entry.blocks)) continue;
    const blocksOut = [];
    for (const b of entry.blocks || []) {
      const original = String(b.original || '').trim();
      if (!original) continue;
      blocks++;
      const before = lex.cleanText(b.persian || '');
      const r = policy.renderBlock(original, before, expert.ocrLine(original));
      modes[r.mode] = (modes[r.mode] || 0) + 1;
      if (r.fa) kept++; else dropped++;
      const box = Array.isArray(b.bbox) ? b.bbox : [0, 0, 0, 0];
      blocksOut.push({
        original,
        persian: r.fa,
        mode: r.mode,
        bbox: [
          Math.round(Number(box[0]) || 0), Math.round(Number(box[1]) || 0),
          Math.round(Number(box[2]) || 0), Math.round(Number(box[3]) || 0),
        ],
      });
      if (sample.length < 400 && original.length > 2 && original.length < 70) {
        sample.push({ hash, original, before, after: r.fa, mode: r.mode });
      }
    }
    if (!blocksOut.length) continue;
    out[hash] = {
      blocks: blocksOut,
      low: !!entry.low,
      ocrWidth: Number(entry.ocrWidth) || 0,
      ocrHeight: Number(entry.ocrHeight) || 0,
    };
  }
  return { out, modes, blocks, kept, dropped, sample };
}

function bakePosts() {
  const raw = readJson(path.join(POSTS_DIR, 'translations.json'), {});
  /* Quote heads need the source text: the machine cache alone cannot tell a
     lost name mask ("0 نوشت:") from a real number. */
  const sourceOf = (() => {
    const crypto = require('crypto');
    const parsed = readJson(path.join(BUILD, 'parsed.json'), null);
    const map = new Map();
    const normalize = t => String(t || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n').trim();
    for (const journal of (parsed && parsed.journals) || []) {
      for (const post of journal.posts || []) {
        if (!String(post.text || '').trim()) continue;
        map.set(crypto.createHash('sha1').update(normalize(post.text)).digest('hex'), post.text);
      }
    }
    return map;
  })();
  /* Hand-authored translations may exist for posts the machine never reached
     (empty posts, failed chunks). They still belong in the baked output. The
     batches directory is the drop-in area for per-page translator work. */
  const expertRaw = readJson(expert.POSTS_FILE, {});
  const batchDir = path.join(BUILD, 'expert', 'batches');
  try {
    for (const name of fs.readdirSync(batchDir).filter(n => n.endsWith('.json'))) {
      Object.assign(expertRaw, readJson(path.join(batchDir, name), {}));
    }
  } catch { /* no batches yet */ }
  for (const hash of Object.keys(expertRaw)) if (!(hash in raw)) raw[hash] = '';
  const out = {};
  const modes = {};
  let posts = 0;
  let kept = 0;
  let dropped = 0;
  const sample = [];

  for (const [hash, value] of Object.entries(raw)) {
    const before = lex.cleanText(value);
    /* The merged map (store + batches) is the truth; expert-store alone would
       ignore a correction made in a batch file. */
    const ex = String(expertRaw[hash] || '').trim();
    if (!before && !ex) continue;
    posts++;
    // A post body is always prose; the policy still cleans tokens, dates and
    // terminology, and refuses output that fails the audit.
    // An expert body is already prose; cleanMachine is the only step that both
    // normalises tokens and keeps the paragraph breaks the author wrote.
    const en = sourceOf.get(hash) || '';
    const fa = policy.repairQuoteHeads(en, ex ? policy.cleanMachine(ex, en) : policy.cleanMachine(before));
    let issues = fa ? lex.audit(fa, ex ? en : '').filter(i => i !== 'untranslated') : ['empty'];
    /* A hand translation may keep a source handle, an acronym beside Persian
       punctuation, or repeat a line the English itself repeats. Those are the
       same exemptions the expert validator applies, so a batch that passed
       `workflow.js --validate` must not be thrown away here. */
    if (ex && fa) issues = relaxExpert(issues, fa, en);
    /* A URL-only or ticker-only source has no prose to translate, so keeping it
       Latin is correct hand output, not a missing translation. */
    if (ex && fa && issues.length && issues.every(i => i === 'no-persian')
        && (!/[A-Za-z\u0600-\u06FF]/.test(en) || !lex.hasProse(en) || !/\s/.test(String(en).trim()))) {
      issues = [];
    }
    if (issues.includes('hallucination') && fa && policy.hallucinationJustified(fa, sourceOf.get(hash) || '')) {
      issues.splice(issues.indexOf('hallucination'), 1);
    }
    if (fa && !issues.length) {
      out[hash] = fa;
      modes[ex ? 'expert' : 'machine'] = (modes[ex ? 'expert' : 'machine'] || 0) + 1;
      kept++;
      if (sample.length < 60) sample.push({ hash, before: before.slice(0, 160), after: fa.slice(0, 160), mode: ex ? 'expert' : 'machine' });
    } else {
      dropped++;
      modes.rejected = (modes.rejected || 0) + 1;
    }
  }
  return { out, modes, posts, kept, dropped, sample };
}

function report(name, res, unit) {
  console.log(`\n=== ${name} ===`);
  console.log(`${unit}: ${res.blocks || res.posts}  |  با ترجمه: ${res.kept}  |  بدون ترجمه: ${res.dropped}`);
  for (const [mode, count] of Object.entries(res.modes).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${(MODE_LABEL[mode] || mode).padEnd(24)} ${count}`);
  }
}

function main() {
  const ocr = bakeOcr();
  const posts = bakePosts();
  report('OCR lines', ocr, 'خط OCR');
  report('Post bodies', posts, 'پست');

  if (!REPORT_ONLY) {
    writeJson(path.join(OCR_DIR, 'translations.baked.json'), ocr.out);
    writeJson(path.join(POSTS_DIR, 'translations.baked.json'), posts.out);
    const lines = ['=== نمونه بازبینی ترجمه (قبل → بعد) ===', ''];
    for (const s of ocr.sample.slice(0, 220)) {
      lines.push(`[${s.mode}] ${s.original}`);
      lines.push(`   قبل: ${s.before || '—'}`);
      lines.push(`   بعد: ${s.after || '— (فقط متن اصلی نمایش داده می‌شود)'}`);
    }
    lines.push('', '=== نمونه ترجمه پست‌ها ===', '');
    for (const s of posts.sample.slice(0, 20)) {
      lines.push(`[${s.hash.slice(0, 8)}] ${s.after}`, '');
    }
    fs.writeFileSync(path.join(BUILD, 'quality-sample.txt'), lines.join('\n'), 'utf8');
    console.log('\nنوشته شد:');
    console.log('  _build/ocr/translations.baked.json');
    console.log('  _build/posts/translations.baked.json');
    console.log('  _build/quality-sample.txt');
  }
}

try {
  main();
} catch (e) {
  console.error(e);
  process.exit(1);
}
