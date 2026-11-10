#!/usr/bin/env node
// Filmstrip: turns one interaction into still frames an agent can look at, plus the numbers behind it.
//
// An agent cannot watch an animation. This script triggers the interaction in a real browser, pauses every
// animation the page starts, and steps them forward in equal slices of time, saving a screenshot at each
// step. JavaScript-driven motion is stepped with a paused clock. It then lays the frames out as one contact
// sheet and prints what moved: target, properties, duration, delay, easing, and whether layout was involved.
//
//   node filmstrip.mjs <url> --do 'click:#open' [--before 'click:#tab'] [--frames 8] [--ms 600]
//                      [--viewport 1280x800|mobile] [--clip <selector>] [--reduced] [--perf] [--throttle 4]
//                      [--wait <selector>] [--out <dir>] [--json] [--project-playwright]
//   node filmstrip.mjs --spec capture.json     (URL, actions and selectors from a file; use this for
//                                               anything copied from a project you do not control)
//
// Actions: click:<sel>  hover:<sel>  focus:<sel>  press:<key>  scroll:<px>  wait:<ms>  load
// Playwright comes from the machine (global modules or MOTION_PLAYWRIGHT_DIR). The project's own copy is loaded
// only with --project-playwright, because loading it runs that project's code. Nothing is installed.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { pathToFileURL, fileURLToPath } from "node:url";

const argv = process.argv.slice(2);
const VALUE_FLAGS = ["--do", "--before", "--frames", "--ms", "--viewport", "--clip", "--throttle", "--wait", "--out", "--spec"];
// --spec <file.json> carries the URL, actions and selectors in a file: { "url", "before": [], "do": [], "clip",
// "wait" }. Text copied from a project (a selector, a URL) then never passes through a shell, where $(...) or
// backticks inside double quotes would run as commands. Spec values are kept apart from the command line:
// they are data, so a selector that spells "--project-playwright" can never switch a flag on.
const spec = { url: null, values: {} };
{
  const i = argv.indexOf("--spec");
  if (i >= 0 && argv[i + 1] && !VALUE_FLAGS.includes(argv[i - 1])) {
    let raw;
    try { raw = JSON.parse(fs.readFileSync(argv[i + 1], "utf8")); } catch (e) { console.error(`Could not read --spec ${argv[i + 1]}: ${e.message}`); process.exit(2); }
    const list = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]).map(String);
    for (const k of ["before", "do", "clip", "wait"]) spec.values[`--${k}`] = list(raw?.[k]);
    if (raw?.url != null) spec.url = String(raw.url);
  }
}
// One pass over the command line: a word that follows a value option is that option's value and nothing else.
const cli = { flags: new Set(), values: {}, rest: [] };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (VALUE_FLAGS.includes(a)) { if (i + 1 < argv.length) (cli.values[a] ||= []).push(argv[++i]); }
  else if (a.startsWith("--")) cli.flags.add(a);
  else cli.rest.push(a);
}
const all = (n) => [...(cli.values[n] || []), ...(spec.values[n] || [])];
const opt = (n, d) => all(n)[0] ?? d;
const flag = (n) => cli.flags.has(n);
const target = spec.url ?? cli.rest[0];

const fail = (msg, code = 1) => { console.error(msg); process.exit(code); };
if (!target || flag("--help")) fail(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 15).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"), target ? 0 : 2);

const url = /^[a-z]+:\/\//i.test(target) ? target : pathToFileURL(path.resolve(target)).href;
const FRAMES = Math.max(2, Math.min(24, Number(opt("--frames", 8))));
const CAP = Number(opt("--ms", 0));
const outDir = path.resolve(opt("--out", path.join(os.tmpdir(), `filmstrip-${Date.now().toString(36)}`)));
const VIEWPORTS = { desktop: { width: 1280, height: 800 }, laptop: { width: 1180, height: 760 }, tablet: { width: 820, height: 1100 }, mobile: { width: 390, height: 844, isMobile: true, hasTouch: true } };
const vp = (() => { const v = opt("--viewport", "desktop"); const m = String(v).match(/^(\d+)x(\d+)$/); return m ? { width: +m[1], height: +m[2] } : VIEWPORTS[v] || VIEWPORTS.desktop; })();

