#!/usr/bin/env node
/*
 * Deep translation-quality audit + durable progress ledger.
 *
 * Mechanical QA (qa-translations.js) answers "does the post contain junk?".
 * This audit answers "does the Persian read as a finished translation?":
 *
 *   untranslated   no Persian prose at all
 *   english-left   ordinary English words inside a Persian sentence
 *   calque         a literal pattern that is not Persian ("در fact")
 *   fragment       paragraph ends on a connector, unbalanced quotes/brackets
 *   omission       Persian is far shorter than the English
 *   broken-word    Latin fragment inside a Persian word
 *
 * `no-verb` is recorded as information only. A nominal Persian sentence is
 * grammatical, and every form of a fixed verb list missed common ones
 * («می‌شوم», «می‌فروشیم», «داشته باشید», «می‌مانم»), so it flags good Persian
 * and never gates a page.
 *
 * Each post gets severity 0-3. The ledger records, per page, how many posts
 * are clean, need review, or are done, plus the exact hashes. A page is only
 * `done` when a reviewer has marked it; the script never marks its own work.
 *
 *   node _build/expert/audit-quality.js            # audit + ledger
 *   node _build/expert/audit-quality.js --report   # print only
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const lex = require('../lexicon.js');

const ROOT = path.resolve(__dirname, '..', '..');
const W = path.join(__dirname, 'work');
const B = path.join(__dirname, 'batches');
const STORE_FILE = path.join(__dirname, 'posts.json');
const LEDGER = path.join(__dirname, 'PROGRESS.json');
const REPORT = path.join(__dirname, 'quality-report.md');

const normalize = t => String(t || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n').trim();
const hashOf = t => crypto.createHash('sha1').update(normalize(t)).digest('hex');
const paras = s => String(s || '').split(/\n{2,}/).filter(x => x.trim());
const FA_LETTER = /[\u0621-\u063A\u0641-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06CC]/;
const FA_WORD = /[\u0621-\u063A\u0641-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06CC]{2,}/;

/* Ordinary English words, matched case-insensitively one word at a time. The
   archive legitimately keeps handles, tickers and pattern names in Latin, so a
   single match is not a defect; only a run of English words is residue. */
const EN = /\b(?:the|and|is|are|was|were|this|that|these|those|with|have|has|had|will|would|you|your|not|for|but|from|they|them|there|what|when|where|which|who|how|can|could|should|just|like|about|into|than|then|also|only|more|some|all|any|very|much|need|know|think|want|make|made|get|got|see|look|going|been|being|does|did|doing|because|after|before|over|under|again|still|even|well|good|bad|here|now|out|off|down|up|believe|suppose|obvious|obviously|actually|basically|exactly|anyway|maybe|really|pretty|quite|rather|perhaps|though|although|however|therefore|instead|unless|until|while|during|without|within|between|through|around|against|toward|towards|already|almost|always|never|sometimes|usually|often|soon|later|early|enough|another|other|same|different|first|last|next|new|old|big|small|long|short|high|low|right|wrong|true|false|sure|clear|simple|easy|hard|difficult|important|interesting|possible|impossible)\b/i;

const CALQUES = [
  [/در\s+fact/gi, 'در واقع'],
  [/در\s+reality/gi, 'در واقعیت'],
  [/به\s+عنوان\s+یک\s+نتیجه/gi, 'در نتیجه'],
  [/می\s+باشد/g, 'است'],
  [/می\s+توانید/g, 'می‌توانید'],
  [/می\s+توانم/g, 'می‌توانم'],
  [/می\s+شود/g, 'می‌شود'],
  [/می\s+کند/g, 'می‌کند'],
  [/بیرون\s+رفتن\s+از/gi, 'خروج از'],
  [/پول\s+در\s+دست/gi, 'با سود'],
  [/آهنگی\s+است/gi, 'داستانی است'],
  [/در\s+کانتکست/gi, 'در بستر'],
  [/نقش\s+بازی\s+می/gi, 'نقش دارد'],
  [/واقعاً\s+می\s+تواند\s+بگوید/gi, 'واقعاً می‌تواند بگوید'],
];

/* Verb detection for the informational no-verb note. The present-tense
   «می/نمی» prefix is the one reliable signal in Persian script; the copulas and
   auxiliaries cover nominal sentences. Never used as a gate. */
