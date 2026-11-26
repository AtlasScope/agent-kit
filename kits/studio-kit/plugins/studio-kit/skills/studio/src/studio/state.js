/* ===== State: the person's picks, locks and view, saved in the browser and on the local server ===== */

const DEF = Object.assign({}, DEFAULTS, { bg: P.pageBg ? 'page' : 'cool', device: VIEW, rm: RM_OS, menuOpen: false });
for (const k in P.today) if (k in DEF) DEF[k] = P.today[k];
fixDefaults(DEF);
const fresh = () => JSON.parse(JSON.stringify(DEF));

let S = fresh();
const locked = {}; // step id -> true once Next was pressed on it
const stale = {}; // step id -> true when a step it depends on changed after it was locked
let cur = 0; // current step index; REVIEW is the review page
const UI = {
  compose: null, text: '', focusCompose: false, // the open "Add more choices" box and what is typed in it
  pending: null, // the last request sent to the agent
  fresh: [], known: [], // choices marked new, and every added choice seen so far
  expanded: {}, fine: {}, // long lists opened, Fine-tune sections opened
  seen: { dev: [], bg: [], rm: false }, // which views were looked at, for Review and the spec
  devAt: null, scroll: 0,
};
const SKEY = 'button-studio:' + P.name + ':' + P.noun;

function snapshot() {
  const { compose, text, pending, fresh: f, known, expanded, fine, seen, devAt } = UI;
  return { v: 2, S: Object.assign({}, S, { menuOpen: false }), locked, stale, cur, ui: { compose, text, pending, fresh: f, known, expanded, fine, seen, devAt }, scroll: scrollY, at: Date.now() };
}

/** Takes a saved snapshot back, keeping only values that still make sense for this page. */
function restore(d) {
  if (!d || d.v !== 2 || !d.S) return;
  for (const k in DEF) {
    if (!(k in d.S) || k === 'menuOpen') continue;
    const v = d.S[k];
    if (typeof v !== typeof DEF[k]) continue;
    if (k === 'swatch') { if (SW.some((w) => w[0] === v)) S[k] = v; continue; }
    const cs = ctlsFor(k);
    const chips = cs.filter((c) => c.t === 'chips');
    const free = cs.some((c) => c.t !== 'chips');
    if (chips.length && !free && !chips.some((c) => optOf(c, v))) continue; // a choice that no longer exists
    const r = cs.find((c) => c.t === 'range');
    S[k] = r && typeof v === 'number' ? Math.min(r.max, Math.max(r.min, v)) : v;
  }
  fixState(S);
  Object.assign(locked, d.locked || {});
  Object.assign(stale, d.stale || {});
  for (const k in locked) if (!STEPS.some((st) => st.id === k)) { delete locked[k]; delete stale[k]; }
  cur = Math.min(Math.max(0, d.cur | 0), REVIEW);
  const u = d.ui || {};
  Object.assign(UI, {
    compose: u.compose && (u.compose in CT || /^step:/.test(u.compose)) ? u.compose : null, text: u.text || '',
    pending: u.pending || null, fresh: u.fresh || [], known: u.known || [], expanded: u.expanded || {}, fine: u.fine || {},
    seen: Object.assign({ dev: [], bg: [], rm: false }, u.seen || {}), devAt: u.devAt || null, scroll: d.scroll || 0,
  });
}

/** The server copy and the browser copy can differ; the newer one wins. */
const newest = (a, b) => (!a ? b : !b ? a : (b.at || 0) > (a.at || 0) ? b : a);

/* On claude.ai the store takes one write at a time per document: the newest snapshot waits for the last write. */
let cloudNext = null, cloudBusy = false;
async function cloudSave(snap) {
  cloudNext = JSON.parse(JSON.stringify(snap));
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

let saveTimer = 0, cloudTimer = 0;
function save(now) {
  clearTimeout(saveTimer);
  const go = () => {
    const snap = snapshot();
    try { localStorage.setItem(SKEY, JSON.stringify(snap)); } catch {}
    if (LIVE) api('/api/state', snap).catch(() => {});
    if (CLOUD) { clearTimeout(cloudTimer); cloudTimer = setTimeout(() => cloudSave(snap), now ? 0 : 800); }
  };
  if (now) go(); else saveTimer = setTimeout(go, 250);
}
addEventListener('pagehide', () => { try { localStorage.setItem(SKEY, JSON.stringify(snapshot())); } catch {} });
