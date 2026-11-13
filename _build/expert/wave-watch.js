/*
 * Wave watcher for the translation pipeline.
 *
 * Registered as a Stop hook with asyncRewake. The main agent launches a wave of
 * translation subagents and ends its turn; this process stays in the background,
 * polls the batch files named in WAVE.json, and when every page is present and
 * the validator rejects nothing it exits 2. Qoder turns stderr into a system
 * reminder and wakes the model, so publishing does not wait for the user to ask.
 *
 *   node _build/expert/wave-watch.js      (hook entry; reads hook JSON on stdin)
 *
 * Guard rails: stop_hook_active, a heartbeat lock so one watcher at a time,
 * status != "running", and a hard timeout.
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = 'E:/Trade/journals';
const EXPERT = path.join(ROOT, '_build', 'expert');
const STATE = process.env.WAVE_STATE || path.join(EXPERT, 'WAVE.json');
const HEART = path.join(EXPERT, '.wave-watch.heartbeat');
const LOG = path.join(EXPERT, 'WAVE-LOG.md');

const readJson = (file, fallback) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
};
const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 1), 'utf8');
const log = line => fs.appendFileSync(LOG, `${new Date().toISOString()} ${line}\n`, 'utf8');
const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

let hookInput = {};
try {
  if (!process.stdin.isTTY) hookInput = readJson(0, {}); // fd 0 = piped hook JSON
} catch { /* no stdin */ }
if (hookInput && hookInput.stop_hook_active) process.exit(0);

const state = readJson(STATE, null);
if (!state || state.status !== 'running' || !Array.isArray(state.expect) || !state.expect.length) process.exit(0);

// One watcher at a time: a fresh heartbeat means another one is already waiting.
try {
  const age = Date.now() - fs.statSync(HEART).mtimeMs;
  if (age < 90_000) process.exit(0);
} catch { /* no heartbeat yet */ }
fs.writeFileSync(HEART, String(process.pid), 'utf8');

const workFileFor = name => path.join(EXPERT, 'work', name);
const batchFileFor = name => path.join(EXPERT, 'batches', name);

function complete() {
  const missing = [];
  const short = [];
  for (const name of state.expect) {
    const work = readJson(workFileFor(name), null);
    const batch = readJson(batchFileFor(name), null);
    if (!batch) { missing.push(name); continue; }
    const need = new Set((work || []).map(w => w.hash));
    for (const hash of need) if (!(hash in batch)) { short.push(name); break; }
  }
  return { done: !missing.length && !short.length, missing, short };
}

function validate() {
  // Gate the wave on its own pages only: unrelated partial batches from other
  // waves must not block this one. The full-corpus gate is run at publish time.
  const pages = state.expect.map(n => n.replace(/\.json$/i, ''));
  const res = cp.spawnSync(process.execPath,
    [path.join(EXPERT, 'workflow.js'), '--validate', '--page', ...pages], {
    cwd: ROOT, encoding: 'utf8', timeout: 120000,
  });
  const out = `${res.stdout || ''}\n${res.stderr || ''}`;
  const m = out.match(/accepted\s+(\d+)\s*\|\s*rejected\s+(\d+)/i);
  const rejected = m ? Number(m[2]) : -1;
  const lines = out.split(/\r?\n/).filter(l => l.startsWith('  ')).slice(0, 8);
  return { rejected, lines };
}

const started = Date.now();
const LIMIT = 3.5 * 60 * 60 * 1000;
let lastDone = -1;
let lastChange = Date.now();

while (Date.now() - started < LIMIT) {
  fs.writeFileSync(HEART, String(process.pid), 'utf8');
  const check = complete();
  const doneCount = state.expect.length - check.missing.length - check.short.length;
  if (doneCount !== lastDone) { lastDone = doneCount; lastChange = Date.now(); }
  if (check.done) {
    const verdict = validate();
    state.status = verdict.rejected === 0 ? 'ready' : 'blocked';
    state.checkedAt = new Date().toISOString();
    state.rejected = verdict.rejected;
    writeJson(STATE, state);
    try { fs.unlinkSync(HEART); } catch { /* gone */ }

    if (verdict.rejected === 0) {
      log(`${state.name}: ready (all ${state.expect.length} batches complete, validator clean)`);
      process.stderr.write(
        `WAVE READY — ${state.name}: all ${state.expect.length} batch files are complete and ` +
        `the validator rejects nothing. Publish now without waiting for the user:\n` +
        `  node _build/expert/workflow.js --validate\n` +
        `  node _build/bake-translations.js && node _build/build-site.js\n` +
        `  node _build/expert/qa-translations.js\n` +
        `Then update _build/expert/STATUS.md and PLAN-5-STAGES.md (mark ${state.name} done) ` +
        `and launch the next wave: ${state.next || 'see PLAN-5-STAGES.md'}. Set WAVE.json to the next wave (status running, new expect) before stopping.`,
      );
      process.exit(2);
    }

    log(`${state.name}: blocked, validator rejected ${verdict.rejected}`);
    process.stderr.write(
      `WAVE BLOCKED — ${state.name}: every batch file exists but the validator rejected ` +
      `${verdict.rejected} entries (${verdict.lines.join(' ; ') || 'see output'}). ` +
      `Fix those entries, re-run node _build/expert/workflow.js --validate, then bake, build and QA. ` +
      `Next wave after this: ${state.next || 'see PLAN-5-STAGES.md'}.`,
    );
    process.exit(2);
  }
  if (Date.now() - lastChange > 20 * 60 * 1000) {
    const missing = [...check.missing, ...check.short];
    state.status = 'stalled';
    state.missing = missing;
    writeJson(STATE, state);
    try { fs.unlinkSync(HEART); } catch { /* gone */ }
    log(`${state.name}: stalled at ${doneCount}/${state.expect.length}; missing ${missing.join(', ')}`);
    process.stderr.write(
      `WAVE STALLED — ${state.name}: ${doneCount}/${state.expect.length} batches present but there ` +
      `has been no progress for 20 minutes. Missing: ${missing.slice(0, 12).join(', ')}` +
      `${missing.length > 12 ? ' …' : ''}. Relaunch exactly those page ranges, then publish. ` +
      `Next wave after this: ${state.next || 'see PLAN-5-STAGES.md'}.`,
    );
    process.exit(2);
  }
  sleep(20_000);
}

log(`${state.name}: watcher timed out; still missing ${state.expect.length} checks`);
try { fs.unlinkSync(HEART); } catch { /* gone */ }
process.exit(0);
