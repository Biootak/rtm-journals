/*
 * Expert (human-authored) translations, keyed by source text.
 *
 * The machine caches are expensive and stay untouched; this store is the layer
 * that overrides them, line by line, where a trading term needs a trader's
 * judgement rather than a translator's guess. Keys are normalised the same way
 * the policy reads source text, so a queue entry can be pasted as a key without
 * worrying about case or stray spacing.
 *
 *   _build/expert/ocr.json    { "<normalised source line>": "فارسی" }
 *   _build/expert/posts.json  { "<post body hash>": "فارسی" }
 */
const fs = require('fs');
const path = require('path');

const lex = require('./lexicon.js');

const DIR = path.join(__dirname, 'expert');
const OCR_FILE = path.join(DIR, 'ocr.json');
const POSTS_FILE = path.join(DIR, 'posts.json');

function readMap(file) {
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    return raw && typeof raw === 'object' ? raw : {};
  } catch {
    return {};
  }
}

/** The key a source line is stored under. */
function ocrKey(text) {
  return String(lex.cleanText(text) || '').trim().toLowerCase();
}

const state = {
  ocr: {},
  posts: {},
  loaded: false,
};

function load() {
  if (state.loaded) return state;
  state.ocr = readMap(OCR_FILE);
  state.posts = readMap(POSTS_FILE);
  state.loaded = true;
  return state;
}

function ocrLine(text) {
  const key = ocrKey(text);
  if (!key) return '';
  const value = load().ocr[key];
  return typeof value === 'string' ? value.trim() : '';
}

function post(hash) {
  const value = load().posts[String(hash || '')];
  return typeof value === 'string' ? value.trim() : '';
}

function counts() {
  const s = load();
  return { ocr: Object.keys(s.ocr).length, posts: Object.keys(s.posts).length };
}

module.exports = { ocrKey, ocrLine, post, counts, OCR_FILE, POSTS_FILE };
