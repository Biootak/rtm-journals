#!/usr/bin/env node
/*
 * Review checklist for the whole translation layer.
 *
 *   node _build/expert/review-checklist.js
 *       → _build/expert/REVIEW-CHECKLIST.md  (IF first, one line per page)
 *       → _build/expert/REVIEW-CHECKLIST.json
 *
 *   node _build/expert/review-checklist.js --mark if-p1 --verdict clean
 *   node _build/expert/review-checklist.js --mark if-p2 --verdict fixed --defects 3 --note "QM calque"
 *   node _build/expert/review-checklist.js --mark if-p3 --verdict flagged --note "residual English in 4 posts"
 *   node _build/expert/review-checklist.js --unmark if-p2
 *
 * The ledger is reviewed.json (shared with make-checklist.js): a page counts as
 * reviewed only when the ledger says so. The legacy `review/*.review.json`
 * verdicts are shown as history, not as current-campaign progress.
 *
 * Suspects come from strict-report.json (audit-strict.js --write): residual
 * Latin, unbalanced brackets, paragraph drift, foreign script.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const BUILD = path.join(ROOT, '_build');
const EXPERT = path.join(BUILD, 'expert');
const WORK = path.join(EXPERT, 'work');
const BATCHES = path.join(EXPERT, 'batches');
const REVIEW = path.join(EXPERT, 'review');
const LEDGER = path.join(EXPERT, 'reviewed.json');
const STRICT = path.join(EXPERT, 'strict-report.json');
const OUT_MD = path.join(EXPERT, 'REVIEW-CHECKLIST.md');
const OUT_JSON = path.join(EXPERT, 'REVIEW-CHECKLIST.json');

const readJson = (file, fallback) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
};
const normalize = t => String(t || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n').trim();
const hashOf = t => crypto.createHash('sha1').update(normalize(t)).digest('hex');
const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const writeFile = (file, data) => {
  for (let i = 0; ; i++) {
    try { return fs.writeFileSync(file, data, 'utf8'); }
    catch (e) {
      if (i >= 8 || !['EPERM', 'EBUSY', 'EACCES'].includes(e.code)) throw e;
      sleep(250);
    }
  }
};

const LOCK = path.join(EXPERT, '.ledger.lock');
const acquireLock = () => {
  for (let i = 0; ; i++) {
    try { fs.mkdirSync(LOCK); return; }
    catch (e) {
      if (e.code !== 'EEXIST') throw e;
      if (i > 240) throw new Error('ledger lock timeout');
      sleep(250);
    }
  }
};
const releaseLock = () => { try { fs.rmdirSync(LOCK); } catch {} };
const withLedgerLock = fn => {
  acquireLock();
  try { fn(); } finally { releaseLock(); }
};

/* ---------- ledger commands ---------- */
const args = process.argv.slice(2);
const flagValue = name => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : '';
};

if (args.includes('--unmark')) {
  const ids = String(flagValue('--unmark') || '').split(',').filter(Boolean);
  withLedgerLock(() => {
    const ledger = readJson(LEDGER, { campaign: 'full-review', pages: {} });
    ledger.pages = ledger.pages || {};
    for (const id of ids) delete ledger.pages[id];
    writeFile(LEDGER, JSON.stringify(ledger, null, 1));
  });
  console.log('unmarked', ids.join(', ') || '(nothing)');
}
if (args.includes('--mark')) {
  const ids = String(flagValue('--mark') || '').split(',').filter(Boolean);
  const verdict = flagValue('--verdict') || 'clean';
  const defects = Number(flagValue('--defects') || 0) || 0;
  const note = flagValue('--note') || '';
  if (!ids.length) throw new Error('--mark needs page ids, e.g. --mark if-p1');
  withLedgerLock(() => {
    const ledger = readJson(LEDGER, { campaign: 'full-review', pages: {} });
    ledger.pages = ledger.pages || {};
    for (const id of ids) {
      ledger.pages[id] = {
        validated: verdict === 'clean' || verdict === 'fixed',
        verdict,
        defects,
        note,
        at: new Date().toISOString(),
      };
    }
    writeFile(LEDGER, JSON.stringify(ledger, null, 1));
  });
  console.log('marked', ids.join(', '), '→', verdict, defects ? `(${defects} defects)` : '');
}

