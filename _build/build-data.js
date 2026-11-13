/*
 * Stage 1: parse the mirrored Kunena pages, deduplicate content images,
 * copy them into the static site and generate thumbnails.
 *
 * Output:
 *   _build/parsed.json        parsed journals / posts / image occurrences
 *   _build/images.json        unique image manifest (hash -> asset info)
 *   site/assets/images/*      deduplicated originals
 *   site/assets/thumbs/*      small webp previews
 */
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const crypto = require('crypto');
const cheerio = require('cheerio');
const sharp = require('sharp');

const ROOT = 'E:/Trade/journals';
const SITE = path.join(ROOT, 'site');
const ASSETS = path.join(SITE, 'assets');
const IMG_DIR = path.join(ASSETS, 'images');
const THUMB_DIR = path.join(ASSETS, 'thumbs');
const BUILD = path.join(ROOT, '_build');
const SKIP_DIRS = new Set(['site', '_translator', '_build', 'node_modules']);

const JOURNAL_META = [
  { id: 'andrew', name: "Andrew's JOURNEY", dir: "Andrew's JOURNEY", title: "Andrew's JOURNEY" },
  { id: 'aran', name: 'Aran Jibril', dir: 'Aran Jibril', title: 'Aran Jibril' },
  { id: 'astrokillah', name: 'Astrokillah', dir: 'Astrokillah', title: "AK's Journal" },
  { id: 'benhur', name: 'Benhur', dir: 'Benhur', title: 'Benhur Journal' },
  { id: 'edges', name: 'Edges Journal 2.0', dir: 'Edges Journal 2.0', title: 'Edges Journal 2.0' },
  { id: 'einrikr', name: 'Einrikr', dir: 'Einrikr', title: 'Einrikr figuring out the market' },
  { id: 'extremerrage', name: 'extremerrage', dir: 'extremerrage', title: 'extremrrage' },
  { id: 'fulljournal', name: 'full journal', dir: 'full journal', title: 'full journal' },
  { id: 'fxeyes', name: 'fxeyes', dir: 'fxeyes', title: 'My Trading Journal' },
  { id: 'if', name: 'IF', dir: 'IF', title: 'If' },
  { id: 'jurij', name: 'Jurij', dir: 'Jurij', title: "Jurij's Corner" },
  { id: 'lespaul', name: 'Les_Paul', dir: 'Les_Paul', title: "Les_Paul's Journal" },
  { id: 'linos', name: 'Linos', dir: 'Linos', title: 'Thought Delta' },
  { id: 'mel', name: 'Mel', dir: 'Mel', title: 'Trading & Life with Mel' },
  { id: 'michal238', name: 'Michal238', dir: 'Michal238', title: "Michal's Journal" },
  { id: 'moneydeep', name: 'Moneydeep', dir: 'Moneydeep', title: 'Let there be light' },
  { id: 'mukhcin', name: 'Mukhcin', dir: 'Mukhcin', title: 'Mastering price reading' },
  { id: 'omidfx', name: 'Omidfx', dir: 'Omidfx', title: 'Fight Club' },
  { id: 'pedini', name: 'Pedini', dir: 'Pedini', title: "Pedini's trades and setups" },
  { id: 'rinehart', name: 'Rinehart', dir: 'Rinehart', title: "Rinehart's Journal" },
  { id: 'salivan', name: 'Salivan', dir: 'Salivan', title: "'THE ART OF WAR'" },
  { id: 'sniffing', name: 'Sniffing', dir: 'Sniffing', title: 'Sniffing Price' },
  { id: 'staurum', name: 'staurum', dir: 'staurum', title: 'Gold digging' },
  { id: 'vitaldrug', name: 'ViTaLDRuG', dir: 'ViTaLDRuG', title: 'Sweet drugs and bitter drugs' },
];

function naturalSort(a, b) {
  const na = String(a).match(/\d+/g) || [];
  const nb = String(b).match(/\d+/g) || [];
  for (let i = 0; i < Math.max(na.length, nb.length); i++) {
    const x = parseInt(na[i] || '0', 10);
    const y = parseInt(nb[i] || '0', 10);
    if (x !== y) return x - y;
  }
  return String(a).localeCompare(String(b), 'en');
}

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
  clone.find('p, div, li, blockquote, tr').each((_, n) => {
    $(n).append('\n');
  });
  clone.find('script, style').remove();
  // Kunena quote headers are noisy but still context; keep them.
  return cleanText(clone.text());
}

