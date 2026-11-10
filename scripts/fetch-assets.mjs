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
/* What the three bundles add up to — not what a working copy happens to hold:
 * a local site/assets also keeps stale re-extractions that the data never
 * references, and counting those made the runner fail. */
const EXPECTED = { images: 32337, thumbs: 32287 };
const DELTA = 'assets-delta-v2.tar.gz';
/* The 276 MB delta is a Release asset too: a single git file must stay < 100 MB. */

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'site');
const cacheDir = join(root, '.assets-cache');
const cacheFile = join(cacheDir, ASSET);
const deltaFile = join(root, DELTA);
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

/* Later journals ship as release assets of their own, each holding only the
 * files that were not online yet. A bundle is skipped when one of its files is
 * already unpacked, so a re-run never downloads 1 GB twice. */
const DELTAS = [
  {
    name: 'assets-delta-v3.tar.gz',
    sha: '2b389e3ccc9c14f2c30ef64f95dce5c67db91a62f2d8608da2cfa1cb561d771b',
    probe: 'assets/images/0008854c9d5781a8.webp',
    size: '276 MB',
  },
  {
    name: 'assets-delta-v4a.tar.gz',
    sha: '7b5d7856d678e7d6dcc7c21bb5c7ab28fb5e04514a209631e9642544b9bb5c76',
    probe: 'assets/images/000098e948a7607dc6ae5882eca7f0e13559ca9e.png',
    size: '1.1 GB',
  },
  {
    name: 'assets-delta-v4b.tar.gz',
    sha: 'efbdbf6c4a3bca340af3520cbe4a64b6e2e198dafe758e36bc095c54f90225b3',
    probe: 'assets/images/a05b6996428426d74b2e0232adadb07c90b7b4ad.png',
    size: '1.2 GB',
  },
];

for (const delta of DELTAS) {
  if (!force && existsSync(join(site, delta.probe))) {
    console.log(`${delta.name} already applied — skipping`);
    continue;
  }
  const file = join(cacheDir, delta.name);
  if (!existsSync(file) || force) {
    if (existsSync(file)) rmSync(file);
    console.log(`downloading ${delta.name} (~${delta.size})…`);
    const part = file + '.part';
    await download(`${RELEASE}/assets-v1/${delta.name}`, part);
    renameSync(part, file);
  } else {
    console.log(`using cached ${delta.name}`);
  }
  const hash = await sha256(file);
  if (hash !== delta.sha) {
    throw new Error(`checksum mismatch for ${delta.name}\nexpected ${delta.sha}\ngot      ${hash}`);
  }
  console.log('checksum ok');
  extract(file, delta.name);
}

const images = count(join(site, 'assets', 'images'));
const thumbs = count(join(site, 'assets', 'thumbs'));
console.log(`done: ${images} images, ${thumbs} thumbnails`);
if (images < EXPECTED.images || thumbs < EXPECTED.thumbs) {
  throw new Error('unexpected file counts after extraction');
}
