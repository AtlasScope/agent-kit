// Mermaid / DOT / Markdown renderers for models, proposals and transition maps.
const esc = (s) => String(s).replace(/"/g, '#quot;');
const nid = (s) => 'n_' + String(s).replace(/[^a-zA-Z0-9]/g, '_');

// Site map from a list of {path, label?, note?, status?} — status: keep|merge|move|new|retire|orphan|dead
export function sitemapMermaid(items, { title } = {}) {
  const lines = ['flowchart LR'];
  if (title) lines.unshift(`%% ${title}`);
  const known = new Set(items.map((i) => i.path));
  const all = new Map();
  for (const it of items) {
    const segs = it.path.split('/').filter(Boolean);
    for (let i = 0; i <= segs.length; i++) {
      const p = '/' + segs.slice(0, i).join('/');
      if (!all.has(p)) all.set(p, known.has(p) ? null : { path: p, ghost: true });
    }
    all.set(it.path, it);
  }
  for (const [p, it] of all) {
    const label = it?.ghost ? `${p}<br/><i>no page</i>` : `${it.label ? esc(it.label) + '<br/>' : ''}<small>${esc(p)}</small>${it.note ? `<br/><i>${esc(it.note)}</i>` : ''}`;
    lines.push(`  ${nid(p)}["${label}"]`);
    if (p !== '/') lines.push(`  ${nid(p.replace(/\/[^/]+$/, '') || '/')} --> ${nid(p)}`);
  }
  const cls = { orphan: 'fill:#fde68a', dead: 'fill:#fecaca', ghost: 'fill:#f3f4f6,stroke-dasharray:4', merge: 'fill:#ddd6fe', retire: 'fill:#fecaca', new: 'fill:#bbf7d0', move: 'fill:#bfdbfe' };
  for (const [k, v] of Object.entries(cls)) lines.push(`  classDef ${k} ${v}`);
  for (const [p, it] of all) {
    const c = it?.ghost ? 'ghost' : it?.status;
    if (c && cls[c]) lines.push(`  class ${nid(p)} ${c}`);
  }
  return lines.join('\n');
}

export function navGraphMermaid(model, { maxEdges = 160 } = {}) {
  const lines = ['flowchart LR'];
  const nodes = new Map();
  const node = (id, label, shape = 'box') => { if (!nodes.has(id)) nodes.set(id, shape === 'chrome' ? `  ${nid(id)}[["${esc(label)}"]]` : shape === 'dead' ? `  ${nid(id)}(["${esc(label)} ✕"])` : `  ${nid(id)}["${esc(label)}"]`); };
  const seen = new Set();
  let n = 0;
  for (const e of model.edges) {
    if (!e.targetRoute && e.status !== 'dead') continue;
    const to = e.status === 'dead' ? `dead:${e.target}` : e.targetRoute;
    const key = `${e.from}->${to}`;
    if (seen.has(key)) continue; seen.add(key);
    if (n++ >= maxEdges) break;
    const fromLabel = e.from.startsWith('chrome:') ? e.from.slice(7).split('/').pop() : e.from;
    node(e.from, fromLabel, e.from.startsWith('chrome:') ? 'chrome' : 'box');
    node(to, e.status === 'dead' ? e.target : to, e.status === 'dead' ? 'dead' : 'box');
    const style = e.kind === 'replace' ? '-.->|replace|' : e.kind === 'push' ? '==>|push|' : e.kind === 'redirect' ? '-.->|redirect|' : '-->';
    lines.push(`  ${nid(e.from)} ${style} ${nid(to)}`);
  }
  for (const r of model.routes.filter((x) => x.kind === 'page' && x.inbound?.length === 0)) { node(r.path, r.path + ' (orphan)'); }
  lines.splice(1, 0, ...nodes.values());
  lines.push('  classDef chrome fill:#e0e7ff');
  for (const id of nodes.keys()) if (id.startsWith('chrome:')) lines.push(`  class ${nid(id)} chrome`);
  if (n > maxEdges) lines.push(`  %% truncated at ${maxEdges} edges; see model.json`);
  return lines.join('\n');
}

export function navGraphDot(model) {
  const out = ['digraph nav {', '  rankdir=LR; node [shape=box,fontsize=10];'];
  const seen = new Set();
  for (const e of model.edges) {
    const to = e.status === 'dead' ? `DEAD ${e.target}` : e.targetRoute;
    if (!to) continue;
    const k = e.from + to + e.kind; if (seen.has(k)) continue; seen.add(k);
    out.push(`  "${e.from}" -> "${to}" [label="${e.kind}"${e.status === 'dead' ? ',color=red' : ''}];`);
  }
  out.push('}');
  return out.join('\n');
}

export function summaryMarkdown(model) {
  const L = [];
  const pages = model.routes.filter((r) => r.kind === 'page');
  L.push(`# Experience map: ${model.project.name}`, '');
  L.push(`Frameworks: ${model.project.frameworks.join(', ') || 'unknown'} · State libraries: ${model.project.stateLibs.join(', ') || 'none detected'}`);
  L.push(`Files scanned: ${model.counts.files} · Pages: ${pages.length} · Navigation references: ${model.counts.edges} · Signals: ${model.counts.signals}`, '');
  L.push('Signals are candidates found by static analysis. Each needs confirming in code or in the running app before it is reported as a defect.', '');
  L.push('## Routes', '', '| Path | Kind | File | Inbound | Layouts |', '|---|---|---|---|---|');
  for (const r of model.routes) L.push(`| \`${r.path}\` | ${r.kind}${r.intercept ? ' (intercept)' : ''}${r.slot ? ' ' + r.slot : ''} | ${r.file}${r.line ? ':' + r.line : ''} | ${r.inbound ? r.inbound.length : ''} | ${(r.layouts || []).length + (r.templates || []).length} |`);
  if (model.redirects.length || model.guards.length) {
    L.push('', '## Redirects and guards', '');
    for (const r of model.redirects) L.push(`- ${r.kind}: \`${r.from ?? '(render)'}\` → \`${r.to}\`${r.permanent ? ' (permanent)' : ''} — ${r.file}:${r.line}`);
    for (const g of model.guards) L.push(`- guard ${g.kind} → \`${g.to}\`${g.preservesDestination ? '' : ' (drops destination)'} — ${g.file}:${g.line}`);
  }
  L.push('', '## Persistent chrome', '', '| Component | Routes covered | Destinations | Active state |', '|---|---|---|---|');
  for (const c of model.chrome) L.push(`| ${c.file} | ${c.scope} | ${c.targets.length} | ${c.activeStrategy || 'none'}${c.ariaCurrent ? ' + aria-current' : ''} |`);
  L.push('', '## Signals', '');
  for (const area of ['ia', 'routing', 'chrome', 'continuity']) {
    const s = model.signals.filter((x) => x.area === area);
    if (!s.length) continue;
    L.push(`### ${{ ia: 'Information architecture', routing: 'Routing', chrome: 'Chrome and navigation', continuity: 'Continuity and state' }[area]}`, '');
    for (const x of s) {
      L.push(`- **${x.id}** ${x.title}`);
      L.push(`  - ${x.detail}`);
      if (x.evidence?.length) L.push(`  - Evidence: ${x.evidence.slice(0, 6).map((e) => `${e.file}${e.line ? ':' + e.line : ''}${e.note ? ` (${e.note})` : ''}`).join(', ')}`);
      L.push(`  - Confirm: ${x.verify}`);
    }
    L.push('');
  }
  const dyn = model.edges.filter((e) => e.status === 'dynamic');
  if (dyn.length) L.push(`## Unresolved dynamic targets (${dyn.length})`, '', 'These navigation targets are computed at runtime; a crawl or journey run resolves them.', '', ...dyn.slice(0, 25).map((e) => `- ${e.file}:${e.line} \`${e.expr}\``), '');
  return L.join('\n');
}
