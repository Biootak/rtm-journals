#!/usr/bin/env node
/*
 * recover-assets.js — put back the pictures the 2021 scrape dropped.
 *
 * The archive holds 6,473 images and every one of them is intact (image-census
 * .js). The saved forum pages, however, reference 7,111 distinct attachments,
 * and 560 of those names sit unread in the `_files` folders next to the pages
 * that used them (mirror-gap.js). They are not corrupt copies of what we have;
 * they are images the scraper never recorded at all, so no post points at them
 * and the reader never sees them. Aligning message by message instead of by
 * filename raises that to 1,119 image *references* across 425 pages — the same
 * picture can be posted in several places, and each of those posts is missing
 * it separately.
 *
 * How the mapping is proven rather than guessed:
 *   - each saved page splits into exactly one `<div class="kmsgtext">` per
 *     message (page 99 of IF: 25 blocks, 25 posts in our data);
 *   - inside a message, images appear in document order as
 *     `<div class="kmsgimage"><a href="ORIGINAL_URL" title="NAME">`;
 *   - so message i's ordered image list should equal post i's `im` list.
 * `--verify` runs that equality test over a sample and refuses to apply
 * anything until it holds. That check is what separates "we recovered 560
 * images" from "we attached 560 images to the wrong posts".
 *
 * Modes:
 *   --verify        alignment report only (default)
 *   --dry-run       say what would be added, change nothing
 *   --apply         copy files, build webp thumbs, record them in parsed.json
 *
 * --apply changes the *source* and nothing else. Run `node _build/build-site.js`
 * afterwards so index.js, posts.js, search.js and the 24 journal files are all
 * re-derived from the same recovery — see the note above applyRecoveries().
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const DATA = path.join(SITE, 'data', 'journals');
const IMAGES = path.join(SITE, 'assets', 'images');
const THUMBS = path.join(SITE, 'assets', 'thumbs');
const REPORT = path.join(ROOT, '_build', 'recovery-report.json');
const PARSED = path.join(ROOT, '_build', 'parsed.json');
const PARSED_BACKUP = path.join(ROOT, '_build', 'backup-recovery', 'parsed.json.before');
const recoveredOn = new Date().toISOString().slice(0, 10);

const MODE = process.argv.includes('--apply') ? 'apply'
  : process.argv.includes('--dry-run') ? 'dry-run' : 'verify';

let sharp = null;
try { sharp = require(path.join(ROOT, '_build', 'node_modules', 'sharp')); }
catch (e) { if (MODE === 'apply') { console.error('sharp is required for --apply: ' + e.message); process.exit(1); } }

function sha1Of(file) {
  return crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex');
}

/* ---------------------------------------------------------- saved-page index */

/* Journal id -> the exact saved-page filenames. The scrape named each page
 * after the *thread title*, not the journal name ("AK's Journal - Page 1" for
 * Astrokillah), and the data already records those filenames in `pageFiles`,
 * so that list is used instead of anything constructed — it is the difference
 * between reading 170 pages and reading all 425. */
function pageFileCandidates(J, page) {
  const stem = (J.pageFiles || [])[page - 1];
  if (!stem) return [];
  const out = [];
  const dirs = [path.join(ROOT, J.dir || ''), ROOT];
  for (const d of dirs) {
    const p = path.join(d, stem);
    if (fs.existsSync(p)) out.push(p);
  }
  /* Some journals kept a second copy of the whole scrape one level down. */
  for (const e of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name === 'site' || e.name === '_build' || e.name.startsWith('.')) continue;
    const p = path.join(ROOT, e.name, stem);
    if (fs.existsSync(p) && !out.includes(p)) out.push(p);
  }
  return out;
}

const MSG_SPLIT = /<div class="kmsgtext"/;
const IMG_BLOCK = /<div class="kmsgimage">[\s\S]*?<a href="([^"]+)"[^>]*title="([^"]*)"/g;

function parsePage(htmlFile) {
  const html = fs.readFileSync(htmlFile, 'utf8');
  const dir = htmlFile.replace(/\.html$/, '_files');
  const chunks = html.split(MSG_SPLIT);
  /* chunks[0] is the page header before the first message. */
  const messages = chunks.slice(1).map((body, i) => {
    const imgs = [];
    const seen = new Set();
    let m;
    IMG_BLOCK.lastIndex = 0;
    while ((m = IMG_BLOCK.exec(body))) {
      const url = m[1];
      /* The anchor's `title` is what the forum *displayed*, and it is elided in
       * the middle for long names ("...17-07-27-5.png"). The href is the
       * attachment's real filename, so the href wins and the title is only a
       * fallback for the few anchors that carry no path. */
      const fromUrl = path.posix.basename(url.split('?')[0]);
      let name = fromUrl || m[2] || '';
      try { name = decodeURIComponent(name); } catch { /* keep raw */ }
      try { void (m, fromUrl); } catch { /* ignore */ }
      const lk = name.toLowerCase();
      if (!name || seen.has(lk)) continue;   /* same picture linked twice */
      seen.add(lk);
      const local = localFor(body.slice(m.index, m.index + 900), dir);
      imgs.push({ name, url, local, order: imgs.length });
    }
    void i;
    return imgs;
  });
  return messages;
}

const LOCAL_RE = /<img[^>]+src="([^"]+)"/;
function localFor(snippet, dir) {
  const m = LOCAL_RE.exec(snippet);
  if (!m) return null;
  let rel = m[1];
  try { rel = decodeURIComponent(rel); } catch { /* keep */ }
  if (/^data:/i.test(rel)) return null;
  const abs = path.isAbsolute(rel) ? rel : path.join(path.dirname(dir), rel);
  return fs.existsSync(abs) ? abs : null;
}

/* ------------------------------------------------------------------- align */

