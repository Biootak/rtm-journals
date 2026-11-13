#!/usr/bin/env node
/*
 * Semantic re-translation: apply a draft over a batch file with hard guards.
 *
 *   node _build/expert/retranslate.js if-p2 _build/expert/redraft/if-p2.txt
 *   node _build/expert/retranslate.js if-p2 draft.txt --dry
 *
 * Draft format (UTF-8), one block per post, blocks separated by a blank line:
 *
 *   ### if_p2_1
 *   پاراگراف اول
 *
 *   پاراگراف دوم
 *
 *   ### if_p2_2
 *   ...
 *
 * A draft may cover only some posts of the page; every other post keeps its
 * current Persian. The tool refuses a post when
 *   - the id is not on that page,
 *   - the paragraph count differs from the English source,
 *   - a price / R multiple / percentage disappeared,
 *   - a "Name wrote:" head has no "نوشت:".
 * Nothing is written unless every listed post passes (or --force is given).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const EXPERT = path.join(ROOT, '_build', 'expert');
const WORK = path.join(EXPERT, 'work');
const BATCHES = path.join(EXPERT, 'batches');

const page = process.argv[2];
const draftFile = process.argv[3];
const dry = process.argv.includes('--dry');
const force = process.argv.includes('--force');
if (!page || !draftFile) {
  console.error('usage: node _build/expert/retranslate.js <journal>-p<N> <draft.txt> [--dry] [--force]');
  process.exit(2);
}

const normalize = t => String(t || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n').trim();
const hashOf = t => crypto.createHash('sha1').update(normalize(t)).digest('hex');
const paragraphs = s => String(s || '').split(/\n{2,}/).map(x => x.trim()).filter(Boolean);
const digitsOnly = s => String(s || '').replace(/[^\d]/g, '');

const work = JSON.parse(fs.readFileSync(path.join(WORK, page + '.json'), 'utf8'));
const byId = new Map(work.map(w => [w.id, w]));
const byHash = new Map(work.map(w => [w.hash, w]));
const batchPath = path.join(BATCHES, page + '.json');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));

function numberLosses(english, persian) {
  const tokens = [...new Set(String(english || '').match(/\d+(?:[.,]\d+)?%?/g) || [])]
    .filter(t => /[.,]\d/.test(t) || String(t).replace(/\D/g, '').length >= 3);
  if (!tokens.length) return [];
  const faRuns = (String(persian || '').match(/\d+(?:[.,]\d+)?/g) || []).map(digitsOnly);
  const faSet = new Set(faRuns);
  const present = t => {
    if (faSet.has(digitsOnly(t))) return true;
    const parts = String(t).split(/[.,]/).filter(Boolean);
    return parts.length >= 2 && parts.every(p => faSet.has(digitsOnly(p)));
  };
  return tokens.filter(t => !present(t));
}

function quoteHeadGap(english, persian) {
  const heads = String(english || '').match(/(?:^|\n)\s*(?!(?:i|you|we|they|he|she|it|who)\b)[A-Za-z][A-Za-z0-9_.\-+]{1,32}\s*(?:wrote|writes)\s*:/gi) || [];
  if (!heads.length) return 0;
  const faHeads = String(persian || '').match(/نوشت\s*:/g) || [];
  return Math.max(0, heads.length - faHeads.length);
}

/* ---------- read the draft ---------- */
const raw = fs.readFileSync(draftFile, 'utf8').replace(/\r\n?/g, '\n');
const blocks = [];
let current = null;
for (const line of raw.split('\n')) {
  const m = line.match(/^###\s+(\S+)\s*$/);
  if (m) {
    if (current) blocks.push(current);
    current = { id: m[1], lines: [] };
  } else if (current) {
    current.lines.push(line);
  } else if (line.trim()) {
    console.error('text before the first "### <post id>" is ignored:', line.slice(0, 60));
  }
}
if (current) blocks.push(current);

const problems = [];
const updates = new Map();
for (const block of blocks) {
  const w = byId.get(block.id);
  if (!w) { problems.push([block.id, 'id is not on ' + page]); continue; }
  if (!byHash.has(w.hash)) { problems.push([block.id, 'hash mismatch']); continue; }
  const text = normalize(block.lines.join('\n'));
  if (!text) { problems.push([block.id, 'empty draft']); continue; }
  const enP = paragraphs(w.text).length;
  const faP = paragraphs(text).length;
  if (enP !== faP) { problems.push([block.id, `paragraphs ${enP}/${faP}`]); continue; }
  const lost = numberLosses(w.text, text);
  if (lost.length) { problems.push([block.id, 'numbers lost: ' + lost.join(',')]); continue; }
  const headGap = quoteHeadGap(w.text, text);
  if (headGap) { problems.push([block.id, `quote heads ${headGap} missing`]); continue; }
  if (/[۰-۹٠-٩]/.test(text)) { problems.push([block.id, 'Persian digits']); continue; }
  updates.set(w.hash, { id: block.id, text });
}

console.log(`page ${page}: draft blocks ${blocks.length}, accepted ${updates.size}, refused ${problems.length}`);
for (const [id, why] of problems) console.log(`  REFUSED ${id} | ${why}`);
if (problems.length && !force) {
  console.log('nothing written (use --force to write the accepted ones anyway)');
  process.exit(1);
}
if (!updates.size) process.exit(1);
if (!dry) {
  for (const [hash, u] of updates) batch[hash] = u.text;
  fs.writeFileSync(batchPath, JSON.stringify(batch, null, 1) + '\n', 'utf8');
  console.log(`wrote ${path.relative(ROOT, batchPath)} — ${updates.size} posts replaced`);
} else {
  console.log('dry run: no file written');
}
