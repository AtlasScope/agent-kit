/* ===== Start: restore the newest saved copy, mark new choices, draw, connect ===== */

{
  const title = P.noun[0].toUpperCase() + P.noun.slice(1) + ' studio';
  document.title = title + ' · ' + P.name;
  $('ttl').textContent = title;
  $('proj').textContent = P.name;
}

(async () => {
  let local = null, server = null;
  try { local = JSON.parse(localStorage.getItem(SKEY) || 'null'); } catch {}
  if (LIVE) { try { server = (await api('/api/state')).state; } catch {} }
  else if (CLOUD) {
    try {
      const db = await Promise.race([STORE, new Promise((r) => setTimeout(() => r(null), 4000))]);
      const d = db && (await db.doc(STATE_DOC).get());
      if (d && d.exists) server = JSON.parse(JSON.stringify(d.data()));
    } catch {}
  }
  const saved = newest(server, local);
  restore(saved);

  if (!DEV[S.device] || UI.devAt !== VIEW) S.device = VIEW; // a new device, or a different one: start on the one in hand
  UI.devAt = VIEW;
  if (!BGS.some((b) => b[0] === S.bg)) S.bg = DEF.bg;
  seen('dev', S.device);
  seen('bg', S.bg);

  /* Choices the agent added since the last visit get a green dot, and the page opens where they are. */
  const all = addedKeys();
  const added = saved ? all.filter((k) => !UI.known.includes(k)) : [];
  UI.fresh = [...new Set(UI.fresh.concat(added))].filter((k) => all.includes(k));
  UI.known = all;
  if (!MORE_OK) {
    msg('The choices the agent added have a mistake, so they are hidden for now. Your choices are safe. The agent has been told.', 'warn', true);
    report('The MORE block in the page did not load (syntax error).');
  } else if (added.length) {
    const where = new Set(added.map((k) => { const key = k.split(':')[0]; const c = key === 'swatch' ? ctlsFor('swatch')[0] : chipsFor(key); return c && c.sid; }).filter(Boolean));
    const first = STEPS.findIndex((st) => where.has(st.id));
    if (first >= 0) {
      cur = first;
      Object.values(CT).filter((c) => c.sid === STEPS[first].id && c.t === 'chips' && UI.fresh.some((f) => f.startsWith(c.k + ':'))).forEach((c) => { UI.expanded[c.id] = true; });
    }
    msg(`${added.length} new choice${added.length > 1 ? 's' : ''} added${UI.pending ? ' to ' + esc(UI.pending.name) : ''}, marked with a green dot. Everything you picked is still selected.`, 'ok');
    UI.pending = null;
  } else if (UI.pending && UI.pending.sent && Date.now() - UI.pending.at < 15 * 60e3) {
    msg(`<span class="spin"></span>&nbsp; Waiting for the agent to add choices to ${esc(UI.pending.name)}. Your choices are saved.`, 'ok', true);
  } else UI.pending = null;

  S.menuOpen = onMenuStep();
  $('bgsel').value = S.bg;
  $('rmtog').setAttribute('aria-pressed', String(S.rm));
  renderDevices();
  renderPreview();
  renderPanel();
  layoutDevice();
  conn();
  save();
  if (added.length) scrollToPanel(); else if (UI.scroll) scrollTo(0, UI.scroll);
  connect();
})();
