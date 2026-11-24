// Browser QA pass of one site, in Playwright Chromium with Apple device emulation.
//   node tests/qa/run.mjs --target http://localhost:4001 --label integration [--ref http://localhost:4000] [--quick]
// Writes <out>/<label>/browser.json and screenshots under <out>/<label>/shots/. With --ref, the same
// pass runs on the reference too and each finding is marked "new" or "pre-existing".
//
// What this is: Chromium with iPhone, iPad and MacBook viewports, pixel ratios, user agents and touch.
// What this is not: Safari, WebKit or a physical device. webkit.mjs covers the WebKit engine
// (WebKitGTK); physical iPhone, iPad and Mac Safari runs are separate and done by a person.
import { chromium } from "playwright";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { DEVICES, SCHEMES, TOUCH_MIN, routeSample, slugOf } from "./config.mjs";
import { clipboardRecorder, pageFacts, smallTargets, runningAnimations, focusInfo, copyControls } from "./checks.mjs";
import { composeCopy } from "../../lib/copy.ts";
import { AGENTS, INSTALL_MESSAGE } from "../../lib/site.ts";

const require = createRequire(import.meta.url);
const { values: args } = parseArgs({ options: {
  target: { type: "string" }, ref: { type: "string" }, baseline: { type: "string" }, label: { type: "string", default: "target" },
  out: { type: "string", default: new URL("../../../.artifacts/qa", import.meta.url).pathname },
  quick: { type: "boolean", default: false }, routes: { type: "string" }, paths: { type: "string" }, owner: { type: "string", default: "?" }, shots: { type: "boolean", default: true },
} });
if (!args.target) { console.error("need --target"); process.exit(2); }

