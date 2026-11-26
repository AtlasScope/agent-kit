/* ===== Button preview: draws the button from S, runs the after-press flows ===== */

const nA = () => Math.max(1, Math.min(S.nagents, AG.length));
const pickedChoice = () => AG[Math.min(S.agent, AG.length - 1)] || ['', '#555', '?', ''];
const fill = (t) => String(t).replace(/\{choice\}/g, AG.length ? pickedChoice()[0] : '');
const hexLum = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  return ((n >> 16 & 255) * 0.299 + (n >> 8 & 255) * 0.587 + (n & 255) * 0.114) / 255;
};
const lightBg = () => ['light', 'paper'].includes(V.bg) || (V.bg === 'page' && hexLum(pageColour()) > 0.55) || sceneIsLight();
const autoDark = (s) => s.tc === 'dark' || (s.tc === 'auto' && btnColour(s).L > 0.7);
const RADIUS = { pill: '999px', blob: '999px', circle: '999px', leaf: '999px', sharp: '5px' };

/** CSS custom properties the button styles read. */
function previewVars() {
  const s = S, k = btnColour(s);
  const r = s.shape === 'squircle' ? Math.round(s.h * 0.36) + 'px' : RADIUS[s.shape] || s.rr + 'px';
  return {
    '--h': s.h + 'px', '--r': r, '--pad': s.pad, '--H': k.H, '--H2': s.H2, '--C': k.C, '--L': k.L,
    '--on': autoDark(s) ? `oklch(.2 .05 ${k.H})` : '#fff', '--glassfg': lightBg() ? '#0b0e0d' : '#fff',
    '--blur': s.blur, '--fa': s.fa, '--tint': s.tint, '--rim': s.rim, '--depth': s.depth, '--gloss': s.gloss, '--spd': s.spd,
    '--wt': s.wt, '--fs': s.fs, '--trk': s.trk, '--isz': s.isz + 'em', '--bf': btnFont(s),
    '--mr': s.menuR + 'px', '--gap': s.gap + 'px',
  };
}
const previewTall = () => !!S.menuOpen && hasMenu(S) && S.menuStyle !== 'sheet';
const onMenuStep = () => NAV.mod === 'button' && !NAV.review && NAV.cat.button === 'menu' && hasMenu(S);

