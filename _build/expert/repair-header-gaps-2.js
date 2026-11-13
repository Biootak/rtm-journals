#!/usr/bin/env node
/* Second deterministic header repair pass: joined words, one dropped
   sentence in dbrrbd, and the flaglimits page-break sentence. */
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
    page: 'mm-p8', id: 'mm_p8_11',
    enFrom: 'looking to short itat around current level',
    enTo: 'looking to short it at around current level',
    faFrom: null, faTo: null,
  },
  {
    page: 'dbrrbd-p3', id: 'dbrrbd_p3_64',
    enFrom: 'ACE Trader! teacher needs',
    enTo: 'ACE Trader! Homework posts are coming but this teacher needs',
    faFrom: null, faTo: null,
  },
  {
    page: 'flaglimits-p53', id: 'flaglimits_p53_1306',
    enFrom: "burried somewhere in this\n\nCHART 15 - MULTI TOUCH",
    enTo: "burried somewhere in this\n\nForum - might have to hunt it to 2013 posts but i'll find it 1day.\n\nCHART 15 - MULTI TOUCH",
    faFrom: 'جایی در همین‌ها دفن شده است',
    faTo: 'جایی در همین‌ها دفن شده است.\n\nفروم — شاید مجبور شوم تا پست‌های 2013 بگردم، اما یک روز پیدایش می‌کنم.',
  },
];

const parsed = JSON.parse(fs.readFileSync(PARSED, 'utf8'));
const postById = new Map();
for (const j of parsed.journals) for (const p of j.posts) postById.set(p.id, p);

const byPage = new Map();
for (const t of TARGETS) {
  if (!byPage.has(t.page)) byPage.set(t.page, new Set());
  byPage.get(t.page).add(t.id);
}

const store = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
const changed = [];
for (const [page, ids] of byPage) {
  const workFile = path.join(WORK, page + '.json');
  const batchFile = path.join(BATCH, page + '.json');
  const work = JSON.parse(fs.readFileSync(workFile, 'utf8'));
  const batch = JSON.parse(fs.readFileSync(batchFile, 'utf8'));
  for (const w of work) {
    if (!ids.has(w.id)) continue;
    const post = postById.get(w.id);
    if (!post) throw new Error('parsed post missing: ' + w.id);
    let newText = post.text;
    for (const edit of TARGETS.filter(x => x.id === w.id)) {
      if (!newText.includes(edit.enFrom)) throw new Error(`${w.id}: English snippet not found: ${edit.enFrom}`);
      newText = newText.replace(edit.enFrom, edit.enTo);
    }
    const oldHash = hashOf(post.text);
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
}
fs.writeFileSync(STORE_FILE, JSON.stringify(store), 'utf8');
fs.writeFileSync(PARSED, JSON.stringify(parsed), 'utf8');
console.log('repaired', changed.length, 'posts');
for (const c of changed) console.log(' ', c.page, c.id, c.oldHash, '->', c.newHash);
