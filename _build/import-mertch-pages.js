/*
 * Import the Mertch journal (13 pages, topic 1631) from the 2021 HTTrack
 * capture, with its chart attachments recovered from the Wayback Machine.
 *
 * The capture is the same Kunena markup as the rest of the corpus, so the
 * importer follows import-jurij-pages.js: parse each saved page, resolve every
 * plate to a local asset (and a small WebP thumb), then merge the journal into
 * `_build/parsed.json`. Nothing is written until `--merge`.
 *
 * Usage:
 *   node _build/import-mertch-pages.js --report
 *   node _build/import-mertch-pages.js --download
 *   node _build/import-mertch-pages.js --merge
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
const JOURNAL_ID = 'mertch';

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

const SKIP_IMAGE_RE = /(?:avatar|rank\d*|logo|nophoto|smiley|emoticon|emot|icon|badge|spacer|blank\.|pixel\.|transparent)/i;

function isUiImage($, img) {
  const src = String($(img).attr('src') || '');
  const cls = String($(img).attr('class') || '');
  const alt = String($(img).attr('alt') || '');
  const w = parseInt($(img).attr('width') || '0', 10);
  const h = parseInt($(img).attr('height') || '0', 10);
  if (!src) return true;
  if (/bbcode_smiley|kavatar|kicon|smiley/i.test(cls + ' ' + alt)) return true;
  const base = src.split('/').pop().split('?')[0];
  let decoded = base;
  try { decoded = decodeURIComponent(base); } catch { /* keep raw */ }
  if (SKIP_IMAGE_RE.test(decoded)) return true;
  if (w && h && w <= 64 && h <= 64) return true;
  if (w && h && w <= 100 && h <= 20) return true;
  return false;
}

function extOf(p) {
  const e = path.extname((p || '').split('?')[0]).toLowerCase();
  return e === '.jpeg' ? '.jpg' : e;
}
function sha1(buf) { return crypto.createHash('sha1').update(buf).digest('hex'); }
function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value));
}

function pageFiles() {
  return fs.readdirSync(SRC_DIR)
    .filter(f => /\.html?$/i.test(f))
    .map(f => ({ f, n: Number((f.match(/\((\d+)\)/) || [0, 0])[1]) }))
    .filter(x => x.n > 0)
    .sort((a, b) => a.n - b.n);
}

