/* ------------------------------------------------------------ uid name probe
 * Nine broken source files and twenty dead attachment URLs are the floor left by
 * recover-assets.js, whose fallback only looks inside the *same* trader's mirror
 * folders.
 *
 * A Kunena attachment URL carries the uploader's id:
 *     /media/kunena/attachments/<uid>/<filename>
 * which is a real identity, not a coincidence — two pages that request the same
 * uid+name ask for one and the same resource. So a copy of `usdfnew.png` in
 * another trader's folder is usable exactly when that folder's own page HTML
 * requests it from the same /<uid>/ path that this broken reference does.
 *
 * This probe measures how many of the 29 lost names that test would rescue.
 * It reads only; nothing is written to the archive.
 *
 * MEASURED RESULT (2026-11-06) — zero extra rescues, so the floor is real:
 * 62 references over 42 posts. The single name whose page HTML still carries an
 * /attachments/<uid>/ href (2018-03-07_5-51-59.png) is a PNG cut at exactly
 * 65,536 bytes with no IEND, so "magic" there means a header, not a whole file.
 * For every 404-stub name the saved browser had already rewritten the href to
 * the local stub path, so no uid survives anywhere to compare against. */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');

const sha1 = b => crypto.createHash('sha1').update(b).digest('hex');
const lost = JSON.parse(fs.readFileSync(path.join(ROOT, '_build', 'lost-images.json'), 'utf8'));
const parsed = JSON.parse(fs.readFileSync(path.join(ROOT, '_build', 'parsed.json'), 'utf8'));

const rootOf = J => path.join(ROOT, J.dir || '');
const jById = new Map(parsed.journals.map(J => [J.id, J]));

/* ---- 1. every attachment path each journal's own pages request ---- */
const attByJournal = new Map();   /* jid -> Map(lowercase basename -> Set("uid/name")) */
let htmlCount = 0;
for (const J of parsed.journals) {
  const m = new Map();
  let subs = [];
  try {
    subs = fs.readdirSync(rootOf(J), { withFileTypes: true })
      .filter(e => e.isDirectory() && /_files$/i.test(e.name)).map(e => e.name);
  } catch { attByJournal.set(J.id, m); continue; }
  /* the saved page sits next to its _files folder: "… - Page 3 - RTM Community.html" */
  let tops = [];
  try { tops = fs.readdirSync(rootOf(J)); } catch { }
  for (const d of subs) {
    const htmlName = d.replace(/_files$/i, '') + '.html';
    const cand = tops.find(t => t.toLowerCase() === htmlName.toLowerCase());
    if (!cand) continue;
    let txt = '';
    try { txt = fs.readFileSync(path.join(rootOf(J), cand), 'utf8'); } catch { continue; }
    htmlCount++;
    for (const mm of txt.matchAll(/<img[^>]+src=["']([^"']*)["']/gi)) {
      const a = /\/attachments\/(\d+)\/([^/?#]+)/i.exec(mm[1]);
      if (!a) continue;
      const key = a[2].toLowerCase();
      if (!m.has(key)) m.set(key, new Set());
      m.get(key).add(a[1] + '/' + a[2]);
    }
  }
  attByJournal.set(J.id, m);
}
console.log('journal page HTML scanned : ' + htmlCount);

/* ---- 2. every file on disk that carries one of the lost names ---- */
const names = new Map();          /* lowercase name -> Set of jids that lost it */
for (const it of lost.items) {
  const n = String(it.name || '').toLowerCase();
  if (!n) continue;
  if (!names.has(n)) names.set(n, new Set());
  names.get(n).add(it.jid);
}
const copies = new Map();         /* lowercase name -> [{jid, file, bytes, sha1, kind}] */
for (const J of parsed.journals) {
  let subs = [];
  try {
    subs = fs.readdirSync(rootOf(J), { withFileTypes: true })
      .filter(e => e.isDirectory() && /_files$/i.test(e.name)).map(e => e.name);
  } catch { continue; }
  for (const d of subs) {
    let files = [];
    try { files = fs.readdirSync(path.join(rootOf(J), d)); } catch { continue; }
    for (const f of files) {
      const key = f.toLowerCase();
      if (!names.has(key)) continue;
      const p = path.join(rootOf(J), d, f);
      let b = null; try { b = fs.readFileSync(p); } catch { continue; }
      const kind = b.length > 24 && b[0] === 0x89 && b[1] === 0x50 ? 'png'
        : b.length > 3 && b[0] === 0xff && b[1] === 0xd8 ? 'jpg'
          : b.toString('latin1', 0, 4) === 'GIF8' ? 'gif' : null;
      if (!copies.has(key)) copies.set(key, []);
      copies.get(key).push({ jid: J.id, file: p, bytes: b.length, sha1: kind ? sha1(b) : null, kind });
    }
  }
}

/* ---- 3. apply the uid rule ---- */
const out = { rescued: [], wantedAmbiguous: [], digestConflict: [], noWholeCopy: [], uidMismatch: [] };
const refsOf = n => lost.items.filter(x => String(x.name).toLowerCase() === n).length;
for (const [name, jids] of names) {
  const all = copies.get(name) || [];
  const whole = all.filter(c => c.kind && c.bytes >= 512);
  /* what this journal's own pages asked for */
  const wanted = new Set();
  for (const jid of jids) for (const p of (attByJournal.get(jid) || new Map()).get(name) || []) wanted.add(p.toLowerCase());
  const row = {
    name, refs: refsOf(name), jids: [...jids].join(','),
    wantedPaths: [...wanted].join(' '),
    copies: all.length, magic: whole.length, digests: new Set(whole.map(c => c.sha1)).size,
  };
  if (!whole.length) out.noWholeCopy.push(row);
  else if (wanted.size === 0) { row.detail = 'no page HTML in the losing journal names this attachment'; out.uidMismatch.push(row); }
  else if (wanted.size > 1) { out.wantedAmbiguous.push(row); }
  else {
    const want1 = [...wanted][0];
    const proven = whole.filter(c => [...(attByJournal.get(c.jid) || new Map()).get(name) || []]
      .some(p => p.toLowerCase() === want1));
    row.proven = proven.map(c => c.jid + ' → ' + path.relative(ROOT, c.file));
    if (!proven.length) out.uidMismatch.push(row);
    else if (new Set(proven.map(c => c.sha1)).size > 1) out.digestConflict.push(row);
    else out.rescued.push(row);
  }
}
for (const k of ['rescued', 'uidMismatch', 'wantedAmbiguous', 'digestConflict', 'noWholeCopy']) {
  const l = out[k];
  console.log('\n' + k + ' — ' + l.length + ' names, ' + l.reduce((a, x) => a + x.refs, 0) + ' refs');
  for (const r of l) {
    console.log('  ' + r.name.slice(0, 44).padEnd(46) + 'refs ' + String(r.refs).padStart(2) +
      ' from [' + r.jids + '] header-only-pass ' + r.magic + '/' + r.copies + ' wanted "' + (r.wantedPaths || '-') + '"');
    for (const p of (r.proven || []).slice(0, 3)) console.log('        proven: ' + p.slice(0, 120));
    if (r.detail) console.log('        ' + r.detail);
  }
}
fs.writeFileSync(path.join(ROOT, '_build', 'probe-uid-rescue.json'), JSON.stringify(out, null, 1) + '\n');
console.log('\nwrote _build/probe-uid-rescue.json');
