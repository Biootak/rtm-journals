#!/usr/bin/env node
// Corpus-wide defect scan: negation polarity, spelled-out acronyms, Latin dates.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const W = path.join(ROOT, '_build/expert/work');
const B = path.join(ROOT, '_build/expert/batches');
const STORE = JSON.parse(fs.readFileSync(path.join(ROOT, '_build/expert/posts.json'), 'utf8'));
const paras = s => String(s || '').split(/\n{2,}/).map(x => x.trim()).filter(Boolean);

const EN_NEG = /\b(?:not|no|never|none|nothing|nobody|neither|nor|without|cannot|can't|don't|doesn't|didn't|isn't|aren't|wasn't|weren't|won't|wouldn't|shouldn't|couldn't|hasn't|haven't|hadn't|hardly|barely|unless|fail|failed|lacks?)\b/i;
const FA_NEG = /(?:^|[\s،؛:.!؟"»])(?:نه|نیست|نبود|نبوده|نمی‌?|نخ|هیچ|هرگز|بدون|عدم|نشد|نشده|نکن|ندارد|نداشت|ندارند|نمی‌شود|نمی‌کند|نیستم|نیستند|نباش|نباشد)(?=[\s،؛:.!؟"«]|$)/;
const TERMS = [
  [/پرایس\s*اکشن/gi, 'PA'],
  [/سقف\s*قیمتی/gi, 'CAPS'],
  [/(?:حد|سقف|محدودهٔ?|لیمیت)\s*فلگ/gi, 'FL'],
  [/میله(?![ا-ی])/g, 'Pole'],
];
const MONTHS = /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{1,4}\b/gi;

const out = { neg: [], terms: [], dates: [] };
let posts = 0;

for (const file of fs.readdirSync(W).filter(f => f.endsWith('.json'))) {
  const base = file.replace(/\.json$/, '');
  const work = JSON.parse(fs.readFileSync(path.join(W, file), 'utf8'));
  const bf = path.join(B, file);
  const batch = fs.existsSync(bf) ? JSON.parse(fs.readFileSync(bf, 'utf8')) : {};
  for (const w of work) {
    posts++;
    const fa = String(batch[w.hash] || STORE[w.hash] || '').trim();
    if (!fa) continue;
    const en = paras(w.text), fp = paras(fa);
    if (en.length !== fp.length) continue;
    for (let i = 0; i < en.length; i++) {
      const e = en[i], f = fp[i];
      if (e.length < 15 || f.length < 10) continue;
      const enNeg = EN_NEG.test(e), faNeg = FA_NEG.test(f);
      if (enNeg !== faNeg) out.neg.push({ page: base, id: w.id, i: i + 1, kind: enNeg ? 'neg-lost' : 'neg-added', en: e.slice(0, 140), fa: f.slice(0, 140) });
    }
    for (const [re, want] of TERMS) {
      const m = fa.match(re);
      if (m) out.terms.push({ page: base, id: w.id, want, found: [...new Set(m)], fa: fa.slice(0, 140) });
    }
    const md = fa.match(MONTHS);
    if (md) out.dates.push({ page: base, id: w.id, found: [...new Set(md)], fa: fa.slice(0, 140) });
  }
}

const count = a => a.length;
console.log(`posts ${posts}`);
console.log('neg-lost', out.neg.filter(x => x.kind === 'neg-lost').length);
console.log('neg-added', out.neg.filter(x => x.kind === 'neg-added').length);
console.log('terms', count(out.terms), Object.fromEntries([...new Set(out.terms.map(t => t.want))].map(k => [k, out.terms.filter(t => t.want === k).length])));
console.log('latin-dates', count(out.dates));
for (const x of out.neg.slice(0, 10)) console.log(x.kind, x.page, x.id, 'p' + x.i);
fs.writeFileSync(path.join(ROOT, '_build/expert/scan-defects.json'), JSON.stringify(out, null, 1));
