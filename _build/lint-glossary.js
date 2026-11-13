/*
 * Glossary self-consistency audit.
 *
 * MT_FIXES is the post-edit layer that says "this Persian string is wrong, write
 * it this way instead". It only runs over machine output, so a dictionary entry
 * that the post-edit layer itself rejects ships unchanged. When WORDS and
 * PHRASES give different Persian for the same English term, the WORDS form wins
 * on short lines and the wrong one reaches the page.
 *
 * A dictionary value that MT_FIXES rewrites is therefore a bug: either the
 * dictionary is wrong, or the rule is. Print both so they can be compared.
 *
 * Usage: node lint-glossary.js [--json]
 */
const fs = require('fs');
const L = require('./lexicon.js');

const FIXES = L.MT_FIXES;

function rewritten(value) {
  const s = String(value);
  const hits = [];
  for (const [re, rep] of FIXES) {
    // match(), not test(): a /g regex mutates lastIndex and would alternate
    // between true and false across the rows we scan.
    if (!s.match(re)) continue;
    const to = s.replace(re, rep);
    // A rule that matches but rewrites to the same text is only interesting as
    // a note that the table and the rule agree, so it is not reported.
    if (to !== s) hits.push({ pattern: re.source, from: s, to });
  }
  return { hits };
}

const rows = [];
for (const [table, src] of [['WORDS', L.WORDS], ['PHRASES', L.PHRASES]]) {
  for (const [k, v] of Object.entries(src)) {
    // PHRASES is index -> [english, persian]
    const en = Array.isArray(v) ? v[0] : k;
    const fa = Array.isArray(v) ? v[1] : v;
    const r = rewritten(fa);
    if (r.hits.length) rows.push({ table, key: en, fa, fixed: r.hits[0].to, why: r.hits[0].pattern });
  }
}

// Same English term given two different Persian values across the tables.
const byEn = new Map();
for (const [k, v] of Object.entries(L.WORDS)) byEn.set(String(k).toLowerCase(), { src: 'WORDS', fa: v });
for (const [, v] of Object.entries(L.PHRASES)) {
  const en = String(v[0]).toLowerCase();
  if (byEn.has(en) && byEn.get(en).fa !== v[1]) {
    byEn.get(en).conflict = v[1];
  } else if (!byEn.has(en)) byEn.set(en, { src: 'PHRASES', fa: v[1] });
}
const conflicts = [...byEn.entries()]
  .filter(([, r]) => r.conflict)
  .map(([en, r]) => ({ en, words: r.fa, phrases: r.conflict }));

// A dictionary value with no Persian letter is not a translation, it is the
// English word passed off as one.
const FA_LETTER = /[؀-ۿ]/;
const untranslated = [];
for (const [table, src] of [['WORDS', L.WORDS], ['PHRASES', L.PHRASES]]) {
  for (const [k, v] of Object.entries(src)) {
    const en = Array.isArray(v) ? v[0] : k;
    const fa = Array.isArray(v) ? v[1] : v;
    // An intentionally empty value is "say nothing in Persian" (articles,
    // prepositions), which is correct, not untranslated.
    if (String(fa).trim() === '') continue;
    if (!FA_LETTER.test(String(fa))) untranslated.push({ table, en, fa: String(fa) });
  }
}

/*
 * A key written twice inside one object literal is not a conflict the language
 * reports: the last spelling wins and the earlier line becomes dead code that
 * still reads like the dictionary's intent. Scan the source text, not the
 * loaded object, because the loaded object has already forgotten the loser.
 */
function duplicateKeys() {
  const src = require('fs').readFileSync(`${__dirname}/lexicon.js`, 'utf8');
  const start = src.indexOf('const WORDS = {');
  const end = src.indexOf('const CHROME_WORDS', start);
  const body = src.slice(start, end);
  const seen = new Map();
  const re = /(?:'([^']+)'|([A-Za-z_][A-Za-z0-9_]*))\s*:\s*'([^']*)'/g;
  let m;
  while ((m = re.exec(body))) {
    const key = (m[1] || m[2]).toLowerCase();
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key).push(m[3]);
  }
  const out = [];
  for (const [en, all] of seen) if (all.length > 1) out.push({ en, all, win: all[all.length - 1], inert: new Set(all).size === 1 });
  return out;
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rewritten: rows, conflicts, untranslated, duplicates: duplicateKeys() }, null, 1));
} else {
  const dup = duplicateKeys();
  const clash = dup.filter(d => !d.inert);
  console.log(`WORDS keys written twice with different Persian (one of them is dead code): ${clash.length}`);
  for (const d of clash) console.log(`  ${JSON.stringify(d.en).padEnd(16)} ${JSON.stringify(d.all)} -> effective ${JSON.stringify(d.win)}`);
  console.log(`WORDS keys written twice with the same Persian (inert): ${dup.length - clash.length}`);
  console.log(`dictionary values the post-edit layer itself rewrites: ${rows.length}`);
  for (const r of rows) console.log(`  ${r.table.padEnd(7)} ${JSON.stringify(r.key).padEnd(28)} ${r.fa}  ->  ${r.fixed}`);
  console.log(`\ndictionary values with no Persian in them at all: ${untranslated.length}`);
  for (const u of untranslated) console.log(`  ${u.table.padEnd(7)} ${JSON.stringify(u.en).padEnd(28)} => ${JSON.stringify(u.fa)}`);
  console.log(`\nEnglish terms given different Persian in WORDS vs PHRASES: ${conflicts.length}`);
  for (const c of conflicts) console.log(`  ${JSON.stringify(c.en).padEnd(28)} WORDS=${c.words}   PHRASES=${c.phrases}`);
}
