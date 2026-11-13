/*
 * Quality check over the built site data: how many OCR blocks carry a real
 * Persian translation, and how much machine noise is left behind.
 *
 * Usage: node verify-quality.js [journalId]
 */
const fs = require('fs');
const path = require('path');

const DIR = path.join('E:/Trade/journals', 'site', 'data', 'journals');
const only = process.argv[2] || '';

function loadJournal(file) {
  const src = fs.readFileSync(path.join(DIR, file), 'utf8');
  const start = src.indexOf('=', src.indexOf('RTM_JOURNAL_CACHE['));
  return JSON.parse(src.slice(start + 1).replace(/;\s*$/, ''));
}

const doubled = /(^|\s)(\S+)\s+\2(\s|$)/;
let blocks = 0;
let translated = 0;
let untranslated = 0;
let lowConfidence = 0;
let doubledLeft = 0;
let hallucinationLeft = 0;
let bracketsLeft = 0;
const samples = [];

for (const file of fs.readdirSync(DIR)) {
  if (only && !file.startsWith(only)) continue;
  const journal = loadJournal(file);
  for (const im of journal.images) {
    if (!im.ocr || !Array.isArray(im.ocr.blocks)) continue;
    if (im.ocr.low) lowConfidence++;
    for (const b of im.ocr.blocks) {
      const original = b[0] || '';
      const persian = b[1] || '';
      if (!original) continue;
      blocks++;
      const isTranslated = persian && persian !== original;
      if (isTranslated) translated++;
      else untranslated++;
      // Only machine output is checked for noise; untouched original OCR text
      // legitimately keeps its own numbers, brackets and repetitions.
      if (isTranslated) {
        if (doubled.test(persian)) doubledLeft++;
        if (/زیرنویس فارسی|دانلود فیلم|دانلود آهنگ|موسیقی متن فیلم/.test(persian)) hallucinationLeft++;
        if (/[[\]]/.test(persian)) bracketsLeft++;
      }
      if (samples.length < 20 && /[\u0600-\u06FF]/.test(persian) && original.length > 12) {
        samples.push(`${original}  ->  ${persian}`);
      }
    }
  }
}

console.log({
  blocks,
  translated,
  untranslated,
  lowConfidence,
  doubledLeft,
  hallucinationLeft,
  bracketsLeft,
});
console.log('\n--- sample ---\n' + samples.join('\n'));