const data = JSON.parse(readFileSync(new URL("../../content/generated.json", import.meta.url), "utf8"));
let axeSource;
try { axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8"); }
catch { console.warn("axe-core is not installed; run `npm i --no-save axe-core@4.10.3` in site/ to add accessibility scans."); }

let ROUTES = routeSample(data);
if (args.routes) { const want = args.routes.split(","); ROUTES = ROUTES.filter((r) => want.some((w) => r.path === w || r.family === w)); }
// --paths tests arbitrary pages (say, a lane's fixture pages) instead of the standard sample.
if (args.paths) ROUTES = args.paths.split(",").map((path) => ({ path, family: "custom", owner: args.owner }));
const devices = args.quick ? DEVICES.filter((d) => d.id === "macbook" || d.id === "iphone") : DEVICES;

const browser = await chromium.launch();
const results = {};
if (args.ref) results.ref = await pass(args.ref.replace(/\/$/, ""), "ref", false);
// --baseline <label> reuses an earlier pass (say, of main) instead of running the reference again.
else if (args.baseline) results.ref = JSON.parse(readFileSync(`${args.out}/${args.baseline}/browser.json`, "utf8"));
results.target = await pass(args.target.replace(/\/$/, ""), args.label, args.shots);
await browser.close();

const findings = compare(results.target.findings, results.ref?.findings);
// Byte parity of copy payloads: every text a reference page copies must still be copyable on the target page.
for (const [path, refCopies] of Object.entries(results.ref?.copies || {}).filter(([path]) => ROUTES.some((r) => r.path === path))) {
  const tgt = new Set((results.target.copies[path] || []).flatMap((c) => c.text.split("\n---\n")));
  const route = ROUTES.find((r) => r.path === path) || { owner: "?", family: "?" };
  for (const c of refCopies) for (const t of c.text.split("\n---\n")) {
    if (t && !tgt.has(t)) findings.push({ owner: route.owner, family: route.family, path, where: "macbook/light", severity: "blocker", check: "payload-lost", status: "new",
      detail: `"${c.control}" on the reference copies ${t.length} chars (${JSON.stringify(t.slice(0, 60))}…) that no control on the target copies`, key: `${path}|payload-lost|${t}` });
  }
}
const order = { blocker: 0, serious: 1, moderate: 2, minor: 3 };
findings.sort((a, b) => (a.status === "new" ? 0 : 1) - (b.status === "new" ? 0 : 1) || order[a.severity] - order[b.severity] || a.owner.localeCompare(b.owner));
const dir = `${args.out}/${args.label}`;
mkdirSync(dir, { recursive: true });
const summary = {
  target: args.target, ref: args.ref || (args.baseline ? `baseline ${args.baseline}` : null), engine: `Chromium ${browser.version()} via Playwright (emulation)`,
  devices: devices.map((d) => d.label), schemes: SCHEMES, routes: ROUTES.map((r) => r.path), when: new Date().toISOString(),
  counts: Object.fromEntries(["new", "pre-existing"].map((s) => [s, Object.fromEntries(Object.keys(order).map((v) => [v, findings.filter((f) => f.status === s && f.severity === v).length]))])),
};
writeFileSync(`${dir}/browser.json`, JSON.stringify({ summary, findings, facts: results.target.facts, copies: results.target.copies }, null, 2));
console.log(JSON.stringify(summary.counts, null, 2));
for (const f of findings.filter((f) => f.status === "new").slice(0, 60)) console.log(`${f.severity.padEnd(8)} ${f.owner.padEnd(13)} ${f.check.padEnd(22)} ${f.path} [${f.where}] ${f.detail}`);

// ---------------------------------------------------------------------------------------------

// Build hashes and query strings change between any two builds; strip them so the same error on main
// and on a branch get the same key.
function stable(s) { return String(s).replace(/\/_next\/static\/[^\s"')]+/g, "/_next/static/…").replace(/\?[^\s"')]*/g, "").replace(/\b[0-9a-f]{8,}\b/g, "…"); }

function compare(target, ref) {
  if (!ref) return target.map((f) => ({ ...f, status: "new" }));
  const seen = new Set(ref.map((f) => stable(f.key)));
  return target.map((f) => ({ ...f, status: seen.has(stable(f.key)) ? "pre-existing" : "new" }));
}

async function pass(base, label, shots) {
  const findings = [], facts = {}, copies = {};
  const add = (route, where, severity, check, detail, keyExtra = "") =>
    findings.push({ owner: route.owner, family: route.family, path: route.path, where, severity, check, detail, key: `${route.path}|${where}|${check}|${stable(keyExtra || detail)}` });
  const shotDir = `${args.out}/${label}/shots`;
  if (shots) mkdirSync(shotDir, { recursive: true });

  for (const route of ROUTES) {
    for (const dev of devices) {
      for (const scheme of SCHEMES) {
        const where = `${dev.id}/${scheme}`;
        const ctx = await browser.newContext({ ...dev.ctx, colorScheme: scheme, permissions: ["clipboard-read", "clipboard-write"] });
        await ctx.addInitScript(clipboardRecorder, false);
        const page = await ctx.newPage();
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push("console: " + m.text().slice(0, 160)); });
        // Vercel Analytics only exists on Vercel, so its script 404s on a local build.
        page.on("response", (r) => { if (r.status() >= 400 && !r.url().includes("/_vercel/") && r.url() !== base + route.path) errors.push(`console: ${r.status()} for ${r.url().replace(base, "")}`); });
        let res;
        try { res = await page.goto(base + route.path, { waitUntil: "load", timeout: 30000 }); await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {}); }
        catch (e) { add(route, where, "blocker", "load", String(e).slice(0, 200)); await ctx.close(); continue; }
        const want = route.status || 200;
        if (res.status() !== want) add(route, where, "blocker", "status", `expected ${want}, got ${res.status()}`);
        await page.waitForTimeout(600);

        const f = await page.evaluate(pageFacts);
        facts[`${route.path}|${where}`] = f;
        if (f.sideScroll > 1) add(route, where, "serious", "side-scroll", `page scrolls sideways by ${f.sideScroll}px; wide: ${f.wide.join(", ")}`, "x");
        if (route.family !== "home" && f.h1.length !== 1) add(route, where, "serious", "h1", `${f.h1.length} visible h1 (${f.h1.join(" | ")})`, String(f.h1.length));
        if (!f.lang) add(route, where, "serious", "lang", "no lang on <html>");
        if (!f.landmarks.main) add(route, where, "serious", "landmark", "no <main>");
        if (!f.skipLink) add(route, where, "moderate", "skip-link", "no skip link to #main");
        if (route.status !== 404 && !f.canonical && !/noindex/.test(f.robots || "")) add(route, where, "moderate", "canonical", "no canonical link");
        if (/user-scalable=no|maximum-scale=1(\.0)?\b/.test(f.viewport || "")) add(route, where, "serious", "zoom-blocked", `viewport meta blocks zoom: ${f.viewport}`);
        for (const e of errors) add(route, where, e.startsWith("console") ? "minor" : "serious", "js-error", e);

        if (dev.ctx.hasTouch && scheme === "light") {
          const small = await page.evaluate(smallTargets, TOUCH_MIN);
          for (const s of small) add(route, where, "moderate", "touch-target", `"${s.name}" ${s.tag} is ${s.w}x${s.h}px (<${TOUCH_MIN})`, s.name + s.tag);
        }

        if (axeSource) {
          await page.addScriptTag({ content: axeSource });
          const axe = await page.evaluate(async () => {
            const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] }, resultTypes: ["violations"] });
            return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 4).map((n) => n.target.join(" ")), count: v.nodes.length }));
          });
          const sev = { critical: "blocker", serious: "serious", moderate: "moderate", minor: "minor" };
          for (const v of axe) add(route, where, sev[v.impact] || "minor", `axe:${v.id}`, `${v.help} (${v.count}): ${v.nodes.join(" ; ")}`, v.id);
        }

        // Interior pages must not animate by themselves (contract rule 7). Home is Fable's and exempt.
        if (route.family !== "home" && dev.id === "macbook" && scheme === "light") {
          await page.waitForTimeout(1500);
          const anim = (await page.evaluate(runningAnimations)).filter((a) => a.infinite || a.duration > 2000);
          for (const a of anim) add(route, where, "moderate", "self-animation", `${a.name} on ${a.target} keeps running`, a.target);
        }

        if (shots) await page.screenshot({ path: `${shotDir}/${slugOf(route.path)}--${dev.id}-${scheme}.png`, fullPage: route.family !== "home", animations: "disabled", timeout: 60000 }).catch((e) => add(route, where, "minor", "screenshot", String(e).slice(0, 120)));

        try {
          if (dev.id === "macbook") await focusWalk(page, route, where, add);
          if (dev.id === "macbook" && scheme === "light") copies[route.path] = await copyAll(page, route, where, add);
        } catch (e) { add(route, where, "minor", "harness", String(e.message).split("\n")[0].slice(0, 200)); }
        await ctx.close();
      }
    }
    await reducedMotion(base, route, add).catch((e) => add(route, "iphone/reduced-motion", "minor", "harness", String(e.message).split("\n")[0]));
    await zoom200(base, route, add).catch((e) => add(route, "zoom200/light", "minor", "harness", String(e.message).split("\n")[0]));
    console.error(`[${label}] ${route.path} done`);
  }
  await journeys(base, add);
  return { findings, facts, copies };
}

