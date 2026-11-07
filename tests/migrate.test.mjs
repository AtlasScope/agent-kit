import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildModel } from '../plugins/experience-architecture/scripts/lib/model.mjs';
import { planMigration } from '../plugins/experience-architecture/scripts/lib/migrate.mjs';
import { prototypeHtml, flattenProposal } from '../plugins/experience-architecture/scripts/lib/prototype.mjs';

const model = buildModel('fixtures/northwind');
const mapping = JSON.parse(fs.readFileSync('tests/proposals/northwind-a-mapping.json', 'utf8'));

test('migration plan covers every page and finds in-code links to update', () => {
  const plan = planMigration(model, mapping);
  assert.equal(plan.coverage.mapped, plan.coverage.total);
  assert.deepEqual(plan.problems, []);
  assert.ok(plan.codeUpdates.some((c) => c.current === '/analytics'));
  assert.match(plan.nextRedirects, /"source": "\/customers\/:id\/notes"/);
  assert.equal(plan.regressionSpec.journeys.length, mapping.moves.length + 1);
});

test('migration problems are reported', () => {
  const bad = planMigration(model, { moves: [{ from: '/orders/:id', to: '/orders' }, { from: '/reports', to: '/analytics' }, { from: '/analytics', to: '/insights-new' }], keep: [] });
  const types = new Set(bad.problems.map((p) => p.type));
  for (const t of ['unmapped', 'param-dropped', 'chain']) assert.ok(types.has(t), t);
});

test('prototype embeds every proposal and escapes script breakouts', () => {
  const a = JSON.parse(fs.readFileSync('tests/proposals/northwind-a.json', 'utf8'));
  const evil = { ...a, name: '</script><script>alert(1)</script>' };
  const html = prototypeHtml([a, evil]);
  assert.ok(!html.includes('</script><script>alert(1)'));
  assert.ok(flattenProposal(a).some((n) => n.status === 'merge' && n.path === '/reports'));
});
