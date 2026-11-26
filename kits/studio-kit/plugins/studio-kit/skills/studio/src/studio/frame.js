/* ===== Frame: the stage the preview sits on: its views, device, background, Less motion, pins and hold ===== */

const BGS = [
  ...(P.pageBg ? [['page', 'Your page']] : []),
  ['black', 'Black'], ['light', 'Light grey'], ['cool', 'Colourful'], ['warm', 'Warm colours'], ['aurora', 'Night sky'],
  ['sunset', 'Sunset'], ['paper', 'Paper'], ['grid', 'Grid'], ['checker', 'Checker'],
  ...(Array.isArray(MO.bg) ? MO.bg : []).filter(Array.isArray).map((e) => [String(e[0]), String(e[1] || e[0])]),
];
const MODES = [['alone', 'On its own'], ['context', 'In a page'], ['compare', 'Compare'], ['states', 'States']];
const modeNow = () => (V.mode === 'states' && !AM().states ? 'alone' : V.mode);
const baseName = (m) => (m.measured ? 'Today' : 'Starting point');
const bgLight = () => ['light', 'paper'].includes(V.bg) || (V.bg === 'page' && COLOUR.HEX.test(P.pageBg) && COLOUR.lum(P.pageBg) > 0.3);
const bgAttr = () => `data-bg="${esc(V.bg)}"${V.bg === 'page' ? ` style="background:${esc(P.pageBg)}"` : ''}`;

/** Width of the column the preview is laid out in: a phone's screen, or the project's content column. */
function frameVars() {
  return { '--col': V.device === 'phone' ? '100vw' : COLUMN + 'px', '--gut': (DEV[V.device] || DEV.computer).gut + 'px' };
}
/** Sets the button's custom properties without redrawing it: what a slider does while it is dragged. */
function applyVars() {
  const m = $('mount');
  if (m && STUDIO.has('button')) { const v = Object.assign(STUDIO.by.button.vars(S), frameVars()); for (const k in v) m.style.setProperty(k, v[k]); }
  stageState();
}
function stageState() {
  const d = $('device'), m = AM();
  d.dataset.bg = V.bg;
  d.style.background = V.bg === 'page' ? P.pageBg : '';
  $('stage').classList.toggle('rm', V.rm === true);
  $('pcol').classList.toggle('tall', modeNow() !== 'alone' || !!(m.tall && m.tall()));
}

/* ---- what the stage shows ---- */
function compareHTML() {
  const m = AM(), mid = m.id, now = AS();
  const pins = PINS.filter((p) => p.mod === mid);
  const col = (name, s, key, extra = '') => `<figure class="cmp${key === 'now' ? ' now' : ''}"><div class="cmp-art" style="${varsCss(m.vars(s))}">${m.still(s, { compare: true })}</div>`
    + `<figcaption><b>${esc(name)}</b>${key !== 'now' && !sameLook(mid, s, now) ? `<button class="mini" data-use="${esc(key)}">Use this</button>` : ''}${extra}</figcaption></figure>`;
  return col(baseName(m), DEFS[mid], 'base')
    + pins.map((p) => col(p.name, p.s, p.id, `<button class="mini q" data-unpin="${esc(p.id)}" aria-label="Remove ${esc(p.name)}">Remove</button>`)).join('')
    + col('Now', now, 'now')
    + (pins.length ? '' : '<p class="cmp-tip">Press <b>Pin</b> on a version you like, keep exploring, and it stays here beside what you have now. Up to three.</p>');
}
function statesHTML() {
  const m = AM(), s = AS(), v = varsCss(m.vars(s));
  return m.states.map(([id, n]) => `<figure class="cmp sm"><div class="cmp-art" style="${v}">${m.still(s, { state: id })}</div><figcaption><b>${esc(n)}</b></figcaption></figure>`).join('')
    + (m.stateNote ? `<p class="cmp-tip">${esc(m.stateNote)}</p>` : '');
}
function stageHint() {
  const mode = modeNow();
  if (HOLDING) return 'Showing ' + baseName(AM()).toLowerCase();
  if (mode === 'context') return CX.real ? 'Your page, simplified' : 'An example page with your words. Not your real page.';
  if (mode === 'compare') return '';
  if (mode === 'states') return 'Every state at once';
  return NAV.mod === 'button' ? 'Press the button to try it' : '';
}
function renderStage() {
  const m = AM(), cv = $('canvas'), mode = modeNow();
  if (STUDIO.has('button')) STUDIO.by.button.reset(); // stops any after-press sequence still running
  cv.className = 'canvas mode-' + mode;
  cv.scrollTop = 0;
  try {
    if (mode === 'compare') cv.innerHTML = compareHTML();
    else if (mode === 'states') cv.innerHTML = statesHTML();
    else if (mode === 'context') { cv.innerHTML = sceneHTML(); paintScene(); }
    else m.live(cv, AS());
  } catch (e) { report(m.id + ' preview: ' + e.message); cv.innerHTML = '<p class="cmp-tip">This preview could not be drawn. The agent has been told.</p>'; }
  $('tryhint').textContent = stageHint();
  $('tryhint').hidden = !stageHint();
  stageState();
  layoutDevice();
}
/** Redraws after a slider moves: only as much as the view needs. */
function refreshLive() {
  const mode = modeNow();
  if (mode === 'context') { paintSceneVars(); applyVars(); }
  else if (mode === 'alone' && NAV.mod === 'button') applyVars();
  else if (mode === 'alone') AM().live($('canvas'), AS());
  else renderStage();
}

