const fs = require('fs');
function load(p) {
  const raw = fs.readFileSync(p, 'utf8');
  const i = raw.indexOf('={');
  const j = raw.lastIndexOf('}');
  return JSON.parse(raw.slice(i + 1, j + 1));
}
const d = load('site/data/journals/salivan.js');
console.log('keys', Object.keys(d));
console.log('post0', JSON.stringify(d.posts[0], null, 1).slice(0, 1500));
console.log('image keys', Object.keys(d.images[0]));
console.log('image0', JSON.stringify(d.images[0], null, 1).slice(0, 1800));
const s = load('site/data/index.js');
console.log('index keys', Object.keys(s));
console.log('stats', JSON.stringify(s.stats));
console.log('recent0', JSON.stringify(s.recent[0]));
