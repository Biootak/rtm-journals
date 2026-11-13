/* Cross-file duplicate translations + per-page length ratio profile. */
const fs = require('fs');
const path = require('path');
const ROOT = 'E:/Trade/journals/_build/expert';
const WORK = path.join(ROOT, 'work');
const BATCH = path.join(ROOT, 'batches');
const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
const faLen = s => (String(s || '').match(/[\u0600-\u06FF]/g) || []).length;

const map = new Map();
const perPage = [];
for (const name of fs.readdirSync(BATCH).filter(n => n.endsWith('.json') && !n.startsWith('_'))) {
  const wp = path.join(WORK, name);
  if (!fs.existsSync(wp)) continue;
  let work, batch;
  try { work = JSON.parse(fs.readFileSync(wp, 'utf8')); batch = JSON.parse(fs.readFileSync(path.join(BATCH, name), 'utf8')); }
  catch (e) { continue; }
  const page = name.replace('.json', '');
  const ratios = [];
  for (const w of work) {
    const fa = batch[w.hash];
    if (typeof fa !== 'string' || !fa.trim()) continue;
    const k = norm(fa);
    if (k.length > 60) {
      if (!map.has(k)) map.set(k, []);
      map.get(k).push([page, w.id]);
    }
    if (faLen(fa) > 20 && faLen(w.text) > 20) ratios.push(faLen(fa) / faLen(w.text));
  }
  ratios.sort((a, b) => a - b);
  const med = ratios.length ? ratios[Math.floor(ratios.length / 2)] : null;
  const lo = ratios.filter(r => r < 0.45).length;
  perPage.push({ page, med: med ? +med.toFixed(2) : null, under45: lo, n: ratios.length });
}
const dups = [...map.entries()].filter(([, v]) => v.length > 1)
  .map(([k, v]) => ({ text: k.slice(0, 90), where: v.map(x => x.join('/')).join(' , ') }));
console.log('cross-file duplicate translations:', dups.length);
for (const d of dups.slice(0, 40)) console.log('  ', d.where, '::', d.text);
perPage.sort((a, b) => (a.med || 9) - (b.med || 9));
console.log('\nlowest median fa/en length ratio pages:');
for (const p of perPage.slice(0, 15)) console.log('  ', p.page, 'med', p.med, 'under0.45', p.under45, 'of', p.n);