// Tab through the page: the first stop should be the skip link, every stop should show a focus ring and
// be on screen, and focus must keep moving (no trap) for the first 40 stops.
async function focusWalk(page, route, where, add) {
  await page.evaluate(() => { window.scrollTo(0, 0); document.activeElement?.blur?.(); });
  const seen = [];
  let stuck = 0, last = "";
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    const f = await page.evaluate(focusInfo);
    if (f.tag === "body") break;
    if (i === 0 && !/skip/i.test(f.name)) add(route, where, "moderate", "focus-order", `first Tab stop is "${f.name}" (${f.tag}), not the skip link`, "first");
    if (!f.ring) add(route, where, "serious", "focus-visible", `no visible focus ring on "${f.name}" (${f.tag} ${f.href || ""})`, f.name + f.tag);
    if (!f.onScreen) add(route, where, "moderate", "focus-offscreen", `focused "${f.name}" is off screen or zero-size`, f.name + f.tag);
    if (f.key === last) { if (++stuck >= 2) { add(route, where, "blocker", "focus-trap", `focus stays on "${f.name}"`); break; } } else stuck = 0;
    if (seen.length > 3 && seen.indexOf(f.key) === 0 && i < 6) { add(route, where, "serious", "focus-trap", `focus cycles after ${i} stops`); break; }
    seen.push(f.key);
    last = f.key;
  }
}

