/*
 * QA over the shipped translation layer.
 *
 *   node _build/expert/qa-translations.js
 *
 * Reads the baked cache (what the site actually serves), the expert layer and
 * the parsed corpus, then reports coverage, mechanical defects, quote-head
 * loss, number drift, suspicious length ratios and reused Persian blocks.
 * Writes _build/expert/qa-report.md with the offenders.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.env.JOURNALS_ROOT || path.resolve(__dirname, '..', '..');
const BUILD = path.join(ROOT, '_build');
const policy = require(path.join(BUILD, 'translation-policy.js'));
const lex = require(path.join(BUILD, 'lexicon.js'));
const { relaxExpert } = require(path.join(BUILD, 'audit-relax.js'));

const read = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
const baked = read(path.join(BUILD, 'posts', 'translations.baked.json'), {});
const store = read(path.join(BUILD, 'expert', 'posts.json'), {});
const batches = {};
try {
  for (const name of fs.readdirSync(path.join(BUILD, 'expert', 'batches')).filter(n => n.endsWith('.json'))) {
    Object.assign(batches, read(path.join(BUILD, 'expert', 'batches', name), {}));
  }
} catch { /* no batches yet */ }
const expert = { ...store, ...batches };
const parsed = read(path.join(BUILD, 'parsed.json'), { journals: [] });