/* Identity is the file path, not the filename, and this is the correction that
 * matters. build-data.js recorded each image's `originalName` as the name the
 * *browser saved* ("gbpusd_006.png"), while the anchor in the page points at
 * the name the *server served* ("gbpusd.mdaily1.png"). Comparing those two — a
 * first pass did — reports 659 already-held pictures as dropped and would have
 * pasted a second copy of the archive onto itself. parsed.json carries the real
 * `localPath` for all 7,880 downloaded attachments, so the saved page's own
 * `<img src>` can be resolved and compared with the file the record names. */
const parsed = JSON.parse(fs.readFileSync(PARSED, 'utf8'));

function normPath(p) {
  if (!p) return '';
  return path.resolve(p).toLowerCase().replace(/[\\/]/g, path.sep);
}
function baseOf(p) { return String(p || '').split(/[\\/]/).pop().toLowerCase(); }

const recByHash = new Map();          /* hash -> parsed image record */
const heldPaths = new Map();          /* postId -> Set of resolved local paths */
const heldOrder = new Map();          /* postId -> ordered local basenames */
const postHashes = new Map();         /* postId -> Set of content hashes it lists */
const journalHeldHashes = new Map();  /* jid  -> Set of every content hash in it */
const postsByHash = new Map();        /* hash -> Set of postIds that already list it */
const baseToHashes = new Map();       /* lowercased local basename -> Set of hashes */
const journalHeldPaths = new Map();   /* jid -> Set of every local path in that journal */

for (const j of parsed.journals) {
  /* The record lookup is journal-local on purpose. The same attachment can be
   * hashed identically in two journals, and a global map would keep whichever
   * `_files` path was read last, so the other journal's posts would look like
   * they reference nothing. */
  const byH = new Map();
  const all = new Set();
  const hashes = new Set();
  for (const im of j.images || []) {
    if (!im.hash) continue;
    byH.set(im.hash, im);
    recByHash.set(im.hash, im);
    hashes.add(im.hash);
    if (im.localPath) all.add(normPath(im.localPath));
    const b = im.localPath ? baseOf(im.localPath) : String(im.originalName || '').toLowerCase();
    if (!b) continue;
    if (!baseToHashes.has(b)) baseToHashes.set(b, new Set());
    baseToHashes.get(b).add(im.hash);
  }
  journalHeldPaths.set(j.id, all);
  journalHeldHashes.set(j.id, hashes);
  for (const q of j.posts || []) {
    const paths = new Set(), order = [], own = new Set();
    for (const h of q.images || []) {
      own.add(h);
      if (!postsByHash.has(h)) postsByHash.set(h, new Set());
      postsByHash.get(h).add(q.id);
      const r = byH.get(h);
      if (!r) continue;
      if (r.localPath) paths.add(normPath(r.localPath));
      order.push(r.localPath ? baseOf(r.localPath) : String(r.originalName || '').toLowerCase());
    }
    heldPaths.set(q.id, paths);
    heldOrder.set(q.id, order);
    postHashes.set(q.id, own);
  }
}

/* ------------------------------------------------------------ format gates
 * Magic bytes name a real format, the format's own terminator sits at the end,
 * the header carries dimensions, and the sha1 names the bytes. These live at the
 * top because every classification pass below uses them: a helper declared later
 * is in its temporal dead zone when an earlier pass runs, and a catch-all swallow
 * turned that into "only-copy-is-header-only" for 124 files that are whole. */

function magicKind(buf) {
  if (buf.length > 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 6 && buf.toString('latin1', 0, 6).startsWith('GIF8')) return 'gif';
  if (buf.length > 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  return null;
}

/* A truncated JPEG has a perfect header and no end of stream. libvips refuses
 * even to read its metadata unless told to carry on, and then produces nothing
 * usable. Reading the dimensions off the header ourselves means we can say
 * *why* a candidate was rejected instead of losing it to an exception, and the
 * caller decides whether a half-decoded picture is worth shipping. */
function headerDims(buf, kind) {
  try {
    if (kind === 'png') return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    if (kind === 'gif') return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
    if (kind === 'jpg') {
      let p = 2;
      while (p + 4 < buf.length) {
        if (buf[p] !== 0xff) break;
        const m = buf[p + 1];
        if (m === 0x01 || m === 0xd8 || (m >= 0xd0 && m <= 0xd7)) { p += 2; continue; }
        const len = buf.readUInt16BE(p + 2);
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
          return { width: buf.readUInt16BE(p + 7), height: buf.readUInt16BE(p + 5) };
        }
        if (m === 0xda) break;
        p += 2 + len;
      }
      return { width: 0, height: 0 };
    }
    if (kind === 'webp') {
      const fourcc = buf.toString('latin1', 12, 16);
      if (fourcc === 'VP8X') return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
      if (fourcc === 'VP8L') { const bits = buf.readUInt32LE(21); return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) }; }
      if (fourcc === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    }
  } catch { /* fall through */ }
  return { width: 0, height: 0 };
}

/* A truncated file has a perfect header and no end of stream. The 2021 scrape
 * sometimes ran through a text-mode transfer, which appends a stray CR/LF after
 * an otherwise complete image — the census found that on `crude.png` — so the
 * trailing whitespace is skipped before the terminator is judged. Without that
 * step the check would refuse whole files; with a naive "does the tail contain
 * the marker" it would accept half of a JPEG whose entropy data happens to hold
 * the same two bytes. */
function trimmedEnd(buf) {
  let end = buf.length;
  while (end > 0) {
    const c = buf[end - 1];
    if (c === 0x0a || c === 0x0d || c === 0x20 || c === 0x09 || c === 0x00) end--;
    else break;
  }
  return end;
}

const PNG_IEND = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);

