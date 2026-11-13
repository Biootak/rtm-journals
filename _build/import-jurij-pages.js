/*
 * Import the missing tail of the Jurij journal (pages 15-24, posts #351-600)
 * from the 2018 HTTrack capture, and recover their chart attachments from the
 * Wayback Machine. Pages 1-14 already exist in parsed.json and are untouched.
 *
 * Usage:
 *   node _build/import-jurij-pages.js --report
 *   node _build/import-jurij-pages.js --download
 *   node _build/import-jurij-pages.js --merge
 */
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');
const cheerio = require('cheerio');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, '_build');
const SITE = path.join(ROOT, 'site');
const IMG_DIR = path.join(SITE, 'assets', 'images');
const THUMB_DIR = path.join(SITE, 'assets', 'thumbs');
const NEW_DIR = 'C:/Journals/Jurij/JURIJ-S-CORNER (ALIYOUSEFIFX)/JURIJ-S-CORNER';
const OLD_DIR = 'C:/Journals/Jurij';
const CACHE_FILE = path.join(BUILD, 'jurij-image-cache.json');
const INDEX_FILE = path.join(BUILD, 'jurij-wayback-index.json');

const MODE = process.argv[2] || '--report';

function cleanText(s) {
  return String(s || '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}
function htmlToText($, el) {
  const clone = $(el).clone();
  clone.find('br').replaceWith('\n');
  clone.find('p, div, li, blockquote, tr').each((_, n) => $(n).append('\n'));
  clone.find('script, style').remove();
  return cleanText(clone.text());
}
const SKIP_IMAGE_RE = /(?:avatar|rank\d*|logo|nophoto|smiley|emoticon|emot|icon|badge|spacer|blank\.|pixel\.|transparent\.|thumbsup|notworthy|cheer|clap|wave\.|study\.|sleep\.|blush\.|hug\.|love\.|party\.|biggrin\.|devil\.|cool\.|sad\.|wink\.|laugh\.|confus|huh\.|rolleyes|tongue|kiss|angry|shock|dry\.|sick|pinch|frustrat|good\.|beer|birthday|cake|dance|flower|gift|heart|rose|star\.|sun\.|rainbow|coffee|popcorn|rock\.|bandit|ninja|pirate|santa|clown|ghost|skull|alien|robot|bunny|cat\.|dog\.|bear|panda|penguin|monkey|pig\.|cow\.|chicken|frog|fish|horse|sheep|tiger|lion|wolf|fox\.|owl\.|bee\.|ant\.|bug\.|snail|turtle|dolphin|whale|shark|octopus|crab|butterfly|dragon|unicorn)/i;
function isUiImage($, img) {
  const src = String($(img).attr('src') || '');
  const cls = String($(img).attr('class') || '');
  const alt = String($(img).attr('alt') || '');
  const w = parseInt($(img).attr('width') || '0', 10);
  const h = parseInt($(img).attr('height') || '0', 10);
  if (!src) return true;
  if (/bbcode_smiley|kavatar|img-polaroid|kicon|smiley/i.test(cls + ' ' + alt)) return true;
  const base = src.split('/').pop().split('?')[0];
  let decoded = base;
  try { decoded = decodeURIComponent(base); } catch {}
  if (SKIP_IMAGE_RE.test(decoded)) return true;
  if (w && h && w <= 64 && h <= 64) return true;
  if (w && h && w <= 100 && h <= 20) return true;
  return false;
}
function extOf(p) {
  const e = path.extname((p || '').split('?')[0]).toLowerCase();
  return e === '.jpeg' ? '.jpg' : e;
}
function sha1(buf) {
  return crypto.createHash('sha1').update(buf).digest('hex');
}
function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value));
}

function newPageFiles() {
  return fs.readdirSync(NEW_DIR)
    .filter(f => /\.html?$/i.test(f))
    .sort((a, b) => Number((a.match(/\((\d+)\)/) || [0, 0])[1]) - Number((b.match(/\((\d+)\)/) || [0, 0])[1]));
}

