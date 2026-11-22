#!/usr/bin/env node
// Finds the colours and colour tokens a project uses. Reads files and prints; changes nothing, sends nothing.
//   node extract.mjs <folder or file> [more paths] [--json <file>]
// It reads source text, so a colour built at runtime won't show. Use capture-page.js on the running page for those.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { clamp, oklch, oklabLinear, rgbHex } from "./palette.mjs";
import { safePath, writeSafe } from "./safe-files.mjs";

const SKIP_DIR = /(^|\/)(node_modules|\.git|\.next|\.nuxt|\.svelte-kit|\.output|\.turbo|\.cache|\.worktrees|\.artifacts|dist|build|out|coverage|vendor|Pods|DerivedData|__pycache__|\.venv|venv)(\/|$)/;
const SKIP_FILE = /(\.min\.(js|css)|\.map|\.lock|lock\.json|\.snap|\.d\.ts)$/i;
const STYLE = /\.(css|scss|sass|less|pcss|styl)$/i;
const MARKUP = /\.(html?|vue|svelte|astro)$/i;
const CODE = /\.([cm]?[jt]sx?|mdx|json|erb|php|liquid|hbs|njk|twig|swift|kt|dart)$/i;
const TOKEN_FILE = /(theme|token|colou?r|palette|tailwind\.config|brand)/i;
const MAX_BYTES = 1_500_000;

const channel = (v, scale) => (v === "none" ? 0 : v.endsWith("%") ? parseFloat(v) / 100 : parseFloat(v) / scale);
const gamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function parseColor(input) {
  const s = String(input).trim();
  let m = s.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (m) {
    const h = m[1].length < 5 ? [...m[1]].map((x) => x + x).join("") : m[1];
    return { hex: ("#" + h.slice(0, 6)).toUpperCase(), alpha: h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1, format: "hex" };
  }
  if (/^(white|black)$/i.test(s)) return { hex: /^white$/i.test(s) ? "#FFFFFF" : "#000000", alpha: 1, format: "hex" };
  if (!(m = s.match(/^(rgba?|hsla?|oklch|oklab)\(([^()]+)\)$/i))) return null;
  const fn = m[1].toLowerCase().replace(/^(rgb|hsl)a$/, "$1"), [body, slash] = m[2].split("/");
  const v = body.trim().split(/[\s,]+/), a = slash?.trim() ?? v[3], alpha = a === undefined ? 1 : channel(a, 1);
  if (v.length < 3 || !v.slice(0, 3).every((x) => x === "none" || /^[+-]?(\d*\.)?\d+(deg|%)?$/i.test(x))) return null;
  const num = (x) => (x === "none" ? 0 : parseFloat(x));
  let hex;
  if (fn === "rgb") hex = rgbHex(v.slice(0, 3).map((x) => channel(x, 255)));
  else if (fn === "hsl") {
    const h = ((num(v[0]) % 360) + 360) % 360, l = num(v[2]) / 100, A = (num(v[1]) / 100) * Math.min(l, 1 - l);
    hex = rgbHex([0, 8, 4].map((n) => { const k = (n + h / 30) % 12; return l - A * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }));
  } else if (fn === "oklch") hex = oklch(channel(v[0], 1), v[1].endsWith("%") ? num(v[1]) * 0.004 : num(v[1]), num(v[2]));
  else {
    const ab = (x) => (x.endsWith("%") ? num(x) * 0.004 : num(x));
    hex = rgbHex(oklabLinear(channel(v[0], 1), ab(v[1]), ab(v[2])).map((x) => gamma(clamp(x))));
  }
  return { hex, alpha: Number.isFinite(alpha) ? alpha : 1, format: fn };
}

