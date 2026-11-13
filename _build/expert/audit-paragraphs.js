#!/usr/bin/env node
// Paragraph-level source-aware audit over the whole expert layer.
// Flags: untranslated paragraphs, lost numbers/handles, and numbers/handles
// that appear in a neighbouring Persian paragraph (a shifted translation).
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const WORK = path.join(ROOT, '_build/expert/work');
const BATCHES = path.join(ROOT, '_build/expert/batches');
const STORE = JSON.parse(fs.readFileSync(path.join(ROOT, '_build/expert/posts.json'), 'utf8'));

const paras = s => String(s || '').split(/\n{2,}/).map(x => x.trim()).filter(Boolean);
const faChars = s => (s.match(/[\u0600-\u06FF]/g) || []).length;
const latinLetters = s => (s.match(/[A-Za-z]/g) || []).length;
const proseWords = s => (String(s)
  .replace(/https?:\/\/\S+|www\.\S+/gi, ' ')
  .replace(/\S+\.(?:com|org|net|edu|io|gov|co|me|tv|info|ly|uk|de|ca|php|html?|pdf|jpg|jpeg|png|webp|gif)\S*/gi, ' ')
  .replace(/\S+\/\S*/g, ' ')
  .match(/[A-Za-z]{3,}/g) || []);
const isProse = s => proseWords(s).length >= 3 && faChars(s) === 0;
const nums = s => (String(s).match(/\d{2,}(?:[.,]\d+)?/g) || [])
  .map(n => n.replace(/,/g, '').replace(/\.$/, ''))
  .filter(n => n.length >= 2);
const handles = s => {
  const out = [];
  const re = /(^|\n)\s*([A-Za-z][A-Za-z0-9_.-]{1,30})\s+wrote\s*:/g;
  let m;
  while ((m = re.exec(String(s)))) out.push(m[2]);
  return out;
};
const has = (hay, token) => String(hay).replace(/,/g, '').includes(token);

const findings = [];
let posts = 0, pages = 0, empty = 0;
for (const file of fs.readdirSync(WORK).filter(f => f.endsWith('.json')).sort()) {
  const base = file.replace(/\.json$/, '');
  const page = base.replace(/-p\d+$/, '') + '-p' + base.match(/-p(\d+)$/)[1];
  const work = JSON.parse(fs.readFileSync(path.join(WORK, file), 'utf8'));
  const batchFile = path.join(BATCHES, file);
  const batch = fs.existsSync(batchFile) ? JSON.parse(fs.readFileSync(batchFile, 'utf8')) : {};
  pages++;
  for (const w of work) {
    posts++;
    const fa = String(batch[w.hash] || STORE[w.hash] || '').trim();
    const en = paras(w.text);
    const fp = paras(fa);
    if (!fa) {
      if (en.some(p => isProse(p))) findings.push({ page, id: w.id, kind: 'no-translation', detail: `${en.length} EN paragraphs` });
      continue;
    }
    if (fp.length !== en.length) {
      findings.push({ page, id: w.id, kind: 'paragraph-drift', detail: `EN ${en.length} / FA ${fp.length}` });
      continue;
    }
    for (let i = 0; i < en.length; i++) {
      const e = en[i], f = fp[i];
      if (isProse(e) && faChars(f) === 0 && !/^\s*(https?:\/\/|www\.)/i.test(f)) {
        findings.push({ page, id: w.id, kind: 'untranslated-para', detail: `p${i + 1}: ${f.slice(0, 60)}` });
      }
      for (const tok of new Set([...nums(e), ...handles(e)])) {
        if (has(f, tok)) continue;
        const prev = i > 0 ? fp[i - 1] : '';
        const next = i + 1 < fp.length ? fp[i + 1] : '';
        const where = has(prev, tok) ? `p${i}` : has(next, tok) ? `p${i + 2}` : null;
        findings.push({
          page, id: w.id,
          kind: where ? 'shifted-token' : 'lost-token',
          detail: `${tok}${where ? ` found in ${where}` : ''} (source p${i + 1})`
        });
      }
    }
  }
}

const byKind = {};
for (const f of findings) byKind[f.kind] = (byKind[f.kind] || 0) + 1;
console.log(`pages ${pages} | posts ${posts} | findings ${findings.length}`);
console.log(byKind);
for (const f of findings.slice(0, 60)) console.log(`${f.page} ${f.id} ${f.kind} — ${f.detail}`);
fs.writeFileSync(path.join(ROOT, '_build/expert/paragraph-audit.json'), JSON.stringify({ pages, posts, byKind, findings }, null, 1));
