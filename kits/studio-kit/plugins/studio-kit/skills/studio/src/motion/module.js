/* ===== Motion module: how things move: timing, feel, arrival, order, response to touch, page changes and loading =====
   Every drawing is the same small scene (a card that arrives, rows that follow it, a button and a switch that answer
   touch, two pages that swap, something loading) so only the movement differs. A still tile is a frozen frame that
   still tells the options apart (a trail of positions, a ghost of where things start, a curve); pointing at it plays it.
   Movement is run with the Web Animations API so Less motion can replace it with a gentle fade instead of stopping it. */
{
  const T = Object.assign({ measured: false, today: {}, drop: [] }, P.motion || {});
  const SANS = 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  const clamp = (v, a, b, d) => (typeof v === 'number' && isFinite(v) ? Math.min(b, Math.max(a, v)) : d);
  const r1 = (x) => Math.round(x * 10) / 10;
  const lerp = (a, p) => a[0] + (a[1] - a[0]) * p;

  /* ---- how it feels: the curve a movement follows ---- */
  const bez = (x1, y1, x2, y2) => {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = (t) => ((ax * t + bx) * t + cx) * t, Y = (t) => ((ay * t + by) * t + cy) * t;
    return (x) => {
      if (x <= 0) return 0;
      if (x >= 1) return 1;
      let lo = 0, hi = 1, t = x;
      for (let i = 0; i < 32; i++) { const v = X(t); if (Math.abs(v - x) < 1e-5) break; if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; }
      return Y(t);
    };
  };
  const sample = (fn, n) => `linear(${Array.from({ length: n + 1 }, (_, i) => +fn(i / n).toFixed(3)).join(', ')})`;
  const bounceOut = (t) => {
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  };
  const springFn = (bounce) => {
    const z = Math.max(0.3, 1 - bounce / 100), wn = 6.5 / z;
    return (t) => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      if (z >= 0.999) return 1 - (1 + wn * t) * Math.exp(-wn * t);
      const wd = wn * Math.sqrt(1 - z * z);
      return 1 - Math.exp(-z * wn * t) * (Math.cos(wd * t) + (z * wn / wd) * Math.sin(wd * t));
    };
  };
  const CB = (id, n, d, a, b, c, e, over) => ({ id, n, d, css: `cubic-bezier(${a}, ${b}, ${c}, ${e})`, fn: bez(a, b, c, e), over: !!over });
  const EASES = [
    CB('out', 'Quick start, gentle stop', 'Sets off fast and settles softly. The one most interfaces use.', 0.2, 0.8, 0.2, 1),
    CB('ease', 'Everyday', 'The browser’s own standard: a little build-up, a soft landing.', 0.25, 0.1, 0.25, 1),
    CB('snappy', 'Snappy', 'Almost there at once, then a tiny glide to a stop. Feels instant and exact.', 0.05, 0.7, 0.1, 1),
    { id: 'even', n: 'Even', d: 'The same speed all the way. Right for loading bars, stiff for most else.', css: 'linear', fn: (t) => t, over: false },
    CB('inout', 'Slow at both ends', 'Eases away, speeds up, eases in. Calm, and a little cinematic.', 0.65, 0, 0.35, 1),
    CB('floaty', 'Floaty', 'A long, drifting stop. Soft and dreamy.', 0.4, 0, 0.1, 1),
    CB('in', 'Slow start, quick finish', 'Builds speed as it goes. Good for things leaving, odd for things arriving.', 0.4, 0, 1, 1),
    CB('overshoot', 'Overshoot', 'Goes a little too far, then settles back. Playful.', 0.34, 1.56, 0.64, 1, true),
    CB('anticipate', 'Wind up first', 'Pulls back a touch before going, so the movement feels intended.', 0.5, -0.4, 0.35, 1, true),
    { id: 'spring', n: 'Springy', d: 'Moves like a real spring. How bouncy is set under Extras.', over: true },
    { id: 'bouncy', n: 'Bounce', d: 'Lands and bounces like a dropped ball. Fun, and tiring fast.', css: sample(bounceOut, 60), fn: bounceOut, over: true },
  ];
  const EASE_BY = Object.fromEntries(EASES.map((e) => [e.id, e]));
  const springCache = {};
  function easeOf(s) {
    if (s.ease === 'spring') {
      const k = Math.round(s.bounce);
      return springCache[k] || (springCache[k] = { id: 'spring', n: 'Springy', fn: springFn(k), css: sample(springFn(k), 44), over: k > 0 });
    }
    return EASE_BY[s.ease] || EASE_BY.out;
  }
  const softOf = (e) => (e.over ? EASE_BY.out : e); // fades and colour never overshoot
  const timesOf = (s) => ({ dur: s.dur, fast: Math.max(60, Math.round(s.dur / 20) * 10), slow: Math.round(s.dur * 1.5 / 10) * 10 });

  /* ---- how things arrive: a pose is described by numbers, so one description draws a frozen frame and runs the movement ---- */
  const ENTER = {
    none: () => null,
    fade: () => ({ o: [0, 1] }),
    rise: (d) => ({ o: [0, 1], y: [d, 0] }),
    drop: (d) => ({ o: [0, 1], y: [-d, 0] }),
    slide: (d) => ({ o: [0, 1], x: [-d * 2, 0] }),
    scale: () => ({ o: [0, 1], sc: [0.86, 1] }),
    blur: () => ({ o: [0, 1], bl: [10, 0] }),
    tilt: (d) => ({ o: [0, 1], rx: [26, 0], y: [d * 0.5, 0] }),
    grow: (d) => ({ o: [0, 1], y: [d, 0], sc: [0.92, 1] }),
  };
  const ENTER_NAMES = {
    none: ['Appears at once', 'Nothing moves. It is simply there.'],
    fade: ['Fade in', 'Fades up from nothing. Nothing travels.'],
    rise: ['Rise', 'Floats up a little as it fades in. The everyday choice.'],
    drop: ['Drop in', 'Comes down from above, like a notification.'],
    slide: ['Slide in', 'Arrives from the left side.'],
    scale: ['Grow', 'Starts a little small and grows into place.'],
    blur: ['Come into focus', 'Starts soft and blurred, then sharpens.'],
    tilt: ['Tilt up', 'Leans back like a card and tips up into place.'],
    grow: ['Rise and grow', 'Floats up while growing a little. Lively.'],
  };
  const STYLE = (d, p) => {
    d = d || {};
    const pp = d.w ? clamp((p - d.w[0]) / (d.w[1] - d.w[0]), 0, 1.5) : p;
    const at = (a, dflt) => (a ? lerp(a, pp) : dflt);
    return {
      opacity: clamp(at(d.o, 1), 0, 1),
      transform: `perspective(600px) translate(${r1(at(d.x, 0))}${d.u || 'px'}, ${r1(at(d.y, 0))}px) scale(${+at(d.sc, 1).toFixed(3)}) rotateX(${r1(at(d.rx, 0))}deg)`,
      filter: `blur(${Math.max(0, r1(at(d.bl, 0)))}px)`,
    };
  };
  const sty = (d, p) => { const o = STYLE(d, p); return `opacity:${o.opacity};transform:${o.transform};filter:${o.filter}`; };
  const fadeOnly = (d) => (d ? { o: d.o || [0, 1], w: d.w } : { o: [0, 1] });
  const enterDesc = (s, rm) => {
    const d = ENTER[s.enter] ? ENTER[s.enter](s.dist) : null;
    if (rm === 'fade') return fadeOnly(d || { o: [0, 1] });
    if (rm === 'none') return null;
    return d;
  };
  const enterCap = (s) => {
    const d = s.dist;
    return ({
      none: 'Appears at once', fade: 'Fades in, nothing travels', rise: d ? `Rises ${d} px as it fades in` : 'Fades in',
      drop: d ? `Drops ${d} px as it fades in` : 'Fades in', slide: d ? `Slides ${d * 2} px in from the left` : 'Fades in',
      scale: 'Grows from 86% size', blur: 'Clears from a blur', tilt: 'Tips up into place', grow: d ? `Rises ${d} px and grows` : 'Grows a little',
    })[s.enter] || '';
  };

  /* ---- one after another ---- */
  const SEQ = [
    ['together', 'All at once', 'Everything arrives together. Fast and tidy, with nothing to follow.', 0, 'top'],
    ['quick', 'Quick ripple', 'Each row a beat after the one above. Barely noticed, and it makes a list feel alive.', 40, 'top'],
    ['cascade', 'Cascade', 'A clear, steady top-to-bottom reveal. Easy to follow.', 80, 'top'],
    ['slow', 'Slow reveal', 'One at a time with room between. Theatrical; use it sparingly.', 140, 'top'],
    ['bottom', 'Bottom up', 'Starts at the bottom and rises through the list.', 60, 'bottom'],
    ['centre', 'From the middle', 'The middle first, spreading out to both ends.', 60, 'centre'],
    ['edges', 'From the ends in', 'The first and last rows first, closing in on the middle.', 60, 'edges'],
  ];
  const SEQ_BY = Object.fromEntries(SEQ.map((x) => [x[0], x]));
  const delays = (n, seq, st) => {
    const order = (SEQ_BY[seq] || SEQ_BY.quick)[4], mid = (n - 1) / 2;
    return Array.from({ length: n }, (_, i) => Math.round(st * (seq === 'together' ? 0 : order === 'top' ? i : order === 'bottom' ? n - 1 - i : order === 'centre' ? Math.abs(i - mid) : mid - Math.abs(i - mid))));
  };

  /* ---- response to touch ---- */
  const BASE_SH = '0 1px 2px rgba(0,0,0,.28)';
  const GLOW = (a) => `0 0 0 ${a}px color-mix(in srgb, var(--mo-fill) 32%, transparent), 0 0 24px color-mix(in srgb, var(--mo-fill) 50%, transparent)`;
  const rest = { t: 'none', s: BASE_SH, f: 'none' };
  const PRESS = {
    none: { n: 'No response', d: 'It does not change when pointed at or pressed.', h: rest, d_: rest },
    lift: { n: 'Lifts', d: 'Rises a little with a deeper shadow when pointed at; settles back when pressed.', h: { t: 'translateY(-3px)', s: '0 8px 16px rgba(0,0,0,.34)', f: 'none' }, d_: { t: 'translateY(0)', s: BASE_SH, f: 'none' } },
    press: { n: 'Presses in', d: 'Brightens when pointed at and shrinks a little when pressed.', h: { t: 'none', s: BASE_SH, f: 'brightness(1.1)' }, d_: { t: 'scale(.94)', s: BASE_SH, f: 'brightness(.94)' } },
    liftpress: { n: 'Lifts, then presses in', d: 'Rises when pointed at, presses down when pressed. Feels like a real key.', h: { t: 'translateY(-3px)', s: '0 8px 16px rgba(0,0,0,.34)', f: 'none' }, d_: { t: 'translateY(0) scale(.96)', s: BASE_SH, f: 'brightness(.95)' } },
    sink: { n: 'Sinks', d: 'Dips and darkens inside when pressed, like a physical button.', h: { t: 'none', s: BASE_SH, f: 'brightness(1.06)' }, d_: { t: 'translateY(2px)', s: 'inset 0 2px 5px rgba(0,0,0,.4)', f: 'brightness(.92)' } },
    glow: { n: 'Soft glow', d: 'A halo of its own colour appears when pointed at. Nothing moves.', h: { t: 'none', s: GLOW(4), f: 'none' }, d_: { t: 'none', s: GLOW(2), f: 'brightness(.96)' } },
    squash: { n: 'Squash and stretch', d: 'Squashes flat when pressed and springs back. Cartoonish and fun.', h: { t: 'scale(1.03)', s: BASE_SH, f: 'none' }, d_: { t: 'scale(1.09, .88)', s: BASE_SH, f: 'none' } },
    grow: { n: 'Grows', d: 'Swells a little when pointed at, settles when pressed.', h: { t: 'scale(1.07)', s: '0 4px 10px rgba(0,0,0,.3)', f: 'none' }, d_: { t: 'scale(1.02)', s: BASE_SH, f: 'none' } },
  };
  const pressPose = (kind, which, rm) => {
    const p = (PRESS[kind] || PRESS.none)[which === 'h' ? 'h' : which === 'd' ? 'd_' : null] || rest;
    if (rm) return { t: 'none', s: BASE_SH, f: kind === 'none' ? 'none' : which === 'd' ? 'brightness(.9)' : 'brightness(1.1)' };
    return p;
  };
  const poseCss = (p) => `transform:${p.t};box-shadow:${p.s};filter:${p.f}`;

  /* ---- page changes ---- */
  const PAGE = {
    none: { n: 'Instant swap', d: 'The new page is simply there. Fastest, and nothing to look at.' },
    fade: { n: 'Crossfade', d: 'The old page fades out as the new one fades in. Safe everywhere.', x: { o: [1, 0] }, y: { o: [0, 1] } },
    dip: { n: 'Fade through', d: 'The old page leaves, then the new one arrives. Clean and calm.', x: { o: [1, 0], w: [0, 0.45] }, y: { o: [0, 1], w: [0.55, 1] } },
    slide: { n: 'Slide over', d: 'The new page slides in from the right over the old one.', x: { o: [1, 0.55] }, y: { x: [100, 0], u: '%' } },
    push: { n: 'Push', d: 'The old page is pushed out as the new one arrives. Gives a clear sense of direction.', x: { x: [0, -100], u: '%' }, y: { x: [100, 0], u: '%' } },
    rise: { n: 'Rise over', d: 'The new page floats up over the old one as it fades in.', x: { o: [1, 0] }, y: { y: [28, 0], o: [0, 1] } },
    scale: { n: 'Zoom through', d: 'The old page swells away as the new one settles in from slightly small.', x: { sc: [1, 1.06], o: [1, 0] }, y: { sc: [0.94, 1], o: [0, 1] } },
    shared: { n: 'Shared element', d: 'The picture at the top glides from one page to the other while the rest fades.', x: { o: [1, 0], w: [0, 0.6] }, y: { o: [0, 1], w: [0.4, 1] } },
  };

  /* ---- loading ---- */
  const LOAD = {
    shimmer: ['Shimmer', 'Grey placeholder lines with a soft light sweeping across. Familiar and calm.'],
    pulse: ['Pulse', 'The placeholder lines fade gently in and out.'],
    spinner: ['Spinner', 'A small ring turns while the content loads.'],
    dots: ['Dots', 'Three dots swell in turn.'],
    bar: ['Progress bar', 'A bar sweeps back and forth along the top.'],
    none: ['Plain words', 'Just the word Loading. No animation.'],
  };

  /* ---- the project's colours and fonts, else the stage's ---- */
  const lt = () => { try { return bgLight(); } catch { return false; } };
  // goes inside style="...": a font name in double quotes would end the attribute and drop every colour after it
  const pal = () => palCss().replace(/"/g, "'");
  function palCss() {
    const R = shared('roles'), F = shared('fonts');
    const [, H, C, Lb] = Array.isArray(P.brand) ? P.brand : [0, 255, 0.17, 0.64];
    const brand = `oklch(${Lb} ${C} ${H})`;
    const font = `font-family:${(F && F.body) || P.font || SANS};`;
    if (R) return `${font}--mo-surf:${R.surface};--mo-line:${R.line};--mo-text:${R.text};--mo-text2:${R.text2};--mo-acc:${R.accent};--mo-fill:${R.fill};--mo-on:${R['on-fill']}`;
    return lt()
      ? `${font}--mo-surf:#ffffff;--mo-line:#d5dbe0;--mo-text:#14181a;--mo-text2:#566068;--mo-acc:${brand};--mo-fill:${brand};--mo-on:#ffffff`
      : `${font}--mo-surf:#1b2025;--mo-line:#323a41;--mo-text:#eef1f3;--mo-text2:#a3adb4;--mo-acc:${brand};--mo-fill:${brand};--mo-on:#ffffff`;
  }

  /* ---- what the drawings read from a state ---- */
  const rmNow = (s) => (V.rm ? s.reduce : '');
  function params(s, rm) {
    const t = timesOf(s), e = easeOf(s);
    return { dur: t.dur, fast: t.fast, slow: t.slow, ease: e.css, soft: softOf(e).css, enter: s.enter, dist: s.dist, seq: s.seq, stagger: s.stagger, press: s.press, page: s.page, load: s.load, rm: rm == null ? rmNow(s) : rm };
  }
  const pdata = (s, rm) => esc(JSON.stringify(params(s, rm)));
  const pressVars = (s, rm) => {
    const h = pressPose(s.press, 'h', rm), d = pressPose(s.press, 'd', rm);
    return `--mo-h-t:${h.t};--mo-h-s:${h.s};--mo-h-f:${h.f};--mo-d-t:${d.t};--mo-d-s:${d.s};--mo-d-f:${d.f}`;
  };
  function vars(s) {
    const t = timesOf(s), e = easeOf(s);
    return { '--mo-dur': t.dur + 'ms', '--mo-fast': t.fast + 'ms', '--mo-slow': t.slow + 'ms', '--mo-ease': e.css, '--mo-soft': softOf(e).css };
  }
  const lift = (s) => ((PRESS[s.press] || PRESS.none).h.t.startsWith('translateY(-') ? 3 : 0);

  /* ---- drawing parts ---- */
  const curve = (fn) => {
    const pts = [];
    for (let i = 0; i <= 48; i++) { const t = i / 48, y = Math.max(2, Math.min(62, 52 - fn(t) * 40)); pts.push(`${i ? 'L' : 'M'}${r1(6 + t * 52)} ${r1(y)}`); }
    return `<svg class="mo-cv" viewBox="0 0 64 64" aria-hidden="true"><path class="g" d="M6 52H58M6 12H58"/><path class="c" d="${pts.join('')}"/></svg>`;
  };
  const TRK = 104;
  const strobe = (fn) => Array.from({ length: 7 }, (_, k) => `<i class="mo-sd" style="transform:translateX(${r1(fn(k / 6) * TRK)}px);opacity:${r1(0.18 + 0.62 * k / 6)}"></i>`).join('');
  const track = (fn, x) => `<div class="mo-trk">${fn ? strobe(fn) : ''}<i class="mo-end" style="left:${x}px"></i><i class="mo-dot" data-a="dot" data-x="${x}"></i></div>`;
  const cardBits = '<b class="mo-l1"></b><u class="mo-l2"></u><u class="mo-l3"></u>';
  const ghosts = (s, d) => (d ? `<i class="mo-gh g2" style="${sty(d, 0.5)};opacity:.22"></i><i class="mo-gh" style="${sty(d, 0)};opacity:${s.enter === 'fade' || d.o && !d.x && !d.y && !d.sc && !d.bl && !d.rx ? 0.5 : 0.7}"></i>` : '');
  const box = (s, d) => `<div class="mo-box">${ghosts(s, d)}<div class="mo-mc" data-a="enter" data-i="0" data-n="1" data-base="0">${cardBits}</div></div>`;
  const btnHTML = (s, pose, label) => `<span class="mo-btn" ${pose ? `style="${poseCss(pose)}"` : ''}>${esc(label || 'Save')}</span>`;
  const rows = (n, extra) => Array.from({ length: n }, (_, i) => `<i class="mo-rw" data-a="enter" data-i="${i}" data-n="${n}" data-base="${extra || 0}"><b></b></i>`).join('');

  function pagesHTML(cur, kind, p) {
    const pane = (k, w, extra) => `<div class="mo-pg${k === cur ? ' cur' : ''}" data-k="${k}" style="${extra || ''}"><i class="mo-hero ${k === 'a' ? 'small' : 'wide'}"></i><b class="mo-l1"></b><u class="mo-l2"></u><u class="mo-l3"></u></div>`;
    if (p == null) return `<div class="mo-pages" data-a="pages" data-cur="${cur}">${pane('a')}${pane('b')}</div>`;
    const D = PAGE[kind] || PAGE.none, x = D.x || { o: [1, 0] }, y = D.y || { o: [0, 1] };
    if (!D.x) return `<div class="mo-pages static"><div class="mo-pg" style="visibility:visible"><i class="mo-hero wide"></i><b class="mo-l1"></b><u class="mo-l2"></u></div></div>`;
    const sA = sty(x, p), sB = sty(y, p);
    return `<div class="mo-pages static"><div class="mo-pg" style="visibility:visible;${sA}"><i class="mo-hero small"></i><b class="mo-l1"></b><u class="mo-l2"></u><u class="mo-l3"></u></div>`
      + `<div class="mo-pg now" style="visibility:visible;${sB}"><i class="mo-hero wide"></i><b class="mo-l1"></b><u class="mo-l2"></u><u class="mo-l3"></u></div></div>`;
  }
  const loadHTML = (kind) => {
    const lines = `<i class="mo-sk" style="width:86%">${kind === 'shimmer' ? '<b class="mo-band"></b>' : ''}</i><i class="mo-sk" style="width:64%">${kind === 'shimmer' ? '<b class="mo-band"></b>' : ''}</i><i class="mo-sk" style="width:74%">${kind === 'shimmer' ? '<b class="mo-band"></b>' : ''}</i>`;
    const body = kind === 'spinner' ? '<span class="mo-spin"><svg class="mo-ring" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" class="t"/><path d="M12 3a9 9 0 0 1 9 9" class="a"/></svg><span>Loading</span></span>'
      : kind === 'dots' ? '<span class="mo-spin"><i class="mo-ld"></i><i class="mo-ld"></i><i class="mo-ld"></i></span>'
        : kind === 'bar' ? `<i class="mo-prog"><b class="mo-sweep" style="left:18%"></b></i>${lines}`
          : kind === 'none' ? '<span class="mo-spin"><span>Loading…</span></span>' : lines;
    return `<div class="mo-load k-${kind}" data-a="load" data-kind="${kind}">${body}</div>`;
  };

  /* ---- running the movement ---- */
  const kfLoop = (from, to, dur, delay, T, ease) => {
    const kf = [Object.assign({ offset: 0 }, from)];
    if (delay > 0) { kf.push(Object.assign({ offset: delay / T }, from)); kf[kf.length - 1].easing = ease; } else kf[0].easing = ease;
    kf.push(Object.assign({ offset: (delay + dur) / T }, to), Object.assign({ offset: 1 }, to));
    return kf;
  };
  const NONE_STYLE = { opacity: 1, transform: 'none', filter: 'none' };
  function stop(root) {
    (root._anims || []).forEach((a) => { try { a.cancel(); } catch {} });
    root._anims = [];
    clearTimeout(root._t); clearTimeout(root._tf);
    const pg = root.querySelector('[data-a=pages]');
    if (pg) { pg._busy = false; pg.querySelectorAll('.mo-morph').forEach((m) => m.remove()); pg.querySelectorAll('.mo-pg').forEach((e) => { e.style.cssText = ''; }); }
  }
  /** Plays everything a drawing moves. loop: tiles and cards repeat while pointed at; the live preview plays its arrival once. */
  function play(root, loop) {
    stop(root);
    let p;
    try { p = JSON.parse(root.dataset.p); } catch { return; }
    const A = (el, kf, opt) => { try { const a = el.animate(kf, opt); root._anims.push(a); return a; } catch { return null; } };
    const rm = p.rm, fade = rm === 'fade';
    const esoft = p.soft;
    const HOLD = 900;

    /* things arriving */
    const els = [...root.querySelectorAll('[data-a=enter]')];
    const d = enterDesc(p, rm);
    if (d) {
      const dur = fade ? clamp(p.dur, 140, 260) : p.dur, ease = fade ? esoft : p.ease;
      const groups = {};
      els.forEach((el) => { const n = +el.dataset.n || 1; (groups[n] = groups[n] || []).push(el); });
      let T = 0;
      const plan = els.map((el) => {
        const n = +el.dataset.n || 1, i = +el.dataset.i || 0, base = +el.dataset.base || 0;
        const dl = base + (fade ? 0 : delays(n, p.seq, p.stagger)[i]);
        T = Math.max(T, dl + dur);
        return [el, dl];
      });
      T += HOLD;
      plan.forEach(([el, dl]) => {
        const from = STYLE(d, 0), to = STYLE(d, 1);
        if (loop) A(el, kfLoop(from, NONE_STYLE, dur, dl, T, ease), { duration: T, iterations: Infinity });
        else A(el, [from, NONE_STYLE], { duration: dur, delay: dl, easing: ease, fill: 'backwards' });
      });
    }

    /* a dot travelling along a track, there and back */
    root.querySelectorAll('[data-a=dot]').forEach((el) => {
      const x = +el.dataset.x, dur = rm === 'none' ? 1 : p.dur, ease = fade ? esoft : p.ease, T = 2 * dur + 1300;
      const kf = [{ transform: 'translateX(0)', offset: 0, easing: ease }, { transform: `translateX(${x}px)`, offset: dur / T }, { transform: `translateX(${x}px)`, offset: (dur + 650) / T, easing: ease }, { transform: 'translateX(0)', offset: (2 * dur + 650) / T }, { transform: 'translateX(0)', offset: 1 }];
      A(el, kf, { duration: T, iterations: Infinity });
    });

    /* a button answering a hover and a press */
    root.querySelectorAll('[data-a=btn]').forEach((el) => {
      const f = p.fast, h = pressPose(p.press, 'h', rm), dn = pressPose(p.press, 'd', rm), r = rest;
      const fr = (q, off, easing) => Object.assign({ transform: q.t, boxShadow: q.s, filter: q.f, offset: off }, easing ? { easing } : {});
      const down = Math.round(f * 0.6), t1 = f, t2 = t1 + 420, t3 = t2 + down, t4 = t3 + 220, t5 = t4 + f, T = t5 + 700;
      const e = p.ease;
      A(el, [fr(r, 0, e), fr(h, t1 / T), fr(h, t2 / T, e), fr(dn, t3 / T), fr(dn, t4 / T, e), fr(r, t5 / T), fr(r, 1)], { duration: T, iterations: Infinity });
    });

    /* two pages swapping, over and over */
    const pg = root.querySelector('.mo-pages[data-a=pages]');
    if (pg && loop) {
      const tick = () => { pageGo(root, () => { root._t = setTimeout(tick, 900); }); };
      root._t = setTimeout(tick, 500);
    }

    /* loading */
    root.querySelectorAll('[data-a=load]').forEach((el) => {
      const kind = el.dataset.kind;
      if (kind === 'none' || rm === 'none') return;
      const inf = { iterations: Infinity };
      if (rm) { A(el, [{ opacity: 0.45 }, { opacity: 1 }], Object.assign({ duration: 1600, direction: 'alternate', easing: 'ease-in-out' }, inf)); return; }
      if (kind === 'shimmer') el.querySelectorAll('.mo-band').forEach((b) => A(b, [{ transform: 'translateX(-110%)' }, { transform: 'translateX(300%)' }], Object.assign({ duration: 1500, easing: 'ease-in-out' }, inf)));
      else if (kind === 'pulse') el.querySelectorAll('.mo-sk').forEach((b) => A(b, [{ opacity: 0.4 }, { opacity: 1 }], Object.assign({ duration: 950, direction: 'alternate', easing: 'ease-in-out' }, inf)));
      else if (kind === 'spinner') el.querySelectorAll('.mo-ring').forEach((b) => A(b, [{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], Object.assign({ duration: 900, easing: 'linear' }, inf)));
      else if (kind === 'dots') el.querySelectorAll('.mo-ld').forEach((b, i) => A(b, [{ transform: 'scale(.5)', opacity: 0.35 }, { transform: 'scale(1)', opacity: 1 }], Object.assign({ duration: 500, direction: 'alternate', easing: 'ease-in-out', delay: i * 170 }, inf)));
      else if (kind === 'bar') el.querySelectorAll('.mo-sweep').forEach((b) => A(b, [{ transform: 'translateX(-100%)' }, { transform: 'translateX(330%)' }], Object.assign({ duration: 1200, easing: 'ease-in-out' }, inf)));
    });
  }

  /** One swap between the two pages, with the chosen kind of change. */
  function pageGo(root, done) {
    const pg = root.querySelector('.mo-pages[data-a=pages]');
    if (!pg || pg._busy) return;
    let p; try { p = JSON.parse(root.dataset.p); } catch { return; }
    root._anims = root._anims || [];
    const cur = pg.dataset.cur || 'a', next = cur === 'a' ? 'b' : 'a';
    const X = pg.querySelector(`[data-k=${cur}]`), Y = pg.querySelector(`[data-k=${next}]`);
    const finish = () => {
      pg._busy = false;
      pg.dataset.cur = next;
      X.classList.remove('cur'); Y.classList.add('cur');
      [X, Y].forEach((e) => { e.getAnimations().forEach((a) => a.cancel()); e.style.cssText = ''; });
      pg.querySelectorAll('.mo-morph').forEach((m) => m.remove());
      pg.querySelectorAll('.mo-hero').forEach((h) => { h.style.visibility = ''; });
      if (done) done();
    };
    const rm = p.rm, kind = rm === 'none' || p.page === 'none' ? 'none' : rm === 'fade' && !['fade', 'dip'].includes(p.page) ? 'fade' : p.page;
    if (kind === 'none') { finish(); return; }
    const dur = rm ? clamp(p.slow, 160, 300) : p.slow, ease = rm || kind === 'fade' || kind === 'dip' || kind === 'scale' ? p.soft : p.ease;
    const D = PAGE[kind];
    pg._busy = true;
    X.style.visibility = Y.style.visibility = 'visible';
    X.style.zIndex = 1; Y.style.zIndex = 2;
    const run = (el, desc) => {
      const from = STYLE(desc, 0), to = STYLE(desc, 1);
      const kf = desc.w ? [Object.assign({ offset: 0 }, from), Object.assign({ offset: desc.w[0] }, from, { easing: ease }), Object.assign({ offset: desc.w[1] }, to), Object.assign({ offset: 1 }, to)] : [from, to];
      const a = el.animate(kf, Object.assign({ duration: dur, fill: 'both' }, desc.w ? {} : { easing: ease }));
      root._anims.push(a);
      return a;
    };
    run(X, D.x);
    const last = run(Y, D.y);
    if (kind === 'shared') {
      const hx = X.querySelector('.mo-hero'), hy = Y.querySelector('.mo-hero');
      const rect = (pane, h) => ({ l: pane.offsetLeft + h.offsetLeft, t: pane.offsetTop + h.offsetTop, w: h.offsetWidth, h: h.offsetHeight });
      const a = rect(X, hx), b = rect(Y, hy), g = document.createElement('i');
      g.className = 'mo-morph';
      g.style.cssText = `left:${a.l}px;top:${a.t}px;width:${a.w}px;height:${a.h}px`;
      pg.appendChild(g);
      hx.style.visibility = hy.style.visibility = 'hidden';
      root._anims.push(g.animate([{ left: a.l + 'px', top: a.t + 'px', width: a.w + 'px', height: a.h + 'px' }, { left: b.l + 'px', top: b.t + 'px', width: b.w + 'px', height: b.h + 'px' }], { duration: dur, easing: p.ease, fill: 'both' }));
    }
    last.onfinish = finish;
    root._tf = setTimeout(() => { if (pg._busy && pg.dataset.cur === cur) finish(); }, dur + 250);
    last.oncancel = () => { pg._busy = false; };
  }

  /* ---- the tiles ---- */
  const TRAVEL = ['rise', 'drop', 'slide', 'tilt', 'grow'];
  function tileArt(s, k) {
    const e = easeOf(s), rm = rmNow(s);
    const wrap = (inner, st = s, rmv = rmNow(st)) => `<div class="mo mo-t" data-p="${pdata(st, rmv)}" style="${pal()};${pressVars(st, rmv)}">${inner}</div>`;
    switch (k) {
      case 'bounce': {
        const t = Object.assign({}, s, { ease: 'spring' }), q = easeOf(t);
        return wrap(`<div class="mo-l">${track(q.fn, TRK)}<span class="mo-cap">${Math.round(s.bounce)}% bounce</span></div>${curve(q.fn)}`, t);
      }
      case 'dur': {
        const w = Math.min(100, s.dur / 750 * 100);
        return wrap(`<div class="mo-sp"><b class="mo-ms">${s.dur}<small> ms</small></b><i class="mo-bar"><u style="width:${r1(w)}%"></u></i>${track(null, 150)}</div>`);
      }
      case 'enter': {
        const cap = rm === 'none' ? 'Appears at once' : rm === 'fade' ? 'Fades in; nothing travels' : enterCap(s);
        return wrap(`${box(s, enterDesc(s, rm))}<div class="mo-r"><span class="mo-cap big">${esc(cap)}</span></div>`);
      }
      case 'dist': {
        const t = TRAVEL.includes(s.enter) ? s : Object.assign({}, s, { enter: 'rise' });
        return wrap(`${box(t, enterDesc(t, rm === 'none' ? '' : rm))}<div class="mo-r"><span class="mo-cap big">${t.dist} px of travel</span><i class="mo-ruler" style="height:${Math.max(2, Math.min(56, t.dist))}px"></i></div>`, t);
      }
      case 'reduce': {
        const t = s.enter === 'none' ? Object.assign({}, s, { enter: 'rise' }) : s;
        return wrap(`${box(t, s.reduce === 'fade' ? { o: [0, 1] } : null)}<div class="mo-r"><span class="mo-cap big">${s.reduce === 'fade' ? 'Fades in; nothing travels' : 'Appears at once'}</span></div>`, t, s.reduce);
      }
      case 'seq': {
        const dl = delays(4, s.seq, s.stagger), total = Math.max(400, Math.max(...dl) + s.dur), sc = 108 / total;
        const bars = dl.map((x, i) => `<i style="top:${4 + i * 11}px;width:${r1(Math.max(4, s.dur * sc))}px;transform:translateX(${r1(x * sc)}px)"></i>`).join('');
        return wrap(`<div class="mo-rws">${rows(4)}</div><div class="mo-r"><span class="mo-gantt" aria-hidden="true">${bars}</span><span class="mo-cap">${s.seq === 'together' ? 'All start together' : s.stagger + ' ms between rows'}</span></div>`);
      }
      case 'press':
        return wrap(`<div class="mo-pb"><span class="mo-btn" data-a="btn">Save</span></div><div class="mo-r mo-poses"><span><i>Pointed at</i>${btnHTML(s, pressPose(s.press, 'h', rm))}</span><span><i>Pressed</i>${btnHTML(s, pressPose(s.press, 'd', rm))}</span></div>`);
      case 'page':
        return wrap(`${pagesHTML('a', s.page, 0.5)}<div class="mo-r"><span class="mo-cap big">${esc((PAGE[s.page] || PAGE.none).n)}</span><span class="mo-cap">${s.page === 'none' ? 'No movement' : 'Halfway through'}</span></div>`);
      case 'load':
        return wrap(`${loadHTML(s.load)}<div class="mo-r"><span class="mo-cap big">${esc(LOAD[s.load][0])}</span></div>`);
      default: // ease
        return wrap(`<div class="mo-l">${track(e.fn, TRK)}<span class="mo-cap">${esc(e.n)}</span></div>${curve(e.fn)}`);
    }
  }

  /* A whole scene in miniature for looks, compare and the states view. */
  function overview(s, o) {
    const e = easeOf(s), rm = rmNow(s), t = timesOf(s);
    const d = enterDesc(s, rm);
    const pose = o.state || 'rest';
    const hold = pose === 'arriving' ? 0.5 : 1;
    const cardStyle = pose === 'arriving' && d ? sty(d, e.fn(hold)) : '';
    const rowDl = delays(4, s.seq, s.stagger);
    const rowStyle = (i) => (pose === 'arriving' && d ? sty(d, e.fn(Math.max(0, Math.min(1, (hold * (s.dur + Math.max(...rowDl)) - rowDl[i]) / s.dur)))) : '');
    const bpose = pose === 'hover' ? pressPose(s.press, 'h', rm) : pose === 'press' ? pressPose(s.press, 'd', rm) : null;
    const g = pose === 'arriving' ? ghosts(s, d) : '';
    const rw = Array.from({ length: 4 }, (_, i) => `<i class="mo-rw" data-a="enter" data-i="${i}" data-n="4" data-base="90" style="${rowStyle(i)}"><b></b></i>`).join('');
    const cap = `${e.n} · ${t.dur} ms · ${rm === 'none' ? 'no movement' : (ENTER_NAMES[s.enter] || ENTER_NAMES.none)[0].toLowerCase()}`;
    return `<div class="mo mo-ov${o.compare ? ' big' : ''}" data-p="${pdata(s)}" style="${pal()};${pressVars(s, rm)}">`
      + `<div class="mo-ovl"><div class="mo-box">${g}<div class="mo-mc" data-a="enter" data-i="0" data-n="1" data-base="0" style="${cardStyle}">${cardBits}</div></div>`
      + `<div class="mo-rws">${rw}</div></div>`
      + `<div class="mo-ovr">${track(e.fn, TRK - 30)}${curve(e.fn)}</div>`
      + `<div class="mo-act">${btnHTML(s, bpose, 'Save')}<span class="mo-sw mini on"><i></i></span></div>`
      + `<p class="mo-meta">${esc(cap)}</p></div>`;
  }
  function still(s, opt = {}) {
    if (opt.tile) return tileArt(s, opt.tile);
    return overview(s, opt);
  }

  /* ---- the live preview ---- */
  let LIVE_ROOT = null, lastLive = 0, liveTimer = 0;
  const WORDS = () => {
    const r = CX.rows && CX.rows.length >= 3 ? CX.rows : [['Weekly summary', 'Updated today', 'New'], ['Billing export', 'Updated yesterday', ''], ['Team access', '12 people', ''], ['Audit log', 'Last week', '']];
    return { rows: r.slice(0, 4), label: (P.labels && P.labels[0] && two(P.labels[0])[0]) || 'Save changes', card: r[0][0] };
  };
  function liveHTML(s) {
    const W = WORDS(), rm = rmNow(s);
    const row = (r, i) => `<li class="mo-li" data-a="enter" data-i="${i}" data-n="${W.rows.length}" data-base="140"><span class="mo-rt">${esc(r[0])}</span><span class="mo-rm">${esc(r[1] || '')}</span>${r[2] ? `<span class="mo-bd">${esc(r[2])}</span>` : ''}</li>`;
    const lab = (t) => `<h4 class="mo-h">${t}</h4>`;
    return `<div class="mo mo-live ${dimCls('motion', s)}" data-p="${pdata(s)}" style="${varsCss(vars(s))};${pal()};${pressVars(s, rm)}">`
      + `<div class="mo-top"><span class="mo-note">${rm ? 'Less motion: ' + (rm === 'fade' ? 'things fade, nothing travels' : 'nothing moves') : 'Point at the button, press it, flip the switch, switch pages'}</span><button type="button" class="mo-rp" data-mo="replay">Replay</button></div>`
      + `<div class="mo-grid">`
      + `<section class="mo-cardl" data-a="enter" data-i="0" data-n="1" data-base="0"><h3>${esc(W.card)}</h3><p>Your numbers for the week, ready to share with the team.</p>`
      + `<div class="mo-acts"><button type="button" class="mo-btn">${esc(W.label)}</button><label class="mo-tg"><span class="mo-sw" role="switch" tabindex="0" aria-checked="false"><i></i></span>Send me a copy</label></div></section>`
      + `<ul class="mo-list">${W.rows.map(row).join('')}</ul>`
      + `<div class="mo-pgwrap">${lab('Switching pages')}${pagesHTML('a', s.page)}<button type="button" class="mo-btn sm" data-mo="page">Next page</button></div>`
      + `<div class="mo-ldwrap">${lab('While loading')}${loadHTML(s.load)}</div>`
      + `</div><div class="mo-facts">${curve(easeOf(s).fn)}<p><b>${esc(easeOf(s).n)}</b>. ${timesOf(s).dur} ms for things arriving, ${timesOf(s).fast} ms for touch, ${timesOf(s).slow} ms for pages. ${esc(ENTER_NAMES[s.enter][0])}${s.dist && ['rise', 'drop', 'slide', 'tilt', 'grow'].includes(s.enter) ? `, ${s.dist} px` : ''}.</p></div></div>`;
  }
  function live(el, s) {
    el.innerHTML = liveHTML(s);
    const root = LIVE_ROOT = el.firstElementChild;
    root.querySelector('[data-mo=replay]').onclick = () => play(root, false);
    const pgb = root.querySelector('[data-mo=page]');
    if (pgb) pgb.onclick = () => pageGo(root);
    const sw = root.querySelector('.mo-sw');
    const flip = () => { const on = sw.getAttribute('aria-checked') !== 'true'; sw.setAttribute('aria-checked', String(on)); };
    sw.onclick = flip;
    sw.onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } };
    const now = Date.now(), quick = now - lastLive < 400;
    lastLive = now;
    clearTimeout(liveTimer);
    if (quick) liveTimer = setTimeout(() => { if (LIVE_ROOT === root && root.isConnected) play(root, false); }, 450); // a slider being dragged: wait, then play once
    else requestAnimationFrame(() => { if (root.isConnected) play(root, false); });
  }
  const replay = () => { if (LIVE_ROOT && LIVE_ROOT.isConnected) play(LIVE_ROOT, false); };

  /* Tiles, looks and compare cards play while pointed at or focused, and the chosen tile plays too. */
  const hostOf = (t) => (t && t.closest ? t.closest('.tile,.look,.cmp') : null);
  const startHost = (h) => h.querySelectorAll('.mo[data-p]:not(.mo-live)').forEach((r) => play(r, true));
  const stopHost = (h) => h.querySelectorAll('.mo[data-p]:not(.mo-live)').forEach((r) => stop(r));
  let hot = null;
  const heat = (h) => { if (h === hot) return; if (hot) stopHost(hot); hot = h; if (h) startHost(h); };
  document.addEventListener('mouseover', (e) => heat(hostOf(e.target)));
  document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) heat(null); });
  document.addEventListener('focusin', (e) => { const h = hostOf(e.target); if (h) heat(h); });
  document.addEventListener('focusout', (e) => { if (hot && !hot.contains(e.relatedTarget)) heat(null); });
  try {
    const pn = document.getElementById('panel');
    if (pn) new MutationObserver(() => setTimeout(() => pn.querySelectorAll('.tile[aria-pressed=true] .mo[data-p]').forEach((r) => { if (!r._anims || !r._anims.length) play(r, true); }), 30)).observe(pn, { childList: true, subtree: true });
  } catch {}

  /* ---- what other studios and the example page use ---- */
  function scene(s) {
    const t = timesOf(s), e = easeOf(s);
    return { vars: { '--sc-dur': t.dur + 'ms', '--sc-ease': e.css, '--sc-dist': s.dist + 'px', '--sc-stagger': s.stagger + 'ms', '--sc-lift': lift(s) + 'px' } };
  }
  function share(s) {
    const t = timesOf(s), e = easeOf(s);
    return { motion: { dur: t.dur, durFast: t.fast, durSlow: t.slow, ease: e.css, easeOf: e.id, easeOut: softOf(e).css, spring: s.ease === 'spring', distance: s.dist, stagger: s.seq === 'together' ? 0 : s.stagger, enter: s.enter, press: s.press, reduce: s.reduce } };
  }

  /* ---- checks and the proposal ---- */
  function warn(s) {
    const out = [], t = timesOf(s), n = 4;
    if (s.dur > 700) out.push({ k: 'dur', t: `${s.dur} ms is long for an interface to answer. Anything that takes this long to arrive feels like waiting, not movement. Under about 500 ms feels responsive.` });
    else if (t.fast > 250) out.push({ k: 'dur', soft: true, t: `Touch and hover answers would take ${t.fast} ms. Beyond about 250 ms a button feels as if it did not hear you.` });
    const last = Math.max(...delays(n, s.seq, s.stagger)) + s.dur;
    if (last > 900) out.push({ k: 'seq', t: `The last of four rows would not finish arriving until ${last} ms after the first starts. Longer lists would take even longer, so people wait for the page to finish.` });
    if (s.dist >= 40 && ['rise', 'drop', 'slide', 'tilt', 'grow'].includes(s.enter)) out.push({ k: 'dist', soft: true, t: `Things travel ${s.dist} px as they arrive. Large movements across the screen can be uncomfortable for people sensitive to motion, so keep the Less motion fade in place.` });
    if (['spring', 'bouncy'].includes(s.ease) && s.dur > 500 && s.stagger > 0 && s.seq !== 'together') out.push({ k: 'ease', soft: true, t: 'Bouncing movement on several items one after another keeps the page restless for a long time.' });
    return out;
  }
  const fmtMs = (n) => `${n}ms`;
  function notes(s) {
    const t = timesOf(s), e = easeOf(s), soft = softOf(e), out = [];
    out.push(`Motion tokens: --motion-fast: ${fmtMs(t.fast)} (hover, press, switches); --motion-base: ${fmtMs(t.dur)} (things arriving); --motion-slow: ${fmtMs(t.slow)} (panels and page changes); --ease-standard: ${e.css}; --ease-soft: ${soft.css} (fades and colour, which never overshoot). Leaving is quicker than arriving: use --motion-fast and --ease-soft when something goes away.`);
    if (s.ease === 'spring' || s.ease === 'bouncy') out.push(`Motion spring: the curve is a CSS linear() list, so it needs no library. Browsers without linear() fall back to ${EASE_BY.overshoot.css}: wrap it in @supports not (transition-timing-function: linear(0, 1)).`);
    const d = ENTER[s.enter] ? ENTER[s.enter](s.dist) : null;
    out.push(`Motion arrival: ${(ENTER_NAMES[s.enter] || ENTER_NAMES.none)[0].toLowerCase()}${d ? ` (${enterCap(s).toLowerCase()})` : ''}. ` + (s.seq === 'together' ? 'Everything arrives together.' : `Items follow one another ${s.stagger}ms apart, ${(SEQ_BY[s.seq] || SEQ[1])[1].toLowerCase()}, with the total delay capped at ${Math.round(Math.min(480, s.stagger * 6))}ms so long lists do not make people wait.`));
    const h = (PRESS[s.press] || PRESS.none);
    out.push(`Motion touch response: ${h.n.toLowerCase()}. ` + (s.press === 'none' ? 'No change on hover or press.' : `Hover: transform ${h.h.t}, box-shadow ${h.h.s}, filter ${h.h.f}. Press: transform ${h.d_.t}, filter ${h.d_.f}. Transition: transform, box-shadow, filter ${fmtMs(t.fast)} ${e.css}. Hover effects only where a pointer exists (@media (hover: hover)).`));
    out.push(`Motion page changes: ${(PAGE[s.page] || PAGE.none).n.toLowerCase()}, ${fmtMs(t.slow)}${['fade', 'dip', 'scale', 'rise'].includes(s.page) ? ` with ${soft.css}` : ''}. Loading: ${LOAD[s.load][0].toLowerCase()}.`);
    out.push(`Motion less-motion rule: @media (prefers-reduced-motion: reduce) { ${s.reduce === 'fade'
      ? `movement, scaling and blur are removed and every arrival and page change becomes a plain fade of about ${clamp(s.dur, 140, 260)}ms using --ease-soft; spring and bounce curves are not used; looping loaders become a gentle fade`
      : 'transitions and animations are switched off (use 0.01ms, not none, so end states and events still happen); changes are instant'} }. The in-page Less motion switch uses the same rule.`);
    return out;
  }
  const summary = (s) => `${easeOf(s).n} · ${s.dur} ms · ${(ENTER_NAMES[s.enter] || ENTER_NAMES.none)[0].toLowerCase()}`;

  /* ---- controls ---- */
  const tileAll = { wide: true, moves: true };
  const groups = [
    { id: 'feel', t: 'How it feels', sec: 'Feel', why: 'The shape of a movement: whether it leaps off and settles gently, goes at one speed, or springs. It sets the personality more than anything else here.',
      ctl: [ch('ease', 'How movement feels', EASES.map((e) => o(e.id, e.n, e.d)), { replay: true })] },
    { id: 'speed', t: 'Speed', sec: 'Feel', why: 'How long a normal movement takes. Touch answers are half of this, and page changes one and a half times.',
      ctl: [ch('dur', 'How long things take', [
        o(100, 'Instant', 'Barely there. Fast tools that should never make you wait.'), o(160, 'Quick', 'Brisk and light. Good for small controls.'),
        o(220, 'Standard', 'The usual speed for interface movement.'), o(300, 'Relaxed', 'Easy to see, a little unhurried.'),
        o(420, 'Slow', 'Clearly visible. Calm, and a little theatrical.'), o(600, 'Very slow', 'Cinematic. Fine for a hero moment, tiring for everyday use.')], { replay: true }),
      rg('dur', 'Exact time', 60, 800, 10, ' ms', 'In thousandths of a second. 200 to 300 feels natural for most movement.', { primary: true })] },
    { id: 'enter', t: 'How things arrive', short: 'Arrival', sec: 'Arrival', why: 'How a card, a menu or a message comes onto the screen.',
      ctl: [ch('enter', 'How things arrive', Object.keys(ENTER_NAMES).map((k) => o(k, ENTER_NAMES[k][0], ENTER_NAMES[k][1])), { replay: true })] },
    { id: 'seq', t: 'One after another', short: 'Order', sec: 'Arrival', why: 'When several things arrive together, whether they come at once or follow each other, and in which order.',
      ctl: [ch('seq', 'How a group arrives', SEQ.map((x) => Object.assign(o(x[0], x[1], x[2]), { set: { stagger: x[3] } })), { replay: true }),
        rg('stagger', 'Gap between items', 0, 200, 5, ' ms', 'How long each item waits after the one before.', { show: (s) => s.seq !== 'together', primary: true })] },
    { id: 'press', t: 'Response to touch', short: 'Touch', sec: 'Touch', why: 'How buttons and controls answer a pointer and a press. This is what makes an interface feel alive, or dead.',
      ctl: [ch('press', 'How controls respond', Object.keys(PRESS).map((k) => o(k, PRESS[k].n, PRESS[k].d)), { replay: true })] },
    { id: 'spring', extra: 1, t: 'Bounce', sec: 'Details', why: 'How much a springy movement overshoots and wobbles before it stops.',
      na: (s) => (s.ease === 'spring' ? '' : 'Bounce only applies to the Springy feel. Choose Springy under How it feels, and this opens.'),
      ctl: [ch('bounce', 'How bouncy', [
        o(0, 'None', 'Glides to a stop with no wobble, like a heavy door on a good hinge.'), o(15, 'Tight', 'A hint of overshoot. Feels responsive.'), o(30, 'Soft', 'One gentle bounce. Friendly.'),
        o(45, 'Lively', 'A clear bounce and a small wobble.'), o(60, 'Bouncy', 'Wobbles several times. Playful, and a lot.')], { replay: true }),
      rg('bounce', 'Exact bounce', 0, 60, 1, '%', 'How far it overshoots, as a share of the distance.')] },
    { id: 'dist', extra: 2, t: 'Distance', sec: 'Details', why: 'How far things travel as they arrive. Small movements feel precise; big ones feel dramatic and can tire the eye.',
      ctl: [ch('dist', 'How far things travel', [
        o(0, 'None', 'Nothing travels. Arrivals are fades and scales only.'), o(6, 'A hint', 'Just enough to show direction.'), o(12, 'Small', 'Clearly floats in. The usual size.'),
        o(20, 'Medium', 'An easy, visible journey.'), o(32, 'Large', 'A bold arrival.'), o(48, 'Very large', 'Dramatic. Use for one big moment, not for every card.')], { replay: true }),
      rg('dist', 'Exact distance', 0, 64, 1, ' px', 'In pixels.')] },
    { id: 'page', extra: 3, t: 'Page changes', sec: 'Details', why: 'What happens when the screen moves from one page or panel to another.',
      ctl: [ch('page', 'How pages change', Object.keys(PAGE).map((k) => o(k, PAGE[k].n, PAGE[k].d)), { replay: true })] },
    { id: 'load', extra: 4, t: 'While loading', sec: 'Details', why: 'What people see while something is on its way.',
      ctl: [ch('load', 'What shows while loading', Object.keys(LOAD).map((k) => o(k, LOAD[k][0], LOAD[k][1])))] },
    { id: 'reduce', extra: 5, t: 'Less motion', sec: 'Details', why: 'Some people turn on a setting that asks websites to move less, because movement makes them ill or uneasy. This is what you do instead.',
      ctl: [ch('reduce', 'When someone asks for less motion', [
        o('fade', 'Gentle fades only', 'Movement becomes a quick fade. Nothing travels, scales or bounces. The usual and kindest choice.'),
        o('none', 'Nothing at all', 'Everything is instant. Stillest, though changes can feel abrupt.')])] },
  ];

  const defaults = { ease: 'out', dur: 220, enter: 'rise', seq: 'quick', stagger: 40, press: 'liftpress', bounce: 30, dist: 12, page: 'fade', load: 'shimmer', reduce: 'fade' };
  const K = (id, n, d, p) => ({ id, n, d, patch: Object.assign({}, defaults, p) });
  const looks = [
    K('crisp', 'Crisp product', 'Quick, tidy and confident. Things rise a little, answer touch at once, and never get in the way.', {}),
    K('calm', 'Calm and quiet', 'Soft fades, long gentle stops and almost no travel. Nothing ever startles.', { ease: 'floaty', dur: 360, enter: 'fade', seq: 'cascade', stagger: 80, press: 'press', dist: 6, page: 'dip', load: 'pulse' }),
    K('playful', 'Playful spring', 'Things pop in on a springy curve and squash when pressed. Warm and full of life.', { ease: 'spring', bounce: 35, dur: 420, enter: 'grow', seq: 'cascade', stagger: 70, press: 'squash', dist: 20, page: 'push', load: 'dots' }),
    K('snappy', 'Snappy tool', 'Instant, exact, nearly no ceremony. For tools people use all day.', { ease: 'snappy', dur: 120, enter: 'fade', seq: 'together', stagger: 0, press: 'press', dist: 4, page: 'fade', load: 'bar' }),
    K('cinematic', 'Cinematic', 'Slow, soft and staged. Things come into focus one after another.', { ease: 'inout', dur: 600, enter: 'blur', seq: 'slow', stagger: 140, press: 'glow', dist: 28, page: 'scale', load: 'pulse' }),
    K('minimal', 'Almost still', 'Hardly any movement: changes happen at once and only touch gives a hint.', { ease: 'out', dur: 100, enter: 'none', seq: 'together', stagger: 0, press: 'press', dist: 0, page: 'none', load: 'none', reduce: 'none' }),
    K('familiar', 'Familiar, like most apps', 'The ordinary standard: a short slide, a clean lift, a cascade down the list.', { ease: 'ease', dur: 280, enter: 'slide', seq: 'cascade', stagger: 50, press: 'lift', dist: 14, page: 'slide', load: 'shimmer' }),
    K('lively', 'Bright and bouncy', 'A little overshoot on everything, arriving from the middle outwards.', { ease: 'overshoot', dur: 360, enter: 'scale', seq: 'centre', stagger: 60, press: 'grow', dist: 16, page: 'rise', load: 'spinner' }),
  ];

  function fix(s) {
    if (!EASE_BY[s.ease]) s.ease = 'out';
    s.dur = clamp(s.dur, 40, 1200, 220);
    s.bounce = clamp(s.bounce, 0, 60, 30);
    s.dist = clamp(s.dist, 0, 80, 12);
    s.stagger = clamp(s.stagger, 0, 300, 40);
    if (!ENTER[s.enter]) s.enter = 'rise';
    if (!SEQ_BY[s.seq]) s.seq = 'quick';
    if (!PRESS[s.press]) s.press = 'liftpress';
    if (!PAGE[s.page]) s.page = 'fade';
    if (!LOAD[s.load]) s.load = 'shimmer';
    if (!['fade', 'none'].includes(s.reduce)) s.reduce = 'fade';
  }

  STUDIO.add({
    id: 'motion', name: 'Motion',
    title: () => 'motion',
    defaults, today: T.today || {}, measured: !!T.measured,
    groups, keep: [], looks,
    reach: [
      ['system', 'The shared motion rules', 'Set the timings, curves and less-motion rule once as shared values, and use them everywhere.'],
      ['one', 'Only the movements shown', 'Change the cards, rows, buttons, switches and page changes drawn here, and leave everything else alone.'],
    ],
    fix, vars, still, live, replay, scene, share, warn, notes, summary,
    tile: () => tileAll,
    states: [['rest', 'At rest'], ['hover', 'Pointed at'], ['press', 'Pressed'], ['arriving', 'Halfway in']],
    stateNote: 'Frozen frames of the same scene. The curve and the trail of dots show how it moves; Compare and tiles play when pointed at.',
  });
}
