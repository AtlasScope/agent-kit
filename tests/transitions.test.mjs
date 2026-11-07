// History reconstruction and anomaly detection on a recorded Northwind journey log (no browser needed).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { analyzeLog, transitionMermaid } from '../plugins/experience-architecture/scripts/lib/transitions.mjs';

const log = JSON.parse(fs.readFileSync('tests/data/northwind-journey-log.json', 'utf8'));
const a = analyzeLog(log);
const found = (type, journey) => a.anomalies.some((x) => x.type === type && (!journey || x.journey === journey || x.seenIn?.some((s) => s.startsWith(journey + '#'))));

test('generic invariants catch the planted continuity defects without expectations', () => {
  for (const [type, journey] of [
    ['back-left-overlay', 'drawer-back'], ['overlay-without-history', 'drawer-back'], ['restoration-divergence', 'orders-filter-back'],
    ['in-app-back-loses-state', 'orders-in-app-back'], ['in-app-back-push', 'orders-in-app-back'], ['refresh-divergence', 'orders-refresh'],
    ['state-leak-between-entities', 'draft-switch'], ['deep-link-loss', 'deep-link-signed-out'], ['redirect-chain', 'legacy-url'],
    ['back-stayed-on-page', 'record-tabs'], ['view-state-push', 'record-tabs'], ['active-state-mismatch'], ['no-visible-nav', 'mobile-nav'],
  ]) assert.ok(found(type, journey), `${type} in ${journey || 'any'}`);
});

test('expectations evaluate against snapshots', () => {
  const failed = a.expectations.filter((e) => !e.pass).map((e) => e.journey).sort();
  assert.deepEqual(failed, ['banner-dismiss', 'deep-link-signed-out', 'draft-switch', 'drawer-back', 'mobile-nav', 'orders-filter-back', 'orders-in-app-back', 'record-tabs']);
  assert.ok(a.expectations.find((e) => e.journey === 'legacy-url').pass);
});

test('repeated anomalies collapse and the transition map renders', () => {
  assert.ok(a.anomalies.length < 25, `grouped to ${a.anomalies.length}`);
  const m = transitionMermaid(a);
  assert.match(m, /^stateDiagram-v2/);
  assert.match(m, /\+overlay/);
  assert.doesNotMatch(m, /blank/);
});

test('a hand-built log with no push counter still reconstructs Back', () => {
  const snap = (url, extra = {}) => ({ url, path: url.split('?')[0], search: url.includes('?') ? '?' + url.split('?')[1] : '', historyLength: extra.len, history: { push: extra.push || 0, replace: 0, pop: 0 }, doc: extra.doc || 'd1', dialogs: [], tabs: [], pressed: [], fields: [], regions: [], focus: { tag: 'a' }, scrollY: 0, ...extra });
  const hand = { runs: [{ journey: 'hand', steps: [
    { i: 0, type: 'goto', snapshot: snap('/a', { len: 2 }) },
    { i: 1, type: 'click', snapshot: snap('/b', { len: 3, push: 1 }) },
    { i: 2, type: 'back', snapshot: snap('/c', { len: 3, push: 1 }) },
  ] }] };
  const r = analyzeLog(hand);
  assert.ok(r.anomalies.some((x) => x.type === 'back-unexpected' && x.expected === '/a' && x.observed === '/c'));
});

test('hand-collected logs with a failed step report a failure', () => {
  const snap = (path) => ({ url: path, path, search: '', title: 't', h1: 'h', historyLength: 2, history: { push: 0, replace: 0, pop: 0 }, doc: '1', dialogs: [], tabs: [], pressed: [], fields: [], regions: [] });
  const a = analyzeLog({ runs: [{ journey: 'j', viewport: 'desktop', steps: [
    { i: 0, type: 'goto', desc: 'goto /a', snapshot: snap('/a') },
    { i: 1, type: 'click', desc: 'click Save', error: 'locator not found', snapshot: snap('/a') },
  ] }] });
  assert.ok(a.expectations.some((e) => e.pass === false && e.kind === 'action'));
});