async function loadPlaywright() {
  // Importing a module runs its code in this process. A copy of Playwright inside the project being looked at
  // is that project's code, so it is loaded only when --project-playwright says the project is trusted.
  // Otherwise Playwright comes from MOTION_PLAYWRIGHT_DIR or the machine's global Node modules.
  const trustProject = flag("--project-playwright");
  const real = (p) => { try { return fs.realpathSync(p); } catch { return null; } };
  const inside = (file, dir) => file === dir || file.startsWith(dir + path.sep);
  const cwd = real(process.cwd());
  // The project is the working directory and the repository around it. Nothing under it is loaded by default.
  let project = cwd;
  for (let d = cwd; ; d = path.dirname(d)) { if (fs.existsSync(path.join(d, ".git"))) { project = d; break; } if (path.dirname(d) === d) break; }
  const NAMES = ["playwright", "playwright-core", "@playwright/test"];
  let skipped = false;
  // Trusted places are looked in exactly: <dir>/node_modules/<name> or <dir>/<name>. There is no walk up
  // through parent folders, and the package's entry file has to sit inside the package's own folder, so
  // a package.json cannot point the import at a file somewhere else.
  const candidates = [];
  if (trustProject) for (const name of NAMES) { try { candidates.push({ file: real(createRequire(path.join(cwd, "package.json")).resolve(name)), trusted: true }); } catch { /* not in the project */ } }
  const globals = [process.env.MOTION_PLAYWRIGHT_DIR, ...(process.env.NODE_PATH || "").split(path.delimiter), path.resolve(process.execPath, "../../lib/node_modules"), path.resolve(process.execPath, "../node_modules")].filter(Boolean);
  for (const base of globals) for (const name of NAMES) for (const dir of [path.join(base, "node_modules", name), path.join(base, name)]) {
    const pkg = real(dir);
    if (!pkg || !fs.existsSync(path.join(pkg, "package.json"))) continue;
    let file = null;
    try { file = real(createRequire(path.join(pkg, "package.json")).resolve(pkg)); } catch { /* no entry point */ }
    if (!file || !inside(file, pkg)) continue;
    if (inside(pkg, project)) { skipped = true; continue; }
    candidates.push({ file });
  }
  if (!trustProject) for (const name of NAMES) if (real(path.join(cwd, "node_modules", name))) skipped = true;
  for (const { file } of candidates) {
    if (!file) continue;
    try {
      const mod = await import(pathToFileURL(file).href);
      const pw = mod.chromium ? mod : mod.default;
      if (pw?.chromium) return pw;
    } catch { /* try the next one */ }
  }
  fail(`No Playwright was loaded, so no frames were captured.${skipped ? `
This project has its own copy, which was not used: loading it runs the project's code in this process.
If the user owns or trusts this project, run again with --project-playwright.` : ""}
Do not install anything into the user's project. Otherwise:
  1. use the agent's own browser tools and follow references/proof.md ("Without the script"), or
  2. point MOTION_PLAYWRIGHT_DIR at a folder outside the project whose node_modules has playwright and its browser.`, 3);
}

const parseAction = (s) => { const i = s.indexOf(":"); return i < 0 ? { kind: s, arg: "" } : { kind: s.slice(0, i), arg: s.slice(i + 1) }; };
async function act(page, a) {
  const { kind, arg } = parseAction(a);
  if (kind === "click") await page.locator(arg).first().click({ force: true, noWaitAfter: true, timeout: 5000 });
  else if (kind === "hover") await page.locator(arg).first().hover({ force: true, timeout: 5000 });
  else if (kind === "focus") await page.locator(arg).first().focus({ timeout: 5000 });
  else if (kind === "press") await page.keyboard.press(arg);
  else if (kind === "scroll") await page.mouse.wheel(0, Number(arg) || 600);
  else if (kind === "wait") await new Promise((r) => setTimeout(r, Number(arg) || 300));
  else if (kind !== "load") fail(`Unknown action "${a}". Use click:, hover:, focus:, press:, scroll:, wait: or load.`, 2);
}

