/*
 * Translation policy for the RTM archive.
 *
 * One rule decides everything: machine translation may rewrite prose, but it
 * may never touch what a trader reads off a chart, and it may never invent
 * Persian for text that is not language at all.
 *
 *   KEEP verbatim  pair symbols (USD/CAD, EURUSD), RTM acronyms (FL, TG, HTF,
 *                  BOS), file names, clock times, dates and month names,
 *                  years, digit groups, percentages.
 *   TRANSLATE      real prose, through the glossary first and the machine
 *                  translator second.
 *   EMPTY          chart chrome (symbol + timeframe + scale) and OCR noise
 *                  get no Persian at all: the honest answer is the original.
 *
 * renderBlock() is the single entry point used by the bake step, by the site
 * build and by the test file, so the rule cannot drift between them.
 */
const lex = require('./lexicon.js');

const FA_LETTER = /[\u0600-\u06FF]/;
const LATIN_OR_DIGIT = /[0-9A-Za-z]/;

/* Currencies, metals and the short forms traders use for them. */
const CURRENCY = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'NZD', 'CAD', 'CHF', 'XAU', 'XAG', 'CNH',
  'TRY', 'SEK', 'NOK', 'DKK', 'PLN', 'HUF', 'CZK', 'SGD', 'HKD', 'ZAR', 'MXN',
  'BRL', 'INR', 'RUB', 'EU', 'GU', 'UJ', 'EJ', 'GJ', 'AU', 'UC', 'AG', 'AJ',
  'NJ', 'NU', 'AN', 'GA', 'EA', 'UCHF', 'EGU',
]);

/* Chart / RTM shorthand that must never be spelled out into Persian. */
const TERM = new Set([
  'FL', 'TG', 'LS', 'CP', 'SL', 'TP', 'BO', 'BOS', 'OB', 'FVG', 'POI', 'IDM',
  'QM', 'RR', 'HTF', 'LTF', 'IT', 'ITS', 'PA', 'DP', 'ID', 'MSB', 'BZ', 'BSZ',
  'FOF', 'FO', 'NO', 'EO', 'HO', 'OD', 'SW', 'SR', 'SD', 'EMA', 'SMA', 'RSI',
  'ATR', 'ADX', 'MACD', 'SMT', 'AMD', 'MPL', 'ORE', 'ORFL', 'EQ', 'EQH', 'EQL',
  'AUDUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'EURJPY', 'GBPJPY', 'AUDCAD',
  'USDCAD', 'USDCHF', 'NZDUSD', 'XAUUSD', 'XAGUSD',
]);

const KEEP_RES = [
  /\b[A-Za-z]{3}\s?[/.]\s?[A-Za-z]{3}\b/g,             // USD/CAD, EUR.USD
  /\b[A-Z][A-Z0-9]{1,6}\b/g,                           // FL, LTF, FOF, TG2
  /\b[A-Z][A-Za-z]{1,7}\b/g,                           // Usdcad, Mpl, Fvg
  /\b[a-z]{1,3}[A-Z][A-Za-z]{0,5}\b/g,                 // usDCAD, eurUsd
  /\b[A-Za-z0-9._-]+\.(?:png|jpe?g|gif|webp|bmp|mq4|ex4)\b/gi,
  /\b\d{1,2}:\d{2}(?::\d{2})?\b/g,                     // 13:45
  /\b\d{1,2}\s?[A-Za-z]{3,9}\.?\s?'?\d{0,4}\b/g,       // 11dec'16, 3 Jan 2017
  /\b[A-Za-z]{3,9}\.?\s?\d{1,2},?\s?\d{2,4}\b/g,        // August 31, 2016
  /\b[A-Za-z]{3,9}\.?\s?\d{2,4}\b/g,                    // Dec2012, Sept. 2016
  /\/?\d+(?:[.,]\d+)?\s?%/g,                           // 12.5%
  /\b\d+(?:[.,]\d+)?\b/g,                              // 1234.56
];

function isCurrencyWord(word) {
  const w = String(word || '').toUpperCase();
  if (CURRENCY.has(w)) return true;
  if (w.length === 6 && CURRENCY.has(w.slice(0, 3)) && CURRENCY.has(w.slice(3))) return true;
  return false;
}