function extOf(p) {
  const e = path.extname(p || '').toLowerCase();
  return e === '.jpeg' ? '.jpg' : e;
}

function hashFile(file) {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash('sha1');
    const s = fs.createReadStream(file);
    s.on('data', d => h.update(d));
    s.on('end', () => resolve(h.digest('hex')));
    s.on('error', reject);
  });
}

const REMOTE_RE = /^(https?:)?\/\//i;
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

async function downloadRemote(url, destBase) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        'referer': 'https://readthemarket.com/',
        'accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const type = res.headers.get('content-type') || '';
    if (!/^image\//i.test(type)) throw new Error('not an image: ' + type);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500) throw new Error('too small');
    let ext = extOf(new URL(url).pathname) || '.jpg';
    if (!['.jpg', '.png', '.gif', '.webp', '.bmp'].includes(ext)) ext = '.jpg';
    const hash = crypto.createHash('sha1').update(buf).digest('hex');
    const file = path.join(IMG_DIR, hash + ext);
    if (!fs.existsSync(file)) await fsp.writeFile(file, buf);
    return { hash, ext, file, bytes: buf.length, original: url };
  } finally {
    clearTimeout(timer);
  }
}

async function makeThumb(file, hash) {
  const out = path.join(THUMB_DIR, hash + '.webp');
  if (fs.existsSync(out)) {
    try {
      const st = fs.statSync(out);
      if (st.size > 300) return;
    } catch {}
  }
  try {
    const img = sharp(file, { failOn: 'none' });
    const meta = await img.metadata();
    const width = Math.max(1, meta.width || 0);
    const height = Math.max(1, meta.height || 0);
    const resized = await img
      .rotate()
      .resize({ width: 760, height: 760, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, effort: 4 })
      .toBuffer();
    await fsp.writeFile(out, resized);
    return { width, height };
  } catch (e) {
    console.warn('thumb failed', path.basename(file), e.message);
    try { await fsp.copyFile(file, path.join(THUMB_DIR, hash + path.extname(file))); } catch {}
    return null;
  }
}

