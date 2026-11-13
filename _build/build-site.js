/*
 * Stage 4: turn parsed journal pages + OCR/translation results into the
 * lazy-loaded static data files used by site/js/app.js.
 *
 * Output (all lazily loaded except index.js):
 *   site/data/index.js                 — journals, recent shelf, stats (~8 KB)
 *   site/data/journals/<id>.json       — meta + post stubs (no body text)
 *   site/data/journals/<id>/p<N>.json  — one page's posts and plates
 *   site/data/journals/<id>-images.json — light image records for the gallery
 *   site/data/search/<id>.json         — full-text rows for that journal
 *   site/data/posts/<id>.json          — excerpt rows for /all
 *
 * Usage: node build-site.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.env.JOURNALS_ROOT || path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, '_build');
const SITE = path.join(ROOT, 'site');
const DATA = path.join(SITE, 'data');
const JOURNAL_DIR = path.join(DATA, 'journals');

const policy = require('./translation-policy.js');

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function writeJs(file, body) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  /* Another process (an editor indexer, a preview server, the OS scanner) can
     hold a data file open while this build rewrites it, and Windows then
     refuses the write with EBUSY. Writing beside the target and renaming keeps
     the swap atomic and survives a briefly held handle. */
  const tmp = file + '.tmp-' + process.pid;
  fs.writeFileSync(tmp, body, 'utf8');
  for (let attempt = 0; ; attempt++) {
    try {
      fs.renameSync(tmp, file);
      return;
    } catch (e) {
      if (attempt >= 20 || (e.code !== 'EBUSY' && e.code !== 'EPERM' && e.code !== 'EACCES')) {
        // A scanner can hold the freshly written temp file too; drop the
        // target and write in place as the last resort.
        try { fs.unlinkSync(tmp); } catch { /* gone */ }
        try { fs.rmSync(file, { force: true }); } catch { /* gone */ }
        fs.writeFileSync(file, body, 'utf8');
        return;
      }
      const until = Date.now() + 150;
      while (Date.now() < until) { /* brief spin while the handle clears */ }
    }
  }
}

function writeJson(file, value) {
  writeJs(file, JSON.stringify(value));
}

function json(value) {
  return JSON.stringify(value);
}

function assetExists(asset) {
  if (!asset || /^https?:/i.test(asset)) return false;
  if (!/\.(?:jpe?g|png|gif|webp|bmp)$/i.test(asset)) return false;
  return fs.existsSync(path.join(SITE, asset.replace(/^\/+/, '')));
}

function fileSize(asset) {
  if (!asset || /^https?:/i.test(asset)) return 0;
  try { return fs.statSync(path.join(SITE, asset.replace(/^\/+/, ''))).size; } catch { return 0; }
}

function normName(asset) {
  return String(asset || '').split('/').pop().split('?')[0];
}

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function parseDate(text) {
  const m = String(text || '').match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (!m) return 0;
  const month = MONTHS[m[2].slice(0, 3).toLowerCase()];
  if (month == null) return 0;
  return Date.UTC(Number(m[3]), month, Number(m[1]), Number(m[4] || 0), Number(m[5] || 0));
}

function excerpt(text, max = 300) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  return s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s;
}

