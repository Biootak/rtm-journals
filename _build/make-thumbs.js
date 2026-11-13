/* Thumbnails for every plate that has none yet.
 *
 * The lists, cards and the gallery never load a full chart: they ask for the
 * 760px WebP thumb and the reader loads the full plate on demand. The PDF
 * import copies plates byte-for-byte and leaves `thumb` as a promise, so this
 * pass fills in the missing thumbs for whatever was imported since last time.
 *
 * Usage: node _build/make-thumbs.js [--limit N] [--workers N]
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const IMAGE_DIR = path.join(ROOT, 'site', 'assets', 'images');
const THUMB_DIR = path.join(ROOT, 'site', 'assets', 'thumbs');
const arg = (name, fallback) => {
  const hit = process.argv.find(a => a.startsWith(`--${name}=`));
  return hit ? Number(hit.slice(name.length + 3)) : fallback;
};
const LIMIT = arg('limit', Infinity);
const WORKERS = arg('workers', 8);

sharp.concurrency(WORKERS);

async function main() {
  fs.mkdirSync(THUMB_DIR, { recursive: true });
  const wanted = fs.readdirSync(IMAGE_DIR)
    .filter(f => /\.(?:jpe?g|png|gif|webp|bmp)$/i.test(f))
    .map(f => ({ src: f, key: f.replace(/\.[^.]+$/, ''), out: f.replace(/\.[^.]+$/, '') + '.webp' }))
    .filter(f => !fs.existsSync(path.join(THUMB_DIR, f.out)))
    .slice(0, LIMIT);

  console.log(`${wanted.length} thumbs to make with ${WORKERS} workers`);
  let done = 0, failed = 0;
  const started = Date.now();

  async function worker() {
    for (;;) {
      const job = wanted.shift();
      if (!job) return;
      try {
        await sharp(path.join(IMAGE_DIR, job.src), { failOn: 'none', animated: false })
          .rotate()
          .resize({ width: 760, height: 760, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80, effort: 4 })
          .toFile(path.join(THUMB_DIR, job.out));
      } catch {
        failed++;
      }
      done++;
      if (done % 1000 === 0) {
        const rate = done / ((Date.now() - started) / 1000);
        console.log(`  ${done} done, ${failed} failed, ${rate.toFixed(0)}/s`);
      }
    }
  }

  await Promise.all(Array.from({ length: WORKERS }, worker));
  console.log(`done: ${done} made, ${failed} failed in ${((Date.now() - started) / 1000).toFixed(0)}s`);
}

main().catch((err) => { console.error(err); process.exit(1); });
