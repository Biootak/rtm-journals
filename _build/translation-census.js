#!/usr/bin/env node
/*
 * translation-census.js — the honest answer to "are all the texts translated?"
 *
 * There is no provenance field anywhere in the data: every `fa` string was
 * produced by the same machine pipeline, so "translated" today can only mean
 * "the pipeline emitted Persian for it". Whether that Persian is *right* is a
 * different question, and this script measures the signals that can be
 * measured without a human: presence, script, length ratio, paragraph coverage
 * and passthrough. Anything a reader would call nonsense has to be found by
 * reading; this file tells us where to look first and how much of the corpus
 * that is. RD-41 / task #29.
 *
 * Read-only. Emits _build/translation-census.json.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'site', 'data');
const OUT = path.join(ROOT, '_build', 'translation-census.json');

const FA = /[\u0600-\u06FF]/;
const FA_COUNT = /[\u0600-\u06FF]/g;

function persianChars(s) { return (s.match(FA_COUNT) || []).length; }
function compact(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }

/* A translation that is 30% of the source length is either a lucky compression
 * or a dropped passage; at 12% it is almost always a truncation. Both bands are
 * reported rather than one, so the shape of the distribution is visible. */
const THIN = 0.30;
const VERY_THIN = 0.12;

const journalFiles = fs.readdirSync(path.join(DATA_DIR, 'journals')).filter(f => f.endsWith('.js'));

const overall = {
  journals: 0, posts: 0,
  withFa: 0, emptyFa: 0,
  passthrough: 0,      // no Persian codepoint at all
  identical: 0,        // Persian field equals the English body
  thin: 0, veryThin: 0,
  withPairs: 0, faithfulPairs: 0, unfaithfulPairs: 0, pairGaps: 0,
  latinHeavy: 0,       // Persian present but >60% of the characters are Latin
  enChars: 0, faChars: 0,
};
const perJournal = {};
const suspects = [];    // worst offenders, for the hand-translation queue

for (const file of journalFiles) {
  const src = fs.readFileSync(path.join(DATA_DIR, 'journals', file), 'utf8');
  const win = {};
  const cache = new Function('window', src + '\nreturn window.RTM_JOURNAL_CACHE;')(win);
  for (const jid of Object.keys(cache)) {
    const J = cache[jid];
    const j = perJournal[jid] = {
      name: J.name, posts: 0, withFa: 0, emptyFa: 0, passthrough: 0, identical: 0,
      thin: 0, veryThin: 0, withPairs: 0, faithfulPairs: 0, unfaithfulPairs: 0, pairGaps: 0,
      latinHeavy: 0, enChars: 0, faChars: 0,
    };
    overall.journals++;
    for (const p of J.posts || []) {
      j.posts++; overall.posts++;
      const en = compact(p.t);
      const fa = compact(p.fa);
      j.enChars += en.length; overall.enChars += en.length;
      j.faChars += fa.length; overall.faChars += fa.length;

      if (!fa) {
        j.emptyFa++; overall.emptyFa++;
        if (en) suspects.push({ jid, id: p.id, page: p.p, why: 'empty-fa', en: en.length, fa: 0 });
        continue;
      }
      j.withFa++; overall.withFa++;

      if (!FA.test(fa)) {
        j.passthrough++; overall.passthrough++;
        suspects.push({ jid, id: p.id, page: p.p, why: 'no-persian', en: en.length, fa: fa.length });
        continue;
      }
      if (fa === en) {
        j.identical++; overall.identical++;
        suspects.push({ jid, id: p.id, page: p.p, why: 'identical', en: en.length, fa: fa.length });
        continue;
      }
      const ratio = en ? fa.length / en.length : 1;
      if (ratio < THIN) { j.thin++; overall.thin++; }
      if (ratio < VERY_THIN) {
        j.veryThin++; overall.veryThin++;
        suspects.push({ jid, id: p.id, page: p.p, why: 'very-thin', en: en.length, fa: fa.length, ratio: +ratio.toFixed(2) });
      }
      const latin = fa.length - persianChars(fa);
      if (fa.length > 40 && latin / fa.length > 0.6) { j.latinHeavy++; overall.latinHeavy++; }

      const pairs = Array.isArray(p.pa) ? p.pa : [];
      if (pairs.length) {
        j.withPairs++; overall.withPairs++;
        /* The first version of this script counted English paragraphs by
         * splitting the body on blank lines and compared that to pairs.length.
         * That produced 536 "partial pair" findings — all of them an artifact
         * of the splitter, because these posts wrap at a fixed column rather
         * than by blank line. What actually matters, and what is measured here
         * instead, is whether the pair list reconstructs the body verbatim: if
         * it does, no English text was dropped on the way through the
         * translation pipeline. Verified on astrokillah first: 310/310 exact. */
        const fromPairs = pairs.map(x => Array.isArray(x) ? x[0] : x).map(compact).join(' ');
        const faithful = fromPairs === en;
        if (faithful) { j.faithfulPairs++; overall.faithfulPairs++; }
        else {
          j.unfaithfulPairs++; overall.unfaithfulPairs++;
          suspects.push({ jid, id: p.id, page: p.p, why: 'pairs-do-not-rebuild-body',
            en: en.length, pairs: fromPairs.length, delta: fromPairs.length - en.length });
        }
        /* How many of those pairs carry Persian on the far side. */
        const withFa = pairs.filter(x => Array.isArray(x) && FA.test(String(x[1] || ''))).length;
        if (withFa < pairs.length) {
          j.pairGaps++; overall.pairGaps++;
          suspects.push({ jid, id: p.id, page: p.p, why: 'pair-without-persian',
            en: pairs.length, fa: withFa, delta: pairs.length - withFa });
        }
      }
    }
  }
}

