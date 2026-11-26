/* ===== Typography module: the faces, sizes and spacing of the lettering, always drawn in real words =====
   Faces are honest: the built-in ones are stacks every device can show; the others load from Google Fonts the first
   time a drawing needs them, and when one does not arrive the page says the preview is showing a stand-in. */
{
  const T = Object.assign({ measured: false, today: {}, faces: [], drop: [] }, P.type || {});

  const SANS = 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  const SERIF = 'Charter,"Bitstream Charter","Sitka Text",Cambria,Georgia,serif';
  const MONO = 'ui-monospace,"SF Mono","Cascadia Code","Source Code Pro",Menlo,Consolas,"DejaVu Sans Mono",monospace';
  const BACK = { sans: SANS, serif: SERIF, mono: MONO };

  /* use: where a face is offered. h headings, t text, c code. */
  const sys = (id, name, sentence, stack, use) => ({ id, name, sentence, stack, kind: 'system', use });
  const web = (id, family, sentence, back, weights, use) => ({
    id, name: family, family, sentence, kind: 'web', weights, use,
    google: family.replace(/ /g, '+') + (weights.length > 1 ? ':wght@' + weights.join(';') : ''),
    stack: `"${family}",${BACK[back]}`,
  });
  const W = [300, 400, 500, 600, 700, 800], W7 = [300, 400, 500, 600, 700];
  const FACES = [
    ...(Array.isArray(T.faces) ? T.faces : []).filter((f) => f && f.id && f.stack).map((f) => ({
      id: String(f.id), name: String(f.name || f.id), stack: String(f.stack), css: f.css ? String(f.css) : '',
      sentence: String(f.sentence || 'The lettering your project uses now.'), kind: 'project', use: String(f.use || 'ht'),
      weights: Array.isArray(f.weights) ? f.weights.map(Number) : null,
    })),
    sys('system', 'Built-in', 'The lettering each device already uses for its menus. Loads nothing and feels at home everywhere.', SANS, 'ht'),
    sys('rounded', 'Built-in rounded', 'Soft, rounded letter ends on devices that have them; plain elsewhere.', 'ui-rounded,"SF Pro Rounded","Hiragino Maru Gothic ProN",Quicksand,Comfortaa,Manjari,"Arial Rounded MT","Arial Rounded MT Bold",Calibri,source-sans-pro,sans-serif', 'ht'),
    sys('humanist', 'Humanist', 'Warm, hand-drawn proportions, like Gill Sans. Each device uses the closest face it has.', 'Seravek,"Gill Sans Nova",Ubuntu,Calibri,"DejaVu Sans",source-sans-pro,sans-serif', 'ht'),
    sys('geometric', 'Geometric', 'Letters built from circles and straight lines, like Avenir.', 'Avenir,"Avenir Next LT Pro",Montserrat,Corbel,"URW Gothic",source-sans-pro,sans-serif', 'ht'),
    sys('narrow', 'Narrow', 'Tall, narrow letters like road signs. Fits long headings in a small space.', 'Bahnschrift,"DIN Alternate","Franklin Gothic Medium","Nimbus Sans Narrow",sans-serif-condensed,sans-serif', 'h'),
    sys('bookserif', 'Book serif', 'A sturdy reading serif such as Charter or Cambria. Calm and trustworthy.', SERIF, 'ht'),
    sys('oldstyle', 'Old-style serif', 'Classic, slightly calligraphic letters, like Palatino.', '"Iowan Old Style","Palatino Linotype","URW Palladio L",P052,serif', 'ht'),
    sys('fashion', 'Fashion serif', 'Very thin and very thick strokes, like a magazine cover. For big words only.', 'Didot,"Bodoni MT","Noto Serif Display","URW Palladio L",P052,Sylfaen,serif', 'h'),
    sys('slab', 'Slab serif', 'Square, blocky ends on every letter. Sturdy and mechanical.', 'Rockwell,"Rockwell Nova","Roboto Slab","DejaVu Serif","Sitka Small",serif', 'ht'),
    sys('sysmono', 'Built-in code', 'Each device’s own even-width lettering. Loads nothing.', MONO, 'hc'),
    web('inter', 'Inter', 'Clear, neutral and made for screens. The safe modern choice.', 'sans', W, 'ht'),
    web('geist', 'Geist', 'Crisp and a little technical, like a developer tool.', 'sans', W, 'ht'),
    web('manrope', 'Manrope', 'Open and modern with a slightly geometric feel.', 'sans', W, 'ht'),
    web('dmsans', 'DM Sans', 'Round and simple. Friendly without being childish.', 'sans', W, 'ht'),
    web('plexsans', 'IBM Plex Sans', 'Sturdy and businesslike, with a hint of machinery.', 'sans', W7, 'ht'),
    web('spacegrotesk', 'Space Grotesk', 'Quirky shapes with an engineered, slightly retro edge.', 'sans', W7, 'ht'),
    web('sora', 'Sora', 'Wide and smooth. Feels new and confident.', 'sans', W, 'ht'),
    web('bricolage', 'Bricolage Grotesque', 'Lively and a little eccentric, best when set big.', 'sans', W, 'ht'),
    web('nunito', 'Nunito', 'Rounded ends everywhere. Soft and welcoming.', 'sans', W, 'ht'),
    web('instrument', 'Instrument Serif', 'A slim, elegant serif for big headlines. Comes in one thickness only.', 'serif', [400], 'h'),
    web('playfair', 'Playfair Display', 'Strong contrast between thick and thin strokes. Dressy and formal.', 'serif', [400, 500, 600, 700, 800], 'h'),
    web('fraunces', 'Fraunces', 'A warm, soft serif with old-fashioned charm.', 'serif', W, 'ht'),
    web('newsreader', 'Newsreader', 'A newspaper serif drawn for long reading.', 'serif', W, 'ht'),
    web('sourceserif', 'Source Serif 4', 'A calm, sturdy serif that reads well at any size.', 'serif', W, 'ht'),
    web('jetbrains', 'JetBrains Mono', 'Even-width letters made for reading code all day.', 'mono', W, 'hc'),
    web('plexmono', 'IBM Plex Mono', 'Even-width letters with a friendly, slightly rounded feel.', 'mono', W7, 'hc'),
  ];
  const BY = {};
  FACES.forEach((f) => { if (!BY[f.id]) BY[f.id] = f; });
  const OWN = FACES.filter((f) => f.kind === 'project').map((f) => f.id);
  /* The order each list shows, so the first dozen are clearly different from one another. */
  const ORDER = {
    h: ['system', 'inter', 'instrument', 'fraunces', 'playfair', 'spacegrotesk', 'bricolage', 'newsreader', 'nunito', 'geist', 'sora', 'narrow', 'dmsans', 'manrope', 'plexsans', 'sourceserif', 'bookserif', 'oldstyle', 'fashion', 'slab', 'humanist', 'geometric', 'rounded', 'jetbrains', 'plexmono', 'sysmono'],
    t: ['system', 'inter', 'sourceserif', 'newsreader', 'dmsans', 'plexsans', 'geist', 'nunito', 'manrope', 'fraunces', 'spacegrotesk', 'sora', 'bricolage', 'bookserif', 'oldstyle', 'humanist', 'geometric', 'rounded', 'slab'],
    c: ['sysmono', 'jetbrains', 'plexmono'],
  };
  const facesFor = (u) => [...OWN.filter((id) => BY[id].use.includes(u)), ...ORDER[u].filter((id) => BY[id] && BY[id].use.includes(u))];
  const FIRST = { display: 'system', body: 'system', mono: 'sysmono' };
  const ROLE = { display: 'h', body: 't', mono: 'c' };
  const face = (id, k = 'display') => BY[id] || BY[FIRST[k]];
  const faceOpts = (u) => facesFor(u).map((id) => o(id, BY[id].name, BY[id].sentence + (BY[id].kind === 'project' ? ' Your project’s own.' : '')));

  /* ---- loading web faces, and knowing whether they really arrived ---- */
  const FST = {}; // face id -> 'loading' | 'ok' | 'failed'
  let redrawTimer = 0;
  function told() {
    clearTimeout(redrawTimer);
    redrawTimer = setTimeout(() => {
      const ae = document.activeElement;
      if (ae && ae.type === 'range') return; // never pull a slider out from under a finger
      try { if (NAV.review || NAV.mod === 'type') renderPanel(); } catch {}
    }, 250);
  }
  function settle(f, ok) {
    const was = FST[f.id];
    FST[f.id] = ok ? 'ok' : 'failed';
    if (was !== FST[f.id] && (FST[f.id] === 'failed' || was === 'failed')) told();
  }
  async function verify(f, family) {
    try {
      const got = await document.fonts.load(`400 24px "${family}"`);
      settle(f, got.length > 0);
    } catch { settle(f, false); }
  }
  function need(f) {
    if (!f || FST[f.id] || (f.kind !== 'web' && !(f.kind === 'project' && f.css))) return;
    FST[f.id] = 'loading';
    if (f.kind === 'project') {
      const st = document.createElement('style');
      st.textContent = f.css;
      document.head.appendChild(st);
      const fam = (/^\s*["']?([^,"']+)/.exec(f.stack) || [])[1];
      if (fam) setTimeout(() => verify(f, fam.trim()), 50); else FST[f.id] = 'ok';
      return;
    }
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = `https://fonts.googleapis.com/css2?family=${f.google}&display=swap`;
    l.onload = () => verify(f, f.family);
    l.onerror = () => settle(f, false);
    document.head.appendChild(l);
    setTimeout(() => { if (FST[f.id] === 'loading') settle(f, false); }, 9000);
  }
  const missing = (f) => FST[f.id] === 'failed';
  const facesOf = (s) => [face(s.display, 'display'), face(s.body, 'body'), face(s.mono, 'mono')];

  /* ---- sizes ---- */
  const r1 = (x) => Math.round(x * 10) / 10;
  const SCALE = [[-1, 'Small print'], [0, 'Text'], [1, 'Large text'], [2, 'Small heading'], [3, 'Heading'], [4, 'Page title']];
  const stepPx = (s, n) => r1(s.size * Math.pow(s.ratio, n));
  const rem = (px) => +(px / 16).toFixed(3) + 'rem';

  /* ---- words: the project's own where the agent found them ---- */
  const STAND = {
    h: 'Make something people love to use',
    p: 'Good lettering is easy to read and gives every line a clear place. Short sentences help, and so does a little room between lines.',
    more: 'This second paragraph is here so you can judge a longer stretch of reading: how far the eye travels along each line, how easily it finds the start of the next one, and whether the page feels calm or crowded.',
    code: 'npm install your-package',
  };
  const words = () => ({ h: CX.headline || STAND.h, p: CX.body || STAND.p, code: (CX.code || STAND.code).split('\n')[0] });
  /** The first few words, up to about n letters. */
  function short(t, n = 16) {
    const out = [];
    for (const w of String(t).split(/\s+/)) { if (out.length && (out.join(' ') + ' ' + w).length > n) break; out.push(w); }
    return out.join(' ');
  }
  const lt = () => { try { return bgLight() ? ' ty-lt' : ''; } catch { return ''; } };
  /** With the Palette studio open, every specimen sits on the palette being chosen, so type and colour are judged together. */
  const pal = () => { const R = shared('roles'); return R ? { cls: ' ty-pal', css: `background:${R.page};color:${R.text};--ty-acc:${R.accent}` } : { cls: '', css: '' }; };

  function vars(s) {
    const [d, b, m] = facesOf(s);
    [d, b, m].forEach(need);
    return {
      '--ty-display': d.stack, '--ty-body': b.stack, '--ty-mono': m.stack, '--ty-size': s.size + 'px', '--ty-ratio': s.ratio,
      '--ty-lh': s.lh, '--ty-hlh': s.hlh, '--ty-track': s.htrack + 'em', '--ty-hw': s.hweight, '--ty-bw': s.bweight,
      '--ty-case': s.hcase, '--ty-measure': s.measure, '--ty-num': s.num,
    };
  }

  /* ---- drawings ---- */
  const miss = (f) => (missing(f) ? `<span class="ty-miss">Not loaded here</span>` : '');
  const H = (t, px, x = '') => `<div class="ty-h${x}" style="font-size:${px}px">${esc(t)}</div>`;
  const X = (t, px, x = '') => `<p class="ty-t${x}" style="font-size:${px}px">${esc(t)}</p>`;
  function tileArt(s, k) {
    const w = words(), [d, b, m] = facesOf(s);
    /* Every tile shows complete words at a size you can judge: the whole headline, a whole paragraph. */
    const NUMS = '<span class="ty-numrow">0123456789 · 1,280 · £71.17</span>';
    switch (k) {
      case 'display': case 'hweight': case 'htrack': case 'hcase':
        return H(w.h, 28) + (k === 'display' ? miss(d) : '');
      case 'body': case 'bweight':
        return X(w.p, 16) + (k === 'body' ? miss(b) : '');
      case 'mono':
        return `<code class="ty-c" style="font-size:15px">${esc(w.code)}</code><code class="ty-c ty-faint" style="font-size:15px">{ ok: true, items: 6 }</code>` + miss(m);
      case 'size':
        return `<span class="ty-meta">${s.size}px</span>` + X(w.p, s.size);
      case 'ratio': {
        const px = (n) => r1(Math.min(44, s.size * Math.pow(s.ratio, n)));
        return H('Page title', px(4)) + H('Section heading', px(2), ' ty-gap') + X('Reading text at the base size, with the heading sizes worked out from it.', s.size, ' ty-gap');
      }
      case 'lh': return X(w.p + ' ' + STAND.more, 14);
      case 'hlh': return H(w.h, 30);
      case 'measure': return `<p class="ty-t ty-read" style="font-size:8px">${esc(w.p + ' ' + STAND.more)}</p>`;
      case 'num': return `<table class="ty-t ty-nums" style="font-size:22px"><tr><td>Starter</td><td>£1,111.10</td></tr><tr><td>Team</td><td>£980.45</td></tr><tr><td>Business</td><td>£71.17</td></tr></table>`;
      default: return H(w.h, 28) + NUMS;
    }
  }
  /* A whole specimen: label, the complete headline, a paragraph, figures and a line of code, identical content in
     every direction so only the lettering differs. */
  function specimen(s, big) {
    const w = words(), [d, b, m] = facesOf(s);
    const hs = r1(Math.max(22, Math.min(big ? 40 : 34, s.size * Math.pow(s.ratio, 3.2))));
    return (missing(d) || missing(b) || missing(m) ? `<span class="ty-miss ty-top">${esc(list([d, b, m].filter(missing).map((f) => f.name)))} not loaded: showing a stand-in</span>` : '')
      + (CX.eyebrow ? `<span class="ty-lbl ty-t">${esc(CX.eyebrow)}</span>` : '') + H(w.h, hs)
      + X(w.p, Math.min(17, s.size), ' ty-gap ty-read')
      + `<p class="ty-t ty-gap ty-numrow" style="font-size:${Math.min(17, s.size)}px">0123456789 · 1,280 seats · £71.17</p>`
      + `<code class="ty-c ty-gap" style="font-size:${r1(Math.min(15, s.size * 0.875))}px">${esc(w.code)}</code>`
      + `<span class="ty-meta ty-gap">${esc(d.name)}${d.id === b.id ? '' : ' · ' + esc(b.name)} · ${esc(m.name)} · ${s.size}px</span>`;
  }
  function still(s, opt = {}) {
    const p = pal();
    if (opt.tile) return `<div class="ty ty-tile${opt.tile === 'measure' ? ' ty-wide' : ''}${p.cls || lt()}" style="${p.css}">${tileArt(s, opt.tile)}</div>`;
    return `<div class="ty ty-spec${opt.compare ? ' ty-big' : ''}${p.cls || lt()}" style="${p.css}">${specimen(s, opt.compare)}</div>`;
  }

  function live(el, s) {
    const w = words(), [d, b, m] = facesOf(s);
    const same = d.id === b.id;
    const who = same ? `${d.name} for headings and text` : `${d.name} for headings, ${b.name} for text`;
    const sample = { '-1': 'Small print, captions and footnotes', 0: w.p, 1: 'An opening line that leads in', 2: 'A smaller heading', 3: 'A section heading', 4: w.h };
    const rows = SCALE.slice().reverse().map(([n, role]) => {
      const px = stepPx(s, n), head = n >= 2;
      return `<div class="ty-row"><span class="ty-meta">${role}<b>${px}px</b></span><span class="${head ? 'ty-h' : 'ty-t'} ${n === 4 ? '' : 'ty-one'}" style="font-size:${px}px">${esc(sample[n])}</span></div>`;
    }).join('');
    const lost = [d, b, m].filter(missing);
    const p = pal();
    el.innerHTML = `<div class="ty ty-sheet${p.cls || lt()}" style="${varsCss(vars(s))};${p.css}">`
      + `<p class="ty-meta ty-who">${esc(who)}, ${m.id === 'sysmono' ? 'the device’s own code lettering' : esc(m.name) + ' for code'}</p>`
      + (lost.length ? `<p class="ty-warnline">${esc(list(lost.map((f) => f.name)))} did not load, so a stand-in face is showing in ${lost.length > 1 ? 'their' : 'its'} place.</p>` : '')
      + `<section><h4 class="ty-meta ty-sec">Sizes, from page title to small print</h4>${rows}</section>`
      + `<section><h4 class="ty-meta ty-sec">A paragraph at this line length</h4>${H('How it reads', stepPx(s, 2))}`
      + `<p class="ty-t ty-read ty-gap" style="font-size:${s.size}px">${esc(w.p)}</p><p class="ty-t ty-read ty-gap" style="font-size:${s.size}px">${esc(STAND.more)}</p></section>`
      + `<section class="ty-split"><div><h4 class="ty-meta ty-sec">Labels</h4>`
      + `<span class="ty-lbl ty-t" style="font-size:${r1(s.size * 0.75)}px">${esc(CX.eyebrow || 'What’s new')}</span>`
      + `<p class="ty-t ty-strong" style="font-size:${r1(s.size * 0.875)}px">${esc(CX.field || 'Email address')}</p>`
      + `<p class="ty-t ty-faint" style="font-size:${stepPx(s, -1)}px">${esc(CX.hint || 'Used only to sign you in.')}</p></div>`
      + `<div><h4 class="ty-meta ty-sec">Numbers</h4><table class="ty-t ty-table" style="font-size:${s.size}px"><tr><th>Plan</th><th>Seats</th><th>Per month</th></tr>`
      + '<tr><td>Starter</td><td>3</td><td>£12.00</td></tr><tr><td>Team</td><td>18</td><td>£141.50</td></tr><tr><td>Business</td><td>120</td><td>£1,011.90</td></tr></table></div></section>'
      + `<section><h4 class="ty-meta ty-sec">Code</h4><pre class="ty-c ty-pre" style="font-size:${r1(s.size * 0.875)}px">${esc(CX.code || STAND.code + '\nnpm run dev')}</pre></section></div>`;
  }

  /* ---- what other studios and the example page use ---- */
  function scene(s) {
    const [d, b, m] = facesOf(s);
    [d, b, m].forEach(need);
    return { vars: {
      '--sc-display': d.stack, '--sc-body': b.stack, '--sc-mono': m.stack, '--sc-size': s.size + 'px', '--sc-ratio': s.ratio,
      '--sc-lh': s.lh, '--sc-hlh': s.hlh, '--sc-htrack': s.htrack, '--sc-hweight': s.hweight, '--sc-bweight': s.bweight,
      '--sc-hcase': s.hcase, '--sc-measure': s.measure, '--sc-num': s.num,
    } };
  }
  function share(s) {
    const [d, b, m] = facesOf(s);
    [d, b, m].forEach(need);
    return { fonts: { ui: b.stack, display: d.stack, body: b.stack, mono: m.stack } };
  }

  /* ---- checks and the proposal ---- */
  const hasWeight = (f, wt) => !f.weights || f.weights.includes(+wt);
  function warn(s) {
    const out = [], [d, b, m] = facesOf(s);
    const seen = new Set();
    [[d, 'display'], [b, 'body'], [m, 'mono']].forEach(([f, k]) => {
      if (!missing(f) || seen.has(f.id)) return;
      seen.add(f.id);
      out.push({ k, t: `${f.name} did not load here (no internet connection, or it was blocked), so the preview is showing a stand-in face in its place. What you see is not ${f.name}.` });
    });
    if (s.size < 14) out.push({ k: 'size', t: `Text at ${s.size}px is small to read for many people. 16px is the usual size for reading on screens.` });
    else if (s.size < 16) out.push({ k: 'size', soft: true, t: `Text at ${s.size}px is a little small for long reading. It suits dense tools; on a phone, fields under 16px make the page zoom when tapped.` });
    const tiny = stepPx(s, -1);
    if (tiny < 12) out.push({ k: 'ratio', soft: true, t: `Small print comes out at ${tiny}px, which is hard to read. A larger text size or gentler steps would lift it.` });
    if (s.measure > 80) out.push({ k: 'measure', t: `Lines of about ${s.measure} letters are long; the eye loses its place on the way back to the start of the next line. 45 to 75 is comfortable.` });
    else if (s.measure < 40) out.push({ k: 'measure', soft: true, t: `Lines of about ${s.measure} letters are short, so paragraphs break into many lines and the reading feels choppy.` });
    if (s.lh < 1.35) out.push({ k: 'lh', t: `Lines of text sit close together (${s.lh} times the text size). About 1.5 is comfortable for reading.` });
    if (s.hcase === 'uppercase' && s.htrack < 0.02) out.push({ k: 'htrack', soft: true, t: 'Capitals with no extra space between letters look cramped. A little more space helps them read.' });
    if (s.hcase !== 'uppercase' && s.htrack > 0.06) out.push({ k: 'htrack', soft: true, t: 'Lower-case headings with wide space between letters fall apart into separate letters.' });
    if (!hasWeight(d, s.hweight)) out.push({ k: 'hweight', soft: true, t: `${d.name} is not drawn at the heading thickness chosen, so the nearest thickness it has is shown.` });
    if (!hasWeight(b, s.bweight)) out.push({ k: 'bweight', soft: true, t: `${b.name} is not drawn at the text thickness chosen, so the nearest thickness it has is shown.` });
    return out;
  }
  function source(f) {
    if (f.kind === 'web') return `loads from Google Fonts, https://fonts.googleapis.com/css2?family=${f.google}&display=swap (or self-host the same files)`;
    if (f.kind === 'project') return 'the project’s own face, already set up';
    return 'built into each device, nothing to load; the exact face varies by device';
  }
  function notes(s) {
    const [d, b, m] = facesOf(s), out = [];
    const once = new Set();
    [['Headings', d], ['Text', b], ['Code', m]].forEach(([role, f]) => {
      out.push(`Typography, ${role.toLowerCase()} face: ${f.name}. font-family: ${f.stack}. ${once.has(f.id) ? 'Same face as above.' : cap(source(f)) + '.'}`);
      once.add(f.id);
    });
    out.push(`Typography sizes (text ${s.size}px, each step ${s.ratio} times the one below): ` + SCALE.map(([n, role]) => `${role.toLowerCase()} ${stepPx(s, n)}px (${rem(stepPx(s, n))})`).join(', ') + '. Use rem so text follows the reader’s own size setting.');
    out.push(`Typography setting: heading weight ${s.hweight}, text weight ${s.bweight}; line-height ${s.lh} for text, ${s.hlh} for headings; heading letter-spacing ${s.htrack}em; paragraph max-width ${s.measure}ch; heading text-transform ${s.hcase}; font-variant-numeric ${s.num}; text-wrap balance on headings and pretty on paragraphs.`);
    return out;
  }

  /* ---- controls ---- */
  const TILES = { display: { wide: true }, body: { wide: true }, mono: { wide: true }, size: { wide: true }, ratio: { wide: true }, lh: { wide: true }, hlh: { wide: true }, htrack: { wide: true }, measure: { wide: true }, hweight: { wide: true }, bweight: { wide: true }, hcase: { wide: true }, num: { wide: true } };
  const lostNote = (k) => (s) => { const f = face(s[k], k); return missing(f) ? `<b>${esc(f.name)} did not load.</b> The drawings are showing a stand-in face in its place, so they do not show ${esc(f.name)}. It needs an internet connection the first time.` : ''; };
  const groups = [
    { id: 'hface', t: 'Heading lettering', short: 'Headings', sec: 'Faces', why: 'The lettering for titles and headings. It sets the voice before anyone reads a word.', note: lostNote('display'),
      ctl: [ch('display', 'Lettering for headings', faceOpts('h'))] },
    { id: 'tface', t: 'Text lettering', short: 'Text', sec: 'Faces', why: 'The lettering for paragraphs, labels and everything people read at length. Easy reading first, character second.', note: lostNote('body'),
      ctl: [ch('body', 'Lettering for text', faceOpts('t'))] },
    { id: 'cface', extra: 1, t: 'Code lettering', short: 'Code', sec: 'Faces', why: 'Even-width lettering for commands, things to copy and code.', note: lostNote('mono'),
      ctl: [ch('mono', 'Lettering for code', faceOpts('c'))] },
    { id: 'size', t: 'Text size', sec: 'Size', why: 'How big the reading text is. Every other size is worked out from it.',
      ctl: [ch('size', 'Text size', [
        o(14, 'Small', 'Fits more on screen. Fine for busy tools, small for reading.'), o(15, 'Compact', 'A little tighter than usual.'),
        o(16, 'Standard', 'The usual size for reading on screens.'), o(17, 'Roomy', 'Slightly bigger and easier on the eyes.'),
        o(18, 'Large', 'Comfortable for long reading.'), o(20, 'Very large', 'Big and generous, like a well-made book or a landing page.')]),
      rg('size', 'Exact text size', 12, 24, 1, 'px', 'The reading text, in pixels.')] },
    { id: 'ratio', extra: 2, t: 'Size steps', short: 'Steps', sec: 'Size', why: 'How much bigger each heading is than the size below it. Small steps feel calm; big steps feel dramatic.',
      ctl: [ch('ratio', 'How much bigger headings get', [
        o(1.125, 'Gentle', 'Headings only a little bigger than text. Calm and compact.'), o(1.2, 'Clear', 'Easy to tell apart without shouting.'),
        o(1.25, 'Strong', 'A clear ladder from text up to the page title.'), o(1.333, 'Bold', 'Big headings with plenty of contrast.'),
        o(1.5, 'Dramatic', 'Very big titles. Made for landing pages and posters.')]),
      rg('ratio', 'Exact step', 1.067, 1.618, 0.001, '', 'Each size is the one below it times this number.')] },
    { id: 'lines', extra: 3, t: 'Space between lines', short: 'Between lines', sec: 'Spacing', why: 'Room between the lines of a paragraph, and between the lines of a heading. Text needs more room than big headings.',
      ctl: [ch('lh', 'Between lines of text', [
        o(1.35, 'Tight', 'Lines close together. Fits more, reads harder.'), o(1.55, 'Comfortable', 'The usual room for reading text.'),
        o(1.7, 'Airy', 'Extra room. Calm and easy over long reading.'), o(1.85, 'Very airy', 'Lots of air between lines.')]),
      ch('hlh', 'Between lines of headings', [
        o(1, 'Tight', 'The lines of a big heading almost touch. Punchy.'), o(1.1, 'Snug', 'Close, as headings usually are.'),
        o(1.2, 'Normal', 'A little room between heading lines.'), o(1.35, 'Open', 'Loose, closer to text.')]),
      rg('lh', 'Exact space between lines of text', 1.2, 2, 0.05, '', 'Times the text size.'),
      rg('hlh', 'Exact space between lines of headings', 0.85, 1.5, 0.05, '', 'Times the heading size.')] },
    { id: 'letters', extra: 4, t: 'Space between letters', short: 'Between letters', sec: 'Spacing', why: 'Pull heading letters closer for a tighter, bolder look, or spread them out for calm, and for capitals.',
      ctl: [ch('htrack', 'Space between letters in headings', [
        o(-0.04, 'Pulled in', 'Letters close together. Bold and modern at big sizes.'), o(-0.02, 'Slightly in', 'Just a touch tighter, as big headings usually want.'),
        o(0, 'As drawn', 'Exactly as the face was spaced by its designer.'), o(0.03, 'Slightly out', 'A little extra air between letters.'),
        o(0.08, 'Spaced out', 'Wide spacing. Suits capitals and calm, airy headings.')]),
      rg('htrack', 'Exact space between letters', -0.06, 0.15, 0.005, 'em', 'A share of the heading size; below zero pulls letters together.')] },
    { id: 'length', extra: 5, t: 'Line length', sec: 'Spacing', why: 'How many letters fit on one line of a paragraph before it wraps. Too long and the eye loses its place; too short and reading feels choppy.',
      ctl: [ch('measure', 'Line length', [
        o(45, 'Short', 'About 45 letters a line. Quick to read, like a newspaper column.'), o(55, 'Narrow', 'About 55 letters. Easy reading in a slim column.'), o(65, 'Medium', 'About 65 letters. Comfortable for most reading.'),
        o(75, 'Long', 'About 75 letters. The longest that still reads easily.'), o(85, 'Very long', 'About 85 letters. Hard to follow from one line to the next.')]),
      rg('measure', 'Exact line length', 30, 110, 1, ' letters', 'The most letters on one line of a paragraph.')] },
    { id: 'weight', t: 'Thickness', sec: 'Details', why: 'How heavy the letters are, for headings and for text.',
      note: (s) => { const f = face(s.display, 'display'); return f.weights && f.weights.length === 1 ? `${esc(f.name)} comes in one thickness only, so heading thickness makes no difference with it.` : ''; },
      ctl: [ch('hweight', 'Heading thickness', [
        o(300, 'Light', 'Thin, elegant strokes.'), o(400, 'Regular', 'The normal thickness of the face.'), o(500, 'Medium', 'A little firmer than regular.'),
        o(600, 'Firm', 'Clearly heavier than text. The usual for headings.'), o(700, 'Bold', 'Strong and confident.'), o(800, 'Heavy', 'Very thick. Loud at big sizes.')]),
      ch('bweight', 'Text thickness', [
        o(300, 'Light', 'Thin and airy. Needs a big size and strong contrast.'), o(400, 'Regular', 'The normal thickness. Easiest to read.'),
        o(500, 'Medium', 'A little heavier. Helps on dark backgrounds and small screens.')])] },
    { id: 'caps', extra: 6, t: 'Capitals', sec: 'Details', why: 'Whether headings appear as typed or in capitals.',
      ctl: [ch('hcase', 'Capitals in headings', [
        o('none', 'As written', 'Headings appear exactly as typed.'), o('uppercase', 'All capitals', 'Every letter a capital. Strong, but slower to read.'),
        o('capitalize', 'Every word capitalised', 'Each word starts with a capital, like a book title.')])] },
    { id: 'nums', extra: 7, t: 'Numbers', sec: 'Details', why: 'How figures sit in tables and in running text.',
      ctl: [ch('num', 'Numbers', [
        o('normal', 'As drawn', 'Figures as the face draws them. Some are narrower than others, so columns wander.'),
        o('tabular-nums', 'Lined up in columns', 'Every figure the same width, so prices and totals line up.'),
        o('oldstyle-nums', 'Old style', 'Some figures dip below the line, like small letters. Lovely in a paragraph, untidy in a table. Only where the face has them.')])] },
  ];
  /* Fewer extras: the three kinds of spacing are one step, capitals and numbers another. */
  const fold = (ids, into) => {
    const parts = ids.map((id) => groups.find((g) => g.id === id)).filter(Boolean);
    if (!parts.length) return;
    const at = groups.indexOf(parts[0]);
    groups.splice(at, 0, Object.assign({}, into, { ctl: parts.flatMap((g) => g.ctl) }));
    parts.forEach((g) => groups.splice(groups.indexOf(g), 1));
  };
  fold(['lines', 'letters', 'length'], { id: 'spacing', extra: 3, t: 'Spacing', sec: 'Spacing', why: 'Room between lines, between letters in headings, and how long a line of reading runs.' });
  fold(['caps', 'nums'], { id: 'details', extra: 4, t: 'Capitals and numbers', short: 'Capitals & numbers', sec: 'Details', why: 'Whether headings are set in capitals, and how figures sit in tables and text.' });

  const defaults = { display: 'system', body: 'system', mono: 'sysmono', size: 16, ratio: 1.25, hweight: 600, bweight: 400, lh: 1.55, hlh: 1.1, htrack: -0.02, measure: 65, hcase: 'none', num: 'normal' };
  const L = (id, n, d, f, size, ratio, hweight, bweight, lh, hlh, htrack, measure, hcase = 'none', num = 'normal') =>
    ({ id, n, d, patch: { display: f[0], body: f[1], mono: f[2], size, ratio, hweight, bweight, lh, hlh, htrack, measure, hcase, num } });
  const looks = [
    L('builtin', 'Built in', 'Each device’s own lettering throughout. Loads nothing and feels native everywhere.', ['system', 'system', 'sysmono'], 16, 1.25, 600, 400, 1.55, 1.1, -0.02, 65),
    L('modern', 'Quiet and modern', 'One clean face for everything, with tight headings and nothing to distract.', ['inter', 'inter', 'jetbrains'], 16, 1.25, 600, 400, 1.55, 1.1, -0.025, 65),
    L('editorial', 'Editorial', 'A slim, elegant serif for headlines over clean text, like a good magazine.', ['instrument', 'inter', 'plexmono'], 17, 1.333, 400, 400, 1.6, 1.05, -0.01, 62),
    L('bookish', 'Bookish', 'Serif throughout with generous spacing. Made for long reading.', ['newsreader', 'newsreader', 'plexmono'], 18, 1.25, 500, 400, 1.65, 1.15, -0.01, 64, 'none', 'oldstyle-nums'),
    L('technical', 'Technical', 'Engineered shapes, sturdy text and even-width accents. Feels like a tool for builders.', ['spacegrotesk', 'plexsans', 'jetbrains'], 15, 1.25, 500, 400, 1.55, 1.1, -0.02, 70, 'none', 'tabular-nums'),
    L('poster', 'Big and tight', 'Huge, heavy headings with the letters pulled close. Made to be noticed.', ['bricolage', 'dmsans', 'jetbrains'], 17, 1.5, 800, 400, 1.55, 0.95, -0.04, 60),
    L('friendly', 'Soft and friendly', 'Rounded letters and plenty of air. Warm and approachable.', ['nunito', 'nunito', 'sysmono'], 17, 1.25, 800, 400, 1.65, 1.15, -0.01, 62),
    L('dense', 'Compact for data', 'Small, even text, modest headings and figures that line up. For dashboards and busy tools.', ['plexsans', 'plexsans', 'plexmono'], 14, 1.125, 600, 400, 1.45, 1.2, -0.005, 75, 'none', 'tabular-nums'),
    L('classic', 'Classic and dressy', 'Strong-contrast serif headings over a calm reading serif. Formal and a little expensive.', ['playfair', 'sourceserif', 'plexmono'], 17, 1.333, 700, 400, 1.6, 1.1, -0.01, 64),
    L('warm', 'Warm character', 'A soft, old-fashioned serif for headings with friendly modern text.', ['fraunces', 'manrope', 'jetbrains'], 16, 1.333, 600, 400, 1.6, 1.08, -0.02, 64),
    L('capitals', 'Narrow capitals', 'Tall, narrow headings in capitals with extra space between letters. Confident and industrial.', ['narrow', 'system', 'sysmono'], 16, 1.333, 700, 400, 1.55, 1.05, 0.06, 65, 'uppercase', 'tabular-nums'),
    L('crisp', 'Crisp product', 'A sharp, slightly technical face at a compact size, like modern software.', ['geist', 'geist', 'jetbrains'], 15, 1.2, 600, 400, 1.5, 1.15, -0.03, 68),
  ];

  const clamp = (v, a, b, d) => (typeof v === 'number' && isFinite(v) ? Math.min(b, Math.max(a, v)) : d);
  function fix(s) {
    for (const k of ['display', 'body', 'mono']) if (!BY[s[k]] || !BY[s[k]].use.includes(ROLE[k])) s[k] = FIRST[k];
    s.size = clamp(s.size, 12, 24, 16);
    s.ratio = clamp(s.ratio, 1.067, 1.618, 1.25);
    s.lh = clamp(s.lh, 1.2, 2, 1.55);
    s.hlh = clamp(s.hlh, 0.85, 1.5, 1.15);
    s.htrack = clamp(s.htrack, -0.06, 0.15, 0);
    s.measure = clamp(s.measure, 30, 110, 65);
    s.hweight = clamp(s.hweight, 100, 900, 600);
    s.bweight = clamp(s.bweight, 100, 900, 400);
    if (!['none', 'uppercase', 'capitalize'].includes(s.hcase)) s.hcase = 'none';
    if (!['normal', 'tabular-nums', 'oldstyle-nums'].includes(s.num)) s.num = 'normal';
  }
  function pickType(s, c) {
    if (c.k === 'display') { const f = face(s.display); if (f.weights && f.weights.length === 1) s.hweight = f.weights[0]; }
    if (c.k === 'hcase') {
      if (s.hcase === 'uppercase' && s.htrack < 0.04) s.htrack = 0.06;
      else if (s.hcase !== 'uppercase' && s.htrack > 0.04) s.htrack = 0;
    }
  }
  function summary(s) {
    const l = looks.find((x) => Object.keys(x.patch).every((k) => sameValue(x.patch[k], s[k])));
    return l ? l.n : `${face(s.display).name} ${s.size}px`;
  }

  STUDIO.add({
    id: 'type', ground: true, name: 'Typography',
    title: () => 'lettering',

    defaults, today: T.today || {}, measured: !!T.measured,
    groups, keep: [],
    looks: T.measured ? looks : looks.filter((l) => l.id !== 'builtin'), // without a measured Today, Built in is the starting point
    fix, pick: pickType, vars, still, live, scene, share, warn, notes, summary,
    reach: [['system', 'The type styles', 'Change the shared text and heading styles, so every page built from them follows.'], ['area', 'Only the text shown', 'Set this lettering where you looked, and leave the rest of the product as it is.']],
    tile: (c) => TILES[c.k] || null,
    tall: () => true,
  });
}
