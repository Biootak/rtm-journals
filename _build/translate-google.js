/*
 * Translate OCR lines (English -> Persian) with a resumable phrase cache.
 *
 * Usage:
 *   node translate.js [--limit 100] [--retry] [--only <hash>]
 *
 * Input : _build/ocr/results.jsonl
 * Output: _build/ocr/translations.json
 *         _build/ocr/phrase-cache.json
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'E:/Trade/journals';
const BUILD = path.join(ROOT, '_build');
const OCR_DIR = path.join(BUILD, 'ocr');
const RESULTS = path.join(OCR_DIR, 'results.jsonl');
const OUT = path.join(OCR_DIR, 'translations.json');
const PHRASES = path.join(OCR_DIR, 'phrase-cache.json');

const args = process.argv.slice(2);
function argVal(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
}
const LIMIT = parseInt(argVal('--limit', '0'), 10) || 0;
const RETRY = args.includes('--retry');
const ONLY = argVal('--only', '');
const CONCURRENCY = Math.max(1, Math.min(6, parseInt(argVal('--concurrency', '2'), 10) || 2));
const REQUEST_INTERVAL = Math.max(0, parseInt(argVal('--interval', '320'), 10) || 0);
let lastRequestAt = 0;
let pauseUntil = 0;

async function throttle() {
  const now = Date.now();
  if (pauseUntil > now) await sleep(pauseUntil - now);
  const afterPause = Date.now();
  const wait = Math.max(0, REQUEST_INTERVAL - (afterPause - lastRequestAt));
  if (wait) await sleep(wait);
  lastRequestAt = Date.now();
}

const GLOSSARY = [
  ['clean order', 'سفارش تمیز'],
  ['price action', 'پرایس اکشن'],
  ['price', 'قیمت'],
  ['order', 'سفارش'],
  ['time', 'زمان'],
  ['date', 'تاریخ'],
  ['order flow', 'جریان سفارش'],
  ['liquidity grab', 'جمع‌آوری نقدینگی'],
  ['liquidity void', 'خلأ نقدینگی'],
  ['liquidity zone', 'ناحیه نقدینگی'],
  ['liquidity sweep', 'شکار نقدینگی'],
  ['liquidity', 'نقدینگی'],
  ['supply and demand', 'عرضه و تقاضا'],
  ['supply zone', 'ناحیه عرضه'],
  ['demand zone', 'ناحیه تقاضا'],
  ['supply', 'عرضه'],
  ['demand', 'تقاضا'],
  ['support', 'حمایت'],
  ['resistance', 'مقاومت'],
  ['breakout', 'شکست'],
  ['breakdown', 'شکست نزولی'],
  ['pullback', 'بازگشت'],
  ['retracement', 'اصلاح'],
  ['retrace', 'اصلاح'],
  ['zone of interest', 'ناحیه مورد توجه'],
  ['zone', 'ناحیه'],
  ['area', 'منطقه'],
  ['entry', 'ورود'],
  ['exit', 'خروج'],
  ['stop loss', 'حد ضرر'],
  ['take profit', 'حد سود'],
  ['risk/reward', 'ریسک/پاداش'],
  ['fair value gap', 'فاصله ارزش منصفانه'],
  ['order block', 'بلوک سفارش'],
  ['breaker block', 'بلوک شکن'],
  ['mitigation block', 'بلوک جبران'],
  ['market structure', 'ساختار بازار'],
  ['change of character', 'تغییر شخصیت'],
  ['break of structure', 'شکست ساختار'],
  ['imbalance', 'عدم تعادل'],
  ['divergence', 'واگرایی'],
  ['confluence', 'همگرایی'],
  ['trendline', 'خط روند'],
  ['trend', 'روند'],
  ['range', 'محدوده'],
  ['consolidation', 'تثبیت'],
  ['accumulation', 'انباشت'],
  ['distribution', 'توزیع'],
  ['bullish', 'صعودی'],
  ['bearish', 'نزولی'],
  ['reversal', 'بازگشت روند'],
  ['continuation', 'ادامه روند'],
  ['fakeout', 'فیک‌آوت'],
  ['stop hunt', 'شکار حد ضرر'],
  ['equal highs', 'سقف‌های برابر'],
  ['equal lows', 'کف‌های برابر'],
  ['premium', 'پرمیوم'],
  ['discount', 'دیسکانت'],
  ['equilibrium', 'تعادل'],
  ['inducement', 'فریب'],
  ['session', 'جلسه'],
  ['london', 'لندن'],
  ['new york', 'نیویورک'],
  ['asian', 'آسیا'],
  ['daily', 'روزانه'],
  ['weekly', 'هفتگی'],
  ['monthly', 'ماهانه'],
  ['candle', 'کندل'],
  ['wick', 'سایه'],
  ['volume', 'حجم'],
  ['momentum', 'مومنتوم'],
  ['target', 'هدف'],
  ['buy', 'خرید'],
  ['sell', 'فروش'],
  ['long', 'خرید'],
  ['short', 'فروش'],
  ['high', 'سقف'],
  ['low', 'کف'],
  ['open', 'باز'],
  ['close', 'بسته'],
  ['gap', 'گپ'],
  ['break', 'شکست'],
  ['fake', 'فیک'],
  ['stop', 'حد ضرر'],
];
const GLOSSARY_MAP = new Map(GLOSSARY.map(([en, fa]) => [en.toLowerCase(), fa]));
const GLOSSARY_SORTED = [...GLOSSARY].sort((a, b) => b[0].length - a[0].length);

const ABBREVIATIONS = new Set([
  'BOS', 'CHOCH', 'CHoCH', 'FVG', 'OB', 'SL', 'TP', 'RR', 'HTF', 'LTF', 'SMT',
  'POI', 'AOI', 'PD', 'EQ', 'EQH', 'EQL', 'IDM', 'MSS', 'BMS', 'RTO', 'OTE',
  'AD', 'ASIA', 'LO', 'NY', 'LDN', 'NYC', 'H4', 'H1', 'M15', 'M5', 'M1',
  'D1', 'W1', 'MN', 'MT4', 'MT5', 'FX', 'CFD', 'ETF', 'USD', 'EUR', 'GBP',
  'JPY', 'AUD', 'NZD', 'CAD', 'CHF', 'CNH', 'XAU', 'XAG', 'BTC', 'ETH',
  'DXY', 'VIX', 'SPX', 'NDX', 'RUT', 'DAX', 'GOLD', 'SILVER', 'OIL', 'WTI',
  'USOIL', 'UKOIL', 'US30', 'NAS100', 'SPX500', 'GER40', 'UK100', 'JP225',
  'HK50', 'AUS200', 'FRA40', 'EU50', 'FXE', 'GLD', 'SLV', 'USO', 'TLT',
  'SPY', 'QQQ',
]);
const CURRENCY_RE = /\b(?:EUR|USD|GBP|JPY|AUD|NZD|CAD|CHF|CNH|XAU|XAG|BTC|ETH)[\/\-]?(?:EUR|USD|GBP|JPY|AUD|NZD|CAD|CHF|CNH|XAU|XAG|BTC|ETH)\b/g;
const INDEX_RE = /\b(?:US30|NAS100|SPX500|GER40|UK100|JP225|HK50|AUS200|FRA40|EU50|DXY|VIX|SPX|NDX|RUT|DAX|FXE|GLD|SLV|USO|TLT|SPY|QQQ|XAUUSD|XAGUSD|BTCUSD|ETHUSD)\b/g;
const NUMBER_RE = /\b\d+(?:[.,]\d+)*(?:%|pips?|pip|pts?|points?)?\b/g;
const DATE_RE = /\b(?:\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}[./-]\d{1,2}[./-]\d{1,2})\b/g;
const TIME_RE = /\b\d{1,2}:\d{2}(?::\d{2})?\b/g;
const URL_RE = /(?:https?:\/\/|www\.)[^\s]+/gi;

const SKIP_LINE_RE = /^(?:file|view|insert|charts?|tools?|window|help|online|offline|expert advisors?|indicators?|timeframes?|market watch|navigator|terminal|account|new order|auto ?trading|metatrader|mt4|mt5|tradingview|template|objects?|properties|alerts?|favorites?|workspace|layout|save|load|print|screenshot|undo|redo|cut|copy|paste|delete|select|zoom|scroll|chart|settings?|options?)$/i;

// Platform chrome that Windows OCR picks up from chart screenshots. These
// lines are not chart annotations, so drop them instead of showing untranslated
// menu noise in the translation panel.
const CHROME_LINE_RE = new RegExp([
  '^(?:file\\s+)?view\\s+insert\\s+charts?\\s+tools?\\s+window\\s+help$',
  '^metatrader\\s*[45]?(?:\\s+build\\s+\\d+)?$',
  '^meta\\s*editor.*$',
  '^expert advisors?$',
  '^indicators?$',
  '^scripts?$',
  '^timeframes?$',
  '^market watch$',
  '^navigator$',
  '^terminal$',
  '^account history$',
  '^strategy tester$',
  '^new order$',
  '^auto ?trading (?:disabled|enabled)$',
  '^(?:online|offline|connected|disconnected)$',
  '^(?:balance|equity|margin|free margin|margin level|profit|credit|deposit|withdrawal)(?:\\s*:.*)?$',
  '^(?:order|position|positions|history|trade|trades|exposure|summary)$',
  '^\\d+(?:[.,]\\d+)?\\s*(?:kb|mb|gb)$',
].join('|'), 'i');

function isChromeLine(line) {
  const s = String(line || '').trim();
  return CHROME_LINE_RE.test(s);
}

function isOcrNoise(line) {
  const s = String(line || '').trim();
  if (!s) return true;
  // Windows OCR sometimes hallucinates accented glyphs around price labels.
  if (/[\u00C0-\u024F]/.test(s)) return true;
  const letters = alphaCount(s);
  if (letters <= 1) return true;
  const digits = (s.match(/\d/g) || []).length;
  if (digits && letters <= 2) return true;
  const compact = s.replace(/\s+/g, '');
  if (digits && letters / Math.max(compact.length, 1) < 0.3) return true;
  return false;
}

function normalizeText(s) {
  return String(s || '')
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function hasPersian(s) {
  return /[\u0600-\u06FF]/.test(s);
}

function alphaCount(s) {
  return (s.match(/[A-Za-z]/g) || []).length;
}

function isOnlyTickers(s) {
  const cleaned = s.replace(/[^A-Za-z0-9/.\- ]/g, ' ').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  return words.every(w => ABBREVIATIONS.has(w.toUpperCase()) || /^[A-Z]{6}$/.test(w) || /^\d+(?:[.,]\d+)?$/.test(w));
}

function protect(text) {
  const restore = [];
  let out = String(text);
  const put = (value, replacement) => {
    const token = `[[${restore.length}]]`;
    restore.push({ token, value });
    out = out.replace(replacement, token);
  };
  // URLs first.
  out = out.replace(URL_RE, m => {
    const token = `[[${restore.length}]]`;
    restore.push({ token, value: m });
    return token;
  });
  // Glossary: always mask multi-word technical phrases, but only mask a
  // single-word term when it is the whole label. Masking single words inside
  // full sentences confuses Google's word order (e.g. "clean order").
  if (out.split(/\s+/).length <= 14) {
    const whole = out.trim().toLowerCase();
    for (const [en] of GLOSSARY_SORTED) {
      if (!en.includes(' ') && whole !== en) continue;
      const re = new RegExp('\\b' + en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
      out = out.replace(re, () => {
        const token = `[[${restore.length}]]`;
        restore.push({ token, value: GLOSSARY_MAP.get(en.toLowerCase()) || en });
        return token;
      });
    }
  }
  // Tickers and indices.
  out = out.replace(CURRENCY_RE, m => {
    const token = `[[${restore.length}]]`;
    restore.push({ token, value: m });
    return token;
  });
  out = out.replace(INDEX_RE, m => {
    const token = `[[${restore.length}]]`;
    restore.push({ token, value: m });
    return token;
  });
  // Keep abbreviations untouched.
  out = out.replace(/\b[A-Z]{2,6}\b/g, m => {
    if (!ABBREVIATIONS.has(m.toUpperCase())) return m;
    const token = `[[${restore.length}]]`;
    restore.push({ token, value: m });
    return token;
  });
  // Numbers, dates, times.
  out = out.replace(DATE_RE, m => {
    const token = `[[${restore.length}]]`;
    restore.push({ token, value: m });
    return token;
  });
  out = out.replace(TIME_RE, m => {
    const token = `[[${restore.length}]]`;
    restore.push({ token, value: m });
    return token;
  });
  out = out.replace(NUMBER_RE, m => {
    const token = `[[${restore.length}]]`;
    restore.push({ token, value: m });
    return token;
  });
  return { masked: out, restore };
}

function restoreText(text, restore) {
  let out = String(text || '');
  for (const r of restore) {
    out = out.split(r.token).join(r.value);
  }
  // Google may insert spaces inside placeholders, normalize common damage.
  out = out.replace(/\[\s*\[\s*(\d+)\s*\]\s*\]/g, (_, i) => {
    const r = restore[Number(i)];
    return r ? r.value : `[[${i}]]`;
  });
  return out.replace(/\s+([،.!؟:;])/g, '$1').replace(/\s{2,}/g, ' ').trim();
}

async function googleTranslateBatch(lines) {
  const q = lines.join('\n');
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fa&dt=t';
  const body = new URLSearchParams({ q });
  let lastError = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 40000);
    try {
      await throttle();
      const res = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
        },
        body,
      });
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('retry-after'));
        const wait = Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, 90000)
          : Math.min(6000 * (attempt + 1), 45000);
        pauseUntil = Math.max(pauseUntil, Date.now() + wait);
        lastError = new Error('HTTP 429');
        await sleep(wait);
        continue;
      }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      const text = (json[0] || []).map(x => x && x[0] ? x[0] : '').join('');
      if (!text.trim()) throw new Error('empty translation');
      return text;
    } catch (e) {
      lastError = e;
      if (attempt < 4) await sleep(1200 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError || new Error('translation failed');
}

function splitTranslated(text, count) {
  const parts = String(text).replace(/\r/g, '').split('\n');
  if (parts.length === count) return parts;
  // Google sometimes adds/removes a blank first/last line.
  const trimmed = parts.filter((x, i) => x.trim() || (i > 0 && i < parts.length - 1));
  if (trimmed.length === count) return trimmed;
  if (parts.length > count) {
    const merged = [];
    const extra = parts.length - count;
    for (let i = 0; i < count; i++) {
      if (i === count - 1) merged.push(parts.slice(i).join(' '));
      else merged.push(parts[i]);
    }
    if (merged.length === count) return merged;
  }
  return null;
}

function prepareBlocks(ocr) {
  const seen = new Set();
  const blocks = [];
  let alphaTotal = 0;
  const sorted = [...ocr.lines].sort((a, b) => (a.y - b.y) || (a.x - b.x));
  for (const line of sorted) {
    const text = cleanLine(line.text);
    if (!text || text.length < 2) continue;
    if (!/[A-Za-z]/.test(text)) continue;
    if (isChromeLine(text) || isOcrNoise(text)) continue;
    if (seen.has(text.toLowerCase())) continue;
    seen.add(text.toLowerCase());
    alphaTotal += alphaCount(text);
    blocks.push({
      original: text,
      persian: '',
      bbox: [Math.max(0, line.x | 0), Math.max(0, line.y | 0), Math.max(0, line.w | 0), Math.max(0, line.h | 0)],
    });
    if (blocks.length >= 50) break;
  }
  return { blocks, alphaTotal, low: alphaTotal < 10 || blocks.length <= 2 };
}

function needsTranslation(line) {
  if (!line || !alphaCount(line) || hasPersian(line)) return false;
  if (isOnlyTickers(line)) return false;
  if (SKIP_LINE_RE.test(line)) return false;
  return true;
}

function makeBatches(lines, maxLines = 24, maxChars = 2400) {
  const batches = [];
  let batch = [];
  let size = 0;
  for (const line of lines) {
    const len = line.length + 1;
    if (batch.length && (batch.length >= maxLines || size + len > maxChars)) {
      batches.push(batch);
      batch = [];
      size = 0;
    }
    batch.push(line);
    size += len;
  }
  if (batch.length) batches.push(batch);
  return batches;
}

async function translateGroup(batch, cache, stats) {
  const masked = batch.map(t => protect(t));
  const translated = await googleTranslateBatch(masked.map(m => m.masked));
  let parts = splitTranslated(translated, batch.length);
  if (!parts) {
    if (batch.length === 1) {
      const restored = restoreText(translated.replace(/\n/g, ' '), masked[0].restore);
      cache[batch[0]] = restored || batch[0];
      stats.translated++;
      return;
    }
    const mid = Math.ceil(batch.length / 2);
    await translateGroup(batch.slice(0, mid), cache, stats);
    await translateGroup(batch.slice(mid), cache, stats);
    return;
  }
  for (let k = 0; k < batch.length; k++) {
    const restored = restoreText(parts[k] || '', masked[k].restore);
    cache[batch[k]] = restored || batch[k];
    stats.translated++;
  }
}

async function translateQueue(lines, cache, stats, concurrency) {
  const batches = makeBatches(lines);
  console.log(`Translation batches: ${batches.length} (concurrency ${concurrency})`);
  if (!batches.length) return;
  let next = 0;
  let active = 0;
  let doneBatches = 0;
  let doneLines = 0;
  await new Promise((resolve) => {
    const launch = () => {
      while (active < concurrency && next < batches.length) {
        const batch = batches[next++];
        active++;
        translateGroup(batch, cache, stats)
          .catch((e) => {
            stats.failed += batch.length;
            if (stats.failed < 400) console.warn('translate batch failed:', e.message, '|', batch[0].slice(0, 60));
          })
          .finally(() => {
            active--;
            doneBatches++;
            doneLines += batch.length;
            if (doneBatches % 20 === 0 || (next >= batches.length && active === 0)) {
              saveJson(PHRASES, cache);
              console.log(`  ${doneLines}/${lines.length} lines | batches ${doneBatches}/${batches.length} | translated=${stats.translated} failed=${stats.failed} phrases=${Object.keys(cache).length}`);
            }
            if (next >= batches.length && active === 0) resolve();
            else launch();
          });
      }
    };
    launch();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function saveJson(file, obj) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj));
  fs.renameSync(tmp, file);
}

function loadJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

function cleanLine(text) {
  let s = normalizeText(text);
  s = s.replace(/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ');
  s = s.replace(/\brice\b(?=\s+(?:down|up|action|level|area|range|is|was)\b)/gi, 'price');
  s = s.replace(/^[\s|_=~`^<>]+|[\s|_=~`^<>]+$/g, '');
  s = s.replace(/[|]{2,}/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

async function main() {
  fs.mkdirSync(OCR_DIR, { recursive: true });
  if (!fs.existsSync(RESULTS)) throw new Error('OCR results not found: ' + RESULTS);
  const images = JSON.parse(fs.readFileSync(path.join(BUILD, 'images.json'), 'utf8'));
  const imageByHash = new Map(images.map(im => [im.hash, im]));

  const raw = new Map();
  for (const line of fs.readFileSync(RESULTS, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const o = JSON.parse(line);
      if (o.hash && !o.error && Array.isArray(o.lines)) raw.set(o.hash, o);
    } catch {}
  }
  console.log('OCR images available:', raw.size);

  const cache = loadJson(PHRASES, {});
  const existing = loadJson(OUT, {});
  const out = RETRY ? {} : { ...existing };

  let entries = [...raw.entries()].filter(([hash]) => {
    if (ONLY && hash !== ONLY) return false;
    if (!RETRY && out[hash] && out[hash].blocks) return false;
    return true;
  });
  if (LIMIT) entries = entries.slice(0, LIMIT);
  console.log('Images to translate:', entries.length, '| cached phrases:', Object.keys(cache).length);

  const prepared = [];
  const pending = new Set();
  for (const [hash, ocr] of entries) {
    const p = prepareBlocks(ocr);
    p.hash = hash;
    p.ocr = ocr;
    prepared.push(p);
    for (const b of p.blocks) {
      if (needsTranslation(b.original) && !cache[b.original]) pending.add(b.original);
    }
  }
  console.log('Unique lines to translate:', pending.size);

  const stats = { translated: 0, failed: 0 };
  await translateQueue([...pending], cache, stats, CONCURRENCY);
  saveJson(PHRASES, cache);

  for (const p of prepared) {
    const { hash, ocr } = p;
    if (!p.blocks.length) {
      out[hash] = { blocks: [], low: true, hasText: false, textOriginal: '', textPersian: '' };
      continue;
    }
    for (const b of p.blocks) b.persian = cache[b.original] || b.original;
    out[hash] = {
      blocks: p.blocks,
      low: p.low,
      hasText: true,
      textOriginal: p.blocks.map(b => b.original).join('\n'),
      textPersian: p.blocks.map(b => b.persian).join('\n'),
      ocrWidth: ocr.width || (imageByHash.get(hash) || {}).width || 0,
      ocrHeight: ocr.height || (imageByHash.get(hash) || {}).height || 0,
    };
  }

  saveJson(OUT, out);
  console.log('DONE', { images: Object.keys(out).length, stats });
}

main().catch(e => { console.error(e); process.exit(1); });