// Runs in the page. Pauses every animation the document knows about and moves each to the given time.
// Returns a description of each one the first time it is seen.
function scrub([t, finish]) {
  const reg = (window.__filmstrip ||= { seen: new Map(), from: new Map(), done: new WeakSet(), held: new WeakSet(), n: 0 });
  const name = (el) => { if (!el) return "(detached)"; const c = typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : ""; return el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + c; };
  const COMPOSITED = new Set(["transform", "opacity", "translate", "scale", "rotate", "filter", "backdropFilter", "offsetDistance"]);
  const LAYOUT = /^(width|height|minWidth|minHeight|maxWidth|maxHeight|top|left|right|bottom|inset.*|margin.*|padding.*|fontSize|lineHeight|borderWidth|gap|gridTemplate.*|flexBasis)$/;
  const fresh = [];
  // Animations already seen are kept by reference: one with no fill drops out of getAnimations() once it has
  // been moved to its end, and it still has to be rewound.
  for (const a of new Set([...reg.seen.keys(), ...document.getAnimations()])) {
    if (reg.done.has(a)) {
      // Finished by this capture. If the page starts the same object again (an onfinish handler that calls
      // reverse(), a replay), it is a new movement and is tracked afresh from here.
      if (a.playState === "finished" || a.playState === "idle") continue;
      reg.done.delete(a); reg.from.delete(a);
    }
    let rec = reg.seen.get(a);
    // An animation the page itself holds paused (animation-play-state: paused, or pause()) is not moving, so
    // it is left where it is. If the page resumes it later, it is picked up then, from that position.
    // The same goes for one that had already finished before the action (an entrance with fill: forwards):
    // it is at rest, and rewinding it would replay motion the action never caused.
    if (!rec && (a.playState === "paused" || (a.playState === "finished" && reg.held.has(a)))) { reg.held.add(a); continue; }
    if (!rec) {
      const timing = a.effect?.getComputedTiming?.() || {};
      const frames = a.effect?.getKeyframes?.() || [];
      const props = [...new Set(frames.flatMap((k) => Object.keys(k)))].filter((k) => !["offset", "easing", "composite", "computedOffset"].includes(k));
      const DISCRETE = new Set(["display", "overlay", "visibility", "contentVisibility"]);
      const pseudo = a.effect?.pseudoElement || "";
      rec = {
        id: ++reg.n, start: t,
        kind: a.constructor.name === "CSSTransition" ? "transition" : a.constructor.name === "CSSAnimation" ? "keyframes" : "script",
        name: a.animationName || a.transitionProperty || a.id || "",
        target: name(a.effect?.target) + pseudo,
        properties: props,
        delay: Math.round(timing.delay || 0),
        duration: typeof timing.duration === "number" ? Math.round(timing.duration) : 0,
        end: Number.isFinite(timing.endTime) ? Math.round(timing.endTime) : null,
        iterations: timing.iterations === Infinity ? "infinite" : timing.iterations ?? 1,
        easing: a.effect?.getTiming?.().easing || "linear",
        keyframeEasing: [...new Set(frames.map((k) => k.easing).filter(Boolean))].join(" / "),
        discrete: props.length > 0 && props.every((p) => DISCRETE.has(p)),
        composited: props.length > 0 && props.every((p) => COMPOSITED.has(p)),
        layout: props.filter((p) => LAYOUT.test(p)),
      };
      reg.seen.set(a, rec);
      fresh.push(rec);
    }
    if (a.playState === "idle") continue; // cancelled by the page itself; leave it alone
    // An animation the page reversed (a close that calls reverse()) runs from where it was back toward zero.
    if (!reg.from.has(a)) {
      const hint = window.__filmstripReversed?.get(a);
      const dir = hint ? hint.dir : a.playbackRate < 0 ? -1 : 1;
      const end = a.effect?.getComputedTiming?.().endTime;
      reg.from.set(a, { dir, at: hint ? hint.from : reg.held.has(a) ? a.currentTime ?? 0 : dir < 0 ? (Number.isFinite(end) ? end : a.currentTime ?? 0) : 0 });
    }
    const from = reg.from.get(a);
    const speed = Math.abs(a.playbackRate || 1);
    const total = a.effect?.getComputedTiming?.().endTime;
    // How long it really takes from here: a half-speed animation needs twice its own length, and a reversed
    // one only has the stretch back to zero left.
    if (fresh.includes(rec) && rec.end != null) rec.end = Math.round((from.dir < 0 ? from.at : Math.max(0, total - from.at)) / speed);
    const at = from.at + from.dir * speed * (t - rec.start);
    // Code that waits for the end (await animation.finished, onfinish) starts its next step only when the
    // animation really finishes, which a paused one never does. So once time passes its end, finish it and
    // leave it alone from then on.
    if (finish && Number.isFinite(total) && (from.dir < 0 ? at <= 0 : at >= total)) {
      try { a.finish(); } catch { /* cannot finish: infinite or detached */ }
      reg.seen.delete(a); reg.done.add(a);
      continue;
    }
    try { a.pause(); a.currentTime = Math.max(0, at); } catch { /* finished or detached */ }
  }
  return fresh;
}

