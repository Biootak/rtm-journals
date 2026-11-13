#!/usr/bin/env node
/* Compact paragraph map for a page: EN ¶n and FA ¶n per post.
 *   node _build/expert/para-map.js if-p2
 */
'use strict';
const fs = require('fs');
const path = require('path');
const EXPERT = path.resolve(__dirname);
const page = process.argv[2];
const work = JSON.parse(fs.readFileSync(path.join(EXPERT, 'work', page + '.json'), 'utf8'));
const batch = JSON.parse(fs.readFileSync(path.join(EXPERT, 'batches', page + '.json'), 'utf8'));
const paras = s => String(s || '').split(/\n{2,}/).map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
for (const w of work) {
  const en = paras(w.text), fa = paras(batch[w.hash]);
  console.log(`\n## ${w.id}  EN=${en.length} FA=${fa.length}  author=${w.author}`);
  en.forEach((p, i) => console.log(`  EN${i + 1}: ${p.slice(0, 150)}${p.length > 150 ? '…' : ''}`));
  if (en.length !== fa.length) fa.forEach((p, i) => console.log(`  FA${i + 1}: ${p.slice(0, 150)}${p.length > 150 ? '…' : ''}`));
}
