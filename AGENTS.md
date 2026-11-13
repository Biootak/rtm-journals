# Project rules

E:\Trade\journals is a **local, offline** archive build. Everything below is a
constraint for any change in this workspace.

## 1. Network

- Import, extraction, translation and QA run **offline** from the material
  already on disk (`RTM Journals/`, `_build/rtm-resources/extracted/`, PDF
  prints, existing captures). Do not call the forum, Wayback or attachment URLs
  to "fill gaps": they are gone (410) and would burn bandwidth for nothing.
- Publishing is a separate, explicit action. Never push, deploy or upload
  without the owner's request.

## 2. Source of truth

- `_build/parsed.json` is the corpus; `_build/rtm-resources/units.json` lists
  the threads that came from the RTM Journals drop.
- Thread ids are the site ids (`site/data/journals/<id>.json`). A thread has
  `kind: journal | topic`; both share the reader, cards and data contract.
- A parsed post carries `author`, `date` and `rank`. The rank is the forum
  title printed in the author card (`Master Trader`, `Trader`, …); the date is
  the forum timestamp beside `#N`. A print that never contained one of them
  leaves the field empty — never infer or fabricate it. The site renders the
  rank as a Persian label with the English title in the tooltip.
- The public repo is `release-build/` (only `site/` without images and thumbs,
  the fetch script and the Pages workflow).

## 3. Print-to-PDF import (the "text under the header" problem)

The RTM prints are browser print-outs. The site's fixed header is painted over
the top ~50 pt of **every printed page**, so the first lines look missing. They
are not clipped: they are still in the PDF text layer. `_build/import-drswing.py`
recovers them by reading spans by coordinate, never by what is visually on top.
The rules that make that source usable:

1. **Read the text layer, not the rendering.** A span at `y < 80` under the nav
   band is content; keep it. OCR is not needed and is not allowed for prose.
2. **Drop white spans.** Every line is printed twice; the copy with colour
   `0xFFFFFF` is a shadow.
3. **The author card is a zone.** Everything between the 16 pt username and the
   `Posts:` / `Thank you received:` counters is card (presence, rank, custom
   title, repeated signature). Never let it into a post. Presence is 8.9 pt
   (`Away`, `Online`, `Offline`), so a 9.2 pt ceiling is card, not body. A
   profile signature can also print at 12 pt above the body when the card is
   split across a page break; cut that one by its repeated wording, not by
   font size.
4. **Signature block.** It starts at the steel-blue rule (`#5388B4`, 56..557 pt)
   or at a dotted rule, and its text is 10 pt while body text is 12 pt. Cut at
   the first 10 pt line that follows real body content. A new `#N` marker ends
   the block.
5. **Paragraphs across pages.** At a page break, start a new paragraph only when
   the previous line ended a sentence or stopped short of the right margin
   (`x1 < 470`); otherwise the sentence continues.
6. **Markers.** `#N` at 11 pt bold, `x > 480`, is the post break. Post ids are
   `<thread>_p<page>_<N>` and `mid` keeps N.
7. **Plates.** Embedded images are copied byte-for-byte, hashed with SHA-1 and
   deduplicated per print page (`xref` is document-local). Avatars/badges
   (≤ 160 px) and the chrome strips are not plates.

Validate any parser change against a known thread (`If`: 139 pages, ~3 455
posts) and check that the hidden line
`This will be my small corner where I'll share my thoughts…` (Jurij page 3)
survives with its paragraph break.

## 4. Translation

- Hand translation only. No translation APIs, no machine caches, no OCR output
  in the shipped layer.
- Work files: `_build/expert/work/<thread>-p<N>.json`; batches:
  `_build/expert/batches/<thread>-p<N>.json` (`{hash: Persian}`). One Persian
  paragraph per English paragraph, numbers and `X wrote:` heads preserved.
- Gate: `workflow.js --validate` must end `rejected 0`; then
  `bake-translations.js`, `build-site.js`, `qa-translations.js`.
- Text that is only a ticker, a URL or an attachment line stays Latin; a post
  with no prose is not a translation defect.

## 5. Language of the repository

- GitHub-facing files (README, workflow descriptions, commit messages, docs in
  `release-build/`) are **English**.
- Persian belongs to the archive content and the site UI only.

## 6. Performance budget

- Home stays under ~250 KB and ~250 ms locally; page chunks stay under ~60 KB
  gzipped; lists use the 760 px WebP thumbs and full plates load on demand.
- Bump `site/sw.js` `VERSION` whenever shipped data changes.
