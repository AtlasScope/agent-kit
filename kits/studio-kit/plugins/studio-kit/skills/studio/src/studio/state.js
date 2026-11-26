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

const HIST = { undo: [], redo: [] }; // [{ mod, s }] the state a module had before a change
const PINS = []; // [{ id, name, mod, s }] up to three versions kept to compare
let SCOPE = ''; // how far the proposal should reach: 'one' | 'family' | 'system'
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
function shared(k) {
  for (const m of STUDIO.mods) {
    if (!m.share) continue;
    try { const v = m.share(ST[m.id]); if (v && v[k] != null) return v[k]; } catch {}
  }
  return null;
}

/* ---- history: call commit() before changing a module's state ---- */
function commit(mid = NAV.mod) {
  HIST.undo.push({ mod: mid, s: clone(ST[mid]) });
  if (HIST.undo.length > 60) HIST.undo.shift();
  HIST.redo.length = 0;
}
function travel(from, to) {
  const e = from.pop();
  if (!e || !STUDIO.has(e.mod)) return;
  to.push({ mod: e.mod, s: clone(ST[e.mod]) });
  setState(e.mod, e.s);
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
  for (const m of STUDIO.mods) { mods[m.id] = Object.assign({}, ST[m.id]); m.transient.forEach((k) => { mods[m.id][k] = DEFS[m.id][k]; }); }
  return {
    v: 3, mods, view: V, nav: NAV, pins: PINS, scope: SCOPE, hist: { undo: HIST.undo.slice(-30), redo: HIST.redo.slice(-30) },
    ui: { ask, pending, fresh: f, known, expanded, fine, seen, devAt }, scroll: scrollY, at: Date.now(),
  };
}

/** A saved state for one module, keeping only values that still make sense for this page. Returns a full state. */
function cleanState(mid, saved) {
  const m = STUDIO.by[mid], out = fresh(mid);
  if (!saved || typeof saved !== 'object') return out;
  for (const k in out) {
    if (!(k in saved) || m.transient.includes(k)) continue;
    const v = saved[k];
    if (typeof v !== typeof out[k]) continue;
    const cs = ctlsFor(mid, k);
    const sw = cs.find((c) => c.t === 'swatches');
    if (sw) { if (sw.sw.some((w) => w[0] === v)) out[k] = v; continue; }
    const chips = cs.filter((c) => c.t === 'chips');
    const free = cs.some((c) => c.t !== 'chips');
    if (chips.length && !free && !chips.some((c) => optOf(c, v))) continue; // a choice that no longer exists
    const r = cs.find((c) => c.t === 'range');
    out[k] = r && typeof v === 'number' ? Math.min(r.max, Math.max(r.min, v)) : v;
  }
  if (m.fix) m.fix(out);
  return out;
}

/** Takes a saved snapshot back. Only data is read from it: nothing in it is ever run. */
function restore(d) {
  if (!d || typeof d !== 'object') return false;
  if (d.v === 2 && d.S) d = { v: 3, mods: { button: d.S }, view: { device: d.S.device, bg: d.S.bg, rm: d.S.rm }, ui: d.ui, scroll: d.scroll, at: d.at }; // the button studio's older format
  if (d.v !== 3 || !d.mods) return false;
  for (const m of STUDIO.mods) if (d.mods[m.id]) setState(m.id, cleanState(m.id, d.mods[m.id]));
  const vw = d.view || {};
  if (DEV[vw.device]) V.device = vw.device;
  if (typeof vw.bg === 'string') V.bg = vw.bg;
  if (typeof vw.rm === 'boolean') V.rm = vw.rm;
  if (['alone', 'context', 'compare', 'states'].includes(vw.mode)) V.mode = vw.mode;
  const n = d.nav || {};
  if (STUDIO.has(n.mod)) NAV.mod = n.mod;
  NAV.review = !!n.review;
  for (const m of STUDIO.mods) { const c = n.cat && n.cat[m.id]; if (c === 'looks' || m.groups.some((g) => g.id === c)) NAV.cat[m.id] = c; }
  PINS.length = 0;
  for (const p of Array.isArray(d.pins) ? d.pins.slice(0, 3) : []) if (p && STUDIO.has(p.mod)) PINS.push({ id: String(p.id), name: String(p.name || '').slice(0, 60), mod: p.mod, s: cleanState(p.mod, p.s) });
  SCOPE = ['one', 'family', 'system'].includes(d.scope) ? d.scope : '';
  for (const side of ['undo', 'redo']) {
    HIST[side] = ((d.hist && d.hist[side]) || []).filter((e) => e && STUDIO.has(e.mod)).slice(-30).map((e) => ({ mod: e.mod, s: cleanState(e.mod, e.s) }));
  }
  const u = d.ui || {}, a = u.ask || {};
  Object.assign(UI, {
    ask: { target: a.target && a.target in CT ? a.target : null, text: String(a.text || '').slice(0, 400) },
    pending: u.pending || null, fresh: u.fresh || [], known: u.known || [], expanded: u.expanded || {}, fine: u.fine || {},
    seen: Object.assign({ dev: [], bg: [], rm: false, mode: [] }, u.seen || {}), devAt: u.devAt || null, scroll: d.scroll || 0,
  });
  return true;
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
