// Static route discovery. Each route: { path, file, kind, source, params, layouts, templates, groups, slot, intercept }
import fs from 'node:fs';
import path from 'node:path';
import { read, rel, lineOf } from './files.mjs';

const PAGE_RE = /^page\.(tsx|ts|jsx|js|mdx)$/;
const ROUTE_RE = /^route\.(tsx|ts|jsx|js)$/;
const SPECIAL = ['layout', 'template', 'loading', 'error', 'not-found', 'default'];
const EXT_RE = /\.(tsx|ts|jsx|js|mdx)$/;

function findDir(root, names) {
  for (const n of names) {
    const d = path.join(root, n);
    try { if (fs.statSync(d).isDirectory()) return d; } catch { /* next */ }
  }
  return null;
}

function special(dir) {
  const out = {};
  let entries = [];
  try { entries = fs.readdirSync(dir); } catch { return out; }
  for (const f of entries) {
    const base = f.replace(EXT_RE, '');
    if (EXT_RE.test(f) && SPECIAL.includes(base)) out[base] = path.join(dir, f);
  }
  return out;
}

// ---------- Next.js App Router ----------
export function nextAppRoutes(root) {
  const appDir = findDir(root, ['app', 'src/app']);
  if (!appDir) return [];
  // App Router only if some page.* exists (Remix also uses app/)
  const routes = [];
  const visit = (dir, segs, ctx) => {
    const sp = special(dir);
    const layouts = sp.layout ? [...ctx.layouts, rel(root, sp.layout)] : ctx.layouts;
    const templates = sp.template ? [...ctx.templates, rel(root, sp.template)] : ctx.templates;
    const boundaries = { ...ctx.boundaries };
    for (const k of ['loading', 'error', 'not-found']) if (sp[k]) boundaries[k] = rel(root, sp[k]);
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.isFile() && (PAGE_RE.test(e.name) || ROUTE_RE.test(e.name))) {
        const p = '/' + segs.filter(Boolean).join('/');
        routes.push({
          path: p, file: rel(root, path.join(dir, e.name)), kind: PAGE_RE.test(e.name) ? 'page' : 'api', source: 'next-app',
          params: segs.filter((s) => s.startsWith(':') || s.startsWith('*')).map((s) => s.replace(/^[:*]|\?$/g, '')),
          layouts, templates, boundaries, groups: ctx.groups, slot: ctx.slot, intercept: ctx.intercept,
        });
      }
    }
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith('_') || e.name === 'node_modules') continue;
      const n = e.name;
      const next = { layouts, templates, boundaries, groups: ctx.groups, slot: ctx.slot, intercept: ctx.intercept };
      let seg;
      if (/^\(\.{1,3}\)|^\(\.\.\)\(\.\.\)/.test(n)) { next.intercept = n; seg = n.replace(/^(\(\.+\))+/, ''); }
      else if (/^\(.*\)$/.test(n)) { next.groups = [...ctx.groups, n]; seg = ''; }
      else if (n.startsWith('@')) { next.slot = n; seg = ''; }
      else seg = n;
      seg = seg
        .replace(/^\[\[\.\.\.(.+)\]\]$/, '*$1?')
        .replace(/^\[\.\.\.(.+)\]$/, '*$1')
        .replace(/^\[(.+)\]$/, ':$1');
      visit(path.join(dir, n), [...segs, seg], next);
    }
  };
  visit(appDir, [], { layouts: [], templates: [], boundaries: {}, groups: [], slot: null, intercept: null });
  return routes;
}

