# RTM Journal Archive

A static, bilingual (English original + Persian translation) archive of the
ReadTheMarket member journals and education threads, with a chart annotation
board.

## Why the images are not in Git

The full charts are about 2.3 GB and are deliberately kept out of Git. Every
full-size plate was re-encoded to WebP (quality 85 — chart text stays
readable), so the whole archive now ships as four parts in this repository's
**Releases** (`assets-v1` tag):

- `assets-v6-part1.tar.gz` … `assets-v6-part4.tar.gz` — about 2.3 GB in total,
  ~65,000 files: all full-size plates, thumbnails, GIFs and the few corrupt
  originals that cannot be re-encoded. This single set replaces the old
  `assets-v1`/`v3`/`v4` chain; a fresh checkout needs nothing else. The parts
  are uploaded as 64 MB chunks (`…part1.tar.gz.000` …), so a dropped
  connection only costs one chunk.

`scripts/fetch-assets.mjs` downloads the chunks with HTTP Range resume,
concatenates them, verifies each part's pinned SHA-256 and extracts the parts
into `site/assets`. Rerun the same command after a drop and it continues from
the partial chunk. The older bundles remain in the Releases for anyone still
on an old checkout.

The repository therefore contains the code, the generated data (posts, search
index, per-journal chunks) and the local fonts — everything except the images.

## Deployed images

The public site is <https://biootak.github.io/rtm-journals/>. GitHub Pages caps
a deployment artifact at 1 GB, so the workflow publishes only the code and
generated data (~120 MB). Plates and thumbnails are streamed by the
FinancialMarket media proxy from the private object bucket that already backs
that app — the bucket stays private and nothing is copied into the Pages
artifact:

- full plate: `https://financialmarket.page/uploads/general/rtm-img-<file>`
- thumbnail: `https://financialmarket.page/uploads/general/rtm-thumb-<file>`

`window.RTM_ASSETS_BASE` in the deployed `index.html` points at
`https://financialmarket.page/uploads/general`. `assetUrl()` flattens the
`assets/images|thumbs` path to one filename and adds the type prefix, because
the proxy accepts a single flat name under `general`. A local build leaves the
variable empty and reads `site/assets/…` from disk.

The Release bundles below remain the offline mirror for local checkouts; the
Pages deploy no longer downloads them.

## Run locally

Requirements: Node.js 18+ and `tar` (present on Windows 10 and later).

```bash
git clone https://github.com/Biootak/rtm-journals.git
cd rtm-journals
node scripts/fetch-assets.mjs     # once; downloads and extracts the parts into site/assets
npx serve site
```

Then open the printed address (usually `http://localhost:3000`).

- The downloader keeps its chunks in `.assets-cache/`; a second run resumes a
  partial chunk and skips a part that is already unpacked.
- `--force` re-downloads and re-extracts.
- The script pins every part's SHA-256 and verifies it.

### Without Git (plain folder)

1. Download the repository ZIP (Code → Download ZIP) and unpack it.
2. From the Releases page, download the 37 chunks of the four
   `assets-v6-part*.tar.gz` parts (names end in `.000`, `.001`, …).
3. Join each part's chunks in name order, then unpack the four parts into the
   `site/` folder, so you get `site/assets/images/…` and
   `site/assets/thumbs/…`. With PowerShell:

   ```powershell
   Get-ChildItem "assets-v6-part1.tar.gz.*" | Sort-Object Name |
     ForEach-Object { $_.FullName } |
     ForEach-Object -Begin { $o = [IO.File]::Create("$PWD\assets-v6-part1.tar.gz") } `
       -Process { $i = [IO.File]::OpenRead($_); $i.CopyTo($o); $i.Close() } `
       -End { $o.Close() }
   ```

   Repeat the same block for parts 2–4, changing `part1` to `part2`, `part3`
   and `part4`. Running `node scripts/fetch-assets.mjs` from the ZIP is simpler
   and does this automatically.
4. Serve the `site/` folder with any static file server, for example:

   ```bash
   npx serve site
   # or, with Python:
   python -m http.server -d site 8000
   ```

   Then open `http://localhost:3000` (or `:8000`). Opening `index.html`
   directly from disk does **not** work — the archive loads its JSON data with
   `fetch`, which browsers block on `file://`.

- The service worker caches the data; opened images stay in the browser HTTP
  cache (deployed images are cross-origin and served with a short edge cache).

### راهنمای سریع فارسی

1. ریپازیتوری را دانلود کنید (Code → Download ZIP) و از حالت فشرده خارج کنید.
2. از صفحهٔ Releases، ۳۷ تکهٔ چهار قسمت `assets-v6-part*.tar.gz` را دانلود
   کنید (نام‌ها به `.000`، `.001`، … ختم می‌شوند).
3. تکه‌های هر قسمت را به ترتیب نام به هم بچسبانید و چهار قسمت را داخل پوشهٔ
   `site/` باز کنید تا `site/assets/images` و `site/assets/thumbs` پر شود.
   ساده‌ترین راه: از ZIP ریپو `node scripts/fetch-assets.mjs` را اجرا کنید؛
   تکه‌های نیمه‌کاره را هم ادامه می‌دهد.
4. با هر سرور استاتیک پوشهٔ `site/` را اجرا کنید:

   ```bash
   npx serve site
   # یا با پایتون:
   python -m http.server -d site 8000
   ```

   بعد `http://localhost:3000` را باز کنید. باز کردن مستقیم `index.html`
   کار نمی‌کند چون داده‌ها با fetch خوانده می‌شوند.

## Deployment

GitHub Pages is the supported host: `main` builds `site/` and publishes the
120 MB data/code artifact; images come from the media proxy described above.
The same `site/` folder also runs on any static host that can front the image
base.

For an offline copy, fetch the Release bundles and serve `site/` locally as
described above.

## Notes

- Chart annotations are stored in the visitor's own browser (IndexedDB). Nothing
  is uploaded.
- Backup and copy-next-to-the-plate are handled by the UI itself.
- Routing is hash-based, so the site works on any static host without rewrite
  rules.
- The journal content belongs to its original authors; this archive is
  read-only and non-commercial.

## Layout

```
site/
  index.html
  css/            styles
  js/             app.js, annotate.js, vendor/perfect-freehand.js
  data/           index, posts, search, per-journal chunks, integrity
  assets/
    fonts/        local fonts
    images/       full plates (not in Git; local mirror or media proxy)
    thumbs/       760px WebP thumbs (not in Git; local mirror or media proxy)
scripts/
  fetch-assets.mjs
```
