/*
 * Find term classes the reviewer waves have not covered yet.
 *
 *   node _build/expert/scan-residual.js
 *
 * Writes `_build/expert/residual-flag.json` and `residual-dates.json`.
 * A hit is a paragraph where the English carries the structural acronym but
 * the Persian uses the translated word (پرچم / فلگ), or where the Persian
 * prose keeps an English month name.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.env.JOURNALS_ROOT || path.resolve(__dirname, '..', '..');
const WORK = path.join(ROOT, '_build/expert/work');
const BATCHES = path.join(ROOT, '_build/expert/batches');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December',
  'Jan', 'Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug', 'Sep', 'Sept', 'Oct', 'Nov', 'Dec'];

const paragraphs = s => String(s || '').split(/\n{2,}/).filter(x => x.trim());
const pages = fs.readdirSync(BATCHES).filter(f => f.endsWith('.json')).map(f => f.replace(/\.json$/, ''));
const flagHits = [];
const dateHits = [];

for (const page of pages) {
  const workFile = path.join(WORK, page + '.json');
  const batchFile = path.join(BATCHES, page + '.json');
  if (!fs.existsSync(workFile)) continue;
  const work = JSON.parse(fs.readFileSync(workFile, 'utf8'));
  const batch = JSON.parse(fs.readFileSync(batchFile, 'utf8'));
  for (const w of work) {
    const fa = batch[w.hash];
    if (!fa) continue;
    const enP = paragraphs(w.text);
    const faP = paragraphs(fa);
    if (enP.length !== faP.length) continue;
    for (let i = 0; i < enP.length; i++) {
      const en = enP[i];
      const faText = faP[i];
      const flagLatin = /\b(?:FLAG|FL|FLs|FLAGs)\b/.test(en);
      if (flagLatin && /پرچم|فلگ|فلگ\s*لیمیت/.test(faText)) {
        flagHits.push({ id: w.id, page, p: i + 1, en: en.slice(0, 300), fa: faText.slice(0, 300) });
      }
      const month = MONTHS.find(m => new RegExp('\\b' + m + '\\b').test(en));
      if (month && new RegExp('\\b' + month + '\\b').test(faText)) {
        // Chart captions and file names are allowed to stay Latin.
        const looksLikeCaption = /\.(?:png|jpe?g|gif|mp4)|^\S+$/.test(en.trim());
        if (!looksLikeCaption) {
          dateHits.push({ id: w.id, page, p: i + 1, month, en: en.slice(0, 300), fa: faText.slice(0, 300) });
        }
      }
    }
  }
}

fs.writeFileSync(path.join(ROOT, '_build/expert/residual-flag.json'), JSON.stringify(flagHits, null, 1));
fs.writeFileSync(path.join(ROOT, '_build/expert/residual-dates.json'), JSON.stringify(dateHits, null, 1));
console.log('flag paragraphs', flagHits.length, 'in', new Set(flagHits.map(h => h.id)).size, 'posts');
console.log('date paragraphs', dateHits.length, 'in', new Set(dateHits.map(h => h.id)).size, 'posts');
