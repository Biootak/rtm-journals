/*
 * Apply reviewer fixes to the batch files that feed the site.
 *
 *   node _build/expert/apply-review.js --dry
 *   node _build/expert/apply-review.js
 *
 * Reads _build/expert/review/<journal>-p<N>.review.json produced by the
 * review agents: { "<post id>": { issue, why, fix } }. A fix whose paragraph
 * count differs from the source is refused, so a reviewer cannot silently
 * restructure a post.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.env.JOURNALS_ROOT || path.resolve(__dirname, '..', '..');
const WORK = path.join(ROOT, '_build/expert/work');
const BATCHES = path.join(ROOT, '_build/expert/batches');
const REVIEW = path.join(ROOT, '_build/expert/review');

const dry = process.argv.includes('--dry');
const paragraphs = s => String(s || '').split(/\n{2,}/).filter(x => x.trim()).length;
const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
// The VMware shared folder intermittently returns EPERM on overwrite.
const writeFile = (file, data) => {
  for (let i = 0; ; i++) {
    try { return fs.writeFileSync(file, data, 'utf8'); }
    catch (e) {
      if (i >= 8 || !['EPERM', 'EBUSY', 'EACCES'].includes(e.code)) throw e;
      sleep(250);
    }
  }
};

const reports = fs.readdirSync(REVIEW).filter(n => n.endsWith('.review.json'));
let applied = 0; let refused = 0; const problems = [];
const storeFile = path.join(ROOT, '_build/expert/posts.json');
const store = fs.existsSync(storeFile) ? JSON.parse(fs.readFileSync(storeFile, 'utf8')) : {};
let storeTouched = false;

for (const name of reports) {
  const base = name.replace(/\.review\.json$/, '');
  const workFile = path.join(WORK, base + '.json');
  const batchFile = path.join(BATCHES, base + '.json');
  if (!fs.existsSync(workFile)) { problems.push([base, 'missing work file']); continue; }
  // Early pages live only in the expert store, not in a batch file.
  const useStore = !fs.existsSync(batchFile);
  const work = JSON.parse(fs.readFileSync(workFile, 'utf8'));
  const batch = useStore ? store : JSON.parse(fs.readFileSync(batchFile, 'utf8'));
  let review;
  try {
    review = JSON.parse(fs.readFileSync(path.join(REVIEW, name), 'utf8'));
  } catch (e) {
    problems.push([base, 'bad review json: ' + e.message.slice(0, 60)]);
    continue;
  }
  const byId = new Map(work.map(w => [w.id, w]));
  let touched = false;
  for (const [id, entry] of Object.entries(review)) {
    if (entry && entry.ok === true) continue;
    const w = byId.get(id);
    if (!w) { problems.push([id, 'not in work file']); continue; }
    const fix = String((entry && entry.fix) || '').trim();
    if (!fix) { problems.push([id, 'no fix (' + ((entry && entry.issue) || '?') + ')']); refused++; continue; }
    if (paragraphs(fix) !== paragraphs(w.text)) {
      problems.push([id, 'paragraphs ' + paragraphs(w.text) + ' / ' + paragraphs(fix)]);
      refused++;
      continue;
    }
    batch[w.hash] = fix;
    touched = true;
    applied++;
  }
  if (touched && !dry) {
    if (useStore) storeTouched = true;
    else writeFile(batchFile, JSON.stringify(batch, null, 1));
  }
}

if (storeTouched) writeFile(storeFile, JSON.stringify(store, null, 1));

console.log((dry ? '[dry] ' : '') + 'applied', applied, '| refused', refused);
for (const [id, why] of problems) console.log('  ' + id + ' | ' + why);
