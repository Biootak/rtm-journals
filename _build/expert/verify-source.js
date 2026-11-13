#!/usr/bin/env node
/*
 * Verify the English layer against the local captures.
 *
 * For every journal, build a text cache from its own source files:
 *   HTML  — the saved forum page, tags/scripts stripped
 *   PDF   — the printed page, via pdftotext (text layer, not OCR)
 * Then check each post's opening and closing 10-word shingle against that
 * cache. A missing tail is a truncated import; a missing head means the post
 * was assembled from the wrong place. Nothing is repaired here: this pass only
 * records what the source supports.
 *
 *   node _build/expert/verify-source.js            # all journals, cached
 *   node _build/expert/verify-source.js warren     # one journal
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const BUILD = path.join(ROOT, '_build');
const CACHE = path.join(__dirname, 'source-cache');
const LEDGER = path.join(__dirname, 'PROGRESS.json');
const OUT = path.join(__dirname, 'source-verification.json');
const parsed = JSON.parse(fs.readFileSync(path.join(BUILD, 'parsed.json'), 'utf8'));

const only = process.argv.slice(2).filter(a => !a.startsWith('--'));
fs.mkdirSync(CACHE, { recursive: true });

const clean = s => String(s || '')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"')
  .replace(/&#0?39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
  .replace(/\s+/g, ' ').trim();
const words = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function walk(dir, out, depth = 0) {
  if (depth > 6) return;
  let ents = [];
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out, depth + 1);
    else if (/\.(?:html?|pdf)$/i.test(e.name)) out.push(p);
  }
}

function candidates(journal) {
  const names = [journal.dir, journal.name, journal.title, journal.id].filter(Boolean);
  const out = new Set();
  for (const n of names) {
    const p = path.isAbsolute(n) ? n : path.join(ROOT, n);
    if (fs.existsSync(p)) out.add(p);
    const e = path.join(BUILD, 'rtm-resources', 'extracted', n);
    if (fs.existsSync(e)) out.add(e);
  }
  return [...out];
}

function sourceText(journal) {
  const cacheFile = path.join(CACHE, journal.id + '.txt');
  if (fs.existsSync(cacheFile)) return fs.readFileSync(cacheFile, 'utf8');
  const files = [];
  for (const dir of candidates(journal)) {
    const stat = fs.statSync(dir);
    if (stat.isDirectory()) walk(dir, files);
    else if (/\.(?:html?|pdf)$/i.test(dir)) files.push(dir);
  }
  let text = '';
  for (const f of files.slice(0, 4000)) {
    try {
      if (/\.pdf$/i.test(f)) {
        text += ' ' + execFileSync('pdftotext', ['-layout', f, '-'], { maxBuffer: 64 * 1024 * 1024 }).toString('utf8');
      } else {
        text += ' ' + clean(fs.readFileSync(f, 'utf8'));
      }
    } catch { /* an unreadable capture is reported by the miss count */ }
  }
  const norm = text.replace(/\s+/g, ' ').trim();
  fs.writeFileSync(cacheFile, norm, 'utf8');
  return norm;
}

const shingle = (s, n = 10) => {
  const w = words(s).split(' ').filter(Boolean);
  if (w.length < n) return words(s);
  return w.slice(0, n).join(' ') + '\u0001' + w.slice(-n).join(' ');
};

const results = [];
let posts = 0, verified = 0, fuzzy = 0, unsupported = 0;
const examples = [];
for (const journal of parsed.journals) {
  if (only.length && !only.includes(journal.id)) continue;
  const text = sourceText(journal);
  const src = ' ' + words(text) + ' ';
  const srcTokens = new Set(src.split(' ').filter(Boolean));
  const row = { id: journal.id, posts: 0, verified: 0, fuzzy: 0, unsupported: 0, sourceChars: src.length };
  if (!src.trim()) { row.status = 'no-source'; results.push(row); continue; }
  for (const post of journal.posts || []) {
    const t = String(post.text || '').trim();
    if (!t) continue;
    posts++; row.posts++;
    const w = words(t).split(' ').filter(Boolean);
    const n = Math.min(10, Math.max(4, Math.floor(w.length / 3)));
    const head = w.slice(0, n).join(' ');
    const tail = w.slice(-n).join(' ');
    const hasHead = src.includes(' ' + head + ' ');
    const hasTail = src.includes(' ' + tail + ' ');
    /* The capture interleaves URLs, page furniture and signatures between the
       sentences of a post, so an exact 10-word shingle can miss while every
       word is present. Coverage separates that from text the capture does not
       contain at all. */
    const coverage = arr => arr.filter(x => srcTokens.has(x)).length / Math.max(1, arr.length);
    const coverHead = coverage(w.slice(0, n));
    const coverTail = coverage(w.slice(-n));
    if (hasHead && hasTail) { verified++; row.verified++; }
    else if (coverHead >= 0.75 && coverTail >= 0.75) { fuzzy++; row.fuzzy++; }
    else {
      unsupported++; row.unsupported++;
      if (examples.length < 40) examples.push({
        id: post.id, journal: journal.id,
        coverHead: Number(coverHead.toFixed(2)), coverTail: Number(coverTail.toFixed(2)),
        head: w.slice(0, n).join(' '), tail: w.slice(-n).join(' '),
      });
    }
  }
  row.status = row.unsupported === 0 ? 'verified' : 'mismatch';
  results.push(row);
}

const led = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, 'utf8')) : {};
led.source = {
  checkedAt: new Date().toISOString(),
  method: 'exact shingle, else >=75% head/tail token coverage in the local capture',
  posts, verified, fuzzy, unsupported,
  journals: results,
  examples,
};
fs.writeFileSync(LEDGER, JSON.stringify(led, null, 1), 'utf8');
fs.writeFileSync(OUT, JSON.stringify(led.source, null, 1), 'utf8');
console.log({ posts, verified, fuzzy, unsupported, journals: results.length });
for (const r of results.filter(x => x.status === 'mismatch').sort((a, b) => b.unsupported - a.unsupported).slice(0, 15)) {
  console.log(`  ${r.id}: unsupported ${r.unsupported}/${r.posts}`);
}
console.log('wrote source-verification.json and updated PROGRESS.json');