function isWhole(buf, kind) {
  const e = trimmedEnd(buf);
  if (kind === 'png') return e >= 12 && buf.subarray(e - 12, e).equals(PNG_IEND);
  if (kind === 'jpg') return e >= 2 && buf[e - 2] === 0xff && buf[e - 1] === 0xd9;
  if (kind === 'gif') return e >= 1 && buf[e - 1] === 0x3b;
  if (kind === 'webp') return buf.readUInt32LE(4) + 8 <= e + 8;
  return false;
}

/* ------------------------------------------------- mirror name index --------
 * Resolving a message's `<img src>` inside its *own* page folder is not enough,
 * and the reason is visible in the bytes: 86 of the remaining references land on
 * a ~1.3 KB file that begins "<!DOCTYPE html><title>404 - Category not found".
 * That is the error page the browser saved in place of the attachment, named
 * after it (GU1.png → GU1.htm). The real picture is frequently mirrored a few
 * folders away, under a different letter case, because the same attachment was
 * requested again on another page and *that* request succeeded.
 *
 * The index is scoped to one journal folder on purpose. Names like USDJPY.png,
 * gold.png or image.png recur across traders, and a global basename match would
 * paste another trader's chart into this diary — a worse defect than the missing
 * picture. Within a journal, a name is accepted only when every copy of it has
 * identical bytes; two different pictures sharing one filename is a coin toss,
 * so those references are reported and left alone. */
const IMG_EXT_RE = /\.(png|jpe?g|gif|webp|bmp)$/i;
const mirrorIndex = new Map();          /* jid -> Map(lowercase basename -> [{path,page}]) */
const mirrorRaw = new Map();            /* jid -> Set of every image basename seen, filtered or not */
const kindCache = new Map();
const digestCache = new Map();

function magicOf(file) {
  if (kindCache.has(file)) return kindCache.get(file);
  let kind = null;
  try {
    const fd = fs.openSync(file, 'r');
    /* 32 bytes, not 16: magicKind() only trusts a PNG signature past byte 24,
     * and a shorter window silently classifies every PNG as a stub — which
     * first showed up as 326 "unrecoverable" pictures that were on disk the
     * whole time. */
    const buf = Buffer.alloc(32);
    const n = fs.readSync(fd, buf, 0, 32, 0);
    fs.closeSync(fd);
    if (n >= 3) kind = magicKind(buf.subarray(0, n));
  } catch { /* unreadable */ }
  kindCache.set(file, kind);
  return kind;
}

function digestOf(file) {
  if (digestCache.has(file)) return digestCache.get(file);
  let h = '';
  try { h = sha1Of(file); } catch { /* unreadable */ }
  digestCache.set(file, h);
  return h;
}

function mirrorFor(J) {
  if (mirrorIndex.has(J.id)) return mirrorIndex.get(J.id);
  const m = new Map();
  const root = path.join(ROOT, J.dir || '');
  let sub = [];
  try {
    sub = fs.readdirSync(root, { withFileTypes: true })
      .filter(e => e.isDirectory() && /_files$/i.test(e.name)).map(e => e.name);
  } catch { /* journal folder is not on disk */ }
  for (const d of sub) {
    const page = (/Page\s*(\d+)/i.exec(d) || [])[1] || '';
    const full = path.join(root, d);
    let files = [];
    try { files = fs.readdirSync(full); } catch { continue; }
    for (const f of files) {
      if (!IMG_EXT_RE.test(f)) continue;
      const p = path.join(full, f);
      let st; try { st = fs.statSync(p); } catch { continue; }
      if (st.size < 300) continue;
      const k = f.toLowerCase();
      if (!m.has(k)) m.set(k, []);
      m.get(k).push({ path: p, page });
      (mirrorRaw.get(J.id) || mirrorRaw.set(J.id, new Set()).get(J.id)).add(k);
    }
  }
  mirrorIndex.set(J.id, m);
  return m;
}

/* A copy is usable only if its magic bytes name a format *and* the format's own
 * terminator is at the end of the file: the 2021 downloader left behind a class
 * of 6- and 9-byte files that carry a perfect header and nothing else. Returns
 * the byte length when whole, otherwise 0. */
const wholeCache = new Map();
function wholeOf(file) {
  if (wholeCache.has(file)) return wholeCache.get(file);
  let n = 0;
  try {
    const buf = fs.readFileSync(file);
    const kind = magicKind(buf);
    if (kind && buf.length > 32 && isWhole(buf, kind)) n = buf.length;
  } catch { /* unreadable */ }
  wholeCache.set(file, n);
  return n;
}

const distinct = arr => [...new Set(arr.filter(Boolean))];

/* {file} when the name resolves to one picture, {ambiguous:n} when several,
 * {} when the journal folder holds nothing usable for it. */
function resolveByName(J, wanted, page) {
  const list = mirrorFor(J).get(String(wanted || '').toLowerCase()) || [];
  const usable = [];
  const seen = new Set();
  for (const x of list) {
    const key = x.path.toLowerCase();
    if (seen.has(key) || !magicOf(x.path)) continue;
    seen.add(key);
    usable.push({ ...x, sha1: digestOf(x.path) });
  }
  if (!usable.length) return {};
  const pick = (cand, sha1) => {
    const same = cand.filter(x => x.sha1 === sha1);
    same.sort((a, b) => (String(a.page) === String(page) ? 0 : 1) - (String(b.page) === String(page) ? 0 : 1));
    return { file: same[0].path, sha1, mirrorPage: same[0].page };
  };
  let digests = distinct(usable.map(x => x.sha1));
  if (digests.length > 1) {
    /* Several copies of one name are not automatically a coin toss. The 2021
     * scrape often holds a header-only fragment *and* the whole file for the
     * same attachment; one whole copy is a decision, not a guess. Only two
     * whole copies with different bytes are, and those stay untouched. */
    const good = usable.filter(x => wholeOf(x.path));
    const goodDigests = distinct(good.map(x => x.sha1));
    if (goodDigests.length !== 1) return { ambiguous: goodDigests.length };
    return pick(good, goodDigests[0]);
  }
  return pick(usable, digests[0]);
}

