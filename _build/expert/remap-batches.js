/*
 * Re-key translated batches after a re-import changed the source hashes.
 *
 *   node _build/expert/remap-batches.js
 *
 * A batch is keyed by SHA-1 of the English text. A re-import can change a post's
 * hash two ways: the prose changed (a card line or quote head moved), or only the
 * page number changed (the relabel fix) so the id moved but the text did not.
 * Both are carried here:
 *   1. text hash still present -> the translation applies verbatim (covers pure
 *      page renumbering, where the id changed but the prose is identical);
 *   2. otherwise the stable post id is matched against the backup work file and
 *      the translation is carried only when the paragraph count is unchanged
 *      (the validator aligns Persian to English paragraph by paragraph).
 * Posts that fail both are left untranslated for a human. Work/batch files for
 * pages that no longer exist in the corpus are removed.
 *
 * Backup used: _build/backup-before-reimport/{work,batches}.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const EXPERT = path.join(ROOT, '_build', 'expert');
const WORK = path.join(EXPERT, 'work');
const BATCHES = path.join(EXPERT, 'batches');
const BACKUP = path.join(ROOT, '_build', 'backup-before-reimport');
const OLD_WORK = path.join(BACKUP, 'work');
const OLD_BATCHES = path.join(BACKUP, 'batches');

const paragraphs = s => String(s || '').split(/\n{2,}/).filter(x => x.trim()).length;
const readJson = (p, d) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return d; } };

const parsed = readJson(path.join(ROOT, '_build', 'parsed.json'), { journals: [] });
const validPages = new Set();
for (const j of parsed.journals || []) {
  for (const p of j.posts || []) {
    // work-files and the validator both skip empty-text posts, so a page whose
    // posts are all empty has no work file and must not keep a stale one.
    if (String(p.text || '').trim()) validPages.add(`${j.id}-p${p.pageNum || 1}.json`);
  }
}

// Every existing translation, keyed by the English text hash it was written for.
const faByHash = new Map();
const loadBatches = dir => {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir).filter(n => n.endsWith('.json'))) {
    for (const [h, fa] of Object.entries(readJson(path.join(dir, name), {}))) {
      if (typeof fa === 'string' && fa.trim()) faByHash.set(h, fa);
    }
  }
};
loadBatches(OLD_BATCHES);
// Translations written after the backup must survive this pass too: they are
// keyed by the current hashes and win over the older map when both exist.
loadBatches(BATCHES);

// Backup work: stable post id -> the hash and paragraph count it had before.
const oldById = new Map();
for (const name of fs.readdirSync(OLD_WORK).filter(n => n.endsWith('.json'))) {
  for (const w of readJson(path.join(OLD_WORK, name), [])) {
    oldById.set(w.id, { hash: w.hash, para: paragraphs(w.text) });
  }
}

let carried = 0, dropped = 0, pages = 0, keptPages = 0, stale = 0;
const dropList = [];
for (const name of fs.readdirSync(WORK).filter(n => n.endsWith('.json'))) {
  const workFile = path.join(WORK, name);
  const batchFile = path.join(BATCHES, name);
  if (!validPages.has(name)) {
    // A page the relabel fix folded into another: its translations were already
    // carried by text hash into the correct page's batch above.
    fs.unlinkSync(workFile);
    if (fs.existsSync(batchFile)) fs.unlinkSync(batchFile);
    stale++;
    continue;
  }
  const newWork = readJson(workFile, []);
  const out = {};
  for (const row of newWork) {
    if (faByHash.has(row.hash)) { out[row.hash] = faByHash.get(row.hash); carried++; continue; }
    const old = oldById.get(row.id);
    if (old && old.para === paragraphs(row.text) && faByHash.has(old.hash)) {
      out[row.hash] = faByHash.get(old.hash);
      carried++;
      continue;
    }
    dropped++;
    if (old) dropList.push(`${row.id} paragraphs ${old.para} -> ${paragraphs(row.text)}`);
  }
  pages++;
  if (Object.keys(out).length) {
    fs.writeFileSync(batchFile, JSON.stringify(out, null, 1), 'utf8');
    keptPages++;
  } else if (fs.existsSync(batchFile)) {
    fs.unlinkSync(batchFile);
  }
}
console.log(`pages ${pages} | kept ${keptPages} | carried ${carried} | dropped ${dropped} | stale removed ${stale}`);
if (dropList.length) console.log(dropList.slice(0, 40).join('\n'));