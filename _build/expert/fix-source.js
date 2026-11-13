#!/usr/bin/env node
/*
 * Repair English source text in _build/parsed.json and carry the hand
 * translation across the hash change.
 *
 * Translation keys are sha1(normalized English), and the site looks Persian up
 * by hashing the shipped post text. So a source repair must re-key work files,
 * batch files and the expert store by post id in the same pass, or every fixed
 * post would lose its Persian.
 *
 * Repairs applied (conservative, exact matches only):
 *   ligature-loss   "pro t" → "profit", "engulng" → "engulfing", …
 *   chrome          a standalone forum-furniture line
 *   card-leak       a standalone author-card field line
 *
 * Usage:
 *   node _build/expert/fix-source.js --report
 *   node _build/expert/fix-source.js --apply
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const BUILD = path.join(ROOT, '_build');
const WORK = path.join(__dirname, 'work');
const BATCH = path.join(__dirname, 'batches');
const STORE_FILE = path.join(__dirname, 'posts.json');
const PARSED = path.join(BUILD, 'parsed.json');
const APPLY = process.argv.includes('--apply');

const normalize = t => String(t || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n').trim();
const hashOf = t => crypto.createHash('sha1').update(normalize(t)).digest('hex');

/* The print's ligature glyphs were extracted as C1 control bytes. In context
   they are unambiguous: "engul\x86ng" is engulfing, "di\x83erent" different,
   "su\x84cient" sufficient, "o\x85ine" offline, "\x87ag" flag. */
const CONTROL = {
  '\u0083': 'ff',
  '\u0084': 'ffi',
  '\u0085': 'ffl',
  '\u0086': 'fi',
  '\u0087': 'fl',
  '\u200B': '',
};

// Only distinctive broken tokens: ambiguous fragments ("re", "ll", "rm") are
// deliberately absent, because they are ordinary words on their own.
const LIGATURES = {
  'engulng': 'engulfing',
  'engul ng': 'engulfing',
  'signi cant': 'significant',
  'signi cantly': 'significantly',
  'signi cance': 'significance',
  'speci c': 'specific',
  'speci cally': 'specifically',
  'de ne': 'define',
  'de nes': 'defines',
  'de ned': 'defined',
  'de ning': 'defining',
  'de nition': 'definition',
  'con rm': 'confirm',
  'con rmed': 'confirmed',
  'con rms': 'confirms',
  'con rming': 'confirming',
  'con rmation': 'confirmation',
  'bene t': 'benefit',
  'bene ts': 'benefits',
  'bene cial': 'beneficial',
  'dif cult': 'difficult',
  'dif culty': 'difficulty',
  'dif culties': 'difficulties',
  ' rst': 'first',
  ' nally': 'finally',
  ' nal': 'final',
  ' gure': 'figure',
  ' gures': 'figures',
  'classi cation': 'classification',
  'identi cation': 'identification',
  'veri cation': 'verification',
  'justi cation': 'justification',
  'noti cation': 'notification',
  'modi cation': 'modification',
  'certi cate': 'certificate',
  'ef cient': 'efficient',
  'ef ciency': 'efficiency',
  'suf cient': 'sufficient',
  'insuf cient': 'insufficient',
  'brie y': 'briefly',
  're ection': 'reflection',
  'in ation': 'inflation',
  'arti cial': 'artificial',
  'super cial': 'superficial',
  'satis ed': 'satisfied',
  'quali ed': 'qualified',
  'de nitely': 'definitely',
  'con dence': 'confidence',
  'offi ce': 'office',
  'in uence': 'influence',
  'ampli ed': 'amplified',
  'simpli ed': 'simplified',
  'justi ed': 'justified',
  'modi ed': 'modified',
  'noti ed': 'notified',
  'identi ed': 'identified',
  'identi es': 'identifies',
  'veri ed': 'verified',
  'classi ed': 'classified',
  'specifc': 'specific',
};

const CHROME = new Set([
  'Privacy Policy', 'Terms of Use', 'DISCLAIMER', 'Quick Reply', 'RTM Community',
  'Powered by vBulletin', 'Powered by vBulletin®',
]);
const CHROME_RE = [/^Page \d+ of \d+$/i, /^Powered by vBulletin/i];
// Only a bare field line is card furniture. "Location: Price is reacting …"
// is a member's post, and "Thanks:)" is prose, so both must survive.
const CARD_RE = /^(?:Location|Join Date|Posts|Thank you received|Reputation|Blog Entries|Articles)\s*:?\s*$/i;

