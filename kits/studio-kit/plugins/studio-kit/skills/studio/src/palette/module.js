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
  /* ---- the project's own colour roles ----
     P.palette.roles uses Palette Builder's role contract (references/palette.md): { id, name, type, side, value, used,
     tokens: [{ name, file, scope, format }], against: [[role, minimum]] }. Each role's exact value is the baseline and
     can be changed on its own; a direction (a look, a slider) proposes values for the roles nobody has set by hand.
     Without project roles, the thirteen roles above stand in, and the page says their values are proposals. */
  const PP = (P.palette && typeof P.palette === 'object') ? P.palette : {};
  const ID_OK = /^[a-z][a-z0-9-]{0,39}$/;
  const SLOT_OF = (r) => {
    if (r.type === 'signal') { const t = (r.id + ' ' + (r.name || '')).toLowerCase(); return /warn|warm|caution|attention|star/.test(t) ? 'warn' : /err|bad|fail|danger|destruct/.test(t) ? 'bad' : 'ok'; }
    return C.TYPES[r.type] ? r.type : null;
  };
  const SLOT_NAME = Object.fromEntries(ROLE.map(([id, n]) => [id, n]));
  const PROJECT_ROLES = (Array.isArray(PP.roles) ? PP.roles : []).filter((r) => r && ID_OK.test(String(r.id)) && C.HEX.test(String(r.value)) && C.TYPES[r.type]).slice(0, 40).map((r) => ({
    id: String(r.id), name: String(r.name || r.id), type: r.type, side: r.side === 'light' ? 'light' : 'dark', value: String(r.value).toUpperCase(),
    used: String(r.used || ''), slot: SLOT_OF(r), note: String(r.note || ''),
    tokens: (Array.isArray(r.tokens) ? r.tokens : []).filter((t) => t && t.name).map((t) => ({ name: String(t.name), file: String(t.file || ''), scope: String(t.scope || ':root'), format: C.FORMATS.includes(t.format) ? t.format : 'hex' })),
    against: (Array.isArray(r.against) ? r.against : []).filter((a) => Array.isArray(a) && ID_OK.test(String(a[0]))).map((a) => [String(a[0]), +a[1] || 0]),
    source: r.source === 'estimated' ? 'estimated' : 'measured',
  }));
  /* Older pages name a few found colours by slot (P.palette.hexes); they become exact values for those slots. */
  const HEXES = (PP.hexes && typeof PP.hexes === 'object') ? PP.hexes : {};
  const SLOT_TYPE = { ok: 'signal', warn: 'signal', bad: 'signal' };
  const SLOT_AGAINST = { text: [['page', 4.5], ['surface', 4.5]], text2: [['page', 4.5]], text3: [['page', 4.5], ['surface', 4.5]], accent: [['page', 4.5], ['surface', 4.5]], 'on-fill': [['fill', 4.5]], fill: [['page', 3]], control: [['page', 3]], ok: [['surface', 4.5]], warn: [['surface', 4.5]], bad: [['surface', 4.5]] };
  const RL = PROJECT_ROLES.length ? PROJECT_ROLES : ROLE.map(([id, n, d]) => ({
    id, name: n, type: SLOT_TYPE[id] || id, side: 'dark', value: C.HEX.test(String(HEXES[id])) ? String(HEXES[id]).toUpperCase() : '', used: d, slot: id, note: '', tokens: [],
    against: SLOT_AGAINST[id] || [], source: C.HEX.test(String(HEXES[id])) ? (PP.measured === false ? 'estimated' : 'measured') : 'proposed',
  }));
  const RBY = Object.fromEntries(RL.map((r) => [r.id, r]));
  /* Light and dark. A project that has roles on both sides keeps both, drawn and changed together; one that has a
     single theme can ask for a matched twin, derived from the same greys, accent and status colours. */
  const BOTH = PROJECT_ROLES.some((r) => r.side === 'light') && PROJECT_ROLES.some((r) => r.side === 'dark');
  DEFAULTS.pair = BOTH ? 'both' : 'one';
  const otherSide = (s) => (s.side === 'light' ? 'dark' : 'light');
  const twinOn = (s) => BOTH || s.pair === 'both';
  const sideName = (x) => (x === 'light' ? 'Light' : 'Dark');
  RL.forEach((r) => { DEFAULTS['r_' + r.id] = ''; });
  const FIRST_OF_SLOT = {}, FIRST_ON = { dark: {}, light: {} };
  RL.forEach((r) => { if (r.slot && !FIRST_OF_SLOT[r.slot]) FIRST_OF_SLOT[r.slot] = r.id; });
  PROJECT_ROLES.forEach((r) => { if (r.slot && !FIRST_ON[r.side][r.slot]) FIRST_ON[r.side][r.slot] = r.id; });
  /* Which roles a direction control moves. Changing one of these lets go of the hand-set values it covers. */
  const GREYS = ['page', 'surface', 'line', 'control', 'text', 'text2', 'text3'];
  const MOVES = {
    side: '*', base: GREYS, tint: GREYS, gH: GREYS, gC: GREYS, tintk: GREYS, sep: ['surface', 'line', 'control'],
    hue: ['accent', 'fill', 'on-fill'], vivid: ['accent', 'fill', 'on-fill'], lift: ['accent', 'fill', 'on-fill'],
    fill: ['fill', 'on-fill'], fillHue: ['fill', 'on-fill'], stSet: ['ok', 'warn', 'bad'], okH: ['ok'], warnH: ['warn'], badH: ['bad'], stC: ['ok', 'warn', 'bad'],
    textk: ['text', 'text2', 'text3'],
  };
  const touch = (s, k) => {
    const slots = MOVES[k];
    if (!slots) return;
    RL.forEach((r) => { if (slots === '*' || slots.includes(r.slot)) s['r_' + r.id] = ''; });
  };

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
      ch('side', 'Light or dark', [o('dark', 'Dark', 'Light words on a dark background.'), o('light', 'Light', 'Dark words on a light background.')], { show: () => !BOTH }),
      ch('pair', 'Themes', [o('one', 'One theme', 'Only the theme shown here.'), o('both', 'Light and dark, matched', 'A twin for the other theme from the same greys, accent and status colours, so both read as one product. Drawn beside this one and proposed with it.')], { show: () => !BOTH }),
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
  LOOKS.forEach((l) => { delete l.patch.pair; }); // a look changes the colours, not whether there are two themes

  /* ---- the colours a state gives every role ---- */
  /** Every role's colour: its own value when one is set, else what the direction proposes for its kind. */
  const rolesOn = (s, side) => roles(side === s.side ? s : Object.assign({}, s, { side }));
  const values = (s) => {
    const out = {};
    RL.forEach((r) => {
      const v = s['r_' + r.id], R = rolesOn(s, PROJECT_ROLES.length ? r.side : s.side);
      out[r.id] = typeof v === 'string' && C.HEX.test(v) ? v.toUpperCase() : R[r.slot] || R.text;
    });
    return out;
  };
  /** The colours the drawings use, by kind, with the project's own roles laid over the direction's. */
  const slots = (s, side = s.side) => {
    const R = Object.assign({}, rolesOn(s, side)), v = values(s);
    const lay = PROJECT_ROLES.length ? (BOTH ? FIRST_ON[side] : side === s.side ? FIRST_OF_SLOT : {}) : side === s.side ? FIRST_OF_SLOT : {};
    for (const k in lay) R[k] = v[lay[k]];
    return R;
  };
  /** The other theme, when there is one: [side, its colours, whether it is the project's own or a matched proposal]. */
  const twin = (s) => (twinOn(s) ? [otherSide(s), slots(s, otherSide(s)), BOTH] : null);
  /** A role as Palette Builder's helpers expect it; the thirteen stand-in roles sit on whichever side the palette is. */
  const roleFor = (s) => (r) => (PROJECT_ROLES.length ? r : Object.assign({}, r, { side: s.side === 'light' ? 'light' : 'dark' }));

  /* ---- what the project has today ---- */
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
    if (ok(h.accent)) {
      const acc = C.toOklch(h.accent);
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
  /* The direction that comes closest to today, then every found value laid over it exactly. */
  const found = {};
  RL.forEach((r) => { if (r.value && r.slot && !found[r.slot]) found[r.slot] = r.value; });
  const today = Object.assign(fromHexes(found), (PP.today && typeof PP.today === 'object') ? PP.today : {});
  RL.forEach((r) => { if (r.value) today['r_' + r.id] = r.value; });
  today.pair = DEFAULTS.pair;
  const measured = RL.some((r) => r.value);
  if (!measured && !(PP.today && PP.today.side)) DEFAULTS.side = 'light'; // a project with no colours yet starts on a plain light page

  const fix = (s) => {
    if (s.side !== 'light') s.side = 'dark';
    s.pair = BOTH ? 'both' : s.pair === 'both' ? 'both' : 'one';
    for (const k in DEFAULTS) if (typeof DEFAULTS[k] === 'number') s[k] = num(s[k], DEFAULTS[k]);
    s.base = lim(s.base, 0, 1); s.textk = lim(s.textk, 0, 1); s.tintk = lim(s.tintk, 0, 4); s.sep = lim(s.sep, 0.2, 3);
    s.vivid = lim(s.vivid, 0, 0.32); s.lift = lim(s.lift, -0.3, 0.25); s.stC = lim(s.stC, 0.02, 0.26);
    ['gH', 'hue', 'fillHue', 'okH', 'warnH', 'badH'].forEach((k) => { s[k] = C.hue360(s[k]); });
    RL.forEach((r) => { const k = 'r_' + r.id; s[k] = typeof s[k] === 'string' && C.HEX.test(s[k]) ? s[k].toUpperCase() : ''; });
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
    + [['ok', 'Saved'], ['warn', 'Needs a look'], ['bad', 'Failed']].map(([k, w]) => `<span class="pl-pill" style="background:${R.surface};${edge(R.line)};color:${R[k]}"><i style="background:${R[k]}"></i>${w}</span>`).join('') + '</div>';
  const wordsArt = (R) => `<div class="pl-mini pl-words" style="background:${R.page}">`
    + `<b style="color:${R.text}">Aa</b><span class="pl-col"><span style="color:${R.text}">Main words</span><span style="color:${R.text2}">Secondary words</span><span style="color:${R.text3}">Faint hint</span></span></div>`;
  /** A coordinated palette at a glance: the jobs that carry it, as big swatches. */
  const STRIP = ['page', 'surface', 'line', 'text2', 'text', 'accent', 'fill', 'warn'];
  const strip = (R) => `<div class="pl-strip-big">${STRIP.map((k) => `<i style="background:${R[k]}" title="${esc(SLOT_NAME[k] || k)}"></i>`).join('')}</div>`;
  /** A representative piece of the product with its own words, painted with the palette: every role at work. */
  const scenelet = (R, big) => {
    const links = (CX.links.length ? CX.links : ['Docs', 'Pricing']).slice(0, big ? 3 : 2);
    const label = (STUDIO.has('button') ? ST.button.label : '') || (P.labels && P.labels[0] && two(P.labels[0])[0]) || 'Get started';
    const f = shared('fonts'), ff = f ? `;font-family:${esc(f.body)}` : '', hf = f ? ` style="font-family:${esc(f.display)}"` : '';
    return `<div class="pl-scene${big ? ' big' : ''}" style="background:${R.page};color:${R.text}${ff}">`
      + `<div class="pl-sh" style="border-bottom:1px solid ${R.line}"><b>${esc(P.name)}</b><span style="color:${R.text2}">${links.map((l) => `<span>${esc(l)}</span>`).join('')}</span></div>`
      + '<div class="pl-sb">'
      + (CX.eyebrow ? `<p class="pl-eb" style="color:${R.accent}">${esc(CX.eyebrow)}</p>` : '')
      + `<h4${hf}>${esc(CX.headline || 'A clear headline that says what this is')}</h4>`
      + `<p class="pl-p" style="color:${R.text2}">${esc(CX.body || 'One or two plain sentences underneath, long enough to judge how words read on this page.')}</p>`
      + `<div class="pl-acts"><span class="pl-go" style="background:${R.fill};color:${R['on-fill']}">${esc(label)}</span><span style="color:${R.accent}">${esc(CX.secondary || (P.secondary && P.secondary[0]) || 'Learn more')} →</span></div>`
      + `<div class="pl-box" style="background:${R.surface};${edge(R.line)}"><span class="pl-lbl">${esc(CX.field || 'Email')}</span>`
      + `<span class="pl-in" style="${edge(R.control)};color:${R.text3}">${esc(CX.placeholder || CX.hint || 'name@example.com')}</span>`
      + `<span class="pl-st"><i style="background:${R.ok}"></i><span style="color:${R.ok}">Saved</span><i style="background:${R.warn}"></i><span style="color:${R.warn}">Needs a look</span><i style="background:${R.bad}"></i><span style="color:${R.bad}">Failed</span></span></div>`
      + '</div></div>';
  };
  /** A look at a glance: one theme's page with the project's headline and its main action. */
  const swatchCard = (R, side) => {
    const f = shared('fonts'), ff = f ? `font-family:${esc(f.display)};` : '';
    const label = (STUDIO.has('button') ? ST.button.label : '') || (P.labels && P.labels[0] && two(P.labels[0])[0]) || 'Get started';
    return `<div class="pl-card2" style="${f ? `font-family:${esc(f.body)};` : ''}background:${R.page};color:${R.text};box-shadow:inset 0 0 0 1px ${R.line}"><span class="pl-sd" style="color:${R.text3}">${sideName(side)}</span>`
      + `<b style="${ff}">${esc(CX.headline || P.name)}</b><span class="pl-go" style="background:${R.fill};color:${R['on-fill']}">${esc(label)}</span></div>`;
  };
  const label2 = (side, own) => `${sideName(side)}${own ? '' : ', matched'}`;
  const still = (s, opt = {}) => {
    const R = slots(s), t = twin(s);
    if (opt.look) return `<div class="pl-lk">${strip(R)}<div class="pl-cards">${swatchCard(R, s.side)}${t ? swatchCard(t[1], t[0]) : ''}</div></div>`;
    if (opt.tile === 'pair') return t ? `<div class="pl-twins">${mini(R)}${mini(t[1])}</div>` : mini(R);
    if (opt.tile === 'stSet' || opt.tile === 'stC') return statusArt(R);
    if (opt.tile === 'textk') return wordsArt(R);
    if (opt.tile) return mini(R);
    if (t) return `<div class="pl-cmp pl-two"><div><span class="pl-cap">${sideName(s.side)}</span>${scenelet(R, true)}${strip(R)}</div><div><span class="pl-cap">${label2(t[0], t[2])}</span>${scenelet(t[1], true)}${strip(t[1])}</div></div>`;
    return `<div class="pl-cmp">${scenelet(R, true)}${strip(R)}</div>`;
  };
  /* The preview card: the palette at work in a representative piece of the product. */
  const live = (el, s) => {
    const t = twin(s);
    el.innerHTML = t
      ? `<div class="pl-live pl-pair"><div><span class="pl-cap">${sideName(s.side)}</span>${scenelet(slots(s), false)}</div><div><span class="pl-cap">${label2(t[0], t[2])}</span>${scenelet(t[1], false)}</div></div>`
      : `<div class="pl-live">${scenelet(slots(s), false)}</div>`;
  };

  /* ---- a role you can change on its own: Palette Builder's families and shades ---- */
  const status = (r, s) => {
    const v = s['r_' + r.id], base = DEFS.palette && DEFS.palette['r_' + r.id];
    if (!v) return ['Proposed', 'From the direction you chose; not a project value.'];
    if (r.value && v === r.value) return r.source === 'estimated' ? ['Estimated', 'Read from source, not measured on a running page.'] : ['Today', 'The exact value found in the project.'];
    return base && v === base ? ['Today', ''] : ['Changed', 'Set by hand here.'];
  };
  const contrastLine = (role, vals) => C.failures([role], vals).map((f) => `Too faint on ${esc((RBY[f.bg] || { name: f.bg }).name)}: ${C.showRatio(f.got)} to 1, needs ${f.min}.`).join(' ');
  function roleRow(c, s) {
    const r = RBY[c.role], vals = values(s), hex = vals[r.id], role = roleFor(s)(r), open = UI.open === 'palette:' + r.id;
    const [tag, tip] = status(r, s);
    const tok = r.tokens[0];
    const bad = contrastLine(role, vals);
    let pick = '';
    if (open) {
      const color = C.isColor(role), range = C.roleRange(role, hex), fam = C.familyOf(hex, color), L = C.toOklch(hex)[0];
      const fams = (color ? C.HUES : C.TINTS);
      const famBtn = (f) => {
        const rows = C.shadeRows(role, f, range, color), row = rows[Math.min(1, rows.length - 1)][1];
        const near = row.reduce((b, x) => (Math.abs(C.toOklch(x)[0] - L) < Math.abs(C.toOklch(b)[0] - L) ? x : b));
        return `<button class="pl-fam" data-mset="palette|r_${r.id}" data-val="${near}" aria-pressed="${f[0] === fam}" title="${esc(f[0])}"><i style="background:${C.familyPreview(role, f, range, color)}"></i>${esc(f[0])}</button>`;
      };
      const shades = C.shadeRows(role, fams.find((f) => f[0] === fam) || fams[0], range, color).map(([n, row]) => `<div class="pl-shrow"><span>${esc(n)}</span>${row.map((x) => `<button class="pl-shade" data-mset="palette|r_${r.id}" data-val="${x}" aria-pressed="${x === hex}" aria-label="${x}" title="${x}" style="background:${x}"></button>`).join('')}</div>`).join('');
      const fixTo = bad ? C.nearestPassing(role, vals) : null;
      pick = `<div class="pl-pick"><div class="pl-fams" role="group" aria-label="Colour family">${fams.map(famBtn).join('')}</div><div class="pl-shades">${shades}</div>`
        + '<div class="pl-pacts">'
        + (fixTo ? `<button class="chip sm" data-mset="palette|r_${r.id}" data-val="${fixTo}">Use the nearest readable shade, ${fixTo}</button>` : '')
        + (r.value && hex !== r.value ? `<button class="chip sm" data-mset="palette|r_${r.id}" data-val="${r.value}">Back to today’s ${r.value}</button>` : '')
        + (s['r_' + r.id] ? `<button class="chip sm ghost" data-mset="palette|r_${r.id}" data-val="">Follow the direction</button>` : '')
        + '</div></div>';
    }
    const head = BOTH && PROJECT_ROLES.find((x) => x.side === r.side) === r ? `<p class="pl-side">${sideName(r.side)} theme</p>` : '';
    return head + `<div class="pl-rrow${open ? ' open' : ''}" data-ctl="${c.id}"><button class="pl-rbtn" data-mopen="palette:${r.id}" aria-expanded="${open}">`
      + `<span class="pl-rsw" style="background:${hex}"></span><span class="pl-rtx"><b>${esc(r.name)}</b><small>${esc(r.used || SLOT_NAME[r.slot] || '')}</small></span>`
      + `<span class="pl-rv"><code>${hex}</code><span class="pl-tag pl-${tag.toLowerCase()}" title="${esc(tip)}">${tag}</span></span></button>`
      + (tok ? `<p class="pl-tok">${esc(tok.name)}${tok.file ? ` <span>${esc(tok.file)}</span>` : ''}${r.tokens.length > 1 ? ` and ${r.tokens.length - 1} more` : ''}</p>` : '')
      + (bad ? `<p class="pl-bad">${bad}</p>` : '') + (r.note ? `<p class="pl-tok">${esc(r.note)}</p>` : '') + pick + '</div>';
  }
  /* ---- every pair that must read together, today and now ---- */
  function board(s) {
    const vals = values(s), base = values(DEFS.palette), rs = RL.map(roleFor(s));
    const rows = [];
    rs.forEach((r) => (r.against || []).forEach(([bg, min]) => {
      if (!min || !(bg in vals)) return;
      const now = C.ratio(vals[r.id], vals[bg]), then = C.ratio(base[r.id], base[bg]);
      rows.push(`<li><span class="pl-aa" style="background:${vals[bg]};color:${vals[r.id]}">Aa</span><span><b>${esc(r.name)}</b> on ${esc((RBY[bg] || { name: bg }).name)}</span>`
        + `<span class="pl-res"><b class="${now >= min ? 'ok' : 'no'}">${now >= min ? 'Readable' : 'Too faint'} · ${C.showRatio(now)}</b><small>needs ${min}${measured ? ` · today ${C.showRatio(then)}` : ''}</small></span></li>`);
    }));
    const fails = C.failures(rs, vals).length, wasFail = measured ? C.failures(rs, base).length : 0;
    return `<div class="pl-read"><p class="why">${fails ? `${fails} pair${fails > 1 ? 's are' : ' is'} too faint with these colours.` : 'Every pair reads with these colours.'}`
      + (measured ? ` ${wasFail ? `Today’s palette already has ${wasFail} pair${wasFail > 1 ? 's' : ''} below the minimum; that is a finding about the product, not a change.` : 'Today’s palette passes every pair.'}` : '')
      + ' Gradients, glass and images behind words are not measured here; check those on the real page.</p>'
      + `<ul class="pl-pairs">${rows.join('')}</ul>${twinBoard(s)}</div>`;
  }
  /** The matched twin's pairs, by kind of role: it has no project values, so only now is measured. */
  const TWIN_PAIRS = Object.entries(SLOT_AGAINST).flatMap(([k, list]) => list.map(([bg, min]) => [k, bg, min]));
  const twinFails = (s) => { const t = twin(s); return t && !t[2] ? TWIN_PAIRS.filter(([k, bg, min]) => C.ratio(t[1][k], t[1][bg]) < min) : []; };
  function twinBoard(s) {
    const t = twin(s);
    if (!t || t[2]) return '';
    const R = t[1], fails = twinFails(s).length;
    return `<h3 class="pl-twinh">${label2(t[0], false)} theme</h3><p class="why">${fails ? `${fails} pair${fails > 1 ? 's are' : ' is'} too faint in the matched theme.` : 'Every pair reads in the matched theme too.'}</p><ul class="pl-pairs">`
      + TWIN_PAIRS.map(([k, bg, min]) => { const now = C.ratio(R[k], R[bg]); return `<li><span class="pl-aa" style="background:${R[bg]};color:${R[k]}">Aa</span><span><b>${esc(SLOT_NAME[k] || k)}</b> on ${esc(SLOT_NAME[bg] || bg)}</span><span class="pl-res"><b class="${now >= min ? 'ok' : 'no'}">${now >= min ? 'Readable' : 'Too faint'} · ${C.showRatio(now)}</b><small>needs ${min}</small></span></li>`; }).join('')
      + '</ul>';
  }
  const control = (c, s) => (c.t === 'role' ? roleRow(c, s) : c.t === 'board' ? board(s) : null);

  /* Every direction control is a way of proposing role values: the proposal names the roles, not the sliders. */
  groups.forEach((g) => g.ctl.forEach((c) => { c.inSpec = false; }));
  groups.unshift({ id: 'roles', t: 'Colour roles', short: 'Roles', sec: 'Roles',
    why: measured ? 'Every job a colour does here, starting from the exact value found in the project. Open one to change it on its own.' : 'Every job a colour does. No project colours were given, so these are proposals; open one to change it on its own.',
    note: () => (PROJECT_ROLES.length || !measured ? '' : '<span>Only some roles were found in the project; the rest are marked Proposed until you choose them.</span>'),
    ctl: RL.map((r) => ({ k: 'r_' + r.id, t: 'role', label: r.name, role: r.id, more: false, inSpec: false })) }); // the notes carry them, with tokens
  groups.push({ id: 'read', t: 'Readability', sec: 'Roles', why: 'Every pair of colours that must read together, measured for the palette you have now, beside today’s.',
    ctl: [{ k: '_board', t: 'board', label: 'Readability', more: false, inSpec: false }] });

  /* ---- what other parts of the studio read ---- */
  const scene = (s) => {
    const R = slots(s);
    return { vars: { '--sc-bg': R.page, '--sc-surface': R.surface, '--sc-line': R.line, '--sc-control': R.control, '--sc-fg': R.text, '--sc-fg2': R.text2, '--sc-fg3': R.text3, '--sc-accent': R.accent, '--sc-fill': R.fill, '--sc-on-fill': R['on-fill'], '--sc-ok': R.ok, '--sc-warn': R.warn, '--sc-bad': R.bad } };
  };
  const share = (s) => {
    const R = slots(s), [L, ch, H] = C.toOklch(R.accent);
    return { accent: { H: ch < 0.01 ? s.hue : Math.round(H), C: Math.round(ch * 1000) / 1000, L: Math.round(L * 1000) / 1000 }, light: s.side === 'light', roles: Object.assign({}, R) };
  };
  const warn = (s) => {
    const vals = values(s), base = values(DEFS.palette), rs = RL.map(roleFor(s));
    const was = new Set(C.failures(rs, base).map((f) => f.role + '/' + f.bg));
    return C.failures(rs, vals).map((f) => ({
      k: 'r_' + f.role, soft: was.has(f.role + '/' + f.bg),
      t: `${RBY[f.role].name} on ${(RBY[f.bg] || { name: f.bg }).name}: ${C.showRatio(f.got)} to 1, needs ${f.min}.${was.has(f.role + '/' + f.bg) ? ' Today’s palette has this too.' : ''}`,
    })).concat(twinFails(s).map(([k, bg, min]) => ({ k: 'pair', t: `Matched ${otherSide(s)} theme: ${SLOT_NAME[k] || k} on ${SLOT_NAME[bg] || bg} is ${C.showRatio(C.ratio(twin(s)[1][k], twin(s)[1][bg]))} to 1, needs ${min}.` })));
  };
  /** What changed, role by role, for Review: the exact values, and how today's was known. */
  const changes = (s, d) => {
    const v = values(s), b = values(d);
    const out = RL.filter((r) => v[r.id] !== b[r.id]).map((r) => ({
      c: ctlsFor('palette', 'r_' + r.id)[0], label: (BOTH ? sideName(r.side) + ': ' : '') + r.name, from: b[r.id], to: v[r.id],
      known: r.value ? (r.source === 'estimated' ? 'estimated from source' : '') : 'not measured',
    }));
    if (!BOTH && s.pair !== d.pair) out.unshift({ c: ctlsFor('palette', 'pair')[0], label: 'Themes', from: d.pair === 'both' ? 'Light and dark' : 'One theme', to: s.pair === 'both' ? `${sideName(s.side)} with a matched ${otherSide(s)} twin` : 'One theme', known: '' });
    return out;
  };
  const notes = (s) => {
    const v = values(s), d = values(DEFS.palette), out = [];
    const tok = (r) => (r.tokens.length ? r.tokens.map((t) => `${t.name}${t.file ? ' in ' + t.file : ''}${t.scope && t.scope !== ':root' ? ' (' + t.scope + ')' : ''}: ${C.formatColor(v[r.id], t.format)}`).join('; ') : 'no token found; say where it should live');
    const changed = RL.filter((r) => v[r.id] !== d[r.id]);
    out.push(`Colour roles (${BOTH ? 'light and dark' : s.side === 'light' ? 'light' : 'dark'}), by Palette Builder role id. Write each into its token in the format it already uses.`);
    changed.forEach((r) => out.push(`- ${r.id} (${r.name}${r.used ? '; used for ' + r.used : ''}): ${d[r.id]} → ${v[r.id]}. Today’s value ${r.value ? (r.source === 'estimated' ? 'estimated from source' : 'found in the project') : 'was not found; the old value shown is a proposal'}. ${tok(r)}.`));
    const same = RL.filter((r) => v[r.id] === d[r.id]);
    if (same.length) out.push(`Unchanged: ${same.map((r) => `${r.id} ${v[r.id]}`).join(', ')}.`);
    const t = twin(s);
    if (t && !t[2]) {
      out.push(`A matched ${t[0]} theme (new: the project has none today), derived from the same greys, accent and status colours. Add it under the project's ${t[0]}-theme selector (for example @media (prefers-color-scheme: ${t[0]}) or [data-theme="${t[0]}"]), reusing the same token names:`);
      out.push('- ' + ROLE.map(([k, n]) => `${k} (${n}) ${t[1][k]}`).join('; ') + '.');
    }
    return out;
  };
  const summary = (s) => {
    const n = RL.filter((r) => s['r_' + r.id] && r.value && s['r_' + r.id] !== r.value).length;
    const look = LOOKS.find((l) => Object.keys(l.patch).every((k) => sameValue(l.patch[k], s[k])));
    return (look ? look.n : `${s.side === 'light' ? 'Light' : 'Dark'}, ${s.vivid < 0.005 ? 'grey' : hueName(s.hue).toLowerCase()}`) + (twinOn(s) ? ', light and dark' : '') + (n ? `, ${n} role${n > 1 ? 's' : ''} set by hand` : '');
  };

  STUDIO.add({
    id: 'palette', ground: true, name: 'Palette', title: () => 'colours',
    defaults: DEFAULTS, today, measured, groups, looks: LOOKS, keep: ['pair'],
    fix, pick, touch, vars: () => ({}), live, still, control, changes, tile: () => ({}), tall: () => true,
    scene, share, warn, notes, summary, roles: slots,
  });
}
