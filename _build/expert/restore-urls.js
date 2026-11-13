#!/usr/bin/env node
/*
 * Restore URLs that the ellipsis rule damaged inside the Persian layer.
 *
 * The rule turned a printed "…/about.html" into "…/about.html" with an
 * ellipsis character, so a URL that the English carries verbatim no longer
 * matched. The English anchor is authoritative (URLs stay Latin and identical),
 * so rebuild the exact URL from its parts.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const W = path.join(__dirname, 'work');
const B = path.join(__dirname, 'batches');

const URL_RE = /https?:\/\/\S+|www\.\S+/g;
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let fixedPosts = 0, fixedUrls = 0;
const samples = [];

for (const file of fs.readdirSync(W).filter(f => f.endsWith('.json'))) {
  const page = file.replace(/\.json$/, '');
  const work = JSON.parse(fs.readFileSync(path.join(W, file), 'utf8'));
  const bf = path.join(B, file);
  if (!fs.existsSync(bf)) continue;
  const batch = JSON.parse(fs.readFileSync(bf, 'utf8'));
  let dirty = false;
  for (const w of work) {
    let fa = String(batch[w.hash] || '');
    if (!fa.trim()) continue;
    const urls = (String(w.text).match(URL_RE) || []).map(u => u.replace(/[),.;]+$/, ''));
    let changed = false;
    for (const url of urls) {
      if (fa.includes(url)) continue;
      const parts = url.split('...').map(escape);
      const re = new RegExp(parts.join('(?:\\.{2,}|…\\s*)'), 'g');
      if (!re.test(fa)) continue;
      const before = fa;
      fa = fa.replace(re, url);
      if (fa !== before) { changed = true; fixedUrls++; if (samples.length < 8) samples.push(`${page} ${w.id}: ${url}`); }
    }
    if (changed) { batch[w.hash] = fa; dirty = true; fixedPosts++; }
  }
  if (dirty) fs.writeFileSync(bf, JSON.stringify(batch), 'utf8');
}
console.log(`restored ${fixedUrls} URLs in ${fixedPosts} posts`);
for (const s of samples) console.log('  - ' + s);
