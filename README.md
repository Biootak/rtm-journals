# RTM Journal Archive

A static, bilingual (English original + Persian translation) archive of the
ReadTheMarket member journals and education threads, with a chart annotation
board.

## Why the images are not in Git

The full charts are about 1.2 GB and are deliberately kept out of Git. The
bundles live in this repository's **Releases** as `assets-v1`:

- `assets-v1.tar.gz` — the original archive (6,796 images plus thumbnails).
- `assets-delta-v2.tar.gz` — the plates added with the first later journals
  (small enough to sit in this repository).
- `assets-delta-v3.tar.gz` — only the charts of the journals added since
  (Kruger, MM, Frosty's Igloo, DrSwing, Mertch): 273 MB of new files and not a
  byte of what is already published.
- `assets-delta-v4a.tar.gz` and `assets-delta-v4b.tar.gz` — the same idea for the
  `RTM Journals` drop (59 journals and 30 education topics), 2.3 GB of plates
  and thumbnails split in two because a release asset is capped at 2 GB.

`scripts/fetch-assets.mjs` checks each bundle's SHA-256, downloads the missing
ones and extracts them into `site/assets`. Image quality is untouched:
compressing the charts below about 100 MB made their text unreadable.

The repository therefore contains the code, the generated data (posts, search
index, per-journal chunks) and the local fonts — everything except the images.

## Run locally

Requirements: Node.js 18+ and `tar` (present on Windows 10 and later).

```bash
git clone https://github.com/Biootak/rtm-journals.git
cd rtm-journals
node scripts/fetch-assets.mjs     # once; downloads and extracts the bundles into site/assets
npx serve site
```

Then open the printed address (usually `http://localhost:3000`).

- The downloader keeps its archive in `.assets-cache/`; a second run does not
  download again.
- `--force` re-downloads and re-extracts.
- The script pins the bundle's SHA-256 and verifies it.

## Deploy to Cloudflare Pages (recommended)

After fetching the assets:

```bash
npx wrangler pages deploy site --project-name rtm-journals
```

Cloudflare Pages limits: 25 MiB per file and 20,000 files. This archive is
around 18,000 files with a largest file well under the cap, so it fits.

## Deploy to GitHub Pages

1. Settings → Pages → Build and deployment: choose **GitHub Actions**.
2. `.github/workflows/pages.yml` fetches the image bundle, builds `site/` and
   publishes it.
3. URL: `https://<username>.github.io/<repo>/`

> GitHub Pages caps a published site at 1 GB and this archive is close to that
> limit, so Cloudflare Pages is the safer target.

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
    images/       full plates (from Releases, via fetch-assets)
    thumbs/       760px WebP thumbs (from Releases, via fetch-assets)
scripts/
  fetch-assets.mjs
```
