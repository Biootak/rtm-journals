const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const WORK = path.join(ROOT, '_build/expert/work');
const BATCHES = path.join(ROOT, '_build/expert/batches');
// args: ids from stdin or file
const listFile = process.argv[2];
const ids = fs.readFileSync(listFile, 'utf8').split('\n')
  .map(l => (l.match(/^\s*(\S+?)\s*\|/) || [])[1]).filter(Boolean);
const byPage = new Map();
for (const id of ids) {
  const base = id.replace(/_(p\d+)_\d+$/, '-$1'); // journal-pN
  if (!byPage.has(base)) byPage.set(base, []);
  byPage.get(base).push(id);
}
for (const [base, want] of byPage) {
  const work = JSON.parse(fs.readFileSync(path.join(WORK, base + '.json'), 'utf8'));
  const batch = JSON.parse(fs.readFileSync(path.join(BATCHES, base + '.json'), 'utf8'));
  for (const id of want) {
    const w = work.find(x => x.id === id);
    if (!w) { console.log('=== MISSING ' + id); continue; }
    const fa = batch[w.hash];
    console.log('===== ' + id + ' | hash=' + w.hash + ' =====');
    console.log('--- EN ---');
    console.log(w.text);
    console.log('--- FA ---');
    console.log(fa === undefined ? '<MISSING>' : fa);
  }
}
