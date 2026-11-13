/* Strict structural check: distinct hashes vs batch keys, staleness, page coverage. */
const fs = require('fs');
const path = require('path');
const ROOT = 'E:/Trade/journals/_build/expert';
const WORK = path.join(ROOT, 'work');
const BATCH = path.join(ROOT, 'batches');

const pages = fs.readdirSync(BATCH).filter(n => n.endsWith('.json') && !n.startsWith('_'));
const rows = [];
let bad = 0;
for (const name of pages) {
  const wp = path.join(WORK, name), bp = path.join(BATCH, name);
  if (!fs.existsSync(wp)) { rows.push([name, 'NO WORK']); bad++; continue; }
  const work = JSON.parse(fs.readFileSync(wp, 'utf8'));
  const batch = JSON.parse(fs.readFileSync(bp, 'utf8'));
  const distinct = new Set(work.map(w => w.hash)).size;
  const keys = Object.keys(batch).length;
  const empty = Object.values(batch).filter(v => typeof v !== 'string' || !v.trim()).length;
  const stale = fs.statSync(bp).mtimeMs < fs.statSync(wp).mtimeMs;
  const problems = [];
  if (distinct !== keys) problems.push(`keys ${keys} != distinct ${distinct}`);
  if (empty) problems.push(`empty ${empty}`);
  if (stale) problems.push('batch older than work');
  if (problems.length) { rows.push([name, problems.join('; ')]); bad++; }
}
console.log('pages checked', pages.length, '| structurally bad', bad);
for (const r of rows) console.log(' ', r.join(' | '));

// page coverage vs parsed.json for stage-4 journals
const parsed = JSON.parse(fs.readFileSync('E:/Trade/journals/_build/parsed.json', 'utf8'));
const stage4 = { jurij: [1,14], staurum: [8,19], lespaul: [8,18], fulljournal: [1,11], extremerrage: [1,11], astrokillah: [8,17], omidfx: [1,10], vitaldrug: [1,8] };
console.log('\n--- stage4 coverage (work vs parsed posts per page) ---');
for (const [j, [from, to]] of Object.entries(stage4)) {
  const journal = parsed.journals.find(x => String(x.id).toLowerCase() === j);
  if (!journal) { console.log(j, 'journal missing in parsed.json'); continue; }
  for (let p = from; p <= to; p++) {
    const expect = (journal.posts || []).filter(x => (x.page ?? x.pageNum ?? 1) === p && (x.text || '').trim()).length;
    const wf = path.join(WORK, `${j}-p${p}.json`);
    const bf = path.join(BATCH, `${j}-p${p}.json`);
    let got = null, keys = null;
    if (fs.existsSync(wf)) got = JSON.parse(fs.readFileSync(wf, 'utf8')).length;
    if (fs.existsSync(bf)) keys = Object.keys(JSON.parse(fs.readFileSync(bf, 'utf8'))).length;
    const flag = (got !== expect || !keys) ? '  <== ' + (!keys ? 'NO BATCH' : 'WORK MISMATCH') : '';
    console.log(`${j}-p${p}: parsed ${expect} | work ${got} | batchKeys ${keys}${flag}`);
  }
}
