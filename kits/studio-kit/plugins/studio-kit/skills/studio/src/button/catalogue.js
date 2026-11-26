/* ===== Button catalogue: the steps, choices, colours, defaults and starting points ===== */

if (P.fontCss) {
  const st = document.createElement('style');
  st.textContent = P.fontCss;
  document.head.appendChild(st);
}

const ACT = Object.assign({ copy: '', done: 'Done', nextLine: '', nextSteps: [], cta: '' }, P.action || {});
const NOUN = (P.choices && P.choices.noun) || 'option';
const NOUN_H = esc(NOUN);
const Noun = NOUN[0].toUpperCase() + NOUN.slice(1);
const AG = ((P.choices && P.choices.items) || []).filter((a) => Array.isArray(a) && a[0]);
const SEC = P.secondary || [];
const HAS_NEXT = AG.length > 0 || !!ACT.cta;
const LABELS = (P.labels && P.labels.length ? P.labels : ['Get started']).map(two);
const SUBS = (P.subs || []).map(two);

/* Colours: the project's first, then a bank; MORE.swatch adds to the end. */
const SW = [[P.brand[0], +P.brand[1], +P.brand[2], +P.brand[3], P.measured ? "Today's colour, measured from the project." : 'A starting colour. Change it freely.']];
[
  ['Mint', 172, 0.16, 0.84, 'Fresh, light green.'], ['Cyan', 212, 0.15, 0.82, 'Bright sky blue.'],
  ['Blue', 255, 0.19, 0.7, 'Classic, steady blue.'], ['Violet', 295, 0.2, 0.7, 'Rich purple.'],
  ['Pink', 350, 0.2, 0.74, 'Playful pink.'], ['Orange', 50, 0.19, 0.78, 'Warm and lively.'],
  ['Amber', 85, 0.17, 0.85, 'Golden yellow-orange.'], ['White', 154, 0, 0.97, 'Plain white.'],
  ['Lime', 125, 0.2, 0.88, 'Sharp yellow-green.'], ['Teal', 190, 0.12, 0.78, 'Calm blue-green.'],
  ['Indigo', 275, 0.17, 0.6, 'Deep blue-purple.'], ['Rose', 10, 0.2, 0.72, 'Soft red.'],
  ['Gold', 95, 0.16, 0.86, 'Warm yellow.'], ['Coral', 30, 0.18, 0.74, 'Pinkish orange.'],
  ['Graphite', 260, 0.02, 0.45, 'Dark grey.'],
].forEach((w) => { if (!SW.some((x) => x[0] === w[0])) SW.push(w); });
(Array.isArray(MO.swatch) ? MO.swatch : []).forEach((w) => {
  if (Array.isArray(w) && w.length >= 4 && !SW.some((x) => x[0] === String(w[0]))) SW.push([String(w[0]), +w[1], +w[2], +w[3], String(w[4] || ''), 'more']);
});

const FONTS = {
  project: P.font,
  ui: 'ui-sans-serif,-apple-system,"SF Pro Text",system-ui,sans-serif',
  round: 'ui-rounded,"SF Pro Rounded","Nunito","Varela Round",system-ui,sans-serif',
  mono: 'ui-monospace,"SF Mono","JetBrains Mono",Menlo,monospace',
  serif: 'ui-serif,"New York",Georgia,serif',
};