async function main() {
  fs.mkdirSync(BUILD, { recursive: true });
  fs.mkdirSync(IMG_DIR, { recursive: true });
  fs.mkdirSync(THUMB_DIR, { recursive: true });

  const journals = [];
  const imageMap = new Map(); // content hash -> unique image record
  const parsedByJournal = new Map();

  // Index every file inside mirrored *_files folders. Some images referenced
  // by absolute readthemarket.com URLs were also saved locally under their
  // original attachment name; recover those instead of leaving dead links.
  const localByName = new Map();
  for (const d of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!d.isDirectory() || !/_files$/i.test(d.name)) continue;
    const walk = (dirPath) => {
      let entries = [];
      try { entries = fs.readdirSync(dirPath, { withFileTypes: true }); } catch { return; }
      for (const e of entries) {
        const p = path.join(dirPath, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(jpe?g|png|gif|webp|bmp)$/i.test(e.name)) {
          const k = e.name.toLowerCase();
          if (!localByName.has(k)) localByName.set(k, p);
        }
      }
    };
    walk(path.join(ROOT, d.name));
  }
  console.log('Indexed local asset filenames:', localByName.size);

  // Optional cached hash index to avoid re-hashing on rebuilds.
  const cacheFile = path.join(BUILD, 'hash-cache.json');
  let hashCache = {};
  if (fs.existsSync(cacheFile)) {
    try { hashCache = JSON.parse(fs.readFileSync(cacheFile, 'utf8')); } catch {}
  }

  for (const meta of JOURNAL_META) {
    const dir = path.join(ROOT, meta.dir);
    if (!fs.existsSync(dir)) continue;
    const pageFiles = fs.readdirSync(dir).filter(f => /\.html?$/i.test(f)).sort(naturalSort);
    if (!pageFiles.length) continue;

    const journal = {
      id: meta.id,
      name: meta.name,
      title: meta.title,
      dir: meta.dir,
      pages: pageFiles.length,
      pageFiles,
      posts: [],
      images: [],
    };
    console.log(`[${meta.name}] ${pageFiles.length} pages`);

    for (let pi = 0; pi < pageFiles.length; pi++) {
      const pageFile = pageFiles[pi];
      let html;
      try { html = fs.readFileSync(path.join(dir, pageFile), 'utf8'); } catch (e) { continue; }
      const $ = cheerio.load(html);
      const headers = $('.kmsg-header');
      const tables = $('table.kmsg');
      for (let ti = 0; ti < tables.length; ti++) {
        const table = tables[ti];
        const header = headers.eq(ti);
        const body = $(table).find('.kmsgtext').first();
        if (!body.length) continue;

        const author = cleanText($(table).find('.kpost-username a').first().text()) || '—';
        const date = cleanText(header.find('.kmsgdate').first().text());
        const postNo = cleanText(header.find('.kmsg-id a').first().text()) || ('#' + (ti + 1));
        const text = htmlToText($, body);
        const imageOccurrences = [];

        body.find('img').each((_, img) => {
          if (isUiImage($, img)) return;
          let src = String($(img).attr('src') || '').trim();
          if (!src) return;
          // Keep the mirrored local src. The <a> around chart thumbnails often
          // points to the dead readthemarket.com attachment URL, so preferring
          // it would turn thousands of working local images into dead links.
          imageOccurrences.push({
            src,
            alt: cleanText($(img).attr('alt') || ''),
            pageNum: pi + 1,
            postIndex: ti,
          });
        });

        if (!text && !imageOccurrences.length) continue;
        const post = {
          id: `${meta.id}_p${pi + 1}_${ti + 1}`,
          journalId: meta.id,
          pageNum: pi + 1,
          author,
          date,
          number: postNo,
          text,
          images: [],
        };
        journal.posts.push(post);

        for (const occ of imageOccurrences) {
          const resolved = resolveImage(occ.src, dir, localByName);
          if (!resolved) continue;
          const rec = {
            key: '',
            type: resolved.type,
            src: resolved.src,
            localPath: resolved.localPath || '',
            hash: '',
            asset: '',
            thumb: '',
            width: 0,
            height: 0,
            bytes: 0,
            originalName: resolved.originalName,
            journalId: meta.id,
            pageNum: pi + 1,
            postId: post.id,
          };
          if (resolved.type === 'local') {
            if (!/\.(?:jpe?g|png|gif|webp|bmp)$/i.test(resolved.localPath)) continue;
            try {
              const hash = hashCache[resolved.localPath] || await hashFile(resolved.localPath);
              hashCache[resolved.localPath] = hash;
              rec.hash = hash;
              rec.bytes = fs.statSync(resolved.localPath).size;
              const ext = extOf(resolved.localPath);
              const dest = path.join(IMG_DIR, hash + ext);
              if (!fs.existsSync(dest)) await fsp.copyFile(resolved.localPath, dest);
              rec.asset = 'assets/images/' + hash + ext;
              rec.thumb = 'assets/thumbs/' + hash + '.webp';
              rec.originalName = path.basename(resolved.localPath);
            } catch (e) {
              console.warn('local image failed', resolved.localPath, e.message);
              continue;
            }
          } else if (resolved.type === 'remote') {
            rec.hash = 'remote_' + crypto.createHash('sha1').update(resolved.src).digest('hex').slice(0, 16);
            rec.asset = resolved.src;
            rec.thumb = '';
            rec.originalName = resolved.originalName || 'image';
            console.warn('remote unavailable locally', resolved.src.slice(0, 90));
          }
          rec.key = rec.hash;
          rec.journalId = meta.id;
          rec.pageNum = pi + 1;
          rec.postId = post.id;
          rec.originalName = rec.originalName || occ.alt || 'image';
          journal.images.push(rec);
          if (!imageMap.has(rec.key)) imageMap.set(rec.key, rec);
        }
      }

      // Build post <-> image links after all images on the page are known.
      for (const post of journal.posts) {
        if (post.pageNum !== pi + 1) continue;
        post.images = journal.images
          .filter(im => im.postId === post.id)
          .map(im => im.key);
      }
      if ((pi + 1) % 10 === 0 || pi === pageFiles.length - 1) {
        console.log(`  page ${pi + 1}/${pageFiles.length}`);
      }
    }

    // Remove posts that ended up empty.
    journal.posts = journal.posts.filter(p => p.text || p.images.length);
    journals.push(journal);
    parsedByJournal.set(meta.id, journal);
  }

  fs.writeFileSync(cacheFile, JSON.stringify(hashCache));

  // Generate thumbnails and dimensions for every unique image.
  const unique = [...imageMap.values()];
  console.log(`Unique images: ${unique.length}; generating thumbnails...`);
  let done = 0;
  for (const rec of unique) {
    if (!rec.hash || rec.key.startsWith('remote_')) continue;
    const ext = extOf(rec.asset);
    const full = path.join(SITE, rec.asset);
    if (!fs.existsSync(full)) continue;
    const local = path.join(THUMB_DIR, rec.hash + '.webp');
    if (fs.existsSync(local)) {
      try {
        const meta = await sharp(full, { failOn: 'none' }).metadata();
        rec.width = meta.width || 0;
        rec.height = meta.height || 0;
      } catch {}
    } else {
      const dim = await makeThumb(full, rec.hash);
      if (dim) { rec.width = dim.width; rec.height = dim.height; }
    }
    done++;
    if (done % 100 === 0) console.log(`  thumbs ${done}/${unique.length}`);
  }

  // Propagate dimensions to occurrence records (same hash).
  const byHash = new Map(unique.map(r => [r.hash, r]));
  for (const j of journals) {
    for (const rec of j.images) {
      const u = byHash.get(rec.hash);
      if (u) { rec.width = u.width; rec.height = u.height; rec.asset = u.asset; rec.thumb = u.thumb; rec.bytes = u.bytes; }
    }
  }

  const parsed = {
    generatedAt: new Date().toISOString(),
    journals: journals.map(j => ({
      id: j.id,
      name: j.name,
      title: j.title,
      dir: j.dir,
      pages: j.pages,
      pageFiles: j.pageFiles,
      posts: j.posts,
      images: j.images,
    })),
    stats: {
      journals: journals.length,
      pages: journals.reduce((a, j) => a + j.pages, 0),
      posts: journals.reduce((a, j) => a + j.posts.length, 0),
      imageOccurrences: journals.reduce((a, j) => a + j.images.length, 0),
      uniqueImages: unique.length,
      localBytes: unique.reduce((a, r) => a + (r.key.startsWith('remote_') ? 0 : r.bytes), 0),
    },
  };

  fs.writeFileSync(path.join(BUILD, 'parsed.json'), JSON.stringify(parsed));
  fs.writeFileSync(path.join(BUILD, 'images.json'), JSON.stringify(unique, null, 2));
  console.log('DONE', parsed.stats);
}

