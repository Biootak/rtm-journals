#!/usr/bin/env node
/*
 * The chart images are ~2.3 GB, so they are not stored in git. They live in
 * the "assets-v1" GitHub Release of this repository as four parts, uploaded
 * as 64 MB chunks so a dropped connection only costs one chunk:
 *
 *   assets-v6-part1.tar.gz.000 .. assets-v6-part4.tar.gz.00N
 *
 * The downloader resumes a partial chunk with an HTTP Range request, retries
 * a failed chunk three times, concatenates the chunks, verifies the pinned
 * SHA-256 of the whole part and only then unpacks it into site/. Every part
 * probes one file, so a re-run after a successful extraction downloads
 * nothing.
 *
 * Every full-size plate was re-encoded to WebP q85, so this single bundle set
 * replaces the old v1/v3/v4 chain — a fresh checkout needs nothing else.
 *
 * Run once after cloning (and again only if a part changes).
 */
import { createWriteStream, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync, createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { get } from 'node:https';

const RELEASE = 'https://github.com/Biootak/rtm-journals/releases/download/assets-v1';
/* What a complete unpack holds — the whole assets/images + assets/thumbs
 * trees, including the few GIFs and corrupt originals that stay as-is. */
const EXPECTED = { images: 32544, thumbs: 32408 };
const PARTS = [
  { name: 'assets-v6-part1.tar.gz', chunks: 9, sha: '0a0d99cdbfd0d6dab593da8a74ce4f3a67351b3b382cd34faf7689770aa0597e', probe: 'assets/images/000098e948a7607dc6ae5882eca7f0e13559ca9e.webp' },
  { name: 'assets-v6-part2.tar.gz', chunks: 9, sha: 'a9649998a86f90c3ecbaf8a917e5dea8353b9c8299aaf2032bff91e2349e8468', probe: 'assets/images/5818d67c478ad22c.webp' },
  { name: 'assets-v6-part3.tar.gz', chunks: 9, sha: '1d4df2942018e66955fdf8630870bdaed269f0faee4480a31e764756b85f7af2', probe: 'assets/images/b09c383af9640ce1a0a2558306d9164cb4b944e5.webp' },
  { name: 'assets-v6-part4.tar.gz', chunks: 10, sha: '8a612cef4defcad48193fa7980c13daaece01e97aa55080b0b4901ebae22fda7', probe: 'assets/thumbs/18fc0145694504b27393dfc76463ca4770fcf75f.webp' },
];

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'site');
const cacheDir = join(root, '.assets-cache');
const force = process.argv.includes('--force');

const count = (dir) => {
  try { return readdirSync(dir).length; } catch { return 0; }
};

if (!force &&
    count(join(site, 'assets', 'images')) === EXPECTED.images &&
    count(join(site, 'assets', 'thumbs')) === EXPECTED.thumbs) {
  console.log('assets already present — nothing to do');
  process.exit(0);
}

/* A chunk is downloaded to `<chunk>.part`; when the process dies the next run
 * asks the server for the missing byte range instead of starting over. The
 * redirect to objects.githubusercontent.com keeps the same headers. */
function downloadChunk(url, dest, redirects = 5) {
  const partial = dest + '.part';
  let start = 0;
  try { start = statSync(partial).size; } catch { /* fresh chunk */ }
  const headers = { 'user-agent': 'rtm-journals-fetch' };
  if (start > 0) headers.range = `bytes=${start}-`;
  return new Promise((resolvePromise, reject) => {
    get(url, { headers }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        res.resume();
        return resolvePromise(downloadChunk(new URL(res.headers.location, url).toString(), dest, redirects - 1));
      }
      if (res.statusCode === 416 && start > 0) {
        res.resume();
        renameSync(partial, dest);
        return resolvePromise();
      }
      if (res.statusCode !== 200 && res.statusCode !== 206) {
        res.resume();
        return reject(new Error(`download failed: HTTP ${res.statusCode} for ${url}`));
      }
      const append = res.statusCode === 206 && start > 0;
      const out = createWriteStream(partial, { flags: append ? 'a' : 'w' });
      res.pipe(out);
      out.on('finish', () => { renameSync(partial, dest); resolvePromise(); });
      out.on('error', reject);
      res.on('error', reject);
    }).on('error', reject);
  });
}

const sha256 = (file) => new Promise((resolvePromise, reject) => {
  const h = createHash('sha256');
  createReadStream(file)
    .on('data', (d) => h.update(d))
    .on('end', () => resolvePromise(h.digest('hex')))
    .on('error', reject);
});

const extract = (file, what) => {
  const tar = spawnSync('tar', ['-xzf', file, '-C', site], { stdio: 'inherit' });
  if (tar.status !== 0) {
    throw new Error(`extraction failed — ${what} (tar is required; Windows 10+ and ubuntu-latest both ship it)`);
  }
};

const concat = (chunks, dest) => new Promise((resolvePromise, reject) => {
  const out = createWriteStream(dest);
  out.on('error', reject);
  out.on('finish', resolvePromise);
  (async () => {
    for (const chunk of chunks) {
      await new Promise((done, fail) => {
        const rs = createReadStream(chunk);
        rs.on('error', fail);
        rs.on('end', done);
        rs.pipe(out, { end: false });
      });
    }
    out.end();
  })().catch(reject);
});

mkdirSync(cacheDir, { recursive: true });

for (const part of PARTS) {
  /* A part counts as applied when any file it ships is already unpacked —
   * extraction is idempotent, so a re-run never re-downloads 2.3 GB. */
  if (!force && existsSync(join(site, part.probe))) {
    console.log(`${part.name} already applied — skipping`);
    continue;
  }
  const file = join(cacheDir, part.name);
  const chunkDir = join(cacheDir, part.name + '.chunks');
  mkdirSync(chunkDir, { recursive: true });
  const chunks = [];
  for (let i = 0; i < part.chunks; i++) {
    const nn = String(i).padStart(3, '0');
    const dest = join(chunkDir, `${part.name}.${nn}`);
    chunks.push(dest);
    if (!force && existsSync(dest)) continue;
    let done = false;
    for (let attempt = 1; attempt <= 3 && !done; attempt++) {
      try {
        console.log(`downloading ${part.name}.${nn} (${i + 1}/${part.chunks}, attempt ${attempt})…`);
        await downloadChunk(`${RELEASE}/${part.name}.${nn}`, dest);
        done = true;
      } catch (e) {
        if (attempt === 3) throw e;
        console.warn(`  attempt ${attempt} failed: ${e.message} — retrying`);
      }
    }
  }
  console.log(`joining ${part.chunks} chunks into ${part.name}…`);
  await concat(chunks, file);
  const hash = await sha256(file);
  if (hash !== part.sha) {
    throw new Error(`checksum mismatch for ${part.name}\nexpected ${part.sha}\ngot      ${hash}`);
  }
  console.log('checksum ok');
  extract(file, part.name);
  rmSync(file, { force: true });
  rmSync(chunkDir, { recursive: true, force: true });
}

const images = count(join(site, 'assets', 'images'));
const thumbs = count(join(site, 'assets', 'thumbs'));
console.log(`done: ${images} images, ${thumbs} thumbnails`);
if (images < EXPECTED.images || thumbs < EXPECTED.thumbs) {
  throw new Error('unexpected file counts after extraction');
}
