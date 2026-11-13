/*
 * Second pass for the Mertch plates.
 *
 * Guessing Wayback timestamps by year misses most captures, because the
 * redirect only lands on a capture of that exact URL. This pass asks the CDX
 * index for every file the capture ever saw under the same attachment folder,
 * matches them by file name, and fetches the exact snapshot. Plates that were
 * never archived stay missing and are reported instead of silently dropped.
 *
 * Usage: node _build/mertch-fix-images.js [--limit N]
 */
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');
const cheerio = require('cheerio');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, '_build');
const IMG_DIR = path.join(ROOT, 'site', 'assets', 'images');
const THUMB_DIR = path.join(ROOT, 'site', 'assets', 'thumbs');
const SRC_DIR = path.join(ROOT, "MERTCH'S JOURNAL (ALIYOUSEFIFX)");
const CACHE_FILE = path.join(BUILD, 'mertch-image-cache.json');
const INDEX_FILE = path.join(BUILD, 'mertch-wayback-index.json');

const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const writeJson = (f, v) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(v)); };
const sha1 = b => crypto.createHash('sha1').update(b).digest('hex');
const sleep = ms => new Promise(r => setTimeout(r, ms));

function decodedBase(url) {
  try { return decodeURIComponent(url.split('/').pop().split('?')[0]); } catch { return url.split('/').pop(); }
}

function extOf(p) {
  const e = path.extname((p || '').split('?')[0]).toLowerCase();
  return e === '.jpeg' ? '.jpg' : e;
}

function allSources() {
  const out = new Set();
  for (const f of fs.readdirSync(SRC_DIR).filter(n => /\.html?$/i.test(n))) {
    const $ = cheerio.load(fs.readFileSync(path.join(SRC_DIR, f), 'utf8'));
    $('.kmsgtext img').each((_, img) => {
      const src = String($(img).attr('src') || '').trim();
      if (src) out.add(src);
    });
  }
  return [...out];
}

async function cdxPrefix(dir) {
  const src = 'https://web.archive.org/cdx/search/cdx?url=readthemarket.com/media/kunena/attachments/' +
    encodeURIComponent(dir) + '/&matchType=prefix&output=json&fl=timestamp,original' +
    '&filter=statuscode:200&filter=mimetype:image.*&collapse=urlkey&limit=5000';
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(src, {
        signal: AbortSignal.timeout(120000),
        headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124 Safari/537.36' },
      });
      if (res.status === 429) { await sleep(20000 * (attempt + 1)); continue; }
      if (!res.ok) { await sleep(8000); continue; }
      const rows = JSON.parse(await res.text());
      const map = {};
      for (const [ts, original] of rows.slice(1)) {
        const base = decodedBase(original).toLowerCase();
        if (base && !map[base]) map[base] = { ts, original };
      }
      return map;
    } catch {
      await sleep(6000);
    }
  }
  return null;
}

async function fetchImage(candidates) {
  for (const url of candidates) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, {
          redirect: 'follow',
          signal: AbortSignal.timeout(70000),
          headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
            accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          },
        });
        if (!res.ok) {
          if (res.status === 429 || res.status >= 500) { await sleep(2000 * (attempt + 1)); continue; }
          break;
        }
        const type = res.headers.get('content-type') || '';
        const buf = Buffer.from(await res.arrayBuffer());
        const sig = (buf[0] === 0x89 && buf[1] === 0x50) || (buf[0] === 0xff && buf[1] === 0xd8)
          || buf.toString('latin1', 0, 4) === 'GIF8'
          || (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP')
          || buf.toString('latin1', 0, 2) === 'BM';
        if (!/^image\//i.test(type) && !sig) break;
        if (buf.length < 500) break;
        return { buf, source: url };
      } catch {
        if (attempt === 1) break;
        await sleep(1000);
      }
    }
  }
  return null;
}

async function makeThumb(file, hash) {
  const out = path.join(THUMB_DIR, hash + '.webp');
  try {
    const meta = await sharp(file, { failOn: 'none' }).metadata();
    if (!fs.existsSync(out)) {
      await sharp(file, { failOn: 'none' }).rotate()
        .resize({ width: 760, height: 760, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 }).toFile(out);
    }
    return { width: meta.width || 0, height: meta.height || 0 };
  } catch { return null; }
}

async function main() {
  const limitArg = process.argv.indexOf('--limit');
  const limit = limitArg >= 0 ? Number(process.argv[limitArg + 1]) : Infinity;
  const cache = readJson(CACHE_FILE, {});
  const index = readJson(INDEX_FILE, { byDir: {} });
  const sources = allSources();
  const pending = sources.filter(u => !(cache[u] && cache[u].hash));
  console.log('sources', sources.length, 'cached', sources.length - pending.length, 'pending', pending.length);

  const dirs = new Set();
  for (const u of pending) {
    const m = u.match(/attachments\/(\d+)\//);
    if (m) dirs.add(m[1]);
  }
  for (const dir of dirs) {
    if (index.byDir[dir] && Object.keys(index.byDir[dir]).length) continue;
    console.log('indexing', dir);
    const got = await cdxPrefix(dir);
    if (got) {
      index.byDir[dir] = got;
      writeJson(INDEX_FILE, index);
      console.log('  ', Object.keys(got).length, 'captures');
    } else {
      console.log('   index failed');
    }
    await sleep(2500);
  }

  const queue = pending.slice(0, limit === Infinity ? undefined : limit);
  let done = 0, failed = [];
  const workers = Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const src = queue.shift();
      const m = src.match(/attachments\/(\d+)\//);
      const entry = m && index.byDir[m[1]] && index.byDir[m[1]][decodedBase(src).toLowerCase()];
      const candidates = [];
      if (entry) candidates.push(`https://web.archive.org/web/${entry.ts}id_/${entry.original}`);
      for (const ts of ['2018', '2017', '2019', '2020', '2016', '2021', '2015', '2022']) {
        candidates.push(`https://web.archive.org/web/${ts}id_/${src}`);
      }
      const got = await fetchImage(candidates);
      if (!got) { failed.push(src); console.log('FAILED', src); continue; }
      const hash = sha1(got.buf);
      let ext = extOf(src);
      if (!['.jpg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) ext = '.jpg';
      const file = path.join(IMG_DIR, hash + ext);
      if (!fs.existsSync(file)) await fsp.writeFile(file, got.buf);
      const dim = await makeThumb(file, hash);
      cache[src] = {
        hash, asset: 'assets/images/' + hash + ext, thumb: 'assets/thumbs/' + hash + '.webp',
        bytes: got.buf.length, width: dim ? dim.width : 0, height: dim ? dim.height : 0, source: got.source,
      };
      done++;
      if (done % 10 === 0) { writeJson(CACHE_FILE, cache); console.log(`  ${done}/${queue.length + done}`); }
    }
  });
  await Promise.all(workers);
  writeJson(CACHE_FILE, cache);
  fs.writeFileSync(path.join(BUILD, 'mertch-image-failures.txt'), failed.join('\n'));
  console.log('downloaded', done, 'failed', failed.length, 'cache', Object.keys(cache).length);
}

main().catch(e => { console.error(e); process.exit(1); });
