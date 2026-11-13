// Substring fixer for batch files.
// Spec JSON: { "<journal>-p<N>": { "<post id>": [["old","new"], ...] } }
// Applies replacements inside the batch value for that post's hash.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const WORK = path.join(ROOT, '_build/expert/work');
const BATCHES = path.join(ROOT, '_build/expert/batches');
const STORE = path.join(ROOT, '_build/expert/posts.json');

const specFile = process.argv[2];
const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
const store = fs.existsSync(STORE) ? JSON.parse(fs.readFileSync(STORE, 'utf8')) : {};
const touchedStore = new Set();
let total = 0, missed = 0;

for (const [base, posts] of Object.entries(spec)) {
  const workFile = path.join(WORK, base + '.json');
  const batchFile = path.join(BATCHES, base + '.json');
  if (!fs.existsSync(workFile)) { console.log('skip', base); continue; }
  const work = JSON.parse(fs.readFileSync(workFile, 'utf8'));
  const byId = new Map(work.map(w => [w.id, w]));
  const useStore = !fs.existsSync(batchFile);
  const batch = useStore ? store : JSON.parse(fs.readFileSync(batchFile, 'utf8'));
  if (posts['__all__']) {
    for (const [h, val0] of Object.entries(batch)) {
      let val = String(val0);
      for (const [o, n] of posts['__all__']) {
        if (val.includes(o)) { val = val.split(o).join(n); total++; }
        else missed++;
      }
      batch[h] = val;
      if (useStore) touchedStore.add(h);
    }
  }
  for (const [id, pairs] of Object.entries(posts)) {
    if (id === '__all__') continue;
    const w = byId.get(id);
    if (!w) { console.log('NO POST', id); missed++; continue; }
    let val = String(batch[w.hash] || '');
    if (!val) { console.log('NO FA', id); missed++; continue; }
    if (Array.isArray(pairs) && pairs[0] === '__SET__') {
      batch[w.hash] = pairs[1];
      if (useStore) touchedStore.add(w.hash);
      total++;
      continue;
    }
    for (const [o, n] of pairs) {
      if (!val.includes(o)) { console.log('MISS', id, JSON.stringify(o.slice(0, 60))); missed++; continue; }
      val = val.split(o).join(n);
      total++;
    }
    batch[w.hash] = val;
    if (useStore) touchedStore.add(w.hash);
  }
  if (!useStore) fs.writeFileSync(batchFile, JSON.stringify(batch, null, 1), 'utf8');
}
if (touchedStore.size) fs.writeFileSync(STORE, JSON.stringify(store, null, 1), 'utf8');
console.log('applied', total, 'missed', missed);
