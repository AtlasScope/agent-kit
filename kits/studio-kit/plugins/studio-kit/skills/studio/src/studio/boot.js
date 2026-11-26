/* ===== Start: restore the newest saved copy, mark new choices, draw, connect ===== */

$('ttl').textContent = 'Studio';
$('proj').textContent = P.name;

/* The States view shows hover and press without a pointer. Rather than keep a second copy of every hover and press
   style, each rule written for :hover or :active is repeated once for a class the drawing code can set. */
(function forcedStates() {
  const out = [];
  const walk = (rules) => {
    for (const r of rules) {
      if (r.cssRules && r.cssRules.length && !r.selectorText) { walk(r.cssRules); continue; }
      const sel = r.selectorText;
      if (!sel || !/:(hover|active)/.test(sel) || !/\.(pv|h-|p-|m-|sh-)/.test(sel)) continue;
      out.push(sel.replace(/:hover/g, '.sx-hover').replace(/:active/g, '.sx-active') + '{' + r.style.cssText + '}');
    }
  };
  for (const sh of document.styleSheets) { try { walk(sh.cssRules); } catch {} }
  const st = document.createElement('style');
  st.id = 'sx';
  st.textContent = out.join('\n');
  document.head.appendChild(st);
})();

/* An address ending #palette or #button/material opens straight there. */
function fromHash() {
  const [hm, hc] = decodeURIComponent(location.hash.slice(1)).split('/');
  if (!STUDIO.has(hm)) return false;
  NAV.mod = hm; NAV.review = false;
  if (hc === 'looks' || STUDIO.by[hm].groups.some((g) => g.id === hc)) NAV.cat[hm] = hc;
  history.replaceState(null, '', location.pathname + location.search);
  return true;
}
addEventListener('hashchange', () => { if (fromHash()) { redrawAll(); save(); } });
if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', () => fitArt($('panel')));

/* For the agent, from the browser console or a browser tool: draws every tiled choice of every studio and reports the
   ones that draw exactly like another choice of the same control. A choice nobody can tell apart is a dead option. */
function studioCheck() {
  const PROPS = ['backgroundColor', 'backgroundImage', 'color', 'borderTopColor', 'borderTopWidth', 'borderTopStyle', 'borderTopLeftRadius', 'borderTopRightRadius', 'boxShadow', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'lineHeight', 'textTransform', 'fontVariantNumeric', 'width', 'height', 'paddingLeft', 'opacity', 'transform', 'translate', 'scale', 'rotate', 'filter', 'backdropFilter', 'animationName', 'animationDuration', 'outlineColor', 'outlineStyle', 'display', 'flexDirection', 'gap', 'content', 'clipPath'];
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;left:-9999px;top:0;width:600px';
  document.body.appendChild(box);
  const print = () => [box, ...box.querySelectorAll('*')].map((el) => [null, '::before', '::after'].map((ps) => { const c = getComputedStyle(el, ps); return ps && c.content === 'none' ? '' : PROPS.map((p) => c[p]).join('|'); }).join('~') + '#' + el.textContent.length + el.childElementCount + (el.getAttribute('href') || '')).join('\n');
  const out = { controls: 0, lookAlike: [], listedAsWords: [] };
  for (const c of Object.values(CT)) {
    if (c.t !== 'chips' || !shown(c, ST[c.mid])) continue; // a control that is hidden right now is not judged
    const m = STUDIO.by[c.mid], t = m.tile && m.tile(c);
    if (!t) { out.listedAsWords.push(c.mid + '.' + c.k); continue; }
    out.controls++;
    const seen = {};
    for (const op of c.opts) {
      if (!avail(op, ST[c.mid])) continue;
      const s = candidate(c, op);
      box.innerHTML = `<div class="${dimCls(m.id, s)}" style="${varsCss(m.vars(s))}">${m.still(s, { tile: c.k })}</div>`;
      if (t.on) box.querySelectorAll('.pv').forEach((b) => b.classList.add('sx-' + t.on));
      const f = print();
      if (seen[f]) out.lookAlike.push(`${c.mid}.${c.k}: “${op.n}” draws the same as “${seen[f]}”`); else seen[f] = op.n;
    }
  }
  box.remove();
  return out;
}

(async () => {
  let local = null, server = null;
  try { local = JSON.parse(localStorage.getItem(SKEY) || localStorage.getItem(OLD_KEY) || 'null'); } catch {}
  if (LIVE) { try { server = (await api('/api/state')).state; } catch {} }
  else if (CLOUD) {
    try {
      const db = await Promise.race([STORE, new Promise((r) => setTimeout(() => r(null), 4000))]);
      const d = db && (await db.doc(STATE_DOC).get());
      if (d && d.exists) server = clone(d.data());
    } catch {}
  }
  const saved = newest(server, local);
  const had = restore(saved);
  if (!had) V.mode = AM().mode0 || 'alone';

  if (!DEV[V.device] || UI.devAt !== VIEW) V.device = VIEW; // a new device, or a different one: start on the one in hand
  UI.devAt = VIEW;
  if (!BGS.some((b) => b[0] === V.bg)) V.bg = P.pageBg ? 'page' : 'studio';
  seen('dev', V.device);
  seen('bg', V.bg);
  seen('mode', V.mode);

  fromHash();

  /* Choices the agent added since the last visit get a green dot, and the page opens where they are. */
  const all = addedKeys();
  const added = had ? all.filter((k) => !UI.known.includes(k)) : [];
  UI.fresh = [...new Set(UI.fresh.concat(added))].filter((k) => all.includes(k));
  UI.known = all;
  if (DIM_BAD.length) {
    msg(`A new category the agent added has a mistake, so it is left out: ${esc(DIM_BAD[0])} Everything else works, and your choices are safe.`, 'warn', true);
    report('MORE.dims: ' + DIM_BAD.join(' '));
  }
  if (!MORE_OK) {
    msg('The choices the agent added have a mistake, so they are hidden for now. Your choices are safe. The agent has been told.', 'warn', true);
    report('The MORE block in the page did not load (syntax error).');
  } else if (added.length) {
    const [mid, key] = added[0].split(':')[0].split('.');
    if (STUDIO.has(mid)) {
      const c = ctlsFor(mid, key)[0];
      NAV.mod = mid; NAV.review = false;
      NAV.cat[mid] = c ? c.sid : 'looks';
      added.forEach((k) => { const [m2, k2] = k.split(':')[0].split('.'); ctlsFor(m2, k2).forEach((x) => { UI.expanded[x.id] = true; }); });
    }
    const newCats = [...new Set(added.map((k) => ctlsFor(...k.split(':')[0].split('.'))[0]).filter((c) => c && STUDIO.by[c.mid].groups.find((g) => g.id === c.sid && g.dim)).map((c) => STUDIO.by[c.mid].groups.find((g) => g.id === c.sid).t))];
    msg(newCats.length ? `Something new to change: <b>${esc(list(newCats))}</b>, with its choices drawn and marked with a green dot. Everything you picked and pinned is still here.`
      : `${added.length} new choice${added.length > 1 ? 's' : ''} added${UI.pending ? ' to ' + esc(UI.pending.name) : ''}, marked with a green dot. Everything you picked is still selected.`, 'ok');
    UI.pending = null;
  } else if (!(UI.pending && UI.pending.sent && Date.now() - UI.pending.at < 15 * 60e3)) UI.pending = null;

  const m = AM();
  if (m.onNav) m.onNav();
  renderStage();
  renderPanel();
  conn();
  save();
  if (added.length) scrollToPanel(); else if (UI.scroll) scrollTo(0, UI.scroll);
  connect();
})();
