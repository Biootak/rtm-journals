/* Build print-order image anchors (post.ib) for the HTML-capture journals and
 * apply the already-computed PDF anchors from image-anchors.json.
 *
 * HTML journals keep <img> tags inline inside .kmsgtext, so each plate's
 * paragraph position is recoverable: sentinel-replace every non-UI image,
 * run the same text transform build-data.js uses, and count the \n\n
 * paragraphs before each sentinel.
 *
 * Usage: node _build/expert/build-html-anchors.js [--apply]
 * Default writes _build/expert/html-anchors.json only; --apply also writes
 * post.ib arrays into _build/parsed.json.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..', '..');
const BUILD = path.join(ROOT, '_build');
const PARSED = path.join(BUILD, 'parsed.json');
const OUT = path.join(__dirname, 'html-anchors.json');
const PDF_ANCHORS = path.join(__dirname, 'image-anchors.json');
const HASH_CACHE = path.join(BUILD, 'hash-cache.json');
const apply = process.argv.includes('--apply');

/* Wayback-fetched plates (mertch and friends) never landed in a *_files dir;
 * their URL -> content-hash mapping lives in the per-journal image caches. */
const urlHash = new Map();
try {
  for (const f of fs.readdirSync(BUILD)) {
    if (!/-image-cache\.json$/.test(f)) continue;
    const c = JSON.parse(fs.readFileSync(path.join(BUILD, f), 'utf8'));
    for (const [u, v] of Object.entries(c)) {
      if (v && v.hash) urlHash.set(u, v.hash);
    }
  }
} catch {}

/* journals whose dir is an HTML capture (no PDFs) — the 23 without anchors */
const HTML_JOURNALS = [
  'andrew', 'aran', 'astrokillah', 'benhur', 'edges', 'einrikr',
  'extremerrage', 'fulljournal', 'fxeyes', 'if', 'jurij', 'lespaul',
  'linos', 'mel', 'mertch', 'michal238', 'moneydeep', 'mukhcin', 'omidfx',
  'pedini', 'rinehart', 'salivan', 'sniffing', 'staurum', 'vitaldrug',
];

const REMOTE_RE = /^(https?:)?\/\//i;
const SKIP_IMAGE_RE = /(?:avatar|rank\d*|logo|nophoto|smiley|emoticon|emot|icon|badge|spacer|blank\.|pixel\.|transparent\.|thumbsup|notworthy|cheer|clap|wave\.|study\.|sleep\.|blush\.|hug\.|love\.|party\.|biggrin\.|devil\.|cool\.|sad\.|wink\.|laugh\.|confus|huh\.|rolleyes|tongue|kiss|angry|shock|dry\.|sick|pinch|frustrat|good\.|beer|birthday|cake|dance|flower|gift|heart|rose|star\.|sun\.|rainbow|coffee|popcorn|rock\.|bandit|ninja|pirate|santa|clown|ghost|skull|alien|robot|bunny|cat\.|dog\.|bear|panda|penguin|monkey|pig\.|cow\.|chicken|frog|fish|horse|sheep|tiger|lion|wolf|fox\.|owl\.|bee\.|ant\.|bug\.|snail|turtle|dolphin|whale|shark|octopus|crab|butterfly|dragon|unicorn)/i;
const IMG_EXT_RE = /\.(jpe?g|png|gif|webp|bmp)$/i;

function isUiImage($, img) {
  const src = String($(img).attr('src') || '');
  const cls = String($(img).attr('class') || '');
  const alt = String($(img).attr('alt') || '');
  const w = parseInt($(img).attr('width') || '0', 10);
  const h = parseInt($(img).attr('height') || '0', 10);
  if (!src) return true;
  if (/bbcode_smiley|kavatar|img-polaroid|kicon|smiley/i.test(cls + ' ' + alt)) return true;
  const base = src.split('/').pop().split('?')[0];
  let decoded = base;
  try { decoded = decodeURIComponent(base); } catch {}
  if (SKIP_IMAGE_RE.test(decoded)) return true;
  if (w && h && w <= 64 && h <= 64) return true;
  if (w && h && w <= 100 && h <= 20) return true;
  return false;
}

