/* Paragraph-level untranslated / stub detection. */
const fs = require('fs');
const path = require('path');
const ROOT = 'E:/Trade/journals/_build/expert';
const WORK = path.join(ROOT, 'work');
const BATCH = path.join(ROOT, 'batches');
const faChars = s => (String(s || '').match(/[\u0600-\u06FF]/g) || []).length;
const latWords = s => (String(s || '').match(/[A-Za-z]{3,}/g) || []).length;
const paras = s => String(s || '').split(/\n{2,}/).map(x => x.trim()).filter(Boolean);
const norm = s => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();

const rows = [];
for (const name of fs.readdirSync(BATCH).filter(n => n.endsWith('.json') && !n.startsWith('_'))) {
  const wp = path.join(WORK, name);
  if (!fs.existsSync(wp)) continue;
  let work, batch;
  try { work = JSON.parse(fs.readFileSync(wp, 'utf8')); batch = JSON.parse(fs.readFileSync(path.join(BATCH, name), 'utf8')); }
  catch (e) { rows.push([name.replace('.json', ''), 'PARSE ' + e.message]); continue; }
  const page = name.replace('.json', '');
  for (const w of work) {
    const fa = batch[w.hash];
    if (typeof fa !== 'string' || !fa.trim()) continue;
    const enP = paras(w.text), faP = paras(fa);
    const pageHasPersian = faChars(fa) > 10;
    if (!pageHasPersian) continue;               // whole post Latin-only; handled elsewhere
    // paragraph that stayed English inside an otherwise Persian post
    const stray = faP.filter((p, i) => faChars(p) === 0 && latWords(p) >= 3);
    if (stray.length) rows.push([page, w.id, 'UNTRANSLATED_PARA x' + stray.length + ' :: ' + stray[0].slice(0, 60)]);
    else if (faP.length !== enP.length) rows.push([page, w.id, `PARA ${enP}/${faP.length}`]);
    else {
      // per-paragraph length ratio vs english counterpart
      for (let i = 0; i < enP.length; i++) {
        if (faChars(faP[i]) === 0) continue;
        const enWords = latWords(enP[i]);
        if (enWords >= 12 && faP[i].length < 0.22 * enP[i].length) {
          rows.push([page, w.id, `SHORT_PARA${i + 1} en ${enP[i].length}ch/${enWords}w -> fa ${faP[i].length}ch :: ${faP[i].slice(0, 50)}`]);
          break;
        }
      }
    }
  }
}
console.log('flagged posts:', rows.length);
for (const r of rows) console.log(' ', r.join(' | '));