// Runs in the page just before the action: remembers which animations are already finished, so they can be
// told apart from ones that finish in the moment between the action and the first frame.
function noteResting() {
  const reg = (window.__filmstrip ||= { seen: new Map(), from: new Map(), done: new WeakSet(), held: new WeakSet(), n: 0 });
  for (const a of document.getAnimations()) if (a.playState === "finished") reg.held.add(a);
}

// Runs in the page before its own scripts. An animation that was just reversed is "pending" until the next
// frame and still reports its old playback rate, so reverse() itself is recorded: the direction it now runs
// in and the position it runs from.
function watchReverse() {
  const log = (window.__filmstripReversed = new WeakMap());
  const reverse = Animation.prototype.reverse;
  Animation.prototype.reverse = function (...args) {
    const was = log.get(this)?.dir ?? (this.playbackRate < 0 ? -1 : 1);
    const result = reverse.apply(this, args);
    log.set(this, { dir: -was, from: this.currentTime ?? 0 });
    return result;
  };
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
function sheetHtml(meta, frames, cols) {
  const rows = meta.animations.map((a) => `<tr><td>${esc(a.target)}</td><td>${esc(a.kind)}${a.name ? ` · ${esc(a.name)}` : ""}</td><td>${esc(a.properties.join(", "))}</td><td>${a.delay ? a.delay + " + " : ""}${a.duration}ms${a.iterations === "infinite" ? " ∞" : ""}</td><td>${esc(a.keyframeEasing && a.easing === "linear" ? a.keyframeEasing : a.easing)}</td><td>${a.layout.length ? "layout: " + esc(a.layout.join(", ")) : a.discrete ? "switch" : a.composited ? "compositor" : "paint"}</td></tr>`).join("");
  return `<!doctype html><meta charset="utf8"><style>
body{margin:0;padding:20px;font:13px/1.4 ui-sans-serif,system-ui,sans-serif;background:#f4f3ef;color:#111}
h1{font-size:15px;margin:0 0 2px}p{margin:0 0 14px;color:#444}
.g{display:grid;grid-template-columns:repeat(${cols},1fr);gap:10px}
figure{margin:0;background:#fff;border:1px solid #c9c5ba;border-radius:6px;overflow:hidden}
figure.same{opacity:.55}img{display:block;width:100%}
figcaption{padding:4px 8px;font:600 12px ui-monospace,monospace;border-top:1px solid #e2dfd6;display:flex;justify-content:space-between}
table{border-collapse:collapse;margin-top:16px;width:100%;font:12px ui-monospace,monospace}
td,th{text-align:left;padding:4px 10px 4px 0;border-top:1px solid #d8d4c9;vertical-align:top}th{color:#555}
</style><h1>${esc(meta.action)} · ${meta.windowMs}ms in ${frames.length} frames${meta.reducedMotion ? " · reduced motion" : ""}</h1>
<p>${esc(meta.url)} · ${meta.viewport.width}×${meta.viewport.height} · ${esc(meta.note)}</p>
<div class="g">${meta.before ? `<figure><img src="${meta.before}"><figcaption><span>before</span><span></span></figcaption></figure>` : ""}${frames.map((f) => `<figure class="${f.same ? "same" : ""}"><img src="${f.file}"><figcaption><span>${f.t}ms</span><span>${f.same ? "no change" : f.pct + "%"}</span></figcaption></figure>`).join("")}</div>
${rows ? `<table><tr><th>Target</th><th>Kind</th><th>Properties</th><th>Time</th><th>Easing</th><th>Cost</th></tr>${rows}</table>` : ""}`;
}

async function settle(page) {
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  const deadline = Date.now() + 3000;
  while (Date.now() < deadline) {
    const busy = await page.evaluate(() => document.getAnimations().some((a) => a.playState === "running" && Number.isFinite(a.effect?.getComputedTiming().endTime))).catch(() => false);
    if (!busy) return;
    await new Promise((r) => setTimeout(r, 100));
  }
}

// The output folder may sit inside a project someone else controls. A link planted there under one of our
// file names would make a write land on whatever it points at, so links are refused and every output file
// is created fresh.
const OUTPUTS = ["frames", "sheet.html", "sheet.png", "filmstrip.json"];
// Read-only: refuses an unsafe output path without creating or removing anything.
function checkOut() {
  const isLink = (p) => { try { return fs.lstatSync(p).isSymbolicLink(); } catch { return false; } };
  // Every folder between the project root and the output folder is checked before anything is created or
  // removed, so a link planted higher up (".artifacts" pointing elsewhere) cannot redirect the work.
  let root = process.cwd();
  for (let d = root; ; d = path.dirname(d)) { if (fs.existsSync(path.join(d, ".git"))) { root = d; break; } if (path.dirname(d) === d) break; }
  const rel = path.relative(root, outDir);
  if (rel && !rel.startsWith("..") && !path.isAbsolute(rel)) {
    let step = root;
    for (const part of rel.split(path.sep)) {
      step = path.join(step, part);
      if (isLink(step)) fail(`Refusing to write: ${step} is a symbolic link on the way to the output folder. Choose another --out folder, or remove the link if it is yours.`, 2);
    }
  }
  const link = [outDir, ...OUTPUTS.map((n) => path.join(outDir, n))].find(isLink);
  if (link) fail(`Refusing to write: ${link} is a symbolic link. Choose another --out folder, or remove the link if it is yours.`, 2);
}

// Clears the previous capture and makes room for this one. Called only once a browser is known to be
// available, so a run that cannot capture leaves the last capture in place.
function prepareOut() {
  checkOut();
  fs.mkdirSync(outDir, { recursive: true });
  for (const n of OUTPUTS) fs.rmSync(path.join(outDir, n), { recursive: true, force: true });
  fs.mkdirSync(path.join(outDir, "frames"));
}

async function capture(pw) {
  prepareOut();
  let browser;
  try { browser = await pw.chromium.launch(); }
  catch (e) {
    // Fallback browsers are fixed system locations for this platform only. A Windows path is a relative path
    // on other systems, where a project could plant a file at it, so every candidate must be absolute here.
    const SYSTEM_CHROME = process.platform === "win32"
      ? ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"]
      : process.platform === "darwin" ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
      : ["/opt/pw-browsers/chromium", "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium"];
    const chrome = SYSTEM_CHROME.find((c) => path.isAbsolute(c) && fs.existsSync(c) && fs.statSync(c).isFile());
    if (!chrome) fail(`Playwright is installed but has no browser, and Chrome was not found. No frames were captured.\n${String(e.message).split("\n")[0]}`, 3);
    browser = await pw.chromium.launch({ executablePath: chrome });
  }
  const actions = all("--do");
  if (!actions.length) actions.push("load");
  const trigger = actions[actions.length - 1];
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, deviceScaleFactor: 1, reducedMotion: flag("--reduced") ? "reduce" : "no-preference" });
  await context.addInitScript(watchReverse);
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 160)));
  await page.clock.install();
  const isLoad = parseAction(trigger).kind === "load";
  // A page entrance has to be stepped from its first frame, so script time is frozen before the page loads.
  // Timers and requestAnimationFrame then only move when the capture advances them.
  if (isLoad) await page.clock.pauseAt(Date.now() + 1000);
  await page.goto(url, { waitUntil: isLoad ? "domcontentloaded" : "load", timeout: 30000 });
  if (opt("--wait") && isLoad) {
    // Script time is frozen, so a target that a timer or animation frame reveals would never appear.
    // Step the clock until it does. Whatever played while waiting is already past by the first frame.
    const target = page.locator(opt("--wait")).first();
    let waited = 0;
    while (!(await target.isVisible().catch(() => false))) {
      if (waited >= 10000) fail(`--wait "${opt("--wait")}" did not appear within 10 seconds of page time.`, 2);
      await page.clock.runFor(50); waited += 50;
    }
  } else if (opt("--wait")) await page.locator(opt("--wait")).first().waitFor({ timeout: 10000 });
  if (!isLoad) await settle(page);
  for (const a of [...all("--before"), ...actions.slice(0, -1)]) { await act(page, a); await settle(page); }

  const clipBox = async () => {
    const box = await page.locator(opt("--clip")).first().boundingBox({ timeout: 500 }).catch(() => null);
    if (!box || !box.width || !box.height) return undefined;
    const pad = 24; const x = Math.max(0, box.x - pad), y = Math.max(0, box.y - pad);
    return { x, y, width: Math.max(1, Math.min(vp.width - x, box.width + pad * 2)), height: Math.max(1, Math.min(vp.height - y, box.height + pad * 2)) };
  };
  let clip = opt("--clip") ? await clipBox() : undefined;
  // An element the action reveals (a menu that is display: none, or not mounted yet) has no box until
  // after the trigger. In that case the crop is taken from its resting place once it exists.
  const lateClip = !!opt("--clip") && !clip;

  // Freeze script time, trigger, then let two frames of script run so libraries can start their animations.
  const shot = (file) => page.screenshot({ path: path.join(outDir, file), clip, animations: "allow", caret: "hide" });
  let before = isLoad || lateClip ? null : await shot("frames/before.png");
  // pauseAt can only move forward, and the page's clock keeps running while we ask it the time, so aim a
  // little ahead and widen the margin if the clock got there first.
  for (let margin = 100, tries = 0; !isLoad; margin *= 3, tries++) {
    try { await page.clock.pauseAt((await page.evaluate(() => Date.now())) + margin); break; }
    catch (e) { if (tries >= 3) throw e; }
  }
  if (!isLoad) { await page.evaluate(noteResting).catch(() => {}); await act(page, trigger); }
  await page.clock.runFor(34);
  const animations = await page.evaluate(scrub, [0, false]);
  if (lateClip) {
    const ends = animations.filter((x) => x.end != null).map((x) => x.end);
    if (ends.length) await page.evaluate(scrub, [Math.max(...ends), false]); // measure it where it comes to rest
    clip = await clipBox();
    if (ends.length) await page.evaluate(scrub, [0, false]);
  }
  const finite = animations.filter((a) => a.end != null).map((a) => a.end);
  const windowMs = CAP || Math.min(4000, Math.max(200, finite.length ? Math.max(...finite) : 600));
  const step = windowMs / (FRAMES - 1);

  const frames = [];
  let prev = null, t = 0;
  for (let i = 0; i < FRAMES; i++) {
    if (i > 0) {
      const next = Math.round(i * step);
      // Advance one display frame at a time and look for new animations after each, so one that a timer
      // starts between two captures is recorded with the time it really began, to within a frame.
      while (t < next) {
        const slice = Math.min(16, next - t);
        await page.clock.runFor(slice);
        t += slice;
        animations.push(...(await page.evaluate(scrub, [t, true])));
      }
    }
    const file = `frames/${String(i).padStart(2, "0")}.png`;
    const buf = await shot(file);
    frames.push({ i, t, pct: Math.round((t / windowMs) * 100), file, same: prev ? buf.equals(prev) : false });
    prev = buf;
  }
  await context.close();

  const moved = frames.filter((f) => f.i > 0 && !f.same).length;
  const instant = !!before && moved === 0 && !before.equals(fs.readFileSync(path.join(outDir, frames[0].file)));
  const clipNote = !opt("--clip") ? "" : !clip ? `; --clip "${opt("--clip")}" matched nothing visible, so frames show the whole viewport` : lateClip ? "; the crop was taken after the action revealed its target, so there is no before frame" : "";
  // A step that only starts when an earlier one finishes is not known when the window is chosen.
  const runsTo = Math.max(0, ...animations.filter((a) => a.end != null).map((a) => a.start + a.end));
  const cutNote = !CAP && runsTo > windowMs ? `; a later animation runs to about ${runsTo}ms, past this window, so capture again with --ms ${Math.ceil(runsTo / 50) * 50}` : "";
  const note = (animations.length
    ? `${animations.length} animation${animations.length === 1 ? "" : "s"} stepped frame by frame`
    : moved ? "no CSS or Web Animations found; script-driven motion stepped with a paused clock"
    : instant ? "the change was instant: the first frame already differs from before the action, and nothing moves after it"
    : "nothing changed on screen after the action") + clipNote + cutNote;
  // startedAt is time since the action. The first 34ms pass before frame 0, to let scripts start their animations.
  const meta = { url, action: trigger, instant, clip: clip || null, before: before ? "frames/before.png" : null, viewport: { width: vp.width, height: vp.height }, reducedMotion: flag("--reduced"), windowMs, frames, framesChanged: moved, animations: animations.map(({ start, ...a }) => ({ ...a, startedAt: start ? start + 34 : 0 })), note, errors };

  if (flag("--perf")) meta.perf = await perf(browser, actions, windowMs);

  const cols = Math.min(FRAMES, vp.width <= 500 && !clip ? 6 : 4);
  fs.writeFileSync(path.join(outDir, "sheet.html"), sheetHtml(meta, frames, cols));
  const sheet = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  await sheet.goto(pathToFileURL(path.join(outDir, "sheet.html")).href);
  await sheet.screenshot({ path: path.join(outDir, "sheet.png"), fullPage: true });
  await browser.close();
  fs.writeFileSync(path.join(outDir, "filmstrip.json"), JSON.stringify(meta, null, 1));
  return meta;
}

