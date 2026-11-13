/*
 * Score an OCR results file against the hand-transcribed ground truth.
 *
 *   node ocr-score.js ocr/sample/pre.jsonl [more.jsonl ...]
 *
 * Metrics, all computed over the GT "prose" lines (the text a reader actually
 * has to read; chart chrome and axis numbers are excluded because the site
 * renders them as noise anyway):
 *   recall   share of GT words that appear in the OCR output (multiset)
 *   exact    share of GT lines reproduced character-for-character
 *   matched  share of GT lines whose best OCR line is >=90% similar
 *   cer      mean character error rate of that best match
 *   spurious share of OCR lines that match nothing in the GT at all
 */
const fs = require('fs');
const path = require('path');

const BUILD = 'E:/Trade/journals/_build';
const GT_DIR = path.join(BUILD, 'ocr', 'gt');

const files = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!files.length) {
  console.error('usage: node ocr-score.js <results.jsonl> [...]');
  process.exit(1);
}

const norm = (t) => String(t || '').toLowerCase().replace(/\s+/g, ' ').trim();
const words = (t) => norm(t).split(' ').filter(Boolean);

function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = new Array(n + 1);
  let cur = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    cur[0] = i;
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    const t = prev; prev = cur; cur = t;
  }
  return prev[n];
}
const similarity = (a, b) => {
  if (!a && !b) return 1;
  const d = lev(a, b);
  return 1 - d / Math.max(a.length, b.length);
};

function loadResults(f) {
  const m = new Map();
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    let o;
    try { o = JSON.parse(line); } catch { continue; }
    if (o.hash && !o.error) m.set(o.hash, (o.lines || []).map((l) => l.text));
  }
  return m;
}

const gtFiles = fs.readdirSync(GT_DIR).filter((f) => f.endsWith('.json'));
const gts = gtFiles.map((f) => {
  const g = JSON.parse(fs.readFileSync(path.join(GT_DIR, f), 'utf8'));
  return {
    hash: g.hash,
    kind: g.kind,
    prose: (g.prose || []).map(norm),
    known: [...(g.prose || []), ...(g.labels || []), ...(g.chrome || [])].map(norm),
  };
});

const pct = (n) => (100 * n).toFixed(1) + '%';

for (const file of files) {
  const res = loadResults(file);
  let recall = 0, recallTotal = 0, exact = 0, matched = 0, proseTotal = 0, cerSum = 0, cerN = 0, spurious = 0, ocrLines = 0, present = 0;
  const perImage = [];

  for (const gt of gts) {
    const lines = res.get(gt.hash);
    if (!lines) continue;
    present++;
    const ocr = lines.map(norm).filter(Boolean);
    ocrLines += ocr.length;
    proseTotal += gt.prose.length;

    // word recall over the GT prose, as a multiset
    const pool = ocr.join(' ').split(' ').filter(Boolean).reduce((acc, w) => (acc.set(w, (acc.get(w) || 0) + 1), acc), new Map());
    let hit = 0;
    for (const line of gt.prose) {
      for (const w of words(line)) {
        recallTotal++;
        if ((pool.get(w) || 0) > 0) { pool.set(w, pool.get(w) - 1); hit++; }
      }
    }
    recall += hit;

    // best line per GT prose line
    let imgCer = 0, imgExact = 0, imgMatched = 0;
    for (const line of gt.prose) {
      let best = '', bestSim = -1;
      for (const o of ocr) {
        const s = similarity(line, o);
        if (s > bestSim) { bestSim = s; best = o; }
      }
      if (best === line) { exact++; imgExact++; }
      if (bestSim >= 0.9) { matched++; imgMatched++; }
      imgCer += 1 - Math.max(bestSim, 0);
      cerSum += 1 - Math.max(bestSim, 0);
      cerN++;
    }

    // spurious: OCR lines that match nothing the GT knows about. Axis numbers
    // and other chart furniture are excluded: they are noise by design, and the
    // GT describes those groups rather than transcribing every digit.
    const isFurniture = (t) => /^[\d\s.,:%+\-/()$°'"]+$/.test(t) || t.length < 3;
    let imgSpurious = 0;
    for (const o of ocr) {
      if (isFurniture(o)) continue;
      const known = gt.known.some((k) => similarity(k, o) >= 0.75);
      if (!known) { spurious++; imgSpurious++; }
    }

    perImage.push({
      hash: gt.hash.slice(0, 10),
      kind: gt.kind,
      gtLines: gt.prose.length,
      ocrLines: ocr.length,
      lineRecall: pct(imgMatched / gt.prose.length),
      cer: (imgCer / gt.prose.length).toFixed(3),
      spurious: imgSpurious,
    });
  }

  const meanCer = cerN ? cerSum / cerN : NaN;
  console.log(`\n### ${path.basename(file)}  (${present}/${gts.length} GT images present)`);
  console.log(`  prose word recall : ${pct(recall / Math.max(recallTotal, 1))}`);
  console.log(`  GT prose lines    : ${pct(exact / Math.max(proseTotal, 1))} exact, ${pct(matched / Math.max(proseTotal, 1))} at >=90% similarity`);
  console.log(`  mean line CER     : ${meanCer.toFixed(3)}`);
  console.log(`  spurious OCR lines: ${spurious} (text lines that match no GT entry)`);
  for (const p of perImage) {
    console.log(`    ${p.hash}  gt=${p.gtLines} ocr=${p.ocrLines}  matched=${p.lineRecall}  cer=${p.cer}  junk=${p.spurious}  ${p.kind}`);
  }
}