const DEFAULTS = {
  shape: 'pill', h: 52, rr: 12, pad: 0.46, width: 'hug',
  material: 'satin', blur: 16, fa: 0.1, tint: 0, rim: 0.6, depth: 50, gloss: 0.5,
  swatch: SW[0][0], H: SW[0][1], C: SW[0][2], L: SW[0][3], H2: 210, cmode: 'solid', tc: 'auto',
  idle: 'none', idle2: 'none', iconfx: 'none', entrance: 'none', spd: 1,
  hover: 'lift', press: 'sink', focus: 'blue', showFocus: false,
  label: LABELS[0][0], sub: '', font: P.font ? 'project' : 'ui', case: 'normal', wt: 600, fs: 1, trk: -0.01,
  icon: 'arrow', iconpos: 'right', isz: 1.1, tile: 'none',
  split: 'none', agent: 0, nagents: Math.min(3, AG.length || 3), gap: 2, divider: 'gap',
  confirm: 'swap', dur: 2.2, showagents: true, next: 'none',
  menuStyle: 'glass', menuR: 16, mdens: 'regular', mw: 260, micons: true, msubs: false, mkeys: false, manim: 'pop', mhi: 'tint',
};
/** Values that cannot hold for this project, whatever was saved or measured. */
function fixState(s) {
  if (!AG.length) s.split = 'none';
}
function fixDefaults(DEF) {
  if (P.today.swatch == null) DEF.swatch = SW[0][0];
  fixState(DEF);
}

/* When choices apply */
const isMat = (names) => (s) => names.includes(s.material);
const GRADIENT = ['satin', 'chrome', 'holo', 'gel', 'mesh'];
const TWO_TONE = ['solid', 'satin', 'slab', 'gel', 'pastel'];
const FIXED_COLOUR = ['ink', 'chrome', 'holo', 'frost', 'smoked', 'bevel'];
const notCircle = (s) => s.shape !== 'circle';
const hasIcon = (s) => s.icon !== 'none';
const anyMotion = (s) => s.idle !== 'none' || s.idle2 !== 'none' || (s.iconfx !== 'none' && s.icon !== 'none') || s.material === 'mesh';
const usesChoice = (s) => ['menu', 'inline', 'agent', 'switch', 'stack', 'logos', 'expand'].includes(s.split) || !!MJ.split[s.split];
const listsChoices = (s) => ['menu', 'inline', 'stack', 'logos', 'expand'].includes(s.split);
const hasMenu = (s) => ['menu', 'inline'].includes(s.split);
const sayDone = `“${ACT.done}”`;