/* ---------- corpus pages ---------- */
const parsed = readJson(path.join(BUILD, 'parsed.json'), { journals: [] });
const store = readJson(path.join(EXPERT, 'posts.json'), {});
const batch = {};
for (const f of fs.readdirSync(BATCHES).filter(n => n.endsWith('.json'))) {
  Object.assign(batch, readJson(path.join(BATCHES, f), {}));
}
const translated = { ...store, ...batch };

const pages = new Map();
for (const journal of parsed.journals || []) {
  for (const post of journal.posts || []) {
    const text = String(post.text || '').trim();
    if (!text) continue;
    const page = post.pageNum || 1;
    const id = journal.id + '-p' + page;
    let rec = pages.get(id);
    if (!rec) {
      rec = { id, journal: journal.id, title: journal.title || journal.id, page, posts: 0, fa: 0 };
      pages.set(id, rec);
    }
    rec.posts++;
    if (translated[hashOf(text)]) rec.fa++;
  }
}

const legacyReviewed = new Set(
  fs.existsSync(REVIEW)
    ? fs.readdirSync(REVIEW).filter(n => n.endsWith('.review.json')).map(n => n.replace(/\.review\.json$/, ''))
    : []
);
const legacyFixes = new Map();
if (fs.existsSync(REVIEW)) {
  for (const name of fs.readdirSync(REVIEW).filter(n => n.endsWith('.review.json'))) {
    const id = name.replace(/\.review\.json$/, '');
    const verdicts = readJson(path.join(REVIEW, name), {});
    const fixes = Object.values(verdicts).filter(v => v && v.ok !== true && String(v.fix || '').trim()).length;
    if (fixes) legacyFixes.set(id, fixes);
  }
}
const strict = readJson(STRICT, { rows: [] });
const suspects = new Map();
for (const row of strict.rows || []) {
  suspects.set(row.page, (suspects.get(row.page) || 0) + 1);
}

const ledger = readJson(LEDGER, { campaign: 'full-review', pages: {} });
ledger.pages = ledger.pages || {};

for (const rec of pages.values()) {
  rec.suspects = suspects.get(rec.id) || 0;
  rec.legacy = legacyReviewed.has(rec.id);
  rec.legacyFixes = legacyFixes.get(rec.id) || 0;
  const entry = ledger.pages[rec.id];
  rec.verdict = entry ? entry.verdict || (entry.validated ? 'clean' : 'flagged') : '';
  rec.defects = entry ? Number(entry.defects || 0) : 0;
  rec.note = entry ? entry.note || '' : '';
  rec.done = rec.verdict === 'clean' || rec.verdict === 'fixed';
  rec.open = rec.verdict === 'flagged';
}

/* ---------- journal rollup ---------- */
const journals = new Map();
for (const rec of pages.values()) {
  let j = journals.get(rec.journal);
  if (!j) {
    j = {
      id: rec.journal, title: rec.title,
      pages: 0, posts: 0, translated: 0, legacy: 0, suspects: 0,
      done: 0, open: 0, defects: 0, incomplete: 0, legacyFixes: 0,
    };
    journals.set(rec.journal, j);
  }
  j.pages++;
  j.posts += rec.posts;
  j.translated += rec.fa;
  if (rec.legacy) j.legacy++;
  j.suspects += rec.suspects;
  if (rec.done) j.done++;
  if (rec.open) j.open++;
  j.defects += rec.defects;
  j.legacyFixes += rec.legacyFixes;
  if (rec.fa < rec.posts) j.incomplete++;
}
const list = [...journals.values()];

