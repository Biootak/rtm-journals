#!/usr/bin/env node
/*
 * Source-text defect census over _build/parsed.json.
 *
 * The prints are PDF/DOM captures, so the English layer can carry:
 *   ligature-loss   fi/fl/ffi glyph dropped  ("pro t", "engulng", "signicant")
 *   mojibake        UTF-8 decoded twice      ("â€™", "Ã©")
 *   chrome          site furniture inside a post body
 *   card-leak       author-card fields inside a post body
 *   shadow-dup      the same printed line repeated (white text layer)
 *   truncation      body stops on a dangling function word / mid-word
 *   bbcode          broken quote/attachment markup
 *
 * Read-only: prints a summary, writes _build/expert/source-defects.json.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const parsed = JSON.parse(fs.readFileSync(path.join(ROOT, '_build/parsed.json'), 'utf8'));

const LIGATURES = [
  'pro t', 'pro ts', 'engulng', 'engul ng', 'bene t', 'bene ts', 'con rm', 'con rmed',
  'con rms', 'con rming', 'con rmation', 'signi cant', 'signi cantly', 'speci c',
  'speci cally', 'de ne', 'de ned', 'de nes', 'de ning', 'de nition', 'dif cult',
  'dif culty', ' rst', ' rstly', ' nally', ' nal', ' nance', ' nancial', ' gure',
  ' gures', 'classi cation', 'identi cation', 'veri cation', 'justi cation',
  'noti cation', 'modi cation', 'certi cate', 'ef cient', 'ef ciency', 'suf cient',
  'brie y', 're ection', 'in ation', 'paci c', 'arti cial', 'super cial',
  'ampli ed', 'simpli ed', 'multi plied', 'satis ed', 'quali ed', 're ned',
  'de nitely', 'confi dence', 'con dence', 'pro table', 'pro tability', 'offi ce',
  'fl ow', 'fl oor', 'fl at', 'in uence', ' uff', ' re', ' rm', ' ght', ' ll',
];
const ligRe = new RegExp('\\b(?:' + LIGATURES.map(w => w.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+')).join('|') + ')\\b', 'gi');

const MOJIBAKE = /â€™|â€œ|â€\x9d|â€“|â€”|Â|Ã©|Ã¨|Ã |Ã¶|Ã¼|Ã§/;
const CHROME = /^(?:Privacy Policy|Terms of Use|DISCLAIMER|Powered by|Quick Reply|Reply With Quote|Top of Page|Page \d+ of \d+|RTM Community|Forum|Members|What's New|Search|Log in|Register|Remember Me|Mark Forums Read|Thread Tools|Display Modes|Rate This Thread)\b/i;
const CARD = /^(?:Posts|Thank you received|Join Date|Location|Presence|Reputation|Blog Entries|Articles|Total Downloaded|Thanks|Mentioned|Tagged)\s*:/i;
const BBCODE = /\[(?:\/?(?:quote|url|img|attach|b|i|u|color|size|font|center|left|right|spoiler|code|list|indent|php|html|media))[^\]]*\]?/gi;

const rows = [];
const byKind = {};
let posts = 0, threads = 0, withText = 0;
const examples = {};

function add(kind, rec, detail) {
  byKind[kind] = (byKind[kind] || 0) + 1;
  rows.push({ kind, id: rec.id, thread: rec.thread, detail });
  if (!examples[kind]) examples[kind] = [];
  if (examples[kind].length < 12) examples[kind].push({ id: rec.id, detail });
}

for (const journal of parsed.journals || []) {
  threads++;
  for (const post of journal.posts || []) {
    posts++;
    const text = String(post.text || '');
    if (!text.trim()) continue;
    withText++;
    const rec = { id: post.id, thread: journal.id || journal.title || '' };
    const paras = text.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);

    const lig = text.match(ligRe);
    if (lig) add('ligature-loss', rec, [...new Set(lig.map(s => s.toLowerCase()))].slice(0, 6).join(', '));
    if (MOJIBAKE.test(text)) add('mojibake', rec, (text.match(MOJIBAKE) || [''])[0]);
    for (const p of paras) {
      if (CHROME.test(p)) { add('chrome', rec, p.slice(0, 70)); break; }
      if (CARD.test(p)) { add('card-leak', rec, p.slice(0, 70)); break; }
    }
    // Same non-trivial line twice inside one body.
    const seen = new Set();
    let dup = false;
    for (const p of paras) {
      const k = p.replace(/\s+/g, ' ').trim();
      if (k.length > 35 && seen.has(k)) { dup = true; break; }
      seen.add(k);
    }
    if (dup) add('shadow-dup', rec, '');
    // A body that stops on a dangling connector or mid-word.
    const trimmed = text.trim();
    const tail = trimmed.slice(-40);
    if (trimmed.length > 120 && /(?:^|\s)(?:the|and|to|of|in|is|was|that|with|for|but|or|a|an|on|at|by|as|so|be|are|were|it|this|from|if|then|when|which|you|i|we|they|he|she|my|your|their)\s*$/i.test(tail)) {
      add('truncation', rec, JSON.stringify(tail.slice(-28)));
    } else if (trimmed.length > 120 && /[A-Za-z]{2,}\s*$/.test(tail) && !/[.!?…:)\]"'\u201d»]$/.test(trimmed)) {
      const last = trimmed.split(/\s+/).pop();
      // mid-word cut: last token with no vowel is suspicious but keep it rare
      if (/^[a-z]+$/.test(last) && last.length <= 3 && !/^(?:ok|hi|thx|ty|lol|lmao|yes|no|so|us|up|it|at|to|me|my|be|we|he|do|go|if|in|on|of|or|an|as|is|am)$/i.test(last)) add('truncation', rec, JSON.stringify(last));
    }
    const bb = text.match(BBCODE);
    if (bb && /\[\/?(?:quote|url|img|attach)/i.test(text) && /\[\/?(?:quote|url|img|attach)[^\]]*$/im.test(text)) add('bbcode', rec, bb.slice(-3).join(' '));
  }
}

const summary = Object.fromEntries(Object.entries(byKind).sort((a, b) => b[1] - a[1]));
console.log(`threads ${threads} | posts ${posts} | with text ${withText}`);
for (const [k, v] of Object.entries(summary)) console.log(`  ${k}: ${v}`);
for (const [k, ex] of Object.entries(examples)) {
  console.log(`\n## ${k}`);
  for (const e of ex) console.log(`  - ${e.id}: ${e.detail}`);
}
fs.writeFileSync(path.join(ROOT, '_build/expert/source-defects.json'), JSON.stringify({ summary, examples, rows }, null, 1));
console.log('\nreport: _build/expert/source-defects.json');
