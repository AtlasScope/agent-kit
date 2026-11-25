#!/usr/bin/env node
// Fingerprint: what a page's look is made of, and which of its choices are the defaults that most
// generated interfaces share. It reads the page and changes nothing.
//
//   node fingerprint.mjs        prints a script to run inside the page (same way as measure.mjs)
//
// measure.mjs asks "can everyone use this?". This asks "whose is this?". It reports the type (families,
// how far the sizes step apart, line length in characters), the colour (in OKLCH, the perceptual space of
// CSS Color 4, so hue and lightness mean what the eye sees), the form (corners, shadows, blur, repeated
// cards) and the arrangement (how much text is centred, where the first screen's weight sits). Then it
// lists the defaults it found. A default is not a fault. It is a choice nobody made; a direction keeps
// it only when it can say why.
//
// It is a smoke alarm, not a judge. An empty list means none of a dozen common habits was found; it says
// nothing about whether the idea is good, the page is beautiful or the work is right for its people. A
// template with a serif and a teal accent passes; a great page may keep a default on purpose. Never
// report "no defaults" as evidence of quality. Judge the work by what it does for the person using it.
//
// Drawn graphics count: SVG fills, strokes, text and gradients join the colour and type readings, and
// `graphics` says how much of the first screen is drawn.
//
// Colour maths: sRGB to OKLab and OKLCH from Björn Ottosson, "A perceptual color space for image
// processing" (2020), the space CSS Color 4 uses for oklch().

