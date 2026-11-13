/* --------------------------------------------------------------- lost images
 * Every post lists its pictures by content hash. The reader only shows the ones
 * the build could ship, so a post can quietly lose plates: the attachment is a
 * remote URL that no longer resolves (readthemarket is 410 Gone), or the 2021
 * downloader wrote only the file header, or the recorded file is not on disk.
 *
 * This script measures the gap reference by reference, tries the same proof the
 * recovery uses (a whole copy of that attachment name elsewhere in the *same*
 * journal folder), and writes the confirmed-hopeless count into
 * site/data/integrity.js as `lost` so the reader can say so instead of showing
 * an empty frame. Nothing here guesses: a name match is accepted only when all
 * copies of that name in the journal have identical, decodable bytes.
 *
 *   node _build/lost-images.js            report only
 *   node _build/lost-images.js --write    add `lost` to site/data/integrity.js
 */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const PARSED = path.join(ROOT, '_build', 'parsed.json');
const INTEGRITY = path.join(SITE, 'data', 'integrity.js');
const WRITE = process.argv.includes('--write');
const LIST = process.argv.includes('--list');
const MANIFEST = path.join(ROOT, '_build', 'lost-images.json');

const kindOf = b => {
  if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length > 6 && b.toString('latin1', 0, 4) === 'GIF8') return 'gif';
  if (b.length > 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  return null;
};
const PNG_IEND = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
/* The same terminator test recover-assets.js applies, so "whole" means one
 * thing across the toolchain: the exact PNG IEND chunk, the JPEG EOI marker, the
 * GIF trailer — after any stray CR/LF the text-mode transfer left behind. A PNG
 * ends AE 42 60 82, so testing the last byte for 0xAE rejects every good file. */
function whole(b, k) {
  let e = b.length;
  while (e > 0 && [0x0a, 0x0d, 0x20, 0x09, 0x00].includes(b[e - 1])) e--;
  if (k === 'png') return e >= 12 && b.subarray(e - 12, e).equals(PNG_IEND);
  if (k === 'jpg') return e >= 2 && b[e - 2] === 0xff && b[e - 1] === 0xd9;
  if (k === 'gif') return e >= 1 && b[e - 1] === 0x3b;
  if (k === 'webp') return b.length >= 12 && b.readUInt32LE(4) + 8 <= e + 8;
  return false;
}
const sha1 = b => crypto.createHash('sha1').update(b).digest('hex');

const parsed = JSON.parse(fs.readFileSync(PARSED, 'utf8'));

/* What the shipped build actually offers, per journal — read from the cache the
 * reader loads, not from the build manifest, because the build is what decides
 * an asset is too small or too remote to ship. */
const usable = new Map();      /* jid -> Set of hashes present in site/data/journals */
globalThis.window = { RTM_JOURNAL_CACHE: {} };
for (const J of parsed.journals) {
  const f = path.join(SITE, 'data', 'journals', J.id + '.js');
  const set = new Set();
  if (fs.existsSync(f)) {
    try {
      (0, eval)(fs.readFileSync(f, 'utf8') + ';void 0');
      for (const im of ((window.RTM_JOURNAL_CACHE || {})[J.id] || {}).images || []) set.add(im.k);
    } catch { /* unreadable cache */ }
  }
  usable.set(J.id, set);
}

/* Whole same-name copies inside each journal's own mirror folders. */
const mirrorCache = new Map();
function mirrorFor(J) {
  if (mirrorCache.has(J.id)) return mirrorCache.get(J.id);
  const m = new Map();
  const root = path.join(ROOT, J.dir || '');
  let subs = [];
  try {
    subs = fs.readdirSync(root, { withFileTypes: true })
      .filter(e => e.isDirectory() && /_files$/i.test(e.name)).map(e => e.name);
  } catch { }
  for (const d of subs) {
    let files = [];
    try { files = fs.readdirSync(path.join(root, d)); } catch { continue; }
    for (const f of files) {
      if (!/\.(png|jpe?g|gif|webp)$/i.test(f)) continue;
      const p = path.join(root, d, f);
      let b; try { b = fs.readFileSync(p); } catch { continue; }
      const k = kindOf(b.subarray(0, 32));
      if (!k || !whole(b, k) || b.length < 512) continue;
      const key = f.toLowerCase();
      if (!m.has(key)) m.set(key, []);
      m.get(key).push({ p, sha1: sha1(b), size: b.length, kind: k });
    }
  }
  mirrorCache.set(J.id, m);
  return m;
}

