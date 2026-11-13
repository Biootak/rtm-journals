/*
 * Exemptions that apply to hand translations only.
 *
 * The machine audit is strict because machine output is cheap to regenerate.
 * A hand translation may legitimately keep a source handle, an acronym with a
 * Persian plural suffix or punctuation, or repeat a line the English itself
 * repeats. Without these exemptions the bake drops every such post (tickers
 * like "UJ" and names like "Rinehart" count as leftover English) and the QA
 * report flags them as defects.
 *
 * The rules are the ones `_build/expert/workflow.js` applies before it accepts
 * a batch, so validate, bake and QA cannot disagree about the same post.
 */
const lex = require('./lexicon.js');

/* The English source repeats a phrase when the author describes two similar
   trades or repeats "frustrated". Bigrams with short tokens ("closed EU") are
   still real repetition, so this check admits two-letter words that the
   generic Persian matcher skips. */
function sourceRepeats(en) {
  const toks = String(en || '').toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ').split(/\s+/)
    .filter(t => t.length >= 2 && !/^\d+$/.test(t));
  const seen = new Set();
  for (let i = 0; i + 1 < toks.length; i++) {
    const key = toks[i] + ' ' + toks[i + 1];
    if (seen.has(key)) return key;
    seen.add(key);
  }
  return '';
}

function relaxExpert(issues, fa, en) {
  let out = issues;
  if (out.includes('latin-junk')) {
    const welds = String(fa).match(/[\u0600-\u06FF][A-Za-z]{3,}|[A-Za-z]{3,}[\u0600-\u06FF]/g) || [];
    // "FLها", "PAZهای", "RTM،": an acronym next to Persian is deliberate.
    const deliberate = welds.length > 0 && welds.every(s =>
      /^[A-Z][A-Z0-9]{1,6}[\u0600-\u06FF]$/.test(s)
      || /^[\u0600-\u06FF][A-Z][A-Z0-9]{1,6}$/.test(s)
      // "TheLastNail،": a Latin handle closed by Persian punctuation.
      || /^[A-Za-z][A-Za-z0-9_.\-]*[،؛:؟]$/.test(s));
    if (deliberate) out = out.filter(i => i !== 'latin-junk');
  }
  if (out.includes('english-left')) {
    // Member handles, names and URL pieces come from the source.
    const src = new Set((String(en).match(/[A-Za-z]{3,}/g) || []).map(w => w.toLowerCase()));
    const left = (String(fa).match(/\b[A-Za-z]{3,}\b/g) || []).filter(w => !src.has(w.toLowerCase()));
    if (!left.length) out = out.filter(i => i !== 'english-left');
  }
  // A punctuation-only source (".." or "?!") or a bare signature has nothing
  // to translate, so a Latin-only body is correct.
  if (out.includes('no-persian') && (!/[A-Za-z\u0600-\u06FF]/.test(String(en || '')) || !lex.hasProse(en))) {
    out = out.filter(i => i !== 'no-persian');
  }
  // Quote-heavy replies repeat the quoted lines on purpose.
  if (out.includes('echo') && (lex.repeatedPhrase(String(en || '')) || sourceRepeats(en))) {
    out = out.filter(i => i !== 'echo');
  }
  return out;
}

module.exports = { relaxExpert };
