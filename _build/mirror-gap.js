#!/usr/bin/env node
/*
 * mirror-gap.js — which pictures does the archive *reference* but not *hold*?
 *
 * image-census.js grades the 6,473 assets the site already knows about. It
 * cannot see a picture that was dropped during the 2021 save, because nothing
 * in site/data points at it any more. The only surviving record of those is the
 * saved forum pages themselves: 540 `... - Page N - RTM Community.html` files
 * and their `_files` folders, still on disk.
 *
 * This walks every saved page, pulls every image reference out of the markup,
 * and asks three questions of each one:
 *   1. is the local `_files` copy present next to the page?
 *   2. is it in site/assets/images (possibly renamed to its content sha1)?
 *   3. if neither, what was its original readthemarket.com URL?
 *
 * Question 3 matters because the forum now answers HTTP 410 Gone for every
 * attachment path, verified 2026-11-06:
 *   /media/kunena/attachments/790/BSZinaction3.jpg  -> 410
 *   /media/kunena/attachments/790/BSZinaction1.jpg  -> 410
 *   /media/kunena/attachments/7566/AboutPA.jpg      -> 410
 *   /index.php/en/forum                              -> 410
 *   /index.php/en/forum/journals/1/report/62020      -> 410
 * so "download and replace" has exactly one remaining source: the Wayback
 * Machine, which is queried per candidate by --try-archive.
 *
 * Read-only unless --try-archive is passed.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const SITE_IMAGES = path.join(ROOT, 'site', 'assets', 'images');
const OUT = path.join(ROOT, '_build', 'mirror-gap.json');
const TRY_ARCHIVE = process.argv.includes('--try-archive');
const LIMIT = Number(process.env.LIMIT || 40);

/* ------------------------------------------------- what the site already has */

const heldNames = new Set();
if (fs.existsSync(SITE_IMAGES)) {
  for (const f of fs.readdirSync(SITE_IMAGES)) heldNames.add(f);
}
/* The build also records each asset's original filename in the journal data, so
 * a file renamed to its content hash is still findable by its old name. */
const heldOriginals = new Set();
const DATA_DIR = path.join(ROOT, 'site', 'data', 'journals');
for (const file of fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
  const cache = new Function('window', src + '\nreturn window.RTM_JOURNAL_CACHE;')({});
  for (const jid of Object.keys(cache)) {
    for (const im of cache[jid].images || []) {
      if (im.o) heldOriginals.add(String(im.o).toLowerCase());
      if (im.f) heldOriginals.add(path.basename(im.f).toLowerCase());
    }
  }
}

const holds = name => heldNames.has(name) || heldOriginals.has(String(name).toLowerCase());

/* ------------------------------------------------------- the saved pages */

const pages = [];
(function collect(dir, depth) {
  if (depth > 1) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (e.name === 'site' || e.name === '_build' || e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    for (const f of fs.readdirSync(p)) {
      if (/ - Page \d+ - RTM Community\.html$/.test(f)) pages.push(path.join(p, f));
    }
    collect(p, depth + 1);
  }
})(ROOT, 0);
for (const f of fs.readdirSync(ROOT)) {
  if (/ - Page \d+ - RTM Community\.html$/.test(f)) pages.push(path.join(ROOT, f));
}
const uniquePages = [...new Set(pages)].sort();