/* IF first; then journals never reviewed, biggest first; then partial; then done. */
const stageOf = j => (j.done === j.pages ? 2 : j.legacy ? 1 : 0);
const ordered = [
  ...list.filter(j => j.id === 'if'),
  ...list.filter(j => j.id !== 'if').sort((a, b) =>
    stageOf(a) - stageOf(b) || b.posts - a.posts || a.id.localeCompare(b.id)),
];

const total = list.reduce((s, j) => ({
  pages: s.pages + j.pages,
  posts: s.posts + j.posts,
  translated: s.translated + j.translated,
  legacy: s.legacy + j.legacy,
  suspects: s.suspects + j.suspects,
  done: s.done + j.done,
  open: s.open + j.open,
  defects: s.defects + j.defects,
  incomplete: s.incomplete + j.incomplete,
  legacyFixes: s.legacyFixes + j.legacyFixes,
}), { pages: 0, posts: 0, translated: 0, legacy: 0, suspects: 0, done: 0, open: 0, defects: 0, incomplete: 0, legacyFixes: 0 });

const pct = (a, b) => (b ? `${(a / b * 100).toFixed(1)}%` : '0%');
const box = rec => (rec.done ? '[x]' : rec.open ? '[~]' : '[ ]');
const badge = rec => {
  const bits = [];
  bits.push(rec.fa < rec.posts ? `${rec.fa}/${rec.posts} translated` : `${rec.posts} posts`);
  if (rec.suspects) bits.push(`${rec.suspects} suspects`);
  if (rec.legacy) bits.push('pass-1 verdict');
  if (rec.legacyFixes) bits.push(`${rec.legacyFixes} fix pass-1`);
  if (rec.defects) bits.push(`${rec.defects} fixed`);
  if (rec.note) bits.push(rec.note);
  return bits.join(' · ');
};

const md = [];
md.push('# چک‌لیست بازبینی ترجمه — کل آرشیو', '');
md.push(`تولید: ${new Date().toISOString().slice(0, 16).replace('T', ' ')} — منبع: \`parsed.json\`, \`batches/\`, \`review/\`, \`strict-report.json\`, \`reviewed.json\`.`);
md.push('');
md.push('## پیشرفت', '');
md.push(`- پست‌های دارای متن: **${total.posts.toLocaleString('en-US')}** در **${total.pages.toLocaleString('en-US')}** صفحه و **${list.length}** ژورنال/تاپیک`);
md.push(`- ترجمهٔ کامل (فایل دسته + انبار): **${total.translated.toLocaleString('en-US')}** پست — ${pct(total.translated, total.posts)}${total.incomplete ? `؛ ${total.incomplete} صفحه ناقص` : '؛ هیچ صفحه‌ای ناقص نیست'}`);
md.push(`- بازبینی معنایی این کارزار: **${total.done}** صفحه از ${total.pages} (${pct(total.done, total.pages)}) — ${total.done === 0 ? 'هنوز شروع نشده' : 'در جریان'}`);
md.push(`- بازبینی‌شده با نقص باز: **${total.open}** صفحه`);
md.push(`- نقص‌های اعمال‌شده در این کارزار: **${total.defects}**`);
md.push(`- سابقهٔ بازبینی دورهٔ اول (verdict قبلی): **${total.legacy}** صفحه — معیار پیشرفت این کارزار نیست`);
md.push(`- نقص‌های واقعی که دورهٔ اول پیدا و اعمال کرد: **${total.legacyFixes}**`);
md.push(`- پست‌های نشان‌دار اسکن سخت‌گیرانه: **${total.suspects.toLocaleString('en-US')}** (کاندید بازبینی، نه حکم قطعی)`);
md.push('');
md.push('علامت‌ها: `[ ]` بازبینی‌نشده · `[~]` بازبینی‌شده با نقص باز · `[x]` بازبینی‌شده و پاک.');
md.push('شمارهٔ «suspects» از `audit-strict.js` می‌آید: لاتین باقی‌مانده، پرانتز ناهماهنگ، اختلاف پاراگراف، خط غیرلاتین.');
md.push('');
md.push('## نقطهٔ شروع — اولویت ۱ (if)');
md.push('');
md.push('if آخرین ژورنالی است که verdict دورهٔ اول را برای هر ۱۳۹ صفحه دارد، پس این کارزار یک بازبینی دوم و سخت‌گیرانه‌تر است: همان ۷۳۸ پست suspects باید تک‌تک با انگلیسی مقایسه شوند.');
md.push('ترتیب پیشنهادی: صفحه‌های پرحاشیه‌تر اول، بعد بقیه به ترتیب شماره.');
md.push('');
md.push('```bash');
md.push('node _build/expert/audit-strict.js --write --page if-p17   # اسکن همان صفحه');
md.push('node _build/expert/review-dump.js if-p17                   # متن انگلیسی و فارسی کنار هم');
md.push('node _build/expert/review-checklist.js --mark if-p17 --verdict clean');
md.push('```');
md.push('');
md.push('## وضعیت ژورنال‌ها', '');
md.push('| ژورنال | صفحه | پست | ترجمه | بازبینی این کارزار | سابقهٔ دورهٔ اول | نقص دورهٔ اول | suspects | نقص این کارزار |');
md.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|');
for (const j of ordered) {
  md.push(`| ${j.id} | ${j.pages} | ${j.posts} | ${pct(j.translated, j.posts)} | ${j.done}/${j.pages} | ${j.legacy}/${j.pages} | ${j.legacyFixes} | ${j.suspects} | ${j.defects} |`);
}
md.push('');

