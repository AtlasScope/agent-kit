/* ===== Frame: the stage the preview sits on: its views, device, background, Less motion, pins and hold ===== */

const BGS = [
  ['page', P.pageBg || (P.palette && P.palette.roles) ? 'Your page' : 'Plain page'],
  ['studio', 'Quiet dark'], ['black', 'Black'], ['white', 'White'], ['light', 'Light grey'], ['cool', 'Colourful'], ['warm', 'Warm colours'], ['aurora', 'Night sky'],
  ['sunset', 'Sunset'], ['paper', 'Paper'], ['grid', 'Grid'], ['checker', 'Checker'],
  ...(Array.isArray(MO.bg) ? MO.bg : []).filter(Array.isArray).map((e) => [String(e[0]), String(e[1] || e[0])]),
];
const MODES = [['alone', 'Up close'], ['context', 'In a page'], ['compare', 'Compare'], ['states', 'States']];
const modeNow = () => (V.mode === 'states' && !AM().states ? 'alone' : V.mode);
const baseName = (m) => (m.measured ? 'Today' : 'Starting point');
/** The project's own page: the palette being chosen when there is one, else the project's page colour, else a plain
    light page for a project that has no design yet. Designs are judged where they will live, never on the studio's black. */
const pageColour = () => { const r = shared('roles'); return (r && r.page) || (COLOUR.HEX.test(P.pageBg) ? P.pageBg : '#F4F6F9'); };
const bgLight = () => ['light', 'paper'].includes(V.bg) || (V.bg === 'page' && COLOUR.lum(pageColour()) > 0.3);
const bgAttr = () => `data-bg="${esc(V.bg)}"${V.bg === 'page' ? ` style="background:${esc(pageColour())}"` : ''}`;

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
  d.style.background = V.bg === 'page' ? pageColour() : '';
  $('stage').classList.toggle('rm', V.rm === true);
  $('pcol').classList.toggle('tall', modeNow() === 'alone' && !!(m.tall && m.tall()));
}

/* ---- what the workspace shows ----
   Choices: the catalogue, with the selected design drawn live in the preview card beside it.
   In a page: the example page across the workspace, at a chosen screen width.
   Compare and States: plain cards across the workspace, every drawing at the same scale on the same ground. These are
   not drawn inside a simulated device: a device frame around a comparison only makes everything smaller. */
const boardMode = () => ['compare', 'states'].includes(modeNow());
/** A drawing for Compare, Review and States. ctx: other studios' states to draw it with (the foundations it was made
    with), so a shortlisted or baseline version stays faithful when the palette, type or surfaces change later. */
