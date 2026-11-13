// Dump EN/FA pairs for review: node review-dump.js <jid>-p<N> [startIdx] [count]
const fs = require('fs');
const path = require('path');
const base = path.join(__dirname);
const arg = process.argv[2];
const [jid, pg] = arg.split('-p');
const work = JSON.parse(fs.readFileSync(path.join(base, 'work', `${jid}-p${pg}.json`), 'utf8'));
const batchPath = path.join(base, 'batches', `${jid}-p${pg}.json`);
if (!fs.existsSync(batchPath)) { console.log('NO BATCH'); process.exit(0); }
let batch;
try { batch = JSON.parse(fs.readFileSync(batchPath, 'utf8')); }
catch (e) { console.log('BATCH PARSE FAIL: ' + e.message); process.exit(0); }
const start = parseInt(process.argv[3] || '0', 10);
const count = parseInt(process.argv[4] || '9999', 10);
const slice = work.slice(start, start + count);
slice.forEach((p, i) => {
  const fa = batch[p.hash];
  console.log(`\n##### [${start + i}] ${p.id} | ${p.author} | ${p.hash}`);
  if (fa === undefined) { console.log('!!! MISSING BATCH ENTRY'); return; }
  console.log('--- EN ---');
  console.log(p.text);
  console.log('--- FA ---');
  console.log(fa);
});
