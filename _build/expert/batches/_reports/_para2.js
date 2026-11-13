/* Refined scan: untranslated paragraphs (URLs excluded) + stub/short translations. */
const fs = require('fs');
const path = require('path');
const ROOT = 'E:/Trade/journals/_build/expert';
const WORK = path.join(ROOT, 'work');
const BATCH = path.join(ROOT, 'batches');
const faChars = s => (String(s || '').match(/[\u0600-\u06FF]/g) || []).length;
const latWords = s => (String(s || '').match(/[A-Za-z]{3,}/g) || []);
const paras = s => String(s || '').split(/\n{2,}/).map(x => x.trim()).filter(Boolean);
const isUrlLike = p => /(https?:\/\/|www\.|\.com|\.org|\.net|\.co\/|\.php|\.html|@|\/[a-z0-9-]+\/)/i.test(p) && !/\s{2,}/.test(p) && latWords(p).length <= 40 && faChars(p) === 0;

const cat = { untranslatedPara: [], shortPost: [], shortPara: [], urlOnlyOk: 0 };
for (const name of fs.readdirSync(BATCH).filter(n => n.endsWith('.json') && !n.startsWith('_'))) {
  const wp = path.join(WORK, name);
  if (!fs.existsSync(wp)) continue;
  let work, batch;
  try { work = JSON.parse(fs.readFileSync(wp, 'utf8')); batch = JSON.parse(fs.readFileSync(path.join(BATCH, name), 'utf8')); }
  catch (e) { continue; }
  const page = name.replace('.json', '');
  for (const w of work) {
    const fa = batch[w.hash];
    if (typeof fa !== 'string' || !fa.trim()) continue;
    if (faChars(fa) < 10) continue;
    const enP = paras(w.text), faP = paras(fa);
    enP.forEach((p, i) => {
      const fp = faP[i];
      if (!fp) return;
      if (faChars(fp) === 0 && latWords(fp).length >= 2) {
        if (isUrlLike(fp) || isUrlLike(p)) cat.urlOnlyOk++;
        else cat.untranslatedPara.push([page, w.id, 'para ' + (i + 1), fp.slice(0, 70)]);
      }
    });
    const enLen = w.text.length, faLen = fa.length;
    if (enLen > 260 && faLen / enLen < 0.33) cat.shortPost.push([page, w.id, `en ${enLen}ch -> fa ${faLen}ch (${(faLen / enLen * 100).toFixed(0)}%)`, 'EN:' + w.text.slice(0, 60), 'FA:' + fa.slice(0, 60)]);
    enP.forEach((p, i) => {
      const fp = faP[i] || '';
      if (latWords(p).length >= 14 && faChars(fp) > 0 && fp.length < 0.3 * p.length) {
        // allow when the English is a quote of a name/url block
        cat.shortPara.push([page, w.id, 'para ' + (i + 1), `en ${p.length}ch -> fa ${fp.length}ch`, 'EN:' + p.slice(0, 55), 'FA:' + fp.slice(0, 55)]);
      }
    });
  }
}
const dump = (title, arr) => { console.log(`\n## ${title} (${arr.length})`); for (const r of arr) console.log('  ' + r.join(' | ')); };
console.log('url-only paragraphs left in Latin (legit):', cat.urlOnlyOk);
dump('UNTRANSLATED PARAGRAPHS', cat.untranslatedPara);
dump('SHORT POSTS (fa < 33% of en)', cat.shortPost);
dump('SHORT PARAGRAPHS', cat.shortPara);
