/* ===== Spacing module: density, the scale every gap is picked from, padding, gaps and alignment, drawn as a real layout =====
   One small page (a header, a heading and paragraph, a card with a field and the main action, a short list) is drawn at
   real pixel sizes, so the room between things is judged by looking, not by numbers. Faint bands (an extra) tint the gaps. */
{
  const T = Object.assign({ measured: false, today: {}, drop: [] }, P.spacing || {});

  /* ---- the scale: eight steps from a base unit ---- */
  const GOLD = [0.382, 0.618, 1, 1.618, 2.618, 4.236, 6.854, 11.09];
  const SYSTEMS = [
    ['steps', 'Half and whole steps', 'The familiar 4, 8, 12, 16, 24, 32, 48, 64 pattern on an 8 base. Small steps near the bottom, bigger ones above.', [0.5, 1, 1.5, 2, 3, 4, 6, 8]],
    ['multiples', 'Even steps', 'Each step is one more of the base unit: 1, 2, 3, 4 and so on. Plain, predictable and easy to remember.', [1, 2, 3, 4, 5, 6, 7, 8]],
    ['double', 'Doubling', 'Every step twice the one before. Few sizes to choose from and big jumps between them.', [0.125, 0.25, 0.5, 1, 2, 4, 8, 16]],
    ['natural', 'Natural growth', 'Each step about one and a half times the last, the way shapes grow in nature. Gaps feel related without matching.', GOLD],
    ['gentle', 'Gentle growth', 'Steps a quarter bigger each time. Many close sizes, so fine adjustment is easy.', [0.51, 0.64, 0.8, 1, 1.25, 1.56, 1.95, 2.44]],
    ['bold', 'Bold growth', 'Each step half as big again. Small gaps stay small and big gaps get really big.', [0.3, 0.44, 0.67, 1, 1.5, 2.25, 3.4, 5.06]],
    ['finewide', 'Fine, then wide', 'Several tiny steps for fine detail, then big leaps for space between sections.', [0.25, 0.5, 0.75, 1, 1.5, 2.5, 4, 8]],
  ];
  const SYS = {};
  SYSTEMS.forEach((x) => { SYS[x[0]] = x; });
  const scaleOf = (s) => {
    const m = (SYS[s.system] || SYSTEMS[0])[3], out = [];
    m.forEach((k, i) => { let v = Math.max(1, Math.round(k * s.unit)); if (i && v <= out[i - 1]) v = out[i - 1] + 1; out.push(v); });
    return out;
  };
  const near = (v, list) => list.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a), list[0]);
  /* Section breaks may take a step or twice a step: they are the big spaces. */
  const bigOf = (sc) => [...new Set([...sc, ...sc.map((x) => x * 2)])].sort((a, b) => a - b);
  const rem = (px) => +(px / 16).toFixed(3) + 'rem';

  /* ---- density: the room settings together ---- */
  const DENS = {
    spacious: { n: 'Spacious', d: 'Lots of air. Content stands alone with room around it, as on a calm editorial page.', pad: 48, gap: 32, section: 96, row: 16, controlH: 48 },
    airy: { n: 'Airy', d: 'Generous room everywhere. Easy on the eye and still holds a lot.', pad: 32, gap: 24, section: 64, row: 12, controlH: 46 },
    comfortable: { n: 'Comfortable', d: 'The usual balance for products. Neither cramped nor empty.', pad: 24, gap: 16, section: 48, row: 12, controlH: 44 },
    cosy: { n: 'Cosy', d: 'A little closer than usual. Fits more without feeling tight.', pad: 16, gap: 12, section: 32, row: 8, controlH: 40 },
    compact: { n: 'Compact', d: 'Close together. For tools people use all day and want to see a lot at once.', pad: 12, gap: 8, section: 24, row: 8, controlH: 36 },
    dense: { n: 'Dense', d: 'Tight rows and small gaps. Made for tables and dashboards.', pad: 8, gap: 8, section: 16, row: 4, controlH: 32 },
    packed: { n: 'Packed', d: 'As close as it can go and still be read. Fits the most on screen, like a spreadsheet.', pad: 8, gap: 4, section: 12, row: 4, controlH: 28 },
  };
  const DKEYS = ['pad', 'gap', 'section', 'row'];
  const stack = (s) => Math.max(2, Math.round(s.gap * 0.75));
  const padPx = (s) => Math.round(s.controlH * s.padX);

  /* ---- words: the project's own where the agent found them ---- */
  const STAND = { h: 'Make something people love to use', p: 'Good spacing is felt more than seen. Related things sit close, separate things sit apart, and everything lines up with something else.' };
  const words = () => {
    const rows = (CX.rows && CX.rows.length ? CX.rows : [['Weekly summary', 'Updated today', 'New'], ['Billing export', 'Updated yesterday', ''], ['Team access', '12 people', '']]).slice(0, 4);
    return {
      h: CX.headline || STAND.h, p: CX.body || STAND.p, field: CX.field || 'Email', ph: CX.placeholder || (CX.field ? '' : 'name@example.com'),
      label: (STUDIO.has('button') && ST.button && ST.button.label) || (P.labels && P.labels[0] && two(P.labels[0])[0]) || 'Get started',
      links: (CX.links && CX.links.length ? CX.links : ['Docs', 'Pricing', 'Changelog']).slice(0, 3), rows,
    };
  };

  /* ---- colours: the palette being designed if there is one, else the project's page ---- */
  const roles = () => {
    const R = shared('roles');
    if (R) return R;
    let pc = '#F4F6F9';
    try { pc = pageColour(); } catch {}
    let light = true;
    try { light = COLOUR.lum(pc) > 0.3; } catch {}
    return light
      ? { page: pc, surface: 'rgba(0,0,0,.035)', line: 'rgba(0,0,0,.12)', control: 'rgba(0,0,0,.34)', text: '#14181a', text2: '#4a5356', text3: '#6a7477', accent: '#1d5fd1', fill: '#14181a', 'on-fill': '#ffffff' }
      : { page: pc, surface: 'rgba(255,255,255,.06)', line: 'rgba(255,255,255,.14)', control: 'rgba(255,255,255,.34)', text: '#f3f5f4', text2: '#b4bdba', text3: '#8b9592', accent: '#8ab4ff', fill: '#f3f5f4', 'on-fill': '#14181a' };
  };
  function skin() {
    const R = roles(), f = shared('fonts');
    return `background:${R.page};color:${R.text};--sp-page:${R.page};--sp-surf:${R.surface};--sp-line:${R.line};--sp-ctrl:${R.control};--sp-fg:${R.text};--sp-fg2:${R.text2};--sp-fg3:${R.text3};--sp-fill:${R.fill};--sp-onfill:${R['on-fill']}`
      + (f ? `;font-family:${f.body};--sp-display:${f.display}` : ';--sp-display:inherit');
  }

  function vars(s) {
    return {
      '--sp-unit': s.unit + 'px', '--sp-pad': s.pad + 'px', '--sp-gap': s.gap + 'px', '--sp-stack': stack(s) + 'px', '--sp-section': s.section + 'px',
      '--sp-row': s.row + 'px', '--sp-ctl': s.controlH + 'px', '--sp-padx': padPx(s) + 'px', '--sp-maxw': s.maxw + 'px',
    };
  }

  /* ---- drawings ---- */
  const vs = (k, h) => `<i class="sp-v sp-k${k}" style="height:${h}px" data-n="${h >= 14 ? h : ''}"></i>`;
  const hs = (k, w) => `<i class="sp-hz sp-k${k}" style="width:${w}px" data-n="${w >= 14 ? w : ''}"></i>`;
  const IND = { hero: 'Intro', card: 'Join', list: 'Recent', items: 'Items' };

  function part(k, s, o, w) {
    const st = stack(s), ctl = s.controlH, px = padPx(s);
    if (k === 'hdr') {
      const links = w.links.slice(0, o.big ? 3 : 2).map((l) => `<span>${esc(l)}</span>`).join(hs('g', s.gap));
      return `<div class="sp-hdr" style="padding:${Math.max(6, Math.round(s.pad / 2))}px 0"><b class="sp-brand">${esc(P.name)}</b>${hs('g', Math.max(8, s.gap))}<span class="sp-links">${links}</span>`
        + (s.align === 'split' ? `<span class="sp-ghost" style="height:${ctl}px;padding:0 ${px}px">Sign in</span>` : '') + '</div>';
    }
    if (k === 'hero') return `<div class="sp-hero"><h3 class="sp-h">${esc(w.h)}</h3>${vs('s', st)}<p class="sp-p">${esc(w.p)}</p></div>`;
    if (k === 'card') {
      return `<div class="sp-card" style="padding:${s.pad}px"><i class="sp-pl">${s.pad}</i><span class="sp-lab">${esc(w.field)}</span>${vs('s', Math.max(2, Math.round(st / 2)))}`
        + `<span class="sp-field" style="height:${ctl}px;padding:0 ${px}px">${esc(w.ph) || '&nbsp;'}</span>${vs('g', s.gap)}`
        + `<span class="sp-btnrow"><span class="sp-btn" style="height:${ctl}px;padding:0 ${px}px">${esc(w.label)}</span></span></div>`;
    }
    if (k === 'list') {
      const n = o.rows || (o.big ? 3 : 2);
      return `<ul class="sp-list" style="padding:0 ${Math.max(10, Math.round(s.pad * 0.6))}px">${w.rows.slice(0, n).map((r) => `<li style="padding:${s.row}px 0"><span class="sp-rt">${esc(r[0])}</span><span class="sp-rm">${esc(r[1] || '')}</span></li>`).join('')}</ul>`;
    }
    if (k === 'items') {
      const it = '<span class="sp-it"><i></i><i></i></span>';
      return `<div class="sp-items" style="gap:${s.gap}px">${it.repeat(4)}</div>`;
    }
    if (k === 'cols') return `<div class="sp-cols" style="gap:${s.gap * 2}px">${part('hero', s, o, w)}${part('card', s, o, w)}</div>`;
    return '';
  }
  function compose(s, o) {
    const w = words();
    const ps = o.parts.slice();
    if (s.align === 'grid') { const i = ps.indexOf('hero'); if (i >= 0 && ps[i + 1] === 'card') ps.splice(i, 2, 'cols'); }
    const sep = o.sep == null ? vs('x', s.section) : o.sep;
    const body = ps.map((k) => {
      const h = part(k, s, o, w);
      return s.align === 'indent' && IND[k] ? `<div class="sp-ind"><span class="sp-il">${IND[k]}</span><div>${h}</div></div>` : h;
    }).join(sep);
    const edge = Math.min(32, Math.max(12, Math.round(s.pad * 0.75)));
    return `<div class="sp-page sp-a-${s.align}" style="--sp-bs:${o.big ? 15 : 13}px;--sp-hs:${o.big ? 26 : 18}px;--sp-lines:${o.big ? 4 : 2};--sp-pad:${s.pad}px;--sp-row:${s.row}px;--sp-section:${s.section}px;padding:${edge}px"><div>${body}</div></div>`;
  }

  /* The scale as a ladder, and what it does to a short stack. */
  function ladder(s) {
    const sc = scaleOf(s), top = Math.max(...sc);
    return `<div class="sp-lad">${sc.map((v) => `<div class="sp-rung"><span>${v}</span><i style="width:${Math.max(3, Math.round(v / top * 100))}%"></i></div>`).join('')}</div>`;
  }
  function rhythmTile(s) {
    const sc = scaleOf(s), blk = '<span class="sp-blk"></span>';
    return `<div class="sp-rhy">${ladder(s)}<div>${blk}${vs('g', sc[1])}${blk}${vs('g', sc[3])}${blk}${vs('g', sc[5])}${blk}</div></div>`;
  }
  function controlsTile(s) {
    const px = padPx(s), w = words();
    return `<div class="sp-ctls"><span class="sp-field" style="height:${s.controlH}px;padding:0 ${px}px;width:100%">${esc(w.ph || w.field)}</span>`
      + `<span class="sp-btn" style="height:${s.controlH}px;padding:0 ${px}px">${esc(w.label)}</span><span class="sp-px">${s.controlH}px tall, ${px}px at each side</span></div>`;
  }
  function widthTile(s) {
    const pct = Math.min(100, s.maxw / 1280 * 100);
    const line = (n) => `<span class="sp-bar" style="width:${n}%"></span>`;
    return `<div class="sp-frame"><div class="sp-col" style="width:${pct}%"><span class="sp-bar" style="height:9px;width:46%;opacity:1"></span>${line(100)}${line(96)}${line(100)}${line(64)}</div><span class="sp-px">${s.maxw}px</span></div>`;
  }
  const wrap = (s, inner, on) => `<div class="sp sp-tile${on || s.guides === 'on' ? ' sp-on' : ''}" style="${skin()}">${inner}</div>`;

  function still(s, opt = {}) {
    if (opt.tile) {
      const k = opt.tile;
      if (k === 'density') return wrap(s, compose(s, { parts: ['hero', 'card', 'list'] }));
      if (k === 'system' || k === 'unit') return wrap(s, rhythmTile(s));
      if (k === 'pad') return wrap(s, compose(s, { parts: ['card'] }), true);
      if (k === 'gap') return wrap(s, compose(s, { parts: ['hero', 'items'], sep: vs('g', s.gap) }), true);
      if (k === 'section') return wrap(s, compose(s, { parts: ['hero', 'card'] }), true);
      if (k === 'align') return wrap(s, compose(s, { parts: ['hdr', 'hero', 'card'], sep: vs('x', Math.min(s.section, 40)) }));
      if (k === 'controlH' || k === 'padX') return wrap(s, controlsTile(s));
      if (k === 'maxw') return wrap(s, widthTile(s));
      if (k === 'row') return wrap(s, compose(s, { parts: ['list'], rows: 3 }), true);
      return wrap(s, compose(s, { parts: ['hero', 'card', 'list'] }));
    }
    return wrap(s, compose(s, { parts: ['hdr', 'hero', 'card', 'list'], big: !!opt.compare, rows: 3 }));
  }

  function live(el, s) {
    const sc = scaleOf(s);
    el.innerHTML = `<div class="sp sp-live${s.guides === 'on' ? ' sp-on' : ''} ${dimCls('spacing', s)}" style="${varsCss(vars(s))};${skin()}">`
      + `<div style="max-width:${s.maxw}px;margin:0 auto">${compose(s, { parts: ['hdr', 'hero', 'card', 'list'], big: true, rows: 3 })}</div>`
      + `<p class="sp-meta" style="max-width:${s.maxw}px;margin-inline:auto">${esc(DENS[s.density] ? DENS[s.density].n : 'Custom')} spacing on a ${s.unit}px base: ${sc.join(', ')}. Padding ${s.pad}px, gaps ${s.gap}px, sections ${s.section}px, buttons ${s.controlH}px tall.</p>`
      + `<div class="sp-ladlive" style="margin-inline:auto;max-width:${Math.min(340, s.maxw)}px"><span class="sp-cap">The scale, in pixels</span>${ladder(s)}</div></div>`;
  }

  /* ---- what other studios and the example page use ---- */
  const scene = (s) => ({ vars: {
    '--sc-space': s.unit, '--sc-pad': s.pad, '--sc-gap': s.gap, '--sc-stack': stack(s), '--sc-section': s.section, '--sc-row': s.row,
    '--sc-align': s.align === 'center' ? 'center' : 'start', '--sc-maxw': s.maxw, '--sc-control-h': s.controlH,
  } });
  const share = (s) => ({ spacing: {
    unit: s.unit, scale: scaleOf(s), density: s.density, pad: s.pad, gap: s.gap, section: s.section, controlH: s.controlH, padX: s.padX,
    align: s.align === 'center' ? 'center' : 'start',
  } });

  /* ---- checks and the proposal ---- */
  function warn(s) {
    const out = [], touch = TOUCH || (typeof VIEW !== 'undefined' && VIEW === 'phone');
    if (s.controlH < 24) out.push({ k: 'controlH', t: `Buttons and fields ${s.controlH}px tall are too small to hit reliably. 24px is the smallest that works at all, and 44px suits fingers.` });
    else if (s.controlH < 44 && touch) out.push({ k: 'controlH', soft: true, t: `Buttons and fields ${s.controlH}px tall are small for fingers on a touch screen. 44px or more is easy to hit.` });
    if (s.gap < 4) out.push({ k: 'gap', t: `Gaps of ${s.gap}px put neighbouring things almost against each other. At least 4px keeps them apart.` });
    if (s.pad < 8) out.push({ k: 'pad', t: `Padding of ${s.pad}px leaves words nearly touching the edge of their card. At least 8px keeps them clear.` });
    if (s.row < 2) out.push({ k: 'row', t: 'List rows with almost no room above and below run into one another.' });
    const chars = Math.round(s.maxw / 8.2);
    if (s.maxw >= 1040) out.push({ k: 'maxw', t: `A content width of ${s.maxw}px lets a paragraph run about ${chars} letters across a line. 45 to 75 reads comfortably, so cap the paragraph width on its own.` });
    return out;
  }
  const dens = (s) => (DENS[s.density] ? DENS[s.density].n.toLowerCase() : 'custom');
  const ALIGN = { start: 'left-aligned', center: 'centred', split: 'spread apart, with the action at the far side', grid: 'on a two-column grid', end: 'right-aligned', indent: 'with a label column and content hanging to its right' };
  function notes(s) {
    const sc = scaleOf(s), out = [], sys = SYS[s.system] || SYSTEMS[0];
    out.push(`Spacing scale (${sys[1].toLowerCase()}, base unit ${s.unit}px). Create or map these as space-1 to space-8 tokens: ` + sc.map((v, i) => `space-${i + 1} ${v}px (${rem(v)})`).join(', ') + '. Use rem so spacing follows the reader’s own text size.');
    const tok = (v, big) => { const i = sc.indexOf(v); return i >= 0 ? `space-${i + 1}` : big && sc.indexOf(v / 2) >= 0 ? `2 x space-${sc.indexOf(v / 2) + 1}` : 'not a step of this scale'; };
    out.push(`Spacing use (${dens(s)}): card and panel padding ${s.pad}px (${tok(s.pad)}); gap between items ${s.gap}px (${tok(s.gap)}); between blocks of text ${stack(s)}px; between sections ${s.section}px (${tok(s.section, true)}); list row padding above and below ${s.row}px (${tok(s.row)}).`);
    out.push(`Spacing controls and layout: buttons and fields ${s.controlH}px tall (${rem(s.controlH)}) with ${padPx(s)}px at each side; content column ${s.maxw}px wide at most; content ${ALIGN[s.align]}.`);
    const off = [['padding', s.pad], ['gap', s.gap], ['row padding', s.row]].filter(([, v]) => !sc.includes(v));
    if (off.length) out.push(`Not on the scale: ${off.map(([n, v]) => `${n} ${v}px`).join(', ')}. Either add a step for each or move it to the nearest step.`);
    return out;
  }

  /* ---- controls ---- */
  const PADN = { 8: 'Snug', 12: 'Close', 16: 'Tidy', 20: 'Comfortable', 24: 'Roomy', 32: 'Generous', 40: 'Spacious', 48: 'Very spacious' };
  const GAPN = { 4: 'Touching', 6: 'Very close', 8: 'Close', 12: 'Tidy', 16: 'Even', 20: 'Easy', 24: 'Roomy', 32: 'Wide' };
  const TILES = { density: { wide: true }, system: { wide: true }, unit: { wide: true }, pad: { wide: true }, gap: { wide: true }, section: { wide: true }, align: { wide: true }, controlH: { wide: true }, padX: { wide: true }, maxw: { wide: true }, row: { wide: true }, guides: { wide: true } };
  const groups = [
    { id: 'density', t: 'Density', sec: 'Feel', why: 'How much room things get overall. It sets padding, gaps, sections and row height together; you can fine-tune each afterwards.',
      ctl: [ch('density', 'How much room', Object.keys(DENS).map((id) => o(id, DENS[id].n, DENS[id].d)))] },
    { id: 'rhythm', t: 'Spacing scale', short: 'Scale', sec: 'Scale', why: 'The short list of sizes every gap and padding is picked from. A fixed list keeps the whole page in step.',
      ctl: [ch('system', 'How the sizes grow', SYSTEMS.map((x) => o(x[0], x[1], x[2]))),
        ch('unit', 'Base unit', [o(4, '4px', 'Fine. Small steps give the most control.'), o(5, '5px', 'Between fine and standard.'), o(6, '6px', 'A little bigger than fine.'), o(8, '8px', 'The usual base. Everything a multiple of 8.'), o(10, '10px', 'Easy to count. Steps land on round numbers.'), o(12, '12px', 'Big steps. Fewer, bolder choices.')])] },
    { id: 'padding', t: 'Padding', sec: 'Space', why: 'The room inside a card or panel, between its edge and what it holds.',
      ctl: [ch('pad', 'Room inside cards', [8, 12, 16, 20, 24, 32, 40, 48].map((v) => o(v, PADN[v], `${v}px between the edge of a card and its contents.`))),
        rg('pad', 'Exact padding', 4, 64, 1, 'px', 'Pixels on every side of a card.')] },
    { id: 'gaps', t: 'Gaps', sec: 'Space', why: 'The space between things that sit next to each other, and between whole sections of a page.',
      ctl: [ch('gap', 'Between neighbouring items', [4, 6, 8, 12, 16, 20, 24, 32].map((v) => o(v, GAPN[v], `${v}px between items that sit next to each other.`))),
        ch('section', 'Between sections', [16, 24, 32, 48, 64, 80, 96, 128].map((v) => o(v, v <= 24 ? 'Tight break' : v <= 48 ? 'Clear break' : v <= 80 ? 'Wide break' : 'Big pause', `${v}px between one section of the page and the next.`))),
        rg('gap', 'Exact gap between items', 0, 48, 1, 'px', 'Pixels between neighbouring items.'),
        rg('section', 'Exact gap between sections', 8, 160, 2, 'px', 'Pixels between sections.')] },
    { id: 'align', t: 'Alignment', sec: 'Layout', why: 'What things line up with: one left edge, the middle, both sides, or a grid of columns.',
      ctl: [ch('align', 'How things line up', [
        o('start', 'Left edge', 'Everything lines up on the left. The easiest to read.'), o('center', 'Centred', 'Everything on the middle line. Calm and formal, best for short content.'),
        o('split', 'Spread apart', 'Names on the left, actions and details pushed to the far side.'), o('grid', 'Two columns', 'Content snapped to a grid of columns, side by side.'),
        o('end', 'Right edge', 'Everything lines up on the right. Unusual in English, so use it with care.'), o('indent', 'Label column', 'A narrow column of labels with the content hanging to its right.')])] },
    { id: 'controls', extra: 1, t: 'Control size', sec: 'Details', why: 'How tall buttons and fields are, and how much room sits beside their words. Taller is easier to hit with a finger.',
      ctl: [ch('controlH', 'Height of buttons and fields', [28, 32, 36, 40, 44, 48, 56].map((v) => o(v, v < 32 ? 'Tiny' : v < 40 ? 'Small' : v < 44 ? 'Medium' : v < 48 ? 'Touch-ready' : v < 56 ? 'Roomy' : 'Big', `${v}px tall${v >= 44 ? ', big enough for a finger' : v < 32 ? ', hard to hit on a touch screen' : ''}.`))),
        ch('padX', 'Room beside the words', [0.3, 0.4, 0.5, 0.65, 0.8].map((v) => o(v, v < 0.4 ? 'Snug' : v < 0.5 ? 'Close' : v < 0.65 ? 'Even' : v < 0.8 ? 'Roomy' : 'Wide', 'About ' + Math.round(v * 100) + '% of the height on each side.'))),
        rg('controlH', 'Exact height', 20, 72, 1, 'px', 'Pixels tall.'), rg('padX', 'Exact room beside the words', 0.2, 0.9, 0.05, '', 'A share of the height, on each side.')] },
    { id: 'width', extra: 2, t: 'Content width', sec: 'Details', why: 'How wide the page content may grow before it stops and leaves empty margins.',
      ctl: [ch('maxw', 'Widest the content gets', [480, 560, 640, 720, 880, 1040, 1280].map((v) => o(v, v < 600 ? 'Slim' : v < 700 ? 'Narrow' : v < 800 ? 'Medium' : v < 1000 ? 'Wide' : v < 1200 ? 'Very wide' : 'Full', `${v}px at the most.`))),
        rg('maxw', 'Exact content width', 360, 1280, 10, 'px', 'Pixels wide at the most.')] },
    { id: 'rows', extra: 3, t: 'List row height', sec: 'Details', why: 'The room above and below each line in a list or table.',
      ctl: [ch('row', 'Room in each row', [2, 4, 6, 8, 10, 12, 16, 20].map((v) => o(v, v <= 4 ? 'Tight' : v <= 8 ? 'Snug' : v <= 12 ? 'Regular' : 'Roomy', `${v}px above and ${v}px below each row.`))),
        rg('row', 'Exact row padding', 0, 28, 1, 'px', 'Pixels above and below each row.')] },
    { id: 'guides', extra: 4, t: 'Spacing guides', sec: 'Details', why: 'Tint the spaces so you can see them: padding in violet, gaps in orange, sections in green, rows in blue.',
      ctl: [ch('guides', 'Show the spaces', [o('off', 'Off', 'The page as it will look.'), o('on', 'On', 'Tinted bands show every gap, with its size in pixels.')])] },
  ];

  const defaults = Object.assign({ density: 'comfortable', system: 'steps', unit: 8, padX: 0.5, maxw: 880, align: 'start', guides: 'off', controlH: DENS.comfortable.controlH }, DKEYS.reduce((a, k) => { a[k] = DENS.comfortable[k]; return a; }, {}));
  const L = (id, n, d, dn, x) => ({ id, n, d, patch: Object.assign({ density: dn, system: 'steps', unit: 8, padX: 0.5, maxw: 880, align: 'start', controlH: DENS[dn].controlH }, DKEYS.reduce((a, k) => { a[k] = DENS[dn][k]; return a; }, {}), x) });
  const looks = [
    L('product', 'Comfortable product', 'Balanced room for everyday software. Easy to scan, nothing wasted.', 'comfortable', {}),
    L('editorial', 'Airy editorial', 'Wide margins and long pauses between sections. Words get room to breathe.', 'spacious', { system: 'natural', maxw: 640, padX: 0.65 }),
    L('dashboard', 'Compact dashboard', 'Close together, two columns, small base unit. Shows a lot without feeling messy.', 'compact', { unit: 4, align: 'grid', maxw: 1040 }),
    L('data', 'Dense data', 'Tight rows and minimal padding for tables you scan all day.', 'dense', { system: 'multiples', unit: 4, maxw: 1280, padX: 0.4 }),
    L('marketing', 'Generous marketing', 'Big pauses and big buttons, for pages that sell one idea at a time.', 'spacious', { system: 'double', align: 'center', maxw: 720, controlH: 56, padX: 0.8 }),
    L('grid8', 'Strict 8-point grid', 'Every size a clean multiple of 8. Rigid in a good way: nothing is ever off.', 'comfortable', { system: 'multiples', row: 8, maxw: 960 }),
    L('landing', 'Centred landing', 'One centred column with calm space between each part.', 'airy', { system: 'natural', align: 'center', maxw: 560, controlH: 52, padX: 0.7 }),
    L('touch', 'Touch friendly', 'Tall buttons, wide gaps and generous rows, made for fingers on a phone.', 'airy', { system: 'gentle', controlH: 52, gap: 20, maxw: 560, padX: 0.6 }),
  ];

  const clamp = (v, a, b, d) => (typeof v === 'number' && isFinite(v) ? Math.min(b, Math.max(a, v)) : d);
  function fix(s) {
    if (!SYS[s.system]) s.system = 'steps';
    s.unit = Math.round(clamp(s.unit, 2, 16, 8));
    s.pad = Math.round(clamp(s.pad, 0, 64, 24));
    s.gap = Math.round(clamp(s.gap, 0, 48, 16));
    s.section = Math.round(clamp(s.section, 8, 160, 48));
    s.row = Math.round(clamp(s.row, 0, 28, 12));
    s.controlH = Math.round(clamp(s.controlH, 20, 72, 44));
    s.padX = Math.round(clamp(s.padX, 0.2, 0.9, 0.5) * 100) / 100;
    s.maxw = Math.round(clamp(s.maxw, 360, 1280, 880));
    if (!ALIGN[s.align]) s.align = 'start';
    if (s.guides !== 'on') s.guides = 'off';
    const d = DENS[s.density];
    if (s.density !== 'custom' && (!d || DKEYS.some((k) => d[k] !== s[k]))) s.density = 'custom';
  }
  function pick(s, c) {
    if (c.k === 'density' && DENS[s.density]) { const d = DENS[s.density]; DKEYS.forEach((k) => { s[k] = d[k]; }); s.controlH = d.controlH; }
    if (c.k === 'system' || c.k === 'unit') {
      const sc = scaleOf(s), big = bigOf(sc);
      s.pad = near(s.pad, sc); s.gap = near(s.gap, sc); s.row = near(s.row, sc); s.section = near(s.section, big);
    }
  }
  const summary = (s) => {
    const l = looks.find((x) => Object.keys(x.patch).every((k) => sameValue(x.patch[k], s[k])));
    return l ? l.n : `${DENS[s.density] ? DENS[s.density].n : 'Custom'} spacing, ${s.unit}px base`;
  };

  STUDIO.add({
    id: 'spacing', ground: true, name: 'Spacing',
    title: () => 'spacing',
    defaults, today: T.today || {}, measured: !!T.measured,
    groups, keep: ['guides'], looks,
    fix, pick, vars, still, live, scene, share, warn, notes, summary,
    reach: [['system', 'The spacing scale', 'Change the shared spacing tokens, so every screen follows them.'], ['one', 'Only the screens shown', 'Change the spacing on the screens in the preview and leave the shared scale alone.']],
    tile: (c) => TILES[c.k] || null,
    tall: () => true,
  });
}
