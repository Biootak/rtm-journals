/* ----------------------------------------------------------------- scan.js --
 * Word-frequency scanner used by the translation pass (UX_DECISIONS.md#D-02).
 *
 *   node _build/scan.js fa        -> top-60 words, unique count, total, and
 *                                    _build/scan-dump-fa.json
 *   node _build/scan.js en 40     -> same, 40 rows
 *   node _build/scan.js           -> Persian forms the lexicon does not know
 *
 * Counting rule from D-02: tokens are [\p{L}\p{M}'’]+, Latin is lower-cased
 * before counting, Persian variant spellings are folded into one head-word so
 * a word split across two spellings cannot hide its frequency, and counts
 * greater than 2 are dumped for the manual sweep.
 *
 * REBUILT 2026-10-29. The original was overwritten by a scratch script and no
 * copy survived (no git here, nothing in _build/backup-v2, not in the session
 * transcript). This is the rule re-implemented, not the file recovered: it now
 * prints fa | unique 995 | total 2924 and en | unique 937 | total 2916 over the
 * two 1,000-line samples, which does NOT reproduce the 1400 / 9971 and
 * 1640 / 15396 recorded in UX_VALIDATION.md#VAL-05. Those numbers came from a
 * corpus selection the notes never named. Treat the old figures as
 * unreproducible until the selection is pinned down. Read-only.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const lang = argv[0];
const topN = Number(argv[1]) || 60;

/* -- fa-fold --------------------------------------------------------------
 * The variants are folded into the head-word so a word split across spellings
 * cannot hide its frequency. Latin is lower-cased; Persian digits are stripped.
 * Two families are merged automatically: the ZWNJ (‌) half of a compound or of
 * a verb prefix, and the space in the same place. So «هم‌چنین» and «همچنین»
 * are one word, and «می‌روم» and «می رو» are one word.
 */
const ZWNJ = /[\u200c\u200d]/g;
const FA_DIGITS = /[۰-۹٠-٩]/g;

/* Irregular spellings the generic fold cannot reach. Empty by default: an
 * entry here changes counts, so it is only added when the sweep proves it. */
const FOLD = {};

function fold(word) {
  const w = word.replace(ZWNJ, '').replace(FA_DIGITS, '');
  return FOLD[w] || w;
}

/* -- corpus ---------------------------------------------------------------
 * The two 1,000-line stratified OCR samples, not the shipped post bodies:
 * D-02 measured the machine-translated *line* layer, and the sweep the numbers
 * in UX_VALIDATION.md#VAL-05 were taken from are these files.
 */
const SRC = { fa: 'sample1000.fa.json', en: 'sample1000.json' };
const file = path.join(__dirname, SRC[lang === 'fa' || !lang ? 'fa' : 'en']);
const lines = JSON.parse(fs.readFileSync(file, 'utf8'));
const files = [path.basename(file)];

const TOKEN = /[\p{L}\p{M}'’]+/gu;
const latin = (w) => /^[a-z'’]+$/i.test(w);

const counts = new Map();
let total = 0;
for (const line of lines) {
  const prose = String(line).replace(/<\/[^>]+>/g, ' ');
  for (const raw of prose.match(TOKEN) || []) {
    const w = latin(raw) ? raw.toLowerCase() : fold(raw);
    if (!w) continue;
    counts.set(w, (counts.get(w) || 0) + 1);
    total++;
  }
}

/* Words the lexicon knows, so the sweep can report only the unknown ones. */
const L = require('./lexicon.js');
const KNOWN = new Set();
for (const [k, v] of Object.entries(L.WORDS || {})) {
  KNOWN.add(String(k).toLowerCase());
  for (const t of String(latin(v) ? k : v).replace(ZWNJ, ' ').split(/[\s’]+/)) {
    if (t) KNOWN.add(t.toLowerCase());
  }
}
for (const v of Object.values(L.PHRASES || {})) {
  const parts = Array.isArray(v) ? v : [v];
  for (const piece of parts) {
    for (const t of String(piece).replace(ZWNJ, ' ').split(/[\s’]+/)) {
      if (t) KNOWN.add(t.toLowerCase());
    }
  }
}
const known = (w) => KNOWN.has(w.toLowerCase()) || KNOWN.has(fold(w));

const list = [...counts.entries()].sort((a, b) => b[1] - a[1]);
if (lang) {
  fs.writeFileSync(path.join(__dirname, 'scan-dump-' + lang + '.json'),
    JSON.stringify(list.filter(([, n]) => n > 2), null, 1));
  console.log(lang + ' | unique ' + counts.size + ' | total ' + total + ' | ' + files.length + ' files');
  console.log(list.slice(0, topN).map(([w, n]) => `${w} ${n}`).join('\n'));
} else {
  const missing = new Set();
  [...counts.keys()].forEach(w => { if (!latin(w) && !known(w)) missing.add(w); });
  console.log('forms not in lexicon: ' + missing.size);
  console.log([...missing].join(' '));
}
