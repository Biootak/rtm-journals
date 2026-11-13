/*
 * Convert a plain-text draft into a batch JSON file.
 *
 * Agents write _build/expert/drafts/<page>.txt in this shape:
 *
 *   @@@ <post id or hash>
 *   <Persian paragraph 1>
 *
 *   <Persian paragraph 2>
 *   @@@ <next post id>
 *   ...
 *
 * Blank lines are the only paragraph break. No JSON escaping is needed, so a
 * stray quote, backslash or newline cannot corrupt the batch file.
 *
 *   node _build/expert/from-draft.js <page> [<page> ...]
 *
 * Read-only apart from the matching _build/expert/batches/<page>.json files.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const WORK = path.join(ROOT, '_build', 'expert', 'work');
const DRAFTS = path.join(ROOT, '_build', 'expert', 'drafts');
const BATCHES = path.join(ROOT, '_build', 'expert', 'batches');
const paragraphs = s => String(s || '').split(/\n{2,}/).filter(x => x.trim()).length;

function convert(page) {
  const draftFile = path.join(DRAFTS, page + '.txt');
  const workFile = path.join(WORK, page + '.json');
  if (!fs.existsSync(draftFile)) throw new Error('missing draft: ' + draftFile);
  if (!fs.existsSync(workFile)) throw new Error('missing work file: ' + workFile);

  const work = JSON.parse(fs.readFileSync(workFile, 'utf8'));
  const byKey = new Map();
  for (const w of work) { byKey.set(w.hash, w.hash); byKey.set(String(w.id), w.hash); }
  const lines = fs.readFileSync(draftFile, 'utf8').replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let cur = null;
  for (const line of lines) {
    if (line.startsWith('@@@')) {
      const key = line.slice(3).trim();
      const hash = byKey.get(key);
      if (!hash) throw new Error(page + ': unknown marker (use a post id or hash): ' + line.slice(0, 60));
      cur = { hash, lines: [] };
      blocks.push(cur);
      continue;
    }
    if (!cur) {
      if (line.trim()) throw new Error(page + ': text before first @@@ marker');
      continue;
    }
    cur.lines.push(line.replace(/\t/g, ' ').replace(/[ \t]+$/, ''));
  }

  const out = {};
  for (const b of blocks) {
    while (b.lines.length && !b.lines[0].trim()) b.lines.shift();
    while (b.lines.length && !b.lines[b.lines.length - 1].trim()) b.lines.pop();
    const text = b.lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    if (!text) throw new Error(page + ': empty translation for ' + b.hash.slice(0, 8));
    if (out[b.hash] !== undefined) throw new Error(page + ': duplicate hash ' + b.hash.slice(0, 8));
    out[b.hash] = text;
  }

  const expected = new Set(work.map(w => w.hash));
  const missing = work.filter(w => out[w.hash] === undefined).map(w => w.id);
  const extra = Object.keys(out).filter(h => !expected.has(h)).map(h => h.slice(0, 8));
  if (missing.length) throw new Error(page + ': missing ' + missing.length + ' posts: ' + missing.slice(0, 6).join(', '));
  if (extra.length) throw new Error(page + ': extra hashes: ' + extra.slice(0, 6).join(', '));

  const paraBad = work.filter(w => paragraphs(w.text) !== paragraphs(out[w.hash]))
    .map(w => w.id + ' ' + paragraphs(w.text) + '/' + paragraphs(out[w.hash]));

  fs.mkdirSync(BATCHES, { recursive: true });
  fs.writeFileSync(path.join(BATCHES, page + '.json'), JSON.stringify(out, null, 1), 'utf8');
  console.log(page + ': ' + work.length + ' posts written' + (paraBad.length
    ? ' | PARAGRAPH MISMATCH: ' + paraBad.slice(0, 8).join(', ') : ' | paragraphs OK'));
  return paraBad.length;
}

const pages = process.argv.slice(2).filter(a => !a.startsWith('--'));
if (!pages.length) {
  console.error('usage: node _build/expert/from-draft.js <page> [<page> ...]');
  process.exit(1);
}
let bad = 0;
for (const p of pages) {
  try { bad += convert(p); }
  catch (e) { console.error('ERROR ' + e.message); bad++; }
}
process.exitCode = bad ? 1 : 0;
