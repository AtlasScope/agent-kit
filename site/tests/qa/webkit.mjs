// WebKit-engine QA pass through WebKitGTK (see webkit/wk.py for what that is and is not).
//   node tests/qa/webkit.mjs --target http://localhost:4001 --label integration [--ref http://localhost:4000]
// Needs xvfb-run, python3 with PyGObject, gir1.2-webkit2-4.1 and python3-gi-cairo. Set WK_PYTHON if
// the default python3 can't import gi.
// Covers layout, side scroll, h1, axe, light and dark, reduced motion, copy payloads and screenshots
// in the WebKit engine. Not covered here: touch, iOS Safari chrome and safe areas, the Mac font stack,
// and keyboard Tab order (Safari skips links on Tab by default, which WebKitGTK does not model).
import { fileURLToPath } from "node:url";
import { driver } from "./webkit/driver.mjs";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { DEVICES, SCHEMES, routeSample, slugOf } from "./config.mjs";
import { clipboardRecorder, pageFacts, runningAnimations, copyControls } from "./checks.mjs";
import { composeCopy } from "../../lib/copy.ts";
import { INSTALL_MESSAGE } from "../../lib/site.ts";

const require = createRequire(import.meta.url);
const { values: args } = parseArgs({ options: {
  target: { type: "string" }, ref: { type: "string" }, baseline: { type: "string" }, label: { type: "string", default: "target" },
  out: { type: "string", default: fileURLToPath(new URL("../../../.artifacts/qa", import.meta.url)) },
  routes: { type: "string" }, quick: { type: "boolean", default: false },
} });
if (!args.target) { console.error("need --target"); process.exit(2); }

