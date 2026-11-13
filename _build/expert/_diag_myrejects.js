const fs = require('fs');
const path = require('path');
const lex = require(path.resolve(__dirname, '..', 'lexicon.js'));
const policy = require(path.resolve(__dirname, '..', 'translation-policy.js'));
const WORK = path.resolve(__dirname, 'work');
const BATCHES = path.resolve(__dirname, 'batches');
const listFile = process.argv[2];
const lines = fs.readFileSync(listFile, 'utf8').split('\n').filter(Boolean);
const byPage = new Map();
for (const l of lines) {
  const id = l.split('|')[0].trim();
  const base = id.replace(/_(p\d+)_\d+$/, '-$1');
  if (!byPage.has(base)) byPage.set(base, []);
  byPage.get(base).push(id);
}
for (const [base, ids] of byPage) {
  const work = JSON.parse(fs.readFileSync(path.join(WORK, base + '.json'), 'utf8'));
  const batch = JSON.parse(fs.readFileSync(path.join(BATCHES, base + '.json'), 'utf8'));
  for (const id of ids) {
    const w = work.find(x => x.id === id);
    const fa = batch[w.hash];
    const issueLine = lines.find(x => x.trim().startsWith(id + ' ')) || '';
    console.log('### ' + id + ' hash=' + w.hash + ' | ' + issueLine.split('|').slice(1).join('|').trim());
    const enParas = String(w.text).split(/\n{2,}/).filter(x => x.trim()).length;
    const faParas = String(fa).split(/\n{2,}/).filter(x => x.trim()).length;
    const cm = policy.cleanMachine(fa, w.text);
    const clean = lex.cleanText(cm);
    console.log('paras en/fa: ' + enParas + '/' + faParas + ' | echo bigram: "' + lex.repeatedPhrase(clean) + '"');
    const issues = lex.audit(cm, w.text).filter(i => i !== 'untranslated');
    console.log('lex.audit: ' + issues.join(','));
    console.log('---FA---');
    console.log(fa);
    console.log('---EN---');
    console.log(w.text);
  }
}
