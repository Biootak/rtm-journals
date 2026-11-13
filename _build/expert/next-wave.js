/*
 * Plan the next translation wave from the live corpus.
 *
 *   node _build/expert/next-wave.js --groups 6 --target 20000
 *
 * Picks the largest still-untranslated pages and bin-packs them into balanced
 * groups of ~TARGET source characters each, then writes
 * _build/expert/waves/current.json. Read-only apart from that plan file.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..', '..');
const E = path.join(ROOT, '_build', 'expert');
const read = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };
const norm = t => String(t || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n').trim();
const hashOf = t => crypto.createHash('sha1').update(norm(t)).digest('hex');

const flag = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? Number(process.argv[i + 1]) : d; };
const GROUPS = flag('--groups', 6);
const TARGET = flag('--target', 20000);

const parsed = read(path.join(ROOT, '_build', 'parsed.json'), { journals: [] });
const expert = { ...read(path.join(E, 'posts.json'), {}) };
for (const f of fs.readdirSync(path.join(E, 'batches')).filter(n => n.endsWith('.json'))) {
  Object.assign(expert, read(path.join(E, 'batches', f), {}));
}

const pages = new Map();
for (const j of parsed.journals || []) {
  for (const p of j.posts || []) {
    const text = String(p.text || '').trim();
    if (!text || Object.prototype.hasOwnProperty.call(expert, hashOf(text))) continue;
    const key = j.id + '-p' + (p.pageNum || 1);
    if (!pages.has(key)) pages.set(key, { key, posts: 0, chars: 0 });
    const row = pages.get(key);
    row.posts++;
    row.chars += text.length;
  }
}

const all = [...pages.values()].sort((a, b) => b.chars - a.chars);
const budget = GROUPS * TARGET;
const chosen = [];
let sum = 0;
for (const p of all) {
  if (sum >= budget && chosen.length >= GROUPS) break;
  chosen.push(p);
  sum += p.chars;
}

// Largest-first into the currently lightest bin keeps groups balanced.
const groups = Array.from({ length: Math.min(GROUPS, chosen.length) }, (_, i) =>
  ({ agent: i + 1, pages: [], posts: 0, chars: 0 }));
for (const p of chosen) {
  const g = groups.reduce((a, b) => b.chars < a.chars ? b : a);
  g.pages.push(p.key);
  g.posts += p.posts;
  g.chars += p.chars;
}

const out = {
  generatedAt: new Date().toISOString(),
  remainingPages: all.length,
  remainingPosts: all.reduce((n, p) => n + p.posts, 0),
  remainingChars: all.reduce((n, p) => n + p.chars, 0),
  wavePages: chosen.length,
  wavePosts: chosen.reduce((n, p) => n + p.posts, 0),
  waveChars: sum,
  groups,
};
fs.mkdirSync(path.join(E, 'waves'), { recursive: true });
fs.writeFileSync(path.join(E, 'waves', 'current.json'), JSON.stringify(out, null, 1), 'utf8');

console.log(`remaining ${out.remainingPosts} posts / ${out.remainingPages} pages / ${out.remainingChars} chars`);
console.log(`this wave: ${out.wavePosts} posts, ${chosen.length} pages, ${sum} chars`);
for (const g of groups) console.log(`  agent ${g.agent}: ${g.pages.join(', ')}  (${g.posts} posts, ${g.chars} chars)`);
