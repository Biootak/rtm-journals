// Repair supplydemand-p44.json: strip stray text between '{' and first '"'
const fs = require('fs');
const fp = __dirname + '/batches/supplydemand-p44.json';
let s = fs.readFileSync(fp, 'utf8');
const i = s.indexOf('"');
s = '{' + s.slice(i);
const obj = JSON.parse(s);
fs.writeFileSync(fp, JSON.stringify(obj, null, 1).replace(/\n/g, '\r\n'), 'utf8');
console.log('repaired, keys:', Object.keys(obj).length);
