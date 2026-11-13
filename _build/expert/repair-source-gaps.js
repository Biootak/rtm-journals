#!/usr/bin/env node
/*
 * Repair source posts whose leading glyphs were dropped by the print import.
 *
 * The capture keeps the full sentence ("Republic of Tons of Money",
 * "Fading Volatility Basic (FVB)"); the parsed corpus lost the first letter of
 * each line because those spans were painted in the header band. The text is
 * replaced here, the translation hashes are re-keyed by post id, and the
 * Persian that was translated from the broken text is rewritten to match.
 *
 *   node _build/expert/repair-source-gaps.js [--write]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const BUILD = path.join(ROOT, '_build');
const PARSED = path.join(BUILD, 'parsed.json');
const WORK = path.join(BUILD, 'expert', 'work');
const BATCHES = path.join(BUILD, 'expert', 'batches');
const WRITE = process.argv.includes('--write');

const norm = t => String(t || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n').trim();
const hashOf = t => crypto.createHash('sha1').update(norm(t)).digest('hex');

const FIXES = {
  alex_p36_878: {
    before: 'Kovalenko wrote: No, Our country - RTM\n\nTheBeard wrote: Nice trading dude. Are you from UK?\n\nepublic of ons of oney',
    after: 'Kovalenko wrote: No, Our country - RTM\n\nTheBeard wrote: Nice trading dude. Are you from UK?\n\nRepublic of Tons of Money',
    fa: 'Kovalenko نوشت: نه، کشور ما — RTM\n\nTheBeard نوشت: تریدِ خوبی، رفیق. اهل UK هستی؟\n\nجمهوریِ تُن‌ها پول',
  },
  alex_p36_879: {
    before: 'A bit\n\nWhenever wrote:\n\nKovalenko wrote: No, Our country - RTM\n\nTheBeard wrote: Nice trading dude. Are you from UK?\n\nepublic of ons of oney',
    after: 'A bit\n\nWhenever wrote:\n\nKovalenko wrote: No, Our country - RTM\n\nTheBeard wrote: Nice trading dude. Are you from UK?\n\nRepublic of Tons of Money',
    fa: 'یه‌کم\n\nWhenever نوشت:\n\nKovalenko نوشت: نه، کشور ما — RTM\n\nTheBeard نوشت: تریدِ خوبی، رفیق. اهل UK هستی؟\n\nجمهوریِ تُن‌ها پول',
  },
  hgblacksheep_p12_299: {
    before: 'ading\n\nolatility\n\nasic (FVB\n\nWhile the CE is suitable for our main entry signal, it is nice to have a few more arrows in our quiver............',
    after: 'Fading Volatility Basic (FVB)\n\nWhile the CE is suitable for our main entry signal, it is nice to have a few more arrows in our quiver............',
    fa: 'نوسان پایهٔ محو‌شونده (FVB)\n\nهرچند CE برای سیگنال ورود اصلی ما مناسب است، خوب است چند تیر دیگر هم در ترکش داشته باشیم…',
  },
};

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

const parsed = readJson(PARSED, null);
if (!parsed) throw new Error('cannot read parsed.json');

const keyMap = new Map();
const report = [];
for (const journal of parsed.journals) {
  for (const post of journal.posts || []) {
    const fix = FIXES[post.id];
    if (!fix) continue;
    if (norm(post.text) !== norm(fix.before)) {
      throw new Error(`unexpected source text for ${post.id}: ${JSON.stringify(post.text)}`);
    }
    keyMap.set(hashOf(fix.before), { id: post.id, hash: hashOf(fix.after), fa: fix.fa });
    post.text = fix.after;
    report.push(post.id);
  }
}

let workChanged = 0;
for (const name of fs.readdirSync(WORK).filter(n => n.endsWith('.json'))) {
  const file = path.join(WORK, name);
  const rows = readJson(file, null);
  if (!Array.isArray(rows)) continue;
  let changed = false;
  for (const row of rows) {
    const fix = FIXES[row.id];
    if (!fix) continue;
    if (norm(row.text) === norm(fix.after)) continue; // already repaired
    const oldHash = hashOf(row.text);
    if (!keyMap.has(oldHash)) throw new Error(`work hash mismatch for ${row.id}`);
    row.text = fix.after;
    row.hash = keyMap.get(oldHash).hash;
    changed = true;
    workChanged++;
  }
  if (changed && WRITE) fs.writeFileSync(file, JSON.stringify(rows, null, 1), 'utf8');
}

let batchChanged = 0;
for (const name of fs.readdirSync(BATCHES).filter(n => n.endsWith('.json'))) {
  const file = path.join(BATCHES, name);
  const batch = readJson(file, null);
  if (!batch || typeof batch !== 'object') continue;
  let changed = false;
  for (const [oldHash, entry] of keyMap) {
    if (!(oldHash in batch)) continue;
    delete batch[oldHash];
    batch[entry.hash] = entry.fa;
    changed = true;
    batchChanged++;
  }
  if (changed && WRITE) fs.writeFileSync(file, JSON.stringify(batch, null, 1), 'utf8');
}

const leftover = [];
for (const journal of parsed.journals) {
  for (const post of journal.posts || []) {
    if (FIXES[post.id] && norm(post.text) === norm(FIXES[post.id].before)) leftover.push(post.id);
  }
}

if (WRITE && report.length) fs.writeFileSync(PARSED, JSON.stringify(parsed), 'utf8');

console.log(JSON.stringify({ posts: report.length, workChanged, batchChanged, leftover, write: WRITE }, null, 1));
if (leftover.length) process.exitCode = 1;