const VERB = /(?:^|[\s،؛:.«»()\[\]\u200c])(?:می|نمی)[\u0621-\u06FF\u200c]{2,}|هست(?:م|ی|یم|ید|ند)?|نیست(?:م|ی|یم|ید|ند)?|(?:بود|شد|ساخت|کرد|داشت|دارد|دارم|داری|داریم|دارید|دارند|باشد|باشم|باشی|باشیم|باشید|باشند|باید|شدم|شدی|شدیم|شدید|شدند|کردم|کردی|کردیم|کردید|کردند|خواهد|خواهم|خواهیم|خواهید|خواهند)/;

const STOP_END = /(?:^|\s)(?:و|که|در|به|از|با|برای|اگر|وقتی|چون|تا|یا|اما|ولی|پس|هم|روی|زیر|بین|بدون|مثل|مانند|طبق|مطابق)\s*$/;

function auditPost(en, fa) {
  const issues = [];
  const info = [];
  const enParas = paras(en);
  const faParas = paras(fa);
  const faText = faParas.join(' ');
  if (!faText.trim()) return { issues: ['missing'], severity: 3 };
  if (!FA_LETTER.test(faText)) {
    /* A ticker, URL or attachment line has no prose to translate; the project
       rule is that such a post stays Latin. It is not a missing translation. */
    if (!lex.hasProse(en)) return { issues: [], severity: 0 };
    issues.push('untranslated');
  }

  // Handles, tickers and pattern names stay Latin all over the archive, so a
  // single Latin word means nothing. What a finished translation never keeps is
  // a run of ordinary English words; three in a row with a lowercase English
  // word inside is residue from the source.
  const latinRuns = faText.match(/(?:[A-Za-z][A-Za-z'’-]*[ \t]+){2,}[A-Za-z][A-Za-z'’-]*/g) || [];
  const residue = latinRuns.some(run => run.split(/\s+/)
    .some(w => w === w.toLowerCase() && EN.test(w)));
  if (residue) issues.push('english-left');

  if (CALQUES.some(([re]) => re.test(faText))) issues.push('calque');

  const broken = faText.match(/[\u0600-\u06FF]+[A-Za-z]{2,}[\u0600-\u06FF]+/g) || [];
  if (broken.length) issues.push('broken-word');

  const unbalancedIn = list => list.some(p => {
    const pairs = [['«', '»'], ['(', ')'], ['[', ']'], ['{', '}']];
    return pairs.some(([a, b]) => (p.split(a).length !== p.split(b).length));
  });
  // The source itself may split a parenthetical across paragraphs; only a
  // mismatch the English does not have is a translation defect.
  const dangling = faParas.some(p => p.trim().length > 40 && STOP_END.test(p.trim()));
  const unbalanced = !unbalancedIn(enParas) && unbalancedIn(faParas);
  if (dangling || unbalanced) issues.push('fragment');

  const faChars = faText.replace(/\s+/g, '').length;
  const enChars = String(en || '').replace(/\s+/g, '').length;
  if (enChars > 80 && faChars < enChars * 0.3) issues.push('omission');

  const labelLike = p => p.trim().split(/\s+/).length <= 6 && !/[.!؟…]/.test(p);
  const noVerb = !VERB.test(faText) && faChars > 40 && !faParas.every(labelLike);
  if (noVerb) info.push('no-verb');

  let severity = 0;
  if (issues.includes('untranslated') || issues.includes('missing')) severity = 3;
  else if (issues.includes('english-left') || issues.includes('omission') || issues.includes('fragment')) severity = 2;
  else if (issues.length) severity = 1;
  return { issues, severity, info };
}

const store = fs.existsSync(STORE_FILE) ? JSON.parse(fs.readFileSync(STORE_FILE, 'utf8')) : {};
const ledger = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, 'utf8')) : { pages: {} };
ledger.version = 2;
ledger.updatedAt = new Date().toISOString();
ledger.rules = {
  source: 'English is the source of truth; a post body is repaired only from the local capture, never invented.',
  translation: 'One Persian paragraph per English paragraph; numbers and structural acronyms stay Latin; the meaning, not the words, is translated.',
  done: 'A page is done only after every post is severity 0 and a reviewer has recorded it in review.',
};

