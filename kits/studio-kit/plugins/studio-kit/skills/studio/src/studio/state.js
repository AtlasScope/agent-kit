/* ===== State: every module's picks, the view, history and pins, saved in the browser and on the local server ===== */

const ST = {}; // module id -> its state
const DEFS = {}; // module id -> its baseline: defaults with what was measured from the project laid over them
let S = {}; // always the button's state (the button's own code reads it)
for (const m of STUDIO.mods) {
  const d = Object.assign({}, m.defaults);
  for (const k in m.today) if (k in d) d[k] = m.today[k];
  if (m.fix) m.fix(d);
  DEFS[m.id] = d;
  ST[m.id] = clone(d);
}
const fresh = (id) => clone(DEFS[id]);
function setState(id, s) { ST[id] = s; if (id === 'button') S = s; }
setState('button', ST.button || {});

/* a project with no page colour of its own starts on black, whichever theme the studio is in */
const V = { device: VIEW, bg: (P.pageBg || (P.palette && P.palette.measured) || (P.palette && P.palette.roles) ? 'page' : 'black'), rm: RM_OS, mode: 'alone' }; // how the preview is shown
const NAV = { mod: STUDIO.mods[0].id, cat: {}, review: false }; // cat[module] is a group id, or 'looks'
STUDIO.mods.forEach((m) => { NAV.cat[m.id] = 'looks'; });
const AM = () => STUDIO.by[NAV.mod];
const AS = () => ST[NAV.mod];

const HIST = { undo: [], redo: [] }; // [{ mod, s, also? }] the state a module had before a change; also: { mid: s } for other modules changed with it
const PINS = []; // [{ id, name, mod, s, ctx }] up to three versions per studio; ctx: the shared foundations it was drawn with
const PIN_MAX = 3;
const SCOPE = {}; // module id -> how far its part of the proposal should reach (an id from reachOf(m))
/* Saved data this page cannot use right now (a studio not open here, a choice no longer offered, a pin for a studio not
   in this page). It is kept and written back with every save, so opening the page somewhere else loses nothing. */
const KEPT = { mods: {}, keys: {}, pins: [] };
const LOST = []; // what restore could not take back this time, said once to the person

/* ---- shared foundations: what one studio's drawings follow from the others ---- */
/** The modules other studios can follow (those with share), as { mid: state }, for a pin to keep. */
function foundations(except, from = ST) {
  const out = {};
  for (const m of STUDIO.mods) if (m.share && m.id !== except && from[m.id]) out[m.id] = clone(from[m.id]);
  return out;
}
/** Runs fn with other studios' states swapped for ctx, so a drawing shows the foundations it was made with. */
function withCtx(ctx, fn) {
  if (!ctx) return fn();
  const was = {};
  for (const id in ctx) if (STUDIO.has(id) && ctx[id]) { was[id] = ST[id]; ST[id] = ctx[id]; }
  try { return fn(); } finally { for (const id in was) ST[id] = was[id]; }
}
const sameCtx = (a, b) => Object.keys(a || {}).every((id) => !STUDIO.has(id) || !b[id] || sameLook(id, a[id], b[id]));
/** The ways a studio's part of the proposal can reach. A component reaches one place, its family or the system; a
    foundation (colour, type, surface ...) says which of its own scopes fit. */