const SRC_RE = /(?:src|data-original-url|data-src)\s*=\s*"([^"]+)"/gi;
const ABS_RE = /https?:\/\/[^"'\s<>]*?\/media\/kunena\/attachments\/[^"'\s<>]+/gi;

const refs = new Map();   // attachment basename -> record
function note(name, url, pagePath, localExists) {
  const key = name.toLowerCase();
  const r = refs.get(key) || refs.set(key, { name, urls: new Set(), pages: 0, localCopies: 0, held: holds(name) }).get(key);
  r.pages++;
  if (url) r.urls.add(url);
  if (localExists) r.localCopies++;
}

let scanned = 0;
for (const pagePath of uniquePages) {
  let html;
  try { html = fs.readFileSync(pagePath, 'utf8'); } catch { continue; }
  scanned++;
  const filesDir = pagePath.replace(/\.html$/, '_files');
  const hasDir = fs.existsSync(filesDir);
  let m;
  SRC_RE.lastIndex = 0;
  while ((m = SRC_RE.exec(html))) {
    const raw = m[1];
    let decoded;
    try { decoded = decodeURIComponent(raw); } catch { decoded = raw; }
    if (/^data:/i.test(decoded)) continue;
    const isAbs = /^https?:\/\//i.test(decoded);
    if (isAbs) {
      if (!/\/media\/kunena\/attachments\//i.test(decoded)) continue;
      note(path.posix.basename(decoded.split('?')[0]), decoded, pagePath, false);
      continue;
    }
    /* A relative reference is the save's own rewritten copy. */
    const bare = decoded.split('/').pop();
    if (!/\.(png|jpe?g|gif|webp)$/i.test(bare)) continue;
    const localAbs = path.join(path.dirname(pagePath), decoded.replace(/\//g, path.sep));
    const sibling = hasDir ? path.join(filesDir, bare) : '';
    const exists = fs.existsSync(localAbs) || (sibling && fs.existsSync(sibling));
    note(bare, null, pagePath, exists);
  }
  /* Absolute attachment URLs also survive inside the page's own text, links and
   * JS payloads, not only in src attributes. */
  ABS_RE.lastIndex = 0;
  while ((m = ABS_RE.exec(html))) note(path.posix.basename(m[0].split('?')[0]), m[0], pagePath, false);
}

/* ------------------------------------------------------------- the gap set */

const all = [...refs.values()].map(r => ({
  name: r.name,
  pages: r.pages,
  localCopies: r.localCopies,
  inSiteAssets: r.held,
  urls: [...r.urls].slice(0, 3),
}));
const missing = all.filter(r => !r.inSiteAssets && !r.localCopies);
const localOnly = all.filter(r => !r.inSiteAssets && r.localCopies);

/* -------------------------------------------------- archive.org, per candidate */

function get(url, headers = {}) {
  return new Promise(resolve => {
    const req = https.get(url, { headers: Object.assign({ 'user-agent': 'rtm-archive-integrity/1.0' }, headers), timeout: 25000 }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks), loc: res.headers.location || '' }));
    });
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: Buffer.alloc(0), loc: '', err: 'timeout' }); });
    req.on('error', e => resolve({ status: 0, body: Buffer.alloc(0), loc: '', err: String(e.code || e.message) }));
  });
}

const archiveResults = [];
async function probeArchive() {
  const queue = missing.filter(r => r.urls.length).slice(0, LIMIT);
  console.log('probing Wayback for ' + queue.length + ' missing attachments...');
  for (const r of queue) {
    const u = r.urls[0].replace(/^http:/, 'https:');
    const avail = await get('https://archive.org/wayback/available?url=' + encodeURIComponent(u));
    let snapshot = '';
    try {
      const j = JSON.parse(avail.body.toString('utf8'));
      snapshot = (j.archived_snapshots && j.archived_snapshots.closest && j.archived_snapshots.closest.url) || '';
    } catch { /* IA intermittently answers with an HTML "temporarily offline" page */ }
    archiveResults.push({ name: r.name, url: u, status: avail.status, snapshot: snapshot || null });
    process.stdout.write('.');
  }
  console.log('');
}
if (TRY_ARCHIVE) { /* probe runs before the report is written, see the bottom */ }

function finish() {
fs.writeFileSync(OUT, JSON.stringify({
  summary: {
    generatedAt: new Date().toISOString(),
    pagesScanned: scanned,
    distinctAttachmentsReferenced: all.length,
    presentInSiteAssets: all.filter(r => r.inSiteAssets).length,
    localCopyButNotInSite: localOnly.length,
    nowhereOnDisk: missing.length,
    withOriginalUrl: missing.filter(r => r.urls.length).length,
    archiveProbed: archiveResults.length,
    archiveHasSnapshot: archiveResults.filter(r => r.snapshot).length,
  },
  missing: missing.slice(0, 3000),
  localOnly: localOnly.slice(0, 1000),
  archiveResults,
}, null, 1));

const pad = (s, n) => String(s) + ' '.repeat(Math.max(0, n - String(s).length));
console.log('mirror gap — ' + scanned + ' saved pages read');
console.log('  distinct attachments referenced  ' + all.length);
console.log('  already in site/assets           ' + all.filter(r => r.inSiteAssets).length);
console.log('  on disk in a _files dir only     ' + localOnly.length);
console.log('  nowhere on disk                  ' + missing.length);
console.log('  ...of which we kept the URL      ' + missing.filter(r => r.urls.length).length);
if (archiveResults.length) {
  console.log('  Wayback snapshots found         ' + archiveResults.filter(r => r.snapshot).length + '/' + archiveResults.length);
  for (const a of archiveResults.filter(r => r.snapshot).slice(0, 12)) console.log('    ' + a.name + '  ' + a.snapshot);
}
console.log('\nworst 12 absent-from-everywhere attachments (by pages that mention them):');
for (const r of missing.sort((a, b) => b.pages - a.pages).slice(0, 12)) {
  console.log('  ' + pad(r.pages, 5) + pad(r.name, 42) + (r.urls[0] || '(no url kept)'));
}
console.log('\nwrote ' + path.relative(ROOT, OUT));
}

if (TRY_ARCHIVE) probeArchive().then(finish).catch(e => { console.error('archive probe failed: ' + e.message); finish(); });
else finish();
