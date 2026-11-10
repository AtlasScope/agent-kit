#!/usr/bin/env node
// Motion inventory for a codebase. Reads source files, never runs or changes them, and has no dependencies.
// Counts every duration, easing and animated property it can find in CSS, Tailwind classes and the common
// JavaScript motion libraries, then lists the places worth a second look, each with file and line.
//
//   node motion-scan.mjs [dir] [--json] [--max 40]
//
// The findings are prompts for judgment, not verdicts: a script cannot tell an entrance from an exit.
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const root = path.resolve(args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--max") || ".");
const MAX = Number(opt("--max", 40));

const SKIP_DIR = /^(node_modules|\.git|\.next|\.nuxt|\.svelte-kit|\.turbo|\.vercel|\.cache|\.artifacts|dist|build|out|coverage|vendor|target|Pods|DerivedData|__snapshots__)$/;
const STYLE = /\.(css|scss|sass|less|pcss|styl)$/;
const MARKUP = /\.(html|vue|svelte|astro|mdx)$/;
const SCRIPT = /\.(jsx?|tsx?|mjs|cjs)$/;
const LAYOUT = /^(width|height|min-width|min-height|max-width|max-height|top|left|right|bottom|inset|inset-.*|margin|margin-.*|padding|padding-.*|font-size|line-height|border-width|gap|grid-template-.*|flex-basis)$/;
const PAINT = /^(box-shadow|filter|backdrop-filter|background|background-position|background-size|border-radius|clip-path|mask.*)$/;
const EASE_WORD = /^(ease|ease-in|ease-out|ease-in-out|linear|step-start|step-end)$/;

const files = [];
(function walk(dir) {
  let list;
  try { list = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const d of list) {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) { if (!SKIP_DIR.test(d.name)) walk(p); }
    else if ((STYLE.test(d.name) || MARKUP.test(d.name) || SCRIPT.test(d.name)) && !/\.min\.|\.d\.ts$|\.map$/.test(d.name)) {
      try { if (fs.statSync(p).size < 600_000) files.push(p); } catch { /* unreadable */ }
    }
  }
})(root);

const bump = (map, key, n = 1) => map.set(key, (map.get(key) || 0) + n);
const durations = new Map();   // ms -> count
const easings = new Map();     // normalised easing -> count
const properties = new Map();  // animated property -> count
const libraries = new Map();   // library -> files importing it
const springs = [];            // { file, line, text }
const findings = [];
const totals = { transitions: 0, animations: 0, keyframes: 0, literalDurations: 0, tokenDurations: 0, noEasing: 0, infinite: 0 };
const reduced = { css: 0, tailwind: 0, js: 0 };
const modern = { viewTransitions: 0, scrollDriven: 0, startingStyle: 0, linearEasing: 0 };

const find = (rule, level, file, line, text, why) => findings.push({ rule, level, file: path.relative(root, file) || path.basename(file), line, text: text.trim().replace(/\s+/g, " ").slice(0, 120), why });
const ms = (num, unit) => Math.round(parseFloat(num) * (unit === "s" ? 1000 : 1));
// Splits on commas that sit outside parentheses, so cubic-bezier(…) stays whole.
const splitTop = (s, sep = ",") => {
  const parts = []; let depth = 0, cur = "";
  for (const ch of s) {
    if (ch === "(") depth++; else if (ch === ")") depth--;
    if (depth === 0 && (sep === " " ? /\s/.test(ch) : ch === sep)) { if (cur.trim()) parts.push(cur.trim()); cur = ""; } else cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
};
const normEase = (e) => e.replace(/\s+/g, "").replace(/(\d)\.0+(?=[,)])/g, "$1").replace(/0\.(\d)/g, ".$1");

