#!/usr/bin/env node
/*
 * Apply a group of targeted post repairs to the page batches, then gate them.
 *
 *   node _build/expert/apply-group-fixes.js <fixes.json> [--dry]
 *
 * fixes.json is { "<page>": { "<hash>": "<new Persian>" } }.
 *
 * A repair is refused, never guessed, when:
 *   - the page or hash is not in the batch (stale id);
 *   - the replacement changes the paragraph count of the existing Persian
 *     (the work file fixes one Persian paragraph per English paragraph);
 *   - the replacement drops a number the current Persian carries.
 * After writing, the touched pages go through workflow.js --validate --page and
 * _glossary-check.js, and the exit code reports whether both ended clean.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const B = path.join(__dirname, 'batches');
const file = process.argv[2];
if (!file) {
  console.error('usage: apply-group-fixes.js <fixes.json> [--dry]');
  process.exit(2);
}
const dry = process.argv.includes('--dry');
const fixes = JSON.parse(fs.readFileSync(file, 'utf8'));

const paras = s => String(s || '').replace(/\r\n?/g, '\n').split(/\n{2,}/).map(x => x.trim()).filter(Boolean);
const nums = s => (String(s || '').match(/\d+(?:[.,]\d+)?/g) || []).sort().join(',');

let applied = 0;
const refused = [];
const pages = [];

for (const [page, entries] of Object.entries(fixes)) {
  const bf = path.join(B, page + '.json');
  if (!fs.existsSync(bf)) { refused.push(`${page}: no batch file`); continue; }
  const batch = JSON.parse(fs.readFileSync(bf, 'utf8'));
  let touched = 0;
  for (const [hash, next] of Object.entries(entries)) {
    if (!(hash in batch)) { refused.push(`${page} ${hash.slice(0, 8)}: hash not in batch`); continue; }
    const prev = String(batch[hash] || '');
    if (paras(prev).length !== paras(next).length) {
      refused.push(`${page} ${hash.slice(0, 8)}: paragraph count ${paras(prev).length} -> ${paras(next).length}`);
      continue;
    }
    if (nums(prev) !== nums(next)) {
      refused.push(`${page} ${hash.slice(0, 8)}: number drift (${nums(prev)} -> ${nums(next)})`);
      continue;
    }
    if (next.trim() === prev.trim()) continue;
    batch[hash] = next;
    touched++;
    applied++;
  }
  if (touched && !dry) {
    fs.writeFileSync(bf, JSON.stringify(batch, null, 1).replace(/\n/g, '\r\n'), 'utf8');
    pages.push(page);
  }
}

console.log(`applied ${applied}${refused.length ? ` | refused ${refused.length}` : ''}`);
for (const r of refused) console.log('  refuse ' + r);
if (!pages.length || dry) process.exit(refused.length ? 1 : 0);

const run = (args, label) => {
  const r = spawnSync(process.execPath, args, { cwd: path.join(__dirname, '..', '..'), encoding: 'utf8' });
  const out = ((r.stdout || '') + (r.stderr || '')).trim();
  const tail = out.split('\n').filter(Boolean).slice(-2).join('\n');
  console.log(`${label}: ${tail}`);
  return r.status === 0 && /rejected 0\b/.test(out);
};

const ok = run([path.join(__dirname, 'workflow.js'), '--validate', '--page', pages.join(',')], 'validator');
run([path.join(__dirname, '_glossary-check.js'), ...pages], 'glossary');
process.exit(ok && !refused.length ? 0 : 1);
