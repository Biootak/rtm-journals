/*
 * Translate full post texts to Persian with Bing's LLM translator.
 *
 * - resumable cache keyed by normalized text hash
 * - preserves paragraph breaks by translating paragraph chunks
 * - keeps numbers, dates, URLs and tickers through <n> placeholders
 * - falls back to the offline Argos model for any failed chunks
 *
 * Usage:
 *   node translate-posts.js [--limit 100] [--concurrency 1] [--interval 1400]
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const core = require('./translate.js');

const ROOT = 'E:/Trade/journals';
const BUILD = path.join(ROOT, '_build');
const POSTS_DIR = path.join(BUILD, 'posts');
const CACHE_FILE = path.join(POSTS_DIR, 'translations.json');
const FALLBACKS_FILE = path.join(POSTS_DIR, 'fallbacks.json');
const PARSED = path.join(BUILD, 'parsed.json');
const PY = path.join(BUILD, 'py', 'Scripts', 'python.exe');
const LOCAL_SCRIPT = path.join(BUILD, 'translate-local.py');
const LOCAL_IN = path.join(POSTS_DIR, 'local-input.json');
const LOCAL_OUT = path.join(POSTS_DIR, 'local-output.json');

const args = process.argv.slice(2);
function argVal(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
}
const LIMIT = Math.max(0, parseInt(argVal('--limit', '0'), 10) || 0);
const MAX_CHARS = Math.max(300, parseInt(argVal('--max-chars', '900'), 10) || 900);
const MIN_CHARS = Math.max(1, parseInt(argVal('--min-chars', '20'), 10) || 20);
const CONCURRENCY = Math.max(1, Math.min(3, parseInt(argVal('--concurrency', '1'), 10) || 1));

function normalizeForHash(text) {
  return String(text || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}
function hashText(text) {
  return crypto.createHash('sha1').update(normalizeForHash(text)).digest('hex');
}
function hasLatin(text) { return /[A-Za-z]/.test(text); }
function hasPersian(text) { return /[\u0600-\u06FF]/.test(text); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function loadJson(file, fallback) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } }
function saveJson(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj), 'utf8');
  fs.renameSync(tmp, file);
}

// Turn RTM/ICT shorthand into full English before translation. The LLM
// translator then produces real Persian terms instead of guessing at short
// acronyms (for example "eng" used to become "engineer").
const PAIR_SHORTHAND = '(?:EURUSD|GBPUSD|USDJPY|EURJPY|GBPJPY|AUDUSD|NZDUSD|USDCAD|USDCHF|XAUUSD|XAGUSD|EU|GU|UJ|EJ|GJ|AU|UC|AG|AJ|NJ|NU|AN|GA|EA)';

// "Long" and "short" are adjectives in ordinary English, but in these
// journals they almost always mean buy/sell positions. Rewriting only the
// unambiguous position phrases keeps normal uses ("a long time") intact.
function expandTradingLingo(text) {
  let s = String(text);
  const rep = (re, value) => { s = s.replace(re, value); };
  rep(/\b(am|is|are|was|were)\s+going\s+long\b/gi, '$1 opening a buy position');
  rep(/\b(am|is|are|was|were)\s+going\s+short\b/gi, '$1 opening a sell position');
  rep(/\b(?:went|gone)\s+long\b/gi, 'opened a buy position');
  rep(/\b(?:went|gone)\s+short\b/gi, 'opened a sell position');
  rep(/\b(?:go|going)\s+long\b/gi, 'open a buy position');
  rep(/\b(?:go|going)\s+short\b/gi, 'open a sell position');
  rep(/\bi'?m\s+long\b/gi, 'I am in a buy position');
  rep(/\bi'?m\s+short\b/gi, 'I am in a sell position');
  rep(/\b(am|is|are|was|were|be|been|stay|stayed|remain|remained|hold|holding)\s+long\b/gi, '$1 in a buy position');
  rep(/\b(am|is|are|was|were|be|been|stay|stayed|remain|remained|hold|holding)\s+short\b/gi, '$1 in a sell position');
  rep(/\btook\s+a\s+long\b(?!\s+(?:time|while|break|way|look|pause|rest|vacation|holiday|drive|walk|shot)\b)/gi, 'opened a buy position');
  rep(/\btook\s+a\s+short\b(?!\s+(?:time|while|break|way|look|pause|rest|vacation|holiday|drive|walk|shot)\b)/gi, 'opened a sell position');
  rep(/\b(?:take|taking)\s+a\s+long\b(?!\s+(?:time|while|break|way|look|pause|rest|vacation|holiday|drive|walk|shot)\b)/gi, 'open a buy position');
  rep(/\b(?:take|taking)\s+a\s+short\b(?!\s+(?:time|while|break|way|look|pause|rest|vacation|holiday|drive|walk|shot)\b)/gi, 'open a sell position');
  rep(/\ba\s+long\s+on\b/gi, 'a buy position on');
  rep(/\ba\s+short\s+on\b/gi, 'a sell position on');
  rep(/\blong\s+positions?\b/gi, 'buy positions');
  rep(/\bshort\s+positions?\b/gi, 'sell positions');
  rep(/\blongs\b/gi, 'buy positions');
  rep(/\bshorts\b/gi, 'sell positions');
  rep(/\blong\s+bias\b/gi, 'buy bias');
  rep(/\bshort\s+bias\b/gi, 'sell bias');
  rep(new RegExp(`\\b(long|short)\\s+(?=(?:the\\s+)?${PAIR_SHORTHAND}\\b)`, 'gi'), (m, side) => side.toLowerCase() === 'long' ? 'buy ' : 'sell ');
  // "held a buy position EU" -> "held a buy position in EU".
  rep(new RegExp(`\\b((?:buy|sell) positions?)\\s+(?=(?:the\\s+)?${PAIR_SHORTHAND}\\b)`, 'gi'), '$1 in ');
  rep(/\blong\s+(?:the\s+)?market\b/gi, 'buy the market');
  rep(/\bshort\s+(?:the\s+)?market\b/gi, 'sell the market');
  // "shorting" and "a short" are positions here, never durations. The
  // lookaheads keep real durations ("a short time", "short term") intact.
  rep(/\bshorting\b(?!\s+(?:term|time|while|period|run|version)\b)/gi, 'selling');
  rep(/\b(?:my|the|this|that|a|our|his|her)\s+short\b(?!\s+(?:time|while|break|way|look|pause|rest|vacation|holiday|drive|walk|shot|term|period|story|video|answer|post|reply|version|list|note|message)\b)/gi, '$& position');
  rep(/\b(?:taking|took)\s+shorts?\b/gi, 'opening sell positions');
  rep(/\bshorts?\s+(?:the\s+)?market\b/gi, 'sell the market');
  return s;
}

function expandAbbreviations(text) {
  return expandTradingLingo(String(text))
    .replace(/\ban FVG\b/gi, 'a fair value gap')
    .replace(/\bengs\b/gi, 'engulfing patterns')
    .replace(/\beng\b/gi, 'engulfing pattern')
    .replace(/\bITs\b/g, 'institutional traders')
    .replace(/\bIT's\b/g, "institutional traders'")
    .replace(/\bIT\b/g, 'institutional traders')
    .replace(/\bTFs\b/g, 'timeframes')
    .replace(/\bTF\b/g, 'timeframe')
    .replace(/\bLQ\b/g, 'liquidity')
    .replace(/\bPA\b/g, 'price action')
    .replace(/\bDP\b/g, 'decision point')
    .replace(/\bHTF\b/g, 'higher timeframe')
    .replace(/\bLTF\b/g, 'lower timeframe')
    .replace(/\bBOS\b/g, 'break of structure')
    .replace(/\bCHoCH\b/g, 'change of character')
    .replace(/\bFVG\b/g, 'fair value gap')
    .replace(/\bOB\b/g, 'order block')
    .replace(/\bS\/R\b/g, 'support/resistance')
    .replace(/\bS\/D\b/g, 'supply/demand')
    .replace(/\bSL\b/g, 'stop loss')
    .replace(/\bTP\b/g, 'take profit')
    .replace(/\bRR\b/g, 'risk-reward')
    .replace(/\bBE\b/g, 'break-even')
    .replace(/\bTG\s?([1-9])\b/g, 'target $1')
    .replace(/\bTG\b(?!\d)/g, 'target');
}

function findCut(text, max) {
  if (text.length <= max) return text.length;
  const window = text.slice(0, max + 1);
  const para = window.lastIndexOf('\n\n');
  if (para > max * 0.45) return para;
  const sentence = Math.max(window.lastIndexOf('. '), window.lastIndexOf('? '), window.lastIndexOf('! '));
  if (sentence > max * 0.45) return sentence + 1;
  const space = window.lastIndexOf(' ');
  return space > max * 0.5 ? space : max;
}

function chunkText(text, max = MAX_CHARS) {
  const chunks = [];
  let rest = normalizeForHash(text);
  while (rest.length > max) {
    const cut = findCut(rest, max);
    const part = rest.slice(0, cut).trim();
    if (part) chunks.push(part);
    rest = rest.slice(cut).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

function protectChunk(chunk) {
  const p = core.protect(chunk);
  return {
    masked: p.masked
      .replace(/\[\[(\d+)\]\]/g, '<$1>')
      .replace(/\uE000p(\d+)q\uE001/g, '<$1>'),
    restore: p.restore,
  };
}

function groupParagraphs(paras, maxChars = MAX_CHARS, maxLines = 6) {
  const groups = [];
  let cur = [];
  let size = 0;
  for (const p of paras) {
    const len = p.length + 1;
    if (cur.length && (cur.length >= maxLines || size + len > maxChars)) {
      groups.push(cur);
      cur = [];
      size = 0;
    }
    cur.push(p);
    size += len;
  }
  if (cur.length) groups.push(cur);
  return groups;
}

function brokenPlaceholder(text) {
  if (/<\s*\d+\s*>|\[\s*\[\s*\d+\s*\]\s*\]/.test(String(text || ''))) return true;
  // A lost mask leaves its index digit behind, e.g. "0 نوشت:" where the
  // original said "andrew519 wrote:". Retranslating that line alone fixes it.
  return /^\s*\d{1,2}\s+(?:نوشت|گفت)\s*:/.test(String(text || '').trim());
}

async function translateParagraphGroup(paras) {
  const masked = paras.map(protectChunk);
  try {
    const raw = await core.bingTranslateBatch(masked.map(m => m.masked));
    const parts = core.splitTranslated(raw, paras.length);
    if (parts) {
      const out = parts.map((p, i) => core.restoreText(p, masked[i].restore));
      if (out.every(t => t && !brokenPlaceholder(t))) return { out, failed: [] };
    }
  } catch (e) {
    console.warn('  group failed:', e.message, '|', paras[0].slice(0, 50));
  }
  // A line-count mismatch, empty line or damaged placeholder: retry each
  // paragraph alone so failures cannot shift text between paragraphs.
  const out = [];
  const failed = [];
  for (let i = 0; i < paras.length; i++) {
    try {
      const raw = await core.bingTranslateBatch([masked[i].masked]);
      const fa = core.restoreText(raw, masked[i].restore);
      if (!fa || brokenPlaceholder(fa)) throw new Error('empty or damaged placeholder');
      out.push(fa);
    } catch (e) {
      out.push('');
      failed.push({ index: i, chunk: paras[i], masked: masked[i].masked, restore: masked[i].restore });
    }
  }
  return { out, failed };
}

async function translateLongParagraph(paragraph) {
  const chunks = chunkText(paragraph, MAX_CHARS);
  const parts = [];
  const failed = [];
  for (const chunk of chunks) {
    const { masked, restore } = protectChunk(chunk);
    try {
      const raw = await core.bingTranslateBatch([masked]);
      const fa = core.restoreText(raw, restore);
      if (!fa || brokenPlaceholder(fa)) throw new Error('empty or damaged placeholder');
      parts.push(fa);
    } catch (e) {
      failed.push({ index: 0, chunk, masked, restore });
    }
  }
  return { text: parts.join(' ').trim(), failed };
}

async function translateOne(text) {
  // Posts were extracted from PDF pages, so most sentences are hard-wrapped
  // at arbitrary column widths. Collapse those single line breaks into spaces
  // so the translator gets whole sentences; blank lines still mark paragraphs.
  const prepared = expandAbbreviations(normalizeForHash(text))
    .replace(/(?<!\n)\n(?!\n)/g, ' ');
  const paragraphs = prepared.split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
  const translated = [];
  const failed = [];
  const chunks = [];
  const groups = groupParagraphs(paragraphs);

  for (const group of groups) {
    // A single huge paragraph is chunked separately; sending it in the group
    // first would translate it twice and can exceed the API text limit.
    if (group.length === 1 && group[0].length > MAX_CHARS) {
      const index = chunks.length;
      chunks.push(group[0]);
      const long = await translateLongParagraph(group[0]);
      translated[index] = long.text;
      long.failed.forEach(f => failed.push({ ...f, index }));
      continue;
    }
    const res = await translateParagraphGroup(group);
    for (let i = 0; i < group.length; i++) {
      const index = chunks.length;
      chunks.push(group[i]);
      translated[index] = res.out[i] || '';
      if (!translated[index]) {
        const f = res.failed.find(x => x.index === i);
        failed.push(f ? { ...f, index } : {
          index,
          chunk: group[i],
          masked: protectChunk(group[i]).masked,
          restore: protectChunk(group[i]).restore,
        });
      }
    }
  }
  return { chunks, translated, failed };
}

function localFallback(failedChunks) {
  if (!failedChunks.length) return new Map();
  console.log(`\nLocal fallback for ${failedChunks.length} chunks...`);
  fs.writeFileSync(LOCAL_IN, JSON.stringify(failedChunks.map(f => f.masked)), 'utf8');
  const res = spawnSync(PY, [LOCAL_SCRIPT, '--input', LOCAL_IN, '--output', LOCAL_OUT, '--batch', '128', '--beam', '2'], {
    cwd: BUILD,
    env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    stdio: 'inherit',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error('local translator exited with ' + res.status);
  const outs = JSON.parse(fs.readFileSync(LOCAL_OUT, 'utf8'));
  const map = new Map();
  failedChunks.forEach((f, i) => {
    const restored = core.restoreText(outs[i] || '', f.restore);
    map.set(f, restored.trim());
  });
  return map;
}

async function main() {
  fs.mkdirSync(POSTS_DIR, { recursive: true });
  const parsed = JSON.parse(fs.readFileSync(PARSED, 'utf8'));
  const cache = loadJson(CACHE_FILE, {});
  const fallbacks = loadJson(FALLBACKS_FILE, {});

  const byHash = new Map();
  let totalPosts = 0;
  for (const journal of parsed.journals) {
    for (const post of journal.posts) {
      const text = normalizeForHash(post.text || '');
      if (!text || text.length < MIN_CHARS || !hasLatin(text) || hasPersian(text)) continue;
      totalPosts++;
      const hash = hashText(text);
      if (!byHash.has(hash)) byHash.set(hash, { hash, text, count: 0 });
      byHash.get(hash).count++;
    }
  }

  let queue = [...byHash.values()].filter(x => !cache[x.hash]);
  queue.sort((a, b) => a.text.length - b.text.length);
  if (LIMIT) queue = queue.slice(0, LIMIT);
  console.log(`Posts with Latin text: ${totalPosts} | unique: ${byHash.size} | cached: ${Object.keys(cache).length} | pending: ${queue.length}`);

  const failedChunks = [];
  const pendingPosts = [];
  const started = Date.now();
  let doneChars = 0;
  let done = 0;
  let next = 0;

  async function worker() {
    while (true) {
      const index = next++;
      if (index >= queue.length) return;
      const item = queue[index];
      const res = await translateOne(item.text);
      if (res.failed.length) {
        res.failed.forEach(f => {
          f.hash = item.hash;
          failedChunks.push(f);
        });
        pendingPosts.push({ item, res });
      } else {
        const text = res.translated.join('\n\n').trim();
        if (text && !/<\s*\d+\s*>/.test(text)) {
          cache[item.hash] = text;
          delete fallbacks[item.hash];
          done++;
          doneChars += item.text.length;
        } else {
          console.warn('  post empty after translation:', item.hash.slice(0, 8), '|', item.text.slice(0, 60));
        }
      }
      if (done % 10 === 0) { saveJson(CACHE_FILE, cache); saveJson(FALLBACKS_FILE, fallbacks); }
      if (done % 20 === 0 && done) {
        const elapsed = (Date.now() - started) / 1000;
        const rate = doneChars / elapsed;
        const remainChars = queue.slice(done).reduce((a, x) => a + x.text.length, 0);
        const eta = rate > 0 ? Math.round(remainChars / rate / 60) : 0;
        console.log(`  ${done}/${queue.length} posts | chars ${Math.round(doneChars / 1000)}k | ${Math.round(rate)} chars/s | ETA ~${eta}m`);
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker());
  await Promise.all(workers);

  saveJson(CACHE_FILE, cache);
  saveJson(FALLBACKS_FILE, fallbacks);

  if (failedChunks.length) {
    const local = localFallback(failedChunks);
    let fixed = 0;
    for (const { item, res } of pendingPosts) {
      const parts = res.chunks.map((chunk, i) => {
        if (res.translated[i]) return res.translated[i];
        const found = failedChunks.find(f => f.hash === item.hash && f.index === i);
        return found ? local.get(found) || '' : '';
      });
      const joined = parts.filter(Boolean).join('\n\n').trim();
      if (joined && !/<\s*\d+\s*>/.test(joined)) {
        cache[item.hash] = joined;
        fallbacks[item.hash] = Date.now();
        fixed++;
      }
    }
    saveJson(CACHE_FILE, cache);
    saveJson(FALLBACKS_FILE, fallbacks);
    console.log(`Local fallback fixed ${fixed}/${pendingPosts.length} posts`);
  }

  console.log('DONE', { posts: Object.keys(cache).length, new: done, failedChunks: failedChunks.length, pending: pendingPosts.length });
}

main().catch(e => { console.error(e); process.exit(1); });
