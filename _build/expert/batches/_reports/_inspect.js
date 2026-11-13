const fs = require('fs');
const path = require('path');
const ROOT = 'E:/Trade/journals/_build/expert';
const cases = [
  ['extremerrage-p3', 'extremerrage_p3_8'],
  ['extremerrage-p4', 'extremerrage_p4_14'],
  ['extremerrage-p5', 'extremerrage_p5_24'],
  ['extremerrage-p5', 'extremerrage_p5_25'],
  ['extremerrage-p7', 'extremerrage_p7_16'],
  ['if-p131', 'if_p131_4'],
  ['if-p68', 'if_p68_9'],
  ['if-p9', 'if_p9_16'],
  ['if-p9', 'if_p9_17'],
  ['jurij-p1', 'jurij_p1_7'],
  ['if-p108', 'if_p108_23'],
  ['if-p108', 'if_p108_24'],
  ['if-p127', 'if_p127_23'],
  ['if-p127', 'if_p127_24'],
  ['if-p96', 'if_p96_20'],
  ['if-p96', 'if_p96_21'],
  ['pedini-p2', 'pedini_p2_7'],
  ['pedini-p9', 'pedini_p9_6'],
  ['pedini-p9', 'pedini_p9_7'],
  ['salivan-p10', 'salivan_p10_6'],
  ['salivan-p10', 'salivan_p10_7'],
  ['salivan-p12', 'salivan_p12_15'],
  ['salivan-p13', 'salivan_p13_12'],
  ['salivan-p15', 'salivan_p15_22'],
  ['salivan-p4', 'salivan_p4_6'],
];
for (const [page, id] of cases) {
  const work = JSON.parse(fs.readFileSync(path.join(ROOT, 'work', page + '.json'), 'utf8'));
  const batch = JSON.parse(fs.readFileSync(path.join(ROOT, 'batches', page + '.json'), 'utf8'));
  const w = work.find(x => x.id === id);
  console.log('='.repeat(70));
  console.log(page, id, '| posts', work.length, '| keys', Object.keys(batch).length);
  if (!w) { console.log('  (post not in work)'); continue; }
  console.log('EN:', JSON.stringify(w.text).slice(0, 420));
  console.log('FA:', JSON.stringify(batch[w.hash]).slice(0, 420));
}
