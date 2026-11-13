#!/usr/bin/env node
/*
 * Normalise the hand-translated Persian layer.
 *
 * Mechanical only — no rewriting of meaning:
 *   digits        Persian/Arabic digits → Latin (site rule: numbers stay Latin)
 *   letters       Arabic ي/ك → Persian ی/ک
 *   punctuation   doubled ، ؛ ؟, stray "..", space before punctuation
 *   welds         Latin word/acronym glued to a Persian suffix
 *   broken-word   "تایmframe" → «تایمفریم», "اسکالپer" → «اسکالپر»
 *   quote heads   the Latin handle and nesting order of the English source
 *   paragraphs    readingsession_p7_191 (one EN paragraph, nine FA ones)
 *
 * Usage:
 *   node _build/expert/fix-persian.js --report
 *   node _build/expert/fix-persian.js --apply
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const BUILD = path.join(ROOT, '_build');
const WORK = path.join(__dirname, 'work');
const BATCH = path.join(__dirname, 'batches');
const STORE_FILE = path.join(__dirname, 'posts.json');
const APPLY = process.argv.includes('--apply');

const FA_DIGITS = /[\u06F0-\u06F9\u0660-\u0669]/g;
const digitMap = ch => {
  const c = ch.charCodeAt(0);
  if (c >= 0x06F0 && c <= 0x06F9) return String(c - 0x06F0);
  if (c >= 0x0660 && c <= 0x0669) return String(c - 0x0660);
  return ch;
};

const WELDS = [
  [/Traderهایی/g, 'معامله‌گرهایی'], [/Traderهای/g, 'معامله‌گرهای'],
  [/Traderها/g, 'معامله‌گرها'], [/Traderه/g, 'معامله‌گر'],
  [/levelهایی/g, 'سطح‌هایی'], [/levelهای/g, 'سطح‌های'], [/levelها/g, 'سطح‌ها'], [/levelه/g, 'سطح'],
  [/pointه/g, 'نقطه'], [/backه/g, 'بازگشت'], [/buyه/g, 'خرید'],
  [/lotsی/g, 'لات‌ها'], [/tonsی/g, 'تن‌ها'], [/bucketloadی/g, 'خیلی زیاد'],
  [/amountی/g, 'مقداری'], [/pdfه/g, 'PDF'],
  [/تایmframeهایی/g, 'تایم‌فریم‌هایی'], [/تایmframeهای/g, 'تایم‌فریم‌های'],
  [/تایmframeها/g, 'تایم‌فریم‌ها'], [/تایmframe/g, 'تایم‌فریم'],
  [/اسکالپer/g, 'اسکالپر'],
  [/Baseه/g, 'بیس'], [/cpه/g, 'CP'], [/MAه/g, 'MA'], [/ITه/g, 'IT'],
  [/equityم/g, 'سرمایه‌ام'], [/equityت/g, 'سرمایه‌ات'], [/equityش/g, 'سرمایه‌اش'],
  [/profitم/g, 'سودم'], [/profitت/g, 'سودت'], [/profitش/g, 'سودش'],
  [/journalم/g, 'ژورنالم'], [/journalت/g, 'ژورنالت'], [/journalش/g, 'ژورنالش'],
  [/planم/g, 'برنامه‌ام'], [/planت/g, 'برنامه‌ات'], [/planش/g, 'برنامه‌اش'],
  [/tradeت/g, 'معامله‌ات'], [/updateا/g, 'آپدیت'],
];

const URL_RE = /https?:\/\/\S+|www\.\S+/g;

function normalizeFa(input) {
  let s = String(input || '');
  const hits = {};
  // URLs are verbatim anchors: never touch their dots or spacing.
  const urls = [];
  s = s.replace(URL_RE, m => { urls.push(m); return `\u0000${urls.length - 1}\u0000`; });
  const before = s;
  s = s.replace(FA_DIGITS, digitMap);
  if (s !== before) hits.digits = 1;
  const b2 = s;
  s = s.replace(/\u064A/g, 'ی').replace(/\u0643/g, 'ک');
  if (s !== b2) hits.letters = 1;
  const b3 = s;
  for (const [re, to] of WELDS) s = s.replace(re, to);
  // Acronym + Persian suffix: keep the acronym Latin, separate with ZWNJ.
  s = s.replace(/\b([A-Z]{2,7})(ها|های|هایی|ه|ی)(?=[\s،.:؛؟!»)]|$)/g, '$1\u200C$2');
  // Any other Latin word + Persian suffix: at least stop the weld.
  s = s.replace(/\b([A-Za-z][A-Za-z0-9]{2,})(ها|های|هایی|ه|ی)(?=[\s،.:؛؟!»)]|$)/g, '$1\u200C$2');
  s = s.replace(/S\/D([یها])/g, 'S/D\u200C$1');
  // Any Latin token carrying a Persian possessive/plural ending: separate it.
  s = s.replace(/([A-Za-z][A-Za-z0-9]{1,})(ها|های|هایی|مان|تان|شان|ه|ی|ا|ت|م|ش)(?=[\s،.:؛؟!»)\]]|$)/g, '$1\u200C$2');
  if (s !== b3) hits.weld = 1;
  const b4 = s;
  s = s.replace(/،{2,}/g, '،').replace(/؛{2,}/g, '؛').replace(/؟{2,}/g, '؟');
  // A two-dot run is an ellipsis, not a full stop: keep the pause, fix the
  // spacing ("این.. و آن" → "این… و آن").
  s = s.replace(/(?<!\.)\.{2,}(?!\.)/g, '…');
  s = s.replace(/[ ]?…[ ]?/g, '… ');
  s = s.replace(/[ \t]+([،؛؟])/g, '$1');
  s = s.replace(/[ \t]{2,}/g, ' ');
  s = s.replace(/[ \t]+\n/g, '\n');
  if (s !== b4) hits.punct = 1;
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => urls[Number(i)]);
  return { text: s, hits };
}

const EN_HEAD = /^([A-Za-z0-9_.@-]{1,40})\s+wrote\s*:\s*/i;
const FA_HEAD = /^([A-Za-z0-9_.@-]{1,40})\s*نوشت\s*:\s*/;
const PRONOUN = /^(?:i|you|we|they|he|she|it|who)$/i;
const paras = s => String(s || '').split(/\n{2,}/).filter(x => x.trim());
const faParasOf = s => String(s || '').split(/\n{2,}/).filter(x => x.trim());