// ---------- Next.js Pages Router ----------
export function nextPagesRoutes(root) {
  const dir = findDir(root, ['pages', 'src/pages']);
  if (!dir) return [];
  const out = [];
  const app = ['_app', '_document', '_error'].map((b) => ['tsx', 'jsx', 'js', 'ts'].map((x) => path.join(dir, `${b}.${x}`))).flat().find((f) => fs.existsSync(f));
  const visit = (d, segs) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) { visit(path.join(d, e.name), [...segs, e.name]); continue; }
      if (!EXT_RE.test(e.name) || e.name.startsWith('_')) continue;
      const base = e.name.replace(EXT_RE, '');
      const parts = [...segs, base === 'index' ? '' : base].filter(Boolean).map((s) => s
        .replace(/^\[\[\.\.\.(.+)\]\]$/, '*$1?').replace(/^\[\.\.\.(.+)\]$/, '*$1').replace(/^\[(.+)\]$/, ':$1'));
      const p = '/' + parts.join('/');
      out.push({
        path: p, file: rel(root, path.join(d, e.name)), kind: segs[0] === 'api' ? 'api' : 'page', source: 'next-pages',
        params: parts.filter((s) => /^[:*]/.test(s)).map((s) => s.replace(/^[:*]|\?$/g, '')),
        layouts: app ? [rel(root, app)] : [], templates: [], boundaries: {}, groups: [], slot: null, intercept: null,
      });
    }
  };
  visit(dir, []);
  return out;
}

// ---------- Remix / React Router 7 flat routes (app/routes) ----------
export function flatRoutes(root) {
  const dir = findDir(root, ['app/routes', 'src/routes']);
  if (!dir || fs.existsSync(path.join(root, 'app', 'page.tsx')) || fs.existsSync(path.join(root, 'app', 'page.jsx'))) return [];
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    let name; let file;
    if (e.isDirectory()) {
      const r = ['route.tsx', 'route.jsx', 'route.ts', 'route.js', 'index.tsx', 'index.jsx'].map((f) => path.join(dir, e.name, f)).find((f) => fs.existsSync(f));
      if (!r) continue; name = e.name; file = r;
    } else if (EXT_RE.test(e.name)) { name = e.name.replace(EXT_RE, ''); file = path.join(dir, e.name); } else continue;
    const text = read(file);
    if (/createFileRoute\(/.test(text)) continue; // TanStack handled separately
    const parts = name.split(/\.(?![^[]*\])/);
    const segs = [];
    const layouts = [];
    for (const p of parts) {
      if (p === '_index' || p === 'index') continue;
      if (p.startsWith('_')) { layouts.push(p); continue; }
      let s = p.replace(/_$/, '').replace(/^\[(.*)\]$/, '$1');
      if (s === '$') s = '*';
      else if (/^\(\$(.+)\)$/.test(s)) s = ':' + s.match(/^\(\$(.+)\)$/)[1] + '?';
      else if (s.startsWith('$')) s = ':' + s.slice(1);
      segs.push(s);
    }
    const isApi = !/export\s+default/.test(text);
    out.push({
      path: '/' + segs.join('/'), file: rel(root, file), kind: isApi ? 'api' : 'page', source: 'flat-routes',
      params: segs.filter((s) => /^[:*]/.test(s)).map((s) => s.replace(/^[:*]|\?$/g, '') || 'splat'),
      layouts, templates: [], boundaries: {}, groups: [], slot: null, intercept: null,
    });
  }
  return out;
}

