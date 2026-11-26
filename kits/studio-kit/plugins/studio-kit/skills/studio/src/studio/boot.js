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
  if (!BGS.some((b) => b[0] === V.bg)) V.bg = P.pageBg ? 'page' : 'cool';
  seen('dev', V.device);
  seen('bg', V.bg);
  seen('mode', V.mode);

  /* An address ending #palette or #button/material opens straight there. */
  const [hm, hc] = decodeURIComponent(location.hash.slice(1)).split('/');
  if (STUDIO.has(hm)) {
    NAV.mod = hm; NAV.review = false;
    if (hc === 'looks' || STUDIO.by[hm].groups.some((g) => g.id === hc)) NAV.cat[hm] = hc;
    history.replaceState(null, '', location.pathname + location.search);
  }

  /* Choices the agent added since the last visit get a green dot, and the page opens where they are. */
  const all = addedKeys();
  const added = had ? all.filter((k) => !UI.known.includes(k)) : [];
  UI.fresh = [...new Set(UI.fresh.concat(added))].filter((k) => all.includes(k));
  UI.known = all;
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
    msg(`${added.length} new choice${added.length > 1 ? 's' : ''} added${UI.pending ? ' to ' + esc(UI.pending.name) : ''}, marked with a green dot. Everything you picked is still selected.`, 'ok');
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
