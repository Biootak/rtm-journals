#!/usr/bin/env node
/*
 * Correct the systematic "flag → پرچم" mistranslation.
 *
 * In RTM material flag is the continuation pattern, rendered «فلگ»; «پرچم» is
 * the classical-TA/national-flag word and reads as machine output. A batch
 * entry is only touched when its own English source actually says flag.
 *
 *   node _build/expert/fix-glossary.js          # report
 *   node _build/expert/fix-glossary.js --write  # rewrite affected batches
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const BUILD = path.join(ROOT, '_build');
const BATCHES = path.join(BUILD, 'expert', 'batches');
const WRITE = process.argv.includes('--write');

const norm = t => String(t || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n').trim();
const hashOf = t => crypto.createHash('sha1').update(norm(t)).digest('hex');

const parsed = JSON.parse(fs.readFileSync(path.join(BUILD, 'parsed.json'), 'utf8'));
const source = new Map();
for (const journal of parsed.journals) {
  for (const post of journal.posts || []) {
    if (norm(post.text)) source.set(hashOf(post.text), post.text);
  }
}

const FLAG_FA = /پرچم(‌ها|هایی|های|ها)?/g;
const files = fs.readdirSync(BATCHES).filter(n => n.endsWith('.json'));
const changedFiles = [];
let changedPosts = 0;
let changedTokens = 0;
let skippedNoSource = 0;
const examples = [];

for (const name of files) {
  const file = path.join(BATCHES, name);
  let batch;
  try { batch = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { continue; }
  let dirty = false;
  for (const [hash, fa] of Object.entries(batch)) {
    if (typeof fa !== 'string' || !FLAG_FA.test(fa)) { FLAG_FA.lastIndex = 0; continue; }
    FLAG_FA.lastIndex = 0;
    const en = source.get(hash);
    if (!en) { skippedNoSource++; continue; }
    const flags = (en.match(/\bflags?\b/gi) || []).length;
    if (!flags) continue;
    const before = fa;
    const after = fa.replace(FLAG_FA, m => 'فلگ' + (m.slice(4)));
    FLAG_FA.lastIndex = 0;
    if (after === before) continue;
    const tokens = (before.match(FLAG_FA) || []).length;
    FLAG_FA.lastIndex = 0;
    if (examples.length < 12) examples.push({ file: name, before: before.slice(0, 150), after: after.slice(0, 150) });
    batch[hash] = after;
    changedPosts++;
    changedTokens += tokens;
    dirty = true;
  }
  if (dirty) {
    changedFiles.push(name);
    if (WRITE) fs.writeFileSync(file, JSON.stringify(batch, null, 1), 'utf8');
  }
}

console.log(JSON.stringify({ changedPosts, changedTokens, changedFiles: changedFiles.length, skippedNoSource, write: WRITE }, null, 1));
for (const e of examples) console.log(`- ${e.file}\n  ${e.before}\n  ${e.after}`);