const perPost = {};
const classes = {};
const every = [];   /* the full list, so --list can be quoted in UX_AUDIT.md */
let refs = 0, lost = 0, rescuable = 0;
const rescueList = [];
for (const J of parsed.journals) {
  const byHash = new Map((J.images || []).map(im => [im.hash, im]));
  const have = usable.get(J.id) || new Set();
  for (const post of J.posts || []) {
    for (const h of post.images || []) {
      refs++;
      if (have.has(h)) continue;
      lost++;
      const im = byHash.get(h);
      let why = 'record-not-in-journal';
      if (im) {
        if (im.type === 'remote') why = 'remote-url-dead';
        else if (!im.localPath || !fs.existsSync(im.localPath)) why = 'file-not-on-disk';
        else {
          let b = null; try { b = fs.readFileSync(im.localPath); } catch { }
          const k = b ? kindOf(b.subarray(0, 32)) : null;
          if (!k) why = 'not-an-image';
          else if (!whole(b, k) || b.length < 512) why = 'header-only-2021-download';
          else why = 'excluded-by-build';
        }
      }
      classes[why] = (classes[why] || 0) + 1;
      every.push({
        jid: J.id, page: post.pageNum, postId: post.id, why,
        name: String((im && im.originalName) || ''),
        src: im ? (im.type === 'remote' ? im.src : im.localPath) : '(no record)',
      });
      /* Only the header-only class can still be rescued by name. */
      if (why === 'header-only-2021-download' || why === 'file-not-on-disk') {
        const nm = String((im && im.originalName) || '').toLowerCase();
        const cands = nm ? (mirrorFor(J).get(nm) || []) : [];
        const dig = [...new Set(cands.map(x => x.sha1))];
        if (dig.length === 1) { rescuable++; rescueList.push({ jid: J.id, postId: post.id, name: nm, file: cands[0].p, size: cands[0].size }); }
      }
      (perPost[post.id] || (perPost[post.id] = { n: 0, jid: J.id, cls: {} })).n++;
      const row = perPost[post.id];
      row.cls[why] = (row.cls[why] || 0) + 1;
    }
  }
}

const pids = Object.keys(perPost);
console.log('post→image references in the source : ' + refs);
console.log('  not shown by the reader            : ' + lost + '  across ' + pids.length + ' posts');
for (const [k, v] of Object.entries(classes).sort((a, b) => b[1] - a[1])) console.log('    ' + k.padEnd(28) + v);
console.log('  a whole same-name copy exists       : ' + rescuable);
for (const r of rescueList.slice(0, 10)) console.log('    ' + r.jid + ' ' + r.postId + ' ' + r.name + ' -> ' + r.size + 'b');

if (LIST) {
  for (const why of Object.keys(classes).sort((a, b) => classes[b] - classes[a])) {
    console.log('\n  ' + why + ' — ' + classes[why]);
    for (const e of every.filter(x => x.why === why))
      console.log('    ' + String(e.jid).padEnd(14) + 'p' + String(e.page).padEnd(5) + e.postId.padEnd(22) +
        e.name.padEnd(34) + e.src);
  }
}

fs.writeFileSync(MANIFEST, JSON.stringify({ generatedAt: new Date().toISOString(), refs, lost, lostPosts: pids.length, classes, items: every }, null, 1) + '\n');
console.log('  wrote ' + path.relative(ROOT, MANIFEST));

if (WRITE) {
  const txt = fs.readFileSync(INTEGRITY, 'utf8');
  const m = /window\.RTM_ASSET_INTEGRITY\s*=\s*([\s\S]*?);?\s*$/.exec(txt);
  const obj = JSON.parse(m[1]);
  obj.lost = perPost;
  obj.lostTotal = lost;
  obj.lostPosts = pids.length;
  obj.classes = classes;
  const head = txt.slice(0, txt.indexOf('window.RTM_ASSET_INTEGRITY'));
  fs.writeFileSync(INTEGRITY, head + 'window.RTM_ASSET_INTEGRITY = ' + JSON.stringify(obj, null, 1) + ';\n');
  console.log('  wrote ' + path.relative(ROOT, INTEGRITY) + ' with lost for ' + pids.length + ' posts');
}
