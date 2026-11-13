/* ------------------------------------------------------------- manifest stats
 * parsed.json keeps a few cumulative counters in `stats`. They used to be
 * written per apply-run from that run's log, so a second run zeroed the first
 * run's numbers — the manifest claimed `recoveredImages: 0` while 349 records
 * carried a `recovered` flag. This recomputes them from the data itself, which
 * is the only honest source, and can be run after any manual repair.
 *
 *   node _build/manifest-stats.js          print
 *   node _build/manifest-stats.js --write  print and rewrite parsed.json
 */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const PARSED = path.join(ROOT, '_build', 'parsed.json');
const WRITE = process.argv.includes('--write');

const parsed = JSON.parse(fs.readFileSync(PARSED, 'utf8'));
let records = 0, flagged = 0, fromRemote = 0, refs = 0, remoteLeft = 0, posts = 0;
const byJournal = [];
for (const J of parsed.journals) {
  let jr = 0, jf = 0, jref = 0, jremote = 0;
  for (const im of J.images || []) {
    records++; jr++;
    if (im.recovered) { flagged++; jf++; if (im.remoteSrc) fromRemote++; }
    if (im.type === 'remote') { remoteLeft++; jremote++; }
  }
  for (const q of J.posts || []) { posts++; refs += (q.images || []).length; jref += (q.images || []).length; }
  byJournal.push({ id: J.id, records: jr, recovered: jf, remoteLeft: jremote, refs: jref });
}

const stats = {
  imageRecords: records,
  postImageReferences: refs,
  recoveredRecords: flagged,
  recoveredFromRemoteLinks: fromRemote,
  remoteRecordsRemaining: remoteLeft,
};
console.log('parsed.json — ' + parsed.journals.length + ' journals, ' + posts + ' posts');
for (const [k, v] of Object.entries(stats)) console.log('  ' + k.padEnd(26) + v);
console.log('\nper journal (records / recovered / remote-left / refs):');
for (const r of byJournal.filter(r => r.recovered || r.remoteLeft))
  console.log('  ' + r.id.padEnd(14) + String(r.records).padStart(5) + String(r.recovered).padStart(6) +
    String(r.remoteLeft).padStart(6) + String(r.refs).padStart(7));

if (WRITE) {
  parsed.stats = Object.assign(parsed.stats || {}, stats);
  /* The per-run keys are gone for good: they were written from one run's log
   * and no reader exists, so leaving `recoveredImages: 0` beside
   * `recoveredRecords: 349` would only invite the wrong conclusion. */
  for (const dead of ['recoveredImages', 'recoveredReferences', 'recoveredRemote']) delete parsed.stats[dead];
  fs.writeFileSync(PARSED, JSON.stringify(parsed));
  console.log('\nwrote ' + path.relative(ROOT, PARSED));
} else {
  console.log('\n(dry run — pass --write)');
}