// Click every visible copy control and record what reached the clipboard. The report compares these
// payloads byte for byte with the reference, and with the known payloads from lib/copy.ts and lib/site.ts.
async function copyAll(page, route, where, add) {
  await page.evaluate(() => { window.__qaCopies = []; document.querySelectorAll("details:not([open])").forEach((d) => { d.open = true; }); });
  await page.waitForTimeout(150);
  const ctrls = await page.evaluate(copyControls);
  const got = [];
  for (const c of ctrls.slice(0, 30)) {
    const before = await page.evaluate(() => window.__qaCopies.length);
    const loc = page.locator(`[data-qa-copy="${c.id}"]`);
    try { await loc.scrollIntoViewIfNeeded({ timeout: 2000 }); await loc.click({ timeout: 3000 }); }
    catch { add(route, where, "moderate", "copy-click", `could not click "${c.name}"`, c.name); continue; }
    await page.waitForTimeout(150);
    const text = await page.evaluate((n) => window.__qaCopies.slice(n).join("\n---\n"), before);
    if (!text) add(route, where, "serious", "copy-empty", `"${c.name}" put nothing on the clipboard`, c.name);
    got.push({ control: c.name, text });
  }
  const p = data.prompts.find((x) => route.path === `/prompts/${x.slug}`);
  if (p && !got.some((g) => g.text === composeCopy(p))) add(route, where, "blocker", "payload", `no copy control produced the exact payload of ${p.id} from lib/copy.ts`);
  const s = data.skills.find((x) => route.path === `/skills/${x.name}`);
  if (s && !got.some((g) => g.text === `npx skills add AtlasScope/agent-kit --skill ${s.name}`)) add(route, where, "blocker", "payload", `no control copies the exact skills.sh command for ${s.name}`);
  if (route.path === "/install") {
    if (!got.some((g) => g.text === INSTALL_MESSAGE)) add(route, where, "blocker", "payload", "no control copies INSTALL_MESSAGE exactly");
  }
  return got;
}

