#!/usr/bin/env node
/*
 * Re-encode full-size chart images to WebP and rewrite parsed.json asset
 * paths, so the whole archive ships roughly half the bytes.
 *
 *   node _build/compress-images.js            # convert + update parsed.json
 *   node _build/compress-images.js --dry-run  # report only
 *   node _build/compress-images.js --verify   # check every referenced file exists
 *
 * GIFs and existing WebP are left alone. Originals stay on disk until
 * --delete-originals is passed after verification.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const IMG_DIR = path.join(ROOT, 'site', 'assets', 'images');
const PARSED = path.join(ROOT, '_build', 'parsed.json');
const QUALITY = 85;
const CONCURRENCY = 8;
const DRY = process.argv.includes('--dry-run');
const VERIFY = process.argv.includes('--verify');
const DELETE = process.argv.includes('--delete-originals');
const EXTS = new Set(['.png', '.jpg', '.jpeg']);

const parsed = JSON.parse(fs.readFileSync(PARSED, 'utf8'));

/* asset path -> Set of record refs that point at it */
const targets = new Map();
for (const j of parsed.journals || []) {
  for (const rec of j.images || []) {
    const asset = rec && rec.asset;
    if (!asset || !asset.startsWith('assets/images/')) continue;
    if (!EXTS.has(path.extname(asset).toLowerCase())) continue;
    if (!targets.has(asset)) targets.set(asset, []);
    targets.get(asset).push(rec);
  }
}
console.log(`${targets.size} unique full-size files to convert (q${QUALITY})`);

if (VERIFY) {
  let missing = 0;
  const seen = new Set();
  for (const j of parsed.journals || []) {
    for (const rec of j.images || []) {
      const a = rec && rec.asset;
      if (!a || !a.startsWith('assets/') || seen.has(a)) continue;
      seen.add(a);
      if (!fs.existsSync(path.join(ROOT, 'site', a))) { missing++; if (missing < 8) console.log('MISSING', a); }
    }
  }
  console.log(`verify: ${seen.size} unique assets referenced, ${missing} missing`);
  process.exit(missing ? 1 : 0);
}

if (DRY) {
  let bytes = 0, n = 0;
  for (const asset of targets.keys()) {
    try { bytes += fs.statSync(path.join(ROOT, 'site', asset)).size; n++; } catch {}
  }
  console.log(`dry-run: ${n} files on disk, ${(bytes / 1073741824).toFixed(2)} GiB source`);
  process.exit(0);
}

const queue = [...targets.keys()];
let done = 0, skipped = 0, failed = 0, inBytes = 0, outBytes = 0;
const failures = [];
const t0 = Date.now();

async function worker() {
  while (queue.length) {
    const asset = queue.shift();
    const srcRel = asset;                       // assets/images/x.png
    const dstRel = asset.replace(/\.(png|jpe?g)$/i, '.webp');
    const srcAbs = path.join(ROOT, 'site', srcRel);
    const dstAbs = path.join(ROOT, 'site', dstRel);
    try {
      if (fs.existsSync(dstAbs)) {
        /* Already converted (earlier run): still rewrite records so a rerun
         * after a crash completes the manifest update. */
        const sz = fs.statSync(dstAbs).size;
        for (const rec of targets.get(asset)) { rec.asset = dstRel; rec.bytes = sz; }
        skipped++;
        continue;
      }
      const buf = await sharp(srcAbs).webp({ quality: QUALITY }).toBuffer();
      fs.writeFileSync(dstAbs, buf);
      const sz = fs.statSync(srcAbs).size;
      inBytes += sz; outBytes += buf.length;
      done++;
      /* Rewrite every record that referenced the old path. */
      for (const rec of targets.get(asset)) {
        rec.asset = dstRel;
        rec.bytes = buf.length;
      }
    } catch (e) {
      failed++;
      failures.push(asset + ' :: ' + String(e.message || e).slice(0, 100));
    }
    const n = done + skipped + failed;
    if (n % 500 === 0) {
      const mins = (Date.now() - t0) / 60000;
      console.log(`${n}/${targets.size}  ${(inBytes / 1048576).toFixed(0)}→${(outBytes / 1048576).toFixed(0)} MB  ${mins.toFixed(1)}min  fail=${failed}`);
    }
  }
}

(async () => {
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`converted: ${done}, skipped(existing): ${skipped}, failed: ${failed}`);
  console.log(`bytes: ${(inBytes / 1073741824).toFixed(2)} → ${(outBytes / 1073741824).toFixed(2)} GiB`);
  if (failures.length) console.log(failures.slice(0, 20).join('\n'));
  /* Failed files keep their original asset path and stay on disk; that is a
   * valid end state, so write parsed.json regardless and report via exit 0. */

  fs.writeFileSync(PARSED, JSON.stringify(parsed));
  console.log('parsed.json updated');

  if (DELETE) {
    let removed = 0, bytes = 0;
    for (const asset of targets.keys()) {
      const srcAbs = path.join(ROOT, 'site', asset);
      const dstAbs = path.join(ROOT, 'site', asset.replace(/\.(png|jpe?g)$/i, '.webp'));
      if (!fs.existsSync(dstAbs)) continue;   // never delete a failed conversion's original
      try { bytes += fs.statSync(srcAbs).size; fs.unlinkSync(srcAbs); removed++; } catch {}
    }
    console.log(`deleted ${removed} originals, freed ${(bytes / 1073741824).toFixed(2)} GiB`);
  }
})();
