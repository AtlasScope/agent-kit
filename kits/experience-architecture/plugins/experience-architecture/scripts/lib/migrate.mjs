// URL migration planning: coverage of every current page, redirect config, code references to update,
// and regression journeys that prove old URLs still land correctly.
import { normalizeTarget } from './routes.mjs';

const params = (p) => (p.match(/:[\w]+|\*\w*/g) || []).map((x) => x.replace(/^[:*]/, ''));
const reOf = (p) => new RegExp('^' + p.split('?')[0].replace(/:[\w]+/g, '[^/]+').replace(/\*\w*\??$/, '.*') + '$');
const sampleOf = (p) => p.replace(/:[\w]+/g, '1').replace(/\/\*\w*\??$/, '/x');

export function planMigration(model, mapping) {
  const pages = model.routes.filter((r) => r.kind === 'page');
  const moves = mapping.moves || [];
  const retire = mapping.retire || [];
  const keep = new Set(mapping.keep || []);
  const problems = [];
  const rows = [];
  for (const r of pages) {
    const mv = moves.find((m) => m.from === r.path || reOf(m.from).test(sampleOf(r.path)));
    const rt = retire.find((m) => m.path === r.path);
    if (mv) rows.push({ path: r.path, action: 'move', to: mv.to, file: r.file, reason: mv.reason });
    else if (rt) rows.push({ path: r.path, action: rt.to ? 'retire→redirect' : 'retire→410', to: rt.to || null, file: r.file, reason: rt.reason });
    else if (keep.has(r.path) || mapping.keepRest) rows.push({ path: r.path, action: 'keep', to: r.path, file: r.file });
    else { rows.push({ path: r.path, action: 'UNMAPPED', file: r.file }); problems.push({ type: 'unmapped', path: r.path, detail: 'No decision for this current page. Add it to moves, retire or keep.' }); }
  }
  for (const m of [...moves, ...retire.filter((x) => x.to).map((x) => ({ from: x.path, to: x.to }))]) {
    const lost = params(m.from).filter((p) => !m.to.includes(':' + p) && !m.to.includes('*' + p));
    if (lost.length) problems.push({ type: 'param-dropped', path: m.from, detail: `${m.to} does not carry ${lost.map((x) => ':' + x).join(', ')}; every old deep link collapses to one page.` });
    const next = moves.find((x) => x !== m && reOf(x.from).test(sampleOf(m.to.split('?')[0])));
    if (next) problems.push({ type: 'chain', path: m.from, detail: `${m.from} → ${m.to} → ${next.to}. Point it straight at the final URL.` });
    if (mapping.targets && !mapping.targets.some((t) => reOf(t).test(sampleOf(m.to.split('?')[0])))) problems.push({ type: 'missing-target', path: m.from, detail: `${m.to} is not a route in the proposed structure.` });
    const linkedDead = (model.edges || []).some((e) => e.status === 'dead' && normalizeTarget(e.target || '')?.path === m.from);
    if (!linkedDead && !pages.some((r) => reOf(m.from).test(sampleOf(r.path)) || r.path === m.from) && !(model.redirects || []).some((x) => x.from === m.from)) problems.push({ type: 'unknown-source', path: m.from, detail: 'This old URL is not a current page; check the spelling or drop the rule.' });
  }
  // existing redirects that will now point at moved URLs
  for (const red of (model.redirects || []).filter((x) => x.from && x.kind === 'redirect')) {
    const mv = moves.find((m) => reOf(m.from).test(sampleOf((normalizeTarget(red.to)?.path) || '')));
    if (mv) problems.push({ type: 'stale-redirect', path: red.from, detail: `Existing redirect ${red.from} → ${red.to} (${red.file}:${red.line}) should now point at ${mv.to}.` });
  }
  // in-code references that should be updated rather than left to redirects
  const codeUpdates = [];
  for (const e of model.edges || []) {
    if (!e.targetRoute) continue;
    const mv = moves.find((m) => m.from === e.targetRoute) || retire.find((m) => m.path === e.targetRoute);
    if (mv) codeUpdates.push({ file: e.file, line: e.line, current: e.target, now: mv.to || '(remove link)', kind: e.kind, via: e.via });
  }
  // framework config
  const fw = (model.project?.frameworks || []).join(' ');
  const redirectsList = [...moves.map((m) => ({ source: m.from, destination: m.to, permanent: m.permanent ?? mapping.permanent ?? true })), ...retire.filter((x) => x.to).map((x) => ({ source: x.path, destination: x.to, permanent: true }))];
  const nextRedirects = /next@/.test(fw) ? `// Add to next.config: async redirects() { return [...existing, ...movedUrls] }\n// Ship as permanent:false (307) first; switch to true (308) once verified, because browsers cache 308s.\nexport const movedUrls = ${JSON.stringify(redirectsList, null, 2)};\n` : null;
  const rrRedirects = /react-router/.test(fw) ? redirectsList.map((r) => `{ path: '${r.source}', element: <Navigate to="${r.destination}" replace /> }${params(r.source).length ? '  // params: use a small component with useParams() to build the target' : ''}`).join('\n') : null;
  // regression journeys
  const start = (pages.find((r) => r.path === '/') || pages.find((r) => !r.params.length))?.path || '/';
  const journeys = redirectsList.map((r, i) => ({
    id: `moved-${i + 1}`, intent: `Old URL ${r.source} lands on ${r.destination}, and Back does not bounce`,
    steps: [{ goto: start }, { goto: sampleOf(r.source) }, { expect: { url: `/^${escapeRe(sampleOf(r.destination).split('?')[0])}(\\?|$)/` } }, { back: true }, { expect: { path: start } }],
  }));
  return {
    coverage: { total: pages.length, mapped: rows.filter((r) => r.action !== 'UNMAPPED').length },
    rows, problems, codeUpdates, redirects: redirectsList, nextRedirects, rrRedirects,
    regressionSpec: { baseUrl: mapping.baseUrl || 'http://localhost:3000', viewports: ['desktop'], journeys },
  };
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'); }

export function migrationMarkdown(plan) {
  const L = ['# URL migration plan', '', `${plan.coverage.mapped} of ${plan.coverage.total} current pages have a decision. ${plan.problems.length} problem(s). ${plan.codeUpdates.length} in-code reference(s) to update.`, ''];
  if (plan.problems.length) { L.push('## Problems to resolve first', ''); for (const p of plan.problems) L.push(`- **${p.type}** \`${p.path}\`: ${p.detail}`); L.push(''); }
  L.push('## Every current page', '', '| Current | Decision | New | Why |', '|---|---|---|---|');
  for (const r of plan.rows) L.push(`| \`${r.path}\` | ${r.action} | ${r.to ? '`' + r.to + '`' : ''} | ${r.reason || ''} |`);
  if (plan.codeUpdates.length) { L.push('', '## Links in code to update (do not rely on redirects internally)', ''); for (const c of plan.codeUpdates) L.push(`- ${c.file}:${c.line} \`${c.current}\` → \`${c.now}\`${c.via ? ` (defined at ${c.via})` : ''}`); }
  if (plan.nextRedirects) L.push('', '## Next.js redirects', '', '```js', plan.nextRedirects, '```');
  if (plan.rrRedirects) L.push('', '## React Router redirects', '', '```jsx', plan.rrRedirects, '```');
  L.push('', '## Regression journeys', '', `\`regression-journeys.json\` has ${plan.regressionSpec.journeys.length} journey(s): each old URL must land on its new home and Back must return to where the user was, not bounce through the redirect. Run with \`ea journey regression-journeys.json --base <url> --ci\`.`);
  return L.join('\n');
}
