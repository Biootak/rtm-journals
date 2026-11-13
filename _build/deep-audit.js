const fs = require('fs');
const path = require('path');
const DATA = 'site/data';
const idx = JSON.parse(fs.readFileSync(path.join(DATA, 'index.js'), 'utf8').replace(/^window\.RTM_INDEX=/, '').replace(/;\s*$/, ''));
const counts = {};
const add = (k, v = 1) => counts[k] = (counts[k] || 0) + v;
const samples = {};
const note = (k, s) => { if (!samples[k]) samples[k] = []; if (samples[k].length < 5) samples[k].push(s); };
let posts = 0;
for (const meta of idx.journals) {
  const base = path.join(DATA, 'journals', encodeURIComponent(meta.id));
  const metaFile = base + '.json';
  if (!fs.existsSync(metaFile)) { add('missing-journal-file'); note('missing-journal-file', meta.id); continue; }
  const j = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
  const seen = new Set();
  for (let n = 1; n <= (j.pages || 1); n++) {
    const pf = path.join(base, 'p' + n + '.json');
    if (!fs.existsSync(pf)) { add('missing-page-file'); note('missing-page-file', meta.id + '/p' + n); continue; }
    const page = JSON.parse(fs.readFileSync(pf, 'utf8'));
    for (const p of page.posts || []) {
      posts++;
      const id = p.id;
      if (seen.has(id)) { add('dup-post-id'); note('dup-post-id', id); }
      seen.add(id);
      const t = p.t || '', fa = p.fa || '';
      if (fa && fa === t) { add('fa-equals-en'); note('fa-equals-en', id); }
      if (fa && !/[\u0600-\u06FF]/.test(fa)) { add('fa-no-persian'); note('fa-no-persian', id); }
      if (fa && /[۰-۹٠-٩]/.test(fa)) { add('fa-persian-digits'); note('fa-persian-digits', id); }
      if (fa && /\[(?:\/?[a-z]|url)/i.test(fa)) { add('fa-bbcode'); note('fa-bbcode', id); }
      if (t && /\[(?:\/?[a-z]|url)/i.test(t)) { add('en-bbcode'); note('en-bbcode', id); }
      const np = s => String(s || '').split(/\n\s*\n/).filter(x => x.trim()).length;
      if (fa && np(fa) !== np(t)) { add('para-drift'); note('para-drift', id); }
      if (/wrote:/i.test(t) && fa && !/نوشت:/.test(fa)) { add('quote-head-missing'); note('quote-head-missing', id); }
      if (!p.a) { add('no-author'); note('no-author', id); }
      if (!p.d) { add('no-date'); note('no-date', id); }
      if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(fa + t)) { add('control-chars'); note('control-chars', id); }
      if (!(p.p >= 1 && p.p <= (j.pages || 1))) { add('bad-page-number'); note('bad-page-number', id); }
    }
  }
}
console.log('journals', idx.journals.length, 'posts', posts);
console.log(JSON.stringify(counts, null, 1));
for (const [k, v] of Object.entries(samples)) console.log(k, '::', v.join(', '));
