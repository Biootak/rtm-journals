/* Global: work file post count + batch key count vs parsed.json truth per page. */
const fs = require('fs');
const path = require('path');
const ROOT = 'E:/Trade/journals/_build/expert';
const WORK = path.join(ROOT, 'work');
const BATCH = path.join(ROOT, 'batches');
const parsed = JSON.parse(fs.readFileSync('E:/Trade/journals/_build/parsed.json', 'utf8'));

const truth = new Map();
for (const j of parsed.journals || []) {
  for (const p of j.posts || []) {
    const text = String(p.text || '').trim();
    if (!text) continue;
    const key = String(j.id).toLowerCase() + '-p' + (p.pageNum ?? p.page ?? 1);
    truth.set(key, (truth.get(key) || 0) + 1);
  }
}
const bad = [];
for (const name of fs.readdirSync(WORK).filter(n => n.endsWith('.json'))) {
  const page = name.replace('.json', '');
  const w = JSON.parse(fs.readFileSync(path.join(WORK, name), 'utf8'));
  const exp = truth.get(page);
  const bf = path.join(BATCH, name);
  const keys = fs.existsSync(bf) ? Object.keys(JSON.parse(fs.readFileSync(bf, 'utf8'))).length : 0;
  const distinct = new Set(w.map(x => x.hash)).size;
  if (exp === undefined) bad.push([page, 'NO PARsed page', w.length]);
  else if (w.length !== exp) bad.push([page, `work ${w.length} vs parsed ${exp}`, 'batchKeys ' + keys]);
  else if (keys && keys !== distinct) bad.push([page, `batchKeys ${keys} vs distinct ${distinct}`]);
}
console.log('work files:', fs.readdirSync(WORK).filter(n => n.endsWith('.json')).length, '| mismatches:', bad.length);
for (const b of bad) console.log('  ', b.join(' | '));
