const fs = require('fs');
const lex = require('E:/Trade/journals/_build/lexicon.js');
const policy = require('E:/Trade/journals/_build/translation-policy.js');
const page = process.argv[2];
const work = JSON.parse(fs.readFileSync('E:/Trade/journals/_build/expert/work/if-p' + page + '.json', 'utf8'));
const batch = JSON.parse(fs.readFileSync('E:/Trade/journals/_build/expert/batches/if-p' + page + '.json', 'utf8'));
for (const id of process.argv.slice(3)) {
  const w = work.find(x => x.id === id);
  const fa = batch[w.hash];
  const cleaned = policy.cleanMachine(fa);
  const issues = lex.audit(cleaned, w.text);
  console.log('==', id, issues, 'len', lex.cleanText(cleaned).length);
  const welded = (cleaned.match(/[\u0600-\u06FF][A-Za-z]{3,}|[A-Za-z]{3,}[\u0600-\u06FF]/g) || []);
  console.log('welded:', welded);
  if (issues.includes('echo')) {
    const toks = cleaned.split(/\s+/).filter(t => t.length >= 3 && !/^[\d.,٪%\-+]+$/.test(t));
    const seen = new Map();
    for (let i = 0; i + 1 < toks.length; i++) {
      const k = toks[i] + ' ' + toks[i + 1];
      seen.set(k, (seen.get(k) || 0) + 1);
      if (seen.get(k) === 2) { console.log('echo pair:', k, '|', toks.slice(Math.max(0, i - 4), i + 3).join(' ')); break; }
    }
  }
  console.log('---');
}
