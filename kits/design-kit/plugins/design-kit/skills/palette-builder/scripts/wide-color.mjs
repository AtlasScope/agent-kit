#!/usr/bin/env node
// Wide-color finish: turns sRGB hex colors into the OKLCH values to use on Display P3 screens.
// Lightness and hue stay the same. Chroma (saturation) moves `amount` (default 0.9) of the way from where it is to the
// Display P3 edge for that lightness and hue, scaled by the square of how saturated the color already is in sRGB:
// a color at the sRGB edge goes 90% of the way, a half-saturated one a quarter of that, a muted one almost nothing.
// Grays, near-white and near-black are left alone. See ../references/wide-color.md.
//
//   node wide-color.mjs '#39FF88' '#2563EB'
//   node wide-color.mjs --accent=#39FF88 --danger=#DC2626
//   node wide-color.mjs --css app/globals.css          custom properties written as hex, grouped by the rule they sit in
//   options: --amount 0.9   --selector ':root' (for --name=#hex tokens)   --json
// Prints a table and a ready `@media (color-gamut: p3) { @supports (color: oklch(0 0 0)) { … } }` block. Node 18+, no packages, reads only the files named.
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { HEX, hexRgb, toOklch, oklabLinear } from "./palette.mjs";

const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(c, 0) ** (1 / 2.4) - 0.055);
// Linear sRGB to linear Display P3 (same D65 white point).
const toP3 = ([r, g, b]) => [
  0.8224621 * r + 0.177538 * g,
  0.0331941 * r + 0.9668058 * g,
  0.0170827 * r + 0.0723974 * g + 0.9105199 * b,
];
const linearAt = (L, C, H) => oklabLinear(L, C * Math.cos((H * Math.PI) / 180), C * Math.sin((H * Math.PI) / 180));
const fits = (rgb) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

export function maxChroma(L, H, space = "p3") {
  const inside = (c) => fits(space === "p3" ? toP3(linearAt(L, c, H)) : linearAt(L, c, H));
  let lo = 0, hi = 0.5;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (inside(mid)) lo = mid; else hi = mid; }
  return lo;
}

const fmt = (L, C, H) => `oklch(${+(L * 100).toFixed(1)}% ${+C.toFixed(3)} ${+H.toFixed(1)})`;

export function widen(hex, amount = 0.9) {
  if (!HEX.test(hex)) throw new Error(`not a #RRGGBB color: ${hex}`);
  hex = hex.toUpperCase();
  const [L, C, H] = toOklch(hex);
  const base = { hex, srgb: fmt(L, C, H), L, C, H };
  if (C < 0.03 || L > 0.985 || L < 0.03) return { ...base, skip: "gray, near-white or near-black: no change", oklch: null };
  const maxS = maxChroma(L, H, "srgb"), maxP = maxChroma(L, H, "p3");
  const C2 = Math.min(maxP, C + amount * Math.min(1, C / maxS) ** 2 * Math.max(0, maxP - C));
  const p3 = toP3(linearAt(L, C2, H)).map((v) => +gam(Math.min(1, Math.max(0, v))).toFixed(4));
  return { ...base, oklch: fmt(L, C2, H), p3: `color(display-p3 ${p3.join(" ")})`, chroma: { from: +C.toFixed(3), to: +C2.toFixed(3), p3Max: +maxP.toFixed(3) } };
}

// Custom properties written as hex, with the innermost rule each sits in. A token set inside another media query
// (a dark theme under prefers-color-scheme, say) is reported with that rule's selector only: nest its P3 line the
// same way by hand.
export function hexTokens(css) {
  const out = [];
  css = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const rule of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const selector = rule[1].trim().replace(/\s+/g, " ");
    for (const m of rule[2].matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-f]{3}(?:[0-9a-f]{3})?)\s*(?:;|$)/gi)) {
      let v = m[2].toUpperCase();
      if (v.length === 4) v = "#" + [...v.slice(1)].map((c) => c + c).join("");
      if (!out.some((t) => t.name === m[1] && t.hex === v && t.selector === selector)) out.push({ name: m[1], hex: v, selector });
    }
  }
  return out;
}

export function block(rows, selector = ":root") {
  const groups = new Map();
  for (const r of rows.filter((r) => r.oklch && r.name)) {
    const s = r.selector || selector;
    if (!groups.has(s)) groups.set(s, []);
    groups.get(s).push(`    ${r.name}: ${r.oklch}; /* ${r.hex} */`);
  }
  if (!groups.size) return "";
  const body = [...groups].map(([s, lines]) => `    ${s} {\n${lines.map((l) => "  " + l).join("\n")}\n    }`).join("\n");
  // @supports: a P3 browser without OKLCH would still store the value in an unregistered custom property, and every
  // declaration using it would then be invalid, losing the hex. Behind @supports such a browser keeps the hex.
  return `@media (color-gamut: p3) {\n  @supports (color: oklch(0 0 0)) {\n${body}\n  }\n}`;
}

function main(argv) {
  let amount = 0.9, selector = ":root", json = false;
  const items = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--amount") amount = Number(argv[++i]);
    else if (a === "--selector") selector = argv[++i];
    else if (a === "--json") json = true;
    else if (a === "--css") items.push(...hexTokens(fs.readFileSync(argv[++i], "utf8")));
    else if (/^--[\w-]+=#/.test(a)) { const [n, v] = a.split("="); items.push({ name: n, hex: v }); }
    else if (a.startsWith("#")) items.push({ name: null, hex: a });
    else throw new Error(`unknown argument: ${a}`);
  }
  if (!items.length || !(amount > 0 && amount <= 1)) {
    console.error("usage: node wide-color.mjs [#hex ...] [--name=#hex ...] [--css file] [--amount 0.9] [--selector :root] [--json]");
    process.exit(2);
  }
  const rows = items.map((t) => ({ name: t.name, selector: t.selector, ...widen(t.hex, amount) }));
  if (json) { console.log(JSON.stringify(rows, null, 2)); return; }
  for (const r of rows) {
    const label = (r.name ? `${r.name} ` : "") + r.hex;
    console.log(r.oklch ? `${label}  ->  ${r.oklch}   chroma ${r.chroma.from} -> ${r.chroma.to} (P3 max ${r.chroma.p3Max})` : `${label}  ->  ${r.skip}`);
  }
  const css = block(rows, selector);
  if (css) console.log("\n" + css);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  try { main(process.argv.slice(2)); } catch (e) { console.error(e.message); process.exit(1); }
}