for (const [jid, j] of Object.entries(perJournal)) {
  j.faCoverage = +(j.withFa / j.posts * 100).toFixed(1);
  j.charsPerPost = Math.round(j.faChars / Math.max(1, j.withFa));
  j.pairFaith = j.withPairs ? +(j.faithfulPairs / j.withPairs * 100).toFixed(1) : 0;
}

const summary = {
  generatedAt: new Date().toISOString(),
  journalFiles: journalFiles.length,
  posts: overall.posts,
  withPersian: overall.withFa,
  persianCoveragePct: +(overall.withFa / overall.posts * 100).toFixed(1),
  emptyPersian: overall.emptyFa,
  noPersianAtAll: overall.passthrough,
  identicalToEnglish: overall.identical,
  thinUnder30pct: overall.thin,
  veryThinUnder12pct: overall.veryThin,
  latinHeavy: overall.latinHeavy,
  postsWithPairs: overall.withPairs,
  pairsRebuildBodyExactly: overall.faithfulPairs,
  pairsDropOrAddText: overall.unfaithfulPairs,
  postsWithAPairMissingPersian: overall.pairGaps,
  englishChars: overall.enChars,
  persianChars: overall.faChars,
  /* Every Persian character in the archive was emitted by the machine
   * pipeline; there is no field in the data that could mean otherwise. */
  handReviewedPosts: 0,
  suspectCount: suspects.length,
};

suspects.sort((a, b) => (b.en || 0) - (a.en || 0));
fs.writeFileSync(OUT, JSON.stringify({ summary, perJournal, suspects: suspects.slice(0, 4000) }, null, 1));

const pad = (s, n) => String(s) + ' '.repeat(Math.max(0, n - String(s).length));
console.log('translation census — ' + summary.journalFiles + ' journals, ' + summary.posts + ' posts');
console.log('  posts with Persian text   ' + summary.withPersian + '  (' + summary.persianCoveragePct + '%)');
console.log('  Persian field empty       ' + summary.emptyPersian);
console.log('  no Persian codepoint      ' + summary.noPersianAtAll);
console.log('  identical to English      ' + summary.identicalToEnglish);
console.log('  under 30% of source len   ' + summary.thinUnder30pct);
console.log('  under 12% of source len   ' + summary.veryThinUnder12pct);
console.log('  Persian but >60% Latin    ' + summary.latinHeavy);
console.log('  posts with para pairs     ' + summary.postsWithPairs);
console.log('  pairs rebuild body exactly ' + summary.pairsRebuildBodyExactly + '  drop/add text: ' + summary.pairsDropOrAddText);
console.log('  pairs missing Persian side ' + summary.postsWithAPairMissingPersian);
console.log('  hand-reviewed posts       ' + summary.handReviewedPosts + '   <-- the number that matters for "translated properly"');
console.log('  characters  en ' + summary.englishChars + '   fa ' + summary.persianChars);
console.log('  flagged suspects          ' + summary.suspectCount);
console.log('');
console.log('per journal (posts / fa% / noFa / thin / pairFaith%):');
for (const [jid, j] of Object.entries(perJournal).sort((a, b) => a[1].faCoverage - b[1].faCoverage)) {
  console.log('  ' + pad(jid, 14) + pad(j.posts, 7) + pad(j.faCoverage + '%', 8) +
    pad(j.emptyFa, 8) + pad(j.thin, 7) + pad(j.pairFaith + '%', 8) + '  ~' + j.charsPerPost + ' ch/post');
}
console.log('\nwrote ' + path.relative(ROOT, OUT));