const normalize = t => String(t || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n').trim();
const hashOf = t => crypto.createHash('sha1').update(normalize(t)).digest('hex');
const paragraphs = s => String(s || '').split(/\n{2,}/).filter(x => x.trim()).length;
const faOnly = s => (String(s || '').match(/[\u0600-\u06FF]/g) || []).length;
const digits = s => s.match(/\d+(?:[.,]\d+)?%?/g) || [];
const distance = (a, b) => {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
};

const rows = [];
for (const journal of parsed.journals || []) {
  for (const post of journal.posts || []) {
    const text = String(post.text || '').trim();
    if (!text) continue;
    const hash = hashOf(text);
    rows.push({ journal: journal.id, id: post.id || hash.slice(0, 8), page: post.pageNum || 1, author: post.author || '', text, hash });
  }
}

const report = {
  total: rows.length,
  cohorts: { expert: 0, machine: 0, none: 0 },
  issues: { persianDigits: [], latinJunk: [], englishLeft: [], echo: [], repetition: [], rambling: [], noPersian: [], untranslated: [] },
  paraMismatch: { expert: [], machine: [] },
  quoteLoss: [],
  numberDrift: [],
  numberSevere: [],
  lengthRatio: [],
  duplicates: [],
  expertRows: [],
};

const faNorm = new Map(); // normalized Persian -> [id]
for (const row of rows) {
  const raw = baked[row.hash];
  const isExpert = Object.prototype.hasOwnProperty.call(expert, row.hash);
  if (isExpert) report.cohorts.expert++;
  else if (raw && String(raw).trim()) report.cohorts.machine++;
  else report.cohorts.none++;
  if (!raw || !String(raw).trim()) continue;
  const fa = policy.repairQuoteHeads(row.text, isExpert ? policy.cleanMachine(raw, row.text) : policy.cleanMachine(raw));
  if (!fa || !faOnly(fa)) {
    // A chart line that is only a ticker and timeframe ("EURJPY M1") or a bare
    // URL has no prose to translate, so hand output that stays Latin is right.
    const nothingToTranslate = isExpert && (!/[A-Za-z\u0600-\u06FF]/.test(row.text)
      || !lex.hasProse(row.text) || !/\s/.test(String(row.text).trim()));
    if (!nothingToTranslate) report.issues.noPersian.push(row.id);
    continue;
  }
  let issues = lex.audit(fa, row.text).filter(i => i !== 'untranslated');
  // Hand work keeps source names, tickers and deliberate echoes; the same
  // exemptions the validator and the bake apply. Machine output stays strict.
  if (isExpert) issues = relaxExpert(issues, fa, row.text);
  const push = (key, val) => { if (report.issues[key]) report.issues[key].push(val); };
  for (const issue of issues) {
    if (issue === 'persian-digits') push('persianDigits', row.id);
    else if (issue === 'latin-junk') push('latinJunk', row.id);
    else if (issue === 'english-left') push('englishLeft', row.id);
    else if (issue === 'echo') push('echo', row.id);
    else if (issue === 'repetition') push('repetition', row.id);
    else if (issue === 'rambling') push('rambling', row.id);
  }
  if (normalize(fa) === normalize(row.text)) report.issues.untranslated.push(row.id);

  const np = paragraphs(row.text);
  const fp = paragraphs(fa);
  if (np !== fp) (isExpert ? report.paraMismatch.expert : report.paraMismatch.machine).push({ id: row.id, np, fp });

  const heads = (row.text.match(/(?:^|\n)\s*(?!(?:i|you|we|they|he|she|it|who)\b)[A-Za-z][A-Za-z0-9_.\-+]{1,32}\s*(?:wrote|writes)\s*:/gi) || []).length;
  if (heads) {
    const faHeads = (fa.match(/نوشت\s*:/g) || []).length;
    if (faHeads < heads) report.quoteLoss.push({ id: row.id, heads, faHeads, expert: isExpert });
  }

  const enNums = digits(row.text);
  const faNums = digits(fa).map(n => n.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))));
  const dg = s => String(s).replace(/[^\d]/g, '');
  const faSet = new Set(faNums.map(dg));
  const present = t => {
    if (faSet.has(dg(t))) return true;
    const parts = String(t).split(/[.,]/).filter(Boolean);
    return parts.length >= 2 && parts.every(p => faSet.has(dg(p)));
  };
  const decimalMissing = enNums.filter(n => /[.,]\d+/.test(n) && !present(n));
  if (decimalMissing.length) report.numberDrift.push({ id: row.id, missing: [...new Set(decimalMissing)].slice(0, 8), expert: isExpert });
  const severeMissing = [...new Set(enNums)].filter(n => dg(n).length >= 3 && !present(n));
  if (severeMissing.length) report.numberSevere.push({ id: row.id, missing: severeMissing.slice(0, 8), expert: isExpert });

  const enWords = (row.text.match(/[A-Za-z]+/g) || []).length;
  if (enWords >= 80) {
    const ratio = fa.length / Math.max(1, row.text.length);
    if (ratio < 0.3 || ratio > 2.2) report.lengthRatio.push({ id: row.id, ratio: Number(ratio.toFixed(2)), expert: isExpert });
  }

  const key = fa.replace(/[\s،؛:,.!?«»"'()\[\]\-—…]/g, '').toLowerCase();
  if (key.length >= 60) {
    if (!faNorm.has(key)) faNorm.set(key, []);
    faNorm.get(key).push({ id: row.id, expert: isExpert, en: normalize(row.text) });
  }
  if (isExpert) report.expertRows.push(row);
}

for (const [key, list] of faNorm) {
  // Identical English cross-posts ("chats" vs "charts") may share a
  // translation; only a real reuse of Persian across different text counts.
  const realReuse = list.some((x, i) => list.some((y, j) =>
    j > i && distance(x.en.toLowerCase(), y.en.toLowerCase()) > 3));
  if (list.length >= 2 && realReuse) {
    report.duplicates.push({ ids: list.map(x => x.id).slice(0, 6), expert: list.some(x => x.expert), chars: key.length });
  }
}

const md = [];
md.push('# Translation QA report', '');
md.push(`Generated over ${report.total} posts with text from _build/parsed.json.`, '');
md.push('## Coverage', '', '| cohort | posts |', '|---|---|',
  `| expert layer | ${report.cohorts.expert} |`, `| machine only | ${report.cohorts.machine} |`, `| none | ${report.cohorts.none} |`, '');
md.push('## Mechanical issues (site-served Persian)', '', '| check | count |', '|---|---|');
for (const [k, v] of Object.entries(report.issues)) md.push(`| ${k} | ${v.length} |`);
md.push('', `| quote heads lost | ${report.quoteLoss.length} |`);
md.push(`| number drift (decimals) | ${report.numberDrift.length} |`);
md.push(`| missing prices/integers (>=3 digits) | ${report.numberSevere.length} |`);
md.push(`| machine paragraph-count drift | ${report.paraMismatch.machine.length} |`);
md.push(`| length ratio outliers | ${report.lengthRatio.length} |`);
md.push(`| reused Persian blocks | ${report.duplicates.length} |`, '');
const section = (title, list, fmt) => {
  if (!list.length) return;
  md.push('## ' + title, '');
  for (const x of list.slice(0, 120)) md.push('- ' + fmt(x));
  if (list.length > 120) md.push(`- … ${list.length - 120} more`);
  md.push('');
};
section('Expert paragraph mismatches', report.paraMismatch.expert, x => `${x.id}: ${x.np} en / ${x.fp} fa`);
section('Quote heads lost', report.quoteLoss, x => `${x.id}: ${x.heads} wrote: / ${x.faHeads} نوشت:${x.expert ? ' (expert)' : ''}`);
section('Number drift', report.numberDrift, x => `${x.id}${x.expert ? ' (expert)' : ''}: missing ${x.missing.join(', ')}`);
section('Missing prices / long integers', report.numberSevere, x => `${x.id}${x.expert ? ' (expert)' : ''}: missing ${x.missing.join(', ')}`);
section('Length ratio outliers', report.lengthRatio, x => `${x.id}${x.expert ? ' (expert)' : ''}: ratio ${x.ratio}`);
section('Reused Persian blocks', report.duplicates, x => `${x.ids.join(', ')}${x.expert ? ' (expert)' : ''} — ${x.chars} chars`);
for (const key of ['persianDigits', 'latinJunk', 'englishLeft', 'repetition', 'echo', 'rambling']) {
  section('Issue: ' + key, report.issues[key], id => id);
}
fs.writeFileSync(path.join(BUILD, 'expert', 'qa-report.md'), md.join('\n'), 'utf8');
console.log(md.slice(0, 40).join('\n'));
console.log('\nfull report: _build/expert/qa-report.md');
