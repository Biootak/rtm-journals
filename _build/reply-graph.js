/* --------------------------------------------------------------- reply graph
 * The forum showed a conversation: every row was a numbered message, and a
 * reply carried the words it answered inside a quote block. The archive kept
 * the text but dropped both facts, so the reader today shows 10,309 posts as a
 * flat list — the trader cannot tell who is answering whom.
 *
 * What the mirrored pages actually still hold:
 *   - a numeric Kunena message id on every row (`kreply71540_form`,
 *     `…/report/71540`) — the identity the site used for the message;
 *   - `<blockquote><p class="kmsgtext-quote">Author wrote: …</p></blockquote>`
 *     — the quoted parent, whose words are copied verbatim from that message.
 * There is no stored "in reply to" pointer in a flat forum page: the quote IS
 * the answer-relationship, so a reply is attributed by matching the quoted text
 * back to the one post it came from.
 *
 * Two rules keep that honest:
 *   1. Own words beat echoes. An echo chain is the common case — A posts,
 *      B quotes A, C quotes B with A's words inside — so the pool keeps each
 *      post's own text (blockquote markup removed) apart from its full text.
 *      A candidate only wins on `own` when the words are its own; the full
 *      text is used when nothing of the author's own matches at all.
 *   2. A quote gets a parent only when exactly one older post by that author
 *      contains it as a real substring (≥24 characters, ≥40 when the quote
 *      names no author). Otherwise the reason is recorded — `ambiguous`,
 *      `not-found`, `too-short`, `author-not-in-journal` — and the reader says
 *      "نقل‌قول از Ryan" without inventing a link.
 *
 *   node _build/reply-graph.js            measure, write nothing
 *   node _build/reply-graph.js --only if  one journal (never with --write)
 *   node _build/reply-graph.js --write    add mid/quotes to parsed.json (+backup)
 *   node _build/reply-graph.js --list     print a resolved / unresolved sample
 */
'use strict';
const fs = require('fs'), path = require('path');
const cheerio = require('cheerio');
const ROOT = path.resolve(__dirname, '..');
const PARSED = path.join(ROOT, '_build', 'parsed.json');
const MANIFEST = path.join(ROOT, '_build', 'reply-graph.json');
const WRITE = process.argv.includes('--write');
const LIST = process.argv.includes('--list');
const ONLY = (() => { const i = process.argv.indexOf('--only'); return i > 0 ? process.argv[i + 1] : null; })();
if (WRITE && ONLY) { console.error('--write refuses --only: it would half-update parsed.json'); process.exit(2); }

const parsed = JSON.parse(fs.readFileSync(PARSED, 'utf8'));

/* ------------------------------------------------------------------ matching */
function norm(s) {
  return String(s || '')
    .replace(/\u200c/g, ' ')           /* ZWNJ is a writing aid, not content  */
    .replace(/\u00a0/g, ' ')
    .toLowerCase()
    .replace(/\[[^\]]{0,40}\]/g, ' ')  /* bbcode left in text                 */
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
/* What the reader gets to see of the quoted words: the first line or so, cleaned
 * of bbcode leftovers, cut at a word boundary. A label, not a transcription —
 * the full quoted text stays inside the post body exactly as the forum printed
 * it, so nothing here can drift away from it. */
