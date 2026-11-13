/*
 * Safety net for the translation waves.
 *
 * Stop + asyncRewake normally wakes the model when a wave finishes. If the
 * runtime drops that background process (restart, timeout), this
 * UserPromptSubmit hook notices the completed wave on the next prompt and
 * injects the same instruction as context, so no turn starts blind.
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'E:/Trade/journals';
const EXPERT = path.join(ROOT, '_build', 'expert');
const STATE = process.env.WAVE_STATE || path.join(EXPERT, 'WAVE.json');

const readJson = (file, fallback) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
};

const state = readJson(STATE, null);
if (!state || !Array.isArray(state.expect) || !state.expect.length) process.exit(0);

let done = true;
for (const name of state.expect) {
  const work = readJson(path.join(EXPERT, 'work', name), null);
  const batch = readJson(path.join(EXPERT, 'batches', name), null);
  if (!batch || !work) { done = false; break; }
  if (work.some(w => !(w.hash in batch))) { done = false; break; }
}

if (!done && state.status === 'running') process.exit(0);

const message = state.status === 'stalled'
  ? `WAVE STALLED — ${state.name}: ${state.missing ? state.missing.length : 'some'} batch files are still missing `
    + `(${(state.missing || []).slice(0, 8).join(', ')}). Relaunch those page ranges, then validate, bake, build and QA.`
  : state.status === 'blocked'
  ? `WAVE BLOCKED — ${state.name}: the validator rejected ${state.rejected || 'some'} entries. `
    + 'Fix them, then validate, bake, build and QA before launching the next wave.'
  : `WAVE READY — ${state.name}: every batch file is present. Publish now: `
    + 'node _build/expert/workflow.js --validate; node _build/bake-translations.js; '
    + 'node _build/build-site.js; node _build/expert/qa-translations.js; then update '
    + 'STATUS.md and PLAN-5-STAGES.md and launch the next wave: '
    + `${state.next || 'see PLAN-5-STAGES.md'}.`;

process.stdout.write(JSON.stringify({
  hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: message },
}));
process.exit(0);
