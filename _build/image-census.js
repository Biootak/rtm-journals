#!/usr/bin/env node
/*
 * image-census.js — the authoritative answer to "are all the images actually there?"
 *
 * The reader's `is-broken` state can only tell us about the one plate you are
 * looking at. This walks every image entry in every journal data file and
 * resolves it against the filesystem, so the count is corpus-wide and
 * reproducible. RD-38 / task #28.
 *
 * Reports, per asset class:
 *   thumb (webp, what the grid shows)   full (png, what the viewer shows)
 *   missing | zero-byte | truncated | undecodable
 *
 * "Undecodable" is checked by parsing the container headers, not by trusting
 * the byte count the build recorded: a file can be present and still be a
 * 404-page-in-disguise. A PNG needs its 8-byte signature plus an IHDR chunk we
 * can read dimensions out of; a WEBP needs RIFF....WEBP plus a readable VP8/
 * VP8L/VP8X frame. We also compare the dimensions in the header against the
 * `w`/`h` the build wrote into the data, because a mismatch means the caption
 * and the aspect-ratio box lie to the reader.
 *
 * Nothing here is a guess: every number printed is from stat() and readFileSync
 * on the real file.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = path.join(ROOT, 'site');
const DATA_DIR = path.join(SITE, 'data');
const OUT = path.join(ROOT, '_build', 'image-census.json');

/* ------------------------------------------------------------------ headers */