function excerpt(s) {
  const t = String(s || '').replace(/\[[^\]]{0,40}\]/g, ' ').replace(/\s+/g, ' ').trim();
  if (t.length <= 180) return t;
  const cut = t.slice(0, 180);
  const sp = cut.lastIndexOf(' ');
  return (sp > 100 ? cut.slice(0, sp) : cut).replace(/[,;:.\-–—'"`]+$/, '') + ' …';
}
const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
function dateKey(d) {
  const m = /(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/.exec(String(d || ''));
  if (!m) return null;
  const mo = (MONTHS[m[2].slice(0, 3).toLowerCase()] ?? null);
  if (mo === null) return null;
  return Date.UTC(+m[3], mo, +m[1]);
}
/* Longest prefix of `q` still present in `c`, probed at descending lengths. */
function overlap(q, c) {
  if (!q || !c) return 0;
  const probe = Math.min(q.length, 200);
  for (let len = probe; len >= 24; len = Math.floor((len - 1) * 0.75)) {
    if (c.includes(q.slice(0, len))) return len;
  }
  /* The quote may start mid-sentence: try from a few offsets. */
  for (const off of [20, 40, 80]) {
    if (q.length <= off + 24) continue;
    const sub = q.slice(off);
    for (let len = Math.min(sub.length, 120); len >= 40; len = Math.floor((len - 1) * 0.7)) {
      if (c.includes(sub.slice(0, len))) return len;
    }
  }
  return 0;
}
/* The emoticon half of build-data.js's SKIP_IMAGE_RE, kept in sync by hand
 * because a quote's smiley is decoration, not an attachment fingerprint. */
const EMOTICON_NAMES = /(?:^|_)(?:smiley|emot|icon|badge|spacer|blank\.|pixel\.|transparent\.|thumbsup|notworthy|cheer|clap|wave\.|study\.|sleep\.|blush\.|hug\.|love\.|party\.|biggrin\.|devil\.|cool\.|sad\.|wink\.|laugh\.|confus|huh\.|rolleyes|tongue|kiss|angry|shock|dry\.|sick|pinch|frustrat|good\.|beer|birthday|cake|dance|flower|gift|heart|rose|star\.|sun\.|rainbow|coffee|popcorn|rock\.|bandit|ninja|pirate|santa|clown|ghost|skull|alien|robot|bunny|cat\.|dog\.|bear|panda|penguin|monkey|pig\.|cow\.|chicken|frog|fish|horse|sheep|tiger|lion|wolf|fox\.|owl\.|bee\.|ant\.|bug\.|snail|turtle|dolphin|whale|shark|octopus|crab|butterfly|dragon|unicorn)/i;

/* --------------------------------------------------------------- quote reading
 * One row can nest quotes several deep ([quote=A][quote=B]…[/quote][/quote]).
 * The outermost block is what this post answers, so depth 0 wins. */
function quotesOf($, body) {
  const out = [];
  body.find('blockquote').each((_, el) => {
    const bq = $(el);
    let depth = 0, p = bq.parent();
    while (p.length && !p.is('body')) { if (p.is('blockquote')) depth++; p = p.parent(); }
    if (depth > 2) return;                       /* deeper than "answered" — noise */
    const pEl = bq.find('p.kmsgtext-quote').first().length ? bq.find('p.kmsgtext-quote').first() : bq.children('p').first();
    const raw = (pEl.length ? pEl.text() : bq.text()).replace(/\s+/g, ' ').trim();
    const m = /^([^\s:][^:]{0,60}?)\s*(?:wrote|writes)\s*:\s*/i.exec(raw);
    const author = m ? m[1].trim() : null;
    const text = m ? raw.slice(m[0].length) : raw;
    const atts = [];
    /* A quoted chart is a fingerprint: the same attachment file appears in the
     * parent post, which resolves a picture-only quote no text can match. Only
     * real attachments count — letting the forum's smileys in invented 163
     * "not-found" quotes on the first run of this script. */
    bq.find('img').each((_, im) => {
      const s = $(im).attr('src') || $(im).attr('data-original') || '';
      const cls = String($(im).attr('class') || '');
      if (/bbcode_smiley|kavatar|kicon|smiley/i.test(cls)) return;
      if (/emoticon|smiley|avatar/i.test(String(s))) return;
      const base = decodeURIComponent(String(s).split(/[?#]/)[0].split('/').pop() || '');
      if (!/\.(?:png|jpe?g|gif|webp)$/i.test(base)) return;
      if (EMOTICON_NAMES.test(base)) return;
      atts.push(base.toLowerCase());
    });
    if (!text.replace(/[^a-z0-9]/gi, '') && !atts.length) return;
    out.push({ depth, author, text, atts, chars: text.length });
  });
  out.sort((a, b) => a.depth - b.depth);
  return out;
}

/* ------------------------------------------------------------------- the pass */
const stats = {
  pages: 0, rows: 0, rowsWithMid: 0, mids: 0, postsInArchive: 0,
  postsWithQuote: 0, quotes: 0, resolved: 0, unresolved: 0,
  resolvedByOwnWords: 0, resolvedFromFullText: 0, resolvedByAttachmentOnly: 0,
  resolvedByBoth: 0, resolvedBare: 0, resolvedByIdentical: 0,
  reasons: {}, byDepth: {},
  quotedAuthorsInJournal: 0, quotedAuthorsExternal: 0,
  postsWithParent: 0, postsWithKnownChildren: 0,
};
const samples = { resolved: [], unresolved: [] };
const perJournal = {};
const writeData = new Map();      /* postId -> { mid, quotes: [{p,a,via,chars}] } */

for (const J of parsed.journals) {
  if (ONLY && J.id !== ONLY) continue;
  const dir = path.join(ROOT, J.dir || '');
  const pageFiles = J.pageFiles || [];
  const posts = J.posts || [];
  const byId = new Map(posts.map(p => [p.id, p]));
  const key = (pi, ti) => `${J.id}_p${pi}_${ti}`;
  const imgByHash = new Map((J.images || []).map(x => [x.hash, x]));

  /* Phase 1 — read every row once: its message id, its quote blocks, and the
   * author's own words with all quoted material taken out. */
  const rows = [];
  stats.journals = (stats.journals || 0) + 1;
  for (let pi = 0; pi < pageFiles.length; pi++) {
    let html;
    try { html = fs.readFileSync(path.join(dir, pageFiles[pi]), 'utf8'); } catch { continue; }
    stats.pages++;
    const $ = cheerio.load(html);
    const tables = $('table.kmsg');
    for (let ti = 0; ti < tables.length; ti++) {
      stats.rows++;
      const row = tables.eq(ti);
      const rowHtml = $.html(row);
      const mm = /kreply(\d+)_form/.exec(rowHtml) || /\/report\/(\d+)/.exec(rowHtml);
      const mid = mm ? +mm[1] : null;
      if (mid) { stats.rowsWithMid++; }
      const pid = key(pi + 1, ti + 1);
      const post = byId.get(pid);
      if (!post) continue;                      /* empty row dropped at parse  */
      stats.postsInArchive++;
      if (mid) stats.mids++;
      const body = row.find('.kmsgtext').first();
      if (!body.length) continue;
      const ownEl = body.clone();
      ownEl.find('blockquote').remove();
      const qs = quotesOf($, body);
      rows.push({ pid, post, mid, qs, own: norm(ownEl.text()) });
      if (qs.length) stats.postsWithQuote++;
    }
  }

  /* Candidate pool: own words first, whole text as the fallback. */
  const attsOf = p => new Set((p.images || []).map(h => {
    const rec = imgByHash.get(h);
    return rec && rec.originalName ? String(rec.originalName).toLowerCase() : null;
  }).filter(Boolean));
  const byAuthor = new Map();
  const allPool = [];
  const rowOwn = new Map(rows.map(r => [r.pid, r.own]));
  for (const p of posts) {
    const a = String(p.author || '').trim().toLowerCase();
    const c = {
      id: p.id, dk: dateKey(p.date), author: p.author,
      own: rowOwn.get(p.id) || '', all: norm(p.text), atts: attsOf(p),
    };
    if (!byAuthor.has(a)) byAuthor.set(a, []);
    byAuthor.get(a).push(c);
    allPool.push(c);
  }
  for (const list of byAuthor.values()) list.sort((x, y) => (x.dk || 0) - (y.dk || 0));
  allPool.sort((x, y) => (x.dk || 0) - (y.dk || 0));

  const score = (nq, c, use, minChars) => (nq.length >= minChars ? overlap(nq, use ? c.own : c.all) : 0);
  const byIdPool = new Map(allPool.map(c => [c.id, c]));
  const pick = (nq, q, pool, myDk, minChars, selfId) => {
    /* two tiers: the author's own words first, then anything they posted. The
     * first tier is what breaks an echo chain — if B only re-quoted A, the
     * words are not B's own, so A still wins outright. */
    for (const use of [true, false]) {
      const cands = [];
      for (const c of pool) {
        if (c.id === selfId) continue;
        if (myDk !== null && c.dk !== null && c.dk > myDk) continue;   /* cannot quote the future */
        const sc = score(nq, c, use, minChars);
        const attHit = q.atts.length ? q.atts.filter(x => c.atts.has(x)).length : 0;
        if (sc >= minChars) cands.push({ id: c.id, score: sc, attHit, dk: c.dk, own: !!use, via: attHit ? 'text+attachment' : (use ? 'own-text' : 'full-text') });
        else if (!use && sc === 0 && attHit > 0) cands.push({ id: c.id, score: minChars, attHit, dk: c.dk, own: false, via: 'attachment' });
      }
      if (!cands.length) continue;
      const best = Math.max(0, ...cands.map(c => c.score));
      let top = cands.filter(c => c.score === best);
      if (top.length > 1 && q.atts.length) {
        const withAtt = top.filter(c => c.attHit > 0);
        if (withAtt.length === 1) top = withAtt;
      }
      if (top.length > 1) {
        /* Identical wording posted twice: any of them says the same thing, so
         * the earliest is named and the rule that chose it is recorded. */
        const texts = new Set(top.map(t => ((byIdPool.get(t.id) || {}).all) || ''));
        if (texts.size === 1) {
          const first = top.slice().sort((a, b) => (a.dk || 0) - (b.dk || 0) || a.id.localeCompare(b.id))[0];
          return { top: [first], identical: true, use };
        }
        return { top: null, ambiguous: top, use };
      }
      return { top, identical: false, use };
    }
    return { top: null, none: true };
  };

  for (const r of rows) {
    if (r.mid) {
      if (!writeData.has(r.pid)) writeData.set(r.pid, {});
      writeData.get(r.pid).mid = r.mid;
    }
    if (!r.qs.length) continue;
    const resolvedList = [];
    for (const q of r.qs) {
      stats.quotes++;
      stats.byDepth[q.depth] = (stats.byDepth[q.depth] || 0) + 1;
      const who = String(q.author || '').trim();
      const bare = !who;
      const pool = bare ? allPool : byAuthor.get(who.toLowerCase());
      if (!bare) {
        if (!pool) {
          stats.reasons['author-not-in-journal'] = (stats.reasons['author-not-in-journal'] || 0) + 1;
          stats.quotedAuthorsExternal++; stats.unresolved++;
          samples.unresolved.push({ pid: r.pid, jid: J.id, why: 'author-not-in-journal', author: who, text: q.text.slice(0, 70) });
          continue;
        }
        stats.quotedAuthorsInJournal++;
      }
      const nq = norm(q.text);
      const minChars = bare ? 40 : 24;
      if (nq.length < minChars && !q.atts.length) {
        stats.reasons['too-short'] = (stats.reasons['too-short'] || 0) + 1; stats.unresolved++;
        samples.unresolved.push({ pid: r.pid, jid: J.id, why: 'too-short', author: who, text: q.text.slice(0, 70) });
        continue;
      }
      const myDk = dateKey(r.post.date);
      const res = pick(nq, q, pool, myDk, minChars, r.pid);
      if (res.ambiguous) {
        stats.reasons['ambiguous'] = (stats.reasons['ambiguous'] || 0) + 1; stats.unresolved++;
        samples.unresolved.push({ pid: r.pid, jid: J.id, why: 'ambiguous', author: who, n: res.ambiguous.length, ids: res.ambiguous.map(t => t.id).slice(0, 4), chars: res.ambiguous[0].score, ownTier: res.use, text: q.text.slice(0, 70) });
        continue;
      }
      if (!res.top || !res.top.length) {
        stats.reasons['not-found'] = (stats.reasons['not-found'] || 0) + 1; stats.unresolved++;
        samples.unresolved.push({ pid: r.pid, jid: J.id, why: 'not-found', author: who, chars: nq.length, atts: q.atts.length, text: q.text.slice(0, 70) });
        continue;
      }
      const win = res.top[0] || res.top;
      const via = res.identical ? 'own-identical' : win.via;
      const authorLabel = who || ((byId.get(win.id) || {}).author || '');
      stats.resolved++;
      if (bare) stats.resolvedBare++;
      if (res.identical) stats.resolvedByIdentical++;
      if (win.own) stats.resolvedByOwnWords++; else stats.resolvedFromFullText++;
      if (via === 'text+attachment' || via === 'own-text') { if (win.attHit) stats.resolvedByBoth++; }
      if (via === 'attachment') stats.resolvedByAttachmentOnly++;
      resolvedList.push({ p: win.id, a: authorLabel, via, chars: win.score, x: excerpt(q.text) });
      samples.resolved.push({ pid: r.pid, jid: J.id, author: authorLabel, parent: win.id, via, chars: win.score, text: q.text.slice(0, 60) });
    }
    if (resolvedList.length) {
      if (!writeData.has(r.pid)) writeData.set(r.pid, {});
      writeData.get(r.pid).quotes = resolvedList;
    }
  }

  const children = new Map();
  for (const [childId, d] of writeData) {
    if (!d.quotes || !childId.startsWith(J.id + '_')) continue;
    for (const q of d.quotes) if (q.p !== childId) (children.get(q.p) || children.set(q.p, []).get(q.p)).push(childId);
  }
  perJournal[J.id] = { posts: (J.posts || []).length, mids: rows.filter(r => r.mid).length, quotes: 0, resolved: 0, parentsWithReplies: children.size };
  for (const [childId, d] of writeData) if (childId.startsWith(J.id + '_')) { perJournal[J.id].quotes += (d.quotes || []).length; perJournal[J.id].resolved += (d.quotes || []).length; }
  perJournal[J.id].quoteBlocks = 0;
}

/* per-post totals, straight from the collected map (writeData is keyed by post,
 * so one pass is exact — an older version looped it per journal and multiplied) */
{
  const parents = new Set();
  let withParent = 0;
  for (const [, d] of writeData) {
    if (!d.quotes || !d.quotes.length) continue;
    withParent++;
    for (const q of d.quotes) parents.add(q.p);
  }
  stats.postsWithParent = withParent;
  stats.postsWithKnownChildren = parents.size;
}

console.log('mirrored pages read              :', stats.pages);
console.log('message rows / with numeric mid  :', stats.rows, '/', stats.rowsWithMid);
console.log('rows that are archived posts     :', stats.postsInArchive);
console.log('posts that carry a quote block   :', stats.postsWithQuote);
console.log('quote blocks seen                :', stats.quotes, JSON.stringify(stats.byDepth));
console.log('  resolved to one parent post    :', stats.resolved,
  '(own words: ' + stats.resolvedByOwnWords +
  ', only whole text: ' + stats.resolvedFromFullText +
  ', text+attachment: ' + stats.resolvedByBoth +
  ', attachment-only: ' + stats.resolvedByAttachmentOnly +
  ', author-less quote: ' + stats.resolvedBare +
  ', identical double-post: ' + stats.resolvedByIdentical + ')');
console.log('  unresolved                     :', stats.unresolved, JSON.stringify(stats.reasons));
console.log('quoted authors inside the journal:', stats.quotedAuthorsInJournal, '| outside it:', stats.quotedAuthorsExternal);
console.log('posts with a known parent        :', stats.postsWithParent);
console.log('posts with a known reply         :', stats.postsWithKnownChildren);
for (const [k, v] of Object.entries(perJournal)) console.log('  ' + k.padEnd(14), 'posts', String(v.posts).padStart(5), 'mids', String(v.mids).padStart(5), 'resolved quotes', String(v.resolved).padStart(5), 'parents with replies', v.parentsWithReplies);

fs.writeFileSync(MANIFEST, JSON.stringify({ generatedAt: new Date().toISOString(), stats, perJournal, sampleResolved: samples.resolved.slice(0, 60), sampleUnresolved: samples.unresolved.slice(0, 60) }, null, 1));
console.log('  wrote ' + path.relative(ROOT, MANIFEST));

if (LIST) {
  console.log('\nresolved sample:');
  for (const s of samples.resolved.slice(0, 12)) console.log(' ', s.pid, '<-', s.parent, '(' + s.via + ',' + s.chars + 'ch)', JSON.stringify(s.text));
  console.log('\nunresolved sample:');
  for (const s of samples.unresolved.slice(0, 12)) console.log(' ', s.pid, s.why, s.author || '-', 'n=' + (s.n || 0), JSON.stringify(s.text));
}

if (WRITE) {
  const BACKUP = path.join(ROOT, '_build', 'parsed.pre-reply.json');
  if (!fs.existsSync(BACKUP)) fs.copyFileSync(PARSED, BACKUP);
  let n = 0;
  for (const J of parsed.journals) {
    for (const p of J.posts || []) {
      const d = writeData.get(p.id);
      if (!d) continue;
      if (d.mid) p.mid = d.mid;
      if (d.quotes) p.quotes = d.quotes.map(q => ({ pid: q.p, author: q.a, via: q.via, chars: q.chars, x: q.x }));
      n++;
    }
  }
  parsed.stats = parsed.stats || {};
  parsed.stats.replyGraph = {
    generatedAt: new Date().toISOString().slice(0, 10),
    quoteBlocks: stats.quotes, resolved: stats.resolved,
    postsWithParent: stats.postsWithParent, postsWithKnownChildren: stats.postsWithKnownChildren,
    mids: stats.mids, unresolved: stats.unresolved, reasons: stats.reasons,
  };
  fs.writeFileSync(PARSED, JSON.stringify(parsed));
  console.log('  wrote mid/quotes for ' + n + ' posts into ' + path.relative(ROOT, PARSED));
  console.log('  next step           node _build/build-site.js');
} else {
  console.log('  (report only — parsed.json untouched; add --write)');
}