// With reduced motion, nothing should travel or loop once the page has settled.
async function reducedMotion(base, route, add) {
  const dev = DEVICES.find((d) => d.id === "iphone");
  const ctx = await browser.newContext({ ...dev.ctx, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  if (!(await page.goto(base + route.path, { waitUntil: "load" }).then(() => true).catch(() => false))) { await ctx.close(); return; }
  await page.waitForTimeout(2000);
  const anim = await page.evaluate(runningAnimations);
  for (const a of anim) add(route, "iphone/reduced-motion", route.family === "home" ? "moderate" : "serious", "reduced-motion", `${a.name} on ${a.target} runs with reduced motion on${a.infinite ? " (loops)" : ""}`, a.target);
  await ctx.close();
}

// 200% browser zoom on a 1440px window is a 720px CSS viewport at twice the pixel ratio (WCAG 1.4.10 reflow
// needs no side scroll down to 320px; 1.4.4 needs text to scale to 200%).
async function zoom200(base, route, add) {
  const ctx = await browser.newContext({ viewport: { width: 720, height: 450 }, deviceScaleFactor: 4 });
  const page = await ctx.newPage();
  if (!(await page.goto(base + route.path, { waitUntil: "load" }).then(() => true).catch(() => false))) { await ctx.close(); return; }
  await page.waitForTimeout(400);
  const f = await page.evaluate(pageFacts);
  if (f.sideScroll > 1) add(route, "zoom200/light", "serious", "reflow-200", `scrolls sideways by ${f.sideScroll}px at 200% zoom; wide: ${f.wide.join(", ")}`, "x");
  await page.setViewportSize({ width: 320, height: 640 });
  await page.waitForTimeout(300);
  const g = await page.evaluate(pageFacts);
  if (g.sideScroll > 1) add(route, "reflow320/light", "serious", "reflow-320", `scrolls sideways by ${g.sideScroll}px at 320px (WCAG 1.4.10); wide: ${g.wide.join(", ")}`, "x");
  await ctx.close();
}

// Keyboard and interaction journeys that don't depend on class names.
async function journeys(base, add) {
  const J = (path, owner, family) => ({ path, owner, family });
  // Each journey runs on its own; one that throws becomes a finding instead of ending the run.
  const guard = async (route, where, fn) => { try { await fn(); } catch (e) { add(route, where, "serious", "journey-error", String(e.message || e).split("\n")[0].slice(0, 200)); } };

  // Search from the keyboard: "/" focuses the field, typing lists results, arrows and Enter open one.
  await guard({ path: "journeys", owner: "?", family: "journey" }, "journey", async () => {
    const route = J("/prompts", "W3", "search");
    const ctx = await browser.newContext({ ...DEVICES[0].ctx });
    const page = await ctx.newPage();
    await page.goto(base + "/prompts", { waitUntil: "load" });
    await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {}); // let it hydrate
    await page.keyboard.press("/");
    const focused = await page.evaluate(() => ({ tag: document.activeElement?.tagName, role: document.activeElement?.getAttribute("role"), type: document.activeElement?.getAttribute("type") }));
    if (!(focused.role === "combobox" || focused.tag === "INPUT")) add(route, "macbook/keyboard", "serious", "search-slash", `"/" did not focus a search field (focus on ${focused.tag})`);
    else {
      await page.keyboard.type("slow page", { delay: 30 });
      const opt = page.locator('[role="option"] a, [role="option"][href], [role="listbox"] a').first();
      const ok = await opt.waitFor({ timeout: 5000 }).then(() => true).catch(() => false);
      if (!ok) add(route, "macbook/keyboard", "serious", "search-results", 'typing "slow page" showed no result links');
      else {
        const from = page.url();
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Enter");
        const moved = await page.waitForURL((u) => u.toString() !== from, { timeout: 5000 }).then(() => true).catch(() => false);
        if (!moved) add(route, "macbook/keyboard", "serious", "search-enter", "ArrowDown then Enter did not open a result");
      }
    }
    // Escape should leave the field and close any results.
    await page.goto(base + "/prompts", { waitUntil: "load" });
    await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {}); // let it hydrate
    await page.keyboard.press("/");
    await page.keyboard.type("design");
    await page.waitForTimeout(800);
    await page.keyboard.press("Escape");
    // A first Escape that clears the query is fine; the second must close.
    if (await page.locator('[role="listbox"]:visible [role="option"]').count()) await page.keyboard.press("Escape");
    const open = await page.locator('[role="listbox"]:visible [role="option"]').count();
    if (open > 0) add(route, "macbook/keyboard", "moderate", "search-escape", "Escape left the results open");
    // A command palette shortcut, if the site has one (W3 plans ⌘K). Recorded, not required.
    await page.keyboard.press("Meta+k");
    await page.waitForTimeout(300);
    await ctx.close();
  });

  // The menu on iPad width opens from the keyboard, closes on Escape and gives focus back.
  await guard({ path: "journeys", owner: "?", family: "journey" }, "journey", async () => {
    const route = J("/prompts", "W2", "shell");
    const ctx = await browser.newContext({ ...DEVICES.find((d) => d.id === "ipad").ctx });
    const page = await ctx.newPage();
    await page.goto(base + "/prompts", { waitUntil: "load" });
    await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {}); // let it hydrate
    const menu = page.getByRole("button", { name: /^menu$/i }).first();
    if (await menu.isVisible().catch(() => false)) {
      await menu.focus();
      await page.keyboard.press("Enter");
      const dlg = page.getByRole("dialog");
      const opened = await dlg.waitFor({ timeout: 3000 }).then(() => true).catch(() => false);
      if (!opened) add(route, "ipad/keyboard", "serious", "menu-open", "Enter on Menu did not open a dialog");
      else {
        const inside = await page.evaluate(() => !!document.activeElement?.closest('dialog, [role="dialog"]'));
        if (!inside) add(route, "ipad/keyboard", "serious", "menu-focus", "focus did not move into the open menu");
        await page.keyboard.press("Escape");
        const closed = await dlg.waitFor({ state: "hidden", timeout: 3000 }).then(() => true).catch(() => false);
        if (!closed) add(route, "ipad/keyboard", "serious", "menu-escape", "Escape did not close the menu");
        const back = await page.evaluate(() => /menu/i.test(document.activeElement?.getAttribute("aria-label") || document.activeElement?.textContent || ""));
        if (!back) add(route, "ipad/keyboard", "moderate", "menu-return", "focus did not return to the Menu button after closing");
      }
    }
    await ctx.close();
  });

  // Copy when the browser refuses the clipboard: the page must say so on screen, not fail silently.
  await guard({ path: "journeys", owner: "?", family: "journey" }, "journey", async () => {
    const p = data.prompts.find((x) => x.id === "PG01");
    const route = J(`/prompts/${p.slug}`, "W5", "prompt-detail");
    const ctx = await browser.newContext({ ...DEVICES.find((d) => d.id === "iphone").ctx });
    await ctx.addInitScript(clipboardRecorder, true);
    const page = await ctx.newPage();
    await page.goto(base + route.path, { waitUntil: "load" });
    await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {}); // let it hydrate
    const ctrls = await page.evaluate(copyControls);
    if (ctrls[0]) {
      await page.locator(`[data-qa-copy="${ctrls[0].id}"]`).click();
      await page.waitForTimeout(300);
      // Feedback has to be on the button or in a live region, worded as a failure.
      const said = await page.evaluate((id) => [document.querySelector(`[data-qa-copy="${id}"]`)?.textContent || "", ...[...document.querySelectorAll('[role="status"], [role="alert"], [aria-live]')].map((e) => e.textContent)].join(" "), ctrls[0].id);
      if (!/blocked|couldn.t copy|not copied|select the text|denied/i.test(said)) add(route, "iphone/clipboard-denied", "serious", "copy-denied", `with the clipboard refused, "${ctrls[0].name}" gave no visible fallback`);
      const selectable = await page.evaluate(() => [...document.querySelectorAll("pre, code, textarea")].some((el) => getComputedStyle(el).userSelect !== "none" && el.textContent.length > 40));
      if (!selectable) add(route, "iphone/clipboard-denied", "serious", "copy-fallback", "no selectable copy of the payload on the page to fall back to");
    }
    await ctx.close();
  });

  // Every agent tab on /install copies its exact steps.
  await guard({ path: "journeys", owner: "?", family: "journey" }, "journey", async () => {
    const route = J("/install", "W9", "install");
    const ctx = await browser.newContext({ ...DEVICES[0].ctx });
    await ctx.addInitScript(clipboardRecorder, false);
    const page = await ctx.newPage();
    await page.goto(base + "/install", { waitUntil: "load" });
    await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {}); // let it hydrate
    await page.evaluate(() => { window.__qaCopies = []; document.querySelectorAll("details:not([open])").forEach((d) => { d.open = true; }); });
    await page.waitForTimeout(200);
    // The tabs the reference shows (SHOWN in components/install-choice.ts). Every tab present must copy
    // exactly its agent's steps from lib/site.ts.
    for (const id of ["claude", "codex", "cursor", "any"]) {
      const agent = AGENTS.find((a) => a.id === id);
      const tab = page.getByRole("tab", { name: agent.label });
      if (!(await tab.count())) { add(route, "macbook/light", "serious", "install-agent", `no tab named "${agent.label}"`, agent.id); continue; }
      await tab.first().click();
      const ctrls = await page.evaluate(copyControls);
      const n = await page.evaluate(() => window.__qaCopies.length);
      for (const c of ctrls) await page.locator(`[data-qa-copy="${c.id}"]`).click({ timeout: 2000 }).catch(() => {});
      const texts = await page.evaluate((k) => window.__qaCopies.slice(k), n);
      if (!texts.includes(agent.steps.join("\n"))) add(route, "macbook/light", "blocker", "install-command", `${agent.label}: no control copies its exact steps`, agent.id);
    }
    await ctx.close();
  });
}
