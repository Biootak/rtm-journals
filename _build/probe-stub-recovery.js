/* Probe: for every reference whose saved copy is a 404 stub (or absent), does a
 * real image with the same attachment name exist elsewhere inside the SAME
 * journal folder? Journal-scoped on purpose: generic names like USDJPY.png
 * collide across traders and would paste the wrong chart into the wrong diary. */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = 'E:/Trade/journals';
const parsed = JSON.parse(fs.readFileSync(path.join(ROOT, '_build/parsed.json'), 'utf8'));
const report = JSON.parse(fs.readFileSync(path.join(ROOT, '_build/recovery-report.json'), 'utf8'));

const IMG_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']);
const kindOf = b => {
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length > 6 && b.slice(0, 6).toString('latin1').match(/^GIF8[79]a/)) return 'gif';
  if (b.length > 12 && b.slice(0, 4).toString('latin1') === 'RIFF' && b.slice(8, 12).toString('latin1') === 'WEBP') return 'webp';
  return null;
};
const sha1 = f => crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex');

/* journal dir -> lowercase basename -> [{path, sha1, bytes, kind}] */
const idx = new Map();
for (const J of parsed.journals) {
  const dir = path.join(ROOT, J.dir || '');
  const m = new Map();
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { }
  for (const e of entries) {
    if (!e.isDirectory() || !/_files$/i.test(e.name)) continue;
    const pd = path.join(dir, e.name);
    let fs2 = [];
    try { fs2 = fs.readdirSync(pd); } catch { continue; }
    for (const f of fs2) {
      const ext = (f.split('.').pop() || '').toLowerCase();
      if (!IMG_EXT.has(ext)) continue;
      const p = path.join(pd, f);
      let st; try { st = fs.statSync(p); } catch { continue; }
      if (st.size < 300) continue;
      const k = f.toLowerCase();
      if (!m.has(k)) m.set(k, []);
      m.get(k).push({ path: p, page: /Page (\d+)/i.exec(e.name)?.[1] || '', bytes: st.size });
    }
  }
  idx.set(J.id, m);
}

const heldHashes = new Map();
for (const J of parsed.journals) heldHashes.set(J.id, new Set((J.images || []).map(x => x.hash)));

const want = [...report.alignment.dropped.map(x => ({ ...x, from: 'stub' })),
              ...report.alignment.noLocalCopy.map(x => ({ ...x, from: 'absent' }))];
const buckets = { unique_new: [], unique_held: [], ambiguous: [], none: [] };
const rows = [];
for (const w of want) {
  const name = String(w.name || path.basename(String(w.url || ''))).toLowerCase();
  const list = (idx.get(w.jid) || new Map()).get(name) || [];
  const uniq = [...new Map(list.map(x => [x.path.toLowerCase(), x])).values()];
  if (!uniq.length) { buckets.none.push(w); continue; }
  const digests = [...new Set(uniq.map(x => { try { return sha1(x.path); } catch { return ''; } }))].filter(Boolean);
  const rec = { ...w, cands: uniq.map(x => x.path), bytes: uniq.map(x => x.bytes) };
  if (digests.length > 1) { rec.variants = digests.length; buckets.ambiguous.push(rec); continue; }
  rec.sha1 = digests[0];
  const kind = (() => { try { return kindOf(fs.readFileSync(uniq[0].path).subarray(0, 16)); } catch { return null; } })();
  rec.kind = kind;
  if (!kind) { buckets.none.push({ ...w, why: 'not-an-image' }); continue; }
  if ((heldHashes.get(w.jid) || new Set()).has(digests[0])) buckets.unique_held.push(rec);
  else buckets.unique_new.push(rec);
  rows.push(w.jid + ' p' + w.page + ' ' + w.postId + ' ' + w.name + ' -> ' + path.basename(uniq[0].path) +
    (uniq[0].page && String(uniq[0].page) !== String(w.page) ? '  (page ' + uniq[0].page + ')' : '') +
    '  ' + kind + ' ' + uniq[0].bytes + 'b  ' + w.from);
}
console.log('references probed      ', want.length);
console.log('  recoverable NEW file ', buckets.unique_new.length);
console.log('  bytes already held   ', buckets.unique_held.length);
console.log('  ambiguous (N copies) ', buckets.ambiguous.length);
console.log('  nothing on disk      ', buckets.none.length);
const am = {};
for (const a of buckets.ambiguous) am[a.name] = (am[a.name] || 0) + 1, a.note = a.cands.map(x => path.basename(path.dirname(x))).join(' | ');
console.log('\nambiguous detail:');
for (const a of buckets.ambiguous.slice(0, 20)) console.log('  ' + a.jid + ' p' + a.page + ' ' + a.name + '  x' + a.variants + '  ' + a.note);
console.log('\nrecoverable detail:');
console.log(rows.slice(0, 70).join('\n'));
console.log('\n(+' + Math.max(0, rows.length - 70) + ' more)');