function isTerm(word) {
  const w = String(word || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (!w) return false;
  if (TERM.has(w)) return true;
  if (/^(?:M|H|D|W)\d+$/.test(w)) return true;        // M15, H4
  if (/^\d+(?:M|H|D|W)$/.test(w)) return true;        // 15M, 4H
  return false;
}

/* Does this token have to survive the translation unchanged? */
function mustKeep(token) {
  if (!token) return false;
  // "15 minutes", "30 pips", "2 and": a number followed by an ordinary word
  // is prose, not a chart date. The number itself is enforced by its numeric
  // token; the English phrase must not be appended to a translated sentence.
  const numWord = token.match(/^\d[\d.,]*\s+([A-Za-z]+)/);
  if (numWord && !lex.MONTHS.includes(numWord[1].slice(0, 3).toLowerCase())) return false;
  if (/^\d/.test(token)) return true;
  // Month-first dates: "August 31, 2016", "Dec2012", "Sept. 2016".
  if (/^[A-Za-z]{3,9}\.?[\s,]*\d/.test(token) && lex.MONTHS.includes(token.slice(0, 3).toLowerCase())) return true;
  if (/\.(?:png|jpe?g|gif|webp|bmp|mq4|ex4)$/i.test(token)) return true;
  if (/[/.]/.test(token) && isCurrencyWord(token.replace(/[/.]/g, ''))) return true;
  // "An" at the start of a sentence is not the AN pair; only the uppercase
  // chart spelling counts as a currency.
  if (isCurrencyWord(token) && /^[A-Z]{2,6}$/.test(token)) return true;
  // A term is only required when it was written as one: "IT" is institutional
  // traders, while a sentence that merely starts with "It" is not.
  if (isTerm(token) && /^[A-Z][A-Z0-9]*$/.test(token)) return true;
  if (/[a-z][A-Z]/.test(token)) return true;
  return false;
}

/*
 * strictTerms: OCR lines keep every acronym the chart showed. Post bodies do
 * not – the post pipeline deliberately spells "IT" out as institutional
 * traders before translating, so demanding the acronym back would be wrong.
 */
function keepTokens(text, { strictTerms = true } = {}) {
  const src = String(text || '');
  const found = [];
  const seen = new Set();
  for (const re of KEEP_RES) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src)) !== null) {
      const token = m[0].trim();
      if (!token || seen.has(token)) continue;
      if (!mustKeep(token)) continue;
      if (!strictTerms && /^[A-Z][A-Z0-9]{1,6}$/.test(token)) continue;
      seen.add(token);
      found.push({ token, at: m.index });
    }
  }
  return found.sort((a, b) => a.at - b.at);
}

/* ------------------------------------------------------------------ *
 * Token enforcement: put every required token back, spelled as in the
 * original. This is what keeps "usDCAD" from becoming "UDCAD" and
 * "11dec'16" from becoming "۱۱ دسامبر ۱۶".
 * ------------------------------------------------------------------ */

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[a.length][b.length];
}

function similarity(a, b) {
  const x = String(a).toLowerCase().replace(/[^a-z0-9]/g, '');
  const y = String(b).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.includes(y) || y.includes(x)) return Math.min(x.length, y.length) / Math.max(x.length, y.length);
  return 1 - levenshtein(x, y) / Math.max(x.length, y.length);
}