const alignment = {
  pagesCompared: 0, messagesCompared: 0, exactMatches: 0, alreadyLinked: 0,
  mirrorResolved: 0,
  mismatched: [], dropped: [], noLocalCopy: [], shifted: [], permuted: [],
  reuse: [], heldElsewhere: [], ambiguous: [],
};
const perJournal = {};

/* Pass 1 — read every page once and keep its messages beside the posts they
 * belong to. The second pass needs a *holder* page's anchors to prove that a
 * file recorded on page 3 really is the attachment page 17 displayed, and the
 * holder is usually read later in the loop; parsing twice would double the
 * minute-long scan for no benefit. */
const pages = [];
for (const J of parsed.journals) {
  const postsByPage = new Map();
  for (const p of J.posts || []) {
    const n = Number(p.pageNum) || 1;
    if (!postsByPage.has(n)) postsByPage.set(n, []);
    postsByPage.get(n).push(p);
  }
  for (const [page, posts] of [...postsByPage.entries()].sort((a, b) => a[0] - b[0])) {
    posts.sort((a, b) => (String(a.number).replace('#', '') | 0) - (String(b.number).replace('#', '') | 0));
    const files = pageFileCandidates(J, page);
    if (!files.length) continue;
    alignment.pagesCompared++;
    let messages;
    try { messages = parsePage(files[0]); } catch { continue; }
    if (messages.length !== posts.length) {
      alignment.mismatched.push({ jid: J.id, page, html: messages.length, data: posts.length });
      continue;
    }
    pages.push({ jid: J.id, dir: J.dir || '', page, posts, messages, J });
  }
}

/* Pass 2 — classify every disagreement. */
for (const { jid, page, posts, messages, J } of pages) {
  const jrec = perJournal[jid] || (perJournal[jid] = {
    name: (parsed.journals.find(x => x.id === jid) || {}).name,
    pages: 0, postsAligned: 0, exact: 0, dropped: 0, reuse: 0,
    noLocal: 0, alreadyLinked: 0, shifted: 0, permuted: 0, heldElsewhere: 0, ambiguous: 0,
  });
  jrec.pages++;
  /* Everything the page's own posts already name, as file paths. A picture
   * present here is in the archive; if a message asks for it and the post
   * beside it holds it, the scrape put it on the wrong post — a different
   * defect from "the file was never recorded", and one that guessing at would
   * make worse. Such cases are counted and left alone. */
  const pageHeld = new Set();
  for (const p of posts) for (const x of (heldPaths.get(p.id) || [])) pageHeld.add(x);
  const journalHeld = journalHeldPaths.get(jid) || new Set();
  /* Local basename per message, in document order — the same currency on both
   * sides of the comparison. */
  const wantBases = messages.map(ms => ms.map(x => baseOf(x.local || x.name)));
  for (let i = 0; i < messages.length; i++) {
    alignment.messagesCompared++;
    jrec.postsAligned++;
    const post = posts[i];
    const htmlImgs = messages[i];
    const mine = heldPaths.get(post.id) || new Set();
    const have = heldOrder.get(post.id) || [];
    const want = wantBases[i];
    const same = want.length === have.length && want.every((b, i2) => b === have[i2]);
    if (same) { jrec.exact++; alignment.exactMatches++; continue; }
    /* If this post's recorded pictures are exactly the list belonging to the
     * message above or below, the two sides disagree about where a message
     * starts. Recovering into that post would paste the picture into the
     * wrong journal entry, so the whole message is parked and reported. */
    const eqList = (a, b) => a.length === b.length && a.every((x, i2) => x === b[i2]);
    if ((have.length && (eqList(have, wantBases[i - 1] || []) || eqList(have, wantBases[i + 1] || [])))) {
      alignment.shifted.push({ jid, page, postId: post.id, html: want, data: have });
      jrec.shifted++;
      continue;
    }
    /* Content decides everything here. `hash` in this archive is sha1 of the
     * file's bytes, so a candidate is "already in the journal" exactly when its
     * hash is one the journal lists — which also catches the case where the
     * scrape recorded the same bytes under another page's saved path, and where
     * a post already links the picture under a name that differs on disk. */
    for (const src of htmlImgs) {
      const rec = {
        jid, page, postId: post.id, name: src.name, order: src.order,
        url: src.url, local: src.local,
      };
      /* The saved `<img src>` is the first choice, and it is often a lie: the
       * browser wrote the forum's 404 page to disk under the attachment's name
       * and pointed the tag at that. A path only becomes a candidate once its
       * magic bytes say "picture"; otherwise the journal's own mirror folders
       * are asked, scoped to this journal, for the attachment's real filename. */
      let file = src.local && magicOf(src.local) ? src.local : null;
      if (!file) {
        const byName = resolveByName(J, src.name || path.basename(String(src.url || '').split('?')[0]), page);
        if (byName.file) {
          rec.via = 'journal-mirror';
          rec.mirrorPage = byName.mirrorPage;
          file = byName.file;
          rec.local = file;
          alignment.mirrorResolved++;
        } else if (byName.ambiguous) {
          rec.variants = byName.ambiguous;
          alignment.ambiguous.push(rec); jrec.ambiguous++;
          continue;
        }
      }
      if (!file) {
        rec.why = src.local ? 'saved-copy-is-a-404-stub' : 'never-mirrored';
        alignment.noLocalCopy.push(rec); jrec.noLocal++;
        continue;
      }
      const p = normPath(file);
      const sh = digestOf(file);
      rec.sha1 = sh;
      try { rec.size = fs.statSync(file).size; } catch { /* unreadable */ }
      if (sh && (postHashes.get(post.id) || new Set()).has(sh)) {
        alignment.alreadyLinked++; jrec.alreadyLinked++; continue;
      }
      if (sh && (journalHeldHashes.get(jid) || new Set()).has(sh)) {
        /* Same bytes, same journal, a different post lists it — usually a
         * reposted screenshot or an attachment the browser saved once. Nothing
         * has to be downloaded or encoded: the existing asset is referenced. */
        rec.hash = sh;
        rec.heldBy = [...(postsByHash.get(sh) || [])].find(x => x !== post.id) || '';
        alignment.reuse.push(rec); jrec.reuse++; continue;
      }
      if (p && pageHeld.has(p)) { alignment.permuted.push(rec); jrec.permuted++; continue; }
      if (p && journalHeld.has(p)) { alignment.heldElsewhere.push(rec); jrec.heldElsewhere++; continue; }
      alignment.dropped.push(rec); jrec.dropped++;
    }
  }
}

