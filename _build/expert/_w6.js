const fs = require('fs');
const w = JSON.parse(fs.readFileSync('_build/expert/work/if-p6.json', 'utf8'));
let out = '';
for (const p of w) out += '===== ' + p.id + '\n' + p.text + '\n\n';
fs.writeFileSync('_build/expert/_w6.txt', out, 'utf8');