const COMPONENT_REACH = [['one', 'Only this one', 'Change this one place and leave everything like it alone.'], ['family', 'Every one like it', 'Change the shared style, so every matching one follows.'], ['system', 'The design system', 'Change the foundations (colours, type, shared styles) that the rest is built from.']];
const reachOf = (m) => (Array.isArray(m.reach) && m.reach.length ? m.reach : COMPONENT_REACH);
/** A foundation has a sensible default reach; a component waits for the person to choose. */
const reachNow = (m) => SCOPE[m.id] || (Array.isArray(m.reach) && m.reach.length ? m.reach[0][0] : '');
const UI = {
  ask: { target: null, text: '' }, // the request box, and the control it is about (null: the whole page in view)
  pending: null, // the last request sent to the agent
  fresh: [], known: [], // choices marked new, and every added choice seen so far
  expanded: {}, fine: {}, // long lists opened, Fine-tune sections opened
  seen: { dev: [], bg: [], rm: false, mode: [] }, // which views were looked at, for Review and the proposal
  devAt: null, scroll: 0, open: '', // open: the module control expanded right now (a colour role being edited)
};
const SKEY = 'studio:' + (P.id || P.name + ':' + P.noun);
const OLD_KEY = 'button-studio:' + P.name + ':' + P.noun; // saved by the button studio before it had modules

/** A value another module offers to follow: 'accent', 'fonts', 'light'. */
const SHARING = new Set(); // modules whose share() is running: one that asks shared() from inside its own share() is skipped
function shared(k) {
  for (const m of STUDIO.mods) {
    if (!m.share || SHARING.has(m.id)) continue;
    SHARING.add(m.id);
    try { const v = m.share(ST[m.id]); if (v && v[k] != null) return v[k]; } catch (e) { report(m.id + ' share: ' + e.message); } finally { SHARING.delete(m.id); }
  }
  return null;
}

/* ---- history: call commit() before changing a module's state ---- */
function commit(mid = NAV.mod, others = []) {
  const e = { mod: mid, s: clone(ST[mid]) };
  const also = others.filter((id) => id !== mid && STUDIO.has(id));
  if (also.length) e.also = Object.fromEntries(also.map((id) => [id, clone(ST[id])]));
  HIST.undo.push(e);
  if (HIST.undo.length > 60) HIST.undo.shift();
  HIST.redo.length = 0;
}
function travel(from, to) {
  const e = from.pop();
  if (!e || !STUDIO.has(e.mod)) return;
  const back = { mod: e.mod, s: clone(ST[e.mod]) };
  if (e.also) back.also = Object.fromEntries(Object.keys(e.also).filter((id) => STUDIO.has(id)).map((id) => [id, clone(ST[id])]));
  to.push(back);
  setState(e.mod, e.s);
  for (const id in e.also || {}) if (STUDIO.has(id)) setState(id, e.also[id]);
  NAV.mod = e.mod;
  redrawAll(); save();
}
const undo = () => travel(HIST.undo, HIST.redo);
const redo = () => travel(HIST.redo, HIST.undo);

/** The keys of a module whose value differs from the baseline. */
function changedKeys(mid, s = ST[mid]) {
  const m = STUDIO.by[mid], d = DEFS[mid];
  return m.keys.filter((k) => !m.transient.includes(k) && k in d && !sameValue(JSON.stringify(s[k]), JSON.stringify(d[k])));
}
const sameLook = (mid, a, b) => STUDIO.by[mid].keys.every((k) => STUDIO.by[mid].transient.includes(k) || JSON.stringify(a[k]) === JSON.stringify(b[k]));

function snapshot() {
  const { ask, pending, fresh: f, known, expanded, fine, seen, devAt } = UI;
  const mods = {};
  for (const m of STUDIO.mods) {
    mods[m.id] = Object.assign({}, KEPT.keys[m.id] || {}, ST[m.id]); // values kept for choices not offered right now ride along
    m.transient.forEach((k) => { mods[m.id][k] = DEFS[m.id][k]; });
  }
  for (const id in KEPT.mods) if (!STUDIO.has(id)) mods[id] = KEPT.mods[id]; // a studio not open on this page keeps its picks
  return {
    v: 3, mods, view: V, nav: NAV, pins: [...PINS, ...KEPT.pins], scope: Object.assign({}, KEPT.scope || {}, SCOPE), hist: { undo: HIST.undo.slice(-30), redo: HIST.redo.slice(-30) },
    ui: { ask, pending, fresh: f, known, expanded, fine, seen, devAt }, scroll: scrollY, at: Date.now(),
  };
}

