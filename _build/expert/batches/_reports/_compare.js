/* Deep comparison: batches/*.json vs work/*.json
   Reports: missing pages, missing keys, empty translations, extra hashes,
   untranslated copies, duplicate translations, paragraph mismatch. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = 'E:/Trade/journals/_build/expert';
const WORK = path.join(ROOT, 'work');
const BATCH = path.join(ROOT, 'batches');

const normalize = t => String(t || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n').trim();
const hashOf = t => crypto.createHash('sha1').update(normalize(t)).digest('hex');
const paras = s => String(s || '').split(/\n{2,}/).filter(x => x.trim()).length;
const faChars = s => (String(s || '').match(/[\u0600-\u06FF]/g) || []).length;

const batchFiles = fs.readdirSync(BATCH).filter(n => n.endsWith('.json') && !n.startsWith('_'));
const workFiles = fs.readdirSync(WORK).filter(n => n.endsWith('.json'));

const report = { pages: [], missingPages: [], batchOnly: [], workOnly: [], stats: {} };
const missingPage = workFiles.filter(n => !batchFiles.includes(n));

// per-page analysis
const allIssues = [];
for (const name of batchFiles) {
  const base = name.replace(/\.json$/, '');
  const wp = path.join(WORK, name);
  const bp = path.join(BATCH, name);
  const entry = { page: base, posts: 0, keys: 0, issues: [] };
  if (!fs.existsSync(wp)) { entry.issues.push('NO_WORK_FILE'); allIssues.push([base, 'NO_WORK_FILE']); report.batchOnly.push(name); report.pages.push(entry); continue; }
  let work, batch;
  try { work = JSON.parse(fs.readFileSync(wp, 'utf8')); }
  catch (e) { entry.issues.push('WORK_JSON:' + e.message); report.pages.push(entry); continue; }
  try { batch = JSON.parse(fs.readFileSync(bp, 'utf8')); }
  catch (e) {
    entry.issues.push('BATCH_JSON:' + e.message); allIssues.push([base, 'BATCH_JSON ' + e.message]);
    report.pages.push(entry); continue;
  }
  entry.posts = work.length;
  entry.keys = Object.keys(batch).length;
  const hashes = new Set(work.map(w => w.hash));
  for (const h of Object.keys(batch)) {
    if (!hashes.has(h)) { entry.issues.push('EXTRA_HASH ' + h.slice(0, 8)); allIssues.push([base, 'extra hash ' + h.slice(0, 8)]); }
  }
  const seen = new Map();
  for (const w of work) {
    const fa = batch[w.hash];
    if (typeof fa !== 'string') { entry.issues.push(`MISSING ${w.id}`); allIssues.push([base, `missing ${w.id}`]); continue; }
    if (!fa.trim()) { entry.issues.push(`EMPTY ${w.id}`); allIssues.push([base, `empty ${w.id}`]); continue; }
    const body = fa.replace(/^@@@.*$/gm, '').trim();
    // untranslated copy: essentially the English source repeated
    if (normalize(fa) === normalize(w.text)) {
      entry.issues.push(`COPY_OF_SOURCE ${w.id}`); allIssues.push([base, `copy-of-source ${w.id}`]);
    } else if (faChars(fa) === 0 && /[A-Za-z]{3,}/.test(w.text)) {
      entry.issues.push(`NO_PERSIAN ${w.id}`); allIssues.push([base, `no-persian ${w.id}`]);
    } else if (faChars(fa) < 4 && paras(w.text) > 1) {
      entry.issues.push(`TINY_FA ${w.id}`); allIssues.push([base, `tiny-fa ${w.id}`]);
    }
    if (paras(w.text) !== paras(fa)) {
      entry.issues.push(`PARA ${w.id} ${paras(w.text)}/${paras(fa)}`); allIssues.push([base, `paragraphs ${w.id} ${paras(w.text)}/${paras(fa)}`]);
    }
    const key = normalize(fa);
    if (key.length > 40) {
      if (seen.has(key)) { entry.issues.push(`DUP_VALUE ${w.id} == ${seen.get(key)}`); allIssues.push([base, `duplicate translation ${w.id} == ${seen.get(key)}`]); }
      else seen.set(key, w.id);
    }
    // placeholder markers
    if (/TODO|ترجمه نشده|متن اصلی|placeholder|lorem/i.test(fa)) {
      entry.issues.push(`PLACEHOLDER ${w.id}`); allIssues.push([base, `placeholder ${w.id}`]);
    }
  }
  if (entry.issues.length) report.pages.push(entry);
  else report.pages.push({ page: base, posts: work.length, keys: Object.keys(batch).length, issues: [] });
}
report.missingPages = missingPage;
report.stats.batchFiles = batchFiles.length;
report.stats.workFiles = workFiles.length;
report.stats.totalPosts = report.pages.reduce((a, p) => a + (p.posts || 0), 0);
report.stats.pagesWithIssues = report.pages.filter(p => p.issues.length).length;
report.stats.issueCount = allIssues.length;

console.log(JSON.stringify({
  stats: report.stats,
  brokenPages: report.pages.filter(p => p.issues.length),
  missingPages: missingPage,
  batchOnly: report.batchOnly,
}, null, 1));