const totals = { posts: 0, changed: 0, digits: 0, letters: 0, weld: 0, punct: 0, headFixed: 0, headRemoved: 0, headAdded: 0, merged: 0 };
const samples = [];
const store = fs.existsSync(STORE_FILE) ? JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')) : {};

for (const file of fs.readdirSync(WORK).filter(f => f.endsWith('.json'))) {
  const page = file.replace(/\.json$/, '');
  const work = JSON.parse(fs.readFileSync(path.join(WORK, file), 'utf8'));
  const bf = path.join(BATCH, file);
  if (!fs.existsSync(bf)) continue;
  const batch = JSON.parse(fs.readFileSync(bf, 'utf8'));
  let dirty = false;
  for (const w of work) {
    const fa = String(batch[w.hash] || '');
    if (!fa.trim()) continue;
    totals.posts++;
    const norm = normalizeFa(fa).text;
    let out = norm;
    let fixedHead = false, removedHead = false, addedHead = false, merged = false;

    if (w.id === 'readingsession_p7_191' && paras(w.text).length === 1) {
      const joined = faParasOf(norm).map(p => p.trim()).join(' ');
      if (joined !== norm.trim()) { out = joined; merged = true; }
    } else {
      const enP = paras(w.text);
      const faP = faParasOf(out);
      if (enP.length === faP.length) {
        const enHeads = enP.map(p => { const m = EN_HEAD.exec(p); return m && !PRONOUN.test(m[1]) ? m[1] : null; });
        const allEnHandles = new Set();
        for (const p of enP) {
          const re = /(?:^|[^A-Za-z0-9_.@-])([A-Za-z0-9_.@-]{1,40})\s+wrote\s*:/g;
          let m; while ((m = re.exec(p))) if (!PRONOUN.test(m[1])) allEnHandles.add(m[1]);
        }
        /* Only unambiguous head fixes are mechanical. Replacing a different
           handle, or deleting an attribution the print lost, would rewrite
           who said what; those are left to hand review. */
        out = faP.map((p, i) => {
          const enName = enHeads[i];
          const faM = FA_HEAD.exec(p);
          if (enName && faM && faM[1].toLowerCase() === enName.toLowerCase() && faM[1] !== enName) {
            fixedHead = true;
            return enName + ' نوشت: ' + p.slice(faM[0].length);
          }
          if (faM && /^you$/i.test(faM[1])) {
            removedHead = true;
            return p.slice(faM[0].length);
          }
          return p;
        }).join('\n\n');
      }
    }

    if (out !== fa) {
      if (APPLY) batch[w.hash] = out;
      dirty = true;
      totals.changed++;
      if (fixedHead) totals.headFixed++;
      if (removedHead) totals.headRemoved++;
      if (addedHead) totals.headAdded++;
      if (merged) totals.merged++;
      const nh = normalizeFa(fa).hits;
      if (nh.digits) totals.digits++;
      if (nh.letters) totals.letters++;
      if (nh.weld) totals.weld++;
      if (nh.punct) totals.punct++;
      if (samples.length < 15) samples.push(`${w.id}: ${fa.slice(0, 70).replace(/\n/g, ' / ')}  ⇒  ${out.slice(0, 90).replace(/\n/g, ' / ')}`);
    }
  }
  if (dirty && APPLY) fs.writeFileSync(bf, JSON.stringify(batch), 'utf8');
}

if (APPLY) {
  for (const h of Object.keys(store)) {
    const norm = normalizeFa(store[h]).text;
    if (norm !== store[h]) store[h] = norm;
  }
  fs.writeFileSync(STORE_FILE, JSON.stringify(store), 'utf8');
}

console.log('posts', totals.posts, '| changed', totals.changed);
console.log('normalised:', { digits: totals.digits, letters: totals.letters, welds: totals.weld, punctuation: totals.punct });
console.log('heads:', { fixed: totals.headFixed, removed: totals.headRemoved, added: totals.headAdded });
console.log('merged paragraphs:', totals.merged);
for (const s of samples) console.log('  - ' + s);
console.log(APPLY ? 'APPLIED' : 'REPORT ONLY (use --apply)');
