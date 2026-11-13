/* How many of the 42 header-only assets have a whole copy of the same
 * attachment somewhere else in the same journal folder? */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = 'E:/Trade/journals';
const P = JSON.parse(fs.readFileSync(path.join(ROOT, '_build/parsed.json'), 'utf8'));
const kind = b => (b.length > 24 && b[0] === 0x89 && b[1] === 0x50) ? 'png'
  : (b.length > 3 && b[0] === 0xff && b[1] === 0xd8) ? 'jpg'
  : (b.length > 6 && b.toString('latin1', 0, 4) === 'GIF8') ? 'gif'
  : (b.length > 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP') ? 'webp' : null;
const endOk = (b, k) => {
  let e = b.length; while (e > 0 && [10, 13, 32, 9, 0].includes(b[e - 1])) e--;
  const t = b.subarray(Math.max(0, e - 12), e);
  if (k === 'png') return t.includes(Buffer.from('IEND', 'latin1')) && b[e - 1] === 0xae ^ false ? b[e - 1] === 0xae : false;
  if (k === 'jpg') return b[e - 1] === 0xd9 && b[e - 2] === 0xff;
  if (k === 'gif') return b[e - 1] === 0x3b;
  return true;
};
const sha1 = f => crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex');
const out = [];
for (const J of P.journals) {
  const small = (J.images || []).filter(im => im.type === 'local' && (Number(im.bytes) || 0) < 512);
  if (!small.length) continue;
  /* every image file in this journal's mirror folders, by lowercase name */
  const mirror = new Map();
  const root = path.join(ROOT, J.dir || '');
  let subs = [];
  try { subs = fs.readdirSync(root, { withFileTypes: true }).filter(e => e.isDirectory() && /_files$/i.test(e.name)).map(e => e.name); } catch { }
  for (const d of subs) for (const f of (safe(path.join(root, d)))) {
    if (!/\.(png|jpe?g|gif|webp)$/i.test(f)) continue;
    const p = path.join(root, d, f);
    let st; try { st = fs.statSync(p); } catch { continue; }
    if (st.size < 512) continue;
    const b = fs.readFileSync(p);
    const k = kind(b.subarray(0, 32));
    if (!k || !endOk(b, k)) continue;
    const key = f.toLowerCase();
    (mirror.get(key) || mirror.set(key, []).get(key)).push({ p, sha1: sha1(p), size: st.size });
  }
  function safe(d) { try { return fs.readdirSync(d); } catch { return []; } }
  for (const im of small) {
    const nm = String(im.originalName || path.basename(im.localPath || '')).toLowerCase();
    const cands = mirror.get(nm) || [];
    const dig = [...new Set(cands.map(x => x.sha1))];
    out.push({ jid: J.id, name: nm, bytes: im.bytes, whole: cands.length, distinct: dig.length, cand: dig.length === 1 ? cands[0].p : '', size: dig.length === 1 ? cands[0].size : 0 });
  }
}
const good = out.filter(x => x.distinct === 1);
console.log('sub-512 records:', out.length);
console.log('  a whole same-name copy exists in this journal:', good.length);
console.log('  nothing usable on disk:', out.length - good.length);
console.log('  ambiguous (several different copies):', out.filter(x => x.distinct > 1).length);
for (const g of good.slice(0, 40)) console.log('   FIX ' + g.jid.padEnd(13) + g.name.padEnd(38) + g.bytes + 'b -> ' + g.size + 'b  ' + path.basename(path.dirname(g.cand)));
const hopeless = out.filter(x => x.distinct === 0);
const byJ = {};
for (const h of hopeless) byJ[h.jid] = (byJ[h.jid] || 0) + 1;
console.log('\nno whole copy by journal:', JSON.stringify(byJ));