function sniffPng(buf) {
  if (buf.length < 24) return { ok: false, why: 'too-short' };
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) if (buf[i] !== sig[i]) return { ok: false, why: 'bad-signature' };
  const len = buf.readUInt32BE(8);
  const type = buf.toString('latin1', 12, 16);
  if (type !== 'IHDR' || len < 13) return { ok: false, why: 'no-IHDR' };
  return { ok: true, w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function sniffWebp(buf) {
  if (buf.length < 30) return { ok: false, why: 'too-short' };
  if (buf.toString('latin1', 0, 4) !== 'RIFF') return { ok: false, why: 'bad-signature' };
  if (buf.toString('latin1', 8, 12) !== 'WEBP') return { ok: false, why: 'bad-signature' };
  const fourcc = buf.toString('latin1', 12, 16);
  if (fourcc === 'VP8X') return { ok: true, w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
  if (fourcc === 'VP8 ') {
    // 12 VP8 | 16 size | 20 3-byte frame tag | 23 sync 9D 01 2A | 26 w16 | 28 h16
    if (buf[23] !== 0x9d || buf[24] !== 0x01 || buf[25] !== 0x2a) return { ok: false, why: 'no-lossy-start' };
    return { ok: true, w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  }
  if (fourcc === 'VP8L') {
    if (buf[20] !== 0x2f) return { ok: false, why: 'no-lossless-start' };
    const bits = buf.readUInt32LE(21);
    return { ok: true, w: 1 + (bits & 0x3fff), h: 1 + ((bits >> 14) & 0x3fff) };
  }
  return { ok: false, why: 'unknown-chunk:' + JSON.stringify(fourcc) };
}

function sniffJpeg(buf) {
  if (buf.length < 4) return { ok: false, why: 'too-short' };
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return { ok: false, why: 'bad-signature' };
  /* Walk the marker segments to the first SOF, which carries the dimensions.
   * Stops at EOI or any marker that is not a segment we can skip. */
  let p = 2;
  while (p + 4 < buf.length) {
    if (buf[p] !== 0xff) return { ok: false, why: 'no-marker-at-' + p };
    const m = buf[p + 1];
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { p += 2; continue; }
    const len = buf.readUInt16BE(p + 2);
    if ((m >= 0xc0 && m <= 0xcf) && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
      return { ok: true, h: buf.readUInt16BE(p + 5), w: buf.readUInt16BE(p + 7) };
    }
    p += 2 + len;
  }
  /* Ran out of header before an SOF. Still a valid-looking start, so grade it
   * as readable but dimensionless rather than broken. */
  return { ok: true, w: 0, h: 0 };
}

function sniffGif(buf) {
  const ver = buf.toString('latin1', 0, 6);
  if (ver !== 'GIF87a' && ver !== 'GIF89a') return { ok: false, why: 'bad-signature' };
  if (buf.length < 13) return { ok: false, why: 'too-short' };
  return { ok: true, w: buf.readUInt16LE(6), h: buf.readUInt16LE(8) };
}

/* Detect from bytes, never from the extension. RTM attachments are scraped from
 * a forum that renamed freely — a GIF stored as .png renders fine in the
 * browser but would be called "undecodable" by an extension-driven check, and
 * that false positive is exactly what sent 138 healthy files to the repair list
 * on the first run of this census. */
function sniffAny(buf) {
  const tries = [['png', sniffPng], ['webp', sniffWebp], ['gif', sniffGif], ['jpg', sniffJpeg]];
  for (const [kind, fn] of tries) {
    const r = fn(buf);
    if (r.ok) return Object.assign({ kind }, r);
  }
  return { ok: false, kind: 'unknown', why: 'no-known-signature' };
}

function sniff(buf, kind) {
  if (kind === 'webp') return sniffWebp(buf);
  if (kind === 'jpg') return sniffJpeg(buf);
  if (kind === 'gif') return sniffGif(buf);
  return sniffPng(buf);
}

function kindOf(rel) {
  const m = /\.(png|jpe?g|webp|gif)$/i.exec(rel || '');
  if (!m) return 'png';
  const e = m[1].toLowerCase();
  return e === 'jpeg' ? 'jpg' : e;
}

/* --------------------------------------------------------------- collection */

function loadJournal(file) {
  const src = fs.readFileSync(path.join(DATA_DIR, 'journals', file), 'utf8');
  const fakeWindow = {};
  // The data files assign to window.RTM_JOURNAL_CACHE; evaluate them against a
  // throwaway window rather than mutating this process's globals.
  const fn = new Function('window', src + '\nreturn window.RTM_JOURNAL_CACHE;');
  return fn(fakeWindow);
}

const journalFiles = fs.readdirSync(path.join(DATA_DIR, 'journals')).filter(f => f.endsWith('.js'));
const seen = new Map();            // kind + relpath -> aggregated record
const rows = [];                   // one per (journal, image occurrence)
let postsTotal = 0, postsWithImages = 0, refsTotal = 0;

for (const file of journalFiles) {
  const cache = loadJournal(file);
  for (const jid of Object.keys(cache)) {
    const J = cache[jid];
    const imageList = Array.isArray(J.images) ? J.images : Object.values(J.images || {});
    const byKey = new Map();
    for (const im of imageList) if (im && im.k) byKey.set(im.k, im);
    const postIndex = new Map((J.posts || []).map(p => [p.id, p]));
    for (const p of J.posts || []) {
      postsTotal++;
      if ((p.im || []).length) postsWithImages++;
      refsTotal += (p.im || []).length;
    }
    for (const im of imageList) {
      if (!im || !im.k) continue;
      const poster = postIndex.get(im.pid);
      rows.push({
        jid: J.id, jname: J.name, key: im.k,
        thumb: im.t, full: im.f,
        w: im.w || 0, h: im.h || 0, bytes: im.b || 0,
        name: im.o || '', page: im.p || 0,
        postId: im.pid || '', postHasFa: !!(poster && poster.fa),
      });
    }
  }
}

/* ----------------------------------------------------------------- resolve */

function checkRow(rel, kind) {
  if (!rel) return { state: 'no-path' };
  const abs = path.join(SITE, rel.replace(/\//g, path.sep));
  let st;
  try { st = fs.statSync(abs); } catch { return { state: 'missing', abs }; }
  if (!st.isFile()) return { state: 'not-a-file', abs };
  if (st.size === 0) return { state: 'zero-byte', abs, size: 0 };
  let head = null;
  let fd = null;
  try {
    fd = fs.openSync(abs, 'r');
    /* 512 bytes: a JPEG with a full EXIF/ICC preamble can put its SOF marker
     * well past the first 64, and sniffing short would call it undecodable. */
    head = Buffer.alloc(Math.min(512, st.size));
    fs.readSync(fd, head, 0, head.length, 0);
  } catch (e) {
    return { state: 'unreadable', abs, size: st.size, why: String(e.code || e) };
  } finally {
    if (fd !== null) { try { fs.closeSync(fd); } catch { /* already closed */ } }
  }
  const sn = sniffAny(head);
  if (!sn.ok) return { state: 'undecodable', abs, size: st.size, why: sn.why, extKind: kind, kind: 'unknown' };
  const real = sn.kind;
  const extLie = real !== kind;
  if (real === 'webp') {
    // A container that announces more bytes than the file holds is a truncated
    // download — very common for images cut off mid-transfer.
    const declared = head.readUInt32LE(4) + 8;
    if (declared > st.size + 4096) {
      return { state: 'truncated', abs, size: st.size, why: 'riff-len-exceeds-file', wants: declared, w: sn.w, h: sn.h, kind: real };
    }
  } else if (real === 'png' || real === 'jpg') {
    /* Both close their stream with an explicit end marker: the IEND chunk for
     * PNG, FFD9 for JPEG. Search the last 64 bytes rather than a fixed offset:
     * the 2021 scrape ran through a text-mode transfer that appended a stray
     * CRLF to some files, and a strict "IEND must be the final chunk" rule
     * called those complete images corrupt on the first run of this census.
     * Trailing padding is cosmetic; a missing end marker is a cut download. */
    const tailLen = Math.min(64, st.size);
    const tail = Buffer.alloc(tailLen);
    const fd2 = fs.openSync(abs, 'r');
    try { fs.readSync(fd2, tail, 0, tailLen, st.size - tailLen); } finally { fs.closeSync(fd2); }
    let endAt = -1;
    if (real === 'png') {
      for (let i = tailLen - 12; i >= 0; i--) {
        if (tail[i] === 0 && tail[i + 1] === 0 && tail[i + 2] === 0 && tail[i + 3] === 0 &&
            tail.toString('latin1', i + 4, i + 8) === 'IEND') { endAt = i + 12; break; }
      }
    } else {
      for (let i = tailLen - 2; i >= 0; i--) {
        if (tail[i] === 0xff && tail[i + 1] === 0xd9) { endAt = i + 2; break; }
      }
    }
    if (endAt < 0) return { state: 'truncated', abs, size: st.size, why: 'no-end-marker', kind: real };
    const trailingBytes = tailLen - endAt;
    return { state: 'ok', abs, size: st.size, w: sn.w, h: sn.h, kind: real, extLie, trailingBytes };
  }
  return { state: 'ok', abs, size: st.size, w: sn.w, h: sn.h, kind: real, extLie };
}

/* The thumb is a downscaled copy, so its pixels are *expected* to differ from
 * the caption; what has to agree is the full asset's header against the `w`/`h`
 * the build wrote, because that pair drives the aspect-ratio box and the size
 * line the reader sees. */
for (const r of rows) {
  r.thumbCheck = checkRow(r.thumb, kindOf(r.thumb));
  r.fullCheck = checkRow(r.full, kindOf(r.full));
  r.dimMismatch = !!(r.fullCheck.w && r.w && r.h && (r.fullCheck.w !== r.w || r.fullCheck.h !== r.h));
}

/* Also inventory what is on disk but referenced by nobody — dead weight that
 * inflates the folder and hides the fact that something else is missing. */
const referenced = new Set();
for (const r of rows) { if (r.thumb) referenced.add(r.thumb); if (r.full) referenced.add(r.full); }
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}
const orphan = { thumbs: 0, images: 0, thumbBytes: 0, imageBytes: 0 };
for (const sub of ['thumbs', 'images']) {
  const dir = path.join(SITE, 'assets', sub);
  if (!fs.existsSync(dir)) continue;
  for (const f of walk(dir, [])) {
    const rel = 'assets/' + sub + '/' + path.basename(f);
    const size = fs.statSync(f).size;
    if (referenced.has(rel)) continue;
    if (sub === 'thumbs') { orphan.thumbs++; orphan.thumbBytes += size; }
    else { orphan.images++; orphan.imageBytes += size; }
  }
}

/* ------------------------------------------------------------------ report */

function tally(pred) { return rows.filter(pred).length; }
const bucket = {};
for (const r of rows) {
  const t = r.thumbCheck.state, f = r.fullCheck.state;
  bucket[t] = (bucket[t] || 0) + 1;
  bucket['full:' + f] = (bucket['full:' + f] || 0) + 1;
}

const badThumbs = rows.filter(r => r.thumbCheck.state !== 'ok');
const badFulls = rows.filter(r => r.fullCheck.state !== 'ok');
const dimMismatch = rows.filter(r => r.dimMismatch);
const kinds = {};
const extLies = {};
for (const r of rows) {
  const k = r.fullCheck.kind || kindOf(r.full);
  kinds[k] = (kinds[k] || 0) + 1;
  if (r.fullCheck.extLie) {
    const l = (r.fullCheck.extKind || kindOf(r.full)) + '→' + r.fullCheck.kind;
    extLies[l] = (extLies[l] || 0) + 1;
  }
}

/* Per-journal breakdown: one journal holding every broken file is a different
 * problem (a bad scrape) than the same rate spread over 24 (a systemic drop). */
const byJournal = {};
for (const r of rows) {
  const j = byJournal[r.jid] || (byJournal[r.jid] = { name: r.jname, images: 0, badThumb: 0, badFull: 0 });
  j.images++;
  if (r.thumbCheck.state !== 'ok') j.badThumb++;
  if (r.fullCheck.state !== 'ok') j.badFull++;
}

const summary = {
  generatedAt: new Date().toISOString(),
  journalFiles: journalFiles.length,
  posts: postsTotal,
  postsWithImages: postsWithImages,
  imageRefsInPosts: refsTotal,
  imageEntries: rows.length,
  distinctKeys: new Set(rows.map(r => r.key)).size,
  states: bucket,
  fullKinds: kinds,
  extensionLies: extLies,
  badThumb: badThumbs.length,
  badFull: badFulls.length,
  fullyUsable: rows.filter(r => r.thumbCheck.state === 'ok' && r.fullCheck.state === 'ok').length,
  dimMismatch: dimMismatch.length,
  trailingGarbage: rows.filter(r => r.fullCheck.trailingBytes > 0).length,
  orphanFiles: orphan,
};

/* The list the reader-facing layer needs: every key whose full asset is not a
 * complete file. Kept separate from the census blob so the site build can embed
 * it without dragging 6,473 rows along. */
const notched = rows.filter(r => r.fullCheck.state !== 'ok').map(r => ({
  key: r.key, jid: r.jid, postId: r.postId, name: r.name,
  full: r.full, thumb: r.thumb,
  state: r.fullCheck.state, why: r.fullCheck.why || '',
  size: r.fullCheck.size || 0, bytes: r.bytes,
}));

fs.writeFileSync(OUT, JSON.stringify({ summary, byJournal, notched, rows }, null, 1));

/* --write-integrity is the only mode that touches site/. By default this script
 * is read-only, so running the census can never change what the reader sees. */
const INTEGRITY_JS = path.join(SITE, 'data', 'integrity.js');
if (process.argv.includes('--write-integrity')) {
  const payload = {
    generatedAt: new Date().toISOString(),
    checked: rows.length,
    thumbOk: tally(r => r.thumbCheck.state === 'ok'),
    fullOk: tally(r => r.fullCheck.state === 'ok'),
    /* key -> short reason, in Persian, for the reader. */
    notched: {},
  };
  for (const n of notched) {
    payload.notched[n.key] = { reason: n.state === 'truncated' ? 'truncated' : 'unreadable', file: n.name, full: n.full, thumb: n.thumb };
  }
  fs.writeFileSync(INTEGRITY_JS,
    '/* Generated by _build/image-census.js --write-integrity. Do not hand-edit.\n' +
    ' * Asset-integrity facts measured from the files on disk, not from the build\n' +
    " * manifest: which full-size images will not open whole. */\n" +
    'window.RTM_ASSET_INTEGRITY = ' + JSON.stringify(payload, null, 1) + ';\n');
  console.log('  wrote ' + path.relative(ROOT, INTEGRITY_JS) + ' (' + notched.length + ' notched)');
}

/* Human read-out. */
const pad = (s, n) => String(s) + ' '.repeat(Math.max(0, n - String(s).length));
console.log('image census — ' + summary.journalFiles + ' journal files');
console.log('  entries            ' + summary.imageEntries + ' (' + summary.distinctKeys + ' distinct keys, ' + refsTotal + ' refs from posts)');
console.log('  thumb ok           ' + tally(r => r.thumbCheck.state === 'ok'));
for (const [k, v] of Object.entries(bucket)) {
  if (k.startsWith('full:')) continue;
  if (k === 'ok') continue;
  console.log('  thumb ' + pad(k, 14) + v);
}
console.log('  --- viewer (full asset) ---');
console.log('  formats             ' + Object.entries(kinds).map(([k, v]) => k + ':' + v).join('  '));
for (const [k, v] of Object.entries(bucket)) {
  if (!k.startsWith('full:')) continue;
  console.log('  ' + pad(k, 20) + v);
}
console.log('  header/caption dimension mismatch: ' + summary.dimMismatch);
const lieCount = Object.values(extLies).reduce((a, b) => a + b, 0);
console.log('  extension does not match contents: ' + lieCount +
  (lieCount ? ' (' + Object.entries(extLies).map(([k, v]) => k + ':' + v).join('  ') + ') — renders anyway, browsers sniff' : ''));
console.log('  orphan files on disk: ' + orphan.thumbs + ' thumbs, ' + orphan.images + ' fulls (' +
  Math.round((orphan.thumbBytes + orphan.imageBytes) / 1048576) + ' MB)');
console.log('  fully usable (thumb+full): ' + summary.fullyUsable + '/' + summary.imageEntries);
console.log('');
console.log('per journal (images / bad thumb / bad full):');
for (const [jid, j] of Object.entries(byJournal).sort((a, b) => b[1].badThumb + b[1].badFull - a[1].badThumb - a[1].badFull)) {
  if (!j.badThumb && !j.badFull) continue;
  console.log('  ' + pad(jid, 15) + pad(j.images, 6) + pad(j.badThumb, 6) + j.badFull);
}
console.log('\nwrote ' + path.relative(ROOT, OUT));
