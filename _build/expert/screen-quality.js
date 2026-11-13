/*
 * Screen the hand-translated layer for machine-style output.
 *
 *   node _build/expert/screen-quality.js
 *
 * Prints per-journal counts and writes _build/expert/screen.json:
 *   [{ id, journal, page, flags: [...], ratio, sample }]
 *
 * Only high-signal checks live here. Loose ones (any repeated bigram, any
 * formal phrase) produced mostly false alarms on real forum prose, so they are
 * kept narrow: the goal is a short list worth reading, not a big one.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.env.JOURNALS_ROOT || path.resolve(__dirname, '..', '..');
const WORK = path.join(ROOT, '_build/expert/work');
const BATCHES = path.join(ROOT, '_build/expert/batches');
const STORE = path.join(ROOT, '_build/expert/posts.json');
const OUT = path.join(ROOT, '_build/expert/screen.json');

const FA = /[\u0600-\u06FF]/;

// Register the offline model falls into; a forum post almost never does.
const MT_TELLS = [
  'می باشد', 'می‌باشد', 'شما می توانید', 'شما می‌توانید', 'در این مقاله',
  'لطفا توجه', 'لطفاً توجه', 'به عنوان یک', 'قابل توجه است', 'به صورت زیر',
];

const hasWord = (set, token) => {
  const t = token.toLowerCase();
  return set.has(t) || set.has(t + 's') || set.has(t.replace(/s$/, ''));
};

const store = fs.existsSync(STORE) ? JSON.parse(fs.readFileSync(STORE, 'utf8')) : {};
const rows = [];
const perJournal = {};

for (const name of fs.readdirSync(BATCHES).filter(n => n.endsWith('.json'))) {
  const base = name.replace(/\.json$/, '');
  const work = JSON.parse(fs.readFileSync(path.join(WORK, base + '.json'), 'utf8'));
  const batch = JSON.parse(fs.readFileSync(path.join(BATCHES, name), 'utf8'));
  const journal = base.replace(/-p\d+$/, '');
  const page = Number((base.match(/-p(\d+)$/) || [])[1] || 0);
  perJournal[journal] = perJournal[journal] || { posts: 0, flagged: 0 };
  for (const w of work) {
    const fa = String(batch[w.hash] || store[w.hash] || '').trim();
    if (!fa) continue;
    perJournal[journal].posts++;
    const en = w.text;
    const flags = [];
    if (!FA.test(fa)) flags.push('no-persian');
    if (fa === en.trim()) flags.push('copied');
    const enLen = Math.max(1, en.replace(/\s+/g, ' ').length);
    const faLen = fa.replace(/\s+/g, ' ').length;
    const ratio = faLen / enLen;
    if (enLen > 200 && ratio < 0.5) flags.push('omitted');
    if (ratio > 2.4) flags.push('expanded');
    // A Latin run of 6+ words inside the Persian that the source never had.
    const src = new Set((en.match(/[A-Za-z]{3,}/g) || []).map(x => x.toLowerCase()));
    const latinRuns = fa.match(/(?:[A-Za-z]{2,}[ '.,/&()-]+){5,}[A-Za-z]{2,}/g) || [];
    const extraRun = latinRuns.find(run => {
      const words = run.match(/[A-Za-z]{3,}/g) || [];
      return words.length >= 5 && words.filter(x => !hasWord(src, x)).length >= words.length / 2;
    });
    if (extraRun) flags.push('english-run');
    const latin = (fa.match(/\b[A-Za-z]{3,}\b/g) || []).filter(x => !hasWord(src, x));
    if (latin.length >= 3) flags.push('latin:' + [...new Set(latin)].slice(0, 4).join('/'));
    for (const tell of MT_TELLS) if (fa.includes(tell)) { flags.push('mt:' + tell); break; }
    // Same content word three times in a very short post: the model loops.
    if (fa.length < 240) {
      const words = fa.split(/\s+/).filter(x => x.length > 3);
      const seen = new Map();
      for (const word of words) seen.set(word, (seen.get(word) || 0) + 1);
      const spam = [...seen].filter(([, c]) => c >= 3).map(([b]) => b);
      if (spam.length) flags.push('loop:' + spam.slice(0, 2).join('|'));
    }
    if (!flags.length) continue;
    perJournal[journal].flagged++;
    rows.push({ id: w.id, journal, page, flags, ratio: Number(ratio.toFixed(2)), sample: fa.slice(0, 110) });
  }
}

fs.writeFileSync(OUT, JSON.stringify(rows, null, 1), 'utf8');
const entries = Object.entries(perJournal).sort((a, b) => b[1].flagged - a[1].flagged);
let tp = 0; let tf = 0;
for (const [, s] of entries) { tp += s.posts; tf += s.flagged; }
console.log('expert posts', tp, '| flagged', tf);
for (const [j, s] of entries) if (s.flagged) console.log('  ' + j.padEnd(14), s.posts + ' posts,', s.flagged + ' flagged');
const kinds = {};
for (const r of rows) for (const f of r.flags) kinds[f.split(':')[0]] = (kinds[f.split(':')[0]] || 0) + 1;
console.log('by kind', kinds);
console.log('wrote', path.relative(ROOT, OUT));