function parsePage(file, pageNum) {
  const $ = cheerio.load(fs.readFileSync(path.join(NEW_DIR, file), 'utf8'));
  const tables = $('table.kmsg');
  const posts = [];
  for (let ti = 0; ti < tables.length; ti++) {
    const table = tables.eq(ti);
    const header = table.prevAll('.kmsg-header').first();
    const body = table.find('.kmsgtext').first();
    if (!body.length) continue;
    const author = cleanText(table.find('.kpost-username a').first().text()) || '—';
    const date = cleanText(header.find('.kmsgdate').first().text());
    const trueNo = cleanText(header.find('.kmsg-id-left a, .kmsg-id a').first().text()).replace(/^#/, '');
    const text = htmlToText($, body);
    const images = [];
    body.find('img').each((_, img) => {
      if (isUiImage($, img)) return;
      const src = String($(img).attr('src') || '').trim();
      if (!src) return;
      images.push({ src, alt: cleanText($(img).attr('alt') || '') });
    });
    if (!text && !images.length) continue;
    posts.push({
      id: `jurij_p${pageNum}_${ti + 1}`,
      journalId: 'jurij',
      pageNum,
      author,
      date,
      number: '#' + (ti + 1),
      trueNumber: trueNo ? Number(trueNo) : null,
      text,
      images,
    });
  }
  return posts;
}

function indexLocalNames() {
  const local = new Map();
  const walk = dir => {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(jpe?g|png|gif|webp|bmp)$/i.test(e.name)) {
        const k = e.name.toLowerCase();
        if (!local.has(k)) local.set(k, p);
      }
    }
  };
  for (const d of fs.readdirSync(OLD_DIR, { withFileTypes: true })) {
    if (d.isDirectory() && /_files$/i.test(d.name)) walk(path.join(OLD_DIR, d.name));
  }
  return local;
}

function collect() {
  const files = newPageFiles();
  const pages = [];
  for (const file of files) {
    const n = Number((file.match(/\((\d+)\)/) || [0, 0])[1]);
    // File (1) and (2) are the same first page; later files are pages in order.
    if (n < 16) continue;
    const pageNum = n - 1;
    const posts = parsePage(file, pageNum);
    const first = posts[0];
    if (!first) continue;
    const expected = first.trueNumber ? Math.ceil(first.trueNumber / 25) : pageNum;
    if (expected !== pageNum) {
      throw new Error(`page mapping mismatch for ${file}: page ${pageNum}, first post #${first.trueNumber}`);
    }
    pages.push({ file, pageNum, posts });
  }
  return pages;
}