/* ---- markup ---- */
const svg = (id) => `<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;
const chev = svg('chevron');
function label() {
  const s = S;
  const icon = s.icon !== 'none' ? svg(s.icon) : '';
  const i = icon && s.tile === 'tile' ? `<span class="ti ${s.iconpos === 'right' ? 'r' : ''}">${icon}</span>` : icon;
  if (s.shape === 'circle') return (i || svg('arrow')) + `<span class="t">${esc(s.label)}</span>`;
  const t = `<span class="t">${esc(s.label)}${s.sub ? `<span class="sub">${esc(s.sub)}</span>` : ''}</span>`;
  return s.iconpos === 'left' ? i + t : t + i;
}
function cls(extra = '') {
  const s = S;
  return [
    'pv', 'm-' + s.material, 'sh-' + s.shape, 'cm-' + s.cmode, 'f-' + s.focus, 'if-' + s.iconfx, 'cs-' + s.case,
    s.idle !== 'none' ? 'i-' + s.idle : '',
    ['tilt', 'magnet', 'none'].includes(s.hover) ? '' : 'h-' + s.hover, // tilt and magnet follow the pointer in script
    ['ripple', 'hold'].includes(s.press) ? '' : 'p-' + s.press, // ripple and hold are script too
    s.width === 'fill' && s.shape !== 'circle' ? 'fill' : '', s.sub ? 'stack' : '',
    s.shape === 'leaf' ? 'leaf' : '', s.shape === 'circle' ? 'circ' : '', extra,
  ].filter(Boolean).join(' ');
}
const layers = () => '<span class="fx"></span><span class="gls"></span><span class="fx2 l-' + S.idle2 + '"></span>' + (S.press === 'hold' ? '<span class="hf"></span>' : '');
const withMaterial = (extra, material) => cls(extra).replace(/\bm-\S+/, 'm-' + material);
function mainBtn(extra = '') {
  return `<button class="${cls(extra)}${S.showFocus ? ' kf' : ''}" data-main="1" data-icon="${S.icon}" id="main"${S.shape === 'circle' ? ` aria-label="${esc(S.label)}"` : ''}>${layers()}<span class="lb">${label()}</span></button>`;
}
const part = (inner, extra) => `<button class="${cls(extra)}">${layers()}<span class="lb">${inner}</span></button>`;
const quiet = (inner, extra = '') => `<button class="${withMaterial(extra, 'glass')}" style="--tint:0;--fa:.12">${layers()}<span class="lb">${inner}</span></button>`;
function menuHTML() {
  const s = S, isGrid = s.menuStyle === 'grid';
  const row = (a, i) => `<button class="${i === s.agent ? 'on' : ''}" data-ag="${i}">`
    + (s.micons ? `<span class="ic" style="background:${esc(a[1])}">${esc(a[2])}</span>` : '')
    + `<span>${esc(a[0])}${s.msubs && a[3] ? `<small>${esc(a[3])}</small>` : ''}</span>`
    + (s.mkeys && !isGrid ? `<span class="kbd">⌘${i + 1}</span>` : '') + '</button>';
  const anim = s.menuStyle === 'sheet' ? '' : ' ma-' + s.manim;
  return `<div class="menu ${s.menuStyle} d-${s.mdens} hi-${s.mhi}${anim} ${s.menuOpen ? '' : 'shut'}" id="menu" style="width:${s.mw}px">`
    + (s.menuStyle === 'command' ? `<div class="srch">Search ${NOUN_H}s…</div>` : '')
    + `<div class="lst">${AG.slice(0, nA()).map(row).join('')}</div></div>`;
}
const dots = () => AG.slice(0, nA()).map((a, i) => `<button class="lg2 ${i === S.agent ? 'on' : ''}" data-ag="${i}" aria-label="${esc(a[0])}" title="${esc(a[0])}" style="background:${esc(a[1])}">${esc(a[2])}</button>`).join('');

const LAYOUTS = {
  none: () => mainBtn(),
  menu: (rc) => `<div style="position:relative"><span class="${rc}">${mainBtn('l')}<button class="${cls('r')}" id="tog" aria-label="Choose ${NOUN_H}" aria-expanded="${!!S.menuOpen}">${layers()}<span class="lb">${chev}</span></button></span>${menuHTML()}</div>`,
  inline: (rc, chip) => `<div style="position:relative"><button class="${cls()}${S.showFocus ? ' kf' : ''}" data-main="1" data-icon="${S.icon}" id="main">${layers()}<span class="lb">${label()}${chip('tog2')}</span></button>${menuHTML()}</div>`,
  agent: (rc, chip) => `<span class="${rc}">${mainBtn('l')}<button class="${withMaterial('r', 'glass')}" id="tog" style="--tint:0;--fa:.14">${layers()}<span class="lb">${chip()}</span></button></span>`,
  switch: () => {
    const n = Math.min(3, AG.length), a = Math.min(S.agent, n - 1);
    return `<div class="tri" style="--n:${n}"><span class="th" style="transform:translateX(${a * 100}%)"></span>${AG.slice(0, n).map((x, i) => `<button class="${i === a ? 'on' : ''}" data-ag="${i}">${esc(x[0])}</button>`).join('')}</div>${mainBtn()}`;
  },
  pair: (rc) => `<span class="${rc} pair">${mainBtn('l')}${part(svg('arrow'), 'r')}</span>`,
  segmented: (rc) => `<span class="${rc}">${mainBtn('l')}${part(esc(SEC[0] || ''), 'm')}${part(esc(SEC[1] || ''), 'r')}</span>`,
  dock: () => `<span class="row gap dock">${mainBtn()}${SEC.slice(0, 2).map((x) => quiet(esc(x))).join('')}</span>`,
  stack: () => `${mainBtn()}<div class="achips">${AG.slice(0, nA()).map((a, i) => `<button class="ac ${i === S.agent ? 'on' : ''}" data-ag="${i}">${esc(a[0])}</button>`).join('')}</div>`,
  logos: () => `${mainBtn()}<div class="logos">${dots()}</div>`,
  expand: (rc) => `<span class="${rc}" style="align-items:center">${mainBtn('l')}<button class="${cls('r')}" id="tog" aria-label="Choose ${NOUN_H}">${layers()}<span class="lb">${svg('plus')}</span></button><span class="expand ${S.menuOpen ? 'open' : ''}">${dots()}</span></span>`,
};

let ENTRANCE = false; // true while replaying the entrance
/** The markup for the button and whatever sits with it, from S. */
function previewHTML() {
  const s = S;
  const rc = `row ${s.divider === 'line' ? 'dl' : s.divider === 'none' ? 'dn' : ''}`;
  const ag = pickedChoice();
  const chip = (id) => `<span class="chipa"${id ? ` id="${id}"` : ''}><i style="background:${esc(ag[1])}">${esc(ag[2])}</i>${esc(ag[0])}${chev}</span>`;
  let html;
  if (MJ.split[s.split]) {
    try { html = MJ.split[s.split]({ S, AG, mainBtn, part, quiet, cls, fx: layers, esc, svg }); } catch (e) { report('split ' + s.split + ': ' + e.message); html = mainBtn(); }
  } else if (!AG.length && usesChoice(s)) html = mainBtn();
  else html = (LAYOUTS[s.split] || LAYOUTS.none)(rc, chip);
  return html;
}
function renderPreview() {
  const s = S, m = $('mount');
  if (!m) return;
  m.style.cssText = Object.entries(Object.assign(previewVars(), frameVars())).map(([k, v]) => k + ':' + v).join(';');
  stageState();
  const html = previewHTML();
  m.className = 'unit' + (ENTRANCE && s.entrance !== 'none' ? ' e-' + s.entrance : '');
  m.innerHTML = html;
  wire();
}
function replayPreview() {
  ENTRANCE = true;
  renderPreview();
  later(() => { ENTRANCE = false; const m = $('mount'); if (m) m.className = 'unit'; }, 1200);
}

/* ---- after pressing ---- */
let timers = [];
const later = (f, ms) => timers.push(setTimeout(f, ms));
function resetPreview() {
  timers.forEach(clearTimeout);
  timers = [];
  $('ov').classList.remove('in');
  $('toast').classList.remove('in');
  $('ovbtns').innerHTML = '';
  renderPreview();
}
function nextHTML() {
  if (S.next === 'line' && ACT.nextLine) return `<p class="nx">${esc(fill(ACT.nextLine))}</p>`;
  if (S.next === 'steps' && (ACT.nextSteps || []).length) return `<p class="nx">${ACT.nextSteps.map((t, i) => `${i + 1}. ${esc(fill(t))}`).join(' &nbsp; ')}</p>`;
  return '';
}
function nextButtons() {
  if (!S.showagents) return '';
  const go = (text) => `<button class="${withMaterial('', S.material)}" style="width:100%;justify-content:space-between">${layers()}<span class="lb">${esc(text)}</span>${svg('arrow')}</button>`;
  if (!AG.length) return ACT.cta ? go(ACT.cta) : '';
  return go('Open ' + pickedChoice()[0]) + `<button class="${withMaterial('', 'glass')}" style="width:100%;justify-content:center;--tint:0">${layers()}<span class="lb">Choose another ${NOUN_H}</span></button>`;
}
function burst(btn) {
  for (let i = 0; i < 14; i++) {
    const p = document.createElement('span'), a = (i / 14) * Math.PI * 2, d = 44 + Math.random() * 30;
    p.className = 'pt';
    p.style.cssText = `--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;background:${i % 2 ? 'var(--ach)' : '#fff'}`;
    btn.appendChild(p);
  }
}
function flow(btn) {
  if (ACT.copy) { try { navigator.clipboard.writeText(ACT.copy).catch(() => {}); } catch {} }
  const s = S, D = s.dur * 1000;
  const done = () => {
    btn.classList.remove('busy');
    btn.classList.add('copied', 'ringp');
    const l = btn.querySelector('.lb');
    if (l) l.innerHTML = `<svg class="tick" aria-hidden="true"><use href="#i-check"/></svg><span class="t">${esc(ACT.done)}</span>`;
  };
  const note = () => { const n = nextHTML(); if (n) $('mount').insertAdjacentHTML('beforeend', n); };
  const nextName = AG.length ? 'Open ' + pickedChoice()[0] : ACT.cta || 'Continue';
  if (MJ.confirm[s.confirm]) {
    try { MJ.confirm[s.confirm]({ btn, done, note, later, reset: resetPreview, burst, S, D }); } catch (e) { report('confirm ' + s.confirm + ': ' + e.message); done(); later(resetPreview, D); }
    return;
  }
  switch (s.confirm) {
    case 'burst': done(); burst(btn); note(); later(resetPreview, D); break;
    case 'progress': btn.classList.add('prog'); later(() => { btn.classList.remove('prog'); done(); note(); later(resetPreview, D); }, 1100); break;
    case 'spin': {
      btn.classList.add('busy');
      const l = btn.querySelector('.lb');
      if (l) l.innerHTML = '<span class="spinner" aria-hidden="true"></span>';
      later(() => { done(); note(); later(resetPreview, D); }, 1000);
      break;
    }
    case 'link': done(); note(); $('mount').insertAdjacentHTML('beforeend', `<a class="lnk" href="#" onclick="return false">${esc(nextName)} →</a>`); later(resetPreview, D + 2000); break;
    case 'morph':
      if (!AG.length) { done(); later(resetPreview, D); break; }
      done(); note();
      if (s.showagents) later(() => {
        $('mount').innerHTML = `<div class="agents">${AG.slice(0, Math.min(nA(), 4)).map((a, i) => `<button class="${withMaterial('', i === s.agent ? s.material : 'glass')}" style="${i === s.agent ? '' : '--tint:0'}">${layers()}<span class="lb">${esc(a[0])}</span>${svg('arrow')}</button>`).join('')}</div>`;
      }, 1100);
      later(resetPreview, D + 2600);
      break;
    case 'page': case 'sheet': {
      const ov = $('ov');
      ov.className = 'overlay' + (s.confirm === 'sheet' ? ' sheetm' : '');
      $('ovh').textContent = ACT.done;
      $('ovs').textContent = P.afterNote || '';
      later(() => { $('ovbtns').innerHTML = nextHTML() + nextButtons(); ov.classList.add('in'); }, 150);
      later(resetPreview, D + 2600);
      break;
    }
    case 'toast': case 'banner': {
      const t = $('toast');
      t.className = 'toast' + (s.confirm === 'banner' ? ' top' : '');
      $('toasth').textContent = ACT.done;
      t.querySelector('.s').textContent = s.next === 'line' ? fill(ACT.nextLine) : s.next === 'steps' ? (ACT.nextSteps || []).map(fill).join(', ') : P.afterNote || '';
      $('toastbtn').innerHTML = s.showagents && HAS_NEXT ? `<button class="${withMaterial('', 'ink')}" style="--h:34px;font-size:13px">${esc(nextName)}</button>` : '';
      requestAnimationFrame(() => t.classList.add('in'));
      later(resetPreview, D + 2000);
      break;
    }
    default: done(); note(); later(resetPreview, D); // swap
  }
}

/* ---- pointer and keyboard on the preview ---- */
function setMenu(open) {
  S.menuOpen = open;
  stageState();
  const mn = $('menu'); if (mn) mn.classList.toggle('shut', !open);
  const ex = document.querySelector('#mount .expand'); if (ex) ex.classList.toggle('open', open);
  const tg = $('tog'); if (tg && tg.hasAttribute('aria-expanded')) tg.setAttribute('aria-expanded', String(open));
}
function wire() {
  const m = $('mount');
  m.querySelectorAll('[data-main]').forEach((b) => {
    let holdTimer = 0;
    const stopHold = () => { clearTimeout(holdTimer); b.classList.remove('holding'); };
    b.onclick = (e) => {
      if (e.target.closest('#tog2') || b.matches('.copied,.prog,.busy')) return;
      if (S.press === 'ripple' && !V.rm) {
        const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2, u = document.createElement('span');
        u.className = 'rip';
        u.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
        b.querySelector('.fx').appendChild(u);
      }
      if (S.press === 'hold' && e.detail !== 0) return; // a pointer must hold; the keyboard (detail 0) confirms at once
      flow(b);
    };
    if (S.press === 'hold') {
      b.onpointerdown = () => { b.classList.add('holding'); holdTimer = setTimeout(() => { b.classList.remove('holding'); flow(b); }, 1000); };
      b.onpointerup = b.onpointercancel = stopHold;
    }
    b.onpointermove = (e) => {
      const r = b.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      b.style.setProperty('--mx', x + 'px');
      b.style.setProperty('--my', y + 'px');
      if (V.rm || e.pointerType !== 'mouse') return;
      if (S.hover === 'tilt') b.style.transform = `perspective(400px) rotateX(${-(y / r.height - 0.5) * 18}deg) rotateY(${(x / r.width - 0.5) * 18}deg)`;
      if (S.hover === 'magnet') b.style.transform = `translate(${(x - r.width / 2) * 0.16}px,${(y - r.height / 2) * 0.28}px)`;
    };
    b.onpointerleave = () => {
      stopHold(); // sliding off a hold button cancels it
      if (S.hover === 'tilt' || S.hover === 'magnet') b.style.transform = '';
    };
  });
  const tog = $('tog'); if (tog) tog.onclick = () => setMenu(!S.menuOpen);
  const t2 = $('tog2'); if (t2) t2.onclick = (e) => { e.stopPropagation(); setMenu(!S.menuOpen); };
  m.querySelectorAll('[data-ag]').forEach((b) => {
    b.onclick = (e) => {
      e.stopPropagation();
      const i = +b.dataset.ag;
      commit('button');
      if (i < AG.length) S.agent = i;
      if (S.split !== 'expand' && !onMenuStep()) S.menuOpen = false;
      renderPreview(); renderPanel(); save();
    };
  });
}

/* ---- hooks the studio calls ---- */
function onPick(c, op) {
  if (c.k === 'shape' && op.v === 'blob' && S.idle === 'none') S.idle = 'blob'; // the wobbly shape needs its movement
  if (c.k === 'shape' && op.v === 'circle' && S.icon === 'none') S.icon = 'arrow'; // a round button needs an icon
  if (c.k === 'menuStyle' || c.k === 'split') S.menuOpen = onMenuStep();
}
function afterPick(c) {
  if (c.k === 'entrance') replayPreview();
}
/** The list stays open while its own step is on screen. */
function onStepChange() {
  const want = onMenuStep();
  if (want !== !!S.menuOpen) { S.menuOpen = want; renderPreview(); }
}