const data = JSON.parse(readFileSync(new URL("../../content/generated.json", import.meta.url), "utf8"));
let axeSource = null;
try { axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8"); } catch {}
let ROUTES = routeSample(data);
if (args.routes) { const want = args.routes.split(","); ROUTES = ROUTES.filter((r) => want.some((w) => r.path === w || r.family === w)); }

// WebKitGTK scales by whole numbers only, so every Apple size runs at 2x (the iPhone is really 3x).
const WK_DEVICES = DEVICES.filter((d) => d.id !== "desktop" && (!args.quick || d.id !== "ipad")).map((d) => {
  const vp = d.ctx.screen && d.id === "iphone" ? { width: d.ctx.viewport.width, height: d.ctx.screen.height } : d.ctx.viewport;
  return { id: d.id, label: d.label.replace(/@\dx \(emulated\)/, "@2x (WebKitGTK window)"), ...vp };
});


// axe goes in with the start-of-document script; passing it as a call argument trips WebKitGTK.
const recorder = `(${clipboardRecorder.toString()})(false);\n${axeSource || ""}`;
const results = {};
if (args.ref) results.ref = await pass(args.ref.replace(/\/$/, ""), "ref", false);
else if (args.baseline) results.ref = JSON.parse(readFileSync(`${args.out}/${args.baseline}/webkit.json`, "utf8"));
results.target = await pass(args.target.replace(/\/$/, ""), args.label, true);

const seen = new Set((results.ref?.findings || []).map((f) => f.key));
const findings = results.target.findings.map((f) => ({ ...f, status: results.ref && seen.has(f.key) ? "pre-existing" : "new" }));
const order = { blocker: 0, serious: 1, moderate: 2, minor: 3 };
findings.sort((a, b) => (a.status === "new" ? 0 : 1) - (b.status === "new" ? 0 : 1) || order[a.severity] - order[b.severity]);
const dir = `${args.out}/${args.label}`;
mkdirSync(dir, { recursive: true });
const summary = {
  target: args.target, ref: args.ref || (args.baseline ? `baseline ${args.baseline}` : null), engine: `WebKitGTK ${results.target.version} (WebKit engine, not Safari)`,
  devices: WK_DEVICES.map((d) => d.label), routes: ROUTES.map((r) => r.path), when: new Date().toISOString(),
  counts: Object.fromEntries(["new", "pre-existing"].map((s) => [s, Object.fromEntries(Object.keys(order).map((v) => [v, findings.filter((f) => f.status === s && f.severity === v).length]))])),
};
writeFileSync(`${dir}/webkit.json`, JSON.stringify({ summary, findings, copies: results.target.copies }, null, 2));
console.log(JSON.stringify(summary, null, 2));
for (const f of findings.filter((f) => f.status === "new").slice(0, 40)) console.log(`${f.severity.padEnd(8)} ${f.owner.padEnd(13)} ${f.check.padEnd(20)} ${f.path} [${f.where}] ${f.detail}`);

async function pass(base, label, shots) {
  const d = driver();
  const findings = [], copies = {};
  const add = (route, where, severity, check, detail, keyExtra = "") =>
    findings.push({ owner: route.owner, family: route.family, path: route.path, where: `webkit/${where}`, severity, check, detail, key: `${route.path}|${where}|${check}|${stable(keyExtra || detail)}` });
  // Same normalisation as run.mjs, so build hashes and query strings do not make a finding look new.
  function stable(s) { return String(s).replace(/\/_next\/static\/[^\s"')]+/g, "/_next/static/…").replace(/\?[^\s"')]*/g, "").replace(/\b[0-9a-f]{8,}\b/g, "…"); }
  const shotDir = `${args.out}/${label}/shots-webkit`;
  if (shots) mkdirSync(shotDir, { recursive: true });
  let version = "?";
  for (const route of ROUTES) {
    for (const dev of WK_DEVICES) {
      for (const scheme of SCHEMES) {
        const where = `${dev.id}/${scheme}`;
        const o = await d.send({ cmd: "open", url: base + route.path, width: dev.width, height: dev.height, dark: scheme === "dark", init: recorder });
        if (!o.ok) { add(route, where, "blocker", "load", o.error || "did not load"); continue; }
        try {
          version = await d.call(() => (navigator.userAgent.match(/AppleWebKit\/[\d.]+/) || ["?"])[0]);
          const f = await d.call(pageFacts);
          if (f.sideScroll > 1) add(route, where, "serious", "side-scroll", `scrolls sideways by ${f.sideScroll}px; wide: ${f.wide.join(", ")}`, "x");
          if (route.family !== "home" && f.h1.length !== 1) add(route, where, "serious", "h1", `${f.h1.length} visible h1`, String(f.h1.length));
          if (axeSource && (scheme === "light" || dev.id === "iphone")) {
            const axe = await d.call(async () => (await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] }, resultTypes: ["violations"] }))
              .violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map((n) => n.target.join(" ")), count: v.nodes.length })));
            const sev = { critical: "blocker", serious: "serious", moderate: "moderate", minor: "minor" };
            for (const v of axe) add(route, where, sev[v.impact] || "minor", `axe:${v.id}`, `${v.help} (${v.count}): ${v.nodes.join(" ; ")}`, v.id);
          }
          if (dev.id === "macbook" && scheme === "light") {
            const ctrls = await d.call(copyControls);
            const got = [];
            for (const c of ctrls.slice(0, 30)) {
              const text = await d.call(async (id, name) => {
                const n = window.__qaCopies.length;
                // React may have replaced the node since it was marked; fall back to the same name.
                const el = document.querySelector(`[data-qa-copy="${id}"]`) || [...document.querySelectorAll("button, [role=button]")].find((b) => (b.getAttribute("aria-label") || b.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60) === name);
                if (!el) return null;
                el.click();
                await new Promise((r) => setTimeout(r, 150));
                return window.__qaCopies.slice(n).join("\n---\n");
              }, c.id, c.name);
              if (text === null) continue;
              if (!text) add(route, where, "serious", "copy-empty", `"${c.name}" put nothing on the clipboard`, c.name);
              got.push({ control: c.name, text });
            }
            copies[route.path] = got;
            const p = data.prompts.find((x) => route.path === `/prompts/${x.slug}`);
            if (p && !got.some((g) => g.text === composeCopy(p))) add(route, where, "blocker", "payload", `no control produced ${p.id}'s exact payload`);
            if (route.path === "/install" && !got.some((g) => g.text === INSTALL_MESSAGE)) add(route, where, "blocker", "payload", "no control copies INSTALL_MESSAGE exactly");
          }
          if (shots) {
            const s = await d.send({ cmd: "shot", path: `${shotDir}/${slugOf(route.path)}--${dev.id}-${scheme}.png`, full: route.family !== "home" });
            if (!s.ok) add(route, where, "minor", "screenshot", s.error);
          }
        } catch (e) { add(route, where, "serious", "harness", String(e.message || e).slice(0, 200)); }
      }
    }
    // Reduced motion, iPhone size.
    const dev = WK_DEVICES.find((x) => x.id === "iphone");
    const o = await d.send({ cmd: "open", url: base + route.path, width: dev.width, height: dev.height, reduce: true, init: recorder, settle: 2000 });
    if (o.ok) {
      const anim = await d.call(runningAnimations).catch(() => []);
      for (const a of anim) add(route, "iphone/reduced-motion", route.family === "home" ? "moderate" : "serious", "reduced-motion", `${a.name} on ${a.target} runs with reduced motion on`, a.target);
    }
    console.error(`[webkit ${label}] ${route.path} done`);
  }
  await d.quit();
  return { findings, copies, version };
}
