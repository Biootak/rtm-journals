// dump-flagged.js <batchfile> — print flagged entries with English source
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const base = path.basename(process.argv[2]);
const report = JSON.parse(fs.readFileSync(path.join(dir, 'untranslated-report.json'), 'utf8'));
const flagged = new Set(report.filter(r => r.file === base && r.flag).map(r => r.hash));
const batch = JSON.parse(fs.readFileSync(path.join(dir, 'batches', base), 'utf8'));
const work = JSON.parse(fs.readFileSync(path.join(dir, 'work', base), 'utf8'));
const byHash = {};
for (const p of work) byHash[p.hash] = p;
let n = 0;
for (const h of Object.keys(batch)) {
  if (!flagged.has(h)) continue;
  n++;
  const src = byHash[h];
  console.log('===== ' + base + ' | ' + h + ' | ' + (src ? src.id : '?'));
  console.log('--- EN ---');
  console.log(src ? src.text : '(no source)');
  console.log('--- FA (current) ---');
  console.log(batch[h]);
  console.log('');
}
console.error('flagged in file: ' + n);
