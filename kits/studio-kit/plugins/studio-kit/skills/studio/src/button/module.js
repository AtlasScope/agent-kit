/* ===== Button module: hands the catalogue and the drawing code to the studio shell ===== */

/* The button's own code reads the global S. The shell keeps S pointing at the button's state; to draw any other
   state (a tile, a look, a pinned version) the same code runs with S swapped for a moment. */
function withS(s, f) { const keep = S; S = s; try { return f(); } finally { S = keep; } }

/* Following another studio in the same workspace: the palette's accent colour, the typography studio's lettering. */
const LINK_SW = 'Palette accent';
function btnColour(s) {
  if (s.swatch === LINK_SW) { const a = shared('accent'); if (a) return a; }
  return { H: s.H, C: s.C, L: s.L };
}
function btnFont(s) {
  if (s.font === 'shared') { const f = shared('fonts'); if (f && f.ui) return f.ui; }
  return FONTS[s.font] || FONTS.ui;
}
const sceneIsLight = () => V.mode === 'context' && !!shared('light');
/* The Surface, Spacing, Motion and Icons studios: the button can take its corners, size, timing and icon style from
   them, and stops following the moment the person picks its own. Each falls back to the button's own values. */
function btnCorner(s) { const f = s.shape === 'shared' && shared('surface'); return f && isFinite(+f.r) ? Math.max(0, Math.min(+f.r, 999)) : s.rr; }
function btnSpace(s) {
  const f = s.fspace === 'follow' && shared('spacing');
  return f && isFinite(+f.controlH) ? { h: Math.max(28, Math.min(96, Math.round(+f.controlH))), pad: isFinite(+f.padX) ? Math.max(0.2, Math.min(0.9, +f.padX)) : s.pad } : { h: s.h, pad: s.pad };
}
function btnMotion(s) { const f = s.fmotion === 'follow' && shared('motion'); return f && isFinite(+f.dur) && f.ease ? { dur: Math.round(+f.dur), ease: String(f.ease).replace(/[;{}<>"]/g, '') } : null; }
function btnIcon(s) {
  const f = s.ficons === 'follow' && shared('icons');
  if (f && typeof f.draw === 'function') { try { const g = f.draw(s.icon, 24); if (g) return g.replace('<svg', '<svg aria-hidden="true"'); } catch {} }
  return svg(s.icon);
}
/** What the button follows, in plain words, for the proposal. */
function btnFollows(s) {
  const out = [];
  if (s.swatch === LINK_SW && STUDIO.has('palette')) out.push('Its colour is the Palette accent.');
  if (s.font === 'shared' && STUDIO.has('type')) out.push('Its lettering is the Typography text face.');
  if (s.shape === 'shared' && STUDIO.has('surface')) out.push(`Its corners are the Surface corner radius (${btnCorner(s)}px now).`);
  if (s.fspace === 'follow' && STUDIO.has('spacing')) out.push(`Its height and side space come from the Spacing control size (${btnSpace(s).h}px now).`);
  if (s.fmotion === 'follow' && STUDIO.has('motion')) { const m = btnMotion(s); if (m) out.push(`Its hover and press timing is the Motion timing (${m.dur}ms, ${m.ease}).`); }
  if (s.ficons === 'follow' && STUDIO.has('icons')) out.push('Its icon is drawn in the Icons style.');
  return out;
}

{
  const SEC = { shape: 'Appearance', material: 'Appearance', colour: 'Appearance', content: 'Content', interact: 'Interaction', motion: 'Interaction', split: 'Behaviour', confirm: 'Behaviour', menu: 'Behaviour' };
  const ORDER = Object.keys(SEC);
  STEPS.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
  STEPS.forEach((st) => { st.sec = SEC[st.id] || 'More'; st.short = SHORT[st.id] || st.t; });

  const ctl = (k, t) => STEPS.flatMap((st) => st.ctl).find((c) => c.k === k && c.t === t);
  if (BUILT.includes('palette')) {
    SW.splice(1, 0, [LINK_SW, SW[0][1], SW[0][2], SW[0][3], 'Follows the accent colour chosen in the Palette studio, and changes with it.']);
    ['H', 'C', 'L'].forEach((k) => { ctl(k, 'range').show = (s) => s.swatch !== LINK_SW; });
  }
  if (BUILT.includes('type')) ctl('font', 'chips').opts.unshift(o('shared', 'From Typography', 'Follows the lettering chosen in the Typography studio.'));
  if (BUILT.includes('surface')) ctl('shape', 'chips').opts.splice(1, 0, o('shared', 'From Surface', 'Takes its corners from the Surface studio, and changes with it.'));
  const stepOf = (k) => STEPS.find((st) => st.ctl.some((c) => c.k === k));
  const follow = (k, mod, name, d, after) => {
    if (!BUILT.includes(mod)) return;
    const st = stepOf(after);
    if (!st) return;
    const i = st.ctl.findIndex((c) => c.k === after);
    st.ctl.splice(i + 1, 0, ch(k, name, [o('own', 'Its own', 'Set here, for this button.'), o('follow', `From ${cap(mod)}`, d)]));
  };
  follow('fspace', 'spacing', 'Size from', 'Height and side space follow the Spacing studio’s control size.', 'h');
  follow('fmotion', 'motion', 'Timing from', 'Hover and press move with the Motion studio’s timing and feel.', 'press');
  follow('ficons', 'icons', 'Icon style from', 'The icon is drawn in the Icons studio’s style: its stroke, ends and fill.', 'icon');
  if (BUILT.includes('spacing')) ['h', 'pad'].forEach((k) => STEPS.flatMap((st) => st.ctl).filter((c) => c.k === k).forEach((c) => { const sh = c.show; c.show = (s) => s.fspace !== 'follow' && (!sh || sh(s)); }));

  /* How each control's choices are drawn. Anything not listed is a list of words. */
  const TILES = {
    shape: {}, h: {}, material: {}, cmode: {}, tc: {}, font: {}, case: {}, wt: {}, icon: {}, iconpos: {}, tile: {},
    idle: { moves: true }, idle2: { moves: true }, iconfx: { moves: true },
    hover: { on: 'hover' }, press: { on: 'active' }, focus: { state: 'focus' },
    split: { full: true, wide: true }, divider: { full: true, wide: true },
  };

  const LOOKS = [
    ['refined', 'Refined', 'Flat colour, smooth corners and a quiet lift. Hard to get wrong.', { shape: 'squircle', h: 48, material: 'solid', depth: 24, gloss: 0, hover: 'brighten' }],
    ['quiet', 'Quieter', 'A light wash of your colour that steps back until it is needed.', { material: 'tint', h: 44, hover: 'brighten', icon: 'none' }],
    ['ink', 'Plain white', 'White with dark words. Lets the page do the talking.', { material: 'ink', hover: 'lift', depth: 30 }],
    ['glass', 'Clear glass', 'See-through, with a slow glow.', { material: 'glass', idle: 'breathe', blur: 18, fa: 0.12, tint: 12 }],
    ['slab', 'Raised block', 'Tall and thick. Pushes down when pressed.', { shape: 'squircle', h: 64, material: 'slab', press: 'squish' }],
    ['outline', 'Thick outline', 'Just a strong edge that glows when pointed at.', { material: 'outline', h: 56, rim: 1, hover: 'glow' }],
    ['sticker', 'Bold sticker', 'Hard outline, capitals and a shadow off to one side.', { material: 'brutal', shape: 'sharp', case: 'upper', trk: 0.04, wt: 700, press: 'squish' }],
    ['pastel', 'Soft pastel', 'Milky colour and very round corners.', { material: 'pastel', shape: 'soft', rr: 22, h: 58 }],
    ['neon', 'Neon sign', 'A glowing tube that flickers now and then.', { material: 'neon', idle: 'flicker' }],
    ['foil', 'Rainbow foil', 'Shifting rainbow colours with a streak of light on hover.', { material: 'holo', h: 56, hover: 'shine' }],
    ['aurora', 'Glass with drifting colour', 'Glass with soft bands of colour moving through it.', { material: 'glass', idle: 'aurora', hover: 'spot' }],
    ...(AG.length ? [
      ['last', `Button plus last ${NOUN}`, `Remembers the last ${NOUN} and shows it beside the button.`, { split: 'agent', confirm: 'toast' }],
      ['search', 'List with search', `Dark glass with a searchable list of ${NOUN}s.`, { split: 'inline', material: 'smoked', menuStyle: 'command', nagents: Math.min(5, AG.length) }],
    ] : []),
  ].map(([id, n, d, patch]) => ({ id, n, d, patch }));

  /* Words on a filled button against its fill, where that can be worked out. */
  function contrastOf(s) {
    if (!['solid', 'slab', 'satin', 'gel'].includes(s.material) || s.cmode !== 'solid') return null;
    const k = btnColour(s);
    const fill = COLOUR.oklch(k.L, k.C, k.H), words = autoDark(s) ? COLOUR.oklch(0.2, 0.05, k.H) : '#FFFFFF';
    return COLOUR.ratio(fill, words);
  }
  function warn(s) {
    const out = [], r = withS(s, () => contrastOf(s));
    if (r != null && r < 4.5) out.push({ k: 'tc', t: `The words have a contrast of ${COLOUR.showRatio(r)} to 1 against the button colour. 4.5 is the usual minimum for text this size.` });
    else if (r == null && s.shape !== 'circle') out.push({ k: 'material', soft: true, t: `With ${nameIn('button', 'material', s).toLowerCase()}, how readable the words are depends on what is behind or inside the button, so it cannot be measured here. Check it on your real page.` });
    const hh = btnSpace(s).h;
    if (hh < 44) out.push({ k: s.fspace === 'follow' ? 'fspace' : 'h', t: `At ${hh}px tall it is under the 44px that is comfortable to tap on a phone.` });
    if (anyMotion(s)) out.push({ k: 'idle', soft: true, t: 'It moves while nobody is touching it. That draws the eye every time, and costs a little battery on phones. It stays still for people who ask for less motion.' });
    if (s.press === 'hold') out.push({ k: 'press', soft: true, t: 'Hold to confirm needs a second way in for people who cannot hold a press. The keyboard confirms at once here.' });
    if (String(s.label).length > 28 && s.shape !== 'circle') out.push({ k: 'label', soft: true, t: 'The words are long. Check them on a phone, and in any other languages the product ships.' });
    return out;
  }

  function still(s, opt = {}) {
    const t = (opt.tile && TILES[opt.tile]) || {};
    const st = opt.state || t.state || 'rest';
    const c = Object.assign({}, s, { menuOpen: false, showFocus: st === 'focus' });
    if (opt.tile !== 'width') c.width = 'hug';
    return withS(c, () => {
      let html = (t.full || opt.look || opt.compare) && AG.length ? previewHTML() : mainBtn();
      html = html.replace(/ id="[^"]*"/g, '').replace(/ data-main="1"/g, '').replace(/<button /g, '<button tabindex="-1" ');
      if (st === 'hover' || st === 'active' || st === 'disabled') html = html.replace('class="pv ', `class="pv sx-${st} `);
      if (st === 'loading' || st === 'done') {
        const d = document.createElement('div');
        d.innerHTML = html;
        const b = d.querySelector('.pv'), l = b && b.querySelector('.lb');
        if (b && l && st === 'loading') { b.classList.add('busy'); l.innerHTML = '<span class="spinner" aria-hidden="true"></span>'; }
        if (b && l && st === 'done') { b.classList.add('copied'); l.innerHTML = `<svg class="tick" aria-hidden="true"><use href="#i-check"/></svg><span class="t">${esc(ACT.done)}</span>`; }
        html = d.innerHTML;
      }
      return `<span class="unit still${t.moves || opt.look || opt.compare ? ' moves' : ''}">${html}</span>`;
    });
  }

  STUDIO.add({
    id: 'button', name: 'Button',
    title: () => P.noun,
    defaults: Object.assign({}, DEFAULTS, { menuOpen: false }, BUILT.includes('palette') && !P.measured ? { swatch: LINK_SW } : {},
      // a project with no design yet starts by following every foundation in the workspace; a measured one keeps today's
      !P.measured && BUILT.includes('surface') ? { shape: 'shared' } : {}, !P.measured && BUILT.includes('spacing') ? { fspace: 'follow' } : {},
      !P.measured && BUILT.includes('motion') ? { fmotion: 'follow' } : {}, !P.measured && BUILT.includes('icons') ? { ficons: 'follow' } : {}),
    today: P.today, measured: !!P.measured,
    groups: STEPS,
    looks: LOOKS,
    keep: ['label', 'sub', 'agent', 'nagents', 'font', 'swatch', 'H', 'C', 'L'],
    transient: ['menuOpen', 'showFocus'],
    fix: (s) => {
      fixState(s);
      if (s.swatch === LINK_SW && !STUDIO.has('palette')) s.swatch = SW[0][0];
      if (s.font === 'shared' && !STUDIO.has('type')) s.font = P.font ? 'project' : 'ui';
      if (s.shape === 'shared' && !STUDIO.has('surface')) s.shape = 'soft';
      if (!STUDIO.has('spacing')) s.fspace = 'own';
      if (!STUDIO.has('motion')) s.fmotion = 'own';
      if (!STUDIO.has('icons')) s.ficons = 'own';
    },
    follows: btnFollows,
    pick: (s, c, op) => withS(s, () => onPick(c, op)),
    after: (c) => afterPick(c),
    onNav: () => onStepChange(),
    vars: (s) => withS(s, previewVars),
    live: (el) => { el.innerHTML = '<div id="mount" class="unit"></div>'; resetPreview(); },
    redraw: () => renderPreview(),
    reset: () => resetPreview(),
    replay: () => replayPreview(),
    tall: () => previewTall(),
    still,
    tile: (c) => TILES[c.k] || null,
    states: [['rest', 'Resting'], ['hover', 'Pointer over it'], ['active', 'Pressed'], ['focus', 'Keyboard focus'], ['loading', 'Working'], ['done', 'Finished'], ['disabled', 'Switched off']],
    stateNote: 'Working, Finished and Switched off are shown in a standard way; the studio does not have choices for them yet.',
    swatch: (s, w) => { Object.assign(s, { swatch: w[0], H: w[1], C: w[2], L: w[3] }); },
    swatchColour: (s, w) => { const k = w[0] === LINK_SW ? (shared('accent') || { H: w[1], C: w[2], L: w[3] }) : { H: w[1], C: w[2], L: w[3] }; return k.C === 0 && k.L > 0.9 ? '#f6f8f7' : `oklch(${k.L} ${k.C} ${k.H})`; },
    colourOf: btnColour,
    summary: (s) => nameIn('button', 'material', s),
    notes: () => specNotes(),
    system: () => P.system || P.rules || [],
    warn,
  });
}
