/* ===== Frame: the device screen the preview sits on, its background and Less motion ===== */

const BGS = [
  ...(P.pageBg ? [['page', 'Your page']] : []),
  ['black', 'Black'], ['light', 'Light grey'], ['cool', 'Colourful'], ['warm', 'Warm colours'], ['aurora', 'Night sky'],
  ['sunset', 'Sunset'], ['paper', 'Paper'], ['grid', 'Grid'], ['checker', 'Checker'],
  ...(Array.isArray(MO.bg) ? MO.bg : []).filter(Array.isArray).map((e) => [String(e[0]), String(e[1] || e[0])]),
];

/** Width of the column the preview is laid out in: a phone's screen, or the project's content column. */
function frameVars() {
  return { '--col': S.device === 'phone' ? '100vw' : COLUMN + 'px', '--gut': (DEV[S.device] || DEV.computer).gut + 'px' };
}
function applyVars() {
  const v = Object.assign(previewVars(), frameVars()), m = $('mount');
  for (const k in v) m.style.setProperty(k, v[k]);
  stageState();
}
function stageState() {
  const d = $('device');
  d.dataset.bg = S.bg;
  d.style.background = S.bg === 'page' ? P.pageBg : '';
  $('stage').classList.toggle('rm', S.rm === true);
  $('pcol').classList.toggle('tall', previewTall());
}

/* Your own device fills the preview at actual size, unless the project's column is wider than the preview.
   Another device is drawn at its real width and scaled down only when it cannot fit. The label says which. */
function layoutDevice() {
  const st = $('stage'), d = $('device'), w0 = st.clientWidth, h0 = st.clientHeight;
  if (!w0 || !h0) return;
  const k = S.device, D = DEV[k], own = k === VIEW;
  let w = w0, h = h0, s = 1;
  if (own) {
    const need = k === 'computer' ? COLUMN + 2 * D.gut : 0;
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
function renderDevices() {
  $('devices').innerHTML = Object.entries(DEV).map(([k, d]) => `<button role="radio" data-dev="${k}" aria-checked="${S.device === k}" title="${d.n}${k === VIEW ? ' (this device)' : ''}">${d.n}</button>`).join('');
}
function setDevice(k) {
  S.device = k;
  UI.devAt = VIEW;
  seen('dev', k);
  renderDevices(); applyVars(); layoutDevice(); save();
  if (cur >= REVIEW) renderPanel();
}
function setBg(v) {
  S.bg = v;
  seen('bg', v);
  applyVars(); save();
  if (cur >= REVIEW) renderPanel();
}
function setRm(on) {
  S.rm = on;
  if (on) UI.seen.rm = true;
  $('rmtog').setAttribute('aria-pressed', String(on));
  resetPreview(); renderPanel(); save();
}
