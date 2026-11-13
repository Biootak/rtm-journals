// usage: node _find.tmp.js "english phrase"
const fs = require('fs');
const path = require('path');
const WORK = 'E:/Trade/journals/_build/expert/work';
const BAT = 'E:/Trade/journals/_build/expert/batches';
const needle = (process.argv[2] || '').toLowerCase();
const limit = Number(process.argv[3] || 6);
let shown = 0;
for (const f of fs.readdirSync(WORK).filter(n => /^if-p\d+\.json$/.test(n))) {
  const rows = JSON.parse(fs.readFileSync(path.join(WORK, f), 'utf8'));
  const batchFile = path.join(BAT, f);
  if (!fs.existsSync(batchFile)) continue;
  const b = JSON.parse(fs.readFileSync(batchFile, 'utf8'));
  for (const r of rows) {
    if (!r.text.toLowerCase().includes(needle)) continue;
    const fa = b[r.hash];
    if (!fa) continue;
    console.log('==== ' + f + ' ' + r.author);
    console.log(r.text.slice(0, 700));
    console.log('---- FA');
    console.log(fa.slice(0, 900));
    if (++shown >= limit) process.exit(0);
  }
}