/** A saved state for one module, keeping only values that still make sense for this page. Returns a full state.
    With note, a value that cannot be used is remembered in KEPT (and LOST, to tell the person) instead of vanishing. */
function cleanState(mid, saved, note) {
  const m = STUDIO.by[mid], out = fresh(mid);
  if (!saved || typeof saved !== 'object') return out;
  const keep = (k, v) => {
    if (!note) return;
    (KEPT.keys[mid] = KEPT.keys[mid] || {})[k] = v;
    LOST.push({ mid, k, v });
  };
  for (const k in saved) if (!(k in out) && note) (KEPT.keys[mid] = KEPT.keys[mid] || {})[k] = saved[k]; // a category not here today
  for (const k in out) {
    if (!(k in saved) || m.transient.includes(k)) continue;
    const v = saved[k];
    if (typeof v !== typeof out[k]) { keep(k, v); continue; }
    const cs = ctlsFor(mid, k);
    const sw = cs.find((c) => c.t === 'swatches');
    if (sw) { if (sw.sw.some((w) => w[0] === v)) out[k] = v; else keep(k, v); continue; }
    const chips = cs.filter((c) => c.t === 'chips');
    const free = cs.some((c) => c.t !== 'chips');
    if (chips.length && !free && !chips.some((c) => optOf(c, v))) { keep(k, v); continue; } // a choice that no longer exists
    const r = cs.find((c) => c.t === 'range');
    out[k] = r && typeof v === 'number' ? Math.min(r.max, Math.max(r.min, v)) : v;
    if (note && KEPT.keys[mid]) delete KEPT.keys[mid][k];
  }
  if (m.fix) m.fix(out);
  return out;
}
/** A pin's foundations, cleaned like any saved state; studios not on this page are left out of the drawing. */
const cleanCtx = (ctx) => Object.fromEntries(Object.entries(ctx && typeof ctx === 'object' ? ctx : {}).filter(([id, s]) => STUDIO.has(id) && s && typeof s === 'object').map(([id, s]) => [id, cleanState(id, s)]));