/* Your own device fills the preview at actual size, unless the project's column is wider than the preview.
   Another device is drawn at its real width and scaled down only when it cannot fit. The label says which. */
function layoutDevice() {
  const st = $('stage'), d = $('device'), w0 = st.clientWidth, h0 = st.clientHeight;
  if (!w0 || !h0) return;
  const k = V.device, D = DEV[k], own = k === VIEW;
  let w = w0, h = h0, s = 1;
  if (own) {
    const need = k === 'computer' && modeNow() === 'alone' ? COLUMN + 2 * D.gut : 0;
    if (need > w0) { w = need; s = w0 / need; h = h0 / s; }
  } else {
    w = D.w;
    s = Math.min(1, (w0 - 32) / w);
    h = Math.min(D.h, (h0 - 32) / s);
  }
  d.style.width = w + 'px';
  d.style.height = h + 'px';
  d.style.transform = s < 1 ? `scale(${s})` : '';
  d.classList.toggle('framed', !own);
  const wr = $('dwrap');
  Object.assign(wr.style, { width: w * s + 'px', height: h * s + 'px', left: Math.round((w0 - w * s) / 2) + 'px', top: Math.round((h0 - h * s) / 2) + 'px' });
  $('devhint').textContent = `${D.n} · ${own ? 'this device' : D.w + ' px wide'} · ${s < 1 ? 'shown at ' + Math.round(s * 100) + '%' : 'actual size'}`;
}

function seen(kind, v) { if (!UI.seen[kind].includes(v)) UI.seen[kind].push(v); }
const seg = (items, cur, attr) => items.map(([k, n, title]) => `<button role="radio" data-${attr}="${k}" aria-checked="${cur === k}"${title ? ` title="${esc(title)}"` : ''}>${esc(n)}</button>`).join('');
function renderStageBar() {
  const m = AM();
  $('modes').innerHTML = seg(MODES.filter(([k]) => k !== 'states' || m.states), modeNow(), 'mode');
  $('devices').innerHTML = seg(Object.entries(DEV).map(([k, d]) => [k, d.n, d.n + (k === VIEW ? ' (this device)' : '')]), V.device, 'dev');
  $('bgsel').value = V.bg;
  $('rmtog').setAttribute('aria-pressed', String(V.rm));
  $('hold').textContent = 'Hold for ' + baseName(m).toLowerCase();
  $('hold').disabled = !changedKeys(m.id).length;
  const full = PINS.length >= 3;
  $('pin').disabled = full || PINS.some((p) => p.mod === m.id && sameLook(m.id, p.s, AS()));
  $('pin').title = full ? 'Three are pinned. Remove one in Compare to pin another.' : 'Keep this version to compare with later ones';
}
function setMode(k) {
  V.mode = k;
  seen('mode', k);
  renderStageBar(); renderStage(); save();
}
function setDevice(k) {
  V.device = k;
  UI.devAt = VIEW;
  seen('dev', k);
  renderStageBar(); renderStage(); save();
  if (NAV.review) renderPanel();
}
function setBg(v) {
  V.bg = v;
  seen('bg', v);
  renderStage(); renderPanel(); save();
}
function setRm(on) {
  V.rm = on;
  if (on) UI.seen.rm = true;
  renderStageBar(); renderStage(); renderPanel(); save();
}

/* ---- pins, and holding the baseline up against what you have ---- */
function pinNow() {
  const m = AM(), s = AS();
  if (PINS.length >= 3) return msg('Three versions are pinned already. Remove one in Compare first.', 'warn');
  const letter = ['A', 'B', 'C'].find((l) => !PINS.some((p) => p.name.startsWith(l + ' ·') || p.name === l));
  const what = m.summary ? m.summary(s) : (() => { const c = m.groups[0] && m.groups[0].ctl.find((x) => x.t === 'chips'); const op = c && optOf(c, s[c.k]); return op ? op.n : ''; })();
  PINS.push({ id: 'p' + Date.now().toString(36), name: letter + (what ? ' · ' + what : ''), mod: m.id, s: clone(s) });
  renderStageBar(); save();
  if (modeNow() === 'compare') renderStage();
  else msg(`Pinned as ${esc(PINS[PINS.length - 1].name)}. <button class="chip sm" data-mode="compare">Compare</button>`, 'ok');
}
function usePinned(key) {
  const mid = NAV.mod, p = PINS.find((x) => x.id === key);
  const s = key === 'base' ? fresh(mid) : p && clone(p.s);
  if (!s) return;
  commit(mid);
  setState(mid, s);
  redrawAll(); save();
  msg(`Now using ${esc(key === 'base' ? baseName(AM()).toLowerCase() : p.name)}. Undo brings back what you had.`, 'ok');
}
function unpin(id) {
  const i = PINS.findIndex((p) => p.id === id);
  if (i >= 0) PINS.splice(i, 1);
  renderStageBar(); renderStage(); save();
}
let held = null;
function holdOn() {
  if (HOLDING || !changedKeys(NAV.mod).length) return;
  HOLDING = true;
  held = { mod: NAV.mod, s: AS() };
  setState(held.mod, fresh(held.mod));
  renderStage();
  $('hold').classList.add('on');
}
function holdOff() {
  if (!HOLDING) return;
  setState(held.mod, held.s);
  held = null;
  HOLDING = false;
  renderStage();
  $('hold').classList.remove('on');
}