// A token can hold bare channels: `240 10% 4%` (shadcn), `15 18 34`, `0.62 0.19 259`.
export function parseChannels(name, value) {
  const s = value.trim();
  const comma = s.includes(",") ? "-comma" : "";
  if (/^[\d.]+(deg)?(\s+|\s*,\s*)[\d.]+%(\s+|\s*,\s*)[\d.]+%$/.test(s)) return { ...parseColor(`hsl(${s})`), format: `hsl-channels${comma}` };
  if (!/colou?r|bg|background|foreground|ink|text|surface|primary|secondary|accent|muted|border|brand|paper|card|fill/i.test(name)) return null;
  const m = s.match(/^([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)$/);
  if (!m) return null;
  const [a, b, c] = m.slice(1).map(Number);
  if (!comma && a <= 1 && b < 0.5 && c <= 360 && s.includes(".")) return { ...parseColor(`oklch(${a} ${b} ${c})`), format: "oklch-channels" };
  if ([a, b, c].every((x) => Number.isInteger(x) && x <= 255)) return { ...parseColor(`rgb(${a} ${b} ${c})`), format: `rgb-channels${comma}` };
  return null;
}

export function colorsIn(value) {
  const re = /(?:rgba?|hsla?|oklch|oklab)\([^()]*\)|(?<![\w&/-])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\w-])/gi;
  return (value.replace(/url\([^)]*\)/gi, "").match(re) || []).map(parseColor).filter(Boolean);
}

// Every declaration in a stylesheet, with the selectors around it. Not a validating parser.
export function declarations(css, lineComments = false) {
  const out = [], stack = [];
  let buf = "", line = 1, start = 1, depth = 0, quote = "";
  const finish = () => {
    const d = buf.match(/^\s*([\w$@-]+)\s*:\s*([\s\S]+?)\s*$/);
    if (d) out.push({ name: d[1], value: d[2].replace(/\s*!(important|default)$/, ""), scope: stack.filter((s) => s !== "&").join(" "), line: start });
    buf = "";
  };
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (!quote && c === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2), stop = end < 0 ? css.length : end + 2;
      line += css.slice(i, stop).split("\n").length - 1; i = stop - 1; continue;
    }
    if (lineComments && !quote && !depth && c === "/" && css[i + 1] === "/") {
      while (i + 1 < css.length && css[i + 1] !== "\n") i++;
      continue;
    }
    if (c === "\n") line++;
    if (!buf) { if (/\s/.test(c)) continue; start = line; }
    if (quote) { if (c === "\\" && i + 1 < css.length) { buf += c + css[++i]; continue; } if (c === quote) quote = ""; }
    else if (c === '"' || c === "'") quote = c;
    else if (c === "(") depth++;
    else if (c === ")") depth = Math.max(0, depth - 1);
    else if (!depth && c === "{") { stack.push(buf.trim().replace(/\s+/g, " ")); buf = ""; continue; }
    else if (!depth && c === "}") { finish(); stack.pop(); continue; }
    else if (!depth && c === ";") { finish(); continue; }
    buf += c;
  }
  finish();
  return out;
}

export function useOf(prop) {
  const p = prop.toLowerCase();
  if (/^(--|\$|@)/.test(p)) return "token";
  if (/shadow/.test(p)) return "shadow";
  if (/border|outline|divide|ring/.test(p)) return "edge";
  if (/background|^bg|^from$|^to$|^via$/.test(p)) return "background";
  if (/^(color|caret-color|-webkit-text-fill-color|text|placeholder)$/.test(p)) return "text";
  if (/fill|stroke/.test(p)) return "graphic";
  return "other";
}

function list(target) {
  if (fs.statSync(target).isFile()) return [target];
  try {
    // fsmonitor off: a scanned repo's git config must not be able to start a program.
    const out = execFileSync("git", ["-c", "core.fsmonitor=false", "-C", target, "ls-files", "-co", "--exclude-standard", "-z", "--", "."], { encoding: "utf8", maxBuffer: 64e6, stdio: ["ignore", "pipe", "ignore"] });
    const files = out.split("\0").filter((f) => f && !SKIP_DIR.test(f)).map((f) => path.join(target, f));
    if (files.length) return files;
  } catch { /* not a git folder: walk it */ }
  const found = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory() && !SKIP_DIR.test(path.relative(target, full).replaceAll("\\", "/"))) walk(full);
      else if (e.isFile()) found.push(full);
    }
  };
  walk(target);
  return found;
}

// The deepest folder holding every target, so two files called tokens.css keep different paths.
function commonBase(dirs) {
  let base = dirs[0];
  const inside = (dir) => { const rel = path.relative(base, dir); return rel.split(path.sep)[0] !== ".." && !path.isAbsolute(rel); };
  while (!dirs.every(inside)) {
    if (path.dirname(base) === base) return null; // different drives
    base = path.dirname(base);
  }
  return base;
}

