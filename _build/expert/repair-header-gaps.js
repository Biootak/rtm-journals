#!/usr/bin/env node
/* Repair the five header/joiner losses found by test-header-top.py.
   Each edit is an exact, asserted replacement; old translation hashes are
   re-keyed by post id and the added Persian stays in the same paragraph. */
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

const normalize = t => String(t || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n').trim();
const hashOf = t => crypto.createHash('sha1').update(normalize(t)).digest('hex');

const TARGETS = [
  {
    page: 'frosty-p10', id: 'frosty_p10_21',
    enFrom: 'haven’t been picked up on the way up.',
    enTo: 'But, then the FTR/FL diagram really got me thinking about orders that haven’t been picked up on the way up.',
    faFrom: 'در مسیر بالا برداشته نشده‌اند.',
    faTo: 'ولی بعد، دیاگرام FTR/FL واقعاً ذهنم را درگیر سفارش‌هایی کرد که در مسیر بالا برداشته نشده‌اند.',
  },
  {
    page: 'frosty-p12', id: 'frosty_p12_18',
    enFrom: 'golden plate, The many eureka moments',
    enTo: 'golden plate, you might be right in that matter. The many eureka moments',
    faFrom: 'در پاسخ به صحبتت دربارهٔ اطلاعاتی که با سینی طلایی تقدیم می‌شود: آن همه',
    faTo: 'در پاسخ به صحبتت دربارهٔ اطلاعاتی که با سینی طلایی تقدیم می‌شود: شاید در این مورد حق با تو باشد. آن همه',
  },
  {
    page: 'frosty-p12', id: 'frosty_p12_19',
    enFrom: "I still didn't find true gold here but it has to be mined.",
    enTo: "I still didn't find true profitability or anything approaching what is being taught here. There is gold here but it has to be mined.",
    faFrom: 'وقت و پول صرف جست‌وجو کرده‌ام و باز هم طلای واقعی را نیافتم؛ اما اینجا باید آن را استخراج کرد.',
    faTo: 'وقت و پول صرف جست‌وجو کرده‌ام و باز هم سوددهی واقعی یا چیزی نزدیک به آنچه اینجا آموزش داده می‌شود پیدا نکردم. طلا اینجاست، ولی باید استخراج شود.',
  },
  {
    page: 'frosty-p4', id: 'frosty_p4_22',
    enFrom: 'annihilation ofmentality',
    enTo: 'annihilation of mentality',
    faFrom: null, faTo: null,
  },
  {
    page: 'kruger-p16', id: 'kruger_p16_21',
    enFrom: "didn'texpect",
    enTo: "didn't expect",
    faFrom: null, faTo: null,
  },
  {
    page: 'kruger-p16', id: 'kruger_p16_21',
    enFrom: 'withoutsetting',
    enTo: 'without setting',
    faFrom: null, faTo: null,
  },
];

const parsed = JSON.parse(fs.readFileSync(PARSED, 'utf8'));
const postById = new Map();
for (const j of parsed.journals) for (const p of j.posts) postById.set(p.id, p);

const byPage = new Map();
for (const t of TARGETS) {
  if (!byPage.has(t.page)) byPage.set(t.page, new Map());
  byPage.get(t.page).set(t.id, t);
}

const changed = [];
for (const [page, targets] of byPage) {
  const workFile = path.join(WORK, page + '.json');
  const batchFile = path.join(BATCH, page + '.json');
  const work = JSON.parse(fs.readFileSync(workFile, 'utf8'));
  const batch = JSON.parse(fs.readFileSync(batchFile, 'utf8'));
  const store = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));

  for (const w of work) {
    const t = targets.get(w.id);
    if (!t) continue;
    const post = postById.get(w.id);
    if (!post) throw new Error('parsed post missing: ' + w.id);
    const oldText = post.text;
    let newText = oldText;
    for (const edit of TARGETS.filter(x => x.id === w.id)) {
      if (!newText.includes(edit.enFrom)) throw new Error(`${w.id}: English snippet not found: ${edit.enFrom}`);
      newText = newText.replace(edit.enFrom, edit.enTo);
    }
    if (newText === oldText) throw new Error(w.id + ': no change');
    const oldHash = hashOf(oldText);
    const newHash = hashOf(newText);
    const oldFa = batch[oldHash] ?? store[oldHash];
    if (!oldFa) throw new Error(w.id + ': no Persian under ' + oldHash);

    let fa = oldFa;
    for (const edit of TARGETS.filter(x => x.id === w.id && x.faFrom)) {
      if (!fa.includes(edit.faFrom)) throw new Error(`${w.id}: Persian snippet not found`);
      fa = fa.replace(edit.faFrom, edit.faTo);
    }

    post.text = newText;
    w.hash = newHash;
    w.text = normalize(newText);
    delete batch[oldHash];
    if (store[oldHash]) delete store[oldHash];
    batch[newHash] = fa;
    store[newHash] = fa;
    changed.push({ id: w.id, page, oldHash: oldHash.slice(0, 8), newHash: newHash.slice(0, 8) });
  }

  fs.writeFileSync(workFile, JSON.stringify(work), 'utf8');
  fs.writeFileSync(batchFile, JSON.stringify(batch), 'utf8');
  fs.writeFileSync(STORE_FILE, JSON.stringify(store), 'utf8');
}

fs.writeFileSync(PARSED, JSON.stringify(parsed), 'utf8');
console.log('repaired', changed.length, 'posts');
for (const c of changed) console.log(' ', c.page, c.id, c.oldHash, '->', c.newHash);
