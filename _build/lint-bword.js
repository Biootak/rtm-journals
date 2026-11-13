/* Find regexes where \b sits next to a Persian letter: \b never matches there. */
const fs = require('fs');
const path = require('path');

const FA = /[\u0600-\u06FF\u0750-\u077F\uFB8E]/;
const BSLASH_B = String.fromCharCode(92) + 'b';

function lines(file) {
  return fs.readFileSync(file, 'utf8').split('\n');
}

function scan(dir, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) scan(p, acc);
    else if (entry.name.endsWith('.js')) {
      lines(p).forEach((line, i) => {
        let idx = -1;
        while ((idx = line.indexOf(BSLASH_B, idx + 1)) !== -1) {
          const after = line[idx + BSLASH_B.length];
          const before = line[idx - 1];
          if (after && FA.test(after)) acc.push([p, i + 1, 'after', line.trim()]);
          else if (before && FA.test(before)) acc.push([p, i + 1, 'before', line.trim()]);
        }
      });
    }
  }
}

const acc = [];
scan(process.argv[2] || '.', acc);
for (const [p, ln, where, text] of acc) {
  console.log(`${p}:${ln} [\\b ${where}] ${text.slice(0, 110)}`);
}
console.log('hits:', acc.length);