function cleanText(s) {
  return String(s || '')
    .replace(/ /g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function naturalSort(a, b) {
  const na = String(a).match(/\d+/g) || [];
  const nb = String(b).match(/\d+/g) || [];
  for (let i = 0; i < Math.max(na.length, nb.length); i++) {
    const x = parseInt(na[i] || '0', 10);
    const y = parseInt(nb[i] || '0', 10);
    if (x !== y) return x - y;
  }
  return String(a).localeCompare(String(b), 'en');
}

function paragraphCount(text) {
  return String(text || '').split(/\n{2,}/).filter(p => p.trim()).length;
}

/* ---- local _files index (same as build-data.js) ---- */
/* Global index of every *_files dir at any depth (journals keep theirs either
 * at repo root or inside their own folder), plus a per-page sibling lookup:
 * "<page>_files" sits next to "<page>.html". Sibling wins on basename clashes. */
const localByName = new Map();
const filesDirCache = new Map();
function indexFilesDir(dirPath) {
  if (filesDirCache.has(dirPath)) return filesDirCache.get(dirPath);
  const m = new Map();
  try {
    for (const e of fs.readdirSync(dirPath, { withFileTypes: true })) {
      if (e.isDirectory()) {
        const p = path.join(dirPath, e.name);
        if (/_files$/i.test(e.name)) indexInto(m, p);
        else if (e.name !== 'node_modules') indexFilesDirInto(m, p);
      } else if (/\.(jpe?g|png|gif|webp|bmp)$/i.test(e.name)) {
        m.set(e.name.toLowerCase(), path.join(dirPath, e.name));
      }
    }
  } catch {}
  filesDirCache.set(dirPath, m);
  return m;
}
function indexInto(m, dirPath) {
  try {
    for (const e of fs.readdirSync(dirPath, { withFileTypes: true })) {
      if (e.isDirectory()) indexInto(m, path.join(dirPath, e.name));
      else if (/\.(jpe?g|png|gif|webp|bmp)$/i.test(e.name)) {
        const k = e.name.toLowerCase();
        if (!m.has(k)) m.set(k, path.join(dirPath, e.name));
      }
    }
  } catch {}
}
function indexFilesDirInto(m, dirPath) {
  let entries = [];
  try { entries = fs.readdirSync(dirPath, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const p = path.join(dirPath, e.name);
    if (e.isDirectory()) {
      if (/_files$/i.test(e.name)) indexInto(m, p);
      else if (!/^(site|_build|node_modules|\.git|release-build)$/i.test(e.name)) indexFilesDirInto(m, p);
    } else if (/\.(jpe?g|png|gif|webp|bmp)$/i.test(e.name)) {
      const k = e.name.toLowerCase();
      if (!m.has(k)) m.set(k, p);
    }
  }
}
indexFilesDirInto(localByName, ROOT);
function siblingFilesDir(journalDir, pageFile) {
  const base = pageFile.replace(/\.html?$/i, '');
  const cand = path.join(journalDir, base + '_files');
  return fs.existsSync(cand) ? cand : null;
}
function lookupLocal(baseName, sibDir) {
  const k = baseName.toLowerCase();
  if (sibDir) {
    const m = indexFilesDir(sibDir);
    if (m.has(k)) return m.get(k);
  }
  return localByName.get(k) || null;
}

let hashCache = {};
try { hashCache = JSON.parse(fs.readFileSync(HASH_CACHE, 'utf8')); } catch {}
function hashOf(file) {
  if (hashCache[file]) return hashCache[file];
  const h = crypto.createHash('sha1');
  h.update(fs.readFileSync(file));
  const hex = h.digest('hex');
  hashCache[file] = hex;
  return hex;
}

/* resolveImage replica — returns {key} | {skip} | null, no network */
function resolveKey(src, pageDir, sibDir) {
  let s = String(src || '').trim();
  if (!s) return null;
  if (REMOTE_RE.test(s)) {
    if (s.startsWith('//')) s = 'https:' + s;
    let base = s.split('/').pop().split('?')[0];
    try { base = decodeURIComponent(base); } catch {}
    const local = lookupLocal(base, sibDir);
    if (local) {
      if (!IMG_EXT_RE.test(local)) return { skip: true };
      try { return { key: hashOf(local) }; } catch { return null; }
    }
    const cached = urlHash.get(s) || urlHash.get(s.split('?')[0])
      || urlHash.get(s.replace(/^http:/, 'https:'));
    if (cached) return { key: cached };
    return { key: 'remote_' + crypto.createHash('sha1').update(s).digest('hex').slice(0, 16) };
  }
  if (/^data:/i.test(s)) return null;
  if (/^file:\/\//i.test(s)) {
    try { s = decodeURIComponent(s.replace(/^file:\/\//i, '').replace(/^\/([A-Za-z]:)/, '$1')); } catch {}
  }
  let decoded = s;
  try { decoded = decodeURIComponent(s); } catch {}
  decoded = decoded.replace(/\\/g, '/');
  if (/^[A-Za-z]:\//.test(decoded)) {
    if (fs.existsSync(decoded)) {
      if (!IMG_EXT_RE.test(decoded)) return null;
      try { return { key: hashOf(decoded) }; } catch { return null; }
    }
    return null;
  }
  const p = path.resolve(pageDir, decoded);
  if (fs.existsSync(p) && fs.statSync(p).isFile()) {
    if (!IMG_EXT_RE.test(p)) return null;
    try { return { key: hashOf(p) }; } catch { return null; }
  }
  return null;
}

const parsed = JSON.parse(fs.readFileSync(PARSED, 'utf8'));
const byId = new Map();
for (const j of parsed.journals) for (const p of j.posts) byId.set(p.id, p);

const anchors = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
const statsAll = {};

for (const jid of HTML_JOURNALS) {
  const journal = parsed.journals.find(j => j.id === jid);
  if (!journal) continue;
  const dir = path.isAbsolute(journal.dir) ? journal.dir : path.join(ROOT, journal.dir);
  if (!fs.existsSync(dir)) continue;
  const pageFiles = fs.readdirSync(dir).filter(f => /\.html?$/i.test(f)).sort(naturalSort);
  const jout = {};
  const stats = { posts: 0, withImages: 0, anchored: 0, mismatch: 0, noPost: 0, occurrences: 0 };

  for (let pi = 0; pi < pageFiles.length; pi++) {
    const pageFile = pageFiles[pi];
    const sibDir = siblingFilesDir(dir, pageFile);
    let html;
    try { html = fs.readFileSync(path.join(dir, pageFile), 'utf8'); } catch { continue; }
    const $ = cheerio.load(html);
    const tables = $('table.kmsg');
    for (let ti = 0; ti < tables.length; ti++) {
      const table = tables[ti];
      const body = $(table).find('.kmsgtext').first();
      if (!body.length) continue;
      const pid = `${jid}_p${pi + 1}_${ti + 1}`;
      const post = byId.get(pid);
      stats.posts++;
      if (!post) { stats.noPost++; continue; }
      const want = post.images || [];
      if (!want.length) continue;

      /* sentinel-replace non-UI images in place ($ is per-page, safe) */
      let occ = 0;
      const occKeys = [];
      body.find('img').each((_, img) => {
        if (isUiImage($, img)) return;
        const src = String($(img).attr('src') || '').trim();
        if (!src) return;
        const k = occ++;
        $(img).replaceWith('\u0001' + k + '\u0001');
        occKeys.push({ k, src });
      });
      if (!occ) continue;
      stats.withImages++;
      stats.occurrences += occ;

      /* text transform identical to build-data.js htmlToText */
      body.find('br').replaceWith('\n');
      body.find('p, div, li, blockquote, tr').each((_, n) => { $(n).append('\n'); });
      body.find('script, style').remove();
      const rawText = cleanText(body.text());

      /* locate each sentinel's paragraph */
      const paras = rawText.split(/\n{2,}/);
      const paraOf = [];
      paras.forEach((para, idx) => {
        const re = /\u0001(\d+)\u0001/g;
        let m;
        while ((m = re.exec(para))) {
          const before = para.slice(0, m.index).trim();
          paraOf[Number(m[1])] = before ? idx + 1 : idx;
        }
      });

      /* resolve keys and align with post.images */
      const resolved = [];
      for (const o of occKeys) {
        const r = resolveKey(o.src, dir, sibDir);
        if (r && r.key) resolved.push({ k: o.k, key: r.key });
      }
      const limit = paragraphCount(post.text || '');
      const ibs = resolved.map(r => Math.min(Math.max(0, paraOf[r.k] ?? 0), limit));

      /* remote_* keys are unverifiable placeholders; the importers kept
         post.images in document order, so an unknown plate takes want[i]
         while every resolved key must still match its slot exactly. */
      let aligned = resolved.length === want.length;
      if (aligned) {
        for (let i = 0; i < resolved.length; i++) {
          const key = resolved[i].key;
          if (key.startsWith('remote_')) continue;
          if (key !== want[i]) { aligned = false; break; }
        }
      }
      if (!aligned) {
        stats.mismatch++;
        continue;
      }
      jout[pid] = ibs;
      stats.anchored++;
    }
  }
  anchors[jid] = { anchors: jout, stats };
  statsAll[jid] = stats;
  console.log(`${jid}: posts=${stats.posts} withIm=${stats.withImages} anchored=${stats.anchored} mismatch=${stats.mismatch} occ=${stats.occurrences}`);
}

fs.writeFileSync(OUT, JSON.stringify(anchors, null, 1));
console.log('wrote', OUT);

if (apply) {
  fs.writeFileSync(HASH_CACHE, JSON.stringify(hashCache));
  let applied = 0;
  /* 1) PDF anchors computed earlier */
  if (fs.existsSync(PDF_ANCHORS)) {
    const pdfA = JSON.parse(fs.readFileSync(PDF_ANCHORS, 'utf8'));
    for (const [jid, row] of Object.entries(pdfA)) {
      const journal = parsed.journals.find(j => j.id === jid);
      if (!journal) continue;
      for (const [pid, arr] of Object.entries(row.anchors || {})) {
        const post = byId.get(pid);
        if (!post) continue;
        if (arr.length !== (post.images || []).length) continue;
        const limit = paragraphCount(post.text || '');
        post.ib = arr.map(a => Math.min(Math.max(0, Number(a) || 0), limit));
        applied++;
      }
    }
    console.log('pdf anchors applied:', applied);
  }
  /* 2) HTML anchors just built */
  let appliedHtml = 0;
  for (const [jid, row] of Object.entries(anchors)) {
    for (const [pid, arr] of Object.entries(row.anchors || {})) {
      const post = byId.get(pid);
      if (!post) continue;
      if (arr.length !== (post.images || []).length) continue;
      post.ib = arr;
      appliedHtml++;
    }
  }
  console.log('html anchors applied:', appliedHtml);
  fs.writeFileSync(PARSED, JSON.stringify(parsed));
  console.log('parsed.json written');
}
