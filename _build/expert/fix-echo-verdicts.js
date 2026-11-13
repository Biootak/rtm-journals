const fs = require('fs');
function edit(page, id, from, to) {
  const f = `_build/expert/review/${page}.review.json`;
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  const v = j[id];
  if (!v || !v.fix) throw new Error(`missing ${page} ${id}`);
  if (!v.fix.includes(from)) throw new Error(`text not found in ${page} ${id}`);
  v.fix = v.fix.replace(from, to);
  fs.writeFileSync(f, JSON.stringify(j, null, 1), 'utf8');
  console.log('patched', page, id);
}
edit('rinehart-p8', 'rinehart_p8_20', 'و مقداری ریپل حدود 1.50 دلار خریدم', 'و مقداری ریپل حدود 1.50 دلار تهیه کردم');
edit('sniffing-p6', 'sniffing_p6_2', 'نواحی مورد توجه بعدی.', 'و سپس، نواحی بعدیِ قابل توجه.');
