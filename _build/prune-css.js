/* Report (or delete) the rules whose selector mentions a class the app no
 * longer emits. Parses at brace depth so a comma-separated selector list is
 * handled one selector at a time; only deletes when a rule's *every* selector
 * is dead, so a shared block like `.a, .b` survives until both are dead.
 * Usage: node _build/prune-css.js [--apply]
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const FILE = path.join(ROOT, 'site/css/style.css');
const src = fs.readFileSync(FILE, 'utf8');

/* Only the classes the image-text layer (OCR chips, transcripts, the
 * translation column, the numbered markers) used. Everything else the sweep
 * turned up is pre-existing dead CSS and deliberately left alone — deleting it
 * here would be unrelated work. */
const DEAD = ['block-en', 'block-fa', 'block-idx', 'block-list', 'block-meta',
  'is-highlight', 'is-open', 'marker-box', 'markers', 'no-panel',
  'note-low', 'foot-stat', 'panel-actions', 'panel-body', 'panel-empty', 'panel-head',
  'panel-peek', 'panel-sub', 'panel-tools', 'paras-fa',
  'sheet-handle', 'tr-chev', 'tr-count', 'transcript', 'marker', 'cap-mark',
  'transcript-toggle', 'transcript-body', 'panel'];

/* Walk the file by hand: comments, @media blocks and rules, tracking depth. */
const rules = [];
let i = 0, line = 1;
while (i < src.length) {
  if (src.startsWith('/*', i)) {
    const end = src.indexOf('*/', i + 2);
    line += (src.slice(i, end).match(/\n/g) || []).length;
    i = end + 2;
    continue;
  }
  const open = src.indexOf('{', i);
  if (open < 0) break;
  const head = src.slice(i, open);
  if (head.trim().startsWith('@')) {
    // at-rule: skip its whole block by brace matching
    let d = 0, j = open;
    for (; j < src.length; j++) {
      if (src[j] === '{') d++;
      else if (src[j] === '}') { d--; if (!d) break; }
    }
    line += (src.slice(i, j + 1).match(/\n/g) || []).length;
    i = j + 1;
    continue;
  }
  let d = 0, j = open;
  for (; j < src.length; j++) {
    if (src[j] === '{') d++;
    else if (src[j] === '}') { d--; if (!d) break; }
  }
  rules.push({ selector: head.trim(), start: i, end: j + 1 });
  line += (src.slice(i, j + 1).match(/\n/g) || []).length;
  i = j + 1;
}

const isDead = (sel) => DEAD.some(c => new RegExp('\\.' + c + '(?![\\w-])').test(sel));
const hits = rules.filter(r => r.selector.split(',').every(isDead));

let removed = 0;
const out = [];
let cursor = 0;
for (const r of hits) {
  removed++;
  console.log('rule ' + r.selector.replace(/\s+/g, ' ').slice(0, 90) + '  {' + src.slice(r.start, r.end).split('\n').length + ' lines}');
  if (process.argv.includes('--apply')) {
    out.push(src.slice(cursor, r.start));
    cursor = r.end;
    // swallow the blank line the rule leaves behind
    while (src.slice(cursor, cursor + 1) === '\n') cursor++;
  }
}
if (process.argv.includes('--apply')) {
  out.push(src.slice(cursor));
  fs.writeFileSync(FILE, out.join(''));
  console.log('\nAPPLIED: ' + removed + ' rules removed; ' + src.length + ' -> ' + out.join('').length + ' chars');
} else {
  console.log('\n' + removed + ' candidate rules (dry run)');
}