const QUIET = /^(opacity|color|background-color|border-color|fill|stroke|outline-color|text-decoration-color|visibility)$/;
function noteEasing(e, file, line, text, context, props = []) {
  const n = normEase(e);
  bump(easings, n);
  if (n.startsWith("linear(")) modern.linearEasing++;
  if (context === "transition" && n === "ease-in") find("ease-in", "check", file, line, text, "ease-in starts slowly, so a response to input feels late. It suits only things leaving the screen.");
  if (context === "transition" && n === "linear" && !(props.length && props.every((p) => QUIET.test(p)))) find("linear", "check", file, line, text, "Linear movement looks mechanical. It is fine for opacity, color and constant spinners.");
}
function noteProperty(p, file, line, text, context) {
  if (!p || p === "none") return;
  bump(properties, p);
  if (p === "all") find("transition-all", "fix", file, line, text, "Names no property, so anything that changes will animate, including layout. List the properties.");
  else if (LAYOUT.test(p)) find("layout-property", "check", file, line, text, `${p} runs layout on every frame. Prefer transform, or confirm the element is small and isolated.`);
  else if (PAINT.test(p) && context !== "keyframes") find("paint-property", "info", file, line, text, `${p} repaints on every frame. Fine on small elements; measure on large ones.`);
}