function cmpArt(m, s, opt, ctx) {
  return withCtx(ctx, () => {
    let inner;
    try { inner = m.still(s, opt); } catch (e) { report(m.id + ' drawing: ' + e.message); inner = ''; }
    return `<div class="cmp-art${m.ground ? ' ground' : ' bgd'}" ${m.ground ? '' : bgAttr()}><span class="art-in cmp-in ${dimCls(m.id, s)}" style="${varsCss(m.vars(s))}">${inner}</span></div>`;
  });
}
/** Names of the studios whose foundations differ between a pin's ctx and now: 'Palette and Surface'. */
const ctxDiff = (ctx) => STUDIO.mods.filter((x) => ctx && ctx[x.id] && !sameLook(x.id, ctx[x.id], ST[x.id])).map((x) => x.name);
function compareHTML() {
  const m = AM(), mid = m.id, now = AS();
  const pins = PINS.filter((p) => p.mod === mid);
  const sum = (s) => { try { return m.summary ? m.summary(s) : ''; } catch { return ''; } };
  const baseCtx = foundations(mid, DEFS);
  const card = (name, badge, s, key, extra = '', ctx = null) => {
    const diff = ctx ? ctxDiff(ctx) : [];
    const note = diff.length ? `<p class="cmp-ctx">${key === 'base' ? `Drawn with ${m.measured ? 'today’s' : 'the starting'} ${esc(list(diff).toLowerCase())}` : `Drawn with the ${esc(list(diff).toLowerCase())} it was shortlisted with`}</p>` : '';
    return `<figure class="cmp${key === 'now' ? ' cur' : ''}"><div class="cmp-top"><b>${esc(name)}</b><span>${esc(badge)}</span></div>${cmpArt(m, s, { compare: true }, ctx)}`
      + `<figcaption class="cmp-foot"><p>${esc(sum(s))}</p>${note}${key !== 'now' && !(sameLook(mid, s, now) && !diff.length) ? `<button class="mini" data-use="${esc(key)}">Use this</button>` : key !== 'now' ? '<span>In use now</span>' : ''}${extra}</figcaption></figure>`;
  };
  const nowPinned = pins.some((p) => sameLook(mid, p.s, now)) || sameLook(mid, DEFS[mid], now);
  return card(baseName(m), m.measured ? 'Measured' : 'Starting point', DEFS[mid], 'base', '', baseCtx)
    + pins.map((p) => card(p.name, 'Shortlisted', p.s, p.id, `<button class="mini q" data-unpin="${esc(p.id)}" aria-label="Remove ${esc(p.name)} from the shortlist">Remove</button>`, p.ctx)).join('')
    + (nowPinned ? '' : card('Now', 'Not shortlisted', now, 'now', '<button class="mini q" data-act="pin">Shortlist</button>'))
    + (pins.length ? '' : `<p class="cmp-tip">Press <b>Shortlist</b> on a version you like, keep exploring, and it waits here beside ${esc(baseName(m).toLowerCase())}. Up to three.</p>`);
}
function statesHTML() {
  const m = AM(), s = AS();
  return m.states.map(([id, n]) => `<figure class="cmp"><div class="cmp-top"><b>${esc(n)}</b></div>${cmpArt(m, s, { state: id })}</figure>`).join('')
    + (m.stateNote ? `<p class="cmp-tip">${esc(m.stateNote)}</p>` : '');
}
function stageHint() {
  const mode = modeNow();
  if (HOLDING) return 'Showing ' + baseName(AM()).toLowerCase();
  if (mode === 'context') return CX.real ? 'Your page, simplified' : 'A representative page with your words. Not your live page.';
  return mode === 'alone' && NAV.mod === 'button' && !UI.tried ? 'Press it to try it' : '';
}
function renderStage() {
  const m = AM(), cv = $('canvas'), mode = modeNow(), board = $('board'), work = $('work');
  if (STUDIO.has('button')) STUDIO.by.button.reset(); // stops any after-press sequence still running
  work.classList.toggle('wide', mode !== 'alone');
  work.classList.toggle('boarded', boardMode());
  board.hidden = !boardMode();
  board.className = 'board' + (mode === 'states' ? ' states' : '');
  cv.className = 'canvas mode-' + mode + (mode === 'alone' && m.ground ? ' fill' : '') + (mode === 'alone' ? ' ' + dimCls(m.id, AS()) : '');
  cv.scrollTop = 0;
  try {
    if (mode === 'compare') { cv.innerHTML = ''; board.innerHTML = compareHTML(); }
    else if (mode === 'states') { cv.innerHTML = ''; board.innerHTML = statesHTML(); }
    else {
      board.innerHTML = '';
      if (mode === 'context') { cv.innerHTML = sceneHTML(); paintScene(); } else m.live(cv, AS());
    }
  } catch (e) { report(m.id + ' preview: ' + e.message); (boardMode() ? board : cv).innerHTML = '<p class="cmp-tip">This preview could not be drawn. The agent has been told.</p>'; }
  if (boardMode()) fitArt(board);
  $('tryhint').textContent = stageHint();
  $('tryhint').hidden = !stageHint();
  $('ptitle').textContent = 'Your ' + m.title();
  if (typeof renderHead === 'function') renderHead();
  stageState();
  layoutDevice();
}
/** Redraws after a slider moves: only as much as the view needs. */
function refreshLive() {
  const mode = modeNow();
  if (mode === 'context') { paintSceneVars(); applyVars(); }
  else if (mode === 'alone' && NAV.mod === 'button') { applyVars(); layoutDevice(); }
  else if (mode === 'alone') AM().live($('canvas'), AS());
  else renderStage();
}

/* In the preview card the design is drawn at its real size, and scaled down only when it is wider than the card; the
   label says which. In a page, your own device fills the workspace; another device is drawn at its real width and
   scaled down only when it cannot fit. */
