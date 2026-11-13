// usage: node _blocks.tmp.js 76 3   → prints post 3 of page 76 with numbered blocks
const fs = require('fs');
const p = process.argv[2];
const only = process.argv[3];
const rows = JSON.parse(fs.readFileSync('E:/Trade/journals/_build/expert/work/if-p' + p + '.json', 'utf8'));
rows.forEach((r, i) => {
  if (only !== undefined && String(i) !== String(only)) return;
  const blocks = r.text.split(/\n{2,}/).filter(x => x.trim());
  console.log('#### post ' + i + ' ' + r.author + ' (' + blocks.length + ')');
  blocks.forEach((b, j) => {
    console.log('[' + j + '] ' + b.replace(/\n/g, ' ⏎ '));
  });
});
