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
// pixel minimum target with its two exceptions, a link in a sentence and a
// small control with clear space round it (2.5.8). 44 is Apple's minimum for
// a finger and is reported separately.
//
// Text is checked against what is really stacked under it on screen, so run
// it with the part you care about scrolled into view, and before any
// full-page screenshot. At phone sizes, make the browser act as a touch device.

import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

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
  const shown = (el) => {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility !== "visible" || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  // Text kept for screen readers only is squeezed into a pixel; nobody sees it.
  const squeezed = (el) => {
    const r = el.getBoundingClientRect();
    return r.width <= 1 || r.height <= 1;
  };
  const where = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const words = (el) => (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60);
  const PICTURE = /^(IMG|CANVAS|VIDEO|PICTURE|SVG|IFRAME|OBJECT|EMBED)$/i;
  const STOP = /rgba?\([^()]*\)|hsla?\([^()]*\)|(?:color|oklch|oklab|lab|lch|hwb)\([^()]*\)|#[0-9a-f]{3,8}\b/gi;
  // What one layer puts behind text: "clear", "picture", or the colours it could be.
  const layerOf = (node) => {
    if (PICTURE.test(node.tagName)) return "picture";
    const s = getComputedStyle(node);
    const colour = rgba(s.backgroundColor);
    if (s.backgroundImage === "none") return colour[3] > 0 ? [colour] : "clear";
    if (/url\(/.test(s.backgroundImage)) return "picture";
    // A gradient: the text has to pass against every colour in it, including
    // the ones it passes through between the colours it names.
    const stops = (s.backgroundImage.match(STOP) || []).map(rgba);
    if (!stops.length || stops.length > 6) return "picture";
    const through = [];
    stops.forEach((stop, i) => {
      through.push(stop);
      const next = stops[i + 1];
      if (next) for (let t = 1; t < 8; t += 1) through.push(stop.map((v, k) => v + ((next[k] - v) * t) / 8));
    });
    return through;
  };
  // Every colour that could sit behind an element, or null when a picture does.
  // It looks at what is really stacked under the middle of the text, so a photo
  // placed behind as a separate layer is seen. Off-screen text falls back to
  // the element's own parents.
  const behind = (el) => {
    const r = (el.getClientRects()[0] || el.getBoundingClientRect());
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    let chain = null;
    if (x >= 0 && y >= 0 && x < innerWidth && y < innerHeight) {
      const stack = document.elementsFromPoint(x, y);
      const at = stack.findIndex((n) => n === el || el.contains(n));
      if (at !== -1) chain = stack.slice(stack.indexOf(el) !== -1 ? stack.indexOf(el) : at).filter((n) => !el.contains(n) || n === el);
    }
    if (!chain) {
      chain = [];
      for (let n = el; n && n.nodeType === 1; n = n.parentElement) chain.push(n);
    }
    let bases = null;
    const layers = [];
    for (const node of chain) {
      const layer = layerOf(node);
      if (layer === "clear") continue;
      if (layer === "picture") return null;
      layers.push(layer);
      if (layer.every((c) => c[3] === 1)) break;
    }
    bases = [[255, 255, 255]];
    for (const layer of layers.reverse()) bases = bases.flatMap((base) => layer.map((c) => over(c, base)));
    return bases.length > 512 ? null : bases;
  };
  // The lowest contrast of a colour against every colour that could be behind it.
  const worst = (colourText, bases) => Math.min(...bases.map((base) => contrast(over(rgba(colourText), base), base)));

  const all = [...document.body.querySelectorAll("*")].filter(shown);

  const lowContrast = [];
  let textChecked = 0;
  let textUnmeasured = 0;
  const overPictures = [];
  const sizes = new Map();
  const families = new Set();
  const textColours = new Set();
  const styles = new Map();
  const check = (el, text, style, kind) => {
    const px = parseFloat(style.fontSize);
    const bases = behind(el);
    if (!bases) {
      textUnmeasured += 1;
      if (overPictures.length < LIMIT) overPictures.push({ text, at: where(el) });
      return;
    }
    textChecked += 1;
    const ratio = worst(style.color, bases);
    const need = needed(px, Number(style.fontWeight) || 400);
    if (ratio < need) lowContrast.push({ text, kind, ratio: Math.round(ratio * 100) / 100, needs: need, size: px, at: where(el) });
  };
  for (const el of all) {
    const s = getComputedStyle(el);
    // Marks with no letter or number in them, such as the slash between breadcrumbs, are decoration.
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && /[\p{L}\p{N}]/u.test(n.textContent));
    if (own && !squeezed(el)) {
      const px = parseFloat(s.fontSize);
      sizes.set(px, (sizes.get(px) || 0) + 1);
      families.add(s.fontFamily.split(",")[0].replace(/["']/g, "").trim());
      textColours.add(rgba(s.color).slice(0, 3).join(","));
      const lh = parseFloat(s.lineHeight);
      const style = px + "px / weight " + s.fontWeight + " / line " + (lh ? Math.round((lh / px) * 100) / 100 : "normal");
      const seen = styles.get(style) || { uses: 0, example: words(el).slice(0, 40) };
      seen.uses += 1;
      styles.set(style, seen);
      check(el, words(el), s, "text");
    }
    // Text the stylesheet adds before or after an element.
    for (const part of ["::before", "::after"]) {
      const ps = getComputedStyle(el, part);
      const made = /^"(.*)"$/.exec(ps.content || "");
      // A mark with no letter or number in it (a slash, a dot, an arrow) is decoration here too.
      if (!made || !/[\p{L}\p{N}]/u.test(made[1]) || ps.display === "none") continue;
      // With a background of its own, what is behind it cannot be worked out from here.
      if (rgba(ps.backgroundColor)[3] > 0 || ps.backgroundImage !== "none") {
        textUnmeasured += 1;
        if (overPictures.length < LIMIT) overPictures.push({ text: made[1].slice(0, 60), at: where(el) });
      } else check(el, made[1].slice(0, 60), ps, "added by the stylesheet");
    }
    // The grey hint inside an empty field.
    if (el.matches("input, textarea") && el.getAttribute("placeholder") && !el.value) check(el, el.getAttribute("placeholder").slice(0, 60), getComputedStyle(el, "::placeholder"), "hint inside a field");
  }

  const controls = all.filter((el) => el.matches('a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [role="tab"], [role="checkbox"], [role="switch"], [tabindex]:not([tabindex="-1"])'));
  // A link inside a sentence may be as small as its line (WCAG 2.5.8).
  const inSentence = (el) => {
    if (!el.matches("a, [role='link']") || getComputedStyle(el).display !== "inline") return false;
    let block = el.parentElement;
    while (block && getComputedStyle(block).display === "inline") block = block.parentElement;
    if (!block) return false;
    // It is a sentence only if there are words around the links, not just other links.
    const copy = block.cloneNode(true);
    copy.querySelectorAll("a, button, [role='link'], [role='button']").forEach((n) => n.remove());
    return (copy.textContent || "").replace(/[\s,.;:·|/()&-]+/g, " ").trim().length > 8;
  };
  const centre = (r) => [r.left + r.width / 2, r.top + r.height / 2];
  // What can actually be pressed. A link is often stretched over its whole row or card with an invisible
  // ::before or ::after pinned to the edges of a positioned parent; the press area is then that parent, not the link's text.
  const pressArea = (el) => {
    let r = el.getBoundingClientRect();
    for (const pseudo of ["::before", "::after"]) {
      const s = getComputedStyle(el, pseudo);
      if (!s || s.content === "none" || s.position !== "absolute" || s.pointerEvents === "none" || s.display === "none") continue;
      if ([s.top, s.right, s.bottom, s.left].some((v) => v === "auto")) continue;
      const host = getComputedStyle(el).position !== "static" ? el : el.offsetParent;
      if (!host) continue;
      const h = host.getBoundingClientRect();
      const left = Math.min(r.left, h.left + parseFloat(s.left)), top = Math.min(r.top, h.top + parseFloat(s.top));
      const right = Math.max(r.right, h.right - parseFloat(s.right)), bottom = Math.max(r.bottom, h.bottom - parseFloat(s.bottom));
      r = { left, top, right, bottom, width: right - left, height: bottom - top };
    }
    return r;
  };
  const boxes = controls.map((el) => ({ el, r: pressArea(el), sentence: inSentence(el) }));
  // A small control still passes when a 24px circle on it touches no other control (WCAG 2.5.8).
  const crowded = (box) => {
    const [cx, cy] = centre(box.r);
    return boxes.some((other) => {
      if (other === box || other.el.contains(box.el) || box.el.contains(other.el)) return false;
      const small = other.r.width < 24 || other.r.height < 24;
      if (small) {
        const [ox, oy] = centre(other.r);
        if (Math.hypot(cx - ox, cy - oy) < 24) return true;
      }
      const nx = Math.max(other.r.left, Math.min(cx, other.r.right));
      const ny = Math.max(other.r.top, Math.min(cy, other.r.bottom));
      return Math.hypot(cx - nx, cy - ny) < 12;
    });
  };
  const label = (el) => words(el) || el.getAttribute("aria-label") || el.tagName.toLowerCase();
  const under24 = [];
  const under44 = [];
  const unnamed = [];
  for (const box of boxes) {
    const { el, r } = box;
    if (!box.sentence && !squeezed(el)) {
      if ((r.width < 24 || r.height < 24) && crowded(box)) under24.push({ text: label(el), at: where(el) });
      if (r.width < 44 || r.height < 44) under44.push({ text: label(el), at: where(el) });
    }
    const labelled = el.getAttribute("aria-labelledby") && document.getElementById(el.getAttribute("aria-labelledby").split(" ")[0]);
    const hasLabel = el.labels && el.labels.length;
    const picture = el.querySelector("img[alt]:not([alt=''])");
    const name = words(el) || (el.getAttribute("aria-label") || "").trim() || labelled || hasLabel || (el.getAttribute("title") || "").trim() || picture || (el.matches("input") && (el.value && /^(submit|button|reset)$/.test(el.type)));
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
  let boxed = 0;
  let shadowed = 0;
  for (const el of all) {
    const s = getComputedStyle(el);
    if (parseFloat(s.borderTopWidth) > 0 && parseFloat(s.borderBottomWidth) > 0 && parseFloat(s.borderLeftWidth) > 0 && s.borderTopStyle !== "none" && rgba(s.borderTopColor)[3] > 0) boxed += 1;
    if (s.boxShadow && s.boxShadow !== "none") shadowed += 1;
    if (s.borderTopLeftRadius !== "0px") radii.add(s.borderTopLeftRadius);
    const back = rgba(s.backgroundColor);
    if (back[3] > 0) backColours.add(back.slice(0, 3).join(","));
  }

  const view = document.querySelector('meta[name="viewport"]');
  const viewText = view ? view.getAttribute("content") || "" : "";
  const maxScale = /maximum-scale\s*=\s*([\d.]+)/.exec(viewText);
  const cut = (list) => ({ count: list.length, first: list.slice(0, LIMIT) });

  return {
    width: innerWidth,
    height: innerHeight,
    // True when the browser is behaving as a touch device. Phone sizes should be measured this way.
    touch: matchMedia("(pointer: coarse)").matches,
    text: {
      checked: textChecked,
      overPictureNotMeasured: { count: textUnmeasured, first: overPictures },
      lowContrast: cut(lowContrast.sort((a, b) => a.ratio - b.ratio)),
    },
    // How much is on the screen, for jobs that report a before and an after.
    // Things that draw the eye. Movement that never stops is counted; a still picture cannot show it.
    noise: {
      filledButtons: controls.filter((el) => rgba(getComputedStyle(el).backgroundColor)[3] > 0.5).length,
      borderedBoxes: boxed,
      shadows: shadowed,
      endlessMovement: (document.getAnimations ? document.getAnimations() : []).filter((a) => a.playState === "running" && a.effect && a.effect.getComputedTiming().iterations === Infinity).length,
    },
    onScreen: { textPieces: textChecked + textUnmeasured, controls: controls.length, headings: headings.length, pictures: all.filter((el) => el.matches("img, svg, video, canvas, picture")).filter((el) => !el.closest("svg svg") && !(el.tagName === "IMG" && el.closest("picture"))).length },
    controls: { count: controls.length, under24: cut(under24), under44: cut(under44), unnamed: cut(unnamed) },
    picturesWithoutText: cut(picturesWithoutText),
    headings: { count: headings.length, mainHeadings: headings.filter((h) => h.level === 1).length, skipped },
    sidewaysScroll: document.documentElement.scrollWidth > innerWidth + 1 ? document.documentElement.scrollWidth - innerWidth : 0,
    languageSet: Boolean(document.documentElement.getAttribute("lang")),
    zoomBlocked: /user-scalable\s*=\s*(no|0)/.test(viewText) || Boolean(maxScale && Number(maxScale[1]) < 2),
    variety: {
      textSizes: [...sizes.entries()].sort((a, b) => b[0] - a[0]).map(([px, uses]) => ({ px, uses })),
      smallestText: sizes.size ? Math.min(...sizes.keys()) : null,
      fontFamilies: [...families],
      // Counted by colour alone: the same colour at different strengths is one.
      // Each combination of size, weight and line height in use, most used first: the text ladder as built.
      textStyles: [...styles.entries()].sort((a, b) => b[1].uses - a[1].uses).slice(0, 20).map(([style, v]) => ({ style, uses: v.uses, example: v.example })),
      textColours: textColours.size,
      textColourValues: [...textColours].slice(0, 20).map((c) => "rgb(" + c + ")"),
      backgroundColours: backColours.size,
      backgroundColourValues: [...backColours].slice(0, 20).map((c) => "rgb(" + c + ")"),
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

if (process.argv[1] && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) process.stdout.write(pageScript() + "\n");
