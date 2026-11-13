/* Minify the shipped JS/CSS into *.min.* siblings.
 *
 * Sources (js/app.js, js/annotate.js, css/style.css) stay canonical and
 * readable; index.html and the dynamic annotate loader point at the .min
 * files. Re-run after editing any source:
 *   node _build/minify-site.js
 */
'use strict';
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const SITE = path.join(__dirname, '..', 'site');

const JOBS = [
  { src: 'js/app.js', out: 'js/app.min.js' },
  { src: 'js/annotate.js', out: 'js/annotate.min.js' },
  { src: 'css/style.css', out: 'css/style.min.css', loader: 'css' },
];

(async () => {
  for (const job of JOBS) {
    const srcPath = path.join(SITE, job.src);
    const outPath = path.join(SITE, job.out);
    const result = await esbuild.build({
      entryPoints: [srcPath],
      outfile: outPath,
      minify: true,
      target: 'es2020',
      ...(job.loader ? {} : { format: 'iife' }),
      logLevel: 'warning',
    });
    const before = fs.statSync(srcPath).size;
    const after = fs.statSync(outPath).size;
    console.log(`${job.src} -> ${job.out}: ${before} -> ${after} bytes (${Math.round(after / before * 100)}%)`);
  }
})().catch(err => { console.error(err); process.exit(1); });