function scanCssValue(kind, prop, value, file, line, text) {
  if (/^(none|initial|inherit|unset|revert)\b/.test(value.trim())) return;
  for (const layer of splitTop(value)) {
    const tokens = splitTop(layer, " ");
    let sawTime = 0, sawEase = false;
    const props = tokens.filter((t) => kind === "transition" && prop === "transition" && /^[a-z-]+$/.test(t) && !EASE_WORD.test(t) && !/^(allow-discrete|normal|infinite)$/.test(t));
    for (const t of tokens) {
      const time = t.match(/^(-?\d*\.?\d+)(ms|s)$/);
      if (time) {
        if (sawTime === 0 && !/delay/.test(prop)) {
          const v = ms(time[1], time[2]);
          if (v === 0) { sawTime++; continue; } // a reset, not a choice
          bump(durations, v); totals.literalDurations++;
          if (prop === "transition-duration") totals.transitions++; else if (prop === "animation-duration") totals.animations++;
          if (kind === "transition" && v >= 500) find("long-transition", "check", file, line, text, `${v}ms is long for a state change. Most interface transitions land between 120 and 320ms.`);
        }
        sawTime++;
      } else if (/^var\(/.test(t)) {
        // A variable is read by its name when the name says what it is, and by its place otherwise: in a
        // shorthand the first time-like value is the duration, whatever the project called its token.
        const namedEase = /eas|curve|bezier|spring/i.test(t), namedTime = /dur|time|speed|motion|delay/i.test(t);
        if (/timing-function/.test(prop) || (namedEase && !/duration|delay/.test(prop))) { bump(easings, t.toLowerCase()); sawEase = true; }
        else if (/delay/.test(prop)) sawTime++;
        else if (/duration/.test(prop) || namedTime || !sawTime) { if (sawTime === 0) totals.tokenDurations++; sawTime++; }
        else if (!sawEase) { bump(easings, t.toLowerCase()); sawEase = true; }
      } else if (EASE_WORD.test(t) || /^(cubic-bezier|steps|linear)\(/.test(t)) { noteEasing(t, file, line, text, kind, props); sawEase = true; }
      else if (t === "infinite") { totals.infinite++; find("infinite", "check", file, line, text, "Runs forever. It needs a reduced-motion alternative, and a pause control if it lasts over five seconds beside other content (WCAG 2.2.2)."); }
      else if (kind === "transition" && (prop === "transition" || prop === "transition-property") && /^[a-z-]+$/.test(t) && !/^(allow-discrete|normal)$/.test(t)) noteProperty(t, file, line, text, kind);
    }
    if (kind === "transition" && prop === "transition" && sawTime && !sawEase) totals.noEasing++;
  }
}

function scanText(file, src) {
  const lineAt = (() => { const starts = [0]; for (let i = 0; i < src.length; i++) if (src[i] === "\n") starts.push(i + 1); return (idx) => { let lo = 0, hi = starts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (starts[mid] <= idx) lo = mid; else hi = mid - 1; } return lo + 1; }; })();
  const isScript = SCRIPT.test(file);

  // CSS declarations, wherever they appear (stylesheets, <style> blocks, CSS-in-JS templates).
  for (const m of src.matchAll(/(?<![\w-])(transition|animation)(-[a-z-]+)?\s*:\s*([^;{}\n]+(?:\n\s+[^;{}:\n]+)*)[;}\n]/g)) {
    const prop = m[1] + (m[2] || "");
    if (isScript && !/["'`;]|^\s*$/.test(src.slice(Math.max(0, m.index - 1), m.index)) && /^\s*\{/.test(m[3])) continue; // a JS object, handled below
    if (/^\s*[{[]/.test(m[3])) continue;
    if (m[1] === "transition") { if (prop === "transition") totals.transitions++; } else if (prop === "animation") totals.animations++;
    scanCssValue(m[1], prop, m[3].replace(/["'`,]\s*$/, "").replace(/^\s*["'`]/, ""), file, lineAt(m.index), m[0]);
  }
  // Keyframes: which properties they move.
  for (const m of src.matchAll(/@keyframes\s+([\w-]+)\s*\{/g)) {
    totals.keyframes++;
    let depth = 1, i = m.index + m[0].length;
    while (i < src.length && depth > 0) { if (src[i] === "{") depth++; else if (src[i] === "}") depth--; i++; }
    const body = src.slice(m.index + m[0].length, i - 1);
    const seen = new Set();
    for (const d of body.matchAll(/(?<![\w-])([a-z-]+)\s*:\s*([^;}]+)/g)) {
      if (!seen.has(d[1])) { seen.add(d[1]); bump(properties, d[1]); if (LAYOUT.test(d[1])) find("layout-property", "check", file, lineAt(m.index), `@keyframes ${m[1]} { ${d[1]} }`, `${d[1]} runs layout on every frame. Prefer transform, or confirm the element is small and isolated.`); }
      if (/scale\(\s*0\s*\)/.test(d[2])) find("scale-from-zero", "check", file, lineAt(m.index), `@keyframes ${m[1]} { ${d[1]}: ${d[2].trim()} }`, "Growing from nothing reads as a pop from a point. Start near full size (around 0.96) with opacity.");
    }
  }
  // A comment that mentions reduced motion ("TODO: add prefers-reduced-motion") handles nothing, so comments
  // are blanked out, keeping every offset, before looking for the checks.
  const bare = src.replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g, (c) => c.replace(/[^\n]/g, " ")).replace(isScript ? /(?<![:"'`\\])\/\/[^\n]*/g : /$^/g, (c) => " ".repeat(c.length));
  for (const m of bare.matchAll(/prefers-reduced-motion/g)) { if (isScript && !/@media/.test(bare.slice(Math.max(0, m.index - 40), m.index))) reduced.js++; else reduced.css++; }
  for (const m of src.matchAll(/(?<![\w-])will-change\s*:\s*([^;}\n]+)/g)) if (!/auto/.test(m[1])) find("will-change", "info", file, lineAt(m.index), m[0], "A permanent will-change keeps a layer in memory. Set it just before the animation and remove it after, or drop it.");
  if (/view-transition-name|@view-transition|startViewTransition/.test(src)) modern.viewTransitions++;
  if (/animation-timeline|scroll-timeline|view-timeline/.test(src)) modern.scrollDriven++;
  if (/@starting-style/.test(src)) modern.startingStyle++;

  // Tailwind utility classes. In a stylesheet they only appear inside @apply, so everything else is blanked
  // out there (keeping line numbers): otherwise CSS keywords such as ease-in-out would be counted twice.
  const css = src;
  if (STYLE.test(file)) {
    const keep = new Uint8Array(css.length);
    for (const m of css.matchAll(/@apply\b[^;}]*/g)) keep.fill(1, m.index, m.index + m[0].length);
    src = [...css].map((ch, i) => (keep[i] || ch === "\n" ? ch : " ")).join("");
  }
  for (const m of src.matchAll(/(?<![\w-])(?:[a-z0-9-]+:)*duration-(\d+|\[[^\]]+\]|\(--[\w-]+\))/g)) {
    const raw = m[1].replace(/[[\]]/g, ""); const t = raw.match(/^(\d*\.?\d+)(ms|s)?$/);
    if (!t) { totals.tokenDurations++; continue; }
    const v = ms(t[1], t[2] || "ms"); bump(durations, v); totals.literalDurations++;
    if (v >= 500) find("long-transition", "check", file, lineAt(m.index), m[0], `${v}ms is long for a state change. Most interface transitions land between 120 and 320ms.`);
  }
  for (const m of src.matchAll(/(?<![\w-])(?:[a-z0-9-]+:)*ease-\((--[\w-]+)\)/g)) bump(easings, `var(${m[1]})`); // Tailwind v4: ease-(--token)
  for (const m of src.matchAll(/(?<![\w-])(?:[a-z0-9-]+:)*ease-(linear|in-out|in|out|\[[^\]]+\])(?![\w-])/g)) noteEasing(m[1].startsWith("[") ? m[1].slice(1, -1).replace(/_/g, "") : m[1] === "linear" ? "linear" : `ease-${m[1]}`, file, lineAt(m.index), m[0], "transition");
  for (const m of src.matchAll(/(?<![\w-])(?:[a-z0-9-]+:)*transition-all(?![\w-])/g)) { totals.transitions++; noteProperty("all", file, lineAt(m.index), m[0], "transition"); }
  for (const m of src.matchAll(/(?<![\w-])(?:[a-z0-9-]+:)*transition(?:-(colors|opacity|transform|shadow))?(?![\w-])(?=[\s"'`])/g)) if (/class(Name)?\s*=|cn\(|clsx\(|cva\(|@apply/.test(src.slice(Math.max(0, m.index - 400), m.index))) { totals.transitions++; if (m[1]) bump(properties, m[1]); }
  for (const m of src.matchAll(/(?<![\w-])(?:[a-z0-9-]+:)*animate-(spin|ping|pulse|bounce)(?![\w-])/g)) { totals.animations++; totals.infinite++; find("infinite", "check", file, lineAt(m.index), m[0], "Runs forever. It needs a reduced-motion alternative, and a pause control if it lasts over five seconds beside other content (WCAG 2.2.2)."); }
  // Tailwind arbitrary properties: transition-[height] or transition-[opacity,transform].
  for (const m of src.matchAll(/(?<![\w-])(?:[a-z0-9-]+:)*transition-\[([^\]]+)\]/g)) { totals.transitions++; for (const p of m[1].split(",")) noteProperty(p.replace(/_/g, "").trim(), file, lineAt(m.index), m[0], "transition"); }
  reduced.tailwind += ((STYLE.test(file) ? src : bare).match(/motion-(reduce|safe):/g) || []).length;
  if (STYLE.test(file)) return;

  if (!isScript && !MARKUP.test(file)) return;

  // JavaScript motion libraries.
  const LIBS = [["motion", /from\s+["'](motion(\/react)?(-client)?|framer-motion|motion\/react-client)["']/], ["gsap", /from\s+["']gsap(\/[^"']*)?["']|require\(["']gsap/], ["react-spring", /from\s+["']@react-spring\//], ["reanimated", /from\s+["']react-native-reanimated["']/], ["anime.js", /from\s+["']animejs["']/], ["lottie", /from\s+["'](lottie-web|lottie-react|@lottiefiles\/[^"']+)["']/], ["rive", /from\s+["']@rive-app\//], ["auto-animate", /from\s+["']@formkit\/auto-animate/], ["lenis", /from\s+["'](lenis|@studio-freight\/lenis)/], ["tailwindcss-animate", /tailwindcss-animate|tw-animate-css/]];
  for (const [name, re] of LIBS) if (re.test(src)) bump(libraries, name);
  const usesLib = LIBS.some(([, re]) => re.test(src)) || /\.animate\(|transition=\{|useSpring|withSpring|withTiming/.test(src);
  // Motion, GSAP and react-spring count in seconds; Reanimated, anime.js and the Web Animations API in
  // milliseconds. Only a file that names none of them falls back to guessing from the size of the number.
  const unit = /from\s+["'](motion|framer-motion|gsap|@react-spring)|require\(["']gsap/.test(src) ? "s"
    : /react-native-reanimated|animejs|withTiming|\.animate\(/.test(src) ? "ms" : "?";
  if (usesLib) {
    for (const m of src.matchAll(/(?<![\w.])duration\s*:\s*(\d*\.?\d+)\s*[,}\n]/g)) {
      const n = parseFloat(m[1]); const v = Math.round(n * (unit === "s" || (unit === "?" && n <= 20) ? 1000 : 1));
      bump(durations, v); totals.literalDurations++; totals.transitions++;
      if (v >= 500 && !/repeat\s*:\s*(Infinity|-1)/.test(src.slice(m.index, m.index + 200))) find("long-transition", "check", file, lineAt(m.index), m[0], `${v}ms is long for a state change. Most interface transitions land between 120 and 320ms.`);
    }
    for (const m of src.matchAll(/(?<![\w.])eas(?:e|ing)\s*:\s*(\[[^\]]+\]|["'`][^"'`]+["'`])/g)) {
      const raw = m[1].replace(/["'`]/g, "");
      noteEasing(raw.startsWith("[") ? `cubic-bezier(${raw.slice(1, -1)})` : raw, file, lineAt(m.index), m[0], "js");
      if (/^(easeIn|ease-in|power\d\.in|circIn|backIn)$/.test(raw)) find("ease-in", "check", file, lineAt(m.index), m[0], "An accelerating curve starts slowly, so a response to input feels late. It suits only things leaving the screen.");
    }
    for (const m of src.matchAll(/type\s*:\s*["']spring["'][^}]{0,160}|(?<![\w.])(stiffness|damping|bounce|visualDuration)\s*:\s*-?\d*\.?\d+[^}]{0,120}|with(Spring)\([^)]{0,120}\)/g)) {
      const line = lineAt(m.index);
      if (!springs.some((s) => s.file === file && Math.abs(s.line - line) < 3)) springs.push({ file, line, text: m[0].replace(/\s+/g, " ").slice(0, 110) });
    }
    for (const m of src.matchAll(/repeat\s*:\s*(Infinity|-1)|iterations\s*:\s*Infinity/g)) { totals.infinite++; find("infinite", "check", file, lineAt(m.index), m[0], "Runs forever. It needs a reduced-motion alternative, and a pause control if it lasts over five seconds beside other content (WCAG 2.2.2)."); }
    for (const m of src.matchAll(/(?:initial|from)\s*=?\s*:?\s*\{\{?[^}]{0,80}scale\s*:\s*0\s*[,}]/g)) find("scale-from-zero", "check", file, lineAt(m.index), m[0], "Growing from nothing reads as a pop from a point. Start near full size (around 0.96) with opacity.");
  }
  reduced.js += (bare.match(/useReducedMotion|reducedMotion\s*[=:]|ReduceMotion\.|isReduceMotionEnabled|accessibilityReduceMotion/g) || []).length;
  for (const m of src.matchAll(/addEventListener\(\s*["']scroll["']/g)) find("scroll-listener", "info", file, lineAt(m.index), m[0], "Scroll handlers run on the main thread. For scroll-linked effects consider a scroll-driven animation or IntersectionObserver.");
}

for (const f of files) { try { scanText(f, fs.readFileSync(f, "utf8")); } catch { /* skip unreadable */ } }

// Whole-codebase findings.
const hasMotion = totals.transitions + totals.animations + totals.keyframes + springs.length + durations.size + properties.size > 0;
const reducedTotal = reduced.css + reduced.tailwind + reduced.js;
const system = [];
if (hasMotion && reducedTotal === 0) system.push({ rule: "no-reduced-motion", level: "fix", why: "Nothing checks prefers-reduced-motion. People who ask their system for less motion still get all of it." });
if (durations.size > 6) system.push({ rule: "duration-sprawl", level: "check", why: `${durations.size} different durations. A product needs about four; the rest are usually accidents.` });
const realEasings = [...easings.keys()].filter((e) => !e.startsWith("var("));
if (realEasings.length > 4) system.push({ rule: "easing-sprawl", level: "check", why: `${realEasings.length} different easing curves. Two or three cover almost every interface.` });
if (totals.noEasing > 2) system.push({ rule: "default-easing", level: "check", why: `${totals.noEasing} transitions name no easing, so they get the browser's default "ease". Nobody chose that curve.` });
if (totals.literalDurations > 8 && totals.tokenDurations === 0) system.push({ rule: "no-tokens", level: "check", why: "Every duration is typed by hand. Shared tokens are what keep motion consistent as the app grows." });

const rank = { fix: 0, check: 1, info: 2 };
findings.sort((a, b) => rank[a.level] - rank[b.level] || a.file.localeCompare(b.file) || a.line - b.line);
const sorted = (m, by = (a, b) => b[1] - a[1]) => [...m.entries()].sort(by);
const report = {
  root,
  filesScanned: files.length,
  libraries: Object.fromEntries(sorted(libraries)),
  totals: { ...totals, springs: springs.length },
  durations: sorted(durations, (a, b) => a[0] - b[0]).map(([v, n]) => ({ ms: v, count: n })),
  easings: sorted(easings).map(([e, n]) => ({ easing: e, count: n })),
  properties: sorted(properties).map(([p, n]) => ({ property: p, count: n })),
  springs: springs.map((s) => ({ ...s, file: path.relative(root, s.file) })),
  reducedMotion: reduced,
  modern,
  system,
  findings,
};

if (flag("--json")) { console.log(JSON.stringify(report, null, 1)); process.exit(0); }

const out = [];
const bar = (n, max) => "█".repeat(Math.max(1, Math.round((n / max) * 24)));
out.push(`Motion inventory: ${root}`, `${files.length} files read. ${totals.transitions} transitions, ${totals.animations} animations, ${totals.keyframes} keyframe sets, ${springs.length} springs.`);
if (!hasMotion) { out.push("", "No motion found in the code this script can read."); console.log(out.join("\n")); process.exit(0); }
if (libraries.size) out.push(`Libraries: ${sorted(libraries).map(([l, n]) => `${l} (${n} files)`).join(", ")}`);
out.push(`Reduced motion: ${reducedTotal ? `${reduced.css} CSS, ${reduced.tailwind} Tailwind, ${reduced.js} JavaScript checks` : "not handled anywhere"}`);
out.push(`Durations: ${totals.literalDurations} typed by hand, ${totals.tokenDurations} from tokens`);
const used = Object.entries(modern).filter(([, n]) => n).map(([k, n]) => `${k} (${n} files)`);
if (used.length) out.push(`Newer platform features in use: ${used.join(", ")}`);
if (durations.size) { const mx = Math.max(...durations.values()); out.push("", `Durations (${durations.size} distinct)`, ...report.durations.map((d) => `  ${String(d.ms).padStart(5)}ms  ${bar(d.count, mx)} ${d.count}`)); }
if (easings.size) { const mx = Math.max(...easings.values()); out.push("", `Easings (${easings.size} distinct)`, ...report.easings.slice(0, 14).map((e) => `  ${e.easing.padEnd(34).slice(0, 34)} ${bar(e.count, mx)} ${e.count}`)); }
if (properties.size) out.push("", "Animated properties", "  " + report.properties.slice(0, 16).map((p) => `${p.property} ${p.count}`).join(", "));
if (springs.length) out.push("", `Springs (${springs.length})`, ...report.springs.slice(0, 8).map((s) => `  ${s.file}:${s.line}  ${s.text}`));
if (system.length) out.push("", "Across the codebase", ...system.map((s) => `  [${s.level}] ${s.rule}: ${s.why}`));
if (findings.length) {
  out.push("", `Places to look (${findings.length}${findings.length > MAX ? `, first ${MAX} shown; --max to change, --json for all` : ""})`);
  for (const f of findings.slice(0, MAX)) out.push(`  [${f.level}] ${f.rule}  ${f.file}:${f.line}  ${f.text}`);
  const whys = new Map(findings.map((f) => [f.rule, f.why.replace(/^\S+ runs layout/, "The property runs layout").replace(/^\S+ repaints/, "The property repaints").replace(/^\d+ms is long/, "The duration is long")]));
  out.push("", "Why each is listed", ...[...whys].map(([r, w]) => `  ${r}: ${w}`));
}
out.push("", "A script cannot see intent. Treat each line as a place to look, then judge it against the project's MOTION.md.");
console.log(out.join("\n"));
