/* Which class selectors in the stylesheet are never mentioned by the markup or
 * the script? A first cut at dead CSS: it over-reports, because a class can be
 * built from a template literal in pieces, so read the list before deleting.
 * Usage: node _build/dead-css.js [substring]
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(ROOT, 'site/css/style.css'), 'utf8');
const app = fs.readFileSync(path.join(ROOT, 'site/js/app.js'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'site/index.html'), 'utf8');

const classes = new Set();
for (const m of css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) classes.add(m[1]);

const filter = process.argv[2];
const unused = [...classes].sort().filter(c => {
  if (filter && !c.includes(filter)) return false;
  return !html.includes(c) && !app.includes(c);
});
console.log(unused.length + ' class selectors with no mention in index.html or app.js:');
console.log(unused.join('\n'));
