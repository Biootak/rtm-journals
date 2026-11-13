# Stage 4 — Wave Validation Report

**Run date:** 2026-11-07 11:16 (local)
**Validator:** `node _build/expert/workflow.js --validate`
**Wave file:** `_build/expert/WAVE.json` (name `stage4`, stage 4)

## 1. File arrival status

| Metric | Value |
|---|---|
| Files expected in wave | 87 |
| Files present in `batches/` | 87 |
| Files missing | 0 |
| Total batch files on disk (all stages) | 330 |

### Watch timeline (this session)

- 11:13–11:15 — 85/87 present; `vitaldrug-p6.json`, `vitaldrug-p7.json` absent.
- 11:14:51 — `vitaldrug-p7.json` arrived → single-page validation: **accepted 25 | rejected 0**.
- 11:15:54 — `vitaldrug-p6.json` arrived.
- 11:16:xx — full validation run.
- 11:16:03 — `omidfx-p5.json` rewritten by its translator (see §3).

The two late files were the only rows previously listed as `missing` for this wave
(`jurij-p13`, `jurij-p14`, `omidfx-p4…p10`, `vitaldrug-p4`, `vitaldrug-p5`, `vitaldrug-p8`
had all already landed between 09:11 and 10:26).

## 2. Final validation result

```
accepted 7890 | rejected 0
exit code 0
```

All 87 files of the current wave pass: hash sets match the work files, no extra or
missing hashes, paragraph counts match the source, Persian digits/policy audit clean,
no numeric loss (price / R-multiple tokens), and quote-head counts match.

## 3. Transient failure (already resolved by the translator)

First full run reported exactly one rejection:

```
accepted 7889 | rejected 1
  omidfx_p5_22 | echo
```

- **File:** `batches/omidfx-p5.json`
- **Post id:** `omidfx_p5_22` (author `omidfxt`)
- **Hash:** `ba1b0eff…c686fae1`
- **Defect:** `echo` — `lexicon.audit()` flags a repeated phrase in Persian output under
  400 chars (`fa.length` was 389 at the time), i.e. a duplicated fragment in the translation.
- **Resolution:** the translator rewrote the same file at **11:16:03**; the current
  content has `fa.length` 389, 8/8 paragraphs and a clean audit. Re-validation of
  `--page omidfx-p5` gives **accepted 25 | rejected 0**, and the full run is clean.

No translation file was modified by me — the fix came from the translator agent, as
instructed, to avoid conflicting writes.

## 4. Notes / follow-ups

- `WAVE.json` is **stale**: `status: "stalled"`, `startedAt: 12:09:53Z`, and its
  `missing` array still lists 14 files. Actual state is 87/87 complete with a clean
  validation, so the wave can be closed and advanced via `next-wave.js`
  (next: Stage 5 — rinehart, michal238, linos, benhur, mukhcin, edges, aran, mel,
  einrikr, fxeyes, andrew, moneydeep). I did not edit `WAVE.json` because it is owned
  by `next-wave.js`/the orchestrator.
- Stage-5 keys already present on disk (`andrew-p*`, `aran-p*`, `benhur-p*` appear in
  the batch folder) should be re-checked when the wave is advanced, since the validator
  scans every `.json` in `batches/` and accepted 7890 posts across all stages.
