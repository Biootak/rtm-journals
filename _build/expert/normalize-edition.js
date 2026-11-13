/*
 * Editorial normalisation pass over the hand-translated layer.
 *
 *   node _build/expert/normalize-edition.js --dry
 *   node _build/expert/normalize-edition.js
 *
 * Fixes only mechanical defects; never changes words, numbers or structure:
 *   - missing ZWNJ between a Latin acronym and its Persian suffix (FLه → FL‌ه)
 *   - space before Persian punctuation (« ،» → «،»)
 *   - runs of ، ؛ (،، → ،)
 *   - double spaces
 *   - Arabic ي/ك → Persian ی/ک
 *   - bidi/control characters
 * Dots and decimal spaces are left alone on purpose: the corpus keeps source
 * forms such as «1. 2397» and rewriting them would break number fidelity.
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'E:/Trade/journals';
const BATCHES = path.join(ROOT, '_build/expert/batches');
const STORE = path.join(ROOT, '_build/expert/posts.json');
const dry = process.argv.includes('--dry');

const PERSIAN = '\\u0621-\\u063A\\u0641-\\u064A\\u067E\\u0686\\u0698\\u06A9\\u06AF\\u06CC';

function fix(text) {
  let out = String(text);
  out = out.replace(new RegExp(`([A-Za-z][A-Za-z0-9.]*)(?=[${PERSIAN}])`, 'g'), '$1\u200C');
  out = out.replace(/[ \u00A0]+([،؛؟])/g, '$1');
  out = out.replace(/([،؛])\1+/g, '$1');
  out = out.replace(/ {2,}/g, ' ');
  out = out.replace(/\u064A/g, '\u06CC').replace(/\u0643/g, '\u06A9');
  out = out.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '');
  return out;
}

let changed = 0;
let files = 0;
for (const name of fs.readdirSync(BATCHES)) {
  if (!name.endsWith('.json')) continue;
  const file = path.join(BATCHES, name);
  const batch = JSON.parse(fs.readFileSync(file, 'utf8'));
  let touched = false;
  for (const [hash, value] of Object.entries(batch)) {
    if (typeof value !== 'string') continue;
    const next = fix(value);
    if (next !== value) { batch[hash] = next; changed++; touched = true; }
  }
  if (touched && !dry) { fs.writeFileSync(file, JSON.stringify(batch, null, 1), 'utf8'); files++; }
}

const store = JSON.parse(fs.readFileSync(STORE, 'utf8'));
let storeTouched = false;
for (const [hash, value] of Object.entries(store)) {
  if (typeof value !== 'string') continue;
  const next = fix(value);
  if (next !== value) { store[hash] = next; changed++; storeTouched = true; }
}
if (storeTouched && !dry) fs.writeFileSync(STORE, JSON.stringify(store, null, 1), 'utf8');

console.log(`${dry ? '[dry] ' : ''}normalised ${changed} bodies${dry ? '' : ` in ${files} batch files${storeTouched ? ' + store' : ''}`}`);