async function makeThumb(file, hash) {
  const out = path.join(THUMB_DIR, hash + '.webp');
  try {
    const meta = await sharp(file, { failOn: 'none' }).metadata();
    await sharp(file, { failOn: 'none' })
      .rotate()
      .resize({ width: 760, height: 760, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toFile(out);
    return { width: meta.width || 0, height: meta.height || 0 };
  } catch (e) {
    console.warn('thumb failed', path.basename(file), e.message);
    return null;
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchImage(url, variants) {
  for (const candidate of variants) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 45000);
        const res = await fetch(candidate, {
          signal: controller.signal,
          redirect: 'follow',
          headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
            'accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          },
        }).finally(() => clearTimeout(timer));
        if (!res.ok) {
          if (res.status === 429 || res.status >= 500) { await sleep(1500 * (attempt + 1)); continue; }
          break;
        }
        const type = res.headers.get('content-type') || '';
        const buf = Buffer.from(await res.arrayBuffer());
        const sig = (buf[0] === 0x89 && buf[1] === 0x50) || (buf[0] === 0xff && buf[1] === 0xd8) || buf.toString('latin1', 0, 4) === 'GIF8' || (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') || buf.toString('latin1', 0, 2) === 'BM';
        if (!/^image\//i.test(type) && !sig) { break; }
        if (buf.length < 500) { break; }
        return { buf, source: candidate };
      } catch (e) {
        if (attempt === 1) break;
        await sleep(800);
      }
    }
  }
  return null;
}

function waybackVariants(url) {
  const out = [];
  const httpUrl = url.replace(/^https:/i, 'http:');
  for (const ts of ['2018', '2017', '2019', '2016', '2020', '2021', '2024', '2015']) {
    out.push(`https://web.archive.org/web/${ts}id_/${url}`);
    if (httpUrl !== url) out.push(`https://web.archive.org/web/${ts}id_/${httpUrl}`);
  }
  return out;
}

function decodedBase(url) {
  try { return decodeURIComponent(url.split('/').pop().split('?')[0]); } catch { return url.split('/').pop(); }
}

async function cdxPrefix(dir) {
  const src = 'https://web.archive.org/cdx/search/cdx?url=readthemarket.com/media/kunena/attachments/' +
    encodeURIComponent(dir) + '/&matchType=prefix&output=json&fl=timestamp,original' +
    '&filter=statuscode:200&filter=mimetype:image.*&collapse=urlkey&limit=5000';
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(src, {
        signal: AbortSignal.timeout(90000),
        headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124 Safari/537.36' },
      });
      if (res.status === 429) { await sleep(15000 * (attempt + 1)); continue; }
      if (!res.ok) { await sleep(6000); continue; }
      const rows = JSON.parse(await res.text());
      const out = {};
      for (const [ts, original] of rows.slice(1)) {
        const base = decodedBase(original).toLowerCase();
        if (base && !out[base]) out[base] = { ts, original };
      }
      return out;
    } catch {
      await sleep(5000);
    }
  }
  return null;
}

