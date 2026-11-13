// dump EN text and FA translation for given hs post ids
const fs = require('fs');
const path = require('path');
const ids = process.argv.slice(2);
const byPage = {};
for (const id of ids) {
  const m = id.match(/^(hs)_p(\d+)_/);
  (byPage['hs-p' + m[2]] = byPage['hs-p' + m[2]] || []).push(id);
}
for (const [wk, list] of Object.entries(byPage)) {
  const work = JSON.parse(fs.readFileSync(path.join('_build/expert/work', wk + '.json'), 'utf8'));
  const batchPath = path.join('_build/expert/batches', wk + '.json');
  const batch = fs.existsSync(batchPath) ? JSON.parse(fs.readFileSync(batchPath, 'utf8')) : {};
  const byId = Object.fromEntries(work.map(w => [w.id, w]));
  for (const id of list) {
    const w = byId[id];
    if (!w) { console.log(`=== ${id} MISSING IN WORK ===`); continue; }
    console.log(`===== ${id} | hash=${w.hash} =====`);
    console.log('--- EN ---');
    console.log(w.text);
    console.log('--- FA ---');
    console.log(batch[w.hash] !== undefined ? batch[w.hash] : '(NO TRANSLATION)');
    console.log('');
  }
}
