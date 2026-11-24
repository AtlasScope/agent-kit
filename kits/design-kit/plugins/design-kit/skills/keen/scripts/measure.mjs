#!/usr/bin/env node
// Measures a page: text contrast, tap sizes, unnamed controls, heading order,
// sideways scrolling, and how many different text sizes, colours and corner
// shapes are in use. It reads the page and changes nothing.
//
//   node measure.mjs            prints a script to run inside the page
//
// Run the printed script in the page with whatever the tool offers (a browser
// tool's "run JavaScript", Playwright's page.evaluate, the console). It returns
// one JSON-ready object. Run it once per screen width you care about.
//
// The maths below follows WCAG 2.2: relative luminance and contrast ratio
// (1.4.3, 1.4.11), large text at 24px or 18.66px bold, and a 24 by 24 CSS
// pixel minimum target (2.5.8). 44 is Apple's minimum for a finger.

/** Relative luminance of an sRGB colour, each channel 0 to 255. */
export function luminance([r, g, b]) {
  const lin = (v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Contrast ratio between two opaque colours, from 1 to 21. */
export function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Lays a colour with alpha (0 to 1) over an opaque one. */
export function over([r, g, b, a], [br, bg, bb]) {
  return [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a)];
}

/** Large text needs 3 to 1; everything else needs 4.5 to 1. */
export function needed(px, weight) {
  return px >= 24 || (px >= 18.66 && weight >= 700) ? 3 : 4.5;
}

/** Runs inside the page. Everything it needs is passed in or defined within. */
export function measurePage(helpers) {
  const { contrast, over, needed } = helpers;
  const LIMIT = 25;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const seen = new Map();
  // The canvas turns any colour the browser understands into red, green, blue and alpha.
  const rgba = (text) => {
    if (seen.has(text)) return seen.get(text);
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = text;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    const out = [r, g, b, a / 255];
    seen.set(text, out);
    return out;
  };
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility !== "visible" || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const where = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const words = (el) => (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60);
  // The colour behind an element, or null when a picture or gradient is behind it.
  const behind = (el) => {
    const layers = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.backgroundImage !== "none") return null;
      const c = rgba(s.backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] === 1) break;
    }
    let base = [255, 255, 255];
    for (const layer of layers.reverse()) base = over(layer, base);
    return base;
  };

  const all = [...document.body.querySelectorAll("*")].filter(visible);

  const lowContrast = [];
  let textChecked = 0;
  let textUnmeasured = 0;
  const sizes = new Map();
  const families = new Set();
  const textColours = new Set();
  for (const el of all) {
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) continue;
    const s = getComputedStyle(el);
    const px = parseFloat(s.fontSize);
    sizes.set(px, (sizes.get(px) || 0) + 1);
    families.add(s.fontFamily.split(",")[0].replace(/["']/g, "").trim());
    textColours.add(s.color);
    const back = behind(el);
    if (!back) {
      textUnmeasured += 1;
      continue;
    }
    textChecked += 1;
    const fore = rgba(s.color);
    const ratio = contrast(over(fore, back), back);
    const need = needed(px, Number(s.fontWeight) || 400);
    if (ratio < need) lowContrast.push({ text: words(el), ratio: Math.round(ratio * 100) / 100, needs: need, size: px, at: where(el) });
  }

  const controls = all.filter((el) => el.matches('a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [role="tab"], [role="checkbox"], [role="switch"], [tabindex]:not([tabindex="-1"])'));
  const smallTargets = [];
  let under44 = 0;
  const unnamed = [];
  for (const el of controls) {
    const r = el.getBoundingClientRect();
    // A link inside a sentence is allowed to be as small as its line (WCAG 2.5.8).
    const inSentence = el.matches("a") && getComputedStyle(el).display === "inline" && el.parentElement && el.parentElement.innerText.trim().length > words(el).length + 20;
    if (!inSentence) {
      if (r.width < 24 || r.height < 24) smallTargets.push({ text: words(el) || el.getAttribute("aria-label") || el.tagName.toLowerCase(), at: where(el) });
      if (r.width < 44 || r.height < 44) under44 += 1;
    }
    const labelled = el.getAttribute("aria-labelledby") && document.getElementById(el.getAttribute("aria-labelledby").split(" ")[0]);
    const label = el.labels && el.labels.length;
    const picture = el.querySelector("img[alt]:not([alt=''])");
    const name = words(el) || (el.getAttribute("aria-label") || "").trim() || labelled || label || (el.getAttribute("title") || "").trim() || picture || (el.matches("input") && (el.value && /^(submit|button|reset)$/.test(el.type)));
    if (!name) unnamed.push({ tag: el.tagName.toLowerCase(), type: el.getAttribute("type") || "", placeholder: el.getAttribute("placeholder") || "", at: where(el) });
  }

  const picturesWithoutText = all.filter((el) => el.matches("img:not([alt])")).map((el) => ({ src: (el.currentSrc || el.src || "").split("/").pop().slice(0, 60), at: where(el) }));

  const headings = all.filter((el) => /^H[1-6]$/.test(el.tagName)).map((el) => ({ level: Number(el.tagName[1]), text: words(el) }));
  const skipped = [];
  headings.forEach((h, i) => {
    if (i && h.level > headings[i - 1].level + 1) skipped.push({ after: headings[i - 1].text, then: h.text, from: headings[i - 1].level, to: h.level });
  });

  const radii = new Set();
  const backColours = new Set();
  for (const el of all) {
    const s = getComputedStyle(el);
    if (s.borderTopLeftRadius !== "0px") radii.add(s.borderTopLeftRadius);
    if (rgba(s.backgroundColor)[3] > 0) backColours.add(s.backgroundColor);
  }

  const view = document.querySelector('meta[name="viewport"]');
  const viewText = view ? view.getAttribute("content") || "" : "";
  const maxScale = /maximum-scale\s*=\s*([\d.]+)/.exec(viewText);
  const cut = (list) => ({ count: list.length, first: list.slice(0, LIMIT) });

  return {
    width: innerWidth,
    height: innerHeight,
    text: { checked: textChecked, behindPictureNotMeasured: textUnmeasured, lowContrast: cut(lowContrast.sort((a, b) => a.ratio - b.ratio)) },
    controls: { count: controls.length, under24: cut(smallTargets), under44, unnamed: cut(unnamed) },
    picturesWithoutText: cut(picturesWithoutText),
    headings: { count: headings.length, mainHeadings: headings.filter((h) => h.level === 1).length, skipped },
    sidewaysScroll: document.documentElement.scrollWidth > innerWidth + 1 ? document.documentElement.scrollWidth - innerWidth : 0,
    languageSet: Boolean(document.documentElement.getAttribute("lang")),
    zoomBlocked: /user-scalable\s*=\s*(no|0)/.test(viewText) || Boolean(maxScale && Number(maxScale[1]) < 2),
    variety: {
      textSizes: [...sizes.entries()].sort((a, b) => b[0] - a[0]).map(([px, uses]) => ({ px, uses })),
      smallestText: sizes.size ? Math.min(...sizes.keys()) : null,
      fontFamilies: [...families],
      textColours: textColours.size,
      backgroundColours: backColours.size,
      cornerShapes: [...radii],
    },
  };
}

/** The script to run inside a page. It evaluates to the result object. */
export function pageScript() {
  return `(() => {
${luminance}
${contrast}
${over}
${needed}
return (${measurePage})({ contrast, over, needed });
})()`;
}

if (import.meta.url === `file://${process.argv[1]}`) process.stdout.write(pageScript() + "\n");