function resolveImage(src, pageDir, localByName) {
  let s = String(src).trim();
  if (!s) return null;
  if (REMOTE_RE.test(s)) {
    if (s.startsWith('//')) s = 'https:' + s;
    let base = s.split('/').pop().split('?')[0];
    try { base = decodeURIComponent(base); } catch {}
    const local = localByName.get(base.toLowerCase());
    if (local) return { type: 'local', src: s, localPath: local, originalName: path.basename(local) };
    return { type: 'remote', src: s, originalName: base };
  }
  if (/^data:/i.test(s)) return null;
  if (/^file:\/\//i.test(s)) {
    try { s = decodeURIComponent(s.replace(/^file:\/\//i, '').replace(/^\/([A-Za-z]:)/, '$1')); } catch {}
  }
  let decoded = s;
  try { decoded = decodeURIComponent(s); } catch {}
  decoded = decoded.replace(/\\/g, '/');
  if (/^[A-Za-z]:\//.test(decoded)) {
    if (fs.existsSync(decoded)) return { type: 'local', src: s, localPath: decoded, originalName: path.basename(decoded) };
    return null;
  }
  const p = path.resolve(pageDir, decoded);
  if (fs.existsSync(p) && fs.statSync(p).isFile()) {
    if (!/\.(jpe?g|png|gif|webp|bmp)$/i.test(p)) return null;
    return { type: 'local', src: s, localPath: p, originalName: path.basename(p) };
  }
  return null;
}

main().catch(e => { console.error(e); process.exit(1); });
