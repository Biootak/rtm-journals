/* Thumbnails for the DrSwing plates extracted from the PDF prints.
   Same treatment as every other journal: the plate itself untouched, a 760px
   WebP thumb for lists and cards. Usage: node _build/drswing-thumbs.js */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const THUMB_DIR = path.join(ROOT, 'site', 'assets', 'thumbs');
const report = JSON.parse(fs.readFileSync(path.join(__dirname, 'drswing-parsed.json'), 'utf8'));

async function main() {
  fs.mkdirSync(THUMB_DIR, { recursive: true });
  let made = 0, kept = 0, failed = 0;
  for (const rec of report.images) {
    if (!rec.hash) continue;
    const out = path.join(THUMB_DIR, rec.hash + '.webp');
    if (fs.existsSync(out)) { kept++; continue; }
    const src = path.join(ROOT, 'site', rec.asset);
    try {
      await sharp(src, { failOn: 'none' })
        .rotate()
        .resize({ width: 760, height: 760, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 })
        .toFile(out);
      made++;
    } catch (e) {
      failed++;
      console.warn('thumb failed', rec.hash, e.message);
    }
  }
  console.log('thumbs', { made, kept, failed, total: report.images.length });
}

main().catch((e) => { console.error(e); process.exit(1); });
