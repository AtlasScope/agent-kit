/* ===== Events: picking, typing, sliding, and the studio's own controls ===== */

const unfresh = (key) => { const i = UI.fresh.indexOf(key); if (i >= 0) UI.fresh.splice(i, 1); };
function pick(c, op) {
  const m = STUDIO.by[c.mid];
  commit(c.mid);
  setState(c.mid, candidate(c, op));
  unfresh(freshKey(c, op.v));
  redrawAll(); save();
  if (m.after) m.after(c);
}
function pickSwatch(c, name) {
  const m = STUDIO.by[c.mid], w = c.sw.find((x) => x[0] === name);
  if (!w) return;
  commit(c.mid);
  const s = ST[c.mid];
  if (m.swatch) m.swatch(s, w); else s[c.k] = w[0];
  unfresh(freshKey(c, w[0]));
  redrawAll(); save();
}
function pickLook(id) {
  const m = AM(), l = m.looks.find((x) => x.id === id);
  if (id !== '@base' && !l) return;
  commit(m.id);
  setState(m.id, l ? lookState(m, l) : fresh(m.id));
  unfresh(m.id + '.look:' + id);
  redrawAll(); save();
}
const tried = new Set();
function surprise() {
  const m = AM(), now = AS();
  let pool = m.looks.filter((l) => !tried.has(l.id) && !sameLook(m.id, lookState(m, l), now));
  if (!pool.length) { tried.clear(); pool = m.looks.filter((l) => !sameLook(m.id, lookState(m, l), now)); }
  const l = pool[Math.floor(Math.random() * pool.length)];
  if (!l) return;
  tried.add(l.id);
  pickLook(l.id);
  msg(`${esc(l.n)}. ${esc(l.d)}`, 'ok');
}

/* Sliders redraw only what the view needs, at most once a frame; the tiles catch up when the slider is let go. */
let frame = 0, editing = null; // editing: the control being dragged or typed in, so one gesture is one undo step
function slid() {
  if (frame) return;
  frame = requestAnimationFrame(() => { frame = 0; refreshLive(); });
}
const panel = $('panel');
panel.addEventListener('input', (e) => {
  const t = e.target;
  if (t.id === 'ask') { UI.ask.text = t.value; save(); return; }
  const c = CT[t.dataset.c];
  if (!c) return;
  if (editing !== c.id) { commit(c.mid); editing = c.id; }
  const s = ST[c.mid];
  if (t.type === 'range') { s[c.k] = +t.value; const v = $('v_' + c.id); if (v) v.textContent = fmt(s[c.k], c); slid(); }
  else if (t.type === 'text') { s[c.k] = t.value; renderStage(); }
  save();
});
panel.addEventListener('change', (e) => {
  const c = CT[e.target.dataset.c];
  if (!c) return;
  editing = null;
  if (e.target.type === 'range') renderPanel(); else { renderTop(); renderStageBar(); }
  save();
});
panel.addEventListener('focusout', (e) => { if (e.target.dataset && e.target.dataset.c === editing) editing = null; });
panel.addEventListener('toggle', (e) => { const d = e.target; if (d.dataset && d.dataset.fine) { UI.fine[d.dataset.fine === 'review' ? 'review' : NAV.mod + '.' + d.dataset.fine] = d.open; save(); } }, true);
panel.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'ask') sendAsk(''); });
panel.addEventListener('change', (e) => { if (e.target.id === 'importfile') importFile(e.target.files[0]); });

/* The line under a list describes the choice under the pointer or keyboard focus, then the picked one again. */
function describe(el, hovering) {
  const c = CT[el.dataset.c];
  const d = c && c.t === 'chips' && $('d_' + c.id);
  if (d) d.innerHTML = descHTML(c, hovering ? c.opts[+el.dataset.o] : optOf(c, ST[c.mid][c.k]), ST[c.mid]);
}
panel.addEventListener('pointerover', (e) => { const b = e.target.closest('[data-o]'); if (b && e.pointerType === 'mouse') describe(b, true); });
panel.addEventListener('pointerout', (e) => { const b = e.target.closest('[data-o]'); if (b && e.pointerType === 'mouse' && !b.contains(e.relatedTarget)) describe(b, false); });
panel.addEventListener('focusin', (e) => { const b = e.target.closest('[data-o]'); if (b) describe(b, true); });
panel.addEventListener('focusout', (e) => { const b = e.target.closest('[data-o]'); if (b) describe(b, false); });

/* ---- saving to a file and opening one: data only, checked value by value, never run ---- */
function exportFile() {
  const snap = snapshot();
  const body = JSON.stringify({ studio: 1, project: P.name, mods: snap.mods, pins: snap.pins, scope: snap.scope, at: new Date().toISOString() }, null, 1);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([body], { type: 'application/json' }));
  a.download = (P.name + '-studio').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
async function importFile(f) {
  if (!f) return;
  if (f.size > 300e3) return msg('That file is too big to be one of these.', 'warn');
  let d;
  try { d = JSON.parse(await f.text()); } catch { return msg('That file could not be read.', 'warn'); }
  if (!d || typeof d !== 'object' || !d.mods || typeof d.mods !== 'object') return msg('That is not a file saved from the studio.', 'warn');
  const took = STUDIO.mods.filter((m) => d.mods[m.id] && typeof d.mods[m.id] === 'object');
  if (!took.length) return msg('That file has nothing for the studios open here.', 'warn');
  took.forEach((m) => { commit(m.id); setState(m.id, cleanState(m.id, d.mods[m.id])); });
  redrawAll(); save();
  msg(`Opened ${esc(list(took.map((m) => m.name)))} from the file. Undo brings back what you had.`, 'ok');
}
function resetAll() {
  STUDIO.mods.filter((m) => changedKeys(m.id).length).forEach((m) => { commit(m.id); setState(m.id, fresh(m.id)); });
  redrawAll(); save();
  msg('Everything is back where it started. Undo brings your choices back.', 'ok');
}

