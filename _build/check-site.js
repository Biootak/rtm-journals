/* Static checks for the reader site: JS syntax, dead id references, CSS brace
 * depth, and tag balance in the markup. No browser here, so this is as close to
 * "does it hang together" as we can get. Usage: node _build/check-site.js
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const fail = [];
const say = (label, ok, detail) => {
  console.log((ok ? 'ok   ' : 'FAIL ') + label + (detail ? ' | ' + detail : ''));
  if (!ok) fail.push(label + ': ' + detail);
};

const JS_FILES = ['site/js/app.js', 'site/js/annotate.js'];
const HTML = 'site/index.html';
const CSS = 'site/css/style.css';

/* 1. syntax */
for (const js of JS_FILES) {
  try {
    cp.execSync('node --check ' + js, { cwd: ROOT, stdio: 'pipe' });
    say(js + ' parses', true);
  } catch (e) {
    say(js + ' parses', false, String(e.stderr || e.message).slice(0, 300));
  }
}

/* 2. every $('#id') / getElementById must exist in the markup, or be one of the
      ids the app creates itself at render time. */
const app = JS_FILES.map(read).join('\n');
const html = read(HTML);
const htmlIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
const dynamicIds = new Set([...app.matchAll(/id="([^"]+)"/g)].map(m => m[1])
  .concat([...app.matchAll(/\.id\s*=\s*'([^']+)'/g)].map(m => m[1])));
const used = new Set([...app.matchAll(/[$]\('#([A-Za-z0-9_-]+)'\)/g)].map(m => m[1])
  .concat([...app.matchAll(/getElementById\('([^']+)'\)/g)].map(m => m[1])));
const dead = [...used].filter(id => !htmlIds.has(id) && !dynamicIds.has(id));
say('all #id lookups resolve', dead.length === 0, dead.join(', '));

/* 2b. an <use href="#i-x"> that names no symbol renders as an empty square, and
      nothing else in the site will say so. */
const symbolIds = new Set([...html.matchAll(/<symbol\s+id="([^"]+)"/g)].map(m => m[1]));
const iconRefs = new Set([...(app + html).matchAll(/#(i-[a-z0-9-]+)/g)].map(m => m[1]));
const missingIcons = [...iconRefs].filter(i => !symbolIds.has(i));
say('every icon use has a symbol', missingIcons.length === 0, missingIcons.join(', '));

/* 2c. a class the JS builds but the CSS never names is an unstyled element —
      the usual symptom of a feature added on one side only. */
const css = read(CSS);
const jsClasses = new Set([...app.matchAll(/class="([^"]+)"/g)]
  .flatMap(m => m[1].split(/\s+/))
  .filter(c => /^(anno|notes|plate)-[a-z-]+$/.test(c)));
const unstyled = [...jsClasses].filter(c => !new RegExp('\\.' + c + '(?![-a-z])').test(css));
say('generated classes have rules', unstyled.length === 0, unstyled.join(', '));

/* 3. CSS braces balance, and never go negative */
let depth = 0, min = 0;
for (const ch of css) {
  if (ch === '{') depth++;
  else if (ch === '}') { depth--; if (depth < min) min = depth; }
}
say('css balances to 0', depth === 0 && min === 0, 'depth ' + depth + ' min ' + min);

/* 4. tag balance in the markup */
for (const tag of ['div', 'section', 'button', 'li', 'figure', 'span', 'article']) {
  const opens = (html.match(new RegExp('<' + tag + '[\\s>]', 'g')) || []).length;
  const closes = (html.match(new RegExp('</' + tag + '>', 'g')) || []).length;
  if (opens !== closes) say('<' + tag + '> pairs', false, opens + ' open / ' + closes + ' close');
  else console.log('ok    <' + tag + '> pairs ' + opens + '/' + closes);
}

/* 5. nothing left in the JS that only the deleted image-text layer used */
const banned = ['renderMarkers', 'setPanelVisible', 'paintPanelToggle', 'setViewerView',
  'copyAllViewer', 'renderBlocksHTML', 'renderInlineSection', 'imageHasText',
  'ocrBlockCount', 'ocrGeometry', 'focusBlock', 'highlightMarker', 'showPlateBox',
  'handlePlateHover', 'blocksToMarkdown', 'exportImageMarkdown', 'drawPlateMarkerBox',
  'SHEET_MODE', 'panelBeforeFull'];
const survivors = banned.filter(n => new RegExp('\\b' + n + '\\b').test(app));
say('image-text layer fully unhooked', survivors.length === 0, survivors.join(', '));

console.log(fail.length ? '\n' + fail.length + ' check(s) failed' : '\nall checks passed');
process.exit(fail.length ? 1 : 0);
