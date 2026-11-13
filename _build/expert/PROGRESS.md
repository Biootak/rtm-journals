# Translation overhaul — progress ledger

Status date: 2026-11-11
Owner: archive build (offline, no publishing in this pass)

This file is the single source of truth for what is finished, what is queued and
what must never be redone. The machine ledger is `PROGRESS.json`
(per-page hashes, counts and status); the detailed defect list is
`quality-report.md`; the source comparison is `source-verification.json`.

## 1. What is finished and verified

| item | result |
|---|---|
| English ligature damage | **905 control bytes repaired** across 430 posts (`U+0083 ff`, `U+0084 ffi`, `U+0085 ffl`, `U+0086 fi`, `U+0087 fl`), translations re-keyed by post id — 0 lost |
| Persian normalisation | digits → Latin, Arabic ي/ك → Persian, welded Latin suffixes, doubled punctuation, 187 damaged URLs restored from the English anchor |
| Mechanical gate | `workflow.js --validate` → **accepted 34346 / rejected 0** |
| Hand rewrites (this pass) | **412 posts / 20 pages**: `capnp-p2` (23), `warren-p7` (25), `in2forex-p5` (25), `doctorpatient-p16` (25), `doctorpatient-p17` (25), `doctorpatient-p18` (25), `ftrretest-p5` (25), `scotty-p3` (24), `mm-p12` (24), `diamond-p6` (23), `scotty-p5` (25), `doctorpatient-p14` (25), `scotty-p4` (25), `in2forex-p8` (25), `pucci-p2` (25), `paz-p8` (24), `classroom-p40` (25), `fulljournal-p6` (25), `hgblacksheep-p4` (24), `warren-p4` (24), plus two single-post fixes |
| Pages complete after rewrite | `warren-p7`, `capnp-p2`, `doctorpatient-p16`, `doctorpatient-p17`, `doctorpatient-p18`, `ftrretest-p5`, `scotty-p3`, `mm-p12`, `diamond-p6`, `scotty-p5`, `doctorpatient-p14`, `scotty-p4`, `in2forex-p8`, `pucci-p2`, `paz-p8`, `classroom-p40`, `fulljournal-p6`, `hgblacksheep-p4`, `warren-p4` — all clean |
| Audit false-positive fix | ticker/URL/attachment-only posts now stay Latin and are no longer counted as untranslated, per the project rule |
| Quote-head repair | root bug fixed in `translation-policy.js`: a kept Persian head (`وارن نوشت:`) was no longer duplicated with the English chain; `warren_p3_71` now bakes correctly |
| Site build | bake keeps **33,977 / 33,977** post bodies (**0 rejected**), build has **33,903 translatedPosts**; `qa-translations.js` mechanical checks all **0** (only 5 source-duplicate blocks) |

The rewrites are real translations, not cleanup: one Persian paragraph per
English paragraph, numbers and structural acronyms Latin, handles untouched.

## 2. What the deep audit says now

`node _build/expert/audit-quality.js`

- posts with Persian: **34,346**
- clean (severity 0): **32,146**
- still below the professional bar: **2,200** in **800 pages**

| issue | posts |
|---|---|
| english-left (ordinary English inside Persian) | 1,398 |
| no-verb | 1,122 |
| untranslated (English body) | 499 |
| fragment | 163 |
| calque | 53 |
| broken-word | 0 |

Overlaps exist: one post can carry several issues. These counts are the honest
backlog, not a cosmetic score.

## 3. Source verification (partial)

`node _build/expert/verify-source.js` compares each post's opening and closing
10-word shingle with the local capture (HTML text / PDF text layer, no OCR).
The full run is blocked by damaged PDF xref tables and the 295 s command cap, so
it is run in journal groups and cached in `source-cache/`.

Verified so far (warren, in2forex, capnp):

- 600 posts checked, **491 verified**
- 46 tail misses, 63 head misses — these are *flags*, not yet confirmed
  truncations; each must be read against its page before any repair
- no journal in this group is marked fully verified yet

No source text is invented: a repair is allowed only when the local capture
contains the missing words.

## 4. Exact queue (worst first)

| page | needs / total |
|---|---|
| pucci-p3 | 17 / 25 |
| pucci-p5 | 16 / 25 |
| robbie-p9 | 16 / 23 |
| capnp-p1 | 15 / 25 |
| doctorpatient-p11 | 15 / 25 |
| doctorpatient-p15 | 15 / 25 |
| paz-p6 | 15 / 25 |

The full list is in `PROGRESS.json` (`pages[].needs`); 800 pages are non-zero.

## 5. No-rework rules

1. A translation key is `sha1(normalised English)`. **Do not edit English text
   without re-keying** — use `fix-source.js`, which re-keys work files, batches
   and the store by post id.
2. A page is `done` only when `PROGRESS.json` says `needs: 0` and a reviewer
   records it. The audit never marks its own work.
3. `quality-report.md` findings are the review queue; do not re-audit a page
   that is already `done` unless its source text changed.
4. Source repairs are allowed only from the local capture. Truncation flags from
   `verify-source.js` must be confirmed against the page before editing.
5. After any page batch: `workflow.js --validate --page …` → `bake-translations.js`
   → `build-site.js` → `qa-translations.js` → bump `site/sw.js` VERSION.

## 6. Known limits of this pass

- **2,200 posts remain** below the bar; this is not a finished corpus.
- Full source verification across all 89 threads is **not complete**; only three
  journals were checked and even those have unread edge flags.
- The site was rebuilt locally; nothing was published or uploaded.
- The audit cannot judge literary quality; it only catches residue, omission,
  fragmentation and missing verbs. A human read of every rewritten page is still
  required.