/* --------------------------------------------------- dead remote links -----
 * 376 image records point straight at readthemarket.com, and that host answers
 * 410 Gone for every attachment, so the reader shows nothing where the forum
 * showed a chart. The bytes are not lost, though: the browser that saved each
 * page kept what it rendered, and the same filename is sitting inside that
 * journal's own `_files` folder. Resolved by the same rule as everything else —
 * one journal, one name, one content hash, whole file — the record then becomes
 * an ordinary local one in --apply, with its asset and thumbnail built exactly
 * like a scraped pair. */
const remote = { records: [], held: [], ambiguous: [], missing: [] };
for (const J of parsed.journals) {
  const localHashes = new Set((J.images || []).filter(x => x.type !== 'remote' && x.hash).map(x => x.hash));
  (J.images || []).forEach((im, i) => {
    if (im.type !== 'remote') return;
    const nm = String(im.originalName || path.basename(String(im.src || '').split('?')[0])).toLowerCase();
    const hit = resolveByName(J, nm, im.pageNum);
    const rec = {
      jid: J.id, i, key: im.hash, postId: im.postId, page: im.pageNum,
      name: nm, url: im.src,
    };
    if (!hit.file) {
      const list = mirrorFor(J).get(nm) || [];
      rec.copies = list.length;
      rec.nameIsInFolder = (mirrorRaw.get(J.id) || new Set()).has(nm);
      rec.sizes = list.slice(0, 4).map(x => fs.existsSync(x.path) ? fs.statSync(x.path).size : -1);
      rec.kinds = list.slice(0, 4).map(x => magicOf(x.path) || 'no-magic');
      if (hit.ambiguous) rec.variants = hit.ambiguous;
      remote[hit.ambiguous ? 'ambiguous' : 'missing'].push(rec);
      return;
    }
    if (!wholeOf(hit.file)) { remote.missing.push({ ...rec, why: 'only-copy-is-header-only' }); return; }
    rec.file = hit.file;
    rec.hash = hit.sha1;
    rec.mirrorPage = hit.mirrorPage;
    /* A journal can already hold these bytes as a proper local record — then
     * only the post pointer needs moving, and no second copy is encoded. */
    if (localHashes.has(hit.sha1)) remote.held.push(rec);
    else { remote.records.push(rec); localHashes.add(hit.sha1); }
  });
}

/* ------------------------------------------------------------------ report */

function finish() {
fs.writeFileSync(REPORT, JSON.stringify({ mode: MODE, alignment, remote, perJournal }, null, 1));

const pad = (s, n) => String(s) + ' '.repeat(Math.max(0, n - String(s).length));
console.log('asset recovery — mode: ' + MODE);
console.log('  pages compared            ' + alignment.pagesCompared);
console.log('  messages compared         ' + alignment.messagesCompared);
console.log('  message count differs     ' + alignment.mismatched.length + '  (page skipped, never guessed)');
console.log('  image lists match exactly ' + alignment.exactMatches);
console.log('  already linked by content ' + alignment.alreadyLinked + '  (post names the same bytes; nothing to do)');
console.log('  list is the neighbour’s   ' + alignment.shifted.length + '  (post skipped, never guessed)');
console.log('  dropped, local copy FOUND ' + alignment.dropped.length);
console.log('  dropped, no local copy    ' + alignment.noLocalCopy.length);
console.log('  on another post, same pg  ' + alignment.permuted.length + '  (already in the archive; left alone)');
console.log('  repost of held bytes      ' + alignment.reuse.length + '  (same sha1 in this journal; link only, no new file)');
console.log('  on another page, unproved ' + alignment.heldElsewhere.length + '  (left alone)');
console.log('  rescued from a sibling page folder, same name & bytes ' + alignment.mirrorResolved);
console.log('  same name, different bytes ' + alignment.ambiguous.length + '  (coin toss; left alone)');
const why = {};
for (const x of alignment.noLocalCopy) why[x.why || 'unknown'] = (why[x.why || 'unknown'] || 0) + 1;
console.log('  unrecoverable reasons     ' + Object.entries(why).map(([k, v]) => k + '=' + v).join('  '));
console.log('');
console.log('remote records whose bytes the mirror does hold  ' + (remote.records.length + remote.held.length));
console.log('  needs a new asset+thumb pair  ' + remote.records.length);
console.log('  journal already has the bytes ' + remote.held.length + '  (pointer moves only)');
console.log('  nothing usable on disk        ' + remote.missing.length);
console.log('  same name, two whole copies   ' + remote.ambiguous.length + '  (left alone)');
const rj = {};
for (const r of [...remote.records, ...remote.held]) rj[r.jid] = (rj[r.jid] || 0) + 1;
console.log('  by journal                    ' + Object.entries(rj).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + '=' + v).join('  '));
console.log('');
console.log('per journal (pages / aligned / exact / already / dropped / reuse / ambigu / no-local):');
for (const [jid, j] of Object.entries(perJournal).sort((a, b) =>
  (b[1].dropped + b[1].reuse + b[1].ambiguous) - (a[1].dropped + a[1].reuse + a[1].ambiguous))) {
  if (!j.dropped && !j.reuse && !j.ambiguous && !j.noLocal) continue;
  console.log('  ' + pad(jid, 14) + pad(j.pages, 7) + pad(j.postsAligned, 7) + pad(j.exact, 7) +
    pad(j.alreadyLinked, 7) + pad(j.dropped, 7) + pad(j.reuse, 6) + pad(j.ambiguous, 7) + j.noLocal);
}
console.log('\nsample of references that need a new asset:');
for (const d of alignment.dropped.slice(0, 12)) {
  console.log('  ' + d.jid + ' p' + d.page + ' ' + d.postId + '  ' + d.name + (d.via ? '   [from mirror p' + d.mirrorPage + ']' : ''));
  console.log('      local: ' + d.local);
}
console.log('\nsample of references that only need linking:');
for (const d of alignment.reuse.slice(0, 12)) {
  console.log('  ' + d.jid + ' p' + d.page + ' ' + d.postId + '  ' + d.name +
    '  -> hash ' + String(d.hash).slice(0, 10) + ' held by ' + (d.heldBy || '?') + (d.via ? '  [from mirror p' + d.mirrorPage + ']' : ''));
}
console.log('\ndistinct files behind those references: ' + new Set(alignment.dropped.map(d => normPath(d.local))).size);
console.log('\nsample of dead URLs resolved to bytes on disk:');
for (const d of remote.records.slice(0, 8)) {
  console.log('  ' + d.jid + ' p' + d.page + ' ' + d.name + '  [mirror p' + d.mirrorPage + ']');
  console.log('      was: ' + d.url);
  console.log('      now: ' + d.file);
}
console.log('wrote ' + path.relative(ROOT, REPORT));
}

