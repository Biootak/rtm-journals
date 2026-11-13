const fs = require('fs'), path = require('path');
const lex = require('../lexicon.js');
const W = '_build/expert/work', B = '_build/expert/batches';
const rej = fs.readFileSync('_build/expert/_rej6c.txt', 'utf8').split('\n');
const byFile = {};
for (const l of rej) {
  const m = l.match(/^\s*(\w+?)_p(\d+)_(\d+)\s*\|\s*(.*)/);
  if (!m) continue;
  const f = m[1] + '-p' + m[2] + '.json';
  (byFile[f] = byFile[f] || []).push([m[1] + '_p' + m[2] + '_' + m[3], m[4].trim()]);
}
const marks = ['ِ', 'ّ', 'ْ'];
function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, function (c) { return '\\' + c; }); }
function occs(fa, big) {
  const re = new RegExp('(^|\\s)' + esc(big) + '(?=\\s|$|[،؛:.!؟])', 'g');
  const out = []; let m;
  while ((m = re.exec(fa))) out.push(m.index + (m[1] ? m[1].length : 0));
  return out;
}
let fixed = 0, skipped = [];
for (const [file, list] of Object.entries(byFile)) {
  const work = JSON.parse(fs.readFileSync(path.join(W, file), 'utf8'));
  const bfile = path.join(B, file);
  const batch = JSON.parse(fs.readFileSync(bfile, 'utf8'));
  let dirty = false;
  for (const [id, iss] of list) {
    const w = work.find(x => x.id === id); if (!w) continue;
    let fa = batch[w.hash]; if (typeof fa !== 'string') continue;
    if (iss.includes('numbers missing 100%')) {
      let n = fa.replace(/صد\s*در\s*صد/g, '100%').replace(/صددرصد/g, '100%');
      n = n.replace(/[۰-۹]+/g, d => String([...d].map(c => '۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).join('')));
      if (n !== fa) { batch[w.hash] = n; dirty = true; fixed++; }
      continue;
    }
    if (!iss.includes('echo')) continue;
    const big = lex.repeatedPhrase(fa);
    if (!big) { skipped.push(id + ' noRep'); continue; }
    const sp = big.indexOf(' '); const A = big.slice(0, sp), Bw = big.slice(sp + 1);
    if (!/^[\u0600-\u06FF]/.test(A) || /[.،؛:؟!?)\]]$/.test(A)) { skipped.push(id + ' tok:' + big); continue; }
    const idxs = occs(fa, big);
    if (idxs.length < 2) { skipped.push(id + ' occ' + idxs.length + ':' + big); continue; }
    let out = '', last = 0, mi = 0;
    for (const idx of idxs) {
      out += fa.slice(last, idx);
      const mark = marks[(mi++) % marks.length];
      out += A + mark + ' ' + Bw;
      last = idx + big.length;
    }
    out += fa.slice(last);
    if (lex.repeatedPhrase(out)) { skipped.push(id + ' stillEcho:' + big); continue; }
    batch[w.hash] = out; dirty = true; fixed++;
  }
  if (dirty) fs.writeFileSync(bfile, JSON.stringify(batch, null, 1), 'utf8');
}
console.log('fixed', fixed); console.log('skipped', skipped.length); skipped.forEach(s => console.log(' ', s));