for (const j of ordered) {
  const head = j.id === 'if' ? '## اولویت ۱ — if — If' : `## ${j.id} — ${j.title}`;
  md.push(head, '');
  md.push(`${j.pages} صفحه / ${j.posts} پست — بازبینی ${j.done}` +
    `${j.open ? ` · نقص باز ${j.open}` : ''} · سابقه ${j.legacy} · suspects ${j.suspects}`);
  md.push('');
  const rows = [...pages.values()].filter(r => r.journal === j.id).sort((a, b) => a.page - b.page);
  if (j.suspects) {
    const hot = rows.filter(r => r.suspects).sort((a, b) => b.suspects - a.suspects).slice(0, 8);
    md.push(`پرحاشیه‌ترین صفحه‌ها: ${hot.map(r => `${r.id} (${r.suspects})`).join(' · ')}`);
    md.push('');
  }
  for (const r of rows) md.push(`- ${box(r)} ${r.id} — ${badge(r)}`);
  md.push('');
}

md.push('## به‌روزرسانی چک‌لیست', '');
md.push('```bash');
md.push('# ثبت بازبینی یک صفحه');
md.push('node _build/expert/review-checklist.js --mark if-p2 --verdict clean');
md.push('node _build/expert/review-checklist.js --mark if-p3 --verdict fixed --defects 3 --note "QM calque"');
md.push('node _build/expert/review-checklist.js --mark if-p4 --verdict flagged --note "residual English in 4 posts"');
md.push('# برگرداندن یک صفحه به حالت بازبینی‌نشده');
md.push('node _build/expert/review-checklist.js --unmark if-p3');
md.push('');
md.push('# پیش از ثبت: اسکن تازه + دروازهٔ ماشینی');
md.push('node _build/expert/audit-strict.js --write');
md.push('node _build/expert/workflow.js --validate --page if-p1');
md.push('```');
md.push('');
md.push('پس از هر موج بازبینی: `apply-review.js` → `bake-translations.js` → `build-site.js` → `qa-translations.js`.');
md.push('');

writeFile(OUT_MD, md.join('\n'));
writeFile(OUT_JSON, JSON.stringify({
  generatedAt: new Date().toISOString(),
  campaign: ledger.campaign,
  total,
  journals: ordered.map(j => ({ ...j, rows: [...pages.values()].filter(r => r.journal === j.id).sort((a, b) => a.page - b.page) })),
}, null, 1));

console.log(JSON.stringify({ campaign: ledger.campaign, total, journals: list.length }, null, 1));