async function main() {
  const pages = collect();
  const allPosts = pages.flatMap(p => p.posts);
  const local = indexLocalNames();
  const cache = readJson(CACHE_FILE, {});
  const existing = readJson(path.join(BUILD, 'images.json'), []);
  const byName = new Map();
  for (const rec of existing) {
    if (rec.originalName) byName.set(String(rec.originalName).toLowerCase(), rec);
  }

  const occurrences = [];
  const urls = new Map();
  for (const post of allPosts) {
    for (const occ of post.images) {
      const src = occ.src;
      const base = (() => {
        try { return decodeURIComponent(src.split('/').pop().split('?')[0]); } catch { return src.split('/').pop(); }
      })();
      const record = { post, occ, src, base };
      occurrences.push(record);
      if (!urls.has(src)) urls.set(src, { src, base, occurrences: [] });
      urls.get(src).occurrences.push(record);
    }
  }

  console.log(JSON.stringify({
    pages: pages.map(p => ({ page: p.pageNum, file: p.file, posts: p.posts.length, first: p.posts[0].trueNumber, last: p.posts[p.posts.length - 1].trueNumber })),
    posts: allPosts.length,
    imageOccurrences: occurrences.length,
    uniqueUrls: urls.size,
  }, null, 1));

  if (MODE === '--report') {
    let localHits = 0, assetHits = 0, cachedHits = 0;
    for (const u of urls.values()) {
      if (local.has(u.base.toLowerCase())) localHits++;
      else if (byName.has(u.base.toLowerCase())) assetHits++;
      else if (cache[u.src] && cache[u.src].hash) cachedHits++;
    }
    console.log({ localHits, assetHits, cachedHits, needDownload: urls.size - localHits - assetHits - cachedHits });
    return;
  }

  if (MODE === '--index') {
    const dirs = new Set();
    for (const u of urls.values()) {
      const m = u.src.match(/attachments\/(\d+)\//);
      if (m) dirs.add(m[1]);
    }
    const index = readJson(INDEX_FILE, { byDir: {} });
    index.byDir = index.byDir || {};
    let captured = 0;
    for (const dir of [...dirs]) {
      if (index.byDir[dir] && Object.keys(index.byDir[dir]).length) {
        console.log('cached', dir, Object.keys(index.byDir[dir]).length);
        captured += Object.keys(index.byDir[dir]).length;
        continue;
      }
      console.log('indexing', dir);
      const got = await cdxPrefix(dir);
      if (got) {
        index.byDir[dir] = got;
        captured += Object.keys(got).length;
        console.log('  ', Object.keys(got).length, 'captures');
      } else {
        console.log('   failed');
      }
      writeJson(INDEX_FILE, index);
      await sleep(3000);
    }
    console.log('indexed dirs', Object.keys(index.byDir).length, 'files', captured);
    return;
  }

  if (MODE === '--download') {
    const index = readJson(INDEX_FILE, { byDir: {} });
    const pending = [...urls.values()].filter(u => !local.has(u.base.toLowerCase()) && !byName.has(u.base.toLowerCase()) && !(cache[u.src] && cache[u.src].hash));
    const todo = pending.filter(u => {
      const m = u.src.match(/attachments\/(\d+)\//);
      return m && index.byDir?.[m[1]]?.[decodedBase(u.src).toLowerCase()];
    });
    console.log(`Downloading ${todo.length} archived images; ${pending.length - todo.length} have no archive copy.`);
    let done = 0, failed = [];
    const queue = todo.slice();
    const workers = Array.from({ length: 3 }, async () => {
      while (queue.length) {
        const item = queue.shift();
        const dirMatch = item.src.match(/attachments\/(\d+)\//);
        const entry = dirMatch && index.byDir?.[dirMatch[1]]?.[decodedBase(item.src).toLowerCase()];
        const variants = entry
          ? [`https://web.archive.org/web/${entry.ts}id_/${entry.original}`, ...waybackVariants(item.src)]
          : waybackVariants(item.src);
        const got = await fetchImage(item.src, variants);
        if (!got) { failed.push(item.src); console.log('FAILED', item.src); await sleep(500); continue; }
        const hash = sha1(got.buf);
        let ext = extOf(item.src) || '.jpg';
        if (!['.jpg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) ext = '.jpg';
        const file = path.join(IMG_DIR, hash + ext);
        if (!fs.existsSync(file)) await fsp.writeFile(file, got.buf);
        const dim = await makeThumb(file, hash);
        cache[item.src] = {
          hash,
          asset: 'assets/images/' + hash + ext,
          thumb: 'assets/thumbs/' + hash + '.webp',
          bytes: got.buf.length,
          width: dim ? dim.width : 0,
          height: dim ? dim.height : 0,
          source: got.source,
        };
        done++;
        if (done % 10 === 0) {
          writeJson(CACHE_FILE, cache);
          console.log(`  ${done}/${todo.length}`);
        }
      }
    });
    await Promise.all(workers);
    writeJson(CACHE_FILE, cache);
    console.log(`Downloaded ${done}, failed ${failed.length}`);
    if (failed.length) {
      fs.writeFileSync(path.join(BUILD, 'jurij-image-failures.txt'), failed.join('\n'));
    }
    return;
  }

  if (MODE === '--merge') {
    const parsedFile = path.join(BUILD, 'parsed.json');
    const parsed = readJson(parsedFile, null);
    if (!parsed) throw new Error('parsed.json missing');
    const journal = parsed.journals.find(j => j.id === 'jurij');
    if (!journal) throw new Error('jurij journal missing');
    if (journal.pages >= 24) {
      console.log('already merged:', journal.pages, 'pages');
      return;
    }

    const records = [];
    const remoteRecords = new Map();
    const usedHashes = new Set(journal.images.map(r => r.hash));
    let recovered = 0;
    let missing = 0;
    for (const rec of existing) {
      if (rec.originalName) byName.set(String(rec.originalName).toLowerCase(), rec);
    }

    for (const page of pages) {
      for (const post of page.posts) {
        const keys = [];
        for (const occ of post.images) {
          const baseKey = occ.src.split('/').pop().split('?')[0];
          let decoded = baseKey;
          try { decoded = decodeURIComponent(baseKey); } catch {}
          let hash = '', asset = '', thumb = '', width = 0, height = 0, bytes = 0, original = decoded;
          const localPath = local.get(decoded.toLowerCase());
          const cached = cache[occ.src];
          const known = byName.get(decoded.toLowerCase());
          if (localPath) {
            const buf = fs.readFileSync(localPath);
            hash = sha1(buf);
            let ext = extOf(localPath) || '.jpg';
            if (!['.jpg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) ext = '.jpg';
            const dest = path.join(IMG_DIR, hash + ext);
            if (!fs.existsSync(dest)) await fsp.copyFile(localPath, dest);
            const dim = await makeThumb(dest, hash);
            asset = 'assets/images/' + hash + ext;
            thumb = 'assets/thumbs/' + hash + '.webp';
            bytes = buf.length;
            width = dim ? dim.width : 0;
            height = dim ? dim.height : 0;
          } else if (known && known.hash && !String(known.hash).startsWith('remote_')) {
            hash = known.hash; asset = known.asset; thumb = known.thumb;
            width = known.width; height = known.height; bytes = known.bytes;
          } else if (cached && cached.hash) {
            hash = cached.hash; asset = cached.asset; thumb = cached.thumb;
            width = cached.width; height = cached.height; bytes = cached.bytes;
          } else {
            /* The screenshot was never archived. Keep the reference so the
               reader is told the plate is missing instead of silently seeing
               a shorter post. */
            const remoteHash = 'remote_' + crypto.createHash('sha1').update(occ.src).digest('hex').slice(0, 16);
            if (!remoteRecords.has(remoteHash)) {
              remoteRecords.set(remoteHash, {
                key: remoteHash, type: 'remote', src: occ.src, localPath: '',
                hash: remoteHash, asset: occ.src, thumb: '',
                width: 0, height: 0, bytes: 0,
                originalName: original, journalId: 'jurij',
                pageNum: page.pageNum, postId: post.id,
              });
            }
            missing++;
            if (!keys.includes(remoteHash)) keys.push(remoteHash);
            continue;
          }
          recovered++;
          if (!usedHashes.has(hash)) {
            usedHashes.add(hash);
            records.push({
              key: hash, type: 'local', src: occ.src, localPath, hash,
              asset, thumb, width, height, bytes,
              originalName: original, journalId: 'jurij',
              pageNum: page.pageNum, postId: post.id,
            });
          }
          if (!keys.includes(hash)) keys.push(hash);
        }
        post.images = keys;
        delete post.trueNumber;
        journal.posts.push(post);
      }
    }

    journal.images.push(...records, ...remoteRecords.values());
    journal.pages = 24;
    journal.pageFiles = [...journal.pageFiles, ...pages.map(p => p.file)];
    parsed.stats = {
      ...parsed.stats,
      pages: parsed.journals.reduce((a, j) => a + j.pages, 0),
      posts: parsed.journals.reduce((a, j) => a + j.posts.length, 0),
      imageOccurrences: parsed.journals.reduce((a, j) => a + j.images.length, 0),
      uniqueImages: new Set(parsed.journals.flatMap(j => j.images.map(r => r.hash))).size,
    };

    fs.copyFileSync(parsedFile, path.join(BUILD, 'parsed.before-jurij.json'));
    writeJson(parsedFile, parsed);
    console.log('merged', {
      pages: 24,
      newPosts: pages.reduce((a, p) => a + p.posts.length, 0),
      newImages: records.length,
      missingImages: remoteRecords.size,
      recovered,
      missing,
      totalPosts: journal.posts.length,
      totalImages: journal.images.length,
    });
  }
}

main().catch(e => { console.error(e); process.exit(1); });
