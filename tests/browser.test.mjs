// Live browser tests. Skipped unless the Northwind fixture is running: (cd fixtures/northwind && npx next dev -p 3100)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { runJourneys, crawl } from '../plugins/experience-architecture/scripts/lib/browser.mjs';
import { analyzeLog } from '../plugins/experience-architecture/scripts/lib/transitions.mjs';

const BASE = 'http://localhost:3100';
const up = await fetch(BASE + '/login').then((r) => r.ok).catch(() => false);
const opts = { skip: up ? false : 'Northwind fixture not running on :3100' };

test('journeys reproduce the drawer, filter and draft defects live', opts, async () => {
  const spec = JSON.parse(fs.readFileSync('tests/journeys/northwind.json', 'utf8'));
  spec.journeys = spec.journeys.filter((j) => ['drawer-back', 'orders-filter-back', 'draft-switch'].includes(j.id));
  const a = analyzeLog(await runJourneys(spec));
  for (const t of ['back-left-overlay', 'restoration-divergence', 'state-leak-between-entities']) assert.ok(a.anomalies.some((x) => x.type === t), t);
});

test('crawl finds the dead sidebar link and the active-state conflict', opts, async () => {
  const r = await crawl(BASE + '/overview', { max: 20, cookies: [{ name: 'session', value: 'demo' }] });
  assert.ok(r.findings.some((f) => f.type === 'dead-page' && f.url === '/insights'));
  assert.ok(r.findings.some((f) => f.type === 'active-state-mismatch' && f.shape === '/orders/:id'));
  assert.ok(!r.pages.some((p) => /logout|delete/.test(p.requested)));
});

test('a failed action fails the journey instead of passing quietly', opts, async () => {
  const spec = { baseUrl: BASE, cookies: [{ name: 'session', value: 'demo' }], journeys: [
    { id: 'broken', steps: [{ goto: '/orders' }, { click: "role=button[name='no such button']" }, { back: true }, { expect: { path: '/orders' } }] },
  ] };
  const log = await runJourneys(spec);
  const a = analyzeLog(log);
  assert.equal(a.failedRuns.length, 1);
  assert.ok(a.expectations.some((e) => e.kind === 'action' && e.pass === false));
  assert.ok(log.runs[0].steps.filter((s) => s.skipped).length >= 2, 'later steps are skipped, not run against the wrong page');
});

test('cold open, new tab and log redaction', opts, async () => {
  const spec = { baseUrl: BASE, cookies: [{ name: 'session', value: 'demo' }], journeys: [
    { id: 'share', steps: [{ goto: '/orders/1003' }, { coldOpen: true, as: 'signed-out' }, { coldOpen: true, as: 'same' }] },
    { id: 'newtab', steps: [{ goto: '/customers' }, { openInNewTab: 'text=Globex' }, { goto: '/orders' }, { openInNewTab: "role=link[name='Order 1001']" }] },
  ] };
  const log = await runJourneys(spec);
  const a = analyzeLog(log);
  const types = a.anomalies.map((x) => `${x.journey}:${x.type}`);
  assert.ok(types.includes('share:deep-link-loss'), 'a signed-out recipient loses the destination (planted)');
  assert.ok(!types.some((t) => t === 'share:cold-open-differs'), 'the same account sees the same order');
  assert.ok(types.some((t) => /newtab:(not-a-link|new-tab-hijacked)/.test(t)), 'clickable table rows cannot open in a new tab');
  assert.ok(!a.anomalies.some((x) => x.journey === 'newtab' && x.step === 3), 'a real order link opens in a new tab');
  assert.equal(a.failedRuns.length, 0);
  // nothing in the written log keeps page text, and typed text is fingerprinted
  const { redactLog } = await import('../plugins/experience-architecture/scripts/lib/browser.mjs');
  assert.ok(!JSON.stringify(redactLog(log)).includes('"mainText"'));
});
