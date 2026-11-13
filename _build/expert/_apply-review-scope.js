/*
 * Apply review verdicts for a named list of pages only.
 *
 * apply-review.js walks every *.review.json in the review folder, which also
 * replays verdicts from older waves — those can undo a page that was
 * retranslated after it was reviewed. This script keeps the same rules
 * (id → hash, paragraph count must match) but only opens the pages you name.
 *
 *   node _build/expert/_apply-review-scope.js [--dry] <page> [<page> ...]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const WORK = path.join(ROOT, '_build', 'expert', 'work');
const BATCHES = path.join(ROOT, '_build', 'expert', 'batches');
const REVIEW = path.join(ROOT, '_build', 'expert', 'review');

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const pages = args.filter(a => !a.startsWith('--'));

const paragraphs = s => String(s || '').split(/\n{2,}/).filter(x => x.trim()).length;

let applied = 0;
let refused = 0;
const problems = [];

for (const page of pages) {
  const reviewFile = path.join(REVIEW, page + '.review.json');
  const workFile = path.join(WORK, page + '.json');
  const batchFile = path.join(BATCHES, page + '.json');
  if (!fs.existsSync(reviewFile)) continue;
  if (!fs.existsSync(workFile) || !fs.existsSync(batchFile)) {
    problems.push([page, 'missing work or batch file']);
    continue;
  }
  const work = JSON.parse(fs.readFileSync(workFile, 'utf8'));
  const batch = JSON.parse(fs.readFileSync(batchFile, 'utf8'));
  const byId = new Map(work.map(w => [w.id, w]));
  let review;
  try {
    review = JSON.parse(fs.readFileSync(reviewFile, 'utf8'));
  } catch (e) {
    problems.push([page, 'bad review json: ' + e.message.slice(0, 60)]);
    continue;
  }
  let touched = false;
  for (const [id, entry] of Object.entries(review)) {
    if (entry && entry.ok === true) continue;
    const w = byId.get(id);
    if (!w) { problems.push([id, 'not in work file']); continue; }
    const fix = String((entry && entry.fix) || '').trim();
    if (!fix) { problems.push([id, 'no fix']); refused++; continue; }
    if (paragraphs(fix) !== paragraphs(w.text)) {
      problems.push([id, 'paragraphs ' + paragraphs(w.text) + ' / ' + paragraphs(fix)]);
      refused++;
      continue;
    }
    batch[w.hash] = fix;
    touched = true;
    applied++;
  }
  if (touched && !dry) fs.writeFileSync(batchFile, JSON.stringify(batch, null, 1), 'utf8');
}

console.log((dry ? '[dry] ' : '') + 'applied', applied, '| refused', refused);
for (const [id, why] of problems) console.log('  ' + id + ' | ' + why);
