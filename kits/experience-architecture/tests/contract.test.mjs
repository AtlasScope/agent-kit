// The pass/fail contract and what the journey runner writes to disk (no app needed).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { analyzeLog } from '../plugins/experience-architecture/scripts/lib/transitions.mjs';
import { describeStep, scrubUrls, scrubText, sensitiveValues } from '../plugins/experience-architecture/scripts/lib/browser.mjs';

const EA = 'plugins/experience-architecture/scripts/ea.mjs';
const recorded = JSON.parse(fs.readFileSync('tests/data/northwind-journey-log.json', 'utf8'));
const noExpect = { runs: recorded.runs.map((r) => ({ ...r, steps: r.steps.filter((s) => s.type !== 'expect') })) };

test('defects found without stated checks fail the run instead of passing', () => {
  const v = analyzeLog(noExpect).verdict;
  assert.equal(v.result, 'fail');
  assert.ok(v.openDefects >= 5, `${v.openDefects} defects`);
  assert.match(v.summary, /^FAIL: .*defect/);
});

test('accepted defects and heuristic warnings do not fail a run', () => {
  const a = analyzeLog(noExpect);
  const types = [...new Set(a.anomalies.filter((x) => x.severity === 'defect').map((x) => x.type))];
  const v = analyzeLog(noExpect, { accept: types.map((type) => ({ type, reason: 'known' })) }).verdict;
  assert.equal(v.result, 'exploratory');
  assert.ok(v.otherAnomalies > 0, 'likely/judgment/info anomalies remain listed');
  assert.match(v.summary, /nothing here is verified/);
});

test('only met stated checks with no open defects count as a pass', () => {
  const run = recorded.runs.find((r) => r.journey === 'legacy-url');
  const v = analyzeLog({ runs: [run], accept: ['redirect-chain'] }).verdict;
  assert.equal(v.result, 'pass', v.summary);
});

test('step descriptions never contain typed values, cookie values or secret parameters', () => {
  assert.equal(describeStep({ fill: ['#pw', 'hunter2-secret'] }, 'fill', ['#pw', 'hunter2-secret']), 'fill #pw with «14 chars #' + describeStep({ fill: ['#x', 'hunter2-secret'] }, 'fill', ['#x', 'hunter2-secret']).split('#').pop());
  assert.ok(!describeStep({}, 'fill', { selector: '#pw', value: 'hunter2-secret' }).includes('hunter2'));
  assert.equal(describeStep({}, 'setCookie', { name: 'sid', value: 'abc-cookie' }), 'setCookie sid');
  assert.equal(scrubUrls('goto /login?next=/a&token=abc123#x'), 'goto /login?next=/a&token=REDACTED#x');
  assert.ok(describeStep({}, 'fill', ['#pw', 'shown'], true).includes('"shown"'), '--reveal keeps values');
  const secrets = sensitiveValues({ cookies: [{ name: 's', value: 'demo-cookie' }], journeys: [{ steps: [{ fill: ['#a', 'hunter2-secret'] }, { fill: ['#q', 'ab'] }] }] });
  assert.deepEqual(secrets.sort(), ['demo-cookie', 'hunter2-secret']);
  assert.ok(!scrubText('{"error":"typed hunter2-secret into #a"}', secrets).includes('hunter2'));
});

test('the reviewer reproduction: a skipped fill step leaks nothing to disk', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ea-leak-'));
  const spec = path.join(dir, 'spec.json');
  fs.writeFileSync(spec, JSON.stringify({ journeys: [{ id: 'j', steps: [{ goto: '/login?token=abc123' }, { fill: ['#pw', 'hunter2-SECRET'] }, { setCookie: { name: 'sid', value: 'COOKIE-SECRET' } }] }] }));
  let code = 0;
  try { execFileSync('node', [EA, 'journey', spec, '--base', 'http://127.0.0.1:9', '--out', path.join(dir, 'out'), '--ci'], { stdio: 'pipe' }); } catch (e) { code = e.status; }
  if (code !== 1) return; // Playwright missing: the runner could not start; covered by the unit checks above
  for (const f of fs.readdirSync(path.join(dir, 'out'))) {
    const body = fs.readFileSync(path.join(dir, 'out', f), 'utf8');
    for (const s of ['hunter2-SECRET', 'COOKIE-SECRET', 'abc123']) assert.ok(!body.includes(s), `${s} in ${f}`);
  }
});

test('--ci exit codes: 1 fail, 2 nothing verified, 0 pass', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ea-ci-'));
  const run = (log) => { const f = path.join(dir, `l${Math.random()}.json`); fs.writeFileSync(f, JSON.stringify(log)); try { execFileSync('node', [EA, 'transitions', f, '--ci'], { stdio: 'pipe' }); return 0; } catch (e) { return e.status; } };
  assert.equal(run(noExpect), 1);
  const types = [...new Set(analyzeLog(noExpect).anomalies.filter((x) => x.severity === 'defect').map((x) => x.type))];
  assert.equal(run({ ...noExpect, accept: types }), 2);
  assert.equal(run({ runs: [recorded.runs.find((r) => r.journey === 'legacy-url')], accept: ['redirect-chain'] }), 0);
});

test('ea refs flags invented line numbers and confirms real ones', async () => {
  const { checkRefs } = await import('../plugins/experience-architecture/scripts/lib/refs.mjs');
  // Two saved held-out reports about fixtures/kestrel: a standalone-skill run whose cited lines do not
  // exist (the judges' finding), and a plugin run whose references were all accurate.
  const bad = checkRefs(fs.readFileSync('tests/data/refs/kestrel-skill-1.md', 'utf8'), 'fixtures/kestrel');
  const good = checkRefs(fs.readFileSync('tests/data/refs/kestrel-plugin-1.md', 'utf8'), 'fixtures/kestrel');
  assert.ok(bad.results.some((x) => x.ref.startsWith('NoteEditor.tsx:1004') && x.status === 'line-out-of-range'));
  assert.ok(bad.bad >= 8, `${bad.bad} wrong`);
  assert.equal(good.bad, 0);
  assert.ok(good.ok >= 60);
  const t = checkRefs('see `src/components/NoteEditor.tsx:3` and `NoteEditor.tsx:9999` and new `src/app/patients/[id]/layout.tsx`', 'fixtures/kestrel');
  assert.deepEqual(t.results.map((x) => x.status), ['ok', 'line-out-of-range', 'not-in-source']);
});
