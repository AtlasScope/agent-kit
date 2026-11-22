// Colour maths and the role model, shared by extract.mjs, build.mjs and the workbook page.
// build.mjs pastes this file into the page with the `export` keywords removed, so it has no imports.

export const HEX = /^#[0-9A-F]{6}$/i;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const hue360 = (h) => ((h % 360) + 360) % 360;
export const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
export const rgbHex = (rgb) => "#" + rgb.map((v) => Math.round(clamp(v) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function lum(hex) {
  const [r, g, b] = hexRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function ratio(a, b) {
  const x = lum(a), y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
// Rounded down, so a failing 4.496:1 never reads as 4.5:1.
export const showRatio = (v) => (Math.floor(v * 10) / 10).toFixed(1);

export function oklabLinear(L, a, b) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}
// Out-of-gamut colours keep their lightness and hue and give up chroma.
export function oklch(L, C, H) {
  const at = (c) => oklabLinear(L, c * Math.cos((H * Math.PI) / 180), c * Math.sin((H * Math.PI) / 180));
  const fits = (rgb) => rgb.every((v) => v >= -0.0005 && v <= 1.0005);
  let rgb = at(C);
  if (!fits(rgb)) {
    let lo = 0, hi = C;
    for (let i = 0; i < 14; i++) { const mid = (lo + hi) / 2; if (fits(at(mid))) lo = mid; else hi = mid; }
    rgb = at(lo);
  }
  return rgbHex(rgb.map((v) => toGamma(clamp(v))));
}
export function toOklch(hex) {
  const [r, g, b] = hexRgb(hex).map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, Math.hypot(A, B), hue360((Math.atan2(B, A) * 180) / Math.PI)];
}
export function toHsl(hex) {
  const [r, g, b] = hexRgb(hex), max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min, l = (max + min) / 2;
  if (!d) return [0, 0, l * 100];
  const h = max === r ? (g - b) / d : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [hue360(h * 60), (d / (1 - Math.abs(2 * l - 1))) * 100, l * 100];
}

// How a token is written in the project. Pasting a hex into a token that holds bare HSL channels breaks it,
// and so does swapping the commas in one read by rgba(var(--x), .5) for spaces.
export const FORMATS = ["hex", "rgb", "rgb-channels", "rgb-channels-comma", "hsl", "hsl-channels", "hsl-channels-comma", "oklch", "oklch-channels"];
export function formatColor(hex, format = "hex") {
  if (format.endsWith("-comma")) return formatColor(hex, format.slice(0, -6)).split(" ").join(", ");
  const n = (v, d) => String(+v.toFixed(d));
  const rgb = hexRgb(hex).map((v) => Math.round(v * 255));
  if (format === "rgb") return `rgb(${rgb.join(" ")})`;
  if (format === "rgb-channels") return rgb.join(" ");
  if (format.startsWith("hsl")) {
    const [h, s, l] = toHsl(hex), body = `${n(h, 2)} ${n(s, 2)}% ${n(l, 2)}%`;
    return format === "hsl" ? `hsl(${body})` : body;
  }
  if (format.startsWith("oklch")) {
    const [L, C, H] = toOklch(hex), body = `${n(L, 4)} ${n(C, 4)} ${C < 0.0005 ? 0 : n(H, 2)}`;
    return format === "oklch" ? `oklch(${body})` : body;
  }
  return hex.toUpperCase();
}

// Families: greys vary by the tint hidden in them, coloured roles by full hue.
export const TINTS = [["Neutral", 0, 0], ["Cool", 258, 0.016], ["Navy", 262, 0.032], ["Blue", 245, 0.045], ["Indigo", 277, 0.03], ["Violet", 300, 0.028], ["Teal", 195, 0.025], ["Green", 155, 0.022], ["Olive", 115, 0.022], ["Sand", 80, 0.026], ["Warm", 55, 0.016], ["Rose", 10, 0.024]];
export const HUES = [["Neutral", 0, 0], ["Blue", 255, 1], ["Sky", 232, 1], ["Cyan", 210, 1], ["Teal", 182, 1], ["Green", 150, 1], ["Lime", 128, 1], ["Yellow", 100, 1], ["Amber", 78, 1], ["Orange", 52, 1], ["Red", 27, 1], ["Pink", 355, 1], ["Violet", 300, 1], ["Indigo", 275, 1]];

// Useful lightness for each type of role on dark and on light pages. `color` roles get full hues.
export const TYPES = {
  page: { dark: [0.08, 0.22], light: [0.92, 1] },
  surface: { dark: [0.15, 0.34], light: [0.88, 1] },
  line: { dark: [0.24, 0.42], light: [0.82, 0.94] },
  control: { dark: [0.45, 0.64], light: [0.5, 0.68] },
  text: { dark: [0.88, 1], light: [0.1, 0.3] },
  text2: { dark: [0.62, 0.84], light: [0.32, 0.5] },
  text3: { dark: [0.55, 0.72], light: [0.4, 0.58] },
  fill: { dark: [0.45, 0.97], light: [0.2, 0.75], color: true },
  "on-fill": { dark: [0.1, 0.99], light: [0.1, 0.99], color: true },
  accent: { dark: [0.6, 0.93], light: [0.34, 0.64], color: true },
  signal: { dark: [0.64, 0.93], light: [0.36, 0.72], color: true },
};
export const isColor = (role) => (role.kind ? role.kind === "color" : !!TYPES[role.type].color);
const tintScale = (role) => (role.type === (role.side === "dark" ? "text" : "page") ? 0.4 : 1);

export function roleRange(role, hex) {
  if (role.range) return role.range;
  // Stretch to the project's own colour so an unusual page still gets shades around what it uses.
  const L = toOklch(hex)[0], type = TYPES[role.type];
  const away = ([lo, hi]) => Math.max(lo - L, L - hi, 0);
  // A palette can flip a surface (a dark rail turned yellow), so greys take the side the colour is now on.
  let side = role.side;
  if (!type.color && away(type[side]) > 0.15) side = away(type.dark) < away(type.light) ? "dark" : "light";
  const [a, b] = type[side];
  return [Math.min(a, Math.max(0, L - 0.02)), Math.max(b, Math.min(1, L + 0.02))];
}
export function familyOf(hex, color) {
  const [, C, H] = toOklch(hex), list = color ? HUES : TINTS;
  if (C < (color ? 0.03 : 0.006)) return list[0][0];
  const gap = (h) => Math.min(hue360(h - H), hue360(H - h));
  return list.slice(1).reduce((best, f) => (gap(f[1]) < gap(best[1]) ? f : best))[0];
}
export function familyPreview(role, family, range, color) {
  const [, H, C] = family, [a, b] = range;
  if (color) return C ? oklch(clamp(0.74, a, b), 0.16, H) : oklch((a + b) / 2, 0, 0);
  return oklch((a + b) / 2, C * tintScale(role) * 1.6, H);
}
export function shadeRows(role, family, range, color) {
  const [, H, C] = family, [a, b] = range;
  const steps = (c) => Array.from({ length: 7 }, (_, i) => oklch(a + ((b - a) * i) / 6, c, H));
  if (!C) return [["Grey", steps(0)]];
  if (color) return [["Soft", steps(0.06)], ["Mid", steps(0.13)], ["Vivid", steps(0.32)]];
  const k = C * tintScale(role);
  return [["Faint", steps(k * 0.5)], ["Tinted", steps(k)], ["Strong", steps(k * 2.2)]];
}
// A palette's `tint` re-hues the greys and keeps each one's lightness.
export const applyTint = (role, hex, [H, C]) => oklch(toOklch(hex)[0], C * tintScale(role), H);

export function failures(roles, values) {
  const out = [];
  for (const role of roles) for (const [bg, min] of role.against || []) {
    const got = ratio(values[role.id], values[bg]);
    if (min && got < min) out.push({ role: role.id, bg, min, got });
  }
  return out;
}
// The closest lightness at the same hue and chroma that passes every pair this role is the foreground of.
export function nearestPassing(role, values) {
  const pairs = (role.against || []).filter(([, min]) => min), [L, C, H] = toOklch(values[role.id]);
  for (let d = 0; d <= 1; d += 0.004) for (const at of [L + d, L - d]) {
    if (at < 0 || at > 1) continue;
    const hex = oklch(at, C, H);
    if (pairs.every(([bg, min]) => ratio(hex, values[bg]) >= min)) return hex;
  }
  return null;
}