function repairText(text) {
  let out = String(text || '');
  const hits = { ligature: 0, chrome: 0, card: 0 };
  for (const [ch, to] of Object.entries(CONTROL)) {
    if (out.includes(ch)) { hits.ligature += out.split(ch).length - 1; out = out.split(ch).join(to); }
  }
  out = out.replace(/\b(?:engul ng|engulng|signi cance|signi cantly|signi cant|speci cally|speci c|de nition|de ning|de nes|de ned|de ne|con rmation|con rming|con rmed|con rms|con rm|pro tability|pro table|pro ts|pro t|bene cial|bene ts|bene t|dif culties|dif culty|dif cult| nally| nal| rst| gures| gure|classi cation|identi cation|veri cation|justi cation|noti cation|modi cation|certi cate|ef ciency|ef cient|insuf cient|suf cient|brie y|re ection|in ation|arti cial|super cial|satis ed|quali ed|de nitely|con dence|offi ce|in uence|ampli ed|simpli ed|justi ed|modi ed|noti ed|identi es|identi ed|veri ed|classi ed|specifc)\b/gi, m => {
    const key = m.toLowerCase().replace(/\s+/g, ' ');
    const good = LIGATURES[key];
    if (!good) return m;
    hits.ligature++;
    if (/^[A-Z]/.test(m)) return good[0].toUpperCase() + good.slice(1);
    return good;
  });
  const paras = out.split(/\n{2,}/);
  const kept = [];
  for (const p of paras) {
    const t = p.trim();
    if (CHROME.has(t) || CHROME_RE.some(re => re.test(t))) { hits.chrome++; continue; }
    kept.push(p);
  }
  out = kept.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
  return { text: out, hits };
}

const parsed = JSON.parse(fs.readFileSync(PARSED, 'utf8'));
const postById = new Map();
for (const thread of parsed.journals || []) for (const post of thread.posts || []) postById.set(post.id, post);

const totals = { ligature: 0, chrome: 0, card: 0, changed: 0, rekKeyed: 0, missingFa: 0, collisions: 0 };
const changedIds = [];
const oldToNew = new Map();

for (const post of postById.values()) {
  if (!String(post.text || '').trim()) continue;
  const before = post.text;
  const r = repairText(before);
  if (r.text === before.trim()) continue;
  if (!r.text) continue;
  totals.ligature += r.hits.ligature;
  totals.chrome += r.hits.chrome;
  totals.card += r.hits.card;
  totals.changed++;
  changedIds.push(post.id);
  if (!APPLY) continue;
  const oldHash = hashOf(before);
  post.text = r.text;
  oldToNew.set(oldHash, hashOf(r.text));
}

console.log('changed posts', totals.changed, '| ligature', totals.ligature, '| chrome', totals.chrome, '| card', totals.card);
console.log('sample', changedIds.slice(0, 12).join(', '));
if (!APPLY) {
  const preview = changedIds.slice(0, 8).map(id => {
    const p = postById.get(id);
    return `  - ${id}: ${repairText(p.text).text.slice(0, 130).replace(/\n/g, ' / ')}`;
  });
  console.log(preview.join('\n'));
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backup = path.join(BUILD, 'backup-fix-' + stamp);
fs.mkdirSync(backup, { recursive: true });
fs.copyFileSync(PARSED, path.join(backup, 'parsed.json'));
fs.cpSync(WORK, path.join(backup, 'work'), { recursive: true });
fs.cpSync(BATCH, path.join(backup, 'batches'), { recursive: true });
if (fs.existsSync(STORE_FILE)) fs.copyFileSync(STORE_FILE, path.join(backup, 'posts.json'));
console.log('backup:', path.relative(ROOT, backup));

fs.writeFileSync(PARSED, JSON.stringify(parsed), 'utf8');

// Re-key every work/batch pair by post id: old hash carries the hand Persian.
let pages = 0;
for (const file of fs.readdirSync(WORK).filter(f => f.endsWith('.json'))) {
  const page = file.replace(/\.json$/, '');
  const work = JSON.parse(fs.readFileSync(path.join(WORK, file), 'utf8'));
  const batchFile = path.join(BATCH, file);
  const batch = fs.existsSync(batchFile) ? JSON.parse(fs.readFileSync(batchFile, 'utf8')) : {};
  const nextWork = [];
  const nextBatch = {};
  for (const w of work) {
    const post = postById.get(w.id);
    if (!post) { nextWork.push(w); if (batch[w.hash]) nextBatch[w.hash] = batch[w.hash]; continue; }
    const text = normalize(post.text);
    const newHash = hashOf(text);
    const fa = batch[w.hash] || '';
    if (!fa) totals.missingFa++;
    if (nextBatch[newHash] && nextBatch[newHash] !== fa) totals.collisions++;
    if (fa) nextBatch[newHash] = fa;
    nextWork.push({ id: w.id, hash: newHash, author: w.author || post.author || '', text });
    if (w.hash !== newHash) totals.rekKeyed++;
  }
  fs.writeFileSync(path.join(WORK, file), JSON.stringify(nextWork), 'utf8');
  fs.writeFileSync(batchFile, JSON.stringify(nextBatch), 'utf8');
  pages++;
}

// The store is the second translation source the bake merges; move its keys.
if (fs.existsSync(STORE_FILE)) {
  const store = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  const next = {};
  for (const [h, fa] of Object.entries(store)) next[oldToNew.get(h) || h] = fa;
  fs.writeFileSync(STORE_FILE, JSON.stringify(next), 'utf8');
}

console.log(`re-keyed ${totals.rekKeyed} posts across ${pages} pages | missing FA ${totals.missingFa} | collisions ${totals.collisions}`);
console.log('parsed.json written');
