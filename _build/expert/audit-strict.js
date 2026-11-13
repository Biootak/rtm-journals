#!/usr/bin/env node
/*
 * Strict semantic-hygiene audit over the expert translation layer.
 *
 * The older audits exempt any Latin word that also exists in the English
 * source, which lets ordinary words ("textbook", "imagine", "spot", "guys",
 * "research") survive inside Persian prose. This audit only allows what the
 * style guide deliberately keeps Latin:
 *   - acronyms / tickers (all caps, <= 7 chars)
 *   - tokens carrying a digit (H4, M15, R2, 3drive)
 *   - proper nouns and handles that are capitalised or all-caps in the source
 *   - platform / product names
 *   - URLs and file names
 * Everything else is residual English. It also reports foreign-script
 * contamination (Cyrillic, CJK, Vietnamese), Persian digits, broken words,
 * paragraph drift, length outliers and unbalanced brackets.
 *
 *   node _build/expert/audit-strict.js
 *   node _build/expert/audit-strict.js --write   # also write JSON report
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const WORK = path.join(__dirname, 'work');
const BATCHES = path.join(__dirname, 'batches');
const OUT = path.join(__dirname, 'strict-report.json');

const normalize = t => String(t || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n').trim();
const hashOf = t => crypto.createHash('sha1').update(normalize(t)).digest('hex');
const paragraphs = s => String(s || '').split(/\n{2,}/).filter(x => x.trim());

const PLATFORMS = new Set([
  'metatrader', 'mt4', 'mt5', 'tradingview', 'forextester', 'forex', 'skype',
  'youtube', 'telegram', 'discord', 'windows', 'excel', 'word', 'pdf', 'jpg',
  'jpeg', 'png', 'gif', 'mp4', 'html', 'http', 'https', 'www', 'com', 'net',
  'org', 'index', 'php', 'forum', 'rtm', 'readthemarket', 'twitter', 'facebook',
  'instagram', 'vimeo', 'imgur', 'photobucket', 'tinypic', 'google', 'chrome',
  'firefox', 'shift', 'ctrl', 'alt', 'tab', 'enter', 'esc', 'lol', 'omg',
  'btw', 'tbh', 'imo', 'imho', 'afaik', 'yolo', 'ok', 'okay', 'hi', 'hey',
]);

const FOREIGN = [
  [/[\u0400-\u04FF]/, 'cyrillic'],
  [/[\u4E00-\u9FFF\u3040-\u30FF]/, 'cjk'],
  [/[\uAC00-\uD7AF]/, 'hangul'],
  [/[\u0530-\u058F]/, 'armenian'],
  [/[\u10A0-\u10FF]/, 'georgian'],
  [/[ạảãếệểễỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹđơư]/i, 'vietnamese'],
];

const FA_DIGIT = /[۰-۹٠-٩]/;

/* Emoticons such as ":)" or ":)>-" are not unbalanced brackets. The bracket
   check strips them before counting so a friendly post is not flagged. */