/* ------------------------------------------------------------------ apply */


/* The archive's own naming rule, verified on a 400-file sample: the full asset
 * is `<sha1 of its bytes>.<real extension>`, and the thumbnail reuses that same
 * hash with `.webp`. Following the rule keeps recovered files indistinguishable
 * from scraped ones, so nothing downstream needs a special case. */
/* Taken from build-data.js makeThumb(), verbatim, so a recovered thumbnail is
 * encoded exactly like a scraped one and the two are not distinguishable by
 * size, quality or orientation handling. */
const ThumbWidth = 760;
const ThumbQuality = 80;
const ThumbEffort = 4;

/* parsed.json is the source; site/data/journals/*.js, index.js, posts.js and
 * search.js are all generated from it by build-site.js. Patching the generated
 * files would mean the next build silently throws the recovered pictures away,
 * and it would leave the per-post image counts in posts.js and the per-journal
 * totals in index.js disagreeing with the journal cache. So the recovery is
 * written into the source object the alignment loop already read, once, and the
 * ordinary build re-derives every artifact from it. */
async function applyRecoveries() {
  const jById = new Map(parsed.journals.map(j => [j.id, j]));
  const postIndex = new Map();
  for (const j of parsed.journals) for (const p of j.posts || []) postIndex.set(p.id, { jid: j.id, post: p });

  /* Per-journal hash sets read from the source: "already recorded" has to be
   * asked of the right journal, because the same attachment can legitimately
   * appear in two of them. */
  const journalKeys = new Map();
  for (const j of parsed.journals) journalKeys.set(j.id, new Set((j.images || []).map(x => x.hash)));

  const stats = {
    candidates: alignment.dropped.length,
    repostCandidates: alignment.reuse.length,
    written: 0, thumbnailed: 0, alreadyPresent: 0,
    imageRecordsAdded: 0, postReferencesAdded: 0, sameNameDifferentBytes: 0,
    reuseLinked: 0, reuseAlreadyLinked: 0,
    remoteCandidates: remote.records.length + remote.held.length,
    remoteRecordsConverted: 0, remoteRelinkedOnly: 0, remotePointersMoved: 0,
    rejectedNotImage: 0, rejectedTruncated: 0, rejectedUndecodable: 0, rejectedUnmapped: 0,
  };
  const rejected = [];
  const log = [];
  const reuseLog = [];
  const created = new Set();

  /* One place decides whether a mirror file is fit to ship: magic bytes, then
   * the format's own terminator, then the thumbnail. Both the page-reference
   * loop below and the dead-remote loop use it, so a recovered pair is encoded
   * by exactly the archive's own rule and never by a second, softer one.
   * Returns null after recording the reason, so a caller cannot ship a partial. */
  async function stagePair(srcFile, base) {
    let buf;
    try { buf = fs.readFileSync(srcFile); }
    catch (e) {
      stats.rejectedUnmapped++;
      rejected.push({ ...base, local: srcFile, why: 'unreadable-source', err: String(e.message).split('\n')[0] });
      return null;
    }
    const kind = magicKind(buf);
    if (!kind) {
      stats.rejectedNotImage++;
      rejected.push({ ...base, local: srcFile, why: 'not-an-image', bytes: buf.length, firstBytes: buf.slice(0, 16).toString('latin1').replace(/[^\x20-\x7e]/g, '.') });
      return null;
    }
    /* The same 2021 downloader that cut BSZinaction3.jpg in half cut others too,
     * and those partial files are sitting in the `_files` folders. Adding one to
     * a post would trade "no picture" for "half a picture" — worse, because the
     * reader would not know. They are refused and listed. */
    if (!isWhole(buf, kind)) {
      stats.rejectedTruncated++;
      rejected.push({ ...base, local: srcFile, why: 'truncated-source', bytes: buf.length });
      return null;
    }
    const key = sha1Of(srcFile);
    const fullRel = 'assets/images/' + key + '.' + kind;
    const thumbRel = 'assets/thumbs/' + key + '.webp';
    const fullAbs = path.join(SITE, fullRel.replace(/\//g, path.sep));
    const thumbAbs = path.join(SITE, thumbRel.replace(/\//g, path.sep));

    if (!fs.existsSync(fullAbs)) { fs.writeFileSync(fullAbs, buf); created.add(fullAbs); stats.written++; }
    else stats.alreadyPresent++;

    let meta = headerDims(buf, kind);
    if (!fs.existsSync(thumbAbs)) {
      try {
        const m = await sharp(buf, { failOn: 'none' }).metadata();
        if (m.width) meta = { width: m.width, height: m.height };
        const w = meta.width || 0, h = meta.height || 0;
        if (!w || !h) throw new Error('no-dimensions');
        const out = await sharp(buf, { failOn: 'none' })
          .rotate()
          .resize({ width: ThumbWidth, height: ThumbWidth, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: ThumbQuality, effort: ThumbEffort })
          .toBuffer();
        if (!out || out.length < 300) throw new Error('thumb-too-small:' + (out ? out.length : 0));
        fs.writeFileSync(thumbAbs, out);
        created.add(thumbAbs);
        stats.thumbnailed++;
      } catch (e) {
        /* Whole by our marker test but still refused by the decoder: the file
         * goes back, and the post does not get a reference to a picture we
         * cannot render at grid size. */
        stats.rejectedUndecodable++;
        rejected.push({ ...base, local: srcFile, why: 'decoder-rejected', err: String(e.message).split('\n')[0] });
        for (const f of [thumbAbs, fullAbs]) {
          if (created.has(f)) { try { fs.unlinkSync(f); created.delete(f); } catch { /* already gone */ } }
        }
        return null;
      }
    }
    return { buf, key, kind, meta, fullRel, thumbRel };
  }

  for (const rec of alignment.dropped) {
    const J = jById.get(rec.jid);
    const target = postIndex.get(rec.postId);
    /* A record whose post is not in the source would add a file nothing points
     * at. Checked before any write, not after. */
    if (!J || !target) {
      stats.rejectedUnmapped++;
      rejected.push({ jid: rec.jid, postId: rec.postId, name: rec.name, local: rec.local, why: 'post-not-in-parsed' });
      continue;
    }
    const staged = await stagePair(rec.local, { jid: rec.jid, postId: rec.postId, name: rec.name });
    if (!staged) continue;
    const { buf, key, kind, meta, fullRel, thumbRel } = staged;

    const mine = journalKeys.get(rec.jid);
    /* Informational, not a gate: when a file already recorded under this saved
     * name has different bytes, the mirror holds another version of the same
     * picture. Both are whole files, so both ship — the count just tells us how
     * much of the recovery is genuinely new imagery rather than a second copy. */
    const heldUnderThisName = baseToHashes.get(baseOf(rec.local));
    const nameConflict = !!(heldUnderThisName && !heldUnderThisName.has(key));
    if (nameConflict) stats.sameNameDifferentBytes++;
    if (!mine.has(key)) {
      J.images = J.images || [];
      const rel = path.relative(path.join(ROOT, J.dir || ''), rec.local).replace(/\\/g, '/');
      J.images.push({
        key, type: 'local',
        src: rel.startsWith('..') ? path.basename(rec.local) : rel,
        localPath: rec.local,
        hash: key,
        asset: fullRel,
        thumb: thumbRel,
        width: meta.width, height: meta.height,
        bytes: buf.length,
        /* The attachment name from the page's own href — "gbpusd.mdaily1.png",
         * which tells the reader the instrument and the timeframe — rather than
         * whatever name the 2021 browser save happened to give the copy. The
         * saved path stays recorded above, so the provenance is not lost. */
        originalName: rec.name,
        journalId: rec.jid,
        pageNum: rec.page,
        postId: rec.postId,
        recovered: recoveredOn,
      });
      mine.add(key);
      stats.imageRecordsAdded++;
    }

    const im = target.post.images || (target.post.images = []);
    if (!im.includes(key)) {
      const at = Math.max(0, Math.min(rec.order == null ? im.length : rec.order, im.length));
      im.splice(at, 0, key);
      stats.postReferencesAdded++;
    }
    log.push({ jid: rec.jid, postId: rec.postId, name: rec.name, key, w: meta.width, h: meta.height, bytes: buf.length, kind, sameNameDifferentBytes: nameConflict });
  }

  /* The proven reposts: the asset is already in the journal, only the second
   * post lost its link to it. Reference it; no file is written, no record is
   * added, and the reader now sees under this post what the forum showed. */
  for (const rec of alignment.reuse) {
    const target = postIndex.get(rec.postId);
    const J = jById.get(rec.jid);
    if (!target || !J) { stats.rejectedUnmapped++; continue; }
    if (!(J.images || []).some(x => x.hash === rec.hash)) {
      /* The proof said the journal holds it; if the record is not there after
       * all, refusing is safer than pointing a post at a missing asset. */
      stats.rejectedUnmapped++;
      rejected.push({ jid: rec.jid, postId: rec.postId, name: rec.name, local: rec.local, why: 'reuse-hash-not-in-journal', hash: rec.hash });
      continue;
    }
    const im = target.post.images || (target.post.images = []);
    if (im.includes(rec.hash)) { stats.reuseAlreadyLinked++; continue; }
    const at = Math.max(0, Math.min(rec.order == null ? im.length : rec.order, im.length));
    im.splice(at, 0, rec.hash);
    stats.reuseLinked++;
    reuseLog.push({ jid: rec.jid, postId: rec.postId, name: rec.name, key: rec.hash, heldBy: rec.heldBy });
  }

  /* Dead remote links. The record was written as a bare URL because the 2021
   * batch downloader never fetched it, while the browser that saved the page
   * kept the bytes inside this journal's own `_files` folder. Build the pair,
   * rewrite the record into an ordinary local one, and move every post pointer
   * from the `remote_…` id onto the content hash, so the archive keeps a single
   * identity rule. Where the journal already holds those bytes as a local
   * record, only the pointers move. */
  function relinkPosts(J, oldKey, newKey) {
    let moved = 0;
    for (const p of J.posts || []) {
      const list = p.images;
      if (!Array.isArray(list) || !list.includes(oldKey)) continue;
      const out = [];
      for (const h of list) {
        if (h !== oldKey) { out.push(h); continue; }
        moved++;
        if (!out.includes(newKey)) out.push(newKey);
      }
      p.images = out;
    }
    return moved;
  }

  const remoteLog = [];
  for (const rec of remote.records) {
    const J = jById.get(rec.jid);
    const im = J && (J.images || [])[rec.i];
    /* The index was taken before anything was written. Confirm the record is
     * still the one that was classified: an id that no longer matches is a
     * change nobody made here, and editing it would be guessing. */
    if (!im || im.type !== 'remote' || im.hash !== rec.key) {
      stats.rejectedUnmapped++;
      rejected.push({ jid: rec.jid, postId: rec.postId, name: rec.name, local: rec.file, why: 'remote-record-moved' });
      continue;
    }
    const staged = await stagePair(rec.file, { jid: rec.jid, postId: rec.postId, name: rec.name });
    if (!staged) continue;
    if (staged.key !== rec.hash) {
      /* The bytes changed between classification and write — refuse rather than
       * leave a pointer at a hash that names something else. */
      stats.rejectedUnmapped++;
      rejected.push({ jid: rec.jid, postId: rec.postId, name: rec.name, local: rec.file, why: 'content-changed-since-classification', was: rec.hash, now: staged.key });
      continue;
    }
    const rel = path.relative(path.join(ROOT, J.dir || ''), rec.file).replace(/\\/g, '/');
    im.remoteSrc = im.src;
    im.type = 'local';
    im.key = staged.key;
    im.hash = staged.key;
    im.src = rel.startsWith('..') ? path.basename(rec.file) : rel;
    im.localPath = rec.file;
    im.asset = staged.fullRel;
    im.thumb = staged.thumbRel;
    im.width = staged.meta.width;
    im.height = staged.meta.height;
    im.bytes = staged.buf.length;
    im.pageNum = rec.page;
    im.postId = rec.postId;
    im.recovered = recoveredOn;
    const moved = relinkPosts(J, rec.key, staged.key);
    stats.remoteRecordsConverted++;
    stats.remotePointersMoved += moved;
    remoteLog.push({ jid: rec.jid, postId: rec.postId, name: rec.name, key: staged.key, pointers: moved, asset: staged.fullRel, w: staged.meta.width, h: staged.meta.height });
  }
  for (const rec of remote.held) {
    const J = jById.get(rec.jid);
    const im = J && (J.images || [])[rec.i];
    if (!im || im.hash !== rec.key) {
      stats.rejectedUnmapped++;
      rejected.push({ jid: rec.jid, postId: rec.postId, name: rec.name, why: 'remote-record-moved' });
      continue;
    }
    if (!(J.images || []).some(x => x !== im && x.type !== 'remote' && x.hash === rec.hash)) {
      stats.rejectedUnmapped++;
      rejected.push({ jid: rec.jid, postId: rec.postId, name: rec.name, local: rec.file, why: 'held-hash-has-no-local-record', hash: rec.hash });
      continue;
    }
    const moved = relinkPosts(J, rec.key, rec.hash);
    stats.remoteRelinkedOnly++;
    stats.remotePointersMoved += moved;
    remoteLog.push({ jid: rec.jid, postId: rec.postId, name: rec.name, key: rec.hash, pointers: moved, alreadyHeld: true });
  }

  if (log.length || reuseLog.length || remoteLog.length) {
    fs.mkdirSync(path.dirname(PARSED_BACKUP), { recursive: true });
    if (!fs.existsSync(PARSED_BACKUP)) fs.copyFileSync(PARSED, PARSED_BACKUP);
    parsed.stats = parsed.stats || {};
    /* Cumulative, read back off the source instead of taken from this run's
     * log. A second apply used to overwrite the first apply's numbers with
     * zeroes, so the manifest claimed nothing had been recovered while 349
     * records carried the flag. */
    let flagged = 0, fromRemote = 0, recordCount = 0, refCount = 0;
    for (const J of parsed.journals) {
      for (const im of J.images || []) {
        recordCount++;
        if (im.recovered) { flagged++; if (im.remoteSrc) fromRemote++; }
      }
      for (const q of J.posts || []) refCount += (q.images || []).length;
    }
    parsed.stats.recoveredOn = recoveredOn;
    parsed.stats.recoveredRecords = flagged;
    parsed.stats.recoveredFromRemoteLinks = fromRemote;
    parsed.stats.imageRecords = recordCount;
    parsed.stats.postImageReferences = refCount;
    fs.writeFileSync(PARSED, JSON.stringify(parsed));
  }
  return { stats, log, reuseLog, remoteLog, rejected };
}

if (MODE === 'apply') {
  applyRecoveries().then(res => {
    fs.writeFileSync(REPORT, JSON.stringify({
      mode: MODE, apply: res.stats, alignment, remote, perJournal,
      applied: res.log, repostLinks: res.reuseLog, remoteFixed: res.remoteLog,
      rejected: res.rejected,
    }, null, 1));
    console.log('\nAPPLIED into ' + path.relative(ROOT, PARSED));
    for (const [k, v] of Object.entries(res.stats)) console.log('  ' + k.padEnd(24) + v);
    console.log('  rejected listed       ' + res.rejected.length);
    console.log('  source backup       ' + path.relative(ROOT, PARSED_BACKUP));
    console.log('  next step           node _build/build-site.js');
    console.log('  wrote ' + path.relative(ROOT, REPORT));
    process.exit(0);
  }).catch(e => { console.error('apply failed: ' + (e && e.stack || e)); process.exit(1); });
} else {
  finish();
}

