/* Write the translation work file for pages that do not have one yet.
 *
 * The expert layer works one printed page at a time: `work/<thread>-p<N>.json`
 * holds that page's posts (id, text hash, author, English text), the hand
 * translation goes to `drafts/`, and `from-draft.js` turns it into a batch.
 * Every earlier journal got its work files that way; this pass does it for the
 * whole corpus, so the `RTM Journals` wave can be translated page by page.
 *
 * Usage:
 *   node _build/expert/work-files.js                 # every missing page
 *   node _build/expert/work-files.js dbrrbd mm       # only these threads
 *   node _build/expert/work-files.js --force         # rewrite existing files
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const WORK = path.join(__dirname, 'work');
const parsed = JSON.parse(fs.readFileSync(path.join(ROOT, '_build', 'parsed.json'), 'utf8'));

const args = process.argv.slice(2);
const force = args.includes('--force');
const only = args.filter(a => !a.startsWith('--'));

const normalize = t => String(t || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n').trim();
const hashOf = t => crypto.createHash('sha1').update(normalize(t)).digest('hex');

fs.mkdirSync(WORK, { recursive: true });

let written = 0, skipped = 0, empty = 0;
for (const thread of parsed.journals) {
  if (only.length && !only.includes(thread.id)) continue;
  const byPage = new Map();
  for (const post of thread.posts || []) {
    const text = normalize(post.text);
    if (!text) { empty++; continue; }
    const page = post.pageNum || 1;
    if (!byPage.has(page)) byPage.set(page, []);
    byPage.get(page).push({
      id: post.id,
      hash: hashOf(text),
      author: post.author || '',
      text,
    });
  }
  for (const [page, posts] of byPage) {
    const file = path.join(WORK, `${thread.id}-p${page}.json`);
    if (!force && fs.existsSync(file)) { skipped++; continue; }
    fs.writeFileSync(file, JSON.stringify(posts, null, 0), 'utf8');
    written++;
  }
}

console.log(`work files written: ${written} | already present: ${skipped} | posts without text: ${empty}`);
