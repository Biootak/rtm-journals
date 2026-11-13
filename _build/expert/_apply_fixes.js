// Apply hand fixes: node _apply_fixes.js <fixes.json>
// fixes.json: { "journal-pN": { "<hash>": "<persian>" } }
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const BATCHES = path.join(ROOT, '_build/expert/batches');
const fixes = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
for (const [page, map] of Object.entries(fixes)) {
  const f = path.join(BATCHES, page + '.json');
  const batch = JSON.parse(fs.readFileSync(f, 'utf8'));
  let n = 0;
  for (const [h, fa] of Object.entries(map)) {
    if (!(h in batch)) { console.log('NO HASH', page, h.slice(0, 8)); continue; }
    batch[h] = fa; n++;
  }
  fs.writeFileSync(f, JSON.stringify(batch, null, 1), 'utf8');
  console.log('applied', n, '->', page);
}
