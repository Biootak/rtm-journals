#!/usr/bin/env node
/*
 * The chart images are ~1.2 GB, so they are not stored in git. They live in the
 * "assets-v1" GitHub Release of this repository and are unpacked into site/:
 *
 *   assets-v1.tar.gz          the original archive (~900 MB)
 *   assets-delta-v3.tar.gz    only the charts added by later journals (~276 MB)
 *
 * Run once after cloning (and again only if a delta changes).
 */
import { createWriteStream, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync, createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { get } from 'node:https';

const RELEASE = 'https://github.com/Biootak/rtm-journals/releases/download';
const ASSET = 'assets-v1.tar.gz';
const ASSET_URL = `${RELEASE}/assets-v1/${ASSET}`;
const SHA256 = 'c099e6031b8377e307ff89f0412ac4c93695f33bf059c742ed2d530ebd108b15';
const BASE_COUNT = 6796;
const EXPECTED = { images: 32530, thumbs: 8804 };
const DELTA = 'assets-delta-v2.tar.gz';
/* The 276 MB delta is a Release asset too: a single git file must stay < 100 MB. */
const DELTA3 = 'assets-delta-v3.tar.gz';
const DELTA3_URL = `${RELEASE}/assets-v1/${DELTA3}`;
const DELTA3_SHA256 = '2b389e3ccc9c14f2c30ef64f95dce5c67db91a62f2d8608da2cfa1cb561d771b';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'site');
const cacheDir = join(root, '.assets-cache');
const cacheFile = join(cacheDir, ASSET);
const deltaFile = join(root, DELTA);
const delta3File = join(cacheDir, DELTA3);
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

const basePresent = !force && count(join(site, 'assets', 'images')) >= BASE_COUNT;

function download(url, dest, redirects = 5) {
  return new Promise((resolvePromise, reject) => {
    get(url, { headers: { 'user-agent': 'rtm-journals-fetch' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        res.resume();
        return resolvePromise(download(new URL(res.headers.location, url).toString(), dest, redirects - 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`download failed: HTTP ${res.statusCode} for ${url}`));
      }
      const total = Number(res.headers['content-length'] || 0);
      let got = 0;
      let last = 0;
      const out = createWriteStream(dest);
      res.on('data', (chunk) => {
        got += chunk.length;
        if (total && got - last > 50 * 1024 * 1024) {
          last = got;
          process.stdout.write(`  ${(got / 1048576).toFixed(0)} / ${(total / 1048576).toFixed(0)} MB\n`);
        }
      });
      res.pipe(out);
      out.on('finish', () => { process.stdout.write('\n'); resolvePromise(); });
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

mkdirSync(cacheDir, { recursive: true });

if (basePresent) {
  console.log('base images already present — skipping the ~900 MB download');
} else {
  if (!existsSync(cacheFile) || statSync(cacheFile).size < 500 * 1024 * 1024 || force) {
    if (existsSync(cacheFile)) rmSync(cacheFile);
    console.log(`downloading ${ASSET} (~900 MB, once)…`);
    const part = cacheFile + '.part';
    await download(ASSET_URL, part);
    renameSync(part, cacheFile);
  } else {
    console.log('using cached download');
  }

  const hash = await sha256(cacheFile);
  if (SHA256 !== '__SHA256__' && hash !== SHA256) {
    throw new Error(`checksum mismatch\nexpected ${SHA256}\ngot      ${hash}`);
  }
  console.log('checksum ok');

  extract(cacheFile, ASSET);
}

console.log(`extracting ${DELTA}…`);
check: {
  if (!existsSync(deltaFile)) {
    console.warn(`${DELTA} missing from the repository — skipping`);
    break check;
  }
  extract(deltaFile, `${DELTA} must sit in the repository root`);
}

/* Delta v3 holds the charts of the journals added after the first release:
 * Kruger, MM, Frosty's Igloo, DrSwing and Mertch. Only the new files are in it,
 * so re-publishing never re-uploads the ~900 MB that is already online. */
const delta3Count = count(join(site, 'assets', 'thumbs'));
if (delta3Count >= EXPECTED.thumbs) {
  console.log(`${DELTA3} already applied — skipping`);
} else {
  if (!existsSync(delta3File) || force) {
    if (existsSync(delta3File)) rmSync(delta3File);
    console.log(`downloading ${DELTA3} (~276 MB)…`);
    const part = delta3File + '.part';
    await download(DELTA3_URL, part);
    renameSync(part, delta3File);
  } else {
    console.log('using cached delta download');
  }
  const hash = await sha256(delta3File);
  if (DELTA3_SHA256 !== '__SHA256__' && hash !== DELTA3_SHA256) {
    throw new Error(`checksum mismatch for ${DELTA3}\nexpected ${DELTA3_SHA256}\ngot      ${hash}`);
  }
  console.log('checksum ok');
  extract(delta3File, DELTA3);
}

const images = count(join(site, 'assets', 'images'));
const thumbs = count(join(site, 'assets', 'thumbs'));
console.log(`done: ${images} images, ${thumbs} thumbnails`);
if (images < EXPECTED.images || thumbs < EXPECTED.thumbs) {
  throw new Error('unexpected file counts after extraction');
}
