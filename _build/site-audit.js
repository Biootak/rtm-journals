#!/usr/bin/env node
// Site-wide data audit: posts, translations, images, index, search, integrity.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const data = path.join(root, 'site/data');
const assets = path.join(root, 'site/assets');
const sandbox = { window: {} };
const run = f => vm.runInNewContext(fs.readFileSync(f, 'utf8'), sandbox);

const journalDir = path.join(data, 'journals');
for (const f of fs.readdirSync(journalDir).filter(x => x.endsWith('.js'))) run(path.join(journalDir, f));
for (const f of ['index.js', 'search.js', 'integrity.js']) if (fs.existsSync(path.join(data, f))) run(path.join(data, f));

const cache = sandbox.window.RTM_JOURNAL_CACHE || {};
const index = sandbox.window.RTM_INDEX || { journals: [] };
const search = sandbox.window.RTM_SEARCH || { posts: [] };
const integrity = sandbox.window.RTM_ASSET_INTEGRITY || {};

const imgBases = new Set(fs.readdirSync(path.join(assets, 'images')).map(f => f.replace(/\.[^.]+$/, '')));
const thumbBases = new Set(fs.readdirSync(path.join(assets, 'thumbs')).map(f => f.replace(/\.[^.]+$/, '')));

const paras = s => String(s || '').split(/\n{2,}/).map(x => x.trim()).filter(Boolean);
const proseWords = s => (String(s)
  .replace(/https?:\/\/\S+|www\.\S+/gi, ' ')
  .replace(/\S+\.(?:com|org|net|edu|io|gov|co|me|tv|info|ly|uk|de|ca|php|html?|pdf|jpg|jpeg|png|webp|gif)\S*/gi, ' ')
  .replace(/\S+\/\S*/g, ' ')
  .match(/[A-Za-z]{3,}/g) || []);
const isProse = s => proseWords(s).length >= 3 && !/[\u0600-\u06FF]/.test(String(s));

const issues = [];
const add = (kind, id, detail) => issues.push({ kind, id, detail });
const seen = new Map();
let posts = 0;

for (const [jid, j] of Object.entries(cache)) {
  if (!j || !Array.isArray(j.posts)) { add('journal-empty', jid, 'no posts array'); continue; }
  for (const p of j.posts) {
    posts++;
    if (seen.has(p.id)) add('duplicate-id', p.id, `also in ${seen.get(p.id)}`);
    else seen.set(p.id, jid);
    if (!p.id || !p.id.startsWith(jid + '_p')) add('id-mismatch', p.id, jid);
    const en = paras(p.t);
    const fa = paras(p.fa);
    if (!String(p.fa || '').trim()) {
      if (en.some(isProse)) add('no-translation', p.id, `${en.length} EN paragraphs`);
    } else if (en.length !== fa.length) {
      add('paragraph-drift', p.id, `EN ${en.length} / FA ${fa.length}`);
    }
    for (const h of p.im || []) {
      if (!imgBases.has(h)) add('missing-image', p.id, h);
      if (!thumbBases.has(h)) add('missing-thumb', p.id, h);
    }
    if (p.p < 1 || p.p > j.pages) add('bad-page', p.id, `p${p.p} of ${j.pages}`);
    if (!p.a) add('missing-author', p.id, '');
    if (!p.d) add('missing-date', p.id, '');
  }
}

const indexIds = new Set(index.journals.map(j => j.id));
for (const jid of Object.keys(cache)) if (!indexIds.has(jid)) add('missing-from-index', jid, '');
for (const j of index.journals) if (!cache[j.id]) add('index-without-data', j.id, '');

const searchIds = new Set(search.posts.map(p => p[2]));
let searchMissing = 0;
for (const id of seen.keys()) if (!searchIds.has(id)) searchMissing++;
if (searchMissing) add('search-missing', `${searchMissing} posts`, 'not in search index');

for (const [jid, j] of Object.entries(cache)) {
  const idx = index.journals.find(x => x.id === jid);
  if (idx && idx.posts !== j.posts.length) add('index-count-mismatch', jid, `index ${idx.posts} / data ${j.posts.length}`);
}

const byKind = {};
for (const i of issues) byKind[i.kind] = (byKind[i.kind] || 0) + 1;
console.log(`journals ${Object.keys(cache).length} | posts ${posts} | search ${search.posts.length} | issues ${issues.length}`);
console.log(byKind);
for (const i of issues.slice(0, 40)) console.log(`${i.kind} ${i.id} — ${i.detail}`);
console.log('integrity checked', integrity.checked, 'fullOk', integrity.fullOk, 'thumbOk', integrity.thumbOk);
fs.writeFileSync(path.join(root, '_build/site-audit.json'), JSON.stringify({ posts, byKind, issues }, null, 1));
