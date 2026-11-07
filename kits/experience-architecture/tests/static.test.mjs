// Static analysis against the synthetic fixtures. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildModel } from '../plugins/experience-architecture/scripts/lib/model.mjs';

const nw = buildModel('fixtures/northwind');
const fw = buildModel('fixtures/fernway');
const kinds = (m) => m.signals.map((s) => s.kind);
const has = (m, kind, re) => m.signals.some((s) => (s.kind === kind || (kind === 'orphan' && s.kind === 'orphan-candidate')) && (!re || re.test(s.title + ' ' + s.detail + ' ' + JSON.stringify(s.evidence))));

test('Next.js App Router discovery: groups, dynamic segments, layouts and templates', () => {
  const paths = nw.routes.filter((r) => r.kind === 'page').map((r) => r.path);
  for (const p of ['/', '/overview', '/customers', '/customers/:id', '/customers/:id/notes', '/orders/:id', '/settings/team', '/login']) assert.ok(paths.includes(p), p);
  assert.ok(!paths.some((p) => p.includes('(app)')), 'route groups add no segment');
  const detail = nw.routes.find((r) => r.path === '/customers/:id');
  assert.deepEqual(detail.layouts, ['app/layout.jsx', 'app/(app)/layout.jsx', 'app/(app)/customers/layout.jsx']);
  assert.deepEqual(detail.templates, ['app/(app)/template.jsx']);
  assert.equal(nw.redirects.filter((r) => r.kind === 'redirect').length, 2);
  assert.equal(nw.guards.length, 1);
});

test('React Router discovery: index routes, prefixes, layouts, Navigate redirects, nested <Routes> mounts', () => {
  const page = (p) => fw.routes.find((r) => r.path === p && r.kind === 'page');
  assert.equal(page('/').file, 'src/pages/Dashboard.tsx');
  assert.equal(page('/tickets/:ticketId').file, 'src/pages/TicketDetail.tsx');
  assert.ok(page('/settings/team'), 'relative <Route path="team"> mounted under settings/*');
  assert.ok(fw.routes.some((r) => r.path === '/customers' && r.kind === 'prefix'));
  assert.ok(fw.redirects.some((r) => r.from === '/home' && r.to === '/dashboard'));
  assert.ok(fw.redirects.some((r) => r.from === '/settings' && r.to === '/settings/profile'), 'relative Navigate resolves from the route');
  assert.ok(fw.chrome.some((c) => c.file === 'src/components/Sidebar.tsx' && c.targets.length >= 5), 'nav config array attributed to Sidebar');
  assert.ok(fw.edges.some((e) => e.via?.includes('ticketUrl') && e.targetRoute === '/tickets/:ticketId'), 'URL helper resolved');
});

test('Northwind planted defects surface as signals', () => {
  const expected = [
    ['orphan', /customers\/archive/], ['near-duplicate', /analytics/], ['near-duplicate', /admin\/users/], ['near-duplicate', /account\/billing/],
    ['fragmented-entity', /customer-activity/], ['tab-and-page', /notes/],
    ['dead-link', /insights/], ['dead-link', /settings/], ['redirect-chain', /dashboard/], ['deep-link-loss', /login/], ['entity-two-urls', /selected/],
    ['duplicate-nav'], ['active-state-mismatch'], ['active-state-exact', /Sidebar/], ['mobile-nav-missing'], ['raw-breadcrumbs'],
    ['template-state'], ['state-above-entity', /NoteDraft/], ['view-state-not-in-url', /orders/], ['view-state-push', /tab/], ['overlay-replace', /selected/], ['in-app-back-push', /orders/],
  ];
  const missing = expected.filter(([k, re]) => !has(nw, k, re)).map(([k, re]) => `${k} ${re || ''}`);
  assert.deepEqual(missing, []);
});

test('Northwind has no spurious helper or redirect-chain signals', () => {
  assert.ok(!kinds(nw).includes('unencoded-query'), 'components are not URL helpers');
  assert.equal(nw.signals.filter((s) => s.kind === 'redirect-chain').length, 1);
});

test('Fernway (written blind) defects that are statically visible surface as signals', () => {
  const expected = [
    ['orphan', /archive/], ['related-views', /inbox.*tickets|tickets.*inbox/], ['dead-link', /reports\/weekly/], ['catch-all-redirect'], ['redirect-chain', /home/],
    ['state-two-forms', /status/], ['unencoded-query', /ticketsUrl/], ['duplicate-nav'], ['active-state-mismatch'], ['mobile-nav-subset'],
    ['overlay-not-in-url', /AppLayout/], ['global-entity-state', /draft/], ['nested-component', /Panels/], ['no-scroll-restoration'], ['view-state-not-in-url', /sort/],
  ];
  const missing = expected.filter(([k, re]) => !has(fw, k, re)).map(([k, re]) => `${k} ${re || ''}`);
  assert.deepEqual(missing, []);
  assert.ok(!fw.signals.some((s) => s.kind === 'redirect-chain' && /settings/.test(s.title)), 'catch-all does not fake a chain');
});
