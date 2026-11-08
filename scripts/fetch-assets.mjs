#!/usr/bin/env node
/*
 * The chart images are ~906 MB, so they are not stored in git. They live in the
 * "assets-v1" GitHub Release of this repository and are unpacked into site/.
 * Run once after cloning (and again only if the release changes).
 */
import { createWriteStream, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync, createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { get } from 'node:https';

const ASSET = 'assets-v1.tar.gz';
const URL = `https://github.com/Biootak/rtm-journals/releases/download/assets-v1/${ASSET}`;
const SHA256 = '__SHA256__';
const EXPECTED = { images: 6796, thumbs: 6796 };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'site');
const cacheDir = join(root, '.assets-cache');
const cacheFile = join(cacheDir, ASSET);
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

function download(url, dest, redirects = 5) {
  return new Promise((resolvePromise, reject) => {
    get(url, { headers: { 'user-agent': 'rtm-journals-fetch' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        res.resume();
        return resolvePromise(download(new URL(res.headers.location, url).toString(), dest, redirects - 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`download failed: HTTP ${res.statusCode}`));
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

mkdirSync(cacheDir, { recursive: true });

if (!existsSync(cacheFile) || statSync(cacheFile).size < 500 * 1024 * 1024 || force) {
  if (existsSync(cacheFile)) rmSync(cacheFile);
  console.log(`downloading ${ASSET} (~900 MB, once)…`);
  const part = cacheFile + '.part';
  await download(URL, part);
  renameSync(part, cacheFile);
} else {
  console.log('using cached download');
}

const hash = await sha256(cacheFile);
if (SHA256 !== '__SHA256__' && hash !== SHA256) {
  throw new Error(`checksum mismatch\nexpected ${SHA256}\ngot      ${hash}`);
}
console.log('checksum ok');

const tar = spawnSync('tar', ['-xzf', cacheFile, '-C', site], { stdio: 'inherit' });
if (tar.status !== 0) {
  throw new Error('extraction failed — tar is required (Windows 10+ includes it)');
}

const images = count(join(site, 'assets', 'images'));
const thumbs = count(join(site, 'assets', 'thumbs'));
console.log(`done: ${images} images, ${thumbs} thumbnails`);
if (images !== EXPECTED.images || thumbs !== EXPECTED.thumbs) {
  throw new Error('unexpected file counts after extraction');
}
