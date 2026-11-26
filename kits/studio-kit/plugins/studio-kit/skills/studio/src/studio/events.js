/* ===== Events: picking, typing, sliding, and the studio's own controls ===== */

function pick(c, op) {
  S[c.k] = op.v;
  if (op.set) for (const k in op.set) if (k in DEF) S[k] = op.set[k];
  onPick(c, op);
  const i = UI.fresh.indexOf(freshKey(c, op.v));
  if (i >= 0) UI.fresh.splice(i, 1);
  resetPreview();
  changed(c.sid);
  renderPanel();
  save();
  afterPick(c);
}
function pickSwatch(name) {
  const w = swOf(name);
  Object.assign(S, { swatch: w[0], H: w[1], C: w[2], L: w[3] });
  UI.fresh = UI.fresh.filter((f) => f !== 'swatch:' + w[0]);
  renderPreview(); changed('colour'); renderPanel(); save();
}

/* Sliders only change CSS variables, at most once a frame; nothing is rebuilt while dragging. */
let frame = 0;
function slid() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    applyVars();
    const mn = $('menu'); if (mn) mn.style.width = S.mw + 'px';
    const d = $('d_sw'); if (d) d.innerHTML = swatchDesc();
  });
}

const panel = $('panel');
panel.addEventListener('input', (e) => {
  const t = e.target;
  if (t.id === 'cw') { UI.text = t.value; save(); return; }
  const c = CT[t.dataset.c];
  if (!c) return;
  if (t.type === 'range') { S[c.k] = +t.value; const v = $('v_' + c.id); if (v) v.textContent = fmt(S[c.k], c); slid(); }
  else if (t.type === 'text') { S[c.k] = t.value; renderPreview(); }
  save();
});
panel.addEventListener('change', (e) => {
  const c = CT[e.target.dataset.c];
  if (!c) return;
  changed(c.sid);
  if (e.target.type === 'range') renderPanel(); else renderNav(); // a slider can move a size off its named choice
  save();
});
panel.addEventListener('toggle', (e) => { const d = e.target; if (d.dataset && d.dataset.fine) { UI.fine[d.dataset.fine] = d.open; save(); } }, true);

/* The line under a list describes the choice under the pointer or keyboard focus, then the picked one again. */
function describe(el, hovering) {
  const c = CT[el.dataset.c];
  const d = c && c.t === 'chips' && $('d_' + c.id);
  if (d) d.innerHTML = descHTML(c, hovering ? c.opts[+el.dataset.o] : optOf(c, S[c.k]));
}
panel.addEventListener('pointerover', (e) => { const b = e.target.closest('.chip[data-o]'); if (b && e.pointerType === 'mouse') describe(b, true); });
panel.addEventListener('pointerout', (e) => { const b = e.target.closest('.chip[data-o]'); if (b && e.pointerType === 'mouse' && !b.contains(e.relatedTarget)) describe(b, false); });
panel.addEventListener('focusin', (e) => { const b = e.target.closest('.chip[data-o]'); if (b) describe(b, true); });
panel.addEventListener('focusout', (e) => { const b = e.target.closest('.chip[data-o]'); if (b) describe(b, false); });