// A second run in real time: how many frames the browser produced, and how much layout and style work it did.
async function perf(browser, actions, captured) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, reducedMotion: flag("--reduced") ? "reduce" : "no-preference" });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const throttle = Number(opt("--throttle", 4));
  await cdp.send("Performance.enable");
  const metrics = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
  const sampler = () => { window.__gaps = []; let last = performance.now(); const tick = (now) => { window.__gaps.push(now - last); last = now; window.__raf = requestAnimationFrame(tick); }; window.__raf = requestAnimationFrame(tick); };
  const trigger = actions[actions.length - 1];
  let before;
  if (parseAction(trigger).kind === "load") {
    // A page entrance is measured from navigation: slow the CPU and start sampling before the page loads,
    // so the numbers cover the entrance itself and not the idle page after it.
    if (throttle > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
    await page.addInitScript(sampler);
    before = await metrics();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    // Sampling runs from navigation. If the capture waited for a target, wait for it here too, so the
    // window that follows covers the same entrance the frames show.
    if (opt("--wait")) await page.locator(opt("--wait")).first().waitFor({ timeout: 10000 });
  } else {
    await page.goto(url, { waitUntil: "load", timeout: 30000 });
    if (opt("--wait")) await page.locator(opt("--wait")).first().waitFor({ timeout: 10000 });
    await settle(page);
    for (const a of [...all("--before"), ...actions.slice(0, -1)]) { await act(page, a); await settle(page); }
    if (throttle > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
    // The action may load a new document, which would discard a sampler started only in this one.
    await page.addInitScript(sampler);
    await page.evaluate(sampler);
    before = await metrics();
    await act(page, trigger);
  }
  const windowMs = CAP || Math.max(600, captured || 0); // cover the same stretch of time the frames show
  await new Promise((r) => setTimeout(r, windowMs + 100));
  const after = await metrics();
  const gaps = await page.evaluate(() => { cancelAnimationFrame(window.__raf); return (window.__gaps || []).slice(1); }).catch(() => []);
  await context.close();
  const long = gaps.filter((g) => g > 25);
  return {
    cpuThrottle: throttle, windowMs: windowMs + 100, frames: gaps.length,
    longFrames: long.length, worstFrameMs: gaps.length ? Math.round(Math.max(...gaps)) : null,
    layouts: Math.round(after.LayoutCount - before.LayoutCount), styleRecalcs: Math.round(after.RecalcStyleCount - before.RecalcStyleCount),
    layoutMs: Math.round((after.LayoutDuration - before.LayoutDuration) * 1000), scriptMs: Math.round((after.ScriptDuration - before.ScriptDuration) * 1000),
  };
}

checkOut(); // before anything else, so an unsafe output path is refused whether or not a browser is available
const pw = await loadPlaywright();
const meta = await capture(pw);
if (flag("--json")) { console.log(JSON.stringify({ ...meta, out: outDir }, null, 1)); process.exit(0); }

const lines = [`Filmstrip: ${meta.action} at ${meta.viewport.width}×${meta.viewport.height}${meta.reducedMotion ? ", reduced motion on" : ""}`, `${meta.frames.length} frames over ${meta.windowMs}ms. ${meta.note}. ${meta.framesChanged} of ${meta.frames.length - 1} later frames differ from the one before.`];
if (meta.animations.length) {
  lines.push("", "What moved");
  for (const a of meta.animations.slice(0, 30)) lines.push(`  ${a.target}  ${a.properties.join(", ") || a.name}  ${a.delay ? a.delay + "ms delay + " : ""}${a.duration}ms${a.iterations === "infinite" ? " infinite" : ""}  ${a.keyframeEasing && a.easing === "linear" ? a.keyframeEasing : a.easing}  ${a.layout.length ? "LAYOUT (" + a.layout.join(", ") + ")" : a.discrete ? "switch" : a.composited ? "compositor" : "paint"}`);
  if (meta.animations.length > 30) lines.push(`  and ${meta.animations.length - 30} more in filmstrip.json`);
}
if (meta.reducedMotion && meta.animations.some((a) => a.duration > 0 && a.properties.some((p) => /transform|translate|scale|rotate|top|left|width|height/.test(p)))) lines.push("", "Movement still runs with reduced motion on. Replace it with a fade or an instant change.");
if (meta.perf) { const p = meta.perf; lines.push("", `Real-time run at ${p.cpuThrottle}× CPU slowdown, ${p.windowMs}ms`, `  ${p.frames} frames, ${p.longFrames} over 25ms, worst ${p.worstFrameMs}ms`, `  ${p.layouts} layouts (${p.layoutMs}ms), ${p.styleRecalcs} style recalculations, ${p.scriptMs}ms of script`); }
if (meta.errors.length) lines.push("", "Page errors during capture", ...meta.errors.slice(0, 5).map((e) => "  " + e));
lines.push("", `Look at: ${path.join(outDir, "sheet.png")}`, `Frames:  ${path.join(outDir, "frames")}`, `Data:    ${path.join(outDir, "filmstrip.json")}`);
console.log(lines.join("\n"));