/** Takes a saved snapshot back. Only data is read from it: nothing in it is ever run. */
function restore(d) {
  if (!d || typeof d !== 'object') return false;
  if (d.v === 2 && d.S) d = { v: 3, mods: { button: d.S }, view: { device: d.S.device, bg: d.S.bg, rm: d.S.rm }, ui: d.ui, scroll: d.scroll, at: d.at }; // the button studio's older format
  if (d.v !== 3 || !d.mods) return false;
  for (const m of STUDIO.mods) if (d.mods[m.id]) setState(m.id, cleanState(m.id, d.mods[m.id], true));
  for (const id in d.mods) if (!STUDIO.has(id) && d.mods[id] && typeof d.mods[id] === 'object') KEPT.mods[id] = d.mods[id];
  const vw = d.view || {};
  if (DEV[vw.device]) V.device = vw.device;
  if (typeof vw.bg === 'string') V.bg = vw.bg;
  if (typeof vw.rm === 'boolean') V.rm = vw.rm;
  if (['alone', 'context', 'compare', 'states'].includes(vw.mode)) V.mode = vw.mode;
  const n = d.nav || {};
  if (STUDIO.has(n.mod)) NAV.mod = n.mod;
  NAV.review = !!n.review;
  for (const m of STUDIO.mods) { const c = n.cat && n.cat[m.id]; if (c === 'looks' || m.groups.some((g) => g.id === c)) NAV.cat[m.id] = c; }
  PINS.length = 0; KEPT.pins.length = 0;
  for (const p of Array.isArray(d.pins) ? d.pins : []) {
    if (!p || typeof p !== 'object') continue;
    if (!STUDIO.has(p.mod)) { if (KEPT.pins.length < 21) KEPT.pins.push(p); continue; }
    if (PINS.filter((x) => x.mod === p.mod).length >= PIN_MAX) continue;
    PINS.push({ id: String(p.id), name: String(p.name || '').slice(0, 60), mod: p.mod, s: cleanState(p.mod, p.s), ctx: cleanCtx(p.ctx) });
  }
  for (const k in SCOPE) delete SCOPE[k];
  KEPT.scope = {};
  if (typeof d.scope === 'string' && d.scope) { for (const m of STUDIO.mods) if (!m.reach) SCOPE[m.id] = d.scope; } // one reach for the whole page, from before each studio had its own
  else if (d.scope && typeof d.scope === 'object') {
    for (const [id, v] of Object.entries(d.scope)) {
      const m = STUDIO.by[id];
      if (m && reachOf(m).some((r) => r[0] === v)) SCOPE[id] = v; else if (!m) KEPT.scope[id] = v;
    }
  }
  const histEntry = (e) => {
    const out = { mod: e.mod, s: cleanState(e.mod, e.s) };
    const also = Object.entries(e.also && typeof e.also === 'object' ? e.also : {}).filter(([id]) => STUDIO.has(id));
    if (also.length) out.also = Object.fromEntries(also.map(([id, s]) => [id, cleanState(id, s)]));
    return out;
  };
  for (const side of ['undo', 'redo']) {
    HIST[side] = ((d.hist && d.hist[side]) || []).filter((e) => e && STUDIO.has(e.mod)).slice(-30).map(histEntry);
  }
  const u = d.ui || {}, a = u.ask || {};
  Object.assign(UI, {
    ask: { target: a.target && a.target in CT ? a.target : null, text: String(a.text || '').slice(0, 400) },
    pending: u.pending || null, fresh: u.fresh || [], known: u.known || [], expanded: u.expanded || {}, fine: u.fine || {},
    seen: Object.assign({ dev: [], bg: [], rm: false, mode: [] }, u.seen || {}), devAt: u.devAt || null, scroll: d.scroll || 0,
  });
  return true;
}

/** What restore could not use, in plain words: 'Material “brushed”, Shape “blob”'. */
function lostWords() {
  return LOST.slice(0, 4).map((x) => { const c = ctlsFor(x.mid, x.k)[0]; return `${c ? c.label : x.k} “${String(x.v).slice(0, 30)}”`; }).join(', ') + (LOST.length > 4 ? ` and ${LOST.length - 4} more` : '');
}

/** The server copy and the browser copy can differ; the newer one wins. */
const newest = (a, b) => (!a ? b : !b ? a : (b.at || 0) > (a.at || 0) ? b : a);

/* On claude.ai the store takes one write at a time per document: the newest snapshot waits for the last write. */
let cloudNext = null, cloudBusy = false;
async function cloudSave(snap) {
  cloudNext = clone(snap);
  if (cloudBusy) return;
  cloudBusy = true;
  try {
    const db = await STORE;
    while (db && cloudNext) {
      const s = cloudNext;
      cloudNext = null;
      try { await db.doc(STATE_DOC).set(s); } catch { break; }
    }
  } finally { cloudBusy = false; }
}

let saveTimer = 0, cloudTimer = 0, HOLDING = false;
function save(now) {
  clearTimeout(saveTimer);
  const go = () => {
    if (HOLDING) return; // while a baseline is being held up to compare, the real picks are parked
    const snap = snapshot();
    try { localStorage.setItem(SKEY, JSON.stringify(snap)); } catch {}
    if (LIVE) api('/api/state', snap).catch(() => {});
    if (CLOUD) { clearTimeout(cloudTimer); cloudTimer = setTimeout(() => cloudSave(snap), now ? 0 : 800); }
  };
  if (now) go(); else saveTimer = setTimeout(go, 250);
}
addEventListener('pagehide', () => { if (!HOLDING) try { localStorage.setItem(SKEY, JSON.stringify(snapshot())); } catch {} });
