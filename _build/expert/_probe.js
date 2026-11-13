const fs = require('fs');
const path = require('path');
const BUILD = path.resolve(__dirname, '..');
const policy = require(path.join(BUILD, 'translation-policy.js'));
const lex = require(path.join(BUILD, 'lexicon.js'));
const page = process.argv[2] || 'if-p8';
const work = JSON.parse(fs.readFileSync(path.join(__dirname, 'work', page + '.json'), 'utf8'));
const batch = JSON.parse(fs.readFileSync(path.join(__dirname, 'batches', page + '.json'), 'utf8'));
function expertIssues(fa, en) {
  const clean = policy.cleanMachine(fa, en);
  let issues = lex.audit(clean, en).filter(i => i !== 'untranslated');
  return issues;
}
for (const w of work) {
  const fa = batch[w.hash] || '';
  console.log(w.id, '|', JSON.stringify(expertIssues(fa, w.text)), '|', fa.length, 'chars');
}
