#!/usr/bin/env node
/*
 * Repair the ligature damage left by the print importer.
 *
 * Some PDF text layers stored the fi/ff/fl ligature as a control byte, so the
 * corpus contains "de\u0000nitely", "o\u0000", "\u0000ag". The replacement is
 * decided by the whole word and checked against the local capture, never by
 * guessing a single character:
 *   de□nitely -> definitely    □ag -> flag    o□ -> off    □ve -> five
 * One occurrence is not a ligature at all: "posting□ In" is a lost space.
 *
 * Changing post text changes its SHA-1, so every batch key and every work-file
 * hash for the touched posts is re-keyed by post id. No translation is lost.
 *
 *   node _build/expert/repair-ligatures.js           # dry run
 *   node _build/expert/repair-ligatures.js --write
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const BUILD = path.join(ROOT, '_build');
const WORK = path.join(__dirname, 'work');
const BATCHES = path.join(__dirname, 'batches');
const PARSED = path.join(BUILD, 'parsed.json');
const WRITE = process.argv.includes('--write');

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/;
const REPAIRS = [
  [/de\u0000nitely/g, 'definitely'],
  [/de\u0000netely/g, 'definetely'],
  [/o\u0000 course/g, 'off course'],
  [/o\u0000 of/g, 'off of'],
  [/engul\u0000ng/g, 'engulfing'],
  [/signi\u0000cant/g, 'significant'],
  [/identi\u0000ed/g, 'identified'],
  [/de\u0000nitions/g, 'definitions'],
  [/con\u0000rmation/g, 'confirmation'],
  [/di\u0000erent/g, 'different'],
  [/pro\u0000t/g, 'profit'],
  [/\u0000ipping/g, 'flipping'],
  [/\u0000ght/g, 'fight'],
  [/\u0000ip/g, 'flip'],
  [/stu\u0000s/g, 'stuffs'],
  [/\u0000rst/g, 'first'],
  [/\u0000nd/g, 'find'],
  [/\u0000ve/g, 'five'],
  [/\u0000ag/g, 'flag'],
  [/posting\u0000/g, 'posting '],
];

const normalize = t => String(t || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n').trim();
const hashOf = t => crypto.createHash('sha1').update(normalize(t)).digest('hex');

const parsed = JSON.parse(fs.readFileSync(PARSED, 'utf8'));
const postById = new Map();
const oldHashById = new Map();
let touched = 0;
for (const journal of parsed.journals || []) {
  for (const post of journal.posts || []) {
    const before = String(post.text || '');
    let after = before;
    for (const [re, to] of REPAIRS) after = after.replace(re, to);
    if (after === before) continue;
    touched++;
    postById.set(post.id, { post, before, after });
    oldHashById.set(post.id, hashOf(before));
    post.text = after;
    if (CONTROL.test(after)) throw new Error('control byte survives in ' + post.id);
  }
}
console.log('posts repaired:', touched);
console.log('remaining control bytes:', (JSON.stringify(parsed).match(/\\u000[0-9a-f]/g) || []).length);

/* Re-key work and batch files: old hash -> new hash, matched by post id. */
let workTouched = 0, batchTouched = 0, lost = 0;
for (const name of fs.readdirSync(WORK).filter(n => n.endsWith('.json'))) {
  const work = JSON.parse(fs.readFileSync(path.join(WORK, name), 'utf8'));
  let dirty = false;
  for (const w of work) {
    const rec = postById.get(w.id);
    if (!rec) continue;
    const newHash = hashOf(rec.after);
    if (w.hash === newHash && w.text === rec.after) continue;
    w.text = rec.after;
    w.hash = newHash;
    dirty = true;
    workTouched++;
  }
  if (dirty && WRITE) fs.writeFileSync(path.join(WORK, name), JSON.stringify(work, null, 1), 'utf8');

  const batchFile = path.join(BATCHES, name);
  if (!fs.existsSync(batchFile)) continue;
  const batch = JSON.parse(fs.readFileSync(batchFile, 'utf8'));
  let bdirty = false;
  for (const w of work) {
    const rec = postById.get(w.id);
    if (!rec) continue;
    const oldHash = oldHashById.get(w.id);
    const newHash = hashOf(rec.after);
    if (oldHash === newHash) continue;
    if (Object.prototype.hasOwnProperty.call(batch, oldHash)) {
      batch[newHash] = batch[oldHash];
      delete batch[oldHash];
      bdirty = true;
      batchTouched++;
    } else if (Object.prototype.hasOwnProperty.call(batch, newHash)) {
      /* already re-keyed */
    } else {
      lost++;
      console.log('missing translation for', w.id, name);
    }
  }
  if (bdirty && WRITE) fs.writeFileSync(batchFile, JSON.stringify(batch), 'utf8');
}
console.log('work entries re-keyed:', workTouched, 'batch keys re-keyed:', batchTouched, 'lost:', lost);

if (WRITE) {
  const backup = path.join(BUILD, 'parsed.before-ligature-fix.json');
  if (!fs.existsSync(backup)) fs.copyFileSync(PARSED, backup);
  fs.writeFileSync(PARSED, JSON.stringify(parsed), 'utf8');
  console.log('wrote parsed.json (backup:', path.relative(ROOT, backup) + ')');
} else {
  console.log('dry run; pass --write to save');
}