const ACTIONS = {
  replay: () => replayPreview(),
  cancel: () => { UI.compose = null; UI.text = ''; renderPanel(); save(); },
  sendmore: () => sendMore(),
  copy: () => copyText(specText()).then((ok) => msg(ok ? 'Copied the spec.' : 'Could not copy.', ok ? 'ok' : 'warn')),
  send: () => sendSpec(),
  undo: () => { if (UNDO) { UNDO(); UNDO = null; } },
};
let UNDO = null; // put back what "Clear every choice" removed
document.addEventListener('click', (e) => {
  const t = e.target, at = (sel) => t.closest(sel);
  if (S.menuOpen && !onMenuStep() && at('#stage') && !at('#menu,#tog,#tog2,.expand,.lg2')) setMenu(false);
  let el;
  if ((el = at('[data-act]'))) return ACTIONS[el.dataset.act] && ACTIONS[el.dataset.act]();
  if (at('[data-set="rm"]')) return setRm(false);
  if ((el = at('.chip[data-o]'))) { const c = CT[el.dataset.c]; return pick(c, c.opts[+el.dataset.o]); }
  if ((el = at('[data-expand]'))) { UI.expanded[el.dataset.expand] = true; renderPanel(); return save(); }
  if ((el = at('[data-more]'))) {
    UI.compose = UI.compose === el.dataset.more ? null : el.dataset.more;
    UI.text = '';
    UI.focusCompose = true;
    renderPanel();
    return save();
  }
  if ((el = at('[data-sw]'))) return pickSwatch(el.dataset.sw);
  if ((el = at('[data-go]'))) return goStep(+el.dataset.go);
  if (at('[data-next]')) return next();
  if (at('[data-back]')) return goStep(cur - 1);
  if ((el = at('[data-dev]'))) return setDevice(el.dataset.dev);
});
$('msgx').onclick = () => $('msg').classList.remove('show');
$('devices').addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const ks = Object.keys(DEV), k = ks[(ks.indexOf(S.device) + (e.key === 'ArrowRight' ? 1 : ks.length - 1)) % ks.length];
  setDevice(k);
  $('devices').querySelector(`[data-dev="${k}"]`).focus();
});
$('bgsel').innerHTML = BGS.map((b) => `<option value="${esc(b[0])}">${esc(b[1])}</option>`).join('');
$('bgsel').onchange = (e) => setBg(e.target.value);
$('rmtog').onclick = () => setRm(!S.rm);

/* Starting points, and clearing everything */
const STEP_KEYS = new Set(STEPS.flatMap((st) => st.ctl.map((c) => c.k)));
const STARTS = PRESETS.map(([n, p]) => [n, Object.fromEntries(Object.entries(p).filter(([k]) => STEP_KEYS.has(k)))]).filter(([, p], i) => i === 0 || Object.keys(p).length);
$('preset').innerHTML = '<option value="">Start from…</option>' + STARTS.map((p, i) => `<option value="${i}">${esc(p[0])}</option>`).join('') + '<option value="reset">Clear every choice</option>';
$('preset').onchange = (e) => {
  const v = e.target.value;
  e.target.value = '';
  if (v === '') return;
  const view = { device: S.device, bg: S.bg, rm: S.rm };
  if (v === 'reset') {
    const back = { S, locked: Object.assign({}, locked), stale: Object.assign({}, stale), cur, expanded: UI.expanded };
    UNDO = () => {
      S = back.S; cur = back.cur; UI.expanded = back.expanded;
      for (const k in locked) delete locked[k];
      for (const k in stale) delete stale[k];
      Object.assign(locked, back.locked); Object.assign(stale, back.stale);
      resetPreview(); renderPanel(); save(true);
      msg('Put back.', 'ok');
    };
    S = Object.assign(fresh(), view);
    for (const k in locked) delete locked[k];
    for (const k in stale) delete stale[k];
    UI.expanded = {};
    cur = 0;
    resetPreview(); renderPanel(); save(true);
    return msg('Cleared. You are back at the start. <button class="chip sm" data-act="undo">Undo</button>', 'ok', true);
  }
  const [name, p] = STARTS[+v];
  const before = S;
  S = Object.assign(fresh(), p, view);
  fixState(S);
  STEPS.forEach((st) => { if (st.ctl.some((c) => !sameValue(before[c.k], S[c.k]))) changed(st.id); });
  resetPreview(); renderPanel(); save();
  msg(`Started from ${esc(name)}.`, 'ok');
};

addEventListener('resize', () => {
  const v = VIEWER();
  if (v === VIEW) return;
  const followed = S.device === VIEW; // still showing the device the person is on: follow them
  VIEW = v;
  if (followed) S.device = v;
  renderDevices();
  applyVars();
});
new ResizeObserver(() => layoutDevice()).observe($('stage'));