const STEPS = [
  { id: 'shape', t: 'Shape and size', why: 'Everything else is drawn inside this, so it comes first.', dep: [], ctl: [
    ch('shape', 'Shape', [
      o('pill', 'Pill', 'Fully rounded ends. Friendly and familiar.'),
      o('squircle', 'Smooth corners', 'Rounded like an app icon, softer than a rectangle.'),
      o('soft', 'Rounded corners', 'A rectangle with corners as round as you set below.'),
      o('sharp', 'Square corners', 'Almost no rounding. Serious and tidy.'),
      o('blob', 'Wobbly', 'Uneven edges that slowly change shape. Playful.'),
      o('leaf', 'Leaf', 'Two opposite corners round, two square.'),
      o('circle', 'Round, icon only', 'A circle with just an icon and no words.'),
    ]),
    ch('h', 'Size', [
      o(36, 'Small', 'For tight spaces and rows of controls.'),
      o(44, 'Regular', 'Comfortable to tap on a phone.'),
      o(52, 'Large', 'Stands out as the main action.'),
      o(64, 'Extra large', 'Hard to miss.'),
      o(84, 'Hero', 'The one big thing on the page.'),
    ]),
    rg('h', 'Exact height', 32, 96, 1, 'px', 'Drag for any height in between.'),
    rg('rr', 'How round the corners are', 0, 40, 1, 'px', 'Square at the left, very round at the right.', { show: (s) => s.shape === 'soft', primary: true }),
    rg('pad', 'Space at the sides', 0.2, 0.9, 0.01, '', 'Snug at the left, roomy at the right.', { show: notCircle }),
    ch('width', 'Width', [
      o('hug', 'Fits the words', 'As wide as its words need.'),
      o('fill', 'Full width', 'Stretches across the space it sits in. Common on phones.'),
    ], { show: notCircle }),
  ] },

  { id: 'material', t: 'Material', why: 'What the button seems to be made of. Colour, movement and hover all depend on it.', dep: ['shape'], ctl: [
    ch('material', 'Material', [
      o('solid', 'Flat colour', 'One even colour. Clean and simple.'),
      o('satin', 'Soft shine', 'Colour with a gentle light across the top.'),
      o('glass', 'Clear glass', 'See-through, and blurs whatever is behind it.'),
      o('outline', 'Outline only', 'Just an edge in the colour, no fill.'),
      o('tint', 'Light wash', 'A faint wash of colour with coloured words.'),
      o('ink', 'Plain white', 'White with dark words, whatever the colour.'),
      o('gborder', 'Colourful edge', 'A dark middle with a multi-colour edge.'),
      o('chrome', 'Shiny metal', 'Polished silver, like car trim.'),
      o('gel', 'Glossy candy', 'Wet-looking, with a bright highlight on top.'),
      o('slab', 'Raised block', 'Looks thick and pushes down when pressed.'),
      o('neo', 'Sunk in', 'Pressed into the page, with coloured words.'),
      o('neon', 'Neon sign', 'A glowing coloured tube around the edge.'),
      o('pastel', 'Pastel', 'A soft, milky version of the colour.'),
      o('brutal', 'Bold sticker', 'Hard black outline with a shadow off to one side.'),
      o('bevel', 'Cut glass', 'Glass with bright angled edges.'),
      o('holo', 'Rainbow foil', 'Soft rainbow colours that shift as the pointer passes.'),
      o('mesh', 'Moving colours', 'Two colours slowly blend and drift.'),
      o('frost', 'Frosted white', 'Milky white glass with dark words.'),
      o('smoked', 'Dark glass', 'Tinted dark glass with white words.'),
      o('dashed', 'Stitched', 'A dashed edge, like sewing.'),
    ]),
    rg('blur', 'Blur behind it', 0, 32, 1, 'px', 'Only noticeable over a busy background.', { show: isMat(['glass', 'bevel', 'frost', 'smoked']) }),
    rg('fa', 'How cloudy', 0, 0.4, 0.01, '', 'Clear at the left, milky at the right.', { show: isMat(['glass']) }),
    rg('tint', 'Colour in the glass', 0, 60, 1, '%', 'None at the left, strongly coloured at the right.', { show: isMat(['glass']) }),
    rg('rim', 'Edge strength', 0, 1, 0.05, '', 'Thin and faint at the left, thick and bright at the right.', { show: isMat(['glass', 'outline', 'gborder', 'neon', 'dashed', 'brutal']) }),
    rg('depth', 'Shadow', 0, 100, 1, '', 'Flat on the page at the left, floating at the right.', { show: isMat(['solid', 'satin', 'glass', 'ink', 'chrome', 'gel', 'slab', 'pastel', 'bevel', 'holo', 'frost', 'smoked', 'neon']) }),
    rg('gloss', 'Shine on top', 0, 1, 0.05, '', 'Matte at the left, glossy at the right.', { show: isMat(['solid', 'satin', 'slab', 'gel', 'pastel', 'mesh', 'holo', 'glass', 'bevel', 'frost', 'smoked']) }),
  ] },

  { id: 'colour', t: 'Colour', why: 'Pick a colour, then adjust it. The words turn dark or white on their own so they stay readable.', dep: ['material'],
    note: (s) => (FIXED_COLOUR.includes(s.material) ? `<span>${esc(nameOf('material'))} keeps its own colours. The colour here only shows in glows, rings and the movement layers.</span>` : ''),
    ctl: [
      { k: 'swatch', t: 'swatches', label: 'Colour' },
      ch('cmode', 'Colour style', [
        o('solid', 'One colour', 'The same colour all over.'),
        o('duo', 'Two colours', 'Fades from one colour into a second.'),
        o('rainbow', 'Rainbow', 'A band of soft rainbow colours.'),
      ], { show: isMat(TWO_TONE) }),
      rg('H2', 'Second colour', 0, 360, 1, '°', 'Where the fade ends, round the colour wheel.', { show: (s) => (s.cmode === 'duo' && isMat(TWO_TONE)(s)) || s.material === 'mesh' }),
      rg('H', 'Colour wheel', 0, 360, 1, '°', 'Slide round to change the colour itself.', { inSpec: false }),
      rg('C', 'Strength', 0, 0.3, 0.01, '', 'Grey at the left, fully vivid at the right.', { inSpec: false }),
      rg('L', 'Lightness', 0.3, 0.97, 0.01, '', 'Dark at the left, light at the right.', { inSpec: false }),
      ch('tc', 'Word colour', [
        o('auto', 'Automatic', 'Dark or white, whichever reads better.'),
        o('dark', 'Dark', 'Always dark words.'),
        o('white', 'White', 'Always white words.'),
      ], { more: false, show: (s) => isMat(['solid', 'satin', 'gel', 'slab'])(s) && s.cmode !== 'rainbow' }),
    ] },

  { id: 'motion', t: 'Movement', why: 'What the button does while nobody is touching it. Most buttons stay still; movement pulls the eye, so use it for the one thing that matters.', dep: ['material', 'shape'],
    note: (s) => (s.rm ? `<span>Less motion is on, so the preview stays still.${RM_OS ? ' Your device asks for less motion.' : ''}</span><button class="chip sm" data-set="rm">Show movement</button>` : ''),
    ctl: [
      ch('idle', 'Main movement', [
        o('none', 'Still', 'No movement. The calm choice.'),
        o('sheen', 'Passing shine', 'A streak of light slides across now and then.'),
        o('breathe', 'Slow glow', 'Gently brightens and dims, like breathing.'),
        o('orbit', 'Light round the edge', 'A spark of light travels round the border.'),
        o('prism', 'Rainbow edge', 'A rainbow line circles the border.'),
        o('aurora', 'Drifting colour', 'Soft bands of colour drift across it.'),
        o('bob', 'Float', 'Rises and settles a little.'),
        o('sonar', 'Ripples', 'Rings spread outward, like a pebble in water.'),
        o('shimmer', 'Shimmering words', 'A glint passes over the words.'),
        o('dot', 'Live dot', 'A small dot pulses next to the words.'),
        o('sparkle', 'Sparkle', 'Tiny points of light twinkle.'),
        o('smoke', 'Smoke', 'A soft cloud of colour drifts inside.'),
        o('blob', 'Wobbly edge', 'The outline slowly changes shape.'),
        o('beat', 'Heartbeat', 'A double pulse, like a heartbeat.'),
        o('scan', 'Scanning line', 'A thin line moves from top to bottom.'),
        o('caustic', 'Pool light', 'Light moves like sun on water.'),
        o('wave', 'Waves', 'Waves roll along the bottom.'),
        o('bubbles', 'Bubbles', 'Small bubbles rise through it.'),
        o('underglow', 'Glow underneath', 'A coloured glow pulses below it.'),
        o('march', 'Dashed ring', 'A dashed ring around it fades in and out.'),
        o('glare', 'Sweeping light', 'A beam of light turns across it.'),
        o('jelly', 'Jelly', 'Squashes and springs back now and then.'),
        o('sway', 'Sway', 'Tilts gently from side to side.'),
        o('flicker', 'Flicker', 'Dims for a split second, like an old sign.'),
        o('pan', 'Shifting colour', 'Its colours slide back and forth.', (s) => GRADIENT.includes(s.material) || (s.cmode !== 'solid' && isMat(TWO_TONE)(s))),
      ]),
      ch('idle2', 'Extra light on top', [
        o('none', 'Nothing extra', 'Just the main movement.'),
        o('sparkle', 'Sparkle', 'Twinkles on top of the main movement.'),
        o('scan', 'Scanning line', 'A thin line passes over it.'),
        o('bubbles', 'Bubbles', 'Small bubbles rise over it.'),
        o('glare', 'Sweeping light', 'A beam of light turns over it.'),
        o('edge', 'Glowing top edge', 'The top edge brightens and fades.'),
      ]),
      ch('iconfx', 'Icon movement', [
        o('none', 'Still', 'The icon does not move.'),
        o('nudge', 'Nudge', 'Moves down a little and back.'),
        o('bounce', 'Hop', 'Jumps up now and then.'),
        o('pulse', 'Pulse', 'Grows and shrinks.'),
        o('spin', 'Spin', 'Turns slowly.'),
      ], { show: hasIcon }),
      rg('spd', 'Speed', 0.4, 2.5, 0.1, 'x', 'Faster at the left, slower at the right.', { show: anyMotion }),
      ch('entrance', 'How it appears', [
        o('none', 'Already there', 'No entrance when the page opens.'),
        o('fade', 'Fade in', 'Fades in when the page opens.'),
        o('up', 'Rise in', 'Slides up as it fades in.'),
        o('scale', 'Grow in', 'Grows from small.'),
        o('blur', 'Come into focus', 'Starts blurry, then sharpens.'),
        o('spring', 'Bounce in', 'Springs up and settles.'),
      ], { replay: true }),
    ] },

  { id: 'interact', t: 'Hover, press and keyboard', why: 'How it reacts to a mouse, a finger or the keyboard. Depends on the material and movement.', dep: ['material', 'motion'],
    note: () => (TOUCH ? '<span>This device has no hover. Hover choices show with a mouse or trackpad; the description says what each does.</span>' : ''),
    ctl: [
      ch('hover', 'When the pointer is over it', [
        o('none', 'No change', 'Stays as it is.'),
        o('lift', 'Lift', 'Rises slightly and brightens.'),
        o('rise', 'Rise', 'Lifts a little higher.'),
        o('scale', 'Grow', 'Gets slightly bigger.'),
        o('glow', 'Glow', 'A soft light spreads around it.'),
        o('brighten', 'Brighten', 'The colour gets lighter.'),
        o('spot', 'Spotlight', 'A soft light follows the pointer.'),
        o('shine', 'Shine', 'A streak of light crosses once.'),
        o('tilt', 'Tilt', 'Leans toward the pointer, like a card in the hand.'),
        o('magnet', 'Magnetic', 'Drifts a little toward the pointer.'),
        o('invert', 'Turn white', 'Flips to white with dark words.'),
        o('wobble', 'Wobble', 'Rocks briefly.'),
        o('nudge', 'Icon moves', 'The icon slides the way it points.', hasIcon),
        o('ring', 'Halo', 'A soft ring appears around it.'),
      ]),
      ch('press', 'When pressed', [
        o('sink', 'Sink', 'Shrinks a little, like pushing it in.'),
        o('squish', 'Squish', 'Flattens for a moment.'),
        o('bounce', 'Bounce', 'Shrinks and springs back.'),
        o('flash', 'Flash', 'Lights up for a moment.'),
        o('3d', 'Push down', 'Tips back as if pressed from the top.'),
        o('ring', 'Pulse ring', 'A ring of colour pops out.'),
        o('ripple', 'Ripple', 'A wave spreads from where you touched.'),
        o('hold', 'Hold to confirm', 'Must be held for a second. For actions that are hard to undo.'),
      ]),
      ch('focus', 'Keyboard outline', [
        o('blue', 'Blue ring', 'The standard outline people using the Tab key see.'),
        o('accent', 'Ring in your colour', 'The outline matches the button colour.'),
        o('white', 'White ring', 'A plain white outline.'),
        o('glow', 'Glowing ring', 'A soft glowing outline.'),
      ]),
      ch('showFocus', 'Preview the keyboard outline', [
        o(false, 'Hidden', 'It only appears when someone moves through the page with Tab.'),
        o(true, 'Shown', 'Shows it now so you can judge it.'),
      ], { more: false, inSpec: false }),
    ] },

  { id: 'content', t: 'Words and icon', why: 'Lead with a verb that says what happens. The shape decides how much fits.', dep: ['shape'], ctl: [
    ch('label', 'Words', LABELS.map((l, i) => o(l[0], l[0], l[1] || (i === 0 && P.measured ? 'What it says today.' : ''))), { show: notCircle }),
    { k: 'label', t: 'text', label: 'Or write your own', show: notCircle },
    ch('sub', 'Second line', [o('', 'None', 'Just the main words.'), ...SUBS.map((l) => o(l[0], l[0], l[1]))], { show: (s) => notCircle(s) && SUBS.length > 0 }),
    ch('font', 'Lettering', [
      ...(P.font ? [o('project', "Your project's", 'The lettering the project already uses.')] : []),
      o('ui', 'Clean', 'A plain modern typeface.'),
      o('round', 'Rounded', 'Soft letters with rounded ends.'),
      o('mono', 'Typewriter', 'Every letter the same width, like code.'),
      o('serif', 'Book', 'Letters with small feet, like print.'),
    ], { show: notCircle }),
    ch('case', 'Capitals', [
      o('normal', 'As written', 'Normal sentence case.'),
      o('upper', 'ALL CAPITALS', 'Louder and more formal. Looks best with a little space between letters.'),
    ], { more: false, show: notCircle }),
    ch('wt', 'Thickness', [
      o(500, 'Regular', 'Light and quiet.'),
      o(600, 'Medium bold', 'Clear without shouting.'),
      o(700, 'Bold', 'Strong and heavy.'),
    ], { show: notCircle }),
    rg('fs', 'Word size', 0.85, 1.35, 0.05, 'x', 'Smaller at the left, bigger at the right.', { show: notCircle }),
    rg('trk', 'Space between letters', -0.04, 0.12, 0.005, 'em', 'Tighter at the left, looser at the right.', { show: notCircle }),
    ch('icon', 'Icon', [
      o('download', 'Download', 'An arrow pointing down into a tray.'),
      o('arrow', 'Arrow', 'Points forward: go on.'),
      o('copy', 'Copy', 'Two overlapping pages.'),
      o('sparkle', 'Sparkle', 'Suggests something new or a bit magic.'),
      o('plus', 'Plus', 'Add or create something.'),
      o('bolt', 'Lightning', 'Fast or powerful.'),
      o('terminal', 'Command line', 'For tools people run in a terminal.'),
      o('box', 'Package', 'Install or ship something.'),
      o('cloud', 'Cloud', 'Save or sync online.'),
      o('none', 'No icon', 'Words only.', notCircle),
    ]),
    ch('iconpos', 'Icon side', [
      o('left', 'Before the words', 'The icon comes first.'),
      o('right', 'After the words', 'The icon comes last, pointing onward.'),
    ], { more: false, show: (s) => hasIcon(s) && notCircle(s) }),
    ch('tile', 'Icon background', [
      o('none', 'Plain icon', 'The icon sits straight on the button.'),
      o('tile', 'Icon in a circle', 'The icon sits in a small dark circle.'),
    ], { show: hasIcon }),
    rg('isz', 'Icon size', 0.9, 1.7, 0.05, 'em', 'Smaller at the left, bigger at the right.', { show: hasIcon }),
  ] },

  { id: 'split', t: `Choosing a ${NOUN}`, why: `Whether the button also lets people pick a ${NOUN_H}. Depends on the shape and the words.`, dep: ['shape', 'content'], ctl: [
    ch('split', 'Layout', [
      o('none', 'Just the button', 'One action, no choice.'),
      o('menu', 'Button with a menu arrow', `An arrow beside it opens a list of ${NOUN}s.`),
      o('inline', `${Noun} shown inside`, `The current ${NOUN} sits inside the button; tap it to change.`),
      o('agent', `Button plus last ${NOUN}`, `Remembers the last ${NOUN} and shows it beside the button.`),
      o('switch', 'Switch above', `Pick one of ${Math.min(3, AG.length)} ${NOUN}s, then press.`, () => AG.length >= 2),
      o('pair', 'Arrow beside it', 'A small second button that goes straight on.'),
      o('segmented', 'Three joined buttons', `The main action plus ${SEC.slice(0, 2).join(' and ')}.`, () => SEC.length >= 2),
      o('dock', 'Floating bar', 'The button with quieter actions in a glass bar.', () => SEC.length >= 1),
      o('stack', `${Noun}s as chips below`, `Small chips for each ${NOUN} underneath.`),
      o('logos', 'Coloured dots below', `A coloured dot for each ${NOUN} underneath.`),
      o('expand', `Plus opens ${NOUN}s`, `A plus button reveals the ${NOUN}s.`),
    ]),
    ch('agent', `Starting ${NOUN}`, AG.map((a, i) => o(i, a[0], a[3] || '')), { more: false, show: usesChoice }),
    ch('nagents', `How many ${NOUN}s show`,
      [3, 5, 7].filter((n) => n < AG.length).concat([AG.length]).map((n) => o(n, String(n), n === AG.length ? `All ${AG.length}.` : `The first ${n} of ${AG.length}.`)),
      { more: false, show: (s) => listsChoices(s) && AG.length > 3 }),
    rg('gap', 'Gap between parts', 0, 12, 1, 'px', 'Touching at the left, apart at the right.', { show: (s) => ['menu', 'agent', 'pair', 'segmented', 'expand'].includes(s.split) && s.divider !== 'none' }),
    ch('divider', 'How the parts join', [
      o('gap', 'Small gap', 'A sliver of space between them.'),
      o('line', 'Thin line', 'Touching, with a hairline between.'),
      o('none', 'Seamless', 'One piece, no break.'),
    ], { show: (s) => ['menu', 'agent', 'pair', 'segmented'].includes(s.split) }),
  ] },

  { id: 'confirm', t: 'After you press', why: `What people see once it has worked.${P.afterNote ? ' ' + esc(P.afterNote) : ''}`, dep: ['material', 'split', 'content'], ctl: [
    ch('confirm', 'What happens', [
      o('swap', `Says ${sayDone}`, `The words change to ${sayDone} with a tick, then change back.`),
      o('burst', 'Confetti', `Says ${sayDone} with a little burst of dots.`),
      o('progress', 'Fills up first', `A bar fills across, then it says ${sayDone}.`),
      o('spin', 'Spinner first', 'Shows a spinner while it works, then a tick.'),
      o('link', 'Then a link', `Says ${sayDone}, then a link to the next step appears.`, () => HAS_NEXT),
      o('morph', `Turns into ${NOUN} buttons`, `After ${sayDone}, a button for each ${NOUN} rises up.`, () => AG.length > 0),
      o('page', 'Done screen', 'A screen slides up confirming it worked.'),
      o('sheet', 'Panel from below', 'A panel rises from the bottom edge.'),
      o('toast', 'Note from below', 'A small note slides up, then goes.'),
      o('banner', 'Note from above', 'A small note drops from the top, then goes.'),
    ]),
    rg('dur', 'How long it stays', 1, 6, 0.2, 's', 'Seconds before it goes back.'),
    ch('showagents', 'Offer the next step', [
      o(true, 'Yes', AG.length ? `Shows “Open ${AG[0][0]}” and a way to pick another.` : `Shows “${ACT.cta}”.`),
      o(false, 'No', 'Just confirms.'),
    ], { more: false, show: (s) => HAS_NEXT && ['morph', 'page', 'sheet', 'toast', 'banner'].includes(s.confirm) }),
    ch('next', 'Tell people what to do next', [
      o('none', 'Nothing', 'No extra words.'),
      o('line', 'One line', `“${ACT.nextLine}”`, () => !!ACT.nextLine),
      o('steps', 'Short steps', `“${(ACT.nextSteps || []).join(', ')}”`, () => (ACT.nextSteps || []).length > 0),
    ], { show: () => !!ACT.nextLine || (ACT.nextSteps || []).length > 0 }),
  ] },

  { id: 'menu', t: `The ${NOUN} list`, why: `How the list of ${NOUN_H}s looks when it opens. It stays open while you are on this step.`, dep: ['split', 'material'],
    na: (s) => (hasMenu(s) ? '' : 'Not needed with this layout. Press Next to go on.'),
    ctl: [
      ch('menuStyle', 'Style', [
        o('glass', 'Glass', 'See-through, and blurs what is behind it.'),
        o('solid', 'Solid', 'An opaque dark panel.'),
        o('sheet', 'From the bottom', 'Slides up from the bottom edge, like a phone.'),
        o('grid', 'Tiles', 'A grid of squares.'),
        o('pills', 'Chips', 'Rounded chips that wrap onto lines.'),
        o('command', 'With search', 'A search box on top, for long lists.'),
      ]),
      ch('mdens', 'Row height', [
        o('compact', 'Compact', 'More rows in less space.'),
        o('regular', 'Regular', 'Comfortable to read and tap.'),
        o('roomy', 'Roomy', 'Large, easy targets.'),
      ]),
      rg('mw', 'Width', 200, 360, 5, 'px', 'Narrow at the left, wide at the right.', { show: (s) => s.menuStyle !== 'sheet' }),
      rg('menuR', 'Corner roundness', 4, 36, 1, 'px', 'Square at the left, round at the right.'),
      ch('micons', 'Coloured squares', [o(true, 'Shown', 'A coloured square with a letter for each.'), o(false, 'Hidden', 'Names only.')], { more: false }),
      ch('msubs', 'Descriptions', [o(true, 'Shown', 'A short line under each name.'), o(false, 'Hidden', 'Names only.')], { more: false, show: () => AG.some((a) => a[3]) }),
      ch('mkeys', 'Keyboard shortcuts', [o(true, 'Shown', 'Shows ⌘1, ⌘2 and so on.'), o(false, 'Hidden', 'No shortcuts shown.')], { more: false, show: (s) => s.menuStyle !== 'grid' }),
      ch('manim', 'How it opens', [
        o('pop', 'Pops', 'Grows out of the button.'),
        o('slide', 'Slides down', 'Drops into place.'),
        o('fade', 'Fades in', 'Appears without moving.'),
      ], { show: (s) => s.menuStyle !== 'sheet' }),
      ch('mhi', 'Chosen row', [
        o('tint', 'Light wash', 'A faint wash of colour.'),
        o('solid', 'Filled', 'Filled with the button colour.'),
        o('outline', 'Outlined', 'An outline in the button colour.'),
      ]),
    ] },
];
if (!AG.length) P.dropSteps = [...(P.dropSteps || []), 'split', 'menu'];

