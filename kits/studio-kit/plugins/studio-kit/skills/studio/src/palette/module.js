/* ===== Palette module: a whole colour identity, built on Palette Builder's roles and colour maths (COLOUR) =====
   State is a handful of plain numbers and names. roles(s) turns them into the thirteen role colours every drawing
   uses: page, surface, line, control, text, text2, text3, accent, fill, on-fill, ok, warn, bad.
   Greys and words are nudged until they are readable; the accent and the main button are not, so a choice that
   fails says so (warn) instead of quietly changing colour. */
{
  const C = COLOUR;
  const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
  const lim = (x, a, b) => Math.min(b, Math.max(a, x));
  const r2 = (x) => Math.round(x * 100) / 100;
  const ACC = { dark: 0.72, light: 0.5 }; // where the accent sits before "How light" moves it

  const DEFAULTS = {
    side: 'dark', base: 0.25, tint: 'Cool', gH: 258, gC: 0.016, tintk: 1, sep: 1,
    hue: 255, vivid: 0.14, lift: 0, fill: 'accent', fillHue: 27,
    stSet: 'classic', okH: 150, warnH: 78, badH: 27, stC: 0.13, textk: 0.5,
  };

  /* ---- the role colours ---- */
  /** The first lightness, moving away from the backgrounds, at which a colour reads against all of them. */
  const reach = (L, ch, H, against, min, up) => {
    for (let i = 0; i < 220; i++) {
      const hex = C.oklch(lim(L, 0, 1), ch, H);
      if (L <= 0 || L >= 1 || against.every((b) => C.ratio(hex, b) >= min)) return hex;
      L += up ? 0.005 : -0.005;
    }
    return C.oklch(lim(L, 0, 1), ch, H);
  };
  const cache = new Map();
  const roles = (s) => {
    const key = JSON.stringify(s);
    if (cache.has(key)) return cache.get(key);
    const dark = s.side !== 'light';
    const gH = num(s.gH, 258), gC = Math.max(0, num(s.gC, 0.016) * num(s.tintk, 1));
    const base = lim(num(s.base, 0.25), 0, 1), sp = lim(num(s.sep, 1), 0, 4), tk = lim(num(s.textk, 0.5), 0, 1);
    const pageL = dark ? 0.1 + base * 0.16 : 1 - base * 0.08;
    const surfL = dark ? pageL + 0.045 * sp : pageL + 0.035 * sp <= 1 ? pageL + 0.035 * sp : pageL - 0.03 * sp;
    const lineL = dark ? Math.max(pageL, surfL) + 0.06 * sp + 0.03 : Math.min(pageL, surfL) - 0.06 * sp - 0.03;
    const grey = (L, k = 1) => C.oklch(lim(L, 0, 1), gC * k, gH);
    const page = grey(pageL), surface = grey(surfL), line = grey(lineL), bgs = [page, surface];
    const control = reach(dark ? 0.5 : 0.64, gC * 0.9, gH, bgs, 3, dark);
    const text = reach(dark ? 0.86 + 0.13 * tk : 0.31 - 0.17 * tk, gC * 0.4, gH, bgs, 4.5, dark);
    const text2 = reach(dark ? 0.72 + 0.08 * tk : 0.45 - 0.08 * tk, gC * 0.5, gH, bgs, 4.5, dark);
    const text3 = reach(dark ? 0.62 + 0.05 * tk : 0.53 - 0.05 * tk, gC * 0.6, gH, bgs, 4.5, dark);

    const H = num(s.hue, 255), V = Math.max(0, num(s.vivid, 0.14)), none = V < 0.005;
    const aL = lim(ACC[dark ? 'dark' : 'light'] + num(s.lift, 0), 0.2, 0.97);
    const accent = none ? C.oklch(aL, gC * 0.5, gH) : C.oklch(aL, V, H);
    /** White or a deep shade of the fill's own colour, whichever reads better on it. */
    const onOf = (bg, h, c) => { const w = '#FFFFFF', d = C.oklch(0.18, Math.min(0.04, c), h); return C.ratio(w, bg) >= C.ratio(d, bg) ? w : d; };
    let fill, on;
    if (s.fill === 'ink') { fill = text; on = page; }
    else if (s.fill === 'soft') {
      const h = none ? gH : H, c = none ? gC : lim(V, 0.03, 0.07);
      fill = C.oklch(dark ? 0.3 : 0.93, c, h);
      on = reach(dark ? 0.86 : 0.38, none ? gC * 0.4 : Math.min(V, 0.14), h, [fill], 4.5, dark);
    } else if (s.fill === 'own') {
      const h = num(s.fillHue, 27), c = Math.max(V, 0.1);
      fill = C.oklch(aL, c, h); on = onOf(fill, h, c);
    } else { fill = accent; on = onOf(fill, none ? gH : H, none ? gC : V); }

    const sC = Math.max(0, num(s.stC, 0.13)), sig = (h) => reach(dark ? 0.76 : 0.5, sC, h, bgs, 4.5, dark);
    const out = { page, surface, line, control, text, text2, text3, accent, fill, 'on-fill': on, ok: sig(num(s.okH, 150)), warn: sig(num(s.warnH, 78)), bad: sig(num(s.badH, 27)) };
    if (cache.size > 400) cache.clear();
    cache.set(key, out);
    return out;
  };

  const ROLE = [
    ['page', 'Page background', 'Behind everything.'],
    ['surface', 'Cards and panels', 'Boxes that sit on the page: cards, menus, sidebars.'],
    ['line', 'Dividing lines', 'Borders and separators.'],
    ['control', 'Field edges', 'The outline of boxes people type in or tick.'],
    ['text', 'Main words', 'Headings and body text.'],
    ['text2', 'Secondary words', 'Descriptions and less important text.'],
    ['text3', 'Faint words', 'Hints, dates and placeholders.'],
    ['accent', 'Accent', 'Links, highlights and the selected item.'],
    ['fill', 'Main button', 'The one action you most want people to take.'],
    ['on-fill', 'Words on the main button', 'The label on that button.'],
    ['ok', 'Success', 'Saved, done, all good.'],
    ['warn', 'Caution', 'Needs a look.'],
    ['bad', 'Error', 'Failed, or something is wrong.'],
  ];
  const BOARD = [['Backgrounds and lines', ['page', 'surface', 'line', 'control']], ['Words', ['text', 'text2', 'text3']], ['Colour', ['accent', 'fill', 'on-fill']], ['Status', ['ok', 'warn', 'bad']]];
  /** Every pair of colours that must be readable together: [words, background, minimum, plain name, control to fix it]. */
  const pairs = (s) => [
    ['text', 'page', 4.5, 'Main words on the page', 'textk'],
    ['text', 'surface', 4.5, 'Main words on cards', 'textk'],
    ['text2', 'page', 4.5, 'Secondary words on the page', 'textk'],
    ['text3', 'page', 4.5, 'Faint words on the page', 'textk'],
    ['text3', 'surface', 4.5, 'Faint words on cards', 'textk'],
    ['accent', 'page', 4.5, 'Links on the page', 'lift'],
    ['accent', 'surface', 4.5, 'Links on cards', 'lift'],
    ['on-fill', 'fill', 4.5, 'Words on the main button', 'fill'],
    ...(s.fill === 'soft' ? [] : [['fill', 'page', 3, 'The main button against the page', 'fill']]),
    ['control', 'page', 3, 'Field edges on the page', 'sep'],
    ['ok', 'surface', 4.5, 'Success words on cards', 'stC'],
    ['warn', 'surface', 4.5, 'Caution words on cards', 'stC'],
    ['bad', 'surface', 4.5, 'Error words on cards', 'stC'],
  ];

  /* ---- choices ---- */
  const HUE = [
    [255, 'Blue', 'Dependable and familiar.'], [232, 'Sky', 'A lighter, airier blue.'], [210, 'Cyan', 'Cool and technical, like a screen glow.'],
    [182, 'Teal', 'Calm and fresh, between blue and green.'], [150, 'Green', 'Natural and positive. Can be mistaken for success.'],
    [128, 'Lime', 'Sharp and full of energy.'], [100, 'Yellow', 'Bright and cheerful. Hard to read on a light page.'],
    [78, 'Amber', 'Warm gold. Rich and friendly.'], [52, 'Orange', 'Warm and lively.'], [27, 'Red', 'Strong and urgent. Can be mistaken for an error.'],
    [355, 'Pink', 'Playful and warm.'], [300, 'Violet', 'Creative and a little unusual.'], [275, 'Indigo', 'Deep and thoughtful, between blue and violet.'],
  ];
  const hueOpts = () => HUE.map(([v, n, d]) => o(v, n, d));
  const hueName = (h) => HUE.reduce((b, x) => (Math.min(C.hue360(x[0] - h), C.hue360(h - x[0])) < Math.min(C.hue360(b[0] - h), C.hue360(h - b[0])) ? x : b))[1];
  const TINT_WORDS = {
    Neutral: ['Pure grey', 'Plain grey with no colour in it.'], Cool: ['Cool grey', 'A whisper of blue. Clean and modern.'],
    Navy: ['Navy', 'Deep blue greys. Serious and calm.'], Blue: ['Blue grey', 'Clearly blue greys, like slate.'],
    Indigo: ['Indigo', 'Blue greys leaning purple.'], Violet: ['Violet', 'Purple-tinged greys. Soft and unusual.'],
    Teal: ['Teal', 'Sea-green greys. Fresh.'], Green: ['Green', 'Leafy greys, like stone and moss.'],
    Olive: ['Olive', 'Earthy yellow-green greys.'], Sand: ['Sand', 'Beige greys, like paper or linen.'],
    Warm: ['Warm grey', 'A touch of brown. Friendly and soft.'], Rose: ['Rose', 'Pinkish greys. Gentle and warm.'],
  };
  const tintOpts = () => C.TINTS.map(([id, H, ch]) => Object.assign(o(id, (TINT_WORDS[id] || [id])[0], (TINT_WORDS[id] || [id, ''])[1]), { set: { gH: H, gC: ch } }));
  const SETS = [
    ['classic', 'Classic', 'Green, amber and red. What everyone expects.', { okH: 150, warnH: 78, badH: 27 }],
    ['gentle', 'Gentle', 'Teal, gold and coral. Softer on the eye.', { okH: 178, warnH: 92, badH: 18 }],
    ['bold', 'Bold', 'Lime, orange and crimson. Impossible to miss.', { okH: 138, warnH: 60, badH: 14 }],
  ];

  const groups = [
    { id: 'mode', t: 'Light or dark', sec: 'Overall', why: 'Whether the page is dark with light words or light with dark words, and how far the background goes.', ctl: [
      ch('side', 'Light or dark', [o('dark', 'Dark', 'Light words on a dark background.'), o('light', 'Light', 'Dark words on a light background.')]),
      ch('base', 'Background', [o(0, 'Pure', 'As far as it goes: black, or white.'), o(0.35, 'Softened', 'Just off black or white. Easier on the eyes.'), o(0.75, 'Muted', 'A deep grey, or a paper tone.')]),
      rg('base', 'How far from black or white', 0, 1, 0.01, '', 'Left is pure black or pure white.'),
    ] },
    { id: 'greys', t: 'Greys', sec: 'Overall', why: 'Greys make up most of the page: the background, cards, lines and words. A hint of colour in them sets the mood.', ctl: [
      ch('tint', 'Hint of colour', tintOpts()),
      ch('tintk', 'How much colour', [o(0.5, 'Barely', 'You only notice it next to plain grey.'), o(1, 'Lightly', 'A gentle hint.'), o(2, 'Clearly', 'Easy to see.'), o(3, 'Strongly', 'The greys become a colour of their own.')], { show: (s) => s.gC > 0 }),
      ch('sep', 'Cards and lines', [o(0.4, 'Flat', 'Cards and lines barely stand out from the page.'), o(1, 'Gentle', 'Cards and lines are easy to see but quiet.'), o(1.7, 'Clear', 'Cards stand well apart from the page.'), o(2.5, 'Bold', 'Strong steps between the page, cards and lines.')]),
      rg('tintk', 'How much colour', 0, 4, 0.05, '', '', { show: (s) => s.gC > 0 }),
      rg('sep', 'Cards and lines', 0.2, 3, 0.05, '', 'How far apart the page, cards and lines are.'),
      rg('gH', 'Hint of colour, exact', 0, 359, 1, '', 'Slide through every colour.', { show: (s) => s.gC > 0, inSpec: false }),
    ] },
    { id: 'accent', t: 'Accent colour', sec: 'Colour', why: 'The one colour that marks links, highlights and the selected item.', ctl: [
      ch('hue', 'Colour', hueOpts()),
      ch('vivid', 'How vivid', [o(0, 'None', 'No colour at all. Links and highlights in grey.'), o(0.05, 'Greyed', 'Only just coloured. Very quiet.'), o(0.09, 'Soft', 'Gentle colour.'), o(0.14, 'Clear', 'Plainly coloured, not shouting.'), o(0.2, 'Vivid', 'Rich and bright.'), o(0.28, 'Loud', 'As strong as screens can show.')]),
      ch('lift', 'How light', [o(-0.12, 'Deeper', 'A darker shade.'), o(0, 'Middle', 'The usual shade for this background.'), o(0.12, 'Lighter', 'A paler shade.')]),
      rg('hue', 'Exact colour', 0, 359, 1, '', 'Slide through every colour.'),
      rg('vivid', 'How vivid', 0, 0.32, 0.005, '', ''),
      rg('lift', 'How light', -0.3, 0.25, 0.01, '', 'Lighter or darker than usual. Too far and links get hard to read.'),
    ] },
    { id: 'action', t: 'Main button', sec: 'Colour', why: 'The colour of the one action you most want people to take. The words on it are picked to stay readable.', ctl: [
      ch('fill', 'Button colour', [o('accent', 'Accent colour', 'The same colour as links and highlights.'), o('ink', 'Black or white', 'The colour of the words: white on dark, near black on light.'), o('own', 'Its own colour', 'A second colour, just for the main button.'), o('soft', 'Soft wash', 'A pale wash of the accent with coloured words.')]),
      ch('fillHue', 'Its colour', hueOpts(), { show: (s) => s.fill === 'own' }),
    ] },
    { id: 'status', t: 'Status colours', sec: 'Colour', why: 'Colours that say something worked, needs a look, or went wrong.', ctl: [
      ch('stSet', 'Which colours', SETS.map(([v, n, d, set]) => Object.assign(o(v, n, d), { set }))),
      ch('stC', 'How strong', [o(0.06, 'Quiet', 'Muted. They inform without alarming.'), o(0.13, 'Standard', 'Clear and familiar.'), o(0.2, 'Bright', 'Strong colour that grabs attention.')]),
      rg('stC', 'How strong', 0.02, 0.26, 0.01, '', ''),
    ] },
    { id: 'words', t: 'Words', sec: 'Words', why: 'How strongly the words stand out from the background. Every level stays readable.', ctl: [
      ch('textk', 'Strength', [o(0, 'Softer', 'Gentler words. Calm, a little less sharp.'), o(0.5, 'Balanced', 'Clear without glare.'), o(1, 'Crisp', 'Words as dark or as bright as they go.')]),
      rg('textk', 'Strength', 0, 1, 0.01, '', 'Left is softer, right is crisper.'),
    ] },
  ];

  /* ---- finished looks ---- */
  const LOOKS = [
    ['night', 'Quiet night', 'Near-black greys and a soft blue touch. Calm and easy on the eyes.', { tint: 'Neutral', gH: 0, gC: 0, base: 0.12, sep: 0.8, hue: 232, vivid: 0.09, lift: 0.04, fill: 'ink', stC: 0.08, textk: 0.4 }],
    ['paper', 'Warm paper', 'A cream page, brown-black words and a terracotta accent, like a printed book.', { side: 'light', base: 0.55, tint: 'Sand', gH: 80, gC: 0.026, tintk: 1.3, hue: 40, vivid: 0.13, lift: -0.04, stSet: 'gentle', okH: 178, warnH: 92, badH: 18, textk: 0.6 }],
    ['ink', 'Black and white', 'Pure white, true black and one strong blue for links. Very sharp.', { side: 'light', base: 0, tint: 'Neutral', gH: 0, gC: 0, sep: 1.5, hue: 262, vivid: 0.2, lift: -0.08, fill: 'ink', stSet: 'bold', okH: 138, warnH: 60, badH: 14, stC: 0.18, textk: 1 }],
    ['electric', 'Electric', 'Black with one bright lime that jumps out.', { base: 0, tint: 'Neutral', gH: 0, gC: 0, sep: 1.2, hue: 135, vivid: 0.24, lift: 0.14, stC: 0.18, textk: 0.8 }],
    ['pastel', 'Soft pastel', 'Blush greys and lilac. Buttons are a pale wash.', { side: 'light', base: 0.35, tint: 'Rose', gH: 10, gC: 0.024, tintk: 1.2, sep: 0.7, hue: 300, vivid: 0.12, fill: 'soft', stSet: 'gentle', okH: 178, warnH: 92, badH: 18, stC: 0.08, textk: 0.2 }],
    ['jewel', 'Deep jewel', 'Deep navy with gold. Rich and a little formal.', { base: 0.45, tint: 'Navy', gH: 262, gC: 0.032, tintk: 1.8, sep: 1.3, hue: 82, vivid: 0.14, lift: 0.08, textk: 0.6 }],
    ['mono', 'Monochrome', 'Only greys. Nothing competes with your content.', { base: 0.3, tint: 'Neutral', gH: 0, gC: 0, sep: 1.1, vivid: 0, lift: 0.2, fill: 'ink', stC: 0.05, textk: 0.6 }],
    ['sky', 'Fresh sky', 'Crisp white, blue-grey panels and a sky blue accent.', { side: 'light', base: 0.12, tint: 'Blue', gH: 245, gC: 0.045, tintk: 0.6, hue: 232, vivid: 0.15, lift: -0.04, textk: 0.6 }],
    ['ember', 'Ember', 'Warm charcoal and a glowing orange. Cosy at night.', { base: 0.3, tint: 'Warm', gH: 55, gC: 0.016, tintk: 1.6, hue: 50, vivid: 0.18, lift: 0.02, stSet: 'gentle', okH: 178, warnH: 92, badH: 18 }],
    ['sage', 'Sage', 'Soft greens and stone. Quiet and natural.', { side: 'light', base: 0.5, tint: 'Green', gH: 155, gC: 0.022, tintk: 1.2, sep: 0.9, hue: 160, vivid: 0.09, lift: -0.06, stSet: 'gentle', okH: 178, warnH: 92, badH: 18, stC: 0.09, textk: 0.4 }],
    ['violet', 'Midnight violet', 'Inky purple, a bright violet and a pink main button.', { base: 0.2, tint: 'Indigo', gH: 277, gC: 0.03, tintk: 1.4, sep: 1.2, hue: 300, vivid: 0.2, lift: 0.05, fill: 'own', fillHue: 355 }],
  ].map(([id, n, d, patch]) => ({ id, n, d, patch: Object.assign({}, DEFAULTS, patch) }));

  /* ---- what the project has today ---- */
  const PP = (P.palette && typeof P.palette === 'object') ? P.palette : {};
  const fromHexes = (h) => {
    const ok = (x) => typeof x === 'string' && C.HEX.test(x), out = {};
    if (!ok(h.page)) return out;
    const [L, ch, H] = C.toOklch(h.page), dark = L < 0.6, side = dark ? 'dark' : 'light';
    out.side = side;
    out.base = r2(lim(dark ? (L - 0.1) / 0.16 : (1 - L) / 0.08, 0, 1));
    if (ch < 0.006) Object.assign(out, { tint: 'Neutral', gH: 0, gC: 0, tintk: 1 });
    else {
      const fam = C.familyOf(h.page, false), t = C.TINTS.find((x) => x[0] === fam) || C.TINTS[1];
      Object.assign(out, { tint: t[0], gH: Math.round(H), gC: t[2], tintk: r2(lim(ch / t[2], 0, 4)) });
    }
    if (ok(h.surface)) out.sep = r2(lim(Math.abs(C.toOklch(h.surface)[0] - L) / (dark ? 0.045 : 0.035), 0.2, 3));
    if (ok(h.text)) { const t = C.toOklch(h.text)[0]; out.textk = r2(lim(dark ? (t - 0.86) / 0.13 : (0.31 - t) / 0.17, 0, 1)); }
    let acc = null;
    if (ok(h.accent)) {
      acc = C.toOklch(h.accent);
      if (acc[1] >= 0.03) { out.hue = Math.round(acc[2]); out.vivid = r2(acc[1]); } else out.vivid = 0;
      out.lift = r2(lim(acc[0] - ACC[side], -0.3, 0.25));
    }
    if (ok(h.fill)) {
      const f = C.toOklch(h.fill), near = (x) => ok(x) && C.ratio(x, h.fill) < 1.15 && Math.abs(C.toOklch(x)[1] - f[1]) < 0.04;
      if (near(h.accent)) out.fill = 'accent';
      else if (near(h.text)) out.fill = 'ink';
      else if (C.ratio(h.fill, h.page) < 1.6) out.fill = 'soft';
      else if (f[1] >= 0.03) { out.fill = 'own'; out.fillHue = Math.round(f[2]); }
      else out.fill = 'ink';
    }
    const st = ['ok', 'warn', 'bad'].filter((k) => ok(h[k])).map((k) => [k, C.toOklch(h[k])]);
    if (st.length) {
      out.stC = r2(lim(st.reduce((a, [, x]) => a + x[1], 0) / st.length, 0.02, 0.26));
      st.forEach(([k, x]) => { if (x[1] >= 0.03) out[k + 'H'] = Math.round(x[2]); });
      const gap = (a, b) => Math.min(C.hue360(a - b), C.hue360(b - a));
      const v = Object.assign({}, DEFAULTS, out);
      out.stSet = SETS.reduce((b, x) => { const d = gap(x[3].okH, v.okH) + gap(x[3].warnH, v.warnH) + gap(x[3].badH, v.badH); return d < b[1] ? [x[0], d] : b; }, ['classic', 1e9])[0];
    }
    return out;
  };
  const hexes = (PP.hexes && typeof PP.hexes === 'object') ? PP.hexes : {};
  const today = Object.assign(fromHexes(hexes), (PP.today && typeof PP.today === 'object') ? PP.today : {});
  const measured = !!PP.measured || Object.keys(today).length > 0;

  const fix = (s) => {
    if (s.side !== 'light') s.side = 'dark';
    for (const k in DEFAULTS) if (typeof DEFAULTS[k] === 'number') s[k] = num(s[k], DEFAULTS[k]);
    s.base = lim(s.base, 0, 1); s.textk = lim(s.textk, 0, 1); s.tintk = lim(s.tintk, 0, 4); s.sep = lim(s.sep, 0.2, 3);
    s.vivid = lim(s.vivid, 0, 0.32); s.lift = lim(s.lift, -0.3, 0.25); s.stC = lim(s.stC, 0.02, 0.26);
    ['gH', 'hue', 'fillHue', 'okH', 'warnH', 'badH'].forEach((k) => { s[k] = C.hue360(s[k]); });
  };
  const pick = (s, c) => {
    if (c.k === 'hue' && s.vivid < 0.005) s.vivid = 0.14; // choosing a colour should show it
    if (c.k === 'tint' && s.gC > 0 && s.tintk < 0.2) s.tintk = 1;
  };

  /* ---- drawings: every colour inline, so many states can be drawn side by side ---- */
  const bar = (bg, w, h = 4) => `<span class="pl-bar" style="background:${bg};width:${w}px;height:${h}px"></span>`;
  const dots = (R) => `<span class="pl-dots"><i style="background:${R.ok}"></i><i style="background:${R.warn}"></i><i style="background:${R.bad}"></i></span>`;
  const edge = (c) => `box-shadow:inset 0 0 0 1px ${c}`;
  const mini = (R) => `<div class="pl-mini" style="background:${R.page}">`
    + `<div class="pl-mh" style="background:${R.surface};border-bottom:1px solid ${R.line}"><i style="background:${R.accent}"></i>${bar(R.text2, 22, 3)}${bar(R.text3, 16, 3)}</div>`
    + '<div class="pl-mb"><div class="pl-col">'
    + `<span class="pl-bar" style="background:${R.text};width:78px;height:8px;border-radius:3px"></span>${bar(R.text2, 90, 3)}${bar(R.text2, 70, 3)}${bar(R.text3, 48, 3)}`
    + `<span class="pl-row"><span class="pl-btn" style="background:${R.fill}">${bar(R['on-fill'], 18, 3)}</span><span class="pl-bar" style="background:${R.accent};width:24px;height:3px"></span></span></div>`
    + `<div class="pl-card" style="background:${R.surface};${edge(R.line)}">${bar(R.text, 30, 3)}<span class="pl-field" style="${edge(R.control)}"></span>${dots(R)}</div>`
    + '</div></div>';
  const statusArt = (R) => `<div class="pl-mini pl-stat" style="background:${R.page}">`
    + [['ok', 34], ['warn', 46], ['bad', 28]].map(([k, w]) => `<span class="pl-pill" style="background:${R.surface};${edge(R.line)}"><i style="background:${R[k]}"></i>${bar(R[k], w, 4)}</span>`).join('') + '</div>';
  const wordsArt = (R) => `<div class="pl-mini pl-words" style="background:${R.page}">`
    + `<b style="color:${R.text}">Aa</b><span class="pl-col">${bar(R.text, 70, 5)}${bar(R.text2, 84, 4)}${bar(R.text3, 58, 4)}</span></div>`;
  const page = (R, big) => `<div class="pl-look${big ? ' pl-cmp' : ''}" style="background:${R.page};color:${R.text}">`
    + `<div class="pl-lh" style="border-bottom:1px solid ${R.line}"><b>${esc(big ? P.name : 'Aa')}</b>${bar(R.text2, 20, 3)}${bar(R.text2, 16, 3)}<span class="pl-ghost" style="${edge(R.control)}"></span></div>`
    + '<div class="pl-lb"><div class="pl-col">'
    + `<span class="pl-lt">${big ? 'A clear headline' : 'Hello there'}</span>${bar(R.text2, big ? 130 : 100, 3)}${bar(R.text2, big ? 96 : 74, 3)}`
    + `<span class="pl-row"><span class="pl-btn pl-word" style="background:${R.fill};color:${R['on-fill']}">Start</span><span class="pl-word" style="color:${R.accent}">More</span></span></div>`
    + `<div class="pl-card" style="background:${R.surface};${edge(R.line)}">${bar(R.text, 34, 3)}<span class="pl-field" style="${edge(R.control)}">${bar(R.text3, 26, 3)}</span>${dots(R)}</div></div>`
    + `<div class="pl-strip">${['page', 'surface', 'line', 'text', 'text2', 'accent', 'fill', 'ok', 'warn', 'bad'].map((k) => `<i style="background:${R[k]}"></i>`).join('')}</div></div>`;
  const still = (s, opt = {}) => {
    const R = roles(s);
    if (opt.tile === 'stSet' || opt.tile === 'stC') return statusArt(R);
    if (opt.tile === 'textk') return wordsArt(R);
    if (opt.tile) return mini(R);
    return page(R, !!opt.compare);
  };

  /* ---- "On its own": every role, what it is for, and whether words on it can be read ---- */
  const live = (el, s) => {
    const R = roles(s), p = pairs(s);
    const card = (id) => { const [, n, d] = ROLE.find((x) => x[0] === id); return `<div class="pl-role" style="background:${R.surface};${edge(R.line)}"><span class="pl-sw" style="background:${R[id]};${edge(R.line)}"></span><div><b style="color:${R.text}">${esc(n)}</b><code style="color:${R.text2}">${R[id]}</code><small style="color:${R.text3}">${esc(d)}</small></div></div>`; };
    const row = ([fg, bg, min, n]) => {
      const got = C.ratio(R[fg], R[bg]), pass = got >= min;
      return `<li style="border-top:1px solid ${R.line}"><span class="pl-aa" style="background:${R[bg]};color:${R[fg]};${edge(R.line)}">Aa</span><span style="color:${R.text}">${esc(n)}</span>`
        + `<span class="pl-res"><b style="color:${pass ? R.ok : R.bad}">${pass ? 'Readable' : 'Too faint'}</b><span style="color:${R.text3}">${C.showRatio(got)} to 1, needs ${min}</span></span></li>`;
    };
    const fails = p.filter(([fg, bg, min]) => C.ratio(R[fg], R[bg]) < min).length;
    el.innerHTML = `<div class="pl-board" style="background:${R.page};color:${R.text}">`
      + `<p class="pl-intro" style="color:${R.text2}">Every colour in this palette, what it is for, and whether words on it can be read. ${fails ? `<b style="color:${R.bad}">${fails} pair${fails > 1 ? 's are' : ' is'} too faint.</b>` : `<b style="color:${R.ok}">Everything is readable.</b>`}</p>`
      + BOARD.map(([t, ids]) => `<section class="pl-sec"><h3 style="color:${R.text}">${t}</h3><div class="pl-grid">${ids.map(card).join('')}</div></section>`).join('')
      + `<section class="pl-sec"><h3 style="color:${R.text}">Can people read it?</h3><ul class="pl-pairs" style="background:${R.surface};${edge(R.line)}">${p.map(row).join('')}</ul></section></div>`;
  };

  /* ---- what other parts of the studio read ---- */
  const scene = (s) => {
    const R = roles(s);
    return { vars: { '--sc-bg': R.page, '--sc-surface': R.surface, '--sc-line': R.line, '--sc-control': R.control, '--sc-fg': R.text, '--sc-fg2': R.text2, '--sc-fg3': R.text3, '--sc-accent': R.accent, '--sc-fill': R.fill, '--sc-on-fill': R['on-fill'], '--sc-ok': R.ok, '--sc-warn': R.warn, '--sc-bad': R.bad } };
  };
  const share = (s) => {
    const R = roles(s), [L, ch, H] = C.toOklch(R.accent);
    return { accent: { H: ch < 0.01 ? s.hue : Math.round(H), C: Math.round(ch * 1000) / 1000, L: Math.round(L * 1000) / 1000 }, light: s.side === 'light', roles: Object.assign({}, R) };
  };
  const warn = (s) => {
    const R = roles(s);
    return pairs(s).filter(([fg, bg, min]) => C.ratio(R[fg], R[bg]) < min).map(([fg, bg, min, n, k]) => ({
      k, t: min >= 4.5
        ? `${n} have a contrast of ${C.showRatio(C.ratio(R[fg], R[bg]))} to 1. Words need at least 4.5.`
        : `${n} has a contrast of ${C.showRatio(C.ratio(R[fg], R[bg]))} to 1. Shapes people need to see need at least 3.`,
    }));
  };
  const notes = (s) => {
    const R = roles(s);
    return [`Palette roles (${s.side === 'light' ? 'light' : 'dark'}). Map each onto the project's own colour tokens; the role names follow Palette Builder:`,
      ...ROLE.map(([id, n]) => `${id}: ${R[id]} ${C.formatColor(R[id], 'oklch')} (${n.toLowerCase()})`)];
  };
  const summary = (s) => `${s.side === 'light' ? 'Light' : 'Dark'}, ${s.vivid < 0.005 ? 'grey' : hueName(s.hue).toLowerCase()}`;

  STUDIO.add({
    id: 'palette', ground: true, name: 'Palette', title: () => 'colours', mode0: 'context',
    defaults: DEFAULTS, today, measured, groups, looks: LOOKS, keep: [],
    fix, pick, vars: () => ({}), live, still, tile: () => ({}), tall: () => true,
    scene, share, warn, notes, summary, roles,
  });
}