function parsePage(file, pageNum) {
  const $ = cheerio.load(fs.readFileSync(path.join(SRC_DIR, file), 'utf8'));
  const tables = $('.kmsg');
  const posts = [];
  for (let ti = 0; ti < tables.length; ti++) {
    const table = tables.eq(ti);
    const header = table.prevAll('.kmsg-header').first();
    const body = table.find('.kmsgtext').first();
    if (!body.length) continue;
    const author = cleanText(table.find('.kpost-username a').first().text()) || '—';
    const date = cleanText(header.find('.kmsgdate').first().text());
    const mid = Number(header.find('.kmsg-id-left a').first().attr('id') || 0) || null;
    const trueNo = cleanText(header.find('.kmsg-id-left a').first().text()).replace(/^#/, '');
    const text = htmlToText($, body);
    const images = [];
    body.find('img').each((_, img) => {
      if (isUiImage($, img)) return;
      const src = String($(img).attr('src') || '').trim();
      if (!src) return;
      const anchorTitle = cleanText($(img).closest('a').attr('title') || '');
      images.push({ src, alt: anchorTitle || cleanText($(img).attr('alt') || '') });
    });
    if (!text && !images.length) continue;
    posts.push({
      id: `${JOURNAL_ID}_p${pageNum}_${ti + 1}`,
      journalId: JOURNAL_ID,
      pageNum,
      author,
      date,
      number: '#' + (ti + 1),
      trueNumber: trueNo ? Number(trueNo) : null,
      mid,
      text,
      images,
    });
  }
  return posts;
}

function collect() {
  const pages = [];
  for (const { f, n } of pageFiles()) {
    const posts = parsePage(f, n);
    if (posts.length) pages.push({ file: f, pageNum: n, posts });
  }
  return pages;
}

async function makeThumb(file, hash) {
  const out = path.join(THUMB_DIR, hash + '.webp');
  try {
    const meta = await sharp(file, { failOn: 'none' }).metadata();
    if (!fs.existsSync(out)) {
      await sharp(file, { failOn: 'none' })
        .rotate()
        .resize({ width: 760, height: 760, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 })
        .toFile(out);
    }
    return { width: meta.width || 0, height: meta.height || 0 };
  } catch (e) {
    console.warn('thumb failed', path.basename(file), e.message);
    return null;
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

function waybackVariants(url) {
  const out = [];
  for (const ts of ['2018', '2017', '2019', '2016', '2020', '2021', '2015', '2022', '2014', '2023']) {
    out.push(`https://web.archive.org/web/${ts}id_/${url}`);
  }
  return out;
}

async function fetchImage(url) {
  for (const candidate of waybackVariants(url)) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(candidate, {
          redirect: 'follow',
          signal: AbortSignal.timeout(60000),
          headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
            'accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          },
        });
        if (!res.ok) {
          if (res.status === 429 || res.status >= 500) { await sleep(1500 * (attempt + 1)); continue; }
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
        return { buf, source: candidate };
      } catch {
        if (attempt === 1) break;
        await sleep(800);
      }
    }
  }
  return null;
}

function decodedBase(url) {
  try { return decodeURIComponent(url.split('/').pop().split('?')[0]); } catch { return url.split('/').pop(); }
}

function dedupe(pages) {
  const bySrc = new Map();
  for (const page of pages) {
    for (const post of page.posts) {
      for (const occ of post.images) {
        if (!bySrc.has(occ.src)) bySrc.set(occ.src, { src: occ.src, base: decodedBase(occ.src), pageNum: page.pageNum, postId: post.id, occurrences: 0 });
        bySrc.get(occ.src).occurrences++;
      }
    }
  }
  return [...bySrc.values()];
}

async function main() {
  const pages = collect();
  const posts = pages.flatMap(p => p.posts);
  const urls = dedupe(pages);
  const cache = readJson(CACHE_FILE, {});

  console.log(JSON.stringify({
    pages: pages.map(p => ({ page: p.pageNum, file: p.file, posts: p.posts.length, first: p.posts[0].trueNumber, last: p.posts.at(-1).trueNumber })),
    posts: posts.length,
    imageReferences: posts.reduce((n, p) => n + p.images.length, 0),
    uniqueImages: urls.length,
    withMid: posts.filter(p => p.mid).length,
  }, null, 1));

  if (MODE === '--report') {
    const cached = urls.filter(u => cache[u.src] && cache[u.src].hash).length;
    console.log({ cached, needDownload: urls.length - cached });
    return;
  }

  if (MODE === '--download') {
    const pending = urls.filter(u => !(cache[u.src] && cache[u.src].hash));
    console.log(`Downloading ${pending.length} plates from the Wayback Machine (${urls.length - pending.length} cached).`);
    let done = 0;
    const failed = [];
    const queue = pending.slice();
    const workers = Array.from({ length: 5 }, async () => {
      while (queue.length) {
        const item = queue.shift();
        const got = await fetchImage(item.src);
        if (!got) {
          failed.push(item.src);
          console.log('FAILED', item.src);
          continue;
        }
        const hash = sha1(got.buf);
        let ext = extOf(item.src);
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
        if (done % 20 === 0) {
          writeJson(CACHE_FILE, cache);
          console.log(`  ${done}/${pending.length}`);
        }
      }
    });
    await Promise.all(workers);
    writeJson(CACHE_FILE, cache);
    console.log(`Downloaded ${done}, failed ${failed.length}`);
    if (failed.length) fs.writeFileSync(path.join(BUILD, 'mertch-image-failures.txt'), failed.join('\n'));
    return;
  }

  if (MODE === '--merge') {
    const parsedFile = path.join(BUILD, 'parsed.json');
    const parsed = readJson(parsedFile, null);
    if (!parsed) throw new Error('parsed.json missing');
    if (parsed.journals.some(j => j.id === JOURNAL_ID)) {
      console.log('mertch already merged');
      return;
    }

    const records = [];
    const remote = new Map();
    const usedHashes = new Set();
    let recovered = 0, missing = 0;

    for (const page of pages) {
      for (const post of page.posts) {
        const keys = [];
        for (const occ of post.images) {
          const cached = cache[occ.src];
          if (cached && cached.hash) {
            recovered++;
            if (!usedHashes.has(cached.hash)) {
              usedHashes.add(cached.hash);
              records.push({
                key: cached.hash, type: 'local', src: occ.src, localPath: '',
                hash: cached.hash, asset: cached.asset, thumb: cached.thumb,
                width: cached.width, height: cached.height, bytes: cached.bytes,
                originalName: occ.alt || decodedBase(occ.src),
                journalId: JOURNAL_ID, pageNum: page.pageNum, postId: post.id,
              });
            }
            if (!keys.includes(cached.hash)) keys.push(cached.hash);
          } else {
            const remoteHash = 'remote_' + crypto.createHash('sha1').update(occ.src).digest('hex').slice(0, 16);
            if (!remote.has(remoteHash)) {
              remote.set(remoteHash, {
                key: remoteHash, type: 'remote', src: occ.src, localPath: '',
                hash: remoteHash, asset: occ.src, thumb: '', width: 0, height: 0, bytes: 0,
                originalName: occ.alt || decodedBase(occ.src),
                journalId: JOURNAL_ID, pageNum: page.pageNum, postId: post.id,
              });
            }
            missing++;
            if (!keys.includes(remoteHash)) keys.push(remoteHash);
          }
        }
        post.images = keys;
        delete post.trueNumber;
      }
    }

    const journal = {
      id: JOURNAL_ID,
      name: 'Mertch',
      title: 'Mertch journal',
      dir: SRC_DIR,
      pages: pages.length,
      pageFiles: pages.map(p => p.file),
      posts: pages.flatMap(p => p.posts),
      images: [...records, ...remote.values()],
    };
    parsed.journals.push(journal);
    parsed.journals.sort((a, b) => a.id.localeCompare(b.id));
    parsed.stats = {
      ...parsed.stats,
      journals: parsed.journals.length,
      pages: parsed.journals.reduce((a, j) => a + j.pages, 0),
      posts: parsed.journals.reduce((a, j) => a + j.posts.length, 0),
      imageOccurrences: parsed.journals.reduce((a, j) => a + j.images.length, 0),
      uniqueImages: new Set(parsed.journals.flatMap(j => j.images.map(r => r.hash))).size,
      imageRecords: parsed.journals.reduce((a, j) => a + j.images.length, 0),
    };

    fs.copyFileSync(parsedFile, path.join(BUILD, 'parsed.before-mertch.json'));
    writeJson(parsedFile, parsed);
    console.log('merged', {
      pages: pages.length,
      posts: journal.posts.length,
      newImages: records.length,
      missingImages: remote.size,
      recovered,
      missing,
    });
  }
}

main().catch(e => { console.error(e); process.exit(1); });
