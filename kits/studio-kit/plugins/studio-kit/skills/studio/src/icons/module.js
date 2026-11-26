/* ===== Icons module: the family, stroke, size, fill and placement of interface icons, drawn next to real lettering =====
   The glyphs are a small original set drawn on a 24 grid below. Everything about how they look is a parameter, so a
   family is only a named set of values. Icons are drawn on the project's page colour and in its fonts when the Palette
   and Typography studios are open (shared roles and fonts). Nothing here loads from outside. */
{
  const I = Object.assign({ measured: false, today: {}, library: '' }, P.icons || {});

  /* ---- the glyphs: path data on a 24 grid. body is the shape that can be filled; a ghost body (a circle or square)
     only shows when the style is solid or tinted. marks are lines; i: 1 means they cut out of a solid body. ---- */
  const rr = (x, y, w, h, r) => {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    if (r < 0.05) return `M${x} ${y}h${w}v${h}h${-w}z`;
    return `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;
  };
  const circ = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
  const mk = (i, ...p) => ({ i, p });
  const ghost = (r) => rr(2.5, 2.5, 19, 19, Math.min(9.5, r * 2.2));
  const G = {
    search: () => ({ body: circ(10.5, 10.5, 6.5), marks: [mk(0, [15.4, 15.4], [20, 20])] }),
    home: () => ({ body: 'M4.5 10.5L12 4l7.5 6.5V20h-15z', marks: [mk(1, [10, 20], [10, 15], [14, 15], [14, 20])] }),
    settings: () => ({ body: circ(12, 7, 2.5) + circ(16, 12, 2.5) + circ(8, 17, 2.5), marks: [mk(0, [4, 7], [9.5, 7]), mk(0, [14.5, 7], [20, 7]), mk(0, [4, 12], [13.5, 12]), mk(0, [18.5, 12], [20, 12]), mk(0, [4, 17], [5.5, 17]), mk(0, [10.5, 17], [20, 17])] }),
    user: () => ({ body: circ(12, 8, 3.8) + 'M4.8 20.2c.4-3.7 3.4-6.2 7.2-6.2s6.8 2.5 7.2 6.2z', marks: [] }),
    bell: () => ({ body: 'M5.5 17.5L7 16v-5a5 5 0 0 1 10 0v5l1.5 1.5z', marks: [mk(0, [10, 20.5], [14, 20.5]), mk(0, [12, 3.5], [12, 6])] }),
    plus: (r) => ({ body: ghost(r), ghost: 1, marks: [mk(1, [12, 7], [12, 17]), mk(1, [7, 12], [17, 12])] }),
    check: (r) => ({ body: ghost(r), ghost: 1, marks: [mk(1, [7.5, 12.5], [10.5, 15.5], [16.5, 8.5])] }),
    close: (r) => ({ body: ghost(r), ghost: 1, marks: [mk(1, [8.5, 8.5], [15.5, 15.5]), mk(1, [15.5, 8.5], [8.5, 15.5])] }),
    arrow: (r) => ({ body: ghost(r), ghost: 1, marks: [mk(1, [7, 12], [17, 12]), mk(1, [13, 8], [17, 12], [13, 16])] }),
    download: (r) => ({ body: ghost(r), ghost: 1, marks: [mk(1, [12, 6], [12, 15]), mk(1, [8.5, 11.5], [12, 15], [15.5, 11.5]), mk(1, [7.5, 18], [16.5, 18])] }),
    menu: (r) => ({ body: ghost(r), ghost: 1, marks: [mk(1, [7, 8.5], [17, 8.5]), mk(1, [7, 12], [17, 12]), mk(1, [7, 15.5], [17, 15.5])] }),
    heart: () => ({ body: 'M12 20C5 15.2 3.5 11.8 3.5 9.2A4.4 4.4 0 0 1 12 7.5a4.4 4.4 0 0 1 8.5 1.7C20.5 11.8 19 15.2 12 20z', marks: [] }),
    copy: (r) => ({ body: rr(8.5, 8.5, 11, 11.5, r * 0.8), marks: [mk(0, [15.5, 8.5], [15.5, 4.5], [4.5, 4.5], [4.5, 15.5], [8.5, 15.5])] }),
    chat: (r) => { const q = Math.min(r * 1.2, 5); return { body: `M${3.5 + q} 4.5H${20.5 - q}Q20.5 4.5 20.5 ${4.5 + q}V${16.5 - q}Q20.5 16.5 ${20.5 - q} 16.5H11L7 20.5v-4H${3.5 + q}Q3.5 16.5 3.5 ${16.5 - q}V${4.5 + q}Q3.5 4.5 ${3.5 + q} 4.5z`, marks: [mk(1, [8, 9], [16, 9]), mk(1, [8, 12.5], [13, 12.5])] }; },
    calendar: (r) => ({ body: rr(3.5, 5.5, 17, 15, r), marks: [mk(1, [3.5, 10], [20.5, 10]), mk(0, [8, 3.5], [8, 7]), mk(0, [16, 3.5], [16, 7]), mk(1, [8, 14.5], [10, 14.5]), mk(1, [14, 14.5], [16, 14.5]), mk(1, [8, 17.5], [10, 17.5])] }),
    trash: () => ({ body: 'M6 8.5h12L17 20.5H7z', marks: [mk(0, [4, 6.5], [20, 6.5]), mk(0, [9.5, 6.5], [9.5, 4], [14.5, 4], [14.5, 6.5]), mk(1, [10, 12], [10, 17]), mk(1, [14, 12], [14, 17])] }),
  };
  const NAME = { search: 'Search', home: 'Home', settings: 'Settings', user: 'Account', bell: 'Alerts', plus: 'Add', check: 'Done', close: 'Close', arrow: 'Next', download: 'Download', copy: 'Copy', heart: 'Like', chat: 'Messages', calendar: 'Calendar', trash: 'Delete', menu: 'Menu' };
  const ALL = Object.keys(G);
  const SAMPLE = ['search', 'home', 'bell', 'user', 'heart', 'chat', 'calendar', 'trash'];

  /* ---- style values ---- */
  const clamp = (v, a, b, d) => (typeof v === 'number' && isFinite(v) ? Math.min(b, Math.max(a, v)) : d);
  const r2 = (x) => Math.round(x * 100) / 100;
  const LABEL_PX = 15;
  const stemEm = (w) => 0.03 + w * 0.00016; // how thick a letter's stroke is, as a share of its size, at a thickness
  /** Stroke on the 24 grid for an icon drawn at px: by hand, or worked out from the lettering; small icons get a touch more. */
  const strokeFor = (s, px) => {
    if (s.match === 'text') return clamp(stemEm(+s.lw) * LABEL_PX * 24 / px, 0.5, 4, 1.75);
    return clamp(s.stroke * (s.optical === 'on' ? Math.pow(24 / px, 0.35) : 1), 0.5, 4, 1.75);
  };
  const ink = (s, px) => r2(strokeFor(s, px) * px / 24); // how thick the line really is on screen, in px
  const modeOf = (s, active) => (s.fill === 'active' ? (active ? 'solid' : 'line') : s.fill === 'activeduo' ? (active ? 'duo' : 'line') : s.fill === 'accent' ? 'line' : s.fill);
  const ROUGH = [[0, 0, 0], [0.9, 0.18, 0], [1.7, 0.4, 1.6], [2.6, 0.7, 3]]; // turn, shift (24 grid), gap in the line (% of its length)
  const JIT = [[-1, 0.6, 1], [0.7, -0.5, -1], [1, 0.4, 0.5], [-0.6, -0.8, -0.7], [0.4, 1, 0.9]];

  /** One glyph as an inline SVG in the given style. o: { active, knock }. Unknown names give ''. */
  function glyph(name, px, s, o = {}) {
    const g = G[name];
    if (!g) return '';
    const d = g(+s.corner || 0), mode = modeOf(s, o.active), sw = r2(strokeFor(s, px));
    const k = d.ghost && mode === 'line' ? 1.4 : 1; // a bare mark on its own reads small, so it is drawn larger
    const [turn, shift, gap] = ROUGH[clamp(+s.rough, 0, 3, 0)] || ROUGH[0];
    const knock = o.knock || 'var(--ic-knock,#fff)', acc = 'var(--ic-acc,currentColor)';
    let n = 0, out = '';
    const wob = () => {
      if (!turn) return '';
      const j = JIT[n++ % JIT.length];
      const dash = gap ? ` pathLength="100" stroke-dasharray="${r2(54 - gap)} ${gap} ${r2(44 - gap)} ${gap}"` : '';
      return ` transform="rotate(${r2(j[0] * turn)} 12 12) translate(${r2(j[1] * shift)} ${r2(j[2] * shift)})"${dash}`;
    };
    if (d.body && !(d.ghost && mode === 'line')) {
      const fill = mode === 'solid' ? 'currentColor' : mode === 'duo' ? 'currentColor" fill-opacity=".2' : 'none';
      out += `<path d="${d.body}" fill="${fill}"${wob()}/>`;
    }
    for (const m of d.marks) {
      const pts = m.p.map(([x, y]) => `${r2(12 + (x - 12) * k)} ${r2(12 + (y - 12) * k)}`);
      const col = m.i && mode === 'solid' ? knock : s.fill === 'accent' ? acc : 'currentColor';
      out += `<path d="M${pts.join('L')}" fill="none" style="stroke:${col}"${wob()}/>`;
    }
    return `<svg class="ic-svg" viewBox="0 0 24 24" width="${px}" height="${px}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="${s.cap}" stroke-linejoin="${s.join}" stroke-miterlimit="4" aria-hidden="true" focusable="false">${out}</svg>`;
  }

  /* ---- the page the icons sit on: the palette when open, else a plain page that follows the stage ---- */
  const light = () => { try { return bgLight(); } catch { return false; } };
  function theme() {
    const R = shared('roles');
    if (R) return { page: R.page, text: R.text, acc: R.accent, surf: R.surface, line: R.line, mut: R.text3, fill: R.fill, on: R['on-fill'], pal: true };
    const b = P.brand || ['Blue', 255, 0.17, 0.64], lt = light();
    const acc = `oklch(${lt ? Math.min(b[3], 0.55) : Math.max(b[3], 0.72)} ${b[2]} ${b[1]})`;
    return lt ? { page: '#f7f8f6', text: '#15191b', acc, surf: '#ffffff', line: '#d9dedb', mut: '#5d6763', fill: acc, on: '#ffffff' }
      : { page: '#101314', text: '#eef1ef', acc, surf: '#191d1f', line: '#2b3134', mut: '#9aa4a0', fill: acc, on: '#0c0f10' };
  }
  const themeCss = (t) => `background:${t.page};color:${t.text};--ic-page:${t.page};--ic-t0:${t.text};--ic-p0:${t.page};--ic-knock:${t.page};--ic-acc:${t.acc};--ic-surf:${t.surf};--ic-line:${t.line};--ic-mut:${t.mut};--ic-fill:${t.fill};--ic-on:${t.on}`;
  const fontStack = () => { const f = shared('fonts'); return f ? f.ui : 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif'; };

  function vars(s) {
    return { '--ic-size': s.size + 'px', '--ic-gap': s.gap + 'px', '--ic-lw': s.lw, '--ic-font': fontStack() };
  }

  /* ---- pieces ---- */
  const boxOf = (s, px) => (s.box === 'none' ? px : Math.round(px * 1.75));
  /** One icon, with its container, in the style. o: { active, px, cls }. */
  function ico(name, s, o = {}) {
    const px = o.px || s.size, nudge = s.optical === 'on' ? r2(px * 0.04 + 0.2) : 0, box = boxOf(s, px);
    const on = !!o.active, colour = on ? 'var(--ic-acc)' : s.colour === 'accent' ? 'var(--ic-acc)' : s.colour === 'muted' ? 'var(--ic-mut)' : 'currentColor';
    return `<span class="ic-ico ic-b-${s.box}${on ? ' ic-on' : ''}${o.cls ? ' ' + o.cls : ''}" style="--ic-box:${box}px;--ic-nudge:${nudge}px;--ic-c:${colour}">${glyph(name, px, s, { active: on })}</span>`;
  }
  const lab = (t, s, o = {}) => `<span class="ic-lab" style="font-size:${o.px && o.px > 22 ? Math.round(o.px * 0.62) : LABEL_PX}px;font-weight:${s.lw}">${esc(t)}</span>`;
  const PLACE = { before: 'row', after: 'rev', above: 'col', below: 'colrev', hover: 'row', edge: 'edge' };
  /** An icon with its label, placed as chosen. o: { active, px, tip, cls } */
  function item(text, name, s, o = {}) {
    const p = s.place, on = !!o.active, icon = ico(name, s, { active: o.active, px: o.px });
    const tip = p === 'hover' ? `<span class="ic-tip${o.tip ? ' ic-show' : ''}">${esc(text)}</span>` : '';
    const inner = p === 'hover' ? icon + tip : icon + lab(text, s, o);
    const gap = p === 'above' || p === 'below' ? Math.max(2, s.gap - 2) : s.gap;
    return `<span class="ic-it ic-p-${PLACE[p]}${on ? ' ic-on' : ''}${o.cls ? ' ' + o.cls : ''}" style="gap:${gap}px"${p === 'hover' ? ` tabindex="0" aria-label="${esc(text)}"` : ''}>${inner}</span>`;
  }
  const meta = (t) => `<span class="ic-meta">${esc(t)}</span>`;

  const grid = (s, names, px, o = {}) => `<div class="ic-grid" style="--ic-cell:${o.cell || px * 2 + 24}px">${names.map((n) => `<span class="ic-cell">${ico(n, s, { px })}${o.names ? `<span class="ic-nm">${NAME[n]}</span>` : ''}</span>`).join('')}</div>`;
  const TB = ['search', 'copy', 'download', 'trash', 'settings'];
  /** Icons on their own. state: undefined (the second is selected), 'rest', 'active', 'hover'. */
  const toolbar = (s, o = {}) => `<div class="ic-bar">${TB.map((n, i) => `<span class="ic-tb${o.state === 'hover' && i === 2 ? ' ic-hv' : ''}${(o.state === 'rest' || o.state === 'hover') ? '' : i === 1 ? ' ic-on' : ''}">${ico(n, s, { active: !(o.state === 'rest' || o.state === 'hover') && i === 1 })}</span>`).join('')}</div>`;
  const tabbed = (s) => s.place === 'above' || s.place === 'below' || s.place === 'hover';
  const NAV = [['home', 'Home'], ['chat', 'Messages'], ['calendar', 'Calendar'], ['settings', 'Settings']];
  const nav = (s) => `<nav class="ic-nav${tabbed(s) ? ' ic-tabs' : ''}">${NAV.map(([n, t], i) => item(t, n, s, { active: i === 0, tip: s.place === 'hover' && i === 0, cls: 'ic-nv' })).join('')}</nav>`;
  const rowsOf = () => { const r = (CX.rows || []).filter((x) => x && x[0]).slice(0, 3); return r.length ? r : [['Weekly summary', 'Updated today'], ['Billing export', 'Updated yesterday'], ['Team access', '12 people']]; };
  const listRows = (s) => `<ul class="ic-list">${rowsOf().map((r, i) => `<li>${ico(['calendar', 'download', 'user'][i % 3], s, {})}<span class="ic-lt"><b style="font-weight:${Math.max(500, s.lw)}">${esc(r[0])}</b><span>${esc(r[1] || '')}</span></span>${ico('arrow', Object.assign({}, s, { box: 'none', colour: 'muted' }), { px: Math.max(14, Math.round(s.size * 0.8)) })}</li>`).join('')}</ul>`;
  const action = (s, o = {}) => `<span class="ic-main ic-pm-${PLACE[s.place]}">${item(o.label || 'Download report', 'download', Object.assign({}, s, { colour: 'text', box: 'none' }), { tip: o.tip })}</span>`;
  const sizesRow = (s) => `<div class="ic-sizes">${[16, 20, 24, 28].map((px) => `<span class="ic-sz">${item('Search', 'search', Object.assign({}, s, { place: s.place === 'hover' ? 'before' : s.place }), { px })}${meta(px + 'px, line ' + ink(s, px) + 'px')}</span>`).join('')}</div>`;

  /* ---- tiles: every choice drawn as the same real thing ---- */
  const row = (s, names, px, on) => `<div class="ic-row">${names.map((n, i) => ico(n, s, { px, active: on === i })).join('')}</div>`;
  const plain = (s, x) => Object.assign({}, s, { stroke: Math.max(s.stroke, 3), fill: 'line', match: 'off', optical: 'off' }, x);
  const FILLWORD = { line: 'Line only', solid: 'Solid', duo: 'Duotone', accent: 'Line, accent marks', active: 'Solid when selected', activeduo: 'Tinted when selected' };
  const PLACEWORD = { before: 'Icon, then label', after: 'Label, then icon', above: 'Icon above label', below: 'Label above icon', hover: 'Icon alone, label on hover', edge: 'Icon at the edge' };
  function tileArt(s, k) {
    const px = Math.min(s.size, 32);
    switch (k) {
      case 'family': return grid(s, SAMPLE, 24, { cell: 54 }) + `<span class="ic-spec-m"><i class="ic-bar2" style="height:${s.stroke}px"></i><i class="ic-sq" style="border-radius:${s.corner * 1.2}px"></i>${meta(s.stroke + ' line')}</span>`;
      case 'stroke': return row(s, ['search', 'home', 'user', 'heart', 'copy', 'calendar'], 28) + `<span class="ic-spec-m"><i class="ic-bar2" style="height:${s.stroke}px"></i>${meta(s.match === 'text' ? 'Follows the text' : s.stroke + ' on the 24 grid')}</span>`;
      case 'size': return `<div class="ic-sizeline">${item('Search', 'search', Object.assign({}, s, { place: 'before' }), { px: s.size })}</div>` + row(s, ['home', 'user', 'bell', 'heart'], s.size) + meta(s.size + 'px');
      case 'fill': return row(s, ['home', 'heart', 'bell', 'calendar', 'plus', 'chat'], 28, 0) + meta(FILLWORD[s.fill]);
      case 'place': return `<div class="ic-sizeline">${action(s, { tip: true })}</div>` + meta(PLACEWORD[s.place]);
      case 'gap': return `<div class="ic-sizeline">${item('Download', 'download', Object.assign({}, s, { place: 'before' }), {})}</div>` + meta(s.gap + 'px between');
      case 'cap': return row(plain(s), ['check', 'plus', 'close', 'arrow', 'search'], 34) + meta({ round: 'Round ends', square: 'Square ends', butt: 'Flat ends' }[s.cap]);
      case 'join': return row(plain(s), ['home', 'chat', 'bell', 'trash', 'calendar'], 34) + meta({ round: 'Round corners', miter: 'Pointed corners' }[s.join]);
      case 'corner': return row(Object.assign({}, s, { fill: 'duo' }), ['calendar', 'copy', 'chat', 'plus'], 34) + `<span class="ic-spec-m"><i class="ic-sq" style="border-radius:${s.corner * 2}px"></i>${meta('Corners ' + s.corner)}</span>`;
      case 'rough': return row(s, ['search', 'home', 'heart', 'chat', 'bell', 'trash'], 30) + meta(['Clean', 'A little wobble', 'Sketchy', 'Very loose'][s.rough]);
      case 'optical': return `<div class="ic-guided">${item('Search', 'search', Object.assign({}, s, { place: 'before' }), { px: 16 })}${item('Messages', 'chat', Object.assign({}, s, { place: 'before' }), { px: 16 })}${item('Calendar', 'calendar', Object.assign({}, s, { place: 'before' }), { px: 20 })}</div>` + meta(s.optical === 'on' ? 'Adjusted to the lettering' : 'Exactly as drawn');
      case 'box': return row(s, ['user', 'bell', 'chat', 'heart'], 22) + meta({ none: 'Nothing behind', circle: 'Circle', square: 'Rounded square', tint: 'Tinted backdrop' }[s.box]);
      case 'colour': return `<div class="ic-sizeline">${item('Settings', 'settings', Object.assign({}, s, { place: 'before' }), {})}</div>` + row(s, ['home', 'bell', 'heart'], 24) + meta({ text: 'Same as the words', accent: 'The accent colour', muted: 'Quiet grey' }[s.colour]);
      case 'lw': return `<div class="ic-sizeline">${item('Download report', 'download', Object.assign({}, s, { place: 'before', match: 'text' }), {})}</div>` + meta('Label thickness ' + s.lw + ', icon follows');
      default: return grid(s, SAMPLE, px, { cell: 54 });
    }
  }
  /* A whole specimen: the same content for every direction, only the icons differ. */
  function specimen(s, big, st) {
    const px = Math.min(s.size, 28);
    return `<div class="ic-spec-g">${grid(s, SAMPLE, px, { cell: 56 })}</div>`
      + toolbar(s, { state: st }) + `<div class="ic-two">${nav(s)}${listRows(s)}</div>`
      + `<div class="ic-act">${action(s)}</div>`
      + meta(`${FILLWORD[s.fill]} · ${s.size}px · line ${ink(s, s.size)}px · gap ${s.gap}px`);
  }
  function still(s, opt = {}) {
    const t = theme();
    if (opt.tile) return `<div class="ic ic-tile${t.pal ? ' ic-pal' : ''}" style="${themeCss(t)};${varsCss(vars(s))}">${tileArt(s, opt.tile)}</div>`;
    return `<div class="ic ic-spec${opt.compare ? ' ic-big' : ''}${t.pal ? ' ic-pal' : ''}" style="${themeCss(t)};${varsCss(vars(s))}">${specimen(s, opt.compare, opt.state)}</div>`;
  }
  function live(el, s) {
    const t = theme();
    const sec = (h, x) => `<section><h4 class="ic-sec">${h}</h4>${x}</section>`;
    el.innerHTML = `<div class="ic ic-sheet${t.pal ? ' ic-pal' : ''}" style="${themeCss(t)};${varsCss(vars(s))}">`
      + sec('The set, at the size you chose', grid(s, ALL, s.size, { names: true, cell: Math.max(84, s.size * 2 + 44) }))
      + sec('Toolbar: icons on their own, the second one selected', toolbar(s))
      + sec(tabbed(s) ? 'Navigation as a tab bar, the first one selected' : 'Navigation, the first one selected', nav(s))
      + sec('A list with a leading icon', listRows(s))
      + sec('The main action', `<div class="ic-act">${action(s, { tip: true })}</div>`)
      + sec('Sizes beside their label', sizesRow(s))
      + '</div>';
  }

  /* ---- what other studios and the example page use ---- */
  function scene(s) { return { vars: { '--sc-icon': s.size + 'px', '--sc-icon-stroke': r2(strokeFor(s, s.size)) + 'px', '--sc-icon-gap': s.gap + 'px' } }; }
  function share(s) {
    return { icons: {
      family: s.family, stroke: r2(strokeFor(s, s.size)), size: s.size,
      fill: s.fill === 'accent' ? 'line' : s.fill === 'activeduo' ? 'active' : s.fill,
      cap: s.cap, join: s.join, gap: s.gap, optical: s.optical === 'on',
      draw: (name, px, o) => glyph(name, px || s.size, s, o || {}),
    } };
  }

  /* ---- checks and the proposal ---- */
  function warn(s) {
    const out = [], thin = ink(s, s.size);
    if (thin < 1) out.push({ k: 'stroke', t: `The line comes out about ${thin}px thick on screen, so the icons look faint and can vanish on some screens. Thicken the line or make the icons bigger.` });
    if (s.place === 'hover') {
      out.push({ k: 'place', t: 'An icon with no visible label gives no clue on a phone or tablet, where nothing can be pointed at. Keep the label as hidden text for screen readers, and show it in full for the less obvious icons.' });
      if (boxOf(s, s.size) + 16 < 40) out.push({ k: 'size', t: `An icon button this size (${s.size}px plus some room around it) is smaller than the 40px a fingertip needs. Give it a bigger tap area, or a bigger icon.` });
    }
    try {
      const R = shared('roles');
      if (R && s.colour === 'muted' && COLOUR.ratio(R.text3, R.page) < 3) out.push({ k: 'colour', t: 'The quiet grey is too close to the page colour to see clearly (icons need to stand out at least 3 to 1). Use the words’ colour or the accent.' });
      if (R && s.colour === 'accent' && COLOUR.ratio(R.accent, R.page) < 3) out.push({ k: 'colour', t: 'The accent is too close to the page colour for icons to stand out (they need at least 3 to 1). Use the words’ colour instead.' });
    } catch {}
    return out;
  }
  const FILLS = { line: 'outline only', solid: 'solid shapes with the details cut out', duo: 'outline over a soft tint of the same colour (fill-opacity .2)', accent: 'outline, with the small marks in the accent colour', active: 'outline, solid when selected', activeduo: 'outline, tinted when selected' };
  const PLACES = { before: 'icon before the label', after: 'icon after the label', above: 'icon above the label (tab bar style)', below: 'label above the icon', hover: 'icon alone, the label shown on hover and focus and kept as hidden text', edge: 'icon at the edge, label in the middle' };
  function notes(s) {
    const out = [], sw = r2(strokeFor(s, s.size));
    out.push(`Icons, drawing: a 24 by 24 grid, shown at ${s.size}px with a stroke of ${sw} on that grid (${ink(s, s.size)}px on screen)${s.match === 'text' ? `, worked out to match text at weight ${s.lw}` : ''}; stroke-linecap ${s.cap}, stroke-linejoin ${s.join}, box corners rounded to ${s.corner} on the grid. Draw the line in currentColor so icons take the colour of their words. Fill: ${FILLS[s.fill]}.`);
    out.push(`Icons, placement: ${PLACES[s.place]}; ${s.gap}px between icon and label; icons ${({ text: 'the same colour as their words', accent: 'in the accent colour', muted: 'in the quiet grey' })[s.colour]}${s.box === 'none' ? ', with no container' : `, inside a ${{ circle: 'circle', square: 'rounded square', tint: 'tinted rounded square' }[s.box]} ${boxOf(s, s.size)}px wide`}.`);
    if (s.optical === 'on') out.push(`Icons, optical balance: the stroke grows slightly as icons get small (about ${r2(Math.pow(24 / 16, 0.35))} times at 16px, exactly 1 at 24px, less above), and icons sit about ${r2(s.size * 0.04 + 0.2)}px below the middle of their box so they line up with the lettering.`);
    if (+s.rough) out.push(`Icons, feel: hand-drawn, level ${s.rough} of 3: each stroke slightly turned and shifted${s.rough > 1 ? ' with small breaks in the line' : ''}. Keep this to the drawn set; never apply it to text.`);
    if (I.library) out.push(`Icons, today the project uses ${I.library}. Choose that library’s nearest weight and sizes to these values rather than drawing new glyphs, unless the person asks for an own set.`);
    return out;
  }
  const FAM = {};
  function summary(s) {
    const l = looks.find((x) => Object.keys(x.patch).every((k) => String(x.patch[k]) === String(s[k])));
    return l ? l.n : `${(FAM[s.family] || {}).n || 'Icons'}, ${s.size}px`;
  }

  /* ---- controls ---- */
  const TILES = Object.fromEntries(['family', 'stroke', 'size', 'fill', 'place', 'gap', 'cap', 'join', 'corner', 'rough', 'optical', 'box', 'colour', 'lw'].map((k) => [k, { wide: true }]));
  const fam = (id, n, d, patch) => { FAM[id] = { n, patch }; return Object.assign(o(id, n, d), { set: patch }); };
  const FAMILIES = [
    fam('regular', 'Regular line', 'An even, medium line with softly rounded ends. Clear everywhere and easy to live with.', { stroke: 1.75, cap: 'round', join: 'round', corner: 2, fill: 'line', rough: 0 }),
    fam('fine', 'Fine line', 'A thin, delicate line. Light and refined, best at larger sizes.', { stroke: 1.25, cap: 'round', join: 'round', corner: 2, fill: 'line', rough: 0 }),
    fam('bold', 'Bold line', 'A thick line that holds up when small and feels confident.', { stroke: 2.5, cap: 'round', join: 'round', corner: 3, fill: 'line', rough: 0 }),
    fam('rounded', 'Rounded and friendly', 'Big soft corners and round ends. Warm and approachable.', { stroke: 2, cap: 'round', join: 'round', corner: 6, fill: 'line', rough: 0 }),
    fam('sharp', 'Sharp and technical', 'Square ends and pointed corners. Precise, like a tool.', { stroke: 1.75, cap: 'square', join: 'miter', corner: 0, fill: 'line', rough: 0 }),
    fam('solid', 'Solid', 'Filled shapes with the details cut out. Strong and easy to spot.', { stroke: 1.5, cap: 'round', join: 'round', corner: 3, fill: 'solid', rough: 0 }),
    fam('duo', 'Duotone', 'A line over a soft tint of its own colour. Gentle depth without weight.', { stroke: 1.75, cap: 'round', join: 'round', corner: 3, fill: 'duo', rough: 0 }),
    fam('blocky', 'Blocky', 'A heavy line with flat ends and square corners. Loud and graphic.', { stroke: 3, cap: 'butt', join: 'miter', corner: 1, fill: 'line', rough: 0 }),
    fam('hand', 'Hand-drawn', 'Each line slightly off, as if sketched with a pen. Personal and informal.', { stroke: 1.75, cap: 'round', join: 'round', corner: 2, fill: 'line', rough: 2 }),
  ];
  const opts = (rows) => rows.map(([v, n, d]) => o(v, n, d));
  const STROKES = [[1, 'Hairline', 'The thinnest line that still shows. Needs a big size.'], [1.25, 'Fine', 'Thin and delicate.'], [1.5, 'Light', 'Lighter than usual, quietly elegant.'], [1.75, 'Regular', 'An even, middle weight.'], [2, 'Firm', 'A little stronger. The usual for interfaces.'], [2.5, 'Bold', 'Thick and sturdy. Reads well when small.'], [3, 'Heavy', 'Very thick. Loud and graphic.']];
  const SIZES = [[14, 'Tiny', 'Beside small print. Only for dense tools.'], [16, 'Small', 'Level with normal text.'], [18, 'Snug', 'A little bigger than the text beside it.'], [20, 'Medium', 'The usual size for buttons and menus.'], [24, 'Large', 'Easy to see and tap. The size the icons are drawn at.'], [28, 'Bigger', 'Generous, for navigation and headers.'], [32, 'Big', 'Feature icons and empty screens.']];
  const FILLOPT = [['line', 'Line only', 'Just the outline. Light and open.'], ['solid', 'Solid', 'Filled shapes with the details cut out.'], ['duo', 'Duotone', 'An outline over a soft tint of the same colour.'], ['accent', 'Accent marks', 'An outline, with the small marks in the accent colour.'], ['active', 'Solid when selected', 'Outline normally; the selected one fills in.'], ['activeduo', 'Tinted when selected', 'Outline normally; the selected one gets a soft tint.']];
  const PLACEOPT = [['before', 'Icon first', 'The icon sits before the label. The usual way.'], ['after', 'Icon last', 'The icon follows the label, as on links that lead somewhere.'], ['above', 'Icon above', 'The icon over the label, as in a tab bar.'], ['below', 'Label above', 'The label over the icon. Rare, for captions.'], ['hover', 'Icon alone', 'Only the icon; the label shows when pointed at.'], ['edge', 'Icon at the edge', 'The icon at the left edge and the label in the middle, on wide buttons.']];

  const groups = [
    { id: 'family', t: 'Family', sec: 'Style', why: 'The character of the whole set: thin or thick, soft or sharp, line or solid. Picking one sets the line, ends, corners and fill together. You can change each after.',
      ctl: [ch('family', 'Icon family', FAMILIES)] },
    { id: 'stroke', t: 'Line weight', sec: 'Style', why: 'How thick the line is. Thick lines stay clear when small; thin ones look refined when large. It should feel like the lettering beside it.',
      ctl: [ch('stroke', 'Line weight', opts(STROKES)),
        ch('match', 'Follow the lettering', [o('off', 'Set by hand', 'The weight you picked above.'), o('text', 'Match the text', 'Work the line out from the label’s thickness, so icon and words feel like one hand.')]),
        rg('stroke', 'Exact line weight', 0.75, 3.5, 0.05, '', 'Thickness on the 24 grid. At 24px it is the same in pixels.', { show: (s) => s.match !== 'text' })] },
    { id: 'size', t: 'Size', sec: 'Style', why: 'How big the icons are. Beside text they usually match its height or a little more.',
      ctl: [ch('size', 'Icon size', opts(SIZES)), rg('size', 'Exact size', 12, 48, 1, 'px', 'Width and height of one icon.')] },
    { id: 'fill', t: 'Fill', sec: 'Style', why: 'Whether icons are outlines, solid shapes or tinted, and whether the selected one looks different.',
      ctl: [ch('fill', 'Fill', opts(FILLOPT))] },
    { id: 'place', t: 'Placement', sec: 'Layout', why: 'Where the icon sits next to its label, and how far from it.',
      ctl: [ch('place', 'Where the icon goes', opts(PLACEOPT)),
        ch('gap', 'Space between icon and label', opts([[2, 'Touching', 'Almost together.'], [4, 'Tight', 'Close, as one unit.'], [6, 'Snug', 'A little room.'], [8, 'Normal', 'The usual gap.'], [12, 'Roomy', 'Clearly two things.'], [16, 'Wide', 'Spread apart.']])),
        rg('gap', 'Exact space', 0, 24, 1, 'px', 'From the icon to its label.')] },
    { id: 'shape', extra: 1, t: 'Corners and ends', sec: 'Detail', why: 'How the ends of lines finish, how corners join, and how round the boxes inside icons are.',
      ctl: [ch('cap', 'Ends of lines', [o('round', 'Round', 'Soft, rounded ends.'), o('square', 'Square', 'Flat ends that stick out a little.'), o('butt', 'Flat', 'Flat ends that stop exactly at the end.')]),
        ch('join', 'Where lines meet', [o('round', 'Round', 'Corners softened.'), o('miter', 'Sharp', 'Corners left pointed.')]),
        ch('corner', 'Corner roundness', opts([[0, 'Square', 'No rounding at all.'], [1, 'Slight', 'Barely softened.'], [2, 'Soft', 'A gentle curve.'], [3, 'Round', 'A clear curve.'], [4, 'Rounder', 'Very curved.'], [6, 'Pill', 'As round as it goes.']])),
        rg('corner', 'Exact roundness', 0, 6, 0.25, '', 'Radius of the corners on the 24 grid.')] },
    { id: 'feel', extra: 2, t: 'Hand-drawn feel', sec: 'Detail', why: 'A little wobble and small breaks in the line, like a pen. Only for informal, personal designs.',
      ctl: [ch('rough', 'How loose', [o(0, 'Clean', 'Perfectly even.'), o(1, 'A little wobble', 'Slightly off, hardly noticed.'), o(2, 'Sketchy', 'Turned a touch, with tiny breaks.'), o(3, 'Very loose', 'Clearly drawn by hand.')])] },
    { id: 'optical', extra: 3, t: 'Optical balance', sec: 'Detail', why: 'Small icons look thinner than big ones, and sit a touch high beside lettering. This corrects both, so they look steady and not just measure steady.',
      ctl: [ch('optical', 'Adjust to the eye', [o('on', 'Adjust', 'Small icons get a slightly heavier line and sit level with the lettering.'), o('off', 'As drawn', 'Every size uses the same line and sits exactly in the middle of its box.')])] },
    { id: 'box', extra: 4, t: 'Container', sec: 'Detail', why: 'A shape behind the icon, which makes it a bigger, clearer target.',
      ctl: [ch('box', 'Behind the icon', [o('none', 'Nothing', 'The icon on its own.'), o('circle', 'Circle', 'A soft round plate.'), o('square', 'Rounded square', 'A soft square plate.'), o('tint', 'Tinted backdrop', 'A square wash of the accent colour.')])] },
    { id: 'colour', extra: 5, t: 'Colour and label weight', sec: 'Detail', why: 'The colour of the icons, and how thick the labels beside them are.',
      ctl: [ch('colour', 'Icon colour', [o('text', 'Same as the words', 'Icon and label share one colour.'), o('accent', 'Accent', 'Icons in the accent colour.'), o('muted', 'Quiet', 'A softer grey, so the words lead.')]),
        ch('lw', 'Label thickness', [o(400, 'Regular', 'Normal lettering.'), o(500, 'Medium', 'A little firmer.'), o(600, 'Firm', 'Clearly heavier.')])] },
  ];

  const defaults = { family: 'regular', stroke: 1.75, match: 'off', size: 20, fill: 'line', cap: 'round', join: 'round', corner: 2, rough: 0, gap: 8, place: 'before', optical: 'on', box: 'none', colour: 'text', lw: 500 };
  const L = (id, n, d, patch) => ({ id, n, d, patch: Object.assign({}, (FAM[patch.family] || {}).patch, patch) });
  const looks = [
    L('quiet', 'Quiet fine line', 'Thin, light icons that stay out of the way of the words.', { family: 'fine', size: 20, colour: 'muted', gap: 8, place: 'before', lw: 400 }),
    L('friendly', 'Friendly rounded', 'Soft corners, round ends and a tinted plate behind each icon.', { family: 'rounded', size: 24, fill: 'duo', box: 'tint', colour: 'accent', gap: 12, place: 'before', lw: 500 }),
    L('technical', 'Crisp technical', 'Square ends, sharp corners and an even line. Precise.', { family: 'sharp', size: 20, gap: 8, place: 'before', lw: 500 }),
    L('bold', 'Bold and solid', 'Filled icons on round plates. Easy to see from across the room.', { family: 'solid', size: 24, box: 'circle', gap: 10, place: 'before', lw: 600 }),
    L('duotone', 'Duotone accent', 'An outline over a tint, in the accent colour. Gentle depth.', { family: 'duo', size: 24, colour: 'accent', gap: 10, place: 'before', lw: 500 }),
    L('matches', 'Matches the type', 'The line is worked out from the lettering, so icon and label share one hand.', { family: 'regular', match: 'text', size: 20, gap: 8, place: 'before', optical: 'on', lw: 500 }),
    L('compact', 'Compact toolbar', 'Small, tight icons for crowded toolbars and menus.', { family: 'regular', size: 16, gap: 6, place: 'before', colour: 'text', lw: 500 }),
    L('tabbar', 'Tab bar', 'The icon above its label; the selected one fills in.', { family: 'regular', size: 24, corner: 3, fill: 'active', gap: 6, place: 'above', colour: 'muted', lw: 500 }),
  ];

  function fix(s) {
    if (typeof s.family !== 'string' || !s.family) s.family = 'regular';
    s.stroke = clamp(s.stroke, 0.75, 3.5, 1.75);
    s.size = clamp(s.size, 12, 48, 20);
    s.gap = clamp(s.gap, 0, 24, 8);
    s.corner = clamp(s.corner, 0, 6, 2);
    s.rough = Math.round(clamp(+s.rough, 0, 3, 0));
    s.lw = [400, 500, 600].includes(+s.lw) ? +s.lw : 500;
    if (!['off', 'text'].includes(s.match)) s.match = 'off';
    if (!FILLWORD[s.fill]) s.fill = 'line';
    if (!['round', 'square', 'butt'].includes(s.cap)) s.cap = 'round';
    if (!['round', 'miter'].includes(s.join)) s.join = 'round';
    if (!PLACES[s.place]) s.place = 'before';
    if (!['on', 'off'].includes(s.optical)) s.optical = 'on';
    if (!['none', 'circle', 'square', 'tint'].includes(s.box)) s.box = 'none';
    if (!['text', 'accent', 'muted'].includes(s.colour)) s.colour = 'text';
  }
  function touch(s, k) { if (k === 'stroke' && s.match === 'text') s.match = 'off'; }
  const states = [['rest', 'Resting'], ['active', 'Selected'], ['hover', 'Pointed at']];

  STUDIO.add({
    id: 'icons', ground: true, name: 'Icons',
    title: () => 'icons',
    defaults, today: I.today || {}, measured: !!I.measured,
    groups, keep: [], looks, states,
    reach: [['system', 'The icon set and its rules', 'Change how icons are drawn and placed everywhere they are used.'], ['one', 'Only the icons shown', 'Restyle just the icons drawn here and leave the rest alone.']],
    fix, touch, vars, still, live, scene, share, warn, notes, summary,
    tile: (c) => TILES[c.k] || null,
    tall: () => true,
  });
}