function normalizeForHash(text) {
  return String(text || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n').trim();
}

function postHash(text) {
  return crypto.createHash('sha1').update(normalizeForHash(text)).digest('hex');
}

/*
 * Machine-translation clean-up.
 *
 * Both translators (the online LLM one and the offline Argos model) leave two
 * kinds of noise behind:
 *   1. duplicated tokens when a short input is repeated, e.g.
 *      "Retire" -> "بازنشسته بازنشسته بازنشسته" (idiomatic Persian doubling such
 *      as "یواش یواش" is preserved: only runs of 3+ are collapsed, and runs of
 *      2 are collapsed only for numeric/Latin tokens).
 *   2. placeholders that survived the round-trip as bracket junk, e.g.
 *      "[[10:00 [[10:00" or "[2]"; the protected numbers themselves are still
 *      inside the text, so the brackets are dropped, not the digits.
 * A translation that ends up with no Persian letters at all is discarded in
 * favour of the original line.
 */
const FA_LETTER = /[\u0600-\u06FF]/;
const LATIN_OR_DIGIT = /[0-9A-Za-z]/;

// Words that read naturally twice in Persian ("یواش یواش", "کم کم"). Any
// other doubled word in this corpus is the model stuttering, so it collapses.
const REDUPLICATION = new Set(['خیلی', 'یواش', 'آهسته', 'کم', 'کم‌کم', 'دسته', 'قطره', 'قدم', 'گام', 'ذره', 'روز', 'موج']);

// The offline model was trained on subtitle data and sometimes answers chart
// text with a download/movie phrase; those are never real translations.
const HALLUCINATION = /^(?:دانلود\s*(?:زیرنویس\s*فارسی\s*)?(?:فیلم|آهنگ|موسیقی(?:\s*متن\s*فیلم)?)?\s*|زیرنویس\s*فارسی\s*|موسیقی\s*متن\s*فیلم\s*)+/;

function collapseRepeats(text) {
  const tokens = text.split(' ');
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    let j = i;
    while (j + 1 < tokens.length && tokens[j + 1] === tokens[i]) j++;
    const run = j - i + 1;
    const tok = tokens[i];
    const keep = run === 1
      || (run === 2 && !LATIN_OR_DIGIT.test(tok) && REDUPLICATION.has(tok));
    if (keep) {
      for (let k = i; k <= j; k++) out.push(tok);
    } else {
      out.push(tok);
    }
    i = j;
  }
  return out.join(' ');
}

