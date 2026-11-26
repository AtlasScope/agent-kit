/* ===== Surface module: the material, shape, depth and edges of cards, panels, fields and menus =====
   One small page is drawn everywhere: a card (heading, a line of text, a field, a row inside it) and a menu floating
   above it, on the project's page colour, with coloured shapes behind so see-through surfaces show what they do.
   look(s) works out every colour, shadow and line once; vars(s) hands them to the drawing as --su-* properties. */
{
  const C = COLOUR;
  const SP = Object.assign({ measured: false, today: {}, drop: [], words: {} }, P.surface || {});
  const WD = SP.words && typeof SP.words === 'object' ? SP.words : {};

  /* ---- small helpers ---- */
  const lim = (x, a, b) => Math.min(b, Math.max(a, x));
  const r2 = (x) => Math.round(x * 100) / 100;
  const r1 = (x) => Math.round(x * 10) / 10;
  const rgbOf = (h) => C.hexRgb(h);
  const mix = (a, b, t) => { const x = rgbOf(a), y = rgbOf(b); return C.rgbHex(x.map((v, i) => v + (y[i] - v) * t)); };
  const rgba = (h, a) => { const [r, g, b] = rgbOf(h).map((v) => Math.round(v * 255)); return `rgba(${r},${g},${b},${r2(lim(a, 0, 1))})`; };
  const over = (fg, a, bg) => mix(bg, fg, lim(a, 0, 1));

  /* ---- the page the surfaces sit on ---- */
  const BG_HEX = { black: '#000000', white: '#FFFFFF', light: '#EEF1F0', paper: '#F4EFE6', studio: '#0F1213' };
  const brand = () => { try { const b = P.brand; return C.oklch(+b[3], +b[2], +b[1]); } catch { return '#2F6BE0'; } };
  const hexOr = (v, d) => (typeof v === 'string' && C.HEX.test(v) ? v : d);
  function env(lightOver) {
    const R = shared('roles'), F = shared('fonts');
    const pal = !!R && V.bg === 'page';
    const page = V.bg === 'page' ? pageColour() : BG_HEX[V.bg] || (bgLight() ? '#EEF1F0' : '#0B0E0D');
    const light = lightOver != null ? !!lightOver : C.lum(page) > 0.3;
    const acc = hexOr(pal && R.accent, brand());
    const [aL, aC, aH] = C.toOklch(acc);
    return {
      page, light, pal, acc,
      acc2: C.oklch(lim(aL, 0.5, 0.78), Math.max(aC, 0.1), (aH + 135) % 360),
      text: hexOr(pal && R.text, light ? '#14181A' : '#F3F5F4'),
      text2: hexOr(pal && R.text2, light ? '#4A5356' : '#B4BDBA'),
      surf: pal ? hexOr(R.surface, null) : null,
      bad: light ? '#B42318' : '#F87171',
      font: F && F.body ? F.body : '', display: F && F.display ? F.display : '',
    };
  }

  /* ---- the choices ---- */
  const DIR = { top: [0, 1], topleft: [0.7, 0.7], topright: [-0.7, 0.7], ambient: [0, 0.18], below: [0, -1] };
  const ANG = { top: 180, topleft: 135, topright: 225, ambient: 160, below: 0 };
  const MATS = {
    solid: 'Solid', frosted: 'Frosted glass', clear: 'Clear glass', tinted: 'Tinted', paper: 'Paper', satin: 'Satin metal', sheen: 'Soft sheen', outline: 'Outline only', pressed: 'Soft and pressed',
  };
  /* What a material brings with it: how see-through, how blurred, its texture. The person can change each afterwards. */
  const MAT_SET = {
    solid: { alpha: 100, blur: 0, tex: 'none' },
    frosted: { alpha: 55, blur: 18, tex: 'none' },
    clear: { alpha: 40, blur: 8, tex: 'none' },
    tinted: { alpha: 100, blur: 0, tex: 'none' },
    paper: { alpha: 100, blur: 0, tex: 'paper', texa: 55 },
    satin: { alpha: 100, blur: 0, tex: 'brushed', texa: 35 },
    sheen: { alpha: 100, blur: 0, tex: 'none' },
    outline: { alpha: 100, blur: 0, tex: 'none', edge: 'firm', bw: 1.5, ba: 60, depth: 0 },
    pressed: { alpha: 100, blur: 0, tex: 'none', edge: 'none', bw: 0, ba: 0, depth: 50 },
  };
  const EDGE_SET = {
    none: { bw: 0, ba: 0 }, hairline: { bw: 1, ba: 20 }, firm: { bw: 1.5, ba: 45 }, lit: { bw: 1, ba: 16 },
    double: { bw: 1, ba: 35 }, accent: { bw: 1.5, ba: 100 }, ink: { bw: 2, ba: 100 },
  };
  const SHADOWS = ['soft', 'crisp', 'long', 'layered', 'coloured', 'hard'];
  const TEXS = ['none', 'grain', 'paper', 'dots', 'lines', 'grid', 'brushed'];
  const LAYERS = ['same', 'lighter', 'darker', 'sunken', 'tinted'];

  /* ---- shadows ---- */
  function outer(kind, d, dir, E) {
    if (d <= 0) return '';
    const [dx, dy] = DIR[dir] || DIR.top;
    const px = (v) => r1(v);
    const k = E.light ? 1 : 1.7;
    const c = (a) => rgba(E.light ? '#141E32' : '#000000', Math.min(0.92, a * k));
    switch (kind) {
      case 'crisp': return `${px(dx * (2 + 8 * d))}px ${px(dy * (2 + 10 * d))}px ${px(2 + 6 * d)}px ${c(0.22 + 0.24 * d)}, ${px(dx)}px ${px(dy)}px 0 ${c(0.12)}`;
      case 'long': return `${px(dx * (14 + 50 * d))}px ${px(dy * (14 + 50 * d))}px ${px(16 + 24 * d)}px ${px(-(10 + 10 * d))}px ${c(0.3 + 0.1 * d)}`;
      case 'layered': return [1, 2, 4, 8, 16].map((n) => `${px(dx * n * d * 0.9)}px ${px(dy * n * (0.45 + d * 0.9))}px ${px(n * (1 + d * 1.4))}px ${c(0.06 + 0.075 * d)}`).join(', ');
      case 'coloured': return `${px(dx * (6 + 18 * d))}px ${px(dy * (10 + 28 * d))}px ${px(20 + 40 * d)}px -4px ${rgba(E.acc, 0.3 + 0.22 * d)}, ${px(dx * 2)}px ${px(dy * 2)}px 6px ${c(0.08)}`;
      case 'hard': { const o = px(4 + 12 * d), sx = dx < -0.3 ? -1 : 1, sy = dy < -0.3 ? -1 : 1; return `${sx * o}px ${sy * o}px 0 0 ${rgba(E.text, 0.92)}`; }
      default: return `${px(dx * 24 * d)}px ${px(dy * (4 + 28 * d))}px ${px(12 + 44 * d)}px ${px(-(2 + 4 * d))}px ${c(0.16 + 0.28 * d)}`;
    }
  }
  /** A thin bright edge on the side the light comes from. */
  function lightLine(dir, hl, E) {
    const a = (hl / 100) * (E.light ? 0.95 : 0.2);
    if (a < 0.01) return '';
    const [dx, dy] = DIR[dir] || DIR.top;
    const sx = dx > 0.3 ? 1 : dx < -0.3 ? -1 : 0, sy = dy > 0.3 ? 1 : dy < -0.3 ? -1 : 0;
    return sx || sy ? `inset ${sx}px ${sy}px 0 0 rgba(255,255,255,${r2(a)})` : `inset 0 0 0 1px rgba(255,255,255,${r2(a)})`;
  }
  /** Pushed-in surfaces: a dark shadow inside the lit edge and a light one inside the far edge. */
  function pressedShadow(d, dir, E) {
    const [dx0, dy0] = dir === 'ambient' ? [0.7, 0.7] : DIR[dir] || DIR.top;
    const o = r1(2 + 7 * d), b = r1(5 + 14 * d);
    const dark = E.light ? 'rgba(20,30,50,0.2)' : 'rgba(0,0,0,0.6)', lite = E.light ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.07)';
    return `inset ${r1(dx0 * o)}px ${r1(dy0 * o)}px ${b}px ${dark}, inset ${r1(-dx0 * o)}px ${r1(-dy0 * o)}px ${b}px ${lite}`;
  }
  function raisedSoft(d, dir, E) {
    const [dx0, dy0] = dir === 'ambient' ? [0.7, 0.7] : DIR[dir] || DIR.top;
    const o = r1(3 + 9 * d), b = r1(7 + 18 * d);
    const dark = E.light ? 'rgba(20,30,50,0.2)' : 'rgba(0,0,0,0.65)', lite = E.light ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.07)';
    return `${r1(dx0 * o)}px ${r1(dy0 * o)}px ${b}px ${dark}, ${r1(-dx0 * o)}px ${r1(-dy0 * o)}px ${b}px ${lite}`;
  }

  /* ---- textures: inline SVG only ---- */
  const svgUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  function texture(id, strength, E) {
    const k = lim(strength, 0, 100) / 100;
    if (id === 'none' || !TEXS.includes(id) || k <= 0) return 'none';
    const ink = E.light ? [20, 24, 26] : [255, 255, 255];
    const rgb = `rgb(${ink.join(',')})`;
    const NS = 'xmlns="http://www.w3.org/2000/svg"';
    const noise = (freq, oct, w, a, col) => svgUrl(`<svg ${NS} width="${w}" height="${w}"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${oct}" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 ${r2(col[0] / 255)} 0 0 0 0 ${r2(col[1] / 255)} 0 0 0 0 ${r2(col[2] / 255)} 0 0 0 ${r2(a)} 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`);
    switch (id) {
      case 'grain': return noise('.85', 3, 140, k * (E.light ? 0.9 : 0.5), ink);
      case 'paper': return noise('.12 .5', 3, 220, k * (E.light ? 0.6 : 0.4), E.light ? [110, 85, 50] : ink);
      case 'dots': return svgUrl(`<svg ${NS} width="10" height="10"><circle cx="5" cy="5" r="1.1" fill="${rgb}" fill-opacity="${r2(k * 0.5)}"/></svg>`);
      case 'lines': return svgUrl(`<svg ${NS} width="8" height="8"><path d="M-2 2L2 -2M0 8L8 0M6 10L10 6" stroke="${rgb}" stroke-opacity="${r2(k * 0.45)}" stroke-width="1" fill="none"/></svg>`);
      case 'grid': return svgUrl(`<svg ${NS} width="24" height="24"><path d="M24 0V24H0" fill="none" stroke="${rgb}" stroke-opacity="${r2(k * 0.35)}" stroke-width="1"/></svg>`);
      default: return svgUrl(`<svg ${NS} width="200" height="9" fill="${rgb}"><rect y="0" width="200" height="1" fill-opacity="${r2(k * 0.3)}"/><rect y="2" width="200" height="1" fill-opacity="${r2(k * 0.1)}"/><rect y="3" width="200" height="1" fill-opacity="${r2(k * 0.38)}"/><rect y="5" width="200" height="1" fill-opacity="${r2(k * 0.16)}"/><rect y="7" width="200" height="1" fill-opacity="${r2(k * 0.28)}"/></svg>`);
    }
  }

  /* ---- everything a drawing needs, from one state ---- */
  function look(s, lightOver) {
    const E = env(lightOver), d = s.depth / 100, a = s.alpha / 100;
    const surf = E.surf || (E.light ? '#FFFFFF' : mix(E.page, '#FFFFFF', 0.06 + 0.07 * d));
    const ang = ANG[s.light] == null ? 180 : ANG[s.light];
    let bg, base = surf, ea = a, sat = 1;
    switch (s.material) {
      case 'frosted': bg = rgba(surf, a); sat = 1.6; break;
      case 'clear': {
        const [h, l] = E.light ? [1.4, 0.4] : [0.4, 0.1];
        bg = `linear-gradient(${ang}deg,${rgba('#FFFFFF', a * h)},${rgba('#FFFFFF', a * l)})`; base = '#FFFFFF'; ea = a * (h + l) / 2; sat = 1.4; break;
      }
      case 'tinted': base = mix(surf, E.acc, E.light ? 0.16 : 0.24); bg = rgba(base, a); break;
      case 'paper': base = E.light ? mix(surf, '#F1E4C6', 0.55) : mix(surf, '#CDBB92', 0.12); bg = rgba(base, a); break;
      case 'satin': {
        const hi = mix(surf, '#FFFFFF', E.light ? 0.8 : 0.16), lo = mix(surf, '#000000', E.light ? 0.17 : 0.38);
        bg = `linear-gradient(${ang}deg,${rgba(hi, a)} 0%,${rgba(surf, a)} 38%,${rgba(lo, a)} 62%,${rgba(mix(surf, hi, 0.5), a)} 100%)`; break;
      }
      case 'sheen': {
        const hi = E.light ? '#FFFFFF' : mix(surf, '#FFFFFF', 0.1), lo = E.light ? mix(surf, '#000000', 0.06) : surf;
        bg = `linear-gradient(${ang}deg,${rgba(hi, a)},${rgba(lo, a)})`; base = mix(hi, lo, 0.5); break;
      }
      case 'outline': bg = 'transparent'; base = E.page; ea = 0; break;
      case 'pressed': base = E.page; bg = rgba(E.page, 1); break;
      default: bg = rgba(surf, a);
    }
    const bw = s.edge === 'none' ? 0 : s.bw, ba = s.ba / 100;
    const lineCol = s.edge === 'accent' ? rgba(E.acc, ba || 1) : rgba(E.text, ba);
    const bd = bw > 0 ? `${bw}px solid ${lineCol}` : 'none';
    const decor = [];
    if (s.edge === 'lit') decor.push(`inset 0 1px 0 rgba(255,255,255,${E.light ? 0.95 : 0.2})`, `inset 0 -1px 0 rgba(0,0,0,${E.light ? 0.08 : 0.45})`);
    if (s.edge === 'double') decor.push(`inset 0 0 0 3px ${rgba(base, Math.max(a, 0.9))}`, `inset 0 0 0 4px ${rgba(E.text, ba)}`);
    const pressed = s.material === 'pressed';
    const lit = pressed ? '' : lightLine(s.light, s.hl, E);
    const out = pressed ? pressedShadow(d, s.light, E) : outer(s.shadow, d, s.light, E);
    const up = pressed ? out : outer(s.shadow, Math.min(1, d + 0.22), s.light, E);
    const join = (...x) => x.filter(Boolean).join(', ') || 'none';
    const r = s.radius, rs = r >= 36 ? 999 : Math.round(r * 0.6), rm = r >= 36 ? 24 : Math.round(r * 0.75);
    /* things inside the card: the field and the row */
    const nb = s.material === 'clear' ? surf : base; // things inside clear glass are judged against the surface, not the white sheen
    const dk = (t) => mix(nb, '#000000', t);
    const nest = {
      same: ['transparent', 'none'],
      lighter: [mix(nb, '#FFFFFF', E.light ? 0.6 : 0.07), `0 1px 2px rgba(0,0,0,${E.light ? 0.14 : 0.5})`],
      darker: [dk(E.light ? 0.045 : 0.28), 'none'],
      sunken: [dk(E.light ? 0.07 : 0.4), `inset 0 1px 3px rgba(0,0,0,${E.light ? 0.22 : 0.6})`],
      tinted: [mix(nb, E.acc, E.light ? 0.11 : 0.18), 'none'],
    }[s.layers] || ['transparent', 'none'];
    const fa = bw > 0 ? ba : 0.24;
    const fbw = bw > 0 ? lim(bw, 1, 2) : 1;
    const blurCss = s.blur > 0 || sat !== 1 ? `blur(${s.blur}px) saturate(${sat})` : 'none';
    const menuDepth = Math.min(1, Math.max(d + 0.25, 0.32));
    const menuShadow = pressed ? raisedSoft(menuDepth, s.light, E) : join(outer(s.shadow, menuDepth, s.light, E), lit);
    const raisedOnly = join(out, lit);
    return {
      E, base, ea, bw, ba, r, rs, rm, bg, bd, lit, out, raisedOnly, pressed,
      tex: texture(s.tex, s.texa, E), blurCss, sat,
      fieldLine: { w: fbw, a: fa, col: rgba(E.text, fa), hex: over(E.text, fa, nb), ground: nb },
      cardShadow: join(out, lit, ...decor), cardShadowUp: join(up, lit, ...decor),
      menuShadow, menuBg: s.material === 'outline' ? rgba(E.page, 1) : bg,
      nest,
    };
  }
  const lookOf = (s) => { try { return look(s); } catch (e) { report('surface look: ' + e.message); return null; } };

  function vars(s) {
    const L = lookOf(s);
    if (!L) return {};
    const E = L.E;
    return {
      '--su-page': E.page, '--su-text': E.text, '--su-text2': E.text2, '--su-acc': E.acc, '--su-acc2': E.acc2, '--su-bad': E.bad,
      '--su-font': E.font || 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
      '--su-display': E.display || E.font || 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
      '--su-r': L.r + 'px', '--su-rs': L.rs + 'px', '--su-rm': L.rm + 'px',
      '--su-bg': L.bg, '--su-bd': L.bd, '--su-shadow': L.cardShadow, '--su-shadow-up': L.cardShadowUp,
      '--su-menu-bg': L.menuBg, '--su-menu-shadow': L.menuShadow, '--su-blur': L.blurCss, '--su-tex': L.tex,
      '--su-n-bg': L.nest[0], '--su-n-sh': L.nest[1], '--su-fbd': `${L.fieldLine.w}px solid ${L.fieldLine.col}`,
    };
  }

  /* ---- words: the project's own where the agent found them ---- */
  function words() {
    let r0 = [], r1_ = [];
    try { r0 = (CX.rows && CX.rows[0]) || []; r1_ = (CX.rows && CX.rows[1]) || []; } catch {}
    let field = '', ph = '';
    try { field = CX.field; ph = CX.placeholder; } catch {}
    const menu = Array.isArray(WD.menu) && WD.menu.length ? WD.menu.map(String).slice(0, 4) : ['Rename', 'Duplicate', 'Move to folder', 'Delete'];
    return {
      title: String(WD.title || r0[0] || 'Weekly summary'), text: String(WD.text || 'Sent to your team every Monday morning.'),
      label: String(WD.label || field || 'Email'), ph: String(WD.placeholder || ph || 'name@example.com'),
      row: [String(WD.row || r1_[0] || 'Billing export'), String(r1_[1] || 'Updated yesterday')], menu,
    };
  }

  /* ---- drawings ---- */
  function compose(s, mode, o = {}) {
    const w = words(), L = lookOf(s);
    const full = mode !== 'tile', lift = !!L && !L.pressed && s.depth >= 15;
    const card = `<div class="su-card${lift ? ' su-lift' : ''}${o.hover ? ' su-hover' : ''}"><h4 class="su-h">${esc(w.title)}</h4>`
      + (full ? `<p class="su-p">${esc(w.text)}</p><span class="su-lbl">${esc(w.label)}</span>` : '')
      + `<div class="su-field${o.focus ? ' su-focus' : ''}"${o.live ? ' tabindex="0"' : ''}><span>${esc(w.ph)}</span></div>`
      + `<div class="su-row"><i></i><span>${esc(w.row[0])}</span><em>${esc(w.row[1])}</em></div></div>`;
    const items = w.menu.map((m, i) => `<li${i === 0 ? ' class="on"' : ''}${/^(delete|remove)/i.test(m) ? ' class="bad"' : ''}>${esc(m)}</li>`);
    if (items.length > 1) items.splice(items.length - 1, 0, '<li class="sep"></li>');
    const menu = full ? `<ul class="su-menu" role="menu">${items.join('')}</ul>` : '';
    return `<div class="su-stack${full ? ' su-full' : ''}"><i class="su-blob"></i><i class="su-band"></i>${card}${menu}</div>`;
  }
  /** What each tile draws: the same small page, with the option itself pushed far enough to be told apart. */
  function tileState(s, k) {
    const t = Object.assign({}, s);
    if (k === 'shadow' || k === 'light') t.depth = Math.max(t.depth, 55);
    if (k === 'blur') t.alpha = Math.min(t.alpha, 60);
    return t;
  }
  function still(s, opt = {}) {
    if (opt.tile) return `<div class="su su-tile bgd" ${bgAttr()}>${compose(tileState(s, opt.tile), 'tile')}</div>`;
    return `<div class="su bgd" ${bgAttr()}>${compose(s, 'full', { hover: opt.state === 'hover', focus: opt.state === 'focus' })}</div>`;
  }
  function live(el, s) {
    const bgStyle = V.bg === 'page' ? `;background:${pageColour()}` : '';
    el.innerHTML = `<div class="su su-live bgd ${dimCls('surface', s)}" data-bg="${esc(V.bg)}" style="${esc(varsCss(vars(s)) + bgStyle)}">`
      + compose(s, 'full', { live: true })
      + '<p class="su-note">The coloured shapes behind show how see-through the surfaces are.</p></div>';
  }

  /* ---- what other studios and the example page use ---- */
  function sceneLightNow() { try { return sceneLight(); } catch { return null; } }
  function scene(s) {
    const L = look(s, sceneLightNow());
    return { vars: {
      '--sc-radius': L.r + 'px', '--sc-radius-sm': L.rs + 'px', '--sc-border': L.bw + 'px', '--sc-border-a': String(r2(L.bw > 0 ? L.ba : 0)),
      '--sc-shadow': L.raisedOnly, '--sc-card-alpha': String(r2(L.ea)), '--sc-blur': (s.blur || 0) + 'px', '--sc-texture': L.tex,
    } };
  }
  function share(s) {
    const L = look(s);
    return { surface: {
      r: L.rs, rCard: L.r, border: L.bw, borderAlpha: r2(L.bw > 0 ? L.ba : 0), shadow: L.raisedOnly, depth: s.depth,
      material: s.material, blur: s.blur, alpha: r2(s.alpha / 100),
    } };
  }

  /* ---- checks and the proposal ---- */
  const ratioText = (v) => C.showRatio(v) + ' to 1';
  function warn(s) {
    const out = [], L = lookOf(s);
    if (!L) return out;
    const E = L.E;
    /* Words on a see-through surface: judged over the page and over the coloured shapes that may sit behind it. */
    if (L.ea > 0.02 && L.ea < 0.995) {
      const a2 = mix(E.page, E.acc, 0.5);
      const unders = s.blur >= 14 ? [E.page, a2] : [E.page, E.acc, E.acc2];
      const worst = Math.min(...unders.map((u) => C.ratio(E.text, over(L.base, L.ea, u))));
      if (worst < 4.5) out.push({ k: 'alpha', t: `Words on this surface read at only about ${ratioText(worst)} where something colourful sits behind it. Comfortable reading needs 4.5 to 1. A more solid surface, or more blur, brings it back.` });
    }
    const fbd = L.fieldLine;
    if (C.ratio(fbd.hex, fbd.ground) < 1.4 && L.bw > 0) out.push({ k: 'ba', t: `The line around a field is too faint to see clearly (about ${ratioText(C.ratio(fbd.hex, fbd.ground))}). People need to see where a field starts and ends. A stronger line fixes it.` });
    const defined = s.depth >= 12 || L.pressed || (L.bw > 0 && L.ba >= 0.1) || s.material === 'outline' || C.ratio(over(L.base, L.ea, E.page), E.page) >= 1.12;
    if (!defined) out.push({ k: 'edge', t: 'The card has no line, almost no shadow and nearly the same colour as the page, so it blends in and people cannot see where it ends. Add a line, a shadow or a different colour.' });
    if (s.texa >= 75 && s.tex !== 'none' && s.tex !== 'grain') out.push({ k: 'texa', soft: true, t: 'A texture this strong shows through the words and slows reading. Lower it, or keep it for surfaces with little text.' });
    return out;
  }
  function notes(s) {
    const L = look(s), out = [];
    const px = (v) => (v >= 999 ? '999px (a full pill)' : v + 'px');
    out.push(`Surface shape: cards and panels border-radius ${px(L.r)}; fields and small controls ${px(L.rs)}; menus and popovers ${px(L.rm)}.`);
    out.push(`Surface material, ${MATS[s.material] || s.material}: background ${L.bg}${L.bw > 0 ? `; border ${L.bd}` : '; no border'}${s.blur > 0 || L.sat !== 1 ? `; backdrop-filter ${L.blurCss}` : ''}. Opacity ${s.alpha}%${s.alpha < 100 ? ', so keep a solid fallback colour under @supports not (backdrop-filter: blur(1px))' : ''}.`);
    out.push(`Surface depth ${s.depth} of 100, ${s.shadow} shadow, light from ${({ top: 'above', topleft: 'the top left', topright: 'the top right', ambient: 'all round', below: 'below' })[s.light] || 'above'}: resting box-shadow ${L.cardShadow}; lifted (hover or focus within) ${L.cardShadowUp}${L.pressed ? '' : ' with transform translateY(-3px)'}; menus box-shadow ${L.menuShadow}.`);
    out.push(`Surface layers: things inside a card are ${({ same: 'the card colour, outlined only', lighter: 'lighter than the card with a small shadow', darker: 'a step darker than the card', sunken: 'sunken, with an inner shadow', tinted: 'washed with the brand colour' })[s.layers]}${L.nest[0] !== 'transparent' ? ` (background ${L.nest[0]}${L.nest[1] !== 'none' ? ', box-shadow ' + L.nest[1] : ''})` : ''}; field line ${L.fieldLine.w}px ${L.fieldLine.col}.`);
    if (s.tex !== 'none') out.push(`Surface texture, ${({ grain: 'fine grain', paper: 'paper fibre', dots: 'dots', lines: 'diagonal lines', grid: 'grid', brushed: 'brushed' })[s.tex]} at ${s.texa}%: an inline SVG as a background-image on a ::before layer (pointer-events none, same radius as the surface): ${L.tex}`);
    out.push('Surface tokens to create or update, in the format the project already uses: radius (card, small, menu), border width and colour, shadow (rest, lifted, menu), blur, opacity and texture. Use them in every card, panel, field and menu instead of repeating values.');
    return out;
  }

  /* ---- controls ---- */
  const E_ = (v, n, d, set) => Object.assign(o(v, n, d), set ? { set } : {});
  const ofMat = (id, n, d) => E_(id, n, d, MAT_SET[id]);
  const ofEdge = (id, n, d) => E_(id, n, d, EDGE_SET[id]);
  const groups = [
    { id: 'material', t: 'Material', sec: 'Look', why: 'What the surface is made of. This sets how it takes light, and whether you can see through it.',
      ctl: [ch('material', 'Material', [
        ofMat('solid', 'Solid', 'A plain opaque surface. Calm and dependable.'),
        ofMat('frosted', 'Frosted glass', 'Half see-through, with what is behind it blurred into a soft haze.'),
        ofMat('clear', 'Clear glass', 'Almost see-through, with a faint sheen. What is behind shows through.'),
        ofMat('tinted', 'Tinted', 'The brand colour washed lightly into the surface.'),
        ofMat('paper', 'Paper', 'A warm, matte sheet with a faint fibre. Feels printed and calm.'),
        ofMat('satin', 'Satin metal', 'A smooth surface that catches the light in soft bands.'),
        ofMat('sheen', 'Soft sheen', 'A gentle fade from light to slightly darker. A little polish, nothing loud.'),
        ofMat('outline', 'Outline only', 'No fill and no shadow, just a clear line. The page shows through.'),
        ofMat('pressed', 'Soft and pressed', 'Looks gently pushed into the page, like soft clay.')])] },
    { id: 'shape', t: 'Shape', sec: 'Look', why: 'How round the corners are. Square feels exact and serious; round feels friendly. Fields and menus follow the card.',
      ctl: [ch('radius', 'Corners', [
        o(0, 'Sharp', 'Square corners. Exact, serious and a little severe.'), o(4, 'Crisp', 'Barely softened. Precise but not harsh.'),
        o(8, 'Gentle', 'Slightly rounded, the usual for working software.'), o(12, 'Soft', 'Clearly rounded without looking playful.'),
        o(16, 'Rounded', 'Friendly and modern.'), o(24, 'Very round', 'Big, generous curves. Soft and approachable.'),
        o(32, 'Pillowy', 'Almost bubble-like on small surfaces.'), o(40, 'Pill', 'Fully rounded ends, and fields become pills too.')]),
      rg('radius', 'Exact corner size', 0, 40, 1, 'px', 'The corner of a card, in pixels. Fields and menus are worked out from it.')] },
    { id: 'depth', t: 'Depth', sec: 'Depth', why: 'How far the surface rises above the page, and what its shadow looks like.',
      ctl: [ch('depth', 'How high', [
        o(0, 'Flat', 'Sits on the page with no shadow.'), o(15, 'Barely there', 'A whisper of shadow. Enough to tell it from the page.'),
        o(35, 'Raised', 'A clear but quiet lift. The usual for cards.'), o(55, 'Lifted', 'Visibly above the page.'),
        o(78, 'Floating', 'Well above the page, with a wide shadow.'), o(100, 'Far above', 'As high as it goes. Dramatic.')]),
      ch('shadow', 'Shadow style', [
        o('soft', 'Soft', 'One wide, gentle shadow. Calm and natural.'), o('crisp', 'Crisp', 'A tight, sharp shadow just underneath. Precise.'),
        o('long', 'Long', 'A shadow that stretches away at an angle, as if lit low.'), o('layered', 'Layered', 'Several shadows stacked into one smooth, realistic lift.'),
        o('coloured', 'Coloured', 'A glow of the brand colour underneath instead of grey.'), o('hard', 'Hard block', 'A solid block with no blur. Bold and graphic.')]),
      rg('depth', 'Exact height', 0, 100, 1, '', '0 is flat on the page, 100 is as high as it goes.')] },
    { id: 'edges', t: 'Edges', sec: 'Edges', why: 'The line around a surface, if any. It also decides how clearly fields and rows inside it can be told apart.',
      ctl: [ch('edge', 'Edge', [
        ofEdge('none', 'No edge', 'The surface ends where its colour ends. Fields still keep a quiet line.'), ofEdge('hairline', 'Hairline', 'A thin, quiet line.'),
        ofEdge('firm', 'Firm line', 'A clear, thicker line that draws the shape.'), ofEdge('lit', 'Lit edge', 'A thin line, a bright top edge and a darker bottom edge, like a bevel.'),
        ofEdge('double', 'Double line', 'A line with a second line just inside it.'), ofEdge('accent', 'Brand line', 'A line in the brand colour.'),
        ofEdge('ink', 'Heavy ink', 'A thick, full-strength outline. Bold and graphic.')]),
      rg('bw', 'Line thickness', 0, 4, 0.5, 'px', 'How thick the line is, in pixels.'),
      rg('ba', 'Line strength', 0, 100, 5, '%', 'How strong the line is. Low is a whisper; 100 is the full text colour.')] },
    { id: 'light', extra: 1, t: 'Light', sec: 'Light', why: 'Where the light comes from. It decides which way shadows fall and which edge catches a bright line.',
      ctl: [ch('light', 'Light from', [
        o('top', 'From above', 'Shadows fall straight down. The most natural.'), o('topleft', 'From the top left', 'Shadows fall to the bottom right, like most interface drawings.'),
        o('topright', 'From the top right', 'Shadows fall to the bottom left.'), o('ambient', 'Even all round', 'Soft light from everywhere. Small shadows, a thin bright rim.'),
        o('below', 'From below', 'Shadows fall upward. Dramatic and unusual.')]),
      rg('hl', 'Bright edge', 0, 100, 5, '%', 'How strongly the lit edge shines. Easiest to see on tinted or dark surfaces.')] },
    { id: 'glass', extra: 2, t: 'See-through', sec: 'Light', why: 'How much of what is behind a surface shows through, and how blurred it is.',
      ctl: [ch('alpha', 'How solid', [
        o(100, 'Solid', 'Nothing shows through.'), o(88, 'Slightly clear', 'A hint of what is behind.'), o(70, 'Milky', 'What is behind glows through softly.'),
        o(52, 'Half clear', 'Half the colour, half what is behind.'), o(32, 'Mostly clear', 'Mostly see-through. Words need care.'), o(14, 'Almost invisible', 'Only a trace of surface is left.')]),
      ch('blur', 'Blur behind', [
        o(0, 'None', 'What is behind stays sharp.'), o(4, 'A hint', 'Slightly softened.'), o(10, 'Soft', 'Clearly softened. Shapes stay readable.'),
        o(18, 'Frosted', 'Shapes melt into a haze.'), o(28, 'Heavy', 'Only colour comes through.'), o(40, 'Deep', 'Pure colour, no shapes.')]),
      rg('alpha', 'Exact solidness', 10, 100, 1, '%', '100 is solid; lower lets more of what is behind show through.'),
      rg('blur', 'Exact blur', 0, 40, 1, 'px', 'How much what is behind is blurred.')] },
    { id: 'texture', extra: 3, t: 'Texture', sec: 'Light', why: 'A fine pattern over the surface so it feels like a material. Drawn in code, with no image files.',
      ctl: [ch('tex', 'Texture', [
        o('none', 'Smooth', 'Clean, with no pattern.'), o('grain', 'Fine grain', 'A speckle, like fine paper or film.'), o('paper', 'Paper fibre', 'Soft horizontal fibres, like handmade paper.'),
        o('dots', 'Dots', 'A regular grid of tiny dots.'), o('lines', 'Diagonal lines', 'Thin slanted lines, like a hatched print.'),
        o('grid', 'Grid', 'Thin squares, like graph paper.'), o('brushed', 'Brushed', 'Fine horizontal streaks, like brushed metal.')]),
      rg('texa', 'Texture strength', 0, 100, 5, '%', 'How strongly the pattern shows.')] },
    { id: 'layers', extra: 4, t: 'Layers', sec: 'Light', why: 'How things inside a card, such as fields and rows, differ from the card around them.',
      ctl: [ch('layers', 'Inside the card', [
        o('same', 'Same colour', 'Fields and rows keep the card’s colour and are drawn with a line only.'), o('lighter', 'Stepped lighter', 'Things inside sit lighter, as if raised a little.'),
        o('darker', 'Stepped darker', 'Things inside are a step darker, like a well.'), o('sunken', 'Sunken', 'Pressed in, with a soft shadow inside the top edge.'),
        o('tinted', 'Tinted', 'Things inside are washed with the brand colour.')])] },
  ];

  const defaults = { material: 'solid', radius: 14, depth: 35, shadow: 'layered', edge: 'hairline', bw: 1, ba: 20, light: 'top', hl: 50, alpha: 100, blur: 0, tex: 'none', texa: 40, layers: 'darker' };
  const L_ = (id, n, d, p) => ({ id, n, d, patch: Object.assign({}, defaults, p) });
  const looks = [
    L_('paper', 'Calm paper', 'Warm paper with a fibre you can almost feel, a soft shadow and gentle corners.',
      { material: 'paper', radius: 12, depth: 22, shadow: 'soft', edge: 'hairline', bw: 1, ba: 22, hl: 30, tex: 'paper', texa: 55, layers: 'darker' }),
    L_('crisp', 'Crisp flat', 'No shadows at all, small corners and a clear line. Quick to read and very precise.',
      { material: 'solid', radius: 6, depth: 0, shadow: 'crisp', edge: 'firm', bw: 1.5, ba: 45, hl: 0, layers: 'same' }),
    L_('soft', 'Soft depth', 'Round, quiet cards lifted off the page by a smooth layered shadow and no line.',
      { material: 'solid', radius: 20, depth: 55, shadow: 'layered', edge: 'none', bw: 0, ba: 0, hl: 50, layers: 'darker' }),
    L_('glass', 'Frosted glass', 'Half see-through panels that blur whatever is behind them, with a bright edge.',
      { material: 'frosted', radius: 20, depth: 45, shadow: 'soft', edge: 'lit', bw: 1, ba: 16, light: 'topleft', hl: 70, alpha: 55, blur: 20, layers: 'lighter' }),
    L_('pressed', 'Soft and pressed', 'Surfaces that look gently pushed into the page, like soft clay.',
      { material: 'pressed', radius: 24, depth: 50, shadow: 'soft', edge: 'none', bw: 0, ba: 0, light: 'topleft', hl: 0, layers: 'sunken' }),
    L_('technical', 'Hairline technical', 'Nearly square, flat, with a thin line and a faint grid, like a drawing board.',
      { material: 'solid', radius: 2, depth: 0, shadow: 'crisp', edge: 'hairline', bw: 1, ba: 30, hl: 0, tex: 'grid', texa: 22, layers: 'same' }),
    L_('blunt', 'Bold and blunt', 'Square blocks with a heavy outline and a hard block shadow. Loud and graphic.',
      { material: 'solid', radius: 0, depth: 60, shadow: 'hard', edge: 'ink', bw: 2, ba: 100, hl: 0, layers: 'darker' }),
    L_('satin', 'Luxe satin', 'Smooth metallic panels with a bevelled edge, soft bands of light and a deep shadow.',
      { material: 'satin', radius: 16, depth: 62, shadow: 'layered', edge: 'lit', bw: 1, ba: 16, light: 'topleft', hl: 80, tex: 'brushed', texa: 30, layers: 'lighter' }),
  ];

  const clamp = (v, a, b, d) => (typeof v === 'number' && isFinite(v) ? lim(v, a, b) : d);
  const oneOf = (v, list, d) => (list.includes(v) ? v : d);
  function fix(s) {
    s.material = oneOf(s.material, Object.keys(MATS), 'solid');
    s.shadow = oneOf(s.shadow, SHADOWS, 'soft');
    s.edge = oneOf(s.edge, Object.keys(EDGE_SET), 'hairline');
    s.light = oneOf(s.light, Object.keys(DIR), 'top');
    s.tex = oneOf(s.tex, TEXS, 'none');
    s.layers = oneOf(s.layers, LAYERS, 'same');
    s.radius = Math.round(clamp(s.radius, 0, 40, 14));
    s.depth = Math.round(clamp(s.depth, 0, 100, 35));
    s.bw = Math.round(clamp(s.bw, 0, 4, 1) * 2) / 2;
    s.ba = Math.round(clamp(s.ba, 0, 100, 20));
    s.hl = Math.round(clamp(s.hl, 0, 100, 50));
    s.alpha = Math.round(clamp(s.alpha, 10, 100, 100));
    s.blur = Math.round(clamp(s.blur, 0, 40, 0));
    s.texa = Math.round(clamp(s.texa, 0, 100, 40));
  }
  /* Moving the line sliders brings a "No edge" surface back to a hairline, so the slider does something. */
  function touch(s, k) {
    if ((k === 'bw' || k === 'ba') && s.edge === 'none' && (k === 'bw' ? s.bw : s.ba) > 0) s.edge = 'hairline';
  }
  function summary(s) {
    const l = looks.find((x) => Object.keys(x.patch).every((k) => sameValue(x.patch[k], s[k])));
    return l ? l.n : `${MATS[s.material] || 'Surface'}, ${s.radius}px corners, depth ${s.depth}`;
  }

  STUDIO.add({
    id: 'surface', ground: true, name: 'Surface',
    title: () => 'surfaces',
    defaults, today: SP.today || {}, measured: !!SP.measured,
    groups, keep: [], looks,
    fix, touch, vars, still, live, scene, share, warn, notes, summary,
    tile: () => ({}), tall: () => true,
    states: [['rest', 'At rest'], ['hover', 'Pointed at'], ['focus', 'Field selected']],
    reach: [
      ['system', 'The shared surface styles', 'Change the card, panel, field and menu styles every screen is built from, so all of them follow.'],
      ['one', 'Only the surfaces shown', 'Change just the cards, panels and menus drawn here and leave the rest of the product alone.'],
    ],
  });
}