const stripEmoticons = s => String(s || '')
  .replace(/[:;=8xX][-']?[)(\[\]{}dDpPoO/\\|*@]+/g, ' ')
  .replace(/<3/g, ' ');

function properNounsOf(en, authors) {
  const set = new Set(authors);
  const text = String(en || '');
  const starts = new Set();
  for (const m of text.matchAll(/(?:^|[.!?]\s+|\n\s*)([A-Za-z][A-Za-z0-9_.+-]{1,40})/g)) {
    starts.add(m[1].toLowerCase());
  }
  for (const m of text.matchAll(/\b[A-Za-z][A-Za-z0-9_.+-]{1,40}\b/g)) {
    const t = m[0];
    if (/^[A-Z0-9]{2,}$/.test(t)) set.add(t.toLowerCase());
    else if (/^[A-Z]/.test(t) && !starts.has(t.toLowerCase())) set.add(t.toLowerCase());
  }
  for (const m of text.matchAll(/(?:^|\n)\s*([A-Za-z][A-Za-z0-9_.+-]{1,32})\s+(?:wrote|writes)\s*:/gi)) {
    set.add(m[1].toLowerCase());
  }
  return set;
}

function latinTokens(fa, en, authors) {
  const proper = properNounsOf(en, authors);
  const clean = String(fa || '')
    .replace(/https?:\/\/\S+|www\.\S+/g, ' ')
    .replace(/\b[\w-]+(?:\.[\w-]+)+\S*/g, ' ');
  const out = [];
  for (const m of clean.matchAll(/(^|[^\u0600-\u06FF])([A-Za-z][A-Za-z0-9_.+-]{0,40})/g)) {
    const t = m[2].replace(/[.,;:!?]+$/, '');
    const low = t.toLowerCase();
    if (t.length < 2) continue;
    if (/^[A-Z0-9]{2,7}$/.test(t)) continue;          // FL, FTR, USD, HTF
    if (/\d/.test(t)) continue;                        // H4, M15, R2, 3drive
    if (PLATFORMS.has(low)) continue;
    if (proper.has(low)) continue;                     // source capitalised it
    out.push(t);
  }
  return out;
}

const rows = [];
const perJournal = {};
let posts = 0;
const seen = new Set();

const onlyArg = process.argv.indexOf('--page');
const only = new Set();
if (onlyArg >= 0) {
  for (const arg of process.argv.slice(onlyArg + 1)) {
    if (arg.startsWith('--')) break;
    for (const p of arg.split(',')) if (p) only.add(p);
  }
}

for (const name of fs.readdirSync(BATCHES).filter(n => n.endsWith('.json')).sort()) {
  const base = name.replace(/\.json$/, '');
  if (only.size && !only.has(base)) continue;
  const workFile = path.join(WORK, name);
  if (!fs.existsSync(workFile)) continue;
  let work, batch;
  try {
    work = JSON.parse(fs.readFileSync(workFile, 'utf8'));
    batch = JSON.parse(fs.readFileSync(path.join(BATCHES, name), 'utf8'));
  } catch (e) {
    console.log('SKIP invalid', name, e.message);
    continue;
  }
  const journal = base.replace(/-p\d+$/, '');
  perJournal[journal] = perJournal[journal] || { posts: 0, flagged: 0, residual: 0, foreign: 0, ratio: 0 };
  const authors = new Set(work.map(w => String(w.author || '').toLowerCase()).filter(Boolean));
  for (const w of work) {
    for (const m of String(w.text || '').matchAll(/(?:^|\n)\s*([A-Za-z][A-Za-z0-9_.+-]{1,32})\s+(?:wrote|writes)\s*:/gi)) {
      authors.add(m[1].toLowerCase());
    }
  }
  for (const w of work) {
    if (seen.has(w.hash)) continue;
    seen.add(w.hash);
    const fa = String(batch[w.hash] || '').trim();
    if (!fa) continue;
    posts++;
    perJournal[journal].posts++;
    const flags = [];
    const latin = latinTokens(fa, w.text, authors);
    if (latin.length) {
      flags.push('residual:' + [...new Set(latin)].slice(0, 6).join(','));
      perJournal[journal].residual++;
    }
    for (const [re, label] of FOREIGN) if (re.test(fa)) { flags.push('foreign:' + label); break; }
    if (FOREIGN.some(([re]) => re.test(fa))) perJournal[journal].foreign++;
    if (FA_DIGIT.test(fa)) flags.push('persian-digits');
    const broken = fa.match(/[\u0600-\u06FF]+[A-Za-z]{2,}[\u0600-\u06FF]+/g) || [];
    if (broken.length) flags.push('broken-word:' + broken.slice(0, 3).join(','));
    const enP = paragraphs(w.text), faP = paragraphs(fa);
    if (enP.length !== faP.length) flags.push(`paragraphs:${enP.length}/${faP.length}`);
    const enLen = Math.max(1, normalize(w.text).length);
    const ratio = normalize(fa).length / enLen;
    if (enLen > 250 && ratio < 0.5) flags.push('omitted');
    if (ratio > 2.4) flags.push('expanded');
    if (ratio < 0.5 || ratio > 2.4) perJournal[journal].ratio++;
    const opens = (stripEmoticons(fa).match(/\(/g) || []).length, closes = (stripEmoticons(fa).match(/\)/g) || []).length;
    if (opens !== closes) flags.push('brackets');
    const qo = (fa.match(/«/g) || []).length, qc = (fa.match(/»/g) || []).length;
    if (qo !== qc) flags.push('quotes');
    if (!flags.length) continue;
    perJournal[journal].flagged++;
    rows.push({ id: w.id, journal, page: base, flags, ratio: Number(ratio.toFixed(2)), fa: fa.slice(0, 160) });
  }
}

const flagged = rows.length;
const byFlag = {};
for (const r of rows) for (const f of r.flags) {
  const key = f.split(':')[0];
  byFlag[key] = (byFlag[key] || 0) + 1;
}

console.log(`unique translated posts: ${posts}`);
console.log(`flagged posts: ${flagged} (${(flagged / Math.max(1, posts) * 100).toFixed(1)}%)`);
console.log('by category:', JSON.stringify(byFlag, null, 0));
console.log('\nper journal (flagged/posts, residual, foreign, ratio):');
for (const [j, v] of Object.entries(perJournal).sort((a, b) => b[1].flagged - a[1].flagged).slice(0, 30)) {
  console.log(`  ${j.padEnd(22)} ${String(v.flagged).padStart(4)}/${String(v.posts).padEnd(4)} residual ${String(v.residual).padStart(4)} foreign ${String(v.foreign).padStart(3)} ratio ${String(v.ratio).padStart(3)}`);
}
console.log('\nworst pages:');
const pageScore = {};
for (const r of rows) pageScore[r.page] = (pageScore[r.page] || 0) + 1;
for (const [p, n] of Object.entries(pageScore).sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log(`  ${p} ${n}`);

if (process.argv.includes('--write')) {
  fs.writeFileSync(OUT, JSON.stringify({ posts, flagged, byFlag, perJournal, rows }, null, 1), 'utf8');
  console.log('\nwrote', path.relative(ROOT, OUT));
}
if (process.argv.includes('--fail') && flagged) process.exitCode = 1;