const ACTIONS = {
  replay: () => { const m = AM(); if (m.replay) m.replay(); },
  ask: () => sendAsk(''),
  askwide: () => { UI.ask.target = null; renderPanel(); save(); },
  copy: () => copyText(specText()).then((ok) => msg(ok ? 'Copied the proposal.' : 'Could not copy.', ok ? 'ok' : 'warn')),
  send: () => sendSpec(),
  back: () => go(null, NAV.cat[NAV.mod]),
  surprise,
  export: exportFile,
  import: () => $('importfile').click(),
  resetall: resetAll,
};
document.addEventListener('click', (e) => {
  const t = e.target, at = (sel) => t.closest(sel);
  if (STUDIO.has('button') && S.menuOpen && !onMenuStep() && at('#stage') && !at('#menu,#tog,#tog2,.expand,.lg2')) setMenu(false);
  let el;
  if ((el = at('[data-act]'))) return ACTIONS[el.dataset.act] && ACTIONS[el.dataset.act]();
  if (at('[data-set="rm"]')) return setRm(false);
  if ((el = at('[data-sw]'))) return pickSwatch(CT[el.dataset.c], el.dataset.sw);
  if ((el = at('[data-o]'))) { const c = CT[el.dataset.c]; return pick(c, c.opts[+el.dataset.o]); }
  if ((el = at('[data-look]'))) return pickLook(el.dataset.look);
  if ((el = at('[data-expand]'))) { UI.expanded[el.dataset.expand] = true; renderPanel(); return save(); }
  if ((el = at('[data-more]'))) {
    UI.ask.target = el.dataset.more;
    renderPanel(); save();
    const box = $('ask');
    if (box) { box.focus({ preventScroll: true }); $('askbox').scrollIntoView({ block: 'center', behavior: RM_OS ? 'auto' : 'smooth' }); }
    return;
  }
  if ((el = at('[data-quick]'))) return sendAsk(el.dataset.quick);
  if ((el = at('[data-goctl]'))) return goControl(el.dataset.goctl);
  if ((el = at('[data-scope]'))) { SCOPE = el.dataset.scope; renderPanel(); return save(); }
  if ((el = at('[data-cat]'))) return go(null, el.dataset.cat);
  if ((el = at('[data-mod]'))) return go(el.dataset.mod, NAV.cat[el.dataset.mod]);
  if ((el = at('[data-mode]'))) return setMode(el.dataset.mode);
  if ((el = at('[data-dev]'))) return setDevice(el.dataset.dev);
  if ((el = at('[data-use]'))) return usePinned(el.dataset.use);
  if ((el = at('[data-unpin]'))) return unpin(el.dataset.unpin);
});
/* Tiles and looks are drawn with real buttons inside, so they are not <button>s themselves: give them the keyboard. */
document.addEventListener('keydown', (e) => {
  const t = e.target;
  if ((e.key === 'Enter' || e.key === ' ') && t.matches && t.matches('[role=button][tabindex]')) { e.preventDefault(); t.click(); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !(t.matches && t.matches('input[type=text],textarea'))) { e.preventDefault(); (e.shiftKey ? redo : undo)(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
});
$('undo').onclick = undo;
$('redo').onclick = redo;
$('review').onclick = () => (NAV.review ? go(null, NAV.cat[NAV.mod]) : go(null, 'review'));
$('pin').onclick = pinNow;
{
  const h = $('hold');
  h.addEventListener('pointerdown', (e) => { e.preventDefault(); h.setPointerCapture(e.pointerId); holdOn(); });
  ['pointerup', 'pointercancel', 'lostpointercapture', 'blur'].forEach((n) => h.addEventListener(n, holdOff));
  h.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); holdOn(); } });
  h.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') holdOff(); });
}
$('tabs').addEventListener('change', (e) => { if (e.target.id === 'addmod' && e.target.value) { sendModule(e.target.value); e.target.value = ''; } });
$('msgx').onclick = () => $('msg').classList.remove('show');
const segKeys = (id, keys, cur, set, attr) => $(id).addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
  const ks = keys(), k = ks[(ks.indexOf(cur()) + (e.key === 'ArrowRight' ? 1 : ks.length - 1)) % ks.length];
  set(k);
  const b = $(id).querySelector(`[data-${attr}="${k}"]`); if (b) b.focus();
});
segKeys('devices', () => Object.keys(DEV), () => V.device, setDevice, 'dev');
segKeys('modes', () => MODES.map((x) => x[0]).filter((k) => k !== 'states' || AM().states), modeNow, setMode, 'mode');
$('bgsel').innerHTML = BGS.map((b) => `<option value="${esc(b[0])}">${esc(b[1])}</option>`).join('');
$('bgsel').onchange = (e) => setBg(e.target.value);
$('rmtog').onclick = () => setRm(!V.rm);

addEventListener('resize', () => {
  const v = VIEWER();
  if (v === VIEW) return;
  const followed = V.device === VIEW; // still showing the device the person is on: follow them
  VIEW = v;
  if (followed) V.device = v;
  renderStageBar();
  renderStage();
});
new ResizeObserver(() => layoutDevice()).observe($('stage'));