function layoutDevice() {
  const st = $('stage'), d = $('device'), cv = $('canvas'), w0 = st.clientWidth, h0 = st.clientHeight;
  if (!w0 || !h0 || boardMode()) return;
  const mode = modeNow();
  let w = w0, h = h0, s = 1, framed = false, hint;
  if (mode === 'context') {
    const k = V.device, D = DEV[k], own = k === VIEW;
    if (!own) { framed = true; w = D.w; s = Math.min(1, (w0 - 32) / w); h = Math.min(D.h, (h0 - 32) / s); }
    hint = `${D.n} · ${own ? 'this screen' : D.w + ' px wide'} · ${s < 1 ? 'shown at ' + Math.round(s * 100) + '%' : 'actual size'}`;
  } else {
    d.style.transform = '';
    d.style.width = w0 + 'px';
    d.style.height = h0 + 'px';
    const need = AM().ground ? 0 : cv.scrollWidth;
    if (need > w0 + 1) { w = need + 24; s = w0 / w; h = h0 / s; }
    else if (!AM().ground && UI.zoom !== false) {
      // Fit: a small design is enlarged to fill the preview, so it reads at any screen size; the label says by how much.
      // the drawing's own extent: its wrapper may span the row, so measure what is inside it
      const c = cv.firstElementChild, kids = c ? [...c.children].filter((k) => k.offsetWidth) : [];
      const rs = kids.map((k) => k.getBoundingClientRect()), cw = rs.length ? Math.max(...rs.map((r) => r.right)) - Math.min(...rs.map((r) => r.left)) : 0;
      const ch = rs.length ? Math.max(...rs.map((r) => r.bottom)) - Math.min(...rs.map((r) => r.top)) : 0;
      const f = cw && ch ? Math.min(2.5, (w0 * 0.6) / cw, (h0 * 0.45) / ch) : 1;
      if (f > 1.05) { s = f; w = w0 / f; h = h0 / f; }
    }
    hint = AM().ground ? (AM().id === 'palette' ? 'Representative, not live' : '') : s < 0.995 || s > 1.005 ? 'Shown at ' + Math.round(s * 100) + '%' : 'Actual size';
    $('zoom').hidden = !!AM().ground || need > w0 + 1;
    $('zoom').textContent = UI.zoom === false ? 'Enlarge' : 'Show actual size';
  }
  d.style.width = w + 'px';
  d.style.height = h + 'px';
  d.style.transform = s !== 1 ? `scale(${s})` : '';
  d.classList.toggle('framed', framed);
  Object.assign($('dwrap').style, { width: w * s + 'px', height: h * s + 'px', left: Math.round((w0 - w * s) / 2) + 'px', top: Math.round((h0 - h * s) / 2) + 'px' });
  $('devhint').textContent = mode === 'alone' && !AM().ground ? '' : hint; // the Actual size card says it better
  previewExtras(s);
}
/** Beside an enlarged design: the same design at its real size; and, once something has changed, a small Today to
    compare against (it opens Compare). The View menu disappears when it has nothing to offer. */
function previewExtras(s) {
  const m = AM(), alone = modeNow() === 'alone' && !m.ground, rs = $('realsz'), tt = $('tthumb');
  rs.hidden = !(alone && s > 1.05);
  if (!rs.hidden) {
    rs.innerHTML = '<span class="rl">Actual size</span>' + art(m, AS(), { compare: true }, 'rart');
    const i = rs.querySelector('.art-in');
    if (i && i.offsetWidth > $('stage').clientWidth * 0.5) rs.hidden = true;
  }
  tt.hidden = !(alone && (changedKeys(m.id).length || HOLDING));
  if (!tt.hidden && !HOLDING) { tt.innerHTML = art(m, DEFS[m.id], { compare: true }) + `<span class="rl">${esc(baseName(m))} · hold to see it</span>`; fitArt(tt); tt.title = 'Hold to see ' + baseName(m).toLowerCase() + ' in the preview; click to compare side by side'; }
  $('vmenu').hidden = $('stbar').hidden && $('zoom').hidden;
}

