// Clickable navigation prototypes generated from proposal JSON (see references/proposal-format.md).

export function flattenProposal(p) {
  const out = [];
  const walk = (nodes, kind) => {
    for (const n of nodes || []) {
      const status = n.status || (n.absorbs?.length ? 'merge' : n.new ? 'new' : undefined);
      const note = [n.absorbs?.length ? `absorbs ${n.absorbs.join(', ')}` : '', n.tabs?.length ? `tabs: ${n.tabs.join(' · ')}` : '', n.views?.length ? `views: ${n.views.map((v) => v.label).join(' · ')}` : '', n.note || ''].filter(Boolean).join('; ');
      out.push({ path: n.path, label: n.label, status, note, kind });
      walk(n.children, kind);
    }
  };
  walk(p.sections, 'section');
  walk(p.utility, 'utility');
  for (const r of p.retire || []) out.push({ path: r.path, label: 'retired', status: 'retire', note: r.to ? `→ ${r.to}` : r.reason || '' });
  return out;
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function prototypeHtml(proposals) {
  const data = JSON.stringify(proposals).replace(/</g, '\\u003c');
  const title = proposals.length === 1 ? proposals[0].name : `${proposals.length} navigation proposals`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>
:root{--bg:#f7f7f5;--panel:#fff;--ink:#1d1d1b;--muted:#6b6b66;--line:#e2e1dc;--accent:#2f5d50;--accent-ink:#fff;--soft:#e8efec;--warn:#8a4b0f;--warn-bg:#fbefe1}
@media (prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#161615;--panel:#1f1f1d;--ink:#ecebe6;--muted:#a3a29b;--line:#34332f;--accent:#8cc5b2;--accent-ink:#10201b;--soft:#22302b;--warn:#f0b97a;--warn-bg:#3a2a18}}
:root[data-theme=dark]{--bg:#161615;--panel:#1f1f1d;--ink:#ecebe6;--muted:#a3a29b;--line:#34332f;--accent:#8cc5b2;--accent-ink:#10201b;--soft:#22302b;--warn:#f0b97a;--warn-bg:#3a2a18}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.45 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
a{color:inherit}button,select{font:inherit;color:inherit}
.bar{display:flex;align-items:center;gap:12px;padding:8px 16px;border-bottom:1px solid var(--line);background:var(--panel);position:sticky;top:0;z-index:5}
.bar .brand{font-weight:650}.bar select{background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:4px 8px}
.url{flex:1;min-width:0;font:12px/1.4 ui-monospace,Menlo,monospace;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:5px 8px}
.shell{display:flex;min-height:calc(100vh - 49px)}
.side{width:220px;flex:none;border-right:1px solid var(--line);background:var(--panel);padding:12px 8px;display:flex;flex-direction:column;gap:2px}
.side .group{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:14px 10px 4px}
.navlink{display:block;padding:7px 10px;border-radius:6px;text-decoration:none}
.navlink:hover{background:var(--soft)}.navlink[aria-current=page]{background:var(--accent);color:var(--accent-ink);font-weight:600}
.top{display:flex;gap:4px;padding:0 16px;border-bottom:1px solid var(--line);background:var(--panel)}
.top .navlink{border-radius:0;border-bottom:2px solid transparent;padding:10px 12px}.top .navlink[aria-current=page]{background:none;color:var(--accent);border-color:var(--accent)}
main{flex:1;min-width:0;padding:20px 28px 80px;max-width:1000px}main:focus{outline:none}
.crumbs{font-size:13px;color:var(--muted);margin-bottom:6px}.crumbs a{text-decoration:none}.crumbs a:hover{text-decoration:underline}
h1{font-size:24px;margin:0 0 12px;letter-spacing:-.01em}
.tabs{display:flex;gap:2px;border-bottom:1px solid var(--line);margin:8px 0 16px}
.tabs button{background:none;border:0;border-bottom:2px solid transparent;padding:8px 12px;cursor:pointer;color:var(--muted)}
.tabs button[aria-selected=true]{color:var(--ink);border-color:var(--accent);font-weight:600}
.views{display:flex;gap:6px;margin:4px 0 14px;flex-wrap:wrap}.views a{border:1px solid var(--line);border-radius:999px;padding:3px 12px;text-decoration:none;font-size:13px}.views a[aria-current=true]{background:var(--soft);border-color:var(--accent)}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin:10px 0}
.items a{display:block;padding:9px 0;border-bottom:1px solid var(--line);text-decoration:none}.items a:last-child{border:0}
.note{background:var(--warn-bg);color:var(--warn);border-radius:8px;padding:10px 12px;font-size:13px;margin:10px 0}
.meta{font-size:13px;color:var(--muted)}.meta code{font-size:12px}
.log{position:fixed;right:12px;bottom:12px;width:300px;max-height:40vh;overflow:auto;background:var(--panel);border:1px solid var(--line);border-radius:10px;font:12px/1.4 ui-monospace,Menlo,monospace;padding:8px 10px;box-shadow:0 6px 20px rgba(0,0,0,.08)}
.log b{font-family:ui-sans-serif,system-ui;font-size:12px}.log div{padding:2px 0;border-bottom:1px dashed var(--line)}
.bottom{display:none}
@media (max-width:760px){.side,.top{display:none}main{padding:16px 16px 90px}.log{display:none}
.bottom{display:flex;position:fixed;left:0;right:0;bottom:0;background:var(--panel);border-top:1px solid var(--line);z-index:6;overflow-x:auto}
.bottom .navlink{flex:1;text-align:center;font-size:12px;padding:10px 6px;border-radius:0;white-space:nowrap}.bottom .navlink[aria-current=page]{background:var(--soft);color:var(--ink)}}
</style></head><body>
<div class="bar"><span class="brand" id="brand"></span><select id="pick" aria-label="Proposal"></select><span class="url" id="url"></span><button id="theme" aria-label="Toggle theme" style="background:none;border:1px solid var(--line);border-radius:6px;padding:4px 8px">◐</button></div>
<div id="topnav" class="top"></div>
<div class="shell"><nav id="side" class="side" aria-label="Primary"></nav><main id="main" tabindex="-1"></main></div>
<nav id="bottom" class="bottom" aria-label="Primary (mobile)"></nav>
<div class="log" id="log"><b>History operations</b></div>
<script>
const PROPOSALS = ${data};
let P = PROPOSALS[0];
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
try { const t = localStorage.getItem('ea-theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
$('#theme').onclick = () => { const d = document.documentElement; d.dataset.theme = d.dataset.theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('ea-theme', d.dataset.theme); } catch (e) {} };
PROPOSALS.forEach((p, i) => $('#pick').append(new Option(p.name, i)));
if (PROPOSALS.length < 2) $('#pick').style.display = 'none'; else $('#brand').style.display = 'none';
$('#pick').onchange = (e) => { P = PROPOSALS[+e.target.value]; go(firstPath(), 'push'); };
const all = () => { const out = []; const w = (ns, parents, kind) => (ns || []).forEach((n) => { out.push({ ...n, parents, kind }); w(n.children, [...parents, n], kind); }); w(P.sections, [], 'section'); w(P.utility, [], 'utility'); return out; };
const firstPath = () => (P.sections?.[0]?.path || '/');
const toRe = (p) => new RegExp('^' + p.replace(/:[\\w]+/g, '([^/]+)') + '$');
const sample = (p) => p.replace(/:[\\w]+/g, '1');
function find(path) { return all().filter((n) => toRe(n.path).test(path)).sort((a, b) => b.path.split('/').length - a.path.split('/').length)[0]; }
function parse() { const h = location.hash.slice(1) || firstPath(); const [path, q = ''] = h.split('?'); return { path, q: new URLSearchParams(q) }; }
function log(op, url) { const d = document.createElement('div'); d.textContent = op + '  ' + url; $('#log').append(d); $('#log').scrollTop = 1e6; }
function go(url, op = 'push') { const h = '#' + url; if (op === 'replace') history.replaceState(null, '', h); else history.pushState(null, '', h); log(op, url); render(); }
window.addEventListener('popstate', () => { log('pop', location.hash.slice(1)); render(); });
document.addEventListener('click', (e) => { const a = e.target.closest('a[data-to]'); if (!a || e.metaKey || e.ctrlKey) return; e.preventDefault(); go(a.dataset.to, a.dataset.op || 'push'); });
function link(n, path, cls = 'navlink') { const cur = path === n.path || path.startsWith(n.path.replace(/\\/:.*$/, '') + '/') ? ' aria-current="page"' : ''; return '<a class="' + cls + '" href="#' + sample(n.path) + '" data-to="' + sample(n.path) + '"' + cur + '>' + esc(n.label) + '</a>'; }
function render() {
  const { path, q } = parse(); const node = find(path);
  $('#brand').textContent = P.name; $('#url').textContent = path + (q.toString() ? '?' + q : '');
  const primary = P.chrome?.primary || 'sidebar';
  const top = P.sections || []; const util = P.utility || [];
  const sectionOf = node ? (node.parents[0] || node) : null;
  $('#side').style.display = primary === 'topbar' ? 'none' : '';
  $('#topnav').style.display = primary === 'topbar' ? '' : 'none';
  if (primary === 'topbar') { $('#topnav').innerHTML = [...top, ...util].map((n) => link(n, path)).join(''); $('#side').innerHTML = ''; if (sectionOf?.children?.length && !sectionOf.children.every((c) => c.path.includes(':'))) { $('#side').style.display = ''; $('#side').innerHTML = '<div class="group">' + esc(sectionOf.label) + '</div>' + link(sectionOf, path) + sectionOf.children.filter((c) => !c.path.includes(':')).map((c) => link(c, path)).join(''); } }
  else $('#side').innerHTML = top.map((n) => link(n, path)).join('') + (util.length ? '<div class="group">' + esc(P.chrome?.utilityLabel || 'Settings & admin') + '</div>' + util.map((n) => link(n, path)).join('') : '');
  $('#bottom').innerHTML = (P.chrome?.mobile === 'drawer' ? [...top.slice(0, 3)] : top.slice(0, 5)).map((n) => link(n, path)).join('') + (util.length || top.length > 5 ? '<a class="navlink" href="#' + sample((util[0] || top[5]).path) + '" data-to="' + sample((util[0] || top[5]).path) + '">More</a>' : '');
  if (!node) { $('#main').innerHTML = '<h1>Not part of this proposal</h1><p class="meta">' + esc(path) + '</p>'; return; }
  const crumbs = node.parents.map((p) => '<a href="#' + sample(p.path) + '" data-to="' + sample(p.path) + '">' + esc(p.label) + '</a>').join(' / ');
  let html = (crumbs ? '<div class="crumbs">' + crumbs + '</div>' : '') + '<h1>' + esc(node.label) + (node.path.includes(':') ? ' #' + esc((path.match(toRe(node.path)) || [])[1] || '') : '') + '</h1>';
  if (node.views?.length) { const cur = q.get(node.viewParam || 'view') || node.views[0].key || node.views[0].label.toLowerCase(); html += '<div class="views">' + node.views.map((v) => { const k = v.key || v.label.toLowerCase(); return '<a href="#" data-op="' + (node.viewHistory || 'push') + '" data-to="' + sample(node.path) + '?' + (node.viewParam || 'view') + '=' + k + '"' + (k === cur ? ' aria-current="true"' : '') + '>' + esc(v.label) + '</a>'; }).join('') + '</div>'; }
  if (node.tabs?.length) { const param = node.tabParam || 'tab'; const cur = q.get(param) || node.tabs[0].toLowerCase(); html += '<div class="tabs" role="tablist">' + node.tabs.map((t) => '<button role="tab" aria-selected="' + (t.toLowerCase() === cur) + '" data-tab="' + t.toLowerCase() + '">' + esc(t) + '</button>').join('') + '</div><div class="card"><b>' + esc(node.tabs.find((t) => t.toLowerCase() === cur) || node.tabs[0]) + '</b><p class="meta">Tab state lives in <code>?' + param + '=</code> and uses history.' + (node.tabHistory || 'replace') + '.</p></div>'; }
  const kids = (node.children || []);
  if (kids.length) html += '<div class="card items">' + kids.flatMap((k) => k.path.includes(':') ? [1, 2, 3].map((i) => '<a href="#' + k.path.replace(/:[\\w]+/, i) + '" data-to="' + k.path.replace(/:[\\w]+/g, i) + '">' + esc(k.label) + ' #' + i + ' →</a>') : ['<a href="#' + sample(k.path) + '" data-to="' + sample(k.path) + '">' + esc(k.label) + ' →</a>']).join('') + '</div>';
  if (node.purpose) html += '<p>' + esc(node.purpose) + '</p>';
  if (node.absorbs?.length) html += '<div class="note">Replaces today\\'s ' + node.absorbs.map((a) => '<code>' + esc(a) + '</code>').join(', ') + '</div>';
  if (node.note) html += '<p class="meta">' + esc(node.note) + '</p>';
  if (node.overlays?.length) html += '<p class="meta">Overlays: ' + node.overlays.map((o) => esc(o.label) + ' (<code>' + esc(o.url || 'no URL') + '</code>)').join(', ') + '</p>';
  $('#main').innerHTML = html;
  $('#main').querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { const u = new URLSearchParams(q); u.set(node.tabParam || 'tab', b.dataset.tab); go(path + '?' + u, node.tabHistory || 'replace'); });
  document.title = node.label + ' · ' + P.name; $('#main').focus({ preventScroll: true });
}
if (!location.hash) history.replaceState(null, '', '#' + firstPath());
log('entry', location.hash.slice(1)); render();
</script></body></html>`;
}