function cleanTranslation(persian, original, { brackets = false } = {}) {
  const src = String(original || '').trim();
  let s = String(persian || '').trim();
  if (!s) return src;
  if (s === src) return s;
  if (brackets && /[[\]]/.test(s)) s = s.replace(/[[\]]+/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  if (FA_LETTER.test(s) && !/download|subtitle|soundtrack|song|music|film|movie|series|episode|watch|view|instagram|telegram/i.test(src)) s = s.replace(HALLUCINATION, '').replace(/\s+/g, ' ').trim();
  s = collapseRepeats(s);
  // A "translation" with no Persian letters left is not a translation.
  if (!s || !FA_LETTER.test(s)) return src;
  return s;
}

function main() {
  const parsed = readJson(path.join(BUILD, 'parsed.json'), null);
  if (!parsed) throw new Error('parsed.json not found; run build-data.js first');
  const images = readJson(path.join(BUILD, 'images.json'), []);
  /* A broken quote in the forum source left literal `[/quote]` text nodes in
     67 posts. The renderer prints text as-is, so readers saw the tag. BBCode
     is furniture, never prose: drop the tags, keep every word around them. */
  const TAG = '(?:quote|qoute|attachment|dictionary|acronym|youtube|spoiler|video|flash|center|left|right|table|color|size|font|list|code|url|img|sup|sub|php|hr|tr|td|me|li|b|i|u|s)';
  const BBCode = new RegExp('\\[\\/?' + TAG + '(?:=[^\\]\\n]*)?\\]', 'gi');
  const BBCodeDangling = new RegExp('\\[\\/?' + TAG + '(?:\\s*=\\s*"[^"\\n]{0,60}")?', 'gi');
  const BBCodeLoose = /(^|\s)\/(?:quote|qoute|attachment|url|b|i|u|li)(?=\s|$)/gi;
  const URLAssign = /(^|\n)\s*URL\s*=\s*(?=\n|$)/gi;
  const TranslatorNote = /(^|\n)\s*[—–-]*\s*(?:پایان نقل.?قول|پایان ایتالیک)\s*[—–-]*\s*(?=\n|$)/g;
  const DebrisLine = /^(?:quote\s*=\s*"[^"]*"|(?=.*[\[\]\/='"`])[\[\]\/='"`\d\s]{1,8})$/;
  const stripBbcode = s => String(s || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(BBCode, ' ')
    .replace(BBCodeDangling, ' ')
    .replace(BBCodeLoose, ' ')
    .replace(URLAssign, '\n')
    .replace(TranslatorNote, '\n')
    .split(/\n\s*\n/)
    .filter(p => p.replace(/[\s[\]/=]/g, '') !== '' && !DebrisLine.test(p.trim()))
    .join('\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  // Baked translations already passed the policy; the raw machine cache is
  // only a fallback for a fresh checkout.
  const postTranslations = readJson(path.join(BUILD, 'posts', 'translations.baked.json'), null)
    || readJson(path.join(BUILD, 'posts', 'translations.json'), {});
  const postFa = text => {
    const raw = postTranslations[postHash(text)];
    if (!raw) return '';
    const cleaned = policy.cleanMachine(raw, text);
    if (!cleaned || !/[\u0600-\u06FF]/.test(cleaned)) return '';
    // Post bodies keep numbers, pair symbols and dates as they were written;
    // acronyms are exempt because the pipeline spells them out first.
    const issues = policy.auditPost(text, cleaned);
    if (issues.length) return '';
    const fa = policy.enforceTokens(text, cleaned, { strictTerms: false });
    return fa.replace(/\n{3,}/g, '\n\n').trim();
  };

  const journalIndex = [];
  const recent = [];
  const globalUnique = new Set();
  let totalOccurrences = 0;
  let outputImages = 0;
  let translatedPosts = 0;
  /* How much of the archive the reader simply cannot show, counted as the build
   * happens rather than by a later audit, so the number in the report and the
   * note in the UI come from the same pass. */
  let gapPosts = 0;
  const gapKeys = new Set();
  let threadPosts = 0;

  for (const journal of parsed.journals) {
    const id = journal.id;
    const byHash = new Map();
    const byId = new Map((journal.posts || []).map(p => [p.id, p]));
    const journalImages = [];
    const searchRows = [];
    const allRows = [];

    /* Which references this journal names but cannot ship, and why. Measured
     * before the posts loop so every post can carry the reason with it: the
     * reader then says "two plates of this post are not in the archive, their
     * files were truncated in 2021" instead of drawing nothing at all. Keys are
     * dropped again below if a duplicate record did ship them after all. */
    const skipped = new Map();
    for (const rec of journal.images || []) {
      if (!rec || !rec.hash || byHash.has(rec.hash) || skipped.has(rec.hash)) continue;
      let why = null;
      if (String(rec.hash).startsWith('remote_')) why = 'remote-url-dead';
      else if (!assetExists(rec.asset)) why = 'file-not-on-disk';
      else if ((Number(rec.bytes) || 0) < 512) {
        /* 9 bytes of PNG signature and 6 of JPEG are what the 2021 downloader
         * left; a text file saved as .png is what the forum's 404 page left.
         * They need different sentences to the reader, so look at the bytes. */
        why = 'header-only-2021-download';
        try {
          const fd = fs.openSync(rec.localPath, 'r');
          const probe = Buffer.alloc(32);
          const n = fs.readSync(fd, probe, 0, 32, 0);
          fs.closeSync(fd);
          const sig = (n > 24 && probe[0] === 0x89 && probe[1] === 0x50) || (n > 3 && probe[0] === 0xff && probe[1] === 0xd8) || (n > 6 && probe.toString('latin1', 0, 4) === 'GIF8');
          if (!sig) why = 'not-an-image';
        } catch { why = 'file-not-on-disk'; }
      }
      if (why) skipped.set(rec.hash, why);
    }

    for (const rec of journal.images) {
      if (!rec || !rec.hash || String(rec.hash).startsWith('remote_')) continue;
      if (!assetExists(rec.asset)) continue;
      if ((Number(rec.bytes) || 0) < 512) continue;
      const hash = rec.hash;
      totalOccurrences++;
      globalUnique.add(hash);
      // One record per unique image per journal; keep the first occurrence
      // so cards / gallery stay compact, while posts keep their hash links.
      if (byHash.has(hash)) continue;
      const thumb = fileSize(rec.thumb) > 300 ? rec.thumb : rec.asset;
      const item = {
        k: hash,
        t: thumb,
        f: rec.asset || '',
        w: Number(rec.width) || 0,
        h: Number(rec.height) || 0,
        b: Number(rec.bytes) || 0,
        o: rec.originalName || normName(rec.asset),
        p: Number(rec.pageNum) || 1,
        pid: rec.postId || '',
      };
      byHash.set(hash, item);
      journalImages.push(item);
      outputImages++;
    }

    const posts = [];
    for (const hash of [...skipped.keys()]) if (byHash.has(hash)) skipped.delete(hash);
    for (const post of journal.posts) {
      const rawText = String(post.text || '').trim();
      const text = stripBbcode(rawText);
      const im = [];
      const gap = {};
      const seen = new Set();
      for (const key of (post.images || [])) {
        if (!byHash.has(key)) {
          if (skipped.has(key)) gap[key] = skipped.get(key);
          continue;
        }
        if (seen.has(key)) continue;
        seen.add(key);
        im.push(key);
      }
      if (!text && !im.length && !Object.keys(gap).length) continue;
      const gapN = Object.keys(gap).length;
      if (gapN) { gapPosts++; for (const h of Object.keys(gap)) gapKeys.add(h); }
      const faRaw = postFa(rawText);
      /* A slash, a tag or an attachment line has no meaning to translate; a
         Persian line under it would be a phantom post. */
      const fa = faRaw && /[\p{L}\p{N}]/u.test(text) ? stripBbcode(faRaw) : '';
      if (fa) translatedPosts++;
      const row = {
        id: post.id,
        t: text,
        a: post.author || '—',
        d: post.date || '',
        r: post.rank || '',
        n: post.number || '',
        p: Number(post.pageNum) || 1,
        im,
      };
      if (fa) {
        row.fa = fa;
      }
      /* Optional print-layout anchors: image key -> paragraph it follows.
         Parsed anchors arrive parallel to post.images; only keep the keys that
         survived dedupe/missing-plate filtering above. */
      if (Array.isArray(post.ib)) {
        const anchored = {};
        (post.images || []).forEach((key, i) => {
          if (im.includes(key) && Number.isFinite(post.ib[i])) anchored[key] = post.ib[i];
        });
        if (Object.keys(anchored).length) row.ib = anchored;
      } else if (post.ib && typeof post.ib === 'object' && Object.keys(post.ib).length) {
        row.ib = post.ib;
      }
      if (Object.keys(gap).length) row.gap = gap;
      /* Threading, from _build/reply-graph.js: the message number the forum
       * gave this post, and the posts whose words it quotes. The full quoted
       * text already sits inside `t` — the forum printed it inline — so the
       * row carries the relationship plus a short labelled excerpt of what is
       * being answered, never a second copy of the post. */
      if (post.mid) row.m = post.mid;
      if (Array.isArray(post.quotes) && post.quotes.length) {
        const qs = post.quotes
          .filter(q => q && q.pid && q.pid !== post.id && byId.has(q.pid))
          .map(q => {
            const out = { p: q.pid, a: q.author || (byId.get(q.pid) || {}).author || '' };
            if (q.x) out.x = String(q.x).slice(0, 220);
            return out;
          });
        if (qs.length) { row.q = qs; threadPosts++; }
      }
      posts.push(row);
      if (text || im.length) {
        searchRows.push([id, row.p, post.id, text.slice(0, 20000), fa.slice(0, 20000)]);
        allRows.push([id, row.p, post.id, row.d, row.a, excerpt(text, 320), im.length, excerpt(fa, 320)]);
        const recentRow = {
          j: id,
          p: row.p,
          id: post.id,
          n: row.n,
          d: row.d,
          a: row.a,
          x: excerpt(text, 220),
          imgs: im.length,
          ts: parseDate(row.d),
        };
        if (fa) recentRow.f = excerpt(fa, 220);
        recent.push(recentRow);
      }
    }

    if (!posts.length && !journalImages.length) continue;

    const pages = Math.max(
      Number(journal.pages) || 0,
      ...posts.map(p => p.p || 0),
      ...journalImages.map(im => im.p || 0)
    );
    const pagePosts = new Map();
    for (const row of posts) {
      if (!pagePosts.has(row.p)) pagePosts.set(row.p, []);
      pagePosts.get(row.p).push(row);
    }
    /* A plate belongs to its recorded page, and also to every page whose post
       names it: the same chart can be quoted on a later page. */
    const pageImages = new Map();
    const addImage = (page, item) => {
      if (!pageImages.has(page)) pageImages.set(page, new Map());
      pageImages.get(page).set(item.k, item);
    };
    for (const item of journalImages) addImage(item.p || 1, item);
    for (const row of posts) {
      for (const key of row.im || []) {
        const item = byHash.get(key);
        if (item) addImage(row.p, item);
      }
    }

    const fileId = encodeURIComponent(id);
    const base = path.join(JOURNAL_DIR, fileId);
    writeJson(base + '.json', {
      id,
      name: journal.name,
      title: journal.title || journal.name,
      kind: journal.kind === 'topic' ? 'topic' : 'journal',
      dir: journal.dir,
      pages,
      pageFiles: journal.pageFiles || [],
      postCount: posts.length,
      imageCount: journalImages.length,
      posts: posts.map(p => ({ id: p.id, p: p.p, n: p.n, a: p.a })),
    });
    for (let n = 1; n <= pages; n++) {
      writeJson(path.join(base, 'p' + n + '.json'), {
        posts: pagePosts.get(n) || [],
        images: [...(pageImages.get(n) || new Map()).values()],
      });
    }
    writeJson(path.join(JOURNAL_DIR, fileId + '-images.json'), journalImages);
    writeJson(path.join(DATA, 'search', fileId + '.json'), { posts: searchRows });
    writeJson(path.join(DATA, 'posts', fileId + '.json'), allRows);

    journalIndex.push({
      id,
      name: journal.name,
      title: journal.title || journal.name,
      kind: journal.kind === 'topic' ? 'topic' : 'journal',
      pages,
      posts: posts.length,
      images: journalImages.length,
    });

    console.log(`[${id}] ${posts.length} posts, ${journalImages.length} images, ${pages} pages`);
  }

  recent.sort((a, b) => (b.ts || 0) - (a.ts || 0) || String(a.j).localeCompare(String(b.j)));
  const recentItems = recent.slice(0, 12).map(({ ts, ...rest }) => rest);

  const stats = {
    journals: journalIndex.filter(j => j.kind !== 'topic').length,
    topics: journalIndex.filter(j => j.kind === 'topic').length,
    pages: journalIndex.reduce((a, j) => a + j.pages, 0),
    posts: journalIndex.reduce((a, j) => a + j.posts, 0),
    images: journalIndex.reduce((a, j) => a + j.images, 0),
    uniqueImages: globalUnique.size,
    imageOccurrences: totalOccurrences,
    postsWithMissingPlates: gapPosts,
    missingPlateFiles: gapKeys.size,
    postsWithThreading: threadPosts,
    translatedPosts,
    rawImageTags: parsed.stats && parsed.stats.rawImageTags ? parsed.stats.rawImageTags : 15408,
    generatedAtLabel: new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium' }).format(new Date()),
  };

  const index = { journals: journalIndex, recent: recentItems, stats };
  index.rankBadges = readJson(path.join(DATA, 'rank-badges.json'), {});
  writeJs(path.join(DATA, 'index.js'), `window.RTM_INDEX=${json(index)};\n`);

  /* The old monoliths are replaced by shards; keeping them beside the new
     files means every deploy still carries ~21 MB of data nobody asks for. */
  for (const name of ['search.js', 'posts.js']) {
    try { fs.unlinkSync(path.join(DATA, name)); } catch {}
  }
  for (const name of fs.readdirSync(JOURNAL_DIR)) {
    if (name.endsWith('.js')) { try { fs.unlinkSync(path.join(JOURNAL_DIR, name)); } catch {} }
  }

  const dirSize = dir => fs.readdirSync(dir, { withFileTypes: true }).reduce((sum, entry) => {
    const file = path.join(dir, entry.name);
    return sum + (entry.isDirectory() ? dirSize(file) : fs.statSync(file).size);
  }, 0);
  const mb = bytes => (bytes / 1024 / 1024).toFixed(2) + ' MB';
  console.log('\nDONE');
  console.log('index.js  ', mb(fs.statSync(path.join(DATA, 'index.js')).size));
  console.log('journals  ', mb(dirSize(JOURNAL_DIR)), fs.readdirSync(JOURNAL_DIR).length, 'entries');
  console.log('search    ', mb(dirSize(path.join(DATA, 'search'))));
  console.log('posts     ', mb(dirSize(path.join(DATA, 'posts'))));
  console.log('journals  ', fs.readdirSync(JOURNAL_DIR).length, 'files');
  console.log(stats);
}

try {
  main();
} catch (e) {
  console.error(e);
  process.exit(1);
}
