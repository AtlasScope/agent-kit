/* Viewport Proof · mechanical geometry floor for one rendered viewport.
 *
 * Run the whole file as one expression on the loaded page at the viewport you
 * are judging:
 *   - Claude Browser pane / Claude in Chrome: paste into javascript_tool.
 *   - Playwright: `await page.evaluate(fs.readFileSync(path, 'utf8'))`.
 *   - Cursor or Codex browser tools: evaluate it on the tab.
 * It returns plain JSON and never navigates, clicks, or mutates the page.
 *
 * A clean result is the floor, not a pass. It cannot judge hierarchy,
 * consistency, or composition; the screenshot review does that.
 *
 * Optional: before running, set window.__vpAllowScroll = ['.my-table-wrap'] to
 * mark containers that are intentional horizontal scanning surfaces.
 */
(async () => {
  const MIN_TARGET = 24;           // WCAG 2.2 AA minimum target size, CSS px
  const COMFORT_TARGET = 44;       // comfortable touch target, CSS px
  const MAX_FINDINGS = 80;
  const MAX_LINE_CHARS = 110;      // approximate characters per line before a measure warning

  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const coarse = matchMedia('(pointer: coarse)').matches;
  const allow = Array.isArray(window.__vpAllowScroll) ? window.__vpAllowScroll : [];
  const findings = [];
  const add = (check, severity, el, detail) => {
    if (findings.length >= MAX_FINDINGS) return;
    const r = el && el.getBoundingClientRect ? el.getBoundingClientRect() : null;
    findings.push({
      check, severity, detail,
      selector: el && el.nodeType === 1 ? sel(el) : null,
      rect: r ? { x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) } : null,
    });
  };

  function sel(el) {
    const parts = [];
    for (let n = el, depth = 0; n && n.nodeType === 1 && depth < 4; n = n.parentElement, depth++) {
      if (n.id) { parts.unshift('#' + CSS.escape(n.id)); break; }
      let s = n.tagName.toLowerCase();
      const cls = [...n.classList].filter(c => c.length < 40).slice(0, 2);
      if (cls.length) s += '.' + cls.map(c => CSS.escape(c)).join('.');
      const sibs = n.parentElement ? [...n.parentElement.children].filter(c => c.tagName === n.tagName) : [];
      if (sibs.length > 1) s += `:nth-of-type(${sibs.indexOf(n) + 1})`;
      parts.unshift(s);
    }
    return parts.join(' > ');
  }

  function visible(el) {
    if (el.checkVisibility) {
      if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    } else {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false;
    }
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  // An ancestor that clips or scrolls horizontally contains the element on purpose.
  function containedX(el) {
    for (let n = el.parentElement; n && n !== document.body && n !== document.documentElement; n = n.parentElement) {
      const ox = getComputedStyle(n).overflowX;
      if (ox !== 'visible') return n;
    }
    return null;
  }

  const all = [...document.body.querySelectorAll('*')].filter(el => !['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'svg'].includes(el.tagName));
  const shown = all.filter(visible);

  // 1. Mobile viewport meta. Without it phones lay out at ~980px and shrink.
  if (!document.querySelector('meta[name="viewport"]')) {
    add('viewport-meta', 'fail', null, 'No <meta name="viewport">; phones will render a shrunken desktop layout.');
  }

  // 2. Page-level horizontal overflow and the elements causing it.
  const docW = document.documentElement.scrollWidth;
  if (docW > vw + 1) {
    add('page-overflow-x', 'fail', document.documentElement, `Page scrolls sideways: content is ${docW}px wide in a ${vw}px viewport.`);
  }
  const overflowers = shown.filter(el => {
    const r = el.getBoundingClientRect();
    return (r.right > vw + 1 || r.left < -1) && !containedX(el);
  });
  // Report the outermost offenders only, so one wide wrapper is one finding.
  overflowers.filter(el => !overflowers.includes(el.parentElement)).forEach(el => {
    const r = el.getBoundingClientRect();
    add('element-outside-viewport', 'fail', el, `Extends ${Math.round(Math.max(r.right - vw, -r.left))}px past the viewport edge.`);
  });

  // 3. Scroll containers: intentional scanners are info, unexpected ones warn.
  shown.forEach(el => {
    const cs = getComputedStyle(el);
    if (!['auto', 'scroll'].includes(cs.overflowX) || el.scrollWidth <= el.clientWidth + 1) return;
    const intended = allow.some(s => el.matches(s)) || el.querySelector('table') || el.tagName === 'PRE' || el.getAttribute('role') === 'region';
    add('horizontal-scroller', intended ? 'info' : 'warn', el, `Scrolls sideways (${el.scrollWidth}px content in ${el.clientWidth}px).${intended ? ' Looks intentional.' : ' Confirm this is a deliberate scanning surface.'}`);
  });

  // 4. Clipped or truncated text.
  shown.forEach(el => {
    const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (!hasText) return;
    const cs = getComputedStyle(el);
    const clipsX = cs.overflowX !== 'visible' && el.scrollWidth > el.clientWidth + 1;
    const clipsY = cs.overflowY !== 'visible' && el.scrollHeight > el.clientHeight + 1 && cs.overflowY !== 'auto' && cs.overflowY !== 'scroll';
    if (!clipsX && !clipsY) return;
    const ellipsis = cs.textOverflow === 'ellipsis' || parseInt(cs.webkitLineClamp, 10) > 0;
    add('clipped-text', ellipsis ? 'info' : 'warn', el, ellipsis
      ? `Text is truncated with an ellipsis: "${el.textContent.trim().slice(0, 60)}". Confirm the full value is reachable.`
      : `Text is cut off without an ellipsis: "${el.textContent.trim().slice(0, 60)}".`);
  });

  // 5. Small interactive targets. Inline links inside running text are exempt (WCAG inline exception).
  const interactive = shown.filter(el => el.matches('a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [role="tab"], [role="checkbox"], [role="switch"], [role="menuitem"], [tabindex]:not([tabindex="-1"])'));
  let small = 0;
  interactive.forEach(el => {
    if (interactive.includes(el.parentElement)) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'inline' && el.parentElement && [...el.parentElement.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
    const r = el.getBoundingClientRect();
    const minSide = Math.min(r.width, r.height);
    if (minSide < MIN_TARGET) {
      small++;
      add('small-target', coarse ? 'fail' : 'warn', el, `Target is ${Math.round(r.width)}x${Math.round(r.height)}px; minimum is ${MIN_TARGET}px.`);
    } else if (coarse && minSide < COMFORT_TARGET) {
      add('small-target', 'info', el, `Touch target is ${Math.round(r.width)}x${Math.round(r.height)}px; ${COMFORT_TARGET}px is comfortable.`);
    }
  });

  // 6. Fixed and sticky layers and how much of the viewport they occupy.
  const layers = shown.filter(el => ['fixed', 'sticky'].includes(getComputedStyle(el).position))
    .filter(el => !shown.some(o => o !== el && o.contains(el) && ['fixed', 'sticky'].includes(getComputedStyle(o).position)));
  let covered = 0;
  layers.forEach(el => {
    const r = el.getBoundingClientRect();
    const h = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    const w = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
    if (getComputedStyle(el).position === 'fixed') covered += (w * h) / (vw * vh);
  });
  if (covered > 0.4) {
    add('fixed-coverage', 'warn', null, `Fixed layers cover ${Math.round(covered * 100)}% of the viewport; check content is not trapped behind them.`);
  }

  // 7. Images: broken or visibly distorted.
  shown.filter(el => el.tagName === 'IMG').forEach(img => {
    if (img.complete && img.naturalWidth === 0) { add('broken-image', 'fail', img, `Image failed to load: ${img.currentSrc || img.src}`); return; }
    if (!img.naturalWidth) return;
    const fit = getComputedStyle(img).objectFit;
    const r = img.getBoundingClientRect();
    const drift = Math.abs((r.width / r.height) / (img.naturalWidth / img.naturalHeight) - 1);
    if (fit === 'fill' && drift > 0.05) add('distorted-image', 'warn', img, `Image is stretched ${Math.round(drift * 100)}% off its natural shape.`);
  });

  // 8. Reading measure: paragraphs far wider than comfortable reading width.
  shown.filter(el => el.tagName === 'P' && el.textContent.trim().length > 200).forEach(p => {
    const cs = getComputedStyle(p);
    const chars = p.getBoundingClientRect().width / (parseFloat(cs.fontSize) * 0.5);
    if (chars > MAX_LINE_CHARS) add('long-measure', 'warn', p, `About ${Math.round(chars)} characters per line; reading text is hard past ~${MAX_LINE_CHARS}.`);
  });

  // Settledness: a capture taken mid-load is not evidence.
  const busy = shown.filter(el => el.getAttribute('aria-busy') === 'true').length;
  const skeletons = shown.filter(el => /(^|[-_\s])(skeleton|shimmer|spinner|loading)([-_\s]|$)/i.test(typeof el.className === 'string' ? el.className : '')).length;
  const settled = { fonts: document.fonts ? document.fonts.status : 'unknown', ariaBusy: busy, skeletonLike: skeletons };
  settled.ok = settled.fonts !== 'loading' && busy === 0 && skeletons === 0;

  const count = s => findings.filter(f => f.severity === s).length;
  return {
    url: location.href,
    viewport: { width: vw, height: vh, dpr: devicePixelRatio },
    pointer: coarse ? 'coarse' : 'fine',
    colorScheme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    settled,
    summary: { fail: count('fail'), warn: count('warn'), info: count('info'), smallTargets: small, fixedLayers: layers.length, truncated: findings.length >= MAX_FINDINGS },
    findings,
  };
})()