export function scan(targets) {
  const colors = new Map(), tokens = [], families = new Map(), utilities = new Map(), refs = new Map();
  let filesRead = 0, filesSkipped = 0;
  const bump = (map, key) => map.set(key, (map.get(key) || 0) + 1);
  // Most real use goes through var(--token), so count those too or the page colour looks rare.
  const refer = (value, use) => {
    for (const m of value.matchAll(/var\(\s*(--[\w-]+)/g)) {
      const u = refs.get(m[1]) || {};
      u[use] = (u[use] || 0) + 1;
      refs.set(m[1], u);
    }
  };
  const see = (color, use, at) => {
    if (!color || color.alpha === 0) return;
    const c = colors.get(color.hex) || { hex: color.hex, count: 0, viaTokens: 0, seeThrough: 0, uses: {}, at: [], hardCoded: [] };
    c.count++; c.uses[use] = (c.uses[use] || 0) + 1;
    if (color.alpha < 1) c.seeThrough++;
    // Literals that won't follow a token change.
    if (use !== "token" && use !== "shadow" && color.alpha === 1 && !c.hardCoded.includes(at)) c.hardCoded.push(at);
    if (c.at.length < 3 && !c.at.includes(at)) c.at.push(at);
    colors.set(color.hex, c);
  };

  const roots = targets.map((t) => path.resolve(t)).map((target) => ({ target, dir: fs.statSync(target).isFile() ? path.dirname(target) : target }));
  const base = commonBase(roots.map((r) => r.dir)), done = new Set();
  for (const { target, dir } of roots) {
    for (const file of list(target).map((f) => path.resolve(f))) {
      if (done.has(file)) continue;
      done.add(file);
      const local = path.relative(dir, file).replaceAll("\\", "/"), rel = (base ? path.relative(base, file) : file).replaceAll("\\", "/");
      if (SKIP_FILE.test(rel) || !(STYLE.test(rel) || MARKUP.test(rel) || CODE.test(rel))) continue;
      const tokenFile = TOKEN_FILE.test(local);
      if (/\.json$/i.test(rel) && !tokenFile) continue;
      let text;
      try {
        // Never follow a link out of the folder the user pointed at.
        const st = fs.lstatSync(file);
        if (!st.isFile()) continue;
        if (st.size > MAX_BYTES) { filesSkipped++; continue; }
        text = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
      } catch { filesSkipped++; continue; }
      filesRead++;

      const css = (source, offset, lineComments) => {
        for (const d of declarations(source, lineComments)) {
          const line = d.line + offset, at = `${rel}:${line}`;
          const token = /^(--|\$)/.test(d.name) || (/\.less$/i.test(rel) && d.name.startsWith("@"));
          if (/^(font-family|--font[\w-]*)$/.test(d.name) && /[a-z]/i.test(d.value)) bump(families, d.value.replace(/\s+/g, " "));
          const bare = token ? parseChannels(d.name, d.value) : null;
          if (token) {
            const color = bare || parseColor(d.value);
            const indirect = !/font|shadow|size|space|radius|ease|duration/i.test(d.name) && /^((hsla?|rgba?|oklch)\(\s*)?var\(|^(color-mix|light-dark|lab|lch|color)\(|^\$/i.test(d.value);
            if (color || indirect) tokens.push({ name: d.name, value: d.value, scope: d.scope || "(top level)", file: rel, line, ...color });
          }
          if (!token) refer(d.value, useOf(d.name));
          if (bare) { see(bare, "token", at); continue; }
          for (const c of colorsIn(d.value)) see(c, useOf(d.name), at);
          if (/^(color|background(-color)?|border(-\w+)?)$/.test(d.name)) for (const w of d.value.match(/(?<![\w-])(white|black)(?![\w-])/gi) || []) see(parseColor(w), useOf(d.name), at);
        }
      };
      if (STYLE.test(rel)) { css(text, 0, !/\.css$/i.test(rel)); continue; }

      let rest = text;
      if (MARKUP.test(rel)) {
        // Read <style> as CSS, then blank it so it isn't counted twice and line numbers still match.
        rest = text.replace(/<style[^>]*>([\s\S]*?)<\/style[^>]*>/gi, (all, body, at) => {
          css(body, text.slice(0, at + all.indexOf(body)).split("\n").length - 1, false);
          return all.replace(/[^\n]/g, " ");
        });
      }
      rest.split("\n").forEach((source, i) => {
        if (source.length > 20000) return;
        const at = `${rel}:${i + 1}`;
        for (const m of source.matchAll(/(?<![\w-])(bg|text|border|ring|fill|stroke|from|to|via|divide|outline)-((?:slate|gr[ae]y|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|[1-9]00|950)|white|black)(?![\w-])/g)) bump(utilities, `${m[1]}-${m[2]}`);
        refer(source, "markup");
        // Arbitrary utilities (bg-[#111]) say what the colour is for.
        const line = source.replace(/([a-z]+)-\[((?:#|rgba?\(|hsla?\(|oklch\()[^\]\s]+)\]/gi, (_, prefix, value) => {
          see(parseColor(value.replaceAll("_", " ")), useOf(prefix), at);
          return " ";
        });
        for (const m of line.matchAll(/["']?([\w$-]+)["']?\s*[:=]\s*(?:Color\()?["'`]([^"'`]+)["'`]/g)) {
          const color = parseColor(m[2]);
          if (color && (m[1].startsWith("--") || tokenFile)) tokens.push({ name: m[1], value: m[2], scope: "(code)", file: rel, line: i + 1, ...color });
          if (/^fontFamily$/i.test(m[1])) bump(families, m[2]);
        }
        const re = /(?<![\w&/-])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\w-])|(?:rgba?|hsla?|oklch|oklab)\([^()]*\)|0x[0-9a-f]{8}\b/gi;
        for (const m of line.matchAll(re)) {
          let raw = m[0];
          const before = line.slice(0, m.index);
          // #123 is an issue and #add is an anchor: short hex counts only as a whole quoted string or CSS value.
          if (/^#[0-9a-f]{3,4}$/i.test(raw) && !(/["'`]$/.test(before) && /^["'`]/.test(line.slice(m.index + raw.length)) && !/href\s*=\s*["']$/.test(before)) && !/(color|background|border|fill|stroke)\s*:\s*$/i.test(before)) continue;
          if (/^0x/i.test(raw)) { if (!/Color\($/.test(before)) continue; raw = `#${raw.slice(4)}${raw.slice(2, 4)}`; }
          const prop = before.match(/([\w-]+)["']?\s*[:=]\s*\{?\s*["'`]?$/)?.[1] || "";
          // A bare "color" key in data says nothing about where it is painted.
          see(parseColor(raw), prop === "color" && !/style|css/i.test(before) ? "other" : useOf(prop), at);
        }
      });
    }
  }

  // Aliases: follow var(), preferring a value from the same scope, then :root.
  const byName = new Map();
  for (const t of tokens) { if (!byName.has(t.name)) byName.set(t.name, []); byName.get(t.name).push(t); }
  const resolve = (t, depth = 0) => {
    if (t.hex || depth > 8) return t.hex ? t : null;
    const m = t.value.match(/^(?:(?:hsla?|rgba?|oklch)\(\s*)?var\(\s*(--[\w-]+)/) || t.value.match(/^(\$[\w-]+)$/);
    const list = (m && byName.get(m[1])) || [];
    const next = list.find((x) => x.scope === t.scope && x !== t) || list.find((x) => /(^| ):root$|@theme|\(top level\)/.test(x.scope) && x !== t) || list.find((x) => x !== t);
    return next ? resolve(next, depth + 1) : null;
  };
  for (const t of tokens) {
    if (refs.has(t.name)) t.used = refs.get(t.name);
    if (t.hex) continue;
    const found = resolve(t);
    if (found) Object.assign(t, { resolves: found.hex, via: found.name });
  }
  // A colour used through a token is as "in use" as a pasted one.
  const credited = new Set();
  for (const t of tokens) {
    const c = colors.get(t.hex || t.resolves), key = t.name + (t.hex || t.resolves);
    if (!c || !t.used || credited.has(key)) continue;
    credited.add(key);
    c.viaTokens += Object.values(t.used).reduce((a, b) => a + b, 0);
  }

  const ranked = (map) => [...map].sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }));
  return { base, filesRead, filesSkipped, tokens, colors: [...colors.values()].sort((a, b) => b.count + b.viaTokens - (a.count + a.viaTokens)), fonts: ranked(families), utilities: ranked(utilities) };
}

function main(argv) {
  const j = argv.indexOf("--json"), json = j >= 0 ? argv[j + 1] : null;
  const targets = argv.filter((_, i) => j < 0 || (i !== j && i !== j + 1));
  if (!targets.length || targets.some((t) => t.startsWith("--")) || (j >= 0 && !json)) {
    console.error("Usage: node extract.mjs <folder or file> [more paths] [--json <file>]");
    return 2;
  }
  for (const t of targets) if (!fs.existsSync(t)) { console.error(`Not found: ${t}`); return 2; }
  let r;
  try {
    if (json) safePath(json); // before the scan, so a bad path fails fast
    r = scan(targets);
    if (json) writeSafe(json, JSON.stringify(r, null, 1), ".json");
  } catch (e) { console.error(e.message); return 1; }

  if (targets.length > 1 && r.base) console.log(`File paths below are relative to ${r.base}`);
  console.log(`Read ${r.filesRead} files${r.filesSkipped ? `, skipped ${r.filesSkipped} too large or unreadable` : ""}. ${r.colors.length} distinct colours, ${r.tokens.length} colour tokens.`);
  const used = new Map(r.tokens.filter((t) => t.used).map((t) => [t.name, t.used])), total = (u) => Object.values(u).reduce((a, b) => a + b, 0);
  const colour = r.tokens.filter((t) => t.hex || t.resolves);
  console.log(`\nTOKENS (${Math.min(colour.length, 120)} of ${colour.length})  name  value  scope  file:line`);
  for (const t of colour.slice(0, 120)) console.log(`  ${t.name}  ${t.hex || t.resolves}${t.alpha < 1 ? `@${+t.alpha.toFixed(2)}` : ""}${t.hex ? ` (${t.format})` : ` (via ${t.via})`}  [${t.scope}]  ${t.file}:${t.line}`);
  if (used.size) {
    console.log("\nTOKENS BY USE (how often var() points at each)");
    for (const [name, u] of [...used].sort((a, b) => total(b[1]) - total(a[1])).slice(0, 30)) console.log(`  ${name}  x${total(u)}  ${Object.entries(u).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  }
  console.log(`\nCOLOURS BY USE (${Math.min(r.colors.length, 50)} of ${r.colors.length})`);
  for (const c of r.colors.slice(0, 50)) console.log(`  ${c.hex}  x${c.count + c.viaTokens}${c.viaTokens ? ` (${c.viaTokens} through tokens)` : ""}${c.seeThrough ? ` (${c.seeThrough} see-through)` : ""}  ${Object.entries(c.uses).map(([k, v]) => `${k} ${v}`).join(", ")}  ${c.at[0]}`);
  if (r.utilities.length) console.log(`\nSTOCK TAILWIND CLASSES (shades come from the installed Tailwind theme)\n  ${r.utilities.slice(0, 40).map((u) => `${u.value} x${u.count}`).join(", ")}`);
  if (r.fonts.length) console.log(`\nFONTS\n${r.fonts.slice(0, 10).map((f) => `  ${f.value}  x${f.count}`).join("\n")}`);
  const unread = r.tokens.filter((t) => !t.hex && !t.resolves);
  if (unread.length) console.log(`\nNOT RESOLVED (${unread.length}; read these on the running page)\n${unread.slice(0, 20).map((t) => `  ${t.name}: ${t.value.replace(/\s+/g, " ").slice(0, 100)}  ${t.file}:${t.line}`).join("\n")}`);
  if (!r.colors.length) console.log("\nNo colours found in source. Run capture-page.js on the running page, or ask for a screenshot.");
  if (json) console.log(`\nFull results: ${json}`);
  return 0;
}

if (process.argv[1] && path.basename(process.argv[1]) === "extract.mjs") process.exitCode = main(process.argv.slice(2));
