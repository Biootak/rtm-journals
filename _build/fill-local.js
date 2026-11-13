/*
 * Fill any untranslated OCR lines with the offline Argos en->fa model.
 * Keeps existing Google/Bing translations in phrase-cache.json and
 * translations.json, then rebuilds translations.json for every OCR image.
 *
 * Usage: node fill-local.js [--beam 2] [--batch 128]
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const core = require('./translate.js');

const ROOT = 'E:/Trade/journals';
const BUILD = path.join(ROOT, '_build');
const OCR_DIR = path.join(BUILD, 'ocr');
const RESULTS = path.join(OCR_DIR, 'results.jsonl');
const OUT = path.join(OCR_DIR, 'translations.json');
const PHRASES = path.join(OCR_DIR, 'phrase-cache.json');
const INPUT = path.join(OCR_DIR, 'local-input.json');
const OUTPUT = path.join(OCR_DIR, 'local-output.json');
const PY = path.join(BUILD, 'py', 'Scripts', 'python.exe');
const SCRIPT = path.join(BUILD, 'translate-local.py');

const args = process.argv.slice(2);
function argVal(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
}
const BATCH = Math.max(16, parseInt(argVal('--batch', '128'), 10) || 128);
const BEAM = Math.max(1, parseInt(argVal('--beam', '2'), 10) || 2);

function main() {
  const images = JSON.parse(fs.readFileSync(path.join(BUILD, 'images.json'), 'utf8'));
  const imageByHash = new Map(images.map(im => [im.hash, im]));
  const raw = new Map();
  for (const line of fs.readFileSync(RESULTS, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const o = JSON.parse(line);
      if (o.hash && !o.error && Array.isArray(o.lines)) raw.set(o.hash, o);
    } catch {}
  }

  const cache = core.loadJson(PHRASES, {});
  const existing = core.loadJson(OUT, {});
  // Keep every translation already stored, even if the phrase cache was
  // trimmed or a previous run wrote blocks directly.
  for (const entry of Object.values(existing)) {
    for (const b of (entry && entry.blocks) || []) {
      const o = String(b.original || '').trim();
      const p = String(b.persian || '').trim();
      if (o && p && p !== o && !cache[o]) cache[o] = p;
    }
  }

  const prepared = [];
  const pending = new Set();
  for (const [hash, ocr] of raw) {
    const p = core.prepareBlocks(ocr);
    p.hash = hash;
    p.ocr = ocr;
    prepared.push(p);
    for (const b of p.blocks) {
      if (core.needsTranslation(b.original) && !cache[b.original]) pending.add(b.original);
    }
  }
  console.log('OCR images:', raw.size, '| prepared:', prepared.length, '| cached phrases:', Object.keys(cache).length);
  console.log('Missing lines:', pending.size);

  const lines = [...pending];
  if (lines.length) {
    const masked = [];
    const restores = [];
    for (const line of lines) {
      const m = core.protect(line);
      masked.push(m.masked
        .replace(/\[\[(\d+)\]\]/g, '<$1>')
        .replace(/\uE000p(\d+)q\uE001/g, '<$1>'));
      restores.push(m.restore);
    }
    fs.writeFileSync(INPUT, JSON.stringify(masked), 'utf8');
    const started = Date.now();
    const res = spawnSync(PY, [SCRIPT, '--input', INPUT, '--output', OUTPUT, '--batch', String(BATCH), '--beam', String(BEAM)], {
      cwd: BUILD,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
      stdio: 'inherit',
      maxBuffer: 64 * 1024 * 1024,
    });
    if (res.error) throw res.error;
    if (res.status !== 0) throw new Error('local translator exited with ' + res.status);
    const translated = JSON.parse(fs.readFileSync(OUTPUT, 'utf8'));
    if (!Array.isArray(translated) || translated.length !== lines.length) {
      throw new Error(`local translator returned ${translated.length} lines, expected ${lines.length}`);
    }
    let filled = 0;
    for (let i = 0; i < lines.length; i++) {
      const restored = core.restoreText(translated[i] || '', restores[i]);
      if (restored && restored.trim()) {
        cache[lines[i]] = restored.trim();
        filled++;
      }
    }
    console.log(`Local translation filled ${filled}/${lines.length} lines in ${((Date.now() - started) / 1000).toFixed(0)}s`);
  }

  const out = {};
  let imagesWithText = 0;
  let translatedImages = 0;
  for (const p of prepared) {
    const { hash, ocr } = p;
    if (!p.blocks.length) {
      out[hash] = existing[hash] || { blocks: [], low: true, hasText: false, textOriginal: '', textPersian: '' };
      continue;
    }
    for (const b of p.blocks) b.persian = cache[b.original] || b.original;
    const hasFa = p.blocks.some(b => b.persian && b.persian !== b.original);
    if (hasFa) translatedImages++;
    imagesWithText++;
    out[hash] = {
      blocks: p.blocks,
      low: p.low,
      hasText: true,
      textOriginal: p.blocks.map(b => b.original).join('\n'),
      textPersian: p.blocks.map(b => b.persian).join('\n'),
      ocrWidth: ocr.width || (imageByHash.get(hash) || {}).width || 0,
      ocrHeight: ocr.height || (imageByHash.get(hash) || {}).height || 0,
    };
  }
  core.saveJson(PHRASES, cache);
  core.saveJson(OUT, out);
  console.log('DONE', { imagesWithText, translatedImages, totalEntries: Object.keys(out).length, phrases: Object.keys(cache).length });
}

main();