function seen(kind, v) { if (!UI.seen[kind].includes(v)) UI.seen[kind].push(v); }
const seg = (items, cur, attr) => items.map(([k, n, title]) => `<button role="radio" data-${attr}="${k}" aria-checked="${cur === k}"${title ? ` title="${esc(title)}"` : ''}>${esc(n)}</button>`).join('');
function renderStageBar() {
  const m = AM();
  $('modes').innerHTML = seg(MODES.filter(([k]) => k !== 'states' || modeNow() === 'states'), modeNow(), 'mode'); // States is in View
  $('statesbtn').hidden = !m.states;
  $('devices').innerHTML = seg(Object.entries(DEV).map(([k, d]) => [k, d.n, d.n + (k === VIEW ? ' (this device)' : '')]), V.device, 'dev');
  $('devices').hidden = modeNow() !== 'context';
  $('bgsel').hidden = m.ground && modeNow() === 'alone';
  $('stbar').hidden = m.ground && modeNow() === 'alone'; // a palette or a type specimen brings its own ground and does not move
  $('bgsel').value = V.bg;
  /* Your page, black and white, but never two dots that look the same: a page that is almost black or almost white
     is that dot, which then says so. */
  const pc = pageColour(), pl = COLOUR.lum(pc), own = P.pageBg || (P.palette && P.palette.roles) ? 'your page' : 'your palette’s page';
  const near = pl < 0.02 ? 'black' : pl > 0.85 ? 'white' : '';
  const dots = [...(near ? [] : [['page', cap(own), pc]]), ['black', near === 'black' ? `Black (${own})` : 'Black', near === 'black' ? pc : '#000'], ['white', near === 'white' ? `White (${own})` : 'White', near === 'white' ? pc : '#fff']];
  const on = (v) => V.bg === v || (V.bg === 'page' && v === near);
  $('bgdots').innerHTML = dots.map(([v, n, c]) => `<button data-bgq="${near === v ? 'page' : v}" aria-pressed="${on(v)}" title="${esc(n)}" aria-label="Background: ${esc(n)}" style="background:${esc(c)}"></button>`).join('');
  $('bgdots').hidden = $('bgsel').hidden;
  $('rmtog').setAttribute('aria-pressed', String(V.rm));
  $('hold').textContent = 'Hold to see ' + baseName(m).toLowerCase();
  $('hold').disabled = !changedKeys(m.id).length;
  const full = PINS.filter((p) => p.mod === m.id).length >= PIN_MAX;
  const isBase = sameLook(m.id, AS(), DEFS[m.id]);
  $('pin').disabled = full || isBase || PINS.some((p) => p.mod === m.id && sameLook(m.id, p.s, AS()));
  $('pin').title = full ? 'Three are shortlisted. Remove one in Compare to add another.' : isBase ? `This is ${baseName(m).toLowerCase()}; Compare always shows it` : 'Keep this version to compare with later ones';
  $('pin').textContent = PINS.some((p) => p.mod === m.id && sameLook(m.id, p.s, AS())) ? 'Shortlisted' : 'Shortlist';
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
  if (sameLook(m.id, s, DEFS[m.id])) return msg(`This is ${esc(baseName(m).toLowerCase())}, which Compare always shows. Change something first, then pin it.`);
  const twin = PINS.find((p) => p.mod === m.id && sameLook(m.id, s, p.s));
  if (twin) return msg(`Already shortlisted as ${esc(twin.name)}.`);
  const mine = PINS.filter((p) => p.mod === m.id);
  if (mine.length >= PIN_MAX) return msg(`Three ${esc(m.name.toLowerCase())} versions are shortlisted already. Remove one in Compare first.`, 'warn');
  const letter = ['A', 'B', 'C'].find((l) => !mine.some((p) => p.name.startsWith(l + ' ·') || p.name === l));
  const what = m.summary ? m.summary(s) : (() => { const c = m.groups[0] && m.groups[0].ctl.find((x) => x.t === 'chips'); const op = c && optOf(c, s[c.k]); return op ? op.n : ''; })();
  PINS.push({ id: 'p' + Date.now().toString(36), name: letter + (what ? ' · ' + what : ''), mod: m.id, s: clone(s), ctx: foundations(m.id) });
  renderStageBar(); save();
  if (modeNow() === 'compare') renderStage();
  else msg(`Shortlisted as ${esc(PINS[PINS.length - 1].name)}. <button class="chip sm" data-mode="compare">Compare</button>`, 'ok');
}
function usePinned(key) {
  const mid = NAV.mod, p = PINS.find((x) => x.id === key);
  const s = key === 'base' ? fresh(mid) : p && clone(p.s);
  if (!s) return;
  const ctx = key === 'base' ? foundations(mid, DEFS) : p.ctx, diff = ctxDiff(ctx);
  commit(mid);
  setState(mid, s);
  redrawAll(); save();
  const name = esc(key === 'base' ? baseName(AM()).toLowerCase() : p.name);
  msg(diff.length
    ? `Now using ${name}. It was drawn with ${key === 'base' ? 'today’s' : 'a different'} ${esc(list(diff).toLowerCase())}; yours stay as they are. <button class="chip sm" data-pinctx="${esc(key)}">Bring ${diff.length > 1 ? 'those' : 'that'} back too</button>`
    : `Now using ${name}. Undo brings back what you had.`, 'ok', !!diff.length);
}
/** Takes back the foundations a pin (or the baseline) was drawn with, as one step that Undo reverses. */
function usePinCtx(key) {
  const mid = NAV.mod, p = PINS.find((x) => x.id === key);
  const ctx = key === 'base' ? foundations(mid, DEFS) : p && p.ctx;
  const ids = Object.keys(ctx || {}).filter((id) => STUDIO.has(id) && !sameLook(id, ctx[id], ST[id]));
  if (!ids.length) return;
  commit(ids[0], ids);
  ids.forEach((id) => setState(id, clone(ctx[id])));
  redrawAll(); save();
  msg(`${esc(list(ids.map((id) => STUDIO.by[id].name)))} back as ${ids.length > 1 ? 'they were' : 'it was'}. Undo reverses it.`, 'ok');
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