const SHORT = { shape: 'Shape', material: 'Material', colour: 'Colour', motion: 'Movement', interact: 'Hover', content: 'Words', split: Noun, confirm: 'After press', menu: 'List' };

const PRESETS = [
  [P.startName || (P.measured ? 'Today' : 'Simple start'), {}],
  ['Clear glass, slow glow', { material: 'glass', idle: 'breathe', blur: 18, fa: 0.12, tint: 12 }],
  ['Tall raised block', { shape: 'squircle', h: 68, material: 'slab', press: 'squish' }],
  ['Glass with drifting colour', { material: 'glass', idle: 'aurora', hover: 'spot' }],
  ['Thick outline', { material: 'outline', h: 56, rim: 1, hover: 'glow' }],
  ['Neon sign', { material: 'neon', idle: 'flicker' }],
  ['Rainbow foil', { material: 'holo', h: 56, hover: 'shine' }],
  ['Pastel, rounded corners', { material: 'pastel', shape: 'soft', rr: 22, h: 58 }],
  ...(AG.length ? [
    ['Button plus last choice', { split: 'agent', confirm: 'toast' }],
    ['List with search', { split: 'inline', material: 'smoked', menuStyle: 'command', nagents: Math.min(5, AG.length) }],
  ] : []),
];

/** Extra spec lines that are about buttons rather than one step. */
function specNotes() {
  const out = [];
  if (P.column) out.push(`Full width means the content column: ${COLUMN}px on a computer, the screen width less ${DEV.phone.gut}px each side on a phone.`);
  out.push('Less motion: when the visitor asks for less motion, nothing moves while waiting and there is no entrance; hover and press change light or colour only.');
  if (P.afterNote) out.push('After press: ' + P.afterNote);
  return out;
}