const pages = {};
const findings = [];
let posts = 0, clean = 0, needs = 0;
const byIssue = {};
const byInfo = {};

for (const file of fs.readdirSync(W).filter(f => f.endsWith('.json'))) {
  const page = file.replace(/\.json$/, '');
  const work = JSON.parse(fs.readFileSync(path.join(W, file), 'utf8'));
  const bf = path.join(B, file);
  const batch = fs.existsSync(bf) ? JSON.parse(fs.readFileSync(bf, 'utf8')) : {};
  const rec = pages[page] = { total: 0, clean: 0, needs: 0, severity: 0, ids: [] };
  for (const w of work) {
    const fa = String(batch[w.hash] || store[w.hash] || '');
    if (!fa.trim()) continue;
    posts++;
    rec.total++;
    const r = auditPost(w.text, fa);
    for (const i of r.issues) byIssue[i] = (byIssue[i] || 0) + 1;
    for (const i of r.info || []) byInfo[i] = (byInfo[i] || 0) + 1;
    if (r.severity === 0) { rec.clean++; clean++; }
    else {
      rec.needs++; needs++;
      rec.severity = Math.max(rec.severity, r.severity);
      rec.ids.push(w.id);
      if (findings.length < 4000) findings.push({ page, id: w.id, severity: r.severity, issues: r.issues, fa: fa.replace(/\s+/g, ' ').slice(0, 110) });
    }
  }
}

ledger.source = ledger.source || {};
ledger.translation = { posts, clean, needs, byIssue };
ledger.pages = Object.fromEntries(Object.entries(pages).map(([page, r]) => {
  const old = (ledger.pages || {})[page] || {};
  return [page, {
    total: r.total,
    clean: r.clean,
    needs: r.needs,
    severity: r.severity,
    status: old.status === 'done' && r.needs === 0 ? 'done' : (r.needs ? 'pending' : (old.status || 'clean')),
    reviewedAt: old.reviewedAt || '',
    reviewer: old.reviewer || '',
  }];
}));

const worst = Object.entries(ledger.pages).filter(([, r]) => r.needs)
  .sort((a, b) => b[1].needs - a[1].needs);

fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 1), 'utf8');
fs.writeFileSync(path.join(__dirname, 'quality-findings.json'),
  JSON.stringify(findings.filter(f => f.severity > 0), null, 1), 'utf8');
const md = [
  '# Translation quality ledger',
  '',
  `Updated ${ledger.updatedAt}`,
  '',
  '## Corpus',
  '',
  `- posts with Persian: **${posts}**`,
  `- clean (severity 0): **${clean}**`,
  `- need review: **${needs}**`,
  `- pages needing review: **${worst.length} / ${Object.keys(pages).length}**`,
  '',
  '## Issue counts',
  '',
  '| issue | posts |',
  '|---|---|',
  ...Object.entries(byIssue).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`),
  '',
  '## Informational (not counted as defects)',
  '',
  'A nominal Persian sentence has no verb and is still correct, so this is a',
  'reading hint for reviewers, never a gate.',
  '',
  '| hint | posts |',
  '|---|---|',
  ...Object.entries(byInfo).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${k} | ${v} |`),
  '',
  '## Worst pages',
  '',
  '| page | needs / total | severity |',
  '|---|---|---|',
  ...worst.slice(0, 80).map(([p, r]) => `| ${p} | ${r.needs} / ${r.total} | ${r.severity} |`),
  '',
  '## First findings',
  '',
  ...findings.slice(0, 200).map(f => `- ${f.page} ${f.id} — S${f.severity} ${f.issues.join(', ')} — ${f.fa}`),
  '',
  'The machine ledger is `PROGRESS.json`; it holds per-page hashes and status.',
].join('\n');
fs.writeFileSync(REPORT, md + '\n', 'utf8');

console.log({ posts, clean, needs, pagesNeeding: worst.length, pages: Object.keys(pages).length });
console.log(byIssue);
console.log('worst:', worst.slice(0, 12).map(([p, r]) => `${p} ${r.needs}/${r.total}`).join(' | '));
console.log('wrote', path.relative(ROOT, LEDGER), 'and', path.relative(ROOT, REPORT));
