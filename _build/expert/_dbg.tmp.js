const fs = require('fs');
const lex = require('E:/Trade/journals/_build/lexicon.js');
const policy = require('E:/Trade/journals/_build/translation-policy.js');
const work = JSON.parse(fs.readFileSync('E:/Trade/journals/_build/expert/work/if-p76.json', 'utf8'));
const batch = JSON.parse(fs.readFileSync('E:/Trade/journals/_build/expert/batches/if-p76.json', 'utf8'));
for (const id of process.argv.slice(2)) {
  const w = work.find(x => x.id === id);
  const fa = batch[w.hash];
  const cleaned = policy.cleanMachine(fa);
  const issues = lex.audit(cleaned, w.text);
  console.log('==', id, issues, 'len', cleaned.length);
  console.log(cleaned.slice(0, 600));
  const left = (cleaned.match(/[A-Za-z]{3,}/g) || []).filter(x => !/^[A-Z]{2,}$/.test(x) && !lex.isSymbolToken(x));
  console.log('latin words:', left);
}
