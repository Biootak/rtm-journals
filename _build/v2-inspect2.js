const fs = require('fs');
function load(p) {
  const raw = fs.readFileSync(p, 'utf8');
  const i = raw.indexOf('={');
  const j = raw.lastIndexOf('}');
  return JSON.parse(raw.slice(i + 1, j + 1));
}
const d = load('site/data/journals/salivan.js');
const p = d.posts[1];
const o = {};
for (const k of Object.keys(p)) o[k] = k === 't' ? p[k].slice(0, 120) : p[k];
console.log(JSON.stringify(o, null, 1));
const withFa = d.posts.find(x => x.fa);
const o2 = {};
for (const k of Object.keys(withFa)) o2[k] = k === 't' || k === 'fa' ? String(withFa[k]).slice(0, 200) : withFa[k];
console.log('withFa', JSON.stringify(o2, null, 1).slice(0, 3000));