// ---------- TanStack Router file routes ----------
export function tanstackRoutes(root, files) {
  const out = [];
  for (const f of files) {
    const text = read(f);
    for (const m of text.matchAll(/createFileRoute\(\s*['"`]([^'"`]+)['"`]\s*\)/g)) {
      const raw = m[1];
      const segs = raw.split('/').filter((s) => s && !s.startsWith('_') && !/^\(.*\)$/.test(s)).map((s) => (s === '$' ? '*' : s.startsWith('$') ? ':' + s.slice(1) : s));
      out.push({
        path: '/' + segs.join('/'), file: rel(root, f), kind: 'page', source: 'tanstack',
        params: segs.filter((s) => /^[:*]/.test(s)).map((s) => s.slice(1) || 'splat'),
        layouts: raw.split('/').filter((s) => s.startsWith('_')), templates: [], boundaries: {}, groups: [], slot: null, intercept: null,
      });
    }
  }
  return out;
}

// ---------- React Router config objects and <Route> JSX ----------
// Minimal scanner: skips strings, template literals and comments; tracks object nesting.
function scanObjects(text) {
  const nodes = [];
  const stack = [];
  let i = 0;
  const n = text.length;
  const readString = (q) => { let s = ''; i++; while (i < n && text[i] !== q) { if (text[i] === '\\') i++; s += text[i++]; } i++; return s; };
  while (i < n) {
    const c = text[i];
    if (c === '/' && text[i + 1] === '/') { while (i < n && text[i] !== '\n') i++; continue; }
    if (c === '/' && text[i + 1] === '*') { i = text.indexOf('*/', i + 2); if (i < 0) break; i += 2; continue; }
    if (c === '"' || c === "'" || c === '`') { readString(c); continue; }
    if (c === '{') { const node = { start: i, props: {}, parent: stack[stack.length - 1] || null }; nodes.push(node); stack.push(node); i++; continue; }
    if (c === '}') { const node = stack.pop(); if (node) node.end = i; i++; continue; }
    if (/[A-Za-z_$]/.test(c) && stack.length) {
      let j = i; while (j < n && /[\w$]/.test(text[j])) j++;
      const key = text.slice(i, j);
      let k = j; while (k < n && /\s/.test(text[k])) k++;
      if (text[k] === ':' && text[k + 1] !== ':' && (/[{,\s]/.test(text[i - 1] || ''))) {
        const top = stack[stack.length - 1];
        let v = k + 1; while (v < n && /\s/.test(text[v])) v++;
        if (['path', 'index', 'element', 'Component', 'lazy', 'children', 'loader', 'label', 'title', 'icon', 'errorElement', 'redirect', 'to'].includes(key)) {
          if (text[v] === '"' || text[v] === "'" || text[v] === '`') { i = v; top.props[key] = readString(text[v]); top.props[key + 'At'] = v; continue; }
          const tag = text.slice(v).match(/^<\s*([A-Z][\w.]*)/);
          top.props[key] = tag ? tag[1] : text.slice(v, v + 40).split(/[,\n}]/)[0].trim();
          if (tag && key === 'element') { const raw = text.slice(v, text.indexOf('>', v) + 1); const to = raw.match(/\bto\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*['"`]([^'"`]*)['"`]\s*\})/); if (to) top.props.elementTo = to[1] ?? to[2] ?? to[3]; }
        }
        i = j; continue;
      }
      i = j; continue;
    }
    i++;
  }
  return nodes;
}

function joinPath(parent, child) {
  if (child == null) return parent || '/';
  if (child.startsWith('/')) return child.replace(/\/+$/, '') || '/';
  return ((parent || '').replace(/\/+$/, '') + '/' + child).replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

export function reactRouterRoutes(root, files) {
  const out = [];
  for (const f of files) {
    const text = read(f);
    const isConfig = /createBrowserRouter|createHashRouter|createMemoryRouter|useRoutes\(|RouteObject|createRoutesFromElements/.test(text);
    const hasJsx = /<Route[\s>]/.test(text);
    if (!isConfig && !hasJsx) continue;
    if (isConfig) {
      const nodes = scanObjects(text);
      const isRoute = (nd) => nd && ('path' in nd.props || nd.props.index === 'true') &&
        ('element' in nd.props || 'Component' in nd.props || 'lazy' in nd.props || 'children' in nd.props || 'loader' in nd.props || 'redirect' in nd.props) &&
        !('label' in nd.props && !('element' in nd.props));
      const routeAncestor = (nd) => { let p = nd.parent; while (p && !isRoute(p) && !('element' in (p.props || {}))) p = p.parent; return p; };
      const fullPath = (nd) => {
        const chain = []; let cur = nd;
        while (cur) { if (isRoute(cur) || 'element' in cur.props) chain.unshift(cur); cur = routeAncestor(cur); }
        return chain.reduce((acc, x) => (x.props.path != null ? joinPath(acc, x.props.path) : acc), '');
      };
      for (const nd of nodes.filter(isRoute)) {
        const p = fullPath(nd) || '/';
        const anc = []; { let c = routeAncestor(nd); while (c) { if (c.props.children != null && (c.props.element || c.props.Component)) anc.unshift(c.props.element || c.props.Component); c = routeAncestor(c); } }
        const hasChildren = nd.props.children != null;
        const el = nd.props.element || nd.props.Component || null;
        const kind = el === 'Navigate' ? 'redirect' : hasChildren && !el ? 'prefix' : hasChildren ? 'layout-route' : p.endsWith('/*') ? 'mount' : 'page';
        out.push({
          path: p, file: rel(root, f), line: lineOf(text, nd.start), kind, source: 'react-router-config', redirectTo: nd.props.elementTo, layoutElements: anc,
          element: el,
          params: (p.match(/:[\w]+|\*/g) || []).map((s) => s.replace(':', '') || 'splat'),
          layouts: [], templates: [], boundaries: nd.props.errorElement ? { error: nd.props.errorElement } : {}, groups: [], slot: null, intercept: null,
        });
      }
    }
    if (hasJsx) {
      const stack = [];
      const re = /<Route\b|<\/Route\s*>/g;
      let m;
      while ((m = re.exec(text))) {
        if (m[0].startsWith('</')) { stack.pop(); continue; }
        // read tag to closing '>' respecting braces/strings
        let i = m.index + 6; let depth = 0; let q = null;
        for (; i < text.length; i++) {
          const c = text[i];
          if (q) { if (c === q && text[i - 1] !== '\\') q = null; continue; }
          if (c === '"' || c === "'" || c === '`') { q = c; continue; }
          if (c === '{') depth++; else if (c === '}') depth--; else if (c === '>' && depth === 0) break;
        }
        const tag = text.slice(m.index, i + 1);
        const selfClosing = /\/\s*>$/.test(tag);
        const pm = tag.match(/\bpath\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*['"`]([^'"`]*)['"`]\s*\})/);
        const raw = pm ? (pm[1] ?? pm[2] ?? pm[3]) : null;
        const isIndex = /\bindex\b(?!\s*=\s*\{?\s*false)/.test(tag) && !pm;
        const el = tag.match(/element\s*=\s*\{\s*<\s*([A-Z][\w.]*)/) || tag.match(/Component\s*=\s*\{\s*([A-Z][\w.]*)/);
        const parent = stack.length ? stack[stack.length - 1].path : '';
        const full = raw != null ? joinPath(parent, raw) : parent || '/';
        if (raw != null || isIndex) {
          const navTo = el && el[1] === 'Navigate' ? (tag.match(/\bto\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*['"`]([^'"`]*)['"`]\s*\})/) || []).slice(1).find((x) => x != null) : null;
          out.push({
            path: full || '/', file: rel(root, f), line: lineOf(text, m.index), kind: navTo != null ? 'redirect' : selfClosing ? (full.endsWith('/*') ? 'mount' : 'page') : 'layout-route', source: 'react-router-jsx',
            redirectTo: navTo ?? undefined, relative: !stack.length && (raw == null || !raw.startsWith('/')), layoutElements: stack.map((x) => x.element).filter(Boolean),
            element: el ? el[1] : null, params: (full.match(/:[\w]+|\*/g) || []).map((s) => s.replace(':', '') || 'splat'),
            layouts: [], templates: [], boundaries: {}, groups: [], slot: null, intercept: null,
          });
        }
        if (!selfClosing) stack.push({ path: full, element: el ? el[1] : null });
        re.lastIndex = i + 1;
      }
    }
    // React Router 7 config (app/routes.ts)
    if (/@react-router\/dev\/routes/.test(text)) {
      for (const mm of text.matchAll(/\broute\(\s*['"]([^'"]*)['"]\s*,\s*['"]([^'"]+)['"]/g)) {
        out.push({ path: joinPath('', mm[1]), file: rel(root, f), line: lineOf(text, mm.index), kind: 'page', source: 'react-router-7-config', element: mm[2],
          params: (mm[1].match(/:[\w]+|\*/g) || []).map((s) => s.replace(':', '')), layouts: [], templates: [], boundaries: {}, groups: [], slot: null, intercept: null });
      }
    }
  }
  const seen = new Map();
  for (const r of out) { const k = r.path + '|' + r.kind + '|' + r.file; if (!seen.has(k)) seen.set(k, r); }
  return [...seen.values()];
}

// ---------- redirects & middleware ----------
export function redirectsAndGuards(root, files) {
  const redirects = [];
  const guards = [];
  for (const f of files) {
    const base = path.basename(f);
    const text = read(f);
    if (/^next\.config\./.test(base)) {
      const re = /source\s*:\s*['"`]([^'"`]+)['"`][\s\S]*?destination\s*:\s*['"`]([^'"`]+)['"`]([\s\S]*?)(?=source\s*:|$)/g;
      for (const m of text.matchAll(re)) {
        const permanent = /permanent\s*:\s*true/.test(m[3].split('}')[0]);
        const kind = text.slice(0, m.index).lastIndexOf('rewrites') > text.slice(0, m.index).lastIndexOf('redirects') ? 'rewrite' : 'redirect';
        redirects.push({ from: m[1], to: m[2], permanent, kind, file: rel(root, f), line: lineOf(text, m.index) });
      }
    }
    if (/^(middleware|proxy)\.[jt]s$/.test(base) || /redirect\(|<Navigate\b|NextResponse\.redirect/.test(text)) {
      const isMw = /^(middleware|proxy)\.[jt]s$/.test(base);
      for (const m of text.matchAll(/NextResponse\.(redirect|rewrite)\(\s*new URL\(\s*['"`]([^'"`]+)['"`]/g)) {
        const window = text.slice(Math.max(0, m.index - 600), m.index + 300);
        const preserves = /(searchParams\.set|callbackUrl|returnTo|redirectTo|[?&](next|from|redirect|returnUrl)=|pathname\s*\+|encodeURIComponent\(\s*(pathname|request\.url|req\.url))/.test(window);
        guards.push({ kind: m[1], to: m[2], file: rel(root, f), line: lineOf(text, m.index), middleware: isMw, preservesDestination: preserves });
      }
      if (!isMw) {
        for (const m of text.matchAll(/(?:throw\s+)?(?:redirect|navigate|router\.(?:push|replace))\(\s*['"`]([^'"`]*(?:login|sign-?in|signin|auth)[^'"`]*)['"`]|<Navigate\b[^>]*\bto\s*=\s*["'{`]+([^'"`}]*(?:login|sign-?in|signin|auth)[^'"`}]*)/gi)) {
          const before = text.slice(Math.max(0, m.index - 300), m.index);
          if (!/if\s*\(\s*!|\?\s*$|!\s*\w*(session|user|auth|token)|==\s*null|isAuthenticated\s*\)?\s*$/i.test(before)) continue;
          const window = text.slice(Math.max(0, m.index - 400), m.index + 300);
          const preserves = /(searchParams\.set|callbackUrl|returnTo|redirectTo|[?&](next|from|redirect|returnUrl)=|state\s*[:=]\s*\{\s*from|location\.pathname|encodeURIComponent)/.test(window);
          guards.push({ kind: 'redirect', to: m[1] || m[2], file: rel(root, f), line: lineOf(text, m.index), middleware: false, preservesDestination: preserves });
        }
        for (const m of text.matchAll(/(?:^|[^.\w])(redirect|permanentRedirect)\(\s*['"`]([^'"`]+)['"`]/g)) {
          redirects.push({ from: null, to: m[2], kind: 'render-redirect', permanent: m[1] === 'permanentRedirect', file: rel(root, f), line: lineOf(text, m.index) });
        }
        for (const m of text.matchAll(/<Navigate\b[^>]*\bto\s*=\s*['"{`]+([^'"`}]+)/g)) {
          redirects.push({ from: null, to: m[1], kind: 'navigate-element', permanent: false, replace: /\breplace\b/.test(m[0]), file: rel(root, f), line: lineOf(text, m.index) });
        }
      }
    }
  }
  return { redirects, guards };
}

export function discoverRoutes(root, files, frameworks = []) {
  const fw = frameworks.join(' ');
  const unknown = !fw;
  const isNext = /next@/.test(fw); const isRemix = /remix|react-router@[\^~]?7/.test(fw) && !isNext;
  const groups = [
    isNext || unknown ? nextAppRoutes(root) : [],
    isNext || unknown ? nextPagesRoutes(root) : [],
    isRemix || unknown ? flatRoutes(root) : [],
    tanstackRoutes(root, files),
    !isNext || /react-router/.test(fw) ? reactRouterRoutes(root, files) : [],
  ];
  const all = groups.flat();
  const uniq = new Map();
  for (const r of all) { const k = r.path + '|' + r.kind + '|' + (r.slot || '') + '|' + (r.intercept || ''); if (!uniq.has(k)) uniq.set(k, r); }
  return [...uniq.values()].sort((a, b) => a.path.localeCompare(b.path));
}

// ---------- matching ----------
export function normalizeTarget(t) {
  if (!t) return null;
  let s = t.trim();
  if (/^(https?:)?\/\//.test(s) || /^(mailto|tel):/.test(s)) return null;
  s = s.replace(/\$\{[^}]*\}/g, ':param');
  const [pathPart, rest = ''] = s.split(/(?=[?#])/);
  const query = rest.startsWith('?') ? rest.slice(1).split('#')[0] : '';
  let p = pathPart.replace(/\/+$/, '') || '/';
  if (!p.startsWith('/')) return null;
  return { path: p, query, queryKeys: query ? query.split('&').map((kv) => kv.split('=')[0]).filter(Boolean) : [] };
}

export function matchRoute(targetPath, routes) {
  const tsegs = targetPath.split('/').filter(Boolean);
  let best = null; let bestScore = -1;
  for (const r of routes) {
    if (r.kind !== 'page') continue;
    const psegs = r.path.split('/').filter(Boolean);
    let score = 0; let ok = true;
    for (let i = 0; i < Math.max(psegs.length, tsegs.length); i++) {
      const p = psegs[i]; const t = tsegs[i];
      if (p && p.startsWith('*')) { score += 1; ok = p.endsWith('?') || t != null; break; }
      if (p == null || t == null) { ok = false; break; }
      if (p.startsWith(':')) { score += t.startsWith(':') ? 3 : 2; continue; }
      if (t.startsWith(':')) { ok = false; break; }
      if (p.toLowerCase() === t.toLowerCase()) { score += p === t ? 4 : 1; continue; }
      ok = false; break;
    }
    if (ok && score > bestScore) { best = r; bestScore = score; }
  }
  return best;
}

const redRe = (from) => new RegExp('^' + from.replace(/[.+?^${}()|[\]\\]/g, (c) => (c === '(' || c === ')' ? c : '\\' + c)).replace(/\(\\\.\*\)/g, '.*').replace(/\/\*$/, '(/.*)?').replace(/^\*$/, '.*').replace(/:[\w]+\*/g, '.*').replace(/:[\w]+/g, '[^/]+') + '$');
export function matchRedirect(targetPath, redirects, { catchAll = true } = {}) {
  const cands = redirects.filter((r) => r.from && r.kind === 'redirect' && (catchAll || !r.catchAll));
  return cands.filter((r) => !r.catchAll).find((r) => redRe(r.from).test(targetPath)) || (catchAll ? cands.filter((r) => r.catchAll).find((r) => redRe(r.from).test(targetPath)) : null) || null;
}
