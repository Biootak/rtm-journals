const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const text = 'The price is 1.301753.';
const hash = crypto.createHash('sha1').update(text).digest('hex');
const translation = 'قیمت 1.301753 است.';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rtm-workflow-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const build = path.join(root, '_build');
  const work = path.join(build, 'expert', 'work');
  const batches = path.join(build, 'expert', 'batches');
  fs.mkdirSync(work, { recursive: true });
  fs.mkdirSync(batches, { recursive: true });
  for (const name of ['translation-policy.js', 'lexicon.js']) {
    fs.writeFileSync(path.join(build, name),
      `module.exports = require(${JSON.stringify(path.join(__dirname, '..', name))});\n`);
  }
  const source = { journals: [{ id: 'fixture', posts: [{ id: 'fixture_p1_1', pageNum: 1, text }] }] };
  const rows = [{ id: 'fixture_p1_1', hash, text, author: '' }];
  const write = (file, data) => fs.writeFileSync(file, JSON.stringify(data));
  write(path.join(build, 'parsed.json'), source);
  write(path.join(work, 'fixture-p1.json'), rows);
  write(path.join(batches, 'fixture-p1.json'), { [hash]: translation });
  return {
    source, rows, work, batches,
    saveSource: () => write(path.join(build, 'parsed.json'), source),
    saveWork: () => write(path.join(work, 'fixture-p1.json'), rows),
    saveBatch: data => write(path.join(batches, 'fixture-p1.json'), data),
    run: (args = ['--page', 'fixture-p1']) => spawnSync(process.execPath,
      [path.join(__dirname, 'workflow.js'), '--validate', ...args],
      { env: { ...process.env, JOURNALS_ROOT: root }, encoding: 'utf8' }),
  };
}

function rejected(result, reason) {
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stdout, reason);
}

test('accepts a complete batch matching the current source', t => {
  const result = fixture(t).run();
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /accepted 1 \| rejected 0/);
});

test('rejects a requested batch that does not exist', t => {
  rejected(fixture(t).run(['--page', 'fixture-p2']), /no batch file/);
});

test('rejects empty explicit selection', t => {
  rejected(fixture(t).run(['--page']), /no pages specified/);
});

test('rejects traversal in a requested page', t => {
  rejected(fixture(t).run(['--page', '../fixture-p1']), /invalid page name/);
});

test('rejects work made before a source-text change', t => {
  const f = fixture(t);
  f.source.journals[0].posts[0].text += ' It then fell.';
  f.saveSource();
  rejected(f.run(), /stale source hash/);
});

test('rejects edited work text even if its hash was not updated', t => {
  const f = fixture(t);
  f.rows[0].text = 'A different sentence.';
  f.saveWork();
  rejected(f.run(), /stale source hash/);
});

test('rejects posts omitted from work, including duplicate source text', t => {
  const f = fixture(t);
  f.source.journals[0].posts.push({ id: 'fixture_p1_2', pageNum: 1, text });
  f.saveSource();
  rejected(f.run(), /fixture_p1_2 \| missing work post/);
});

test('rejects work posts from the wrong source page', t => {
  const f = fixture(t);
  f.rows.push({ id: 'fixture_p2_1', hash, text });
  f.saveWork();
  rejected(f.run(), /post not on source page/);
});

test('rejects duplicate work identifiers', t => {
  const f = fixture(t);
  f.rows.push({ ...f.rows[0] });
  f.saveWork();
  rejected(f.run(), /duplicate work post/);
});

test('accepts repeated text in distinct source posts', t => {
  const f = fixture(t);
  f.source.journals[0].posts.push({ id: 'fixture_p1_2', pageNum: 1, text });
  f.rows.push({ id: 'fixture_p1_2', hash, text });
  f.saveSource();
  f.saveWork();
  const result = f.run();
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /accepted 2 \| rejected 0/);
});

test('does not mistake later option values for requested pages', t => {
  const result = fixture(t).run(['--page', 'fixture-p1', '--journal', 'fixture']);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('still rejects missing numeric values', t => {
  const f = fixture(t);
  f.saveBatch({ [hash]: 'قیمت در این سطح است.' });
  rejected(f.run(), /numbers missing 1\.301753/);
});

test('still rejects missing translations', t => {
  const f = fixture(t);
  f.saveBatch({});
  rejected(f.run(), /fixture_p1_1 \| missing/);
});

test('rejects a global validation with no batches', t => {
  const f = fixture(t);
  fs.unlinkSync(path.join(f.batches, 'fixture-p1.json'));
  rejected(f.run([]), /no batch files/);
});