function toLatinDigits(text) {
  return String(text)
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

// "می" and "مه" are left out on purpose: they are the Persian verb prefix, and
// matching them turns "می‌آید" into "May آید".
const MONTH_FA = 'ژانویه|فوریه|مارس|آوریل|اوریل|ژوئن|ژون|ژوئیه|ژوییه|جولای|اوت|آگوست|سپتامبر|اکتبر|نوامبر|دسامبر';
// Month names only count as words: "تمیز" must not look like "می".
const MONTH_FA_RE = new RegExp('(?<![\\u0600-\\u06FF\\u200c])(?:' + MONTH_FA + ')(?![\\u0600-\\u06FF\\u200c])', 'g');
const DATE_FA_RE = new RegExp('\\d{1,2}[\\s\\u200c]*(?:' + MONTH_FA + ')[\\s\\u200c]*(?:\\d{2,4})?', 'g');
const DATE_EN_RE = /\b\d{1,2}\s?[A-Za-z]{3,9}\.?\s?'?\d{0,4}\b/g;

function latinRuns(text) {
  const runs = [];
  const re = /[A-Za-z0-9][A-Za-z0-9:'.,/-]*/g;
  let m;
  while ((m = re.exec(text)) !== null) runs.push({ text: m[0], at: m.index });
  return runs;
}

/*
 * Dates are never localised. The machine happily writes "۱۱ دسامبر ۱۶" for
 * "11dec'16"; this puts the chart's own spelling back, before the token loop
 * runs, so it can recognise the date and not append a second copy.
 */
const FA_MONTHS = {
  'ژانویه': 'Jan', 'فوریه': 'Feb', 'مارس': 'Mar', 'آوریل': 'Apr', 'اوریل': 'Apr',
  'ژوئن': 'Jun', 'ژون': 'Jun', 'ژوئیه': 'Jul',
  'ژوییه': 'Jul', 'جولای': 'Jul', 'اوت': 'Aug', 'آگوست': 'Aug',
  'سپتامبر': 'Sep', 'اکتبر': 'Oct', 'نوامبر': 'Nov', 'دسامبر': 'Dec',
};
const FA_MONTH_ALT = Object.keys(FA_MONTHS).sort((a, b) => b.length - a.length).join('|');
const FA_DATE_SPAN_RE = new RegExp(
  '(?<![\\u0600-\\u06FF\\u200c])(?:\\d{1,2}[\\s\\u200c]*)?(?:' + FA_MONTH_ALT + ')'
  + '(?:[\\s\\u200c]*[،,]?[\\s\\u200c]*\\d{1,4}){0,2}(?![\\u0600-\\u06FF\\u200c])',
  'g',
);
// Month names only: "decline" and "decided" are not December, and lower-case
// "may" is not May.
const EN_MONTH_RE = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t|tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/g;

function restoreDates(original, text, opts) {
  let out = text;
  MONTH_FA_RE.lastIndex = 0;
  if (!MONTH_FA_RE.test(out)) return out;
  const dateTokens = keepTokens(original, opts).map(t => t.token).filter(t => /\d/.test(t) && /[A-Za-z]/.test(t));
  const byMonth = new Map();
  for (const token of dateTokens) {
    const key = token.slice(0, 3).toLowerCase();
    if (!byMonth.has(key)) byMonth.set(key, token);
  }
  EN_MONTH_RE.lastIndex = 0;
  const enMonths = String(original).match(EN_MONTH_RE) || [];
  let monthIndex = 0;
  return out.replace(FA_DATE_SPAN_RE, (span) => {
    const faMonth = Object.keys(FA_MONTHS).find(m => span.startsWith(m));
    if (!faMonth) return span;
    const english = FA_MONTHS[faMonth];
    const exact = byMonth.get(english.slice(0, 3).toLowerCase());
    if (exact) return exact;
    let fromSource = enMonths[monthIndex++] || english;
    // The source spelled the month without its year ("since October 2016" is
    // matched by the month name alone); keep the span's digits instead of
    // dropping them and later appending the bare year at the end.
    const spanDigits = span.match(/\d+/g) || [];
    if (spanDigits.length && !/\d/.test(fromSource)) fromSource += ' ' + spanDigits.join(' ');
    return fromSource;
  });
}

/* Paragraph breaks are meaning: a translation must keep them so each line can
   sit under the paragraph it translates. Most helpers below normalise every
   whitespace run to a space, so blank lines travel through as a sentinel. */
const PARA_MARK = '\uE000';
function protectParagraphs(text) {
  return String(text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]*\n{2,}[ \t]*/g, ' ' + PARA_MARK + ' ');
}
function restoreParagraphs(text) {
  return String(text || '')
    .replace(new RegExp('[ \\t]*' + PARA_MARK + '[ \\t]*', 'g'), '\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* The translator masks member names; a lost mask leaves its index behind
   ("0 نوشت:"), and a reordered restore leaves "نوشته Astrokillah:". The site's
   quote parser only knows "Name wrote/نوشت:", so put the source names back,
   in source order, before anything else touches the text. */
function repairQuoteHeads(original, persian) {
  const heads = [...String(original || '').matchAll(
    /(?:^|\n)\s*(?!(?:i|you|we|they|he|she|it|who)\b)([A-Za-z][A-Za-z0-9_.\-+]{1,32})\s*(?:wrote|writes)\s*:/gi,
  )].map(m => m[1]);
  let out = String(persian || '');
  if (!heads.length) return out;
  out = out.replace(
    /^\s*نوشته(?:\s+است)?(?:\s+شده(?:\s+توسط)?)?\s+([A-Za-z][A-Za-z0-9_.\-+]{1,32})\s*:/gm,
    (m, name) => name + ' نوشت:',
  );
  out = out.replace(
    /^([A-Za-z][A-Za-z0-9_.\-+]{1,32})\s+نوشته(?:\s+است)?\s*:/gm,
    (m, name) => name + ' نوشت:',
  );
  let i = 0;
  out = out.replace(/(?<![A-Za-z0-9])\d{1,2}\s*(?:نوشت|نوشته(?:\s+است)?|گفت)\s*:/g, (m) => {
    const name = heads[i++];
    return name ? name + ' نوشت:' : m;
  });
  /* Sometimes the translator drops the head entirely and starts with the
     quoted body. When no head survived at the start, the source's leading
     chain can be restored in order. */
  const leading = [];
  let rest = String(original || '');
  let m;
  const LEAD = /^\s*(?!(?:i|you|we|they|he|she|it|who)\b)([A-Za-z][A-Za-z0-9_.\-+]{1,32})\s*(?:wrote|writes)\s*:\s*/i;
  while ((m = rest.match(LEAD))) { leading.push(m[1]); rest = rest.slice(m[0].length); }
  /* A Persian head already at the start (e.g. "وارن نوشت:") is a kept head,
     whatever script the name is in. The old Latin-only test failed for
     transliterated names and prepended the whole English chain again. */
  if (leading.length && !/^\s*[^\n:]{1,60}?(?:نوشت|wrote|writes)\s*:/i.test(out)) {
    out = leading.map(n => n + ' نوشت:').join(' ') + ' ' + out;
  }
  return out;
}

function enforceTokens(original, persian, opts = {}) {
  let out = restoreDates(original, toLatinDigits(protectParagraphs(repairQuoteHeads(original, persian))), opts);
  const tokens = keepTokens(original, opts);
  for (const { token } of tokens) {
    if (out.toLowerCase().includes(token.toLowerCase())) continue;
    // A localised date anywhere in the output: replace it with the source text.
    DATE_FA_RE.lastIndex = 0;
    if (/\d/.test(token) && DATE_FA_RE.test(out)) {
      DATE_EN_RE.lastIndex = 0;
      let done = false;
      out = out.replace(DATE_FA_RE, (m) => {
        if (done) return m;
        done = true;
        return token;
      });
      if (done) continue;
    }
    // A mangled symbol, e.g. "UDCAD" for "usDCAD".
    let best = null;
    for (const run of latinRuns(out)) {
      const score = similarity(run.text, token);
      if (score >= 0.6 && (!best || score > best.score)) best = { run, score };
      if (score === 1) break;
    }
    if (best) {
      out = out.slice(0, best.run.at) + token + out.slice(best.run.at + best.run.text.length);
      continue;
    }
    // Nothing recognisable left: keep the token where the original had it.
    const at = String(original).indexOf(token);
    const leading = at >= 0 && at < String(original).length * 0.34;
    out = leading ? token + ' ' + out : out + (out ? ' ' : '') + token;
  }
  return restoreParagraphs(out.replace(/\s{2,}/g, ' '));
}

/* ------------------------------------------------------------------ *
 * Machine-output clean-up
 * ------------------------------------------------------------------ */

const REDUPLICATION = new Set(['خیلی', 'یواش', 'آهسته', 'کم', 'کم‌کم', 'دسته', 'قطره', 'قدم', 'گام', 'ذره', 'روز', 'موج']);

function collapseRepeats(text) {
  const tokens = text.split(' ');
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    let j = i;
    while (j + 1 < tokens.length && tokens[j + 1] === tokens[i]) j++;
    const run = j - i + 1;
    const tok = tokens[i];
    const keep = run === 1 || (run === 2 && !LATIN_OR_DIGIT.test(tok) && REDUPLICATION.has(tok));
    if (keep) for (let k = i; k <= j; k++) out.push(tok);
    else out.push(tok);
    i = j;
  }
  return out.join(' ');
}

/* The offline model sometimes answers with a subtitle watermark. A hand
   translation that says "دانلود" because the source says download is not a
   hallucination, so the strip only applies to words the source never used. */
const HALLUCINATION_WORDS = [
  ['دانلود', /download/i],
  ['زیرنویس', /subtitle/i],
  ['موسیقی متن', /soundtrack/i],
  ['آهنگ', /song|music/i],
  ['فیلم', /film|movie/i],
  ['سریال', /series|episode/i],
  ['تماشا', /watch|view/i],
  ['اینستاگرام', /instagram/i],
  ['تلگرام', /telegram/i],
];

function hallucinationJustified(persian, source) {
  const present = HALLUCINATION_WORDS.filter(([word]) => String(persian || '').includes(word));
  const src = String(source || '');
  return present.length > 0 && present.every(([, en]) => en.test(src));
}

function stripHallucination(s, source) {
  let out = s;
  for (const [word, en] of HALLUCINATION_WORDS) {
    if (!en.test(String(source || ''))) out = out.split(word).join(' ');
  }
  return out;
}

function cleanMachine(persian, source) {
  const raw = String(persian || '').replace(/\r\n?/g, '\n').trim();
  if (!raw) return '';
  /* Clean one paragraph at a time. A block that is only an OCR artifact
     ("[quote]", "[") must survive as itself: collapsing it to empty would
     silently merge paragraphs and break the side-by-side layout. */
  const parts = raw.split(/\n{2,}/).map(part => {
    const before = part.trim();
    if (!before) return '';
    let s = before;
    /* Keep real BBCode furniture ([quote], [/quote], [b], [url=…]) exactly as
       the author wrote it; only stray bracket runs are placeholder junk. */
    const tags = [];
    s = s.replace(/\[\/?[a-z][a-z0-9]*(?:=[^\]]*)?\]/gi, m => {
      tags.push(m);
      return `\u0001${tags.length - 1}\u0002`;
    });
    if (/[[\]]/.test(s)) s = s.replace(/[[\]]+/g, ' ');
    s = s.replace(/<\s*\d+\s*>/g, ' ');
    s = s.replace(/[<>]+/g, ' ');
    s = s.replace(/\s+/g, ' ').trim();
    if (FA_LETTER.test(s)) {
      s = source === undefined ? s.replace(lex.HALLUCINATION, '') : stripHallucination(s, source);
      s = s.replace(/^[\s،,:;.-]+/, '').replace(/\s+/g, ' ').trim();
    }
    s = collapseRepeats(lex.postEdit(s));
    if (tags.length) s = s.replace(/\u0001(\d+)\u0002/g, (_, i) => tags[+i]);
    /* A Latin acronym welded to a Persian letter ("PAZها") is a typography
       slip, not grounds to discard the whole translation: join with ZWNJ. */
    s = s.replace(/([\u0621-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06CC])([A-Za-z])|([A-Za-z])([\u0621-\u064A\u067E\u0686\u0698\u06A9\u06AF\u06CC])/g,
      (m, a, b, c, d) => (a ? a + '\u200c' + b : c + '\u200c' + d));
    return s || before;
  });
  return parts.join('\n\n').trim();
}

/* ------------------------------------------------------------------ *
 * Classification for one block of text
 * ------------------------------------------------------------------ */

function classify(text) {
  const src = lex.cleanText(lex.repairOcr(text));
  if (!src) return 'empty';
  if (!/[A-Za-z]/.test(src)) return 'chrome';                 // numbers, symbols only
  if (lex.isNoise(src)) return 'noise';
  if (lex.isChrome(src)) return 'chrome';
  const tokenCount = lex.words(src).length;
  const dict = lex.dictionaryTranslate(src);
  const meaningfulMiss = dict.misses.filter(w => !lex.isSymbolToken(w) && !lex.isDateTimeToken(w) && w.length > 2);
  if (tokenCount <= 6 && !meaningfulMiss.length && lex.coverage(src) >= 0.8) return 'label';
  return 'prose';
}

/* ------------------------------------------------------------------ *
 * Public entry points
 * ------------------------------------------------------------------ */

/**
 * Translate one block (an OCR line, a heading, a short label).
 * Returns { fa, mode, reason } where fa === '' means "show the original
 * only, there is nothing honest to add".
 */
function renderBlock(original, machinePersian, expertPersian) {
  const src = lex.cleanText(original);
  if (!src) return { fa: '', mode: 'empty', reason: 'خالی' };
  // A hand-authored rendering outranks every machine layer, but it still goes
  // through terminology hygiene and the keep-token rule.
  const expert = String(expertPersian || '').trim();
  if (expert) {
    return { fa: enforceTokens(src, lex.postEdit(expert)), mode: 'expert', reason: 'ترجمهٔ تخصصی انسانی' };
  }
  const kind = classify(src);
  if (kind === 'chrome') return { fa: '', mode: 'chrome', reason: 'نماد، تایم‌فریم و عدد؛ ترجمه لازم نیست' };
  if (kind === 'noise') return { fa: '', mode: 'noise', reason: 'متن OCR خوانا نیست' };

  const dict = lex.dictionaryTranslate(src);
  const meaningfulMiss = dict.misses.filter(w => !lex.isSymbolToken(w) && !lex.isDateTimeToken(w) && w.length > 2);

  if (kind === 'label') {
    // postEdit runs on glossary output too: expert and machine already pass
    // through it, and a term table that lags behind a correction rule would
    // otherwise keep shipping the older spelling.
    const fa = enforceTokens(src, lex.postEdit(dict.fa));
    if (fa && FA_LETTER.test(fa)) return { fa, mode: 'glossary', reason: 'واژه‌نامه تخصصی' };
  }

  const cleaned = cleanMachine(machinePersian);
  if (cleaned && FA_LETTER.test(cleaned)) {
    const fa = enforceTokens(src, cleaned);
    const issues = lex.audit(fa, src).filter(i => i !== 'untranslated' && i !== 'no-persian');
    if (!issues.length) return { fa, mode: 'machine', reason: 'ترجمه ماشینی پاک‌سازی‌شده' };
  }

  // No trustworthy machine output: fall back to the glossary when it can
  // carry the meaning, otherwise stay silent.
  if (!meaningfulMiss.length && FA_LETTER.test(dict.fa)) {
    return { fa: enforceTokens(src, lex.postEdit(dict.fa)), mode: 'glossary', reason: 'واژه‌نامه تخصصی' };
  }
  return { fa: '', mode: 'untranslated', reason: 'ترجمه‌ای قابل اعتماد پیدا نشد' };
}

/**
 * Align an English text with its Persian translation so the reader can see
 * both, sentence by sentence.
 *
 * The translator keeps paragraph structure, so paragraphs pair up first; when
 * the paragraph counts differ we try sentences; when even those do not match
 * the whole text becomes one pair and the UI falls back to side-by-side.
 * Returns [[english, persian], ...] with persian === '' when there is none.
 */
function alignPairs(english, persian) {
  const en = String(english || '').replace(/\r\n?/g, '\n').trim();
  const fa = String(persian || '').replace(/\r\n?/g, '\n').trim();
  if (!en) return [];
  if (!fa) return [[en, '']];
  const enParas = en.split(/\n{2,}/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const faParas = fa.split(/\n{2,}/).map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  if (enParas.length === faParas.length && enParas.length > 1) {
    return enParas.map((p, i) => [p, faParas[i]]);
  }
  const enSent = splitSentences(en);
  const faSent = splitSentences(fa);
  if (enSent.length === faSent.length && enSent.length > 1) {
    return enSent.map((p, i) => [p, faSent[i]]);
  }
  // A translator that merges or splits one sentence should not cost the
  // reader the whole line-by-line view: pair them in order and let the last
  // pair carry the remainder.
  if (enSent.length > 1 && faSent.length > 1 && Math.abs(enSent.length - faSent.length) <= 1) {
    const pairs = [];
    const n = Math.min(enSent.length, faSent.length);
    for (let i = 0; i < n - 1; i++) pairs.push([enSent[i], faSent[i]]);
    pairs.push([
      enSent.slice(n - 1).join(' '),
      faSent.slice(n - 1).join(' '),
    ]);
    return pairs;
  }
  // Translators re-paragraph freely: the Persian usually ends up with fewer,
  // longer sentences (they merge clauses). Walk both in order and give each
  // English sentence its own Persian line, falling back to whole clauses at
  // the Persian comma when the Persian has too few sentences to go round.
  if (enSent.length > 1) {
    const units = faSent.length >= enSent.length ? faSent : splitClauses(fa);
    const ratio = Math.max(enSent.length, units.length) / Math.min(enSent.length, units.length);
    if (units.length > 1 && ratio <= 3) {
      let pairs;
      if (units.length >= enSent.length) {
        // Persian is finer grained: give each English sentence its own share.
        const groups = groupByCount(units, enSent.length);
        pairs = enSent.map((sentence, i) => [sentence, groups[i]]);
      } else {
        // Persian merged several sentences: keep whole English sentences
        // together so no Persian line has to be cut.
        const groups = groupByCount(enSent, units.length);
        pairs = groups.map((sentence, i) => [sentence, units[i]]);
      }
      if (pairs.every(p => p[1] && p[1].length > 1)) return pairs;
    }
  }
  return [[en, fa]];
}

/** Join a list into `count` consecutive groups of roughly equal size. */
function groupByCount(list, count) {
  const out = [];
  for (let k = 0; k < count; k++) {
    const start = Math.round((k * list.length) / count);
    const end = Math.round(((k + 1) * list.length) / count);
    out.push(list.slice(start, Math.max(end, start + 1)).join(' ').trim());
  }
  return out;
}

/** Sentences, further broken at the Persian comma when a finer split is needed. */
function splitClauses(text) {
  const out = [];
  for (const sentence of splitSentences(text)) {
    let buffer = '';
    for (const bit of sentence.split(/(?<=،)\s+/)) {
      buffer = buffer ? buffer + ' ' + bit : bit;
      if (buffer.split(/\s+/).filter(Boolean).length >= 4) {
        out.push(buffer.trim());
        buffer = '';
      }
    }
    if (buffer.trim()) {
      if (out.length) out[out.length - 1] += ' ' + buffer.trim();
      else out.push(buffer.trim());
    }
  }
  return out;
}

/**
 * Audit a whole post body. The paragraph-level signals that only make sense
 * for a single block (missing Persian, placeholder junk) still apply, but a
 * long body is never rejected for echoing a phrase twice.
 */
function auditPost(english, persian) {
  const fa = String(persian || '').trim();
  const issues = lex.audit(fa, english);
  return issues.filter(i => i !== 'untranslated' && i !== 'no-persian' && i !== 'rambling' && i !== 'echo');
}

/**
 * Split a text into display sentences, keeping paragraph breaks.
 *
 * Journal prose is written in lowercase and with stray spacing, so there is no
 * capital letter to rely on. Sentences are cut after "! ? … .", but a fragment
 * of fewer than three words ("1 .", "Hi.") is glued to the next one instead of
 * becoming a pair of its own.
 */
function splitSentences(text) {
  const src = String(text || '').replace(/\r\n?/g, '\n').trim();
  if (!src) return [];
  const out = [];
  for (const para of src.split(/\n{2,}/)) {
    const clean = para.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (!clean) continue;
    // "؟" is the Persian question mark; a Persian sentence ends there too.
    const pieces = clean.split(/(?<=[.!?…؟])\s+/);
    const parts = [];
    let buffer = '';
    for (const piece of pieces) {
      buffer = buffer ? buffer + ' ' + piece : piece;
      const words = buffer.split(/\s+/).filter(Boolean);
      const ends = /[.!?…؟]["'”’)\]]?$/.test(piece.trim());
      if (ends && words.length >= 3) {
        parts.push(buffer.trim());
        buffer = '';
      }
    }
    if (buffer.trim()) {
      if (parts.length) parts[parts.length - 1] += ' ' + buffer.trim();
      else parts.push(buffer.trim());
    }
    out.push(...(parts.length ? parts : [clean]));
  }
  return out;
}

module.exports = {
  keepTokens,
  enforceTokens,
  repairQuoteHeads,
  cleanMachine,
  hallucinationJustified,
  classify,
  renderBlock,
  auditPost,
  splitSentences,
  splitClauses,
  alignPairs,
  toLatinDigits,
  similarity,
  isCurrencyWord,
  isTerm,
  mustKeep,
};
