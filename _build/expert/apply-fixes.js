// apply-fixes.js <batchfile> <fixes.json> — merge {hash: persian} into batch file
const fs = require('fs');
const path = require('path');
const dir = __dirname;
const base = path.basename(process.argv[2]);
const fixes = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const fp = path.join(dir, 'batches', base);
const obj = JSON.parse(fs.readFileSync(fp, 'utf8'));
let applied = 0, missing = [];
for (const [h, v] of Object.entries(fixes)) {
  if (h in obj) { obj[h] = v; applied++; } else missing.push(h);
}
fs.writeFileSync(fp, JSON.stringify(obj, null, 1).replace(/\n/g, '\r\n'), 'utf8');
console.log(base + ': applied ' + applied + (missing.length ? ' MISSING ' + missing.join(',') : ''));