import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** An sRGB colour (0 to 255 each) as OKLCH: lightness 0 to 1, chroma from 0, hue in degrees. */
export function oklch([r, g, b]) {
  const lin = (v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [R, G, B] = [lin(r), lin(g), lin(b)];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.sqrt(A * A + Bb * Bb);
  let H = (Math.atan2(Bb, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, C < 1e-4 ? 0 : H];
}

/** Families that ship with every system or every starter kit. Using only these is a default. */
export const STOCK_FONTS = ["inter", "system-ui", "-apple-system", "blinkmacsystemfont", "segoe ui", "roboto", "helvetica neue", "helvetica", "arial", "sans-serif", "ui-sans-serif", "geist", "open sans", "poppins", "montserrat"];

/** The indigo-to-violet band (OKLCH hue) that generated interfaces reach for when nobody chose a colour. */
export function defaultAccentHue(h) {
  return h >= 255 && h <= 310;
}

/** Turns raw page readings into named defaults. Kept outside the page so it can be tested in Node. */
export function judge(f) {
  const out = [];
  const add = (id, says, evidence) => out.push({ id, says, evidence });
  const named = f.type.families.filter((x) => x.share >= 0.05).map((x) => x.family);
  if (named.length && named.every((n) => STOCK_FONTS.includes(n))) add("stock-type", "Every face is a stock interface font", named.join(", "));
  if (f.type.scaleContrast && f.type.scaleContrast < 2.2) add("timid-scale", "The largest text is less than 2.2 times body size", `${f.type.largest}px over ${f.type.body}px`);
  const accent = f.colour.chromatic[0];
  if (accent && defaultAccentHue(accent.h)) add("violet-accent", "The main colour sits in the indigo-violet band most generated interfaces use", `oklch hue ${Math.round(accent.h)}`);
  if (f.colour.gradients >= 2 || f.colour.gradientText) add("gradient", "Gradients carry the decoration", `${f.colour.gradients} gradient fills${f.colour.gradientText ? ", gradient text" : ""}`);
  if (f.form.boxes >= 6 && f.form.mainRadiusShare >= 0.8 && f.form.mainRadius !== "0px") add("one-radius", "One corner radius on nearly every box", `${f.form.mainRadius} on ${Math.round(f.form.mainRadiusShare * 100)}% of ${f.form.boxes}`);
  if (f.form.cardRows >= 1) add("card-grid", "A row of matching cards", `${f.form.cardRows} row(s) of 3 or more`);
  if (f.form.blur >= 2) add("glass", "Frosted-glass blur on surfaces", `${f.form.blur} blurred surfaces`);
  if (f.form.shadowShare >= 0.25) add("shadow-everywhere", "Soft shadows on most boxes", `${Math.round(f.form.shadowShare * 100)}% of boxes`);
  if (f.layout.centredHero) add("centred-hero", "First screen is a centred heading, a line and buttons", f.layout.centredHero);
  if (f.layout.centredShare >= 0.5) add("centred-text", "Most text is centred", `${Math.round(f.layout.centredShare * 100)}% of characters`);
  if (f.type.emojiIcons >= 3) add("emoji-icons", "Emoji stand in for icons", `${f.type.emojiIcons} found`);
  return out;
}

/** Runs inside the page. Everything it needs is passed in. */
export function readPage({ oklch }) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rgba = (text) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = "#000";
    ctx.fillStyle = text;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const all = [...document.body.querySelectorAll("*")].filter((el) => !el.closest("svg, script, style, noscript") && visible(el));
  const ownText = (el) => [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").replace(/\s+/g, " ").trim();

  // Type: share of characters per family, sizes weighted by characters, line length.
  const fam = new Map();
  const size = new Map();
  let chars = 0;
  let centred = 0;
  let emojiIcons = 0;
  const measures = [];
  const meas = document.createElement("canvas").getContext("2d");
  for (const el of all) {
    const t = ownText(el);
    if (!t) continue;
    const s = getComputedStyle(el);
    const n = t.length;
    chars += n;
    const first = s.fontFamily.split(",")[0].replace(/["']/g, "").trim().toLowerCase();
    fam.set(first, (fam.get(first) || 0) + n);
    const px = Math.round(parseFloat(s.fontSize));
    size.set(px, (size.get(px) || 0) + n);
    if (s.textAlign === "center") centred += n;
    if (/^\p{Extended_Pictographic}/u.test(t) && n <= 3) emojiIcons += 1;
    if (el.matches("p, li, dd, blockquote") && n > 120) {
      meas.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
      const avg = meas.measureText(t).width / n;
      const w = el.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
      // A line that never wraps is as long as its text, however wide its box.
      if (avg > 0) measures.push(Math.min(n, Math.round(w / avg)));
    }
  }

  // Drawn graphics: SVG text is type, so its faces count; its sizes are left out of the ladder, because
  // chart labels are scaled with their drawing and are not the page's text sizes.
  const svgs = [...document.body.querySelectorAll("svg")].filter((el) => !el.parentElement.closest("svg") && visible(el));
  const svgText = svgs.flatMap((el) => [...el.querySelectorAll("text")]).filter(visible);
  let svgChars = 0;
  for (const el of svgText) {
    const t = el.textContent.replace(/\s+/g, " ").trim();
    if (!t) continue;
    const first = getComputedStyle(el).fontFamily.split(",")[0].replace(/["']/g, "").trim().toLowerCase();
    fam.set(first, (fam.get(first) || 0) + t.length);
    chars += t.length;
    svgChars += t.length;
  }
  const families = [...fam.entries()].sort((a, b) => b[1] - a[1]).map(([family, c]) => ({ family, share: Math.round((c / chars) * 100) / 100 }));
  const sizes = [...size.entries()].sort((a, b) => b[1] - a[1]);
  const body = sizes.length ? sizes[0][0] : null;
  const largest = sizes.length ? Math.max(...sizes.map((x) => x[0])) : null;
  const ladder = [...new Set(sizes.map((x) => x[0]))].sort((a, b) => a - b);
  measures.sort((a, b) => a - b);

  // Colour: every painted surface, weighted by area on the first screen and below; then OKLCH.
  const paint = new Map();
  let gradients = 0;
  let gradientText = false;
  const vw = innerWidth;
  const vh = innerHeight;
  const addPaint = (c, area) => {
    if (c[3] < 0.1 || area <= 0) return;
    const key = c.slice(0, 3).join(",");
    paint.set(key, (paint.get(key) || 0) + area * c[3]);
  };
  for (const el of [document.documentElement, document.body, ...all]) {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const area = Math.min(r.width, vw) * Math.min(r.height, vh * 3);
    addPaint(rgba(s.backgroundColor), area);
    if (/gradient\(/.test(s.backgroundImage)) {
      gradients += 1;
      if (s.backgroundClip === "text" || s.webkitBackgroundClip === "text") gradientText = true;
      for (const m of s.backgroundImage.matchAll(/(rgba?\([^)]*\)|oklch\([^)]*\)|color\([^)]*\)|#[0-9a-f]{3,8})/gi)) addPaint(rgba(m[1]), area / 3);
    }
    if (ownText(el)) addPaint(rgba(s.color), ownText(el).length * parseFloat(s.fontSize) ** 2 * 0.5);
    if (parseFloat(s.borderTopWidth) > 0) addPaint(rgba(s.borderTopColor), (r.width + r.height) * 2 * parseFloat(s.borderTopWidth));
  }
  // SVG shapes paint by their fill area and stroke length; url() paints are gradients or patterns.
  let shapes = 0;
  let drawnArea = 0;
  for (const svg of svgs) {
    const r = svg.getBoundingClientRect();
    drawnArea += Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) * Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0));
    gradients += svg.querySelectorAll("linearGradient, radialGradient").length;
    for (const el of svg.querySelectorAll("path, rect, circle, ellipse, polygon, polyline, line")) {
      if (!visible(el)) continue;
      shapes += 1;
      const s = getComputedStyle(el);
      const b = el.getBoundingClientRect();
      const fo = Number(s.fillOpacity) * Number(s.opacity);
      if (s.fill && s.fill !== "none" && !s.fill.startsWith("url(")) {
        const c = rgba(s.fill);
        addPaint([c[0], c[1], c[2], c[3] * fo], Math.min(b.width, vw) * Math.min(b.height, vh * 3) * 0.5);
      }
      const sw = parseFloat(s.strokeWidth) || 0;
      if (s.stroke && s.stroke !== "none" && !s.stroke.startsWith("url(") && sw > 0) {
        const c = rgba(s.stroke);
        addPaint([c[0], c[1], c[2], c[3] * Number(s.strokeOpacity)], (b.width + b.height) * 2 * sw);
      }
    }
  }
  for (const el of svgText) addPaint(rgba(getComputedStyle(el).fill), el.textContent.trim().length * parseFloat(getComputedStyle(el).fontSize) ** 2 * 0.5);
  const total = [...paint.values()].reduce((a, b) => a + b, 0) || 1;
  const swatches = [...paint.entries()].map(([k, a]) => {
    const rgb = k.split(",").map(Number);
    const [l, c, h] = oklch(rgb);
    return { rgb: `rgb(${k})`, l: Math.round(l * 1000) / 1000, c: Math.round(c * 1000) / 1000, h: Math.round(h), share: a / total };
  });
  const chromatic = swatches.filter((s) => s.c >= 0.04).sort((a, b) => b.share - a.share);
  const neutrals = swatches.filter((s) => s.c < 0.04);
  const round = (x) => Math.round(x * 1000) / 1000;
  const lights = swatches.map((s) => s.l);

  // Form: boxes are elements that paint an edge (fill different from the page, border or shadow).
  const page = rgba(getComputedStyle(document.body).backgroundColor);
  const radii = new Map();
  let boxes = 0;
  let shadowed = 0;
  let blur = 0;
  const boxEls = [];
  for (const el of all) {
    const s = getComputedStyle(el);
    if (/blur\(/.test(s.backdropFilter || s.webkitBackdropFilter || "")) blur += 1;
    const fill = rgba(s.backgroundColor);
    const edged = (fill[3] > 0.1 && fill.slice(0, 3).join() !== page.slice(0, 3).join()) || parseFloat(s.borderTopWidth) > 0 || s.boxShadow !== "none";
    const r = el.getBoundingClientRect();
    if (!edged || r.width < 80 || r.height < 40 || el.matches("button, a, input, select, textarea")) continue;
    boxes += 1;
    boxEls.push(el);
    if (s.boxShadow !== "none") shadowed += 1;
    radii.set(s.borderTopLeftRadius, (radii.get(s.borderTopLeftRadius) || 0) + 1);
  }
  const topRadius = [...radii.entries()].sort((a, b) => b[1] - a[1])[0] || ["0px", 0];
  // A card row: three or more sibling boxes of near-equal size side by side.
  let cardRows = 0;
  const parents = new Set(boxEls.map((el) => el.parentElement));
  for (const p of parents) {
    const kids = [...p.children].filter((k) => boxEls.includes(k));
    if (kids.length < 3) continue;
    const rs = kids.map((k) => k.getBoundingClientRect());
    const tops = new Map();
    for (const r of rs) tops.set(Math.round(r.top / 8), (tops.get(Math.round(r.top / 8)) || []).concat(r));
    for (const row of tops.values()) {
      if (row.length < 3) continue;
      const w = row.map((r) => r.width);
      if (Math.max(...w) / Math.min(...w) < 1.15) { cardRows += 1; break; }
    }
  }

  // Arrangement: the stock hero, and where the first screen's ink sits.
  let centredHero = "";
  const h1 = document.querySelector("h1");
  if (h1 && visible(h1)) {
    const r = h1.getBoundingClientRect();
    const s = getComputedStyle(h1);
    const mid = Math.abs(r.left + r.width / 2 - vw / 2) < vw * 0.04;
    if (r.top + scrollY < vh && (s.textAlign === "center" || (mid && r.width < vw * 0.9))) {
      const buttons = all.filter((el) => el.matches("a, button") && rgba(getComputedStyle(el).backgroundColor)[3] > 0.5).filter((el) => {
        const b = el.getBoundingClientRect();
        return b.top > r.bottom && b.top + scrollY < vh * 1.1;
      });
      if (buttons.length >= 1) centredHero = `heading "${h1.textContent.trim().slice(0, 40)}" centred with ${buttons.length} filled button(s) below`;
    }
  }
  let mx = 0;
  let mass = 0;
  for (const el of all) {
    if (!ownText(el) && !el.matches("img, video, canvas, svg")) continue;
    const r = el.getBoundingClientRect();
    if (r.top > vh || r.bottom < 0) continue;
    const a = Math.min(r.width, vw) * Math.min(r.height, vh);
    mx += (r.left + r.width / 2) * a;
    mass += a;
  }

  return {
    width: vw,
    type: {
      families,
      body,
      largest,
      scaleContrast: body ? round(largest / body) : null,
      ladder,
      steps: ladder.slice(1).map((v, i) => round(v / ladder[i])),
      measure: measures.length ? { median: measures[Math.floor(measures.length / 2)], shortest: measures[0], longest: measures[measures.length - 1], paragraphs: measures.length } : null,
      emojiIcons,
    },
    colour: {
      chromatic: chromatic.slice(0, 6).map((s) => ({ ...s, share: round(s.share) })),
      neutrals: { count: neutrals.length, share: round(neutrals.reduce((a, s) => a + s.share, 0)), warmth: neutrals.length ? Math.round(neutrals.filter((s) => s.c > 0.004).reduce((a, s) => a + s.h * s.share, 0) / (neutrals.filter((s) => s.c > 0.004).reduce((a, s) => a + s.share, 0) || 1)) : null },
      lightness: lights.length ? { darkest: round(Math.min(...lights)), lightest: round(Math.max(...lights)) } : null,
      gradients,
      gradientText,
    },
    form: { boxes, mainRadius: topRadius[0], mainRadiusShare: boxes ? round(topRadius[1] / boxes) : 0, radii: [...radii.keys()], shadowShare: boxes ? round(shadowed / boxes) : 0, blur, cardRows },
    layout: { centredShare: chars ? round(centred / chars) : 0, centredHero, firstScreenWeightX: mass ? round(mx / mass / vw) : null },
    graphics: { svgs: svgs.length, shapes, textChars: svgChars, firstScreenShare: round(Math.min(1, drawnArea / (vw * vh))) },
  };
}

/** The script to run inside a page. It evaluates to { ...readings, defaults }. */
export function pageScript() {
  return `(() => {
const STOCK_FONTS = ${JSON.stringify(STOCK_FONTS)};
${oklch}
${defaultAccentHue}
${judge}
const f = (${readPage})({ oklch });
return { ...f, defaults: judge(f), note: "Lists unchosen defaults only. An empty list says nothing about whether the design is good." };
})()`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) process.stdout.write(pageScript() + "\n");
