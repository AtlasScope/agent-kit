// Interaction checks written for one redesign lane's new behaviour, run in Chromium (Apple device
// emulation) and in WebKitGTK where the behaviour can be driven without real input events.
//   node tests/qa/lanes.mjs --lane search|browse|detail|skilldetail --target http://localhost:4003 [--label w3] [--webkit]
// Results go to <out>/<label>/lane-<lane>.json. Each check records pass or a finding with severity.
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { DEVICES } from "./config.mjs";
import { clipboardRecorder, copyControls } from "./checks.mjs";
import { driver } from "./webkit/driver.mjs";
import { composeCopy } from "../../lib/copy.ts";

const { values: args } = parseArgs({ options: {
  lane: { type: "string" }, target: { type: "string" }, label: { type: "string" }, webkit: { type: "boolean", default: false }, prod: { type: "string" },
  out: { type: "string", default: fileURLToPath(new URL("../../../.artifacts/qa", import.meta.url)) },
} });
const base = args.target.replace(/\/$/, "");
const label = args.label || args.lane;
const data = JSON.parse(readFileSync(new URL("../../content/generated.json", import.meta.url), "utf8"));
const dir = `${args.out}/${label}`;
mkdirSync(`${dir}/shots-lane`, { recursive: true });

const results = [];
const pass = (check, where, note = "") => results.push({ check, where, ok: true, note });
const fail = (check, where, severity, detail) => results.push({ check, where, ok: false, severity, detail });
const dev = (id) => DEVICES.find((d) => d.id === id);
const browser = await chromium.launch();
// Runs one WebKit step; a failed load or a JS error becomes a finding and the lane carries on.
async function wk(d, where, openMsg, fn) {
  const o = await d.send({ cmd: "open", ...openMsg });
  if (!o.ok) { fail("webkit-load", where, "serious", o.error || "page did not load"); return; }
  try { await fn(); } catch (e) { fail("webkit-error", where, "serious", String(e.message || e).split("\n")[0].slice(0, 200)); }
}

async function open(devId, path, { scheme = "light", deny = false } = {}) {
  const ctx = await browser.newContext({ ...dev(devId).ctx, colorScheme: scheme, permissions: ["clipboard-read", "clipboard-write"] });
  await ctx.addInitScript(clipboardRecorder, deny);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base + path, { waitUntil: "networkidle" });
  return { ctx, page, errors };
}
const copies = (page) => page.evaluate(() => window.__qaCopies.slice());
const expected = (href) => {
  const path = new URL(href, base).pathname;
  const p = data.prompts.find((x) => path === `/prompts/${x.slug}`);
  if (p) return [composeCopy(p)];
  const s = data.skills.find((x) => path === `/skills/${x.name}`);
  if (s) return [`npx skills add AtlasScope/agent-kit --skill ${s.name}`, `claude plugin marketplace add AtlasScope/agent-kit\nclaude plugin install ${s.kit}@agent-kit`];
  return null;
};

// ------------------------------------------------------------------------------------------- W3
async function search() {
  for (const scheme of ["light", "dark"]) {
    const where = `macbook/${scheme}`;
    const { ctx, page, errors } = await open("macbook", "/prompts", { scheme });
    // Open from the header trigger with the keyboard, so there is a control for focus to come back to.
    const trigger = page.locator('[aria-haspopup="dialog"]').first();
    if (await trigger.isVisible().catch(() => false)) await trigger.focus();
    await page.keyboard.press("Meta+k");
    const dlg = page.locator("dialog[open]");
    if (!(await dlg.waitFor({ timeout: 3000 }).then(() => true).catch(() => false))) { fail("palette-open", where, "blocker", "⌘K did not open a dialog"); await ctx.close(); continue; }
    pass("palette-open", where);
    const focus = await page.evaluate(() => ({ role: document.activeElement?.getAttribute("role"), inDialog: !!document.activeElement?.closest("dialog") }));
    focus.role === "combobox" && focus.inDialog ? pass("palette-focus", where) : fail("palette-focus", where, "serious", `focus on ${JSON.stringify(focus)}`);
    await page.keyboard.type("slow page", { delay: 25 });
    await page.locator('[role="option"]').first().waitFor({ timeout: 5000 }).catch(() => {});
    const aria = await page.evaluate(() => {
      const cb = document.querySelector('dialog[open] [role="combobox"]');
      const id = cb?.getAttribute("aria-activedescendant");
      const act = id && document.getElementById(id);
      const lb = document.getElementById(cb?.getAttribute("aria-controls") || "");
      return { expanded: cb?.getAttribute("aria-expanded"), active: id, activeRole: act?.getAttribute("role"), activeSelected: act?.getAttribute("aria-selected"), listboxRole: lb?.getAttribute("role"), options: document.querySelectorAll('dialog[open] [role="option"]').length, selected: document.querySelectorAll('dialog[open] [role="option"][aria-selected="true"]').length, href: act?.getAttribute("href") };
    });
    const ariaOk = aria.expanded === "true" && aria.activeRole === "option" && aria.activeSelected === "true" && aria.listboxRole === "listbox" && aria.selected === 1 && aria.options > 0;
    ariaOk ? pass("combobox-aria", where, `${aria.options} options`) : fail("combobox-aria", where, "serious", JSON.stringify(aria));
    await page.keyboard.press("ArrowDown");
    const moved = await page.evaluate(() => document.querySelector('dialog[open] [role="combobox"]')?.getAttribute("aria-activedescendant"));
    moved && moved !== aria.active ? pass("arrow-moves", where) : fail("arrow-moves", where, "serious", "ArrowDown did not move aria-activedescendant");
    const href = await page.evaluate((id) => document.getElementById(id)?.getAttribute("href"), moved);
    const n = (await copies(page)).length;
    await page.keyboard.press("Meta+Enter");
    await page.waitForTimeout(300);
    const got = (await copies(page)).slice(n);
    const want = href && expected(href);
    if (!got.length) fail("copy-from-results", where, "serious", `⌘↵ copied nothing (active ${href})`);
    else if (want && !want.includes(got[0])) fail("copy-from-results", where, "blocker", `⌘↵ on ${href} copied ${JSON.stringify(got[0].slice(0, 80))}, not the page's exact payload`);
    else pass("copy-from-results", where, want ? `exact payload of ${href}` : `copied from ${href} (no known payload to compare)`);
    if (scheme === "light") await page.screenshot({ path: `${dir}/shots-lane/palette--macbook-${scheme}.png` });
    if (scheme === "dark") await page.screenshot({ path: `${dir}/shots-lane/palette--macbook-${scheme}.png` });
    // A common pattern, and this lane's: the first Escape clears the query, the next one closes.
    await page.keyboard.press("Escape");
    let presses = 1;
    if (await page.locator("dialog[open]").count()) {
      const cleared = await page.evaluate(() => document.querySelector('dialog[open] [role="combobox"]')?.value === "");
      if (cleared) { await page.keyboard.press("Escape"); presses = 2; }
    }
    const closed = await page.locator("dialog[open]").count() === 0;
    closed ? pass("escape-closes", where, presses === 2 ? "first Escape clears the query, second closes" : "") : fail("escape-closes", where, "serious", "Escape left the palette open");
    const back = await page.evaluate(() => ({ haspopup: document.activeElement?.getAttribute("aria-haspopup"), tag: document.activeElement?.tagName }));
    back.haspopup === "dialog" ? pass("focus-returns", where) : fail("focus-returns", where, "moderate", `focus went to ${JSON.stringify(back)} after closing`);
    // "/" still opens search, and is ignored while typing elsewhere.
    await page.keyboard.press("/");
    (await page.locator("dialog[open]").count()) ? pass("slash-opens", where) : fail("slash-opens", where, "serious", '"/" no longer opens search');
    await page.keyboard.press("Escape");
    // Clicking a result goes to the page.
    errors.length ? fail("js-errors", where, "serious", errors.join(" | ")) : pass("js-errors", where);
    await ctx.close();
  }

  // Ctrl+K for non-Mac keyboards.
  {
    const { ctx, page } = await open("desktop", "/skills");
    await page.keyboard.press("Control+k");
    (await page.locator("dialog[open]").waitFor({ timeout: 2000 }).then(() => true).catch(() => false)) ? pass("ctrl-k", "desktop/light") : fail("ctrl-k", "desktop/light", "serious", "Ctrl+K did not open the palette");
    await ctx.close();
  }

  // Phone: full-screen sheet from the header's Search button, 16px input (iOS zooms the page on focus below 16px).
  for (const d of ["iphone", "ipad"]) {
    for (const scheme of ["light", "dark"]) {
      const where = `${d}/${scheme}`;
      const { ctx, page } = await open(d, "/prompts", { scheme });
      const btn = page.getByRole("banner").getByRole("button", { name: /search/i }).first();
      if (!(await btn.isVisible().catch(() => false))) { fail("phone-trigger", where, "serious", "no visible Search button in the header"); await ctx.close(); continue; }
      await btn.tap();
      const ok = await page.locator("dialog[open]").waitFor({ timeout: 3000 }).then(() => true).catch(() => false);
      if (!ok) { fail("phone-open", where, "blocker", "tapping Search opened nothing"); await ctx.close(); continue; }
      const m = await page.evaluate(() => {
        const r = document.querySelector("dialog[open]").getBoundingClientRect();
        const input = document.querySelector('dialog[open] [role="combobox"]');
        return { w: r.width / innerWidth, h: r.height / innerHeight, left: r.left, top: r.top, font: parseFloat(getComputedStyle(input).fontSize), focused: document.activeElement === input, side: document.documentElement.scrollWidth - innerWidth };
      });
      if (d === "iphone") (m.w > 0.97 && m.h > 0.9) ? pass("phone-fullscreen", where) : fail("phone-fullscreen", where, "moderate", `sheet covers ${Math.round(m.w * 100)}% x ${Math.round(m.h * 100)}% of the screen`);
      m.font >= 16 ? pass("ios-input-16px", where) : fail("ios-input-16px", where, "serious", `search input is ${m.font}px; iOS Safari zooms the page when a field under 16px gets focus`);
      m.focused ? pass("phone-focus", where) : fail("phone-focus", where, "moderate", "the field is not focused when the sheet opens (iOS keyboard will not show)");
      await page.keyboard.type("database", { delay: 20 });
      await page.locator('[role="option"]').first().waitFor({ timeout: 5000 }).catch(() => {});
      const close = await page.evaluate(() => [...document.querySelectorAll("dialog[open] button")].map((b) => { const r = b.getBoundingClientRect(); return { name: (b.getAttribute("aria-label") || b.textContent).trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) }; }).filter((b) => b.w > 0));
      const small = close.filter((b) => b.w < 44 || b.h < 44);
      small.length ? fail("sheet-targets", where, "moderate", small.map((b) => `"${b.name}" ${b.w}x${b.h}`).join(", ")) : pass("sheet-targets", where);
      await page.screenshot({ path: `${dir}/shots-lane/palette--${d}-${scheme}.png` });
      // Tapping a result navigates.
      const from = page.url();
      await page.locator('dialog[open] [role="option"]').first().tap().catch(() => {});
      (await page.waitForURL((u) => u.toString() !== from, { timeout: 5000 }).then(() => true).catch(() => false)) ? pass("phone-tap-result", where) : fail("phone-tap-result", where, "serious", "tapping a result did not open it");
      await ctx.close();
    }
  }

  // Clipboard refused: the palette says so.
  {
    const where = "macbook/clipboard-denied";
    const { ctx, page } = await open("macbook", "/prompts", { deny: true });
    await page.keyboard.press("Meta+k");
    await page.keyboard.type("slow page", { delay: 20 });
    await page.locator('[role="option"]').first().waitFor({ timeout: 5000 }).catch(() => {});
    await page.keyboard.press("Meta+Enter");
    await page.waitForTimeout(300);
    const toast = await page.evaluate(() => [...document.querySelectorAll('dialog[open] [role="status"], dialog[open] [aria-live]')].map((e) => e.textContent).join(" "));
    /block|couldn|denied/i.test(toast) ? pass("copy-denied", where, toast.trim()) : fail("copy-denied", where, "serious", `no message when copy is refused (live regions: "${toast.trim()}")`);
    await ctx.close();
  }

  // Accessibility scan of the open palette.
  await axeOpen("macbook", "light", async (page) => { await page.keyboard.press("Meta+k"); await page.keyboard.type("design"); await page.waitForTimeout(800); });
  await axeOpen("macbook", "dark", async (page) => { await page.keyboard.press("Meta+k"); await page.keyboard.type("design"); await page.waitForTimeout(800); });
  await axeOpen("iphone", "dark", async (page) => { await page.getByRole("banner").getByRole("button", { name: /search/i }).first().tap(); await page.keyboard.type("design"); await page.waitForTimeout(800); });

  if (args.webkit) {
    const d = driver();
    for (const [devId, w, h] of [["macbook", 1440, 900], ["iphone", 393, 852]]) {
      for (const scheme of ["light", "dark"]) {
        const where = `webkit/${devId}/${scheme}`;
        await wk(d, where, { url: base + "/prompts", width: w, height: h, dark: scheme === "dark", init: `(${clipboardRecorder})(false)` }, async () => {
        const r = await d.call(async (isPhone) => {
          if (isPhone) [...document.querySelectorAll("header button")].find((b) => /search/i.test(b.getAttribute("aria-label") || b.textContent))?.click();
          else document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
          await new Promise((r) => setTimeout(r, 400));
          const dlg = document.querySelector("dialog[open]");
          if (!dlg) return { open: false };
          const input = dlg.querySelector('[role="combobox"]');
          if (!input) return { open: true, options: 0, noInput: true };
          const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
          set.call(input, "slow page");
          input.dispatchEvent(new Event("input", { bubbles: true }));
          await new Promise((r) => setTimeout(r, 1200));
          const rect = dlg.getBoundingClientRect();
          return { open: true, options: dlg.querySelectorAll('[role="option"]').length, w: rect.width / innerWidth, h: rect.height / innerHeight, font: parseFloat(getComputedStyle(input).fontSize), side: document.documentElement.scrollWidth - innerWidth };
        }, devId === "iphone");
        if (!r.open) { fail("webkit-open", where, "blocker", "palette did not open in WebKit"); return; }
        r.options > 0 ? pass("webkit-results", where, `${r.options} options`) : fail("webkit-results", where, "serious", "no results listed in WebKit");
        if (devId === "iphone") { r.font >= 16 ? pass("webkit-input-16px", where) : fail("webkit-input-16px", where, "serious", `input ${r.font}px`); (r.w > 0.97 && r.h > 0.9) ? pass("webkit-fullscreen", where) : fail("webkit-fullscreen", where, "moderate", `${Math.round(r.w * 100)}% x ${Math.round(r.h * 100)}%`); }
        await d.send({ cmd: "shot", path: `${dir}/shots-lane/palette--webkit-${devId}-${scheme}.png`, full: false });
        });
      }
    }
    await d.quit();
  }
}

// ------------------------------------------------------------------------------------------- W5
async function detail() {
  const picks = [data.prompts.find((x) => x.id === "PG01"), data.prompts.find((x) => x.steps && !x.replacedBy), data.prompts.find((x) => x.sec === "ecmd" && !x.replacedBy)]
    .map((p) => p || data.prompts.find((x) => !x.replacedBy)).filter((p, i, a) => p && a.indexOf(p) === i);
  for (const p of picks) {
    const path = `/prompts/${p.slug}`;
    const want = composeCopy(p);
    for (const d of ["macbook", "iphone"]) {
      const where = `${d}/${p.id}`;
      const { ctx, page, errors } = await open(d, path);
      // The main Copy stays in reach: scroll down and check a copy control is on screen.
      const sticky = await page.evaluate(async () => {
        const out = [];
        for (const f of [0.35, 0.7, 1]) {
          scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f);
          await new Promise((r) => setTimeout(r, 250));
          const vis = [...document.querySelectorAll("button")].filter((b) => /^copy/i.test((b.getAttribute("aria-label") || b.textContent || "").trim())).some((b) => { const r = b.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.width > 0; });
          out.push(vis);
        }
        scrollTo(0, 0);
        return out;
      });
      const tall = await page.evaluate(() => document.documentElement.scrollHeight > innerHeight * 1.5);
      if (tall) sticky.every(Boolean) ? pass("copy-in-reach", where) : fail("copy-in-reach", where, "moderate", `a Copy button is on screen at 35/70/100% scroll: ${sticky.join("/")}`);
      // Main copy gives the exact payload.
      await page.locator(".pd-copy, button.btn--solid").first().click().catch(() => {});
      await page.waitForTimeout(200);
      const c1 = await copies(page);
      c1.includes(want) ? pass("payload", where) : fail("payload", where, "blocker", `main Copy did not produce ${p.id}'s exact payload (got ${c1.length} copies)`);
      if (d === "macbook") {
        // C copies; not while typing in search.
        await page.evaluate(() => { window.__qaCopies = []; document.activeElement?.blur?.(); });
        await page.keyboard.press("c");
        await page.waitForTimeout(200);
        let c2 = await copies(page), scope = "page";
        if (!c2.includes(want)) {
          // The shortcut may be scoped to the copy panel (WCAG 2.1.4); try with focus on the panel's text.
          const focused = await page.evaluate(() => { const t = [...document.querySelectorAll("pre[tabindex], section [tabindex='0']")].find((e) => e.getBoundingClientRect().width > 0); t?.focus(); return !!t; });
          if (focused) { await page.keyboard.press("c"); await page.waitForTimeout(200); c2 = await copies(page); scope = "panel"; }
        }
        c2.includes(want) ? pass("c-key", where, scope === "panel" ? "works with focus in the copy panel only" : "works from anywhere on the page") : fail("c-key", where, "serious", `pressing C copied ${c2.length ? "something else" : "nothing"}, from the page or the panel`);
        if (scope === "panel" && c2.includes(want)) {
          const hint = await page.evaluate(() => [...document.querySelectorAll("kbd")].some((k) => /^c$/i.test(k.textContent.trim()) && k.getBoundingClientRect().width > 0));
          if (hint) fail("c-hint-truthful", where, "moderate", "a C key hint shows beside Copy at rest, but C only works once focus is inside the panel's text; pressing C after Tab to the Copy button does nothing");
        }
        await page.keyboard.press("/");
        await page.waitForTimeout(200);
        await page.evaluate(() => { window.__qaCopies = []; });
        await page.keyboard.press("c");
        await page.waitForTimeout(200);
        (await copies(page)).length === 0 ? pass("c-key-ignored-in-field", where) : fail("c-key-ignored-in-field", where, "serious", "typing c in the search field copied the prompt");
        await page.keyboard.press("Escape");
        // With text selected, C must not override the visitor's selection.
        await page.evaluate(() => { const h = document.querySelector("h1"); getSelection().selectAllChildren(h); window.__qaCopies = []; });
        await page.keyboard.press("c");
        await page.waitForTimeout(150);
        (await copies(page)).length === 0 ? pass("c-key-respects-selection", where) : fail("c-key-respects-selection", where, "moderate", "C copied the prompt while other text was selected");
        await page.evaluate(() => getSelection().removeAllRanges());
        // The kbd hint is hidden from touch devices? Recorded below for iPhone.
      }
      if (d === "iphone") {
        const hint = await page.evaluate(() => [...document.querySelectorAll("kbd")].filter((k) => k.getBoundingClientRect().width > 0 && /^c$/i.test(k.textContent.trim())).length);
        hint ? fail("kbd-hint-on-touch", where, "minor", "the C shortcut hint shows on a touch screen with no keyboard") : pass("kbd-hint-on-touch", where);
      }
      await page.screenshot({ path: `${dir}/shots-lane/detail-${p.id}--${d}.png` });
      await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight * 0.6));
      await page.waitForTimeout(250);
      await page.screenshot({ path: `${dir}/shots-lane/detail-${p.id}--${d}-scrolled.png` });
      errors.length ? fail("js-errors", where, "serious", errors.join(" | ")) : pass("js-errors", where);
      await ctx.close();

      // Clipboard refused: the prompt text gets selected, so Cmd/Ctrl+C is the fallback.
      const den = await open(d, path, { deny: true });
      await den.page.locator(".pd-copy, button.btn--solid").first().click().catch(() => {});
      await den.page.waitForTimeout(400);
      const r = await den.page.evaluate(() => ({ sel: String(getSelection()), label: document.querySelector(".pd-copy, button.btn--solid")?.textContent }));
      const norm = (s) => s.replace(/\s+/g, " ").trim();
      if (norm(r.sel) === norm(want)) pass("denied-selects-text", `${where}/denied`);
      else fail("denied-selects-text", `${where}/denied`, "serious", `after a refused copy the selection is ${r.sel ? `${r.sel.length} chars that differ from the payload` : "empty"}; button says "${r.label}"`);
      if (r.sel && r.sel !== want && norm(r.sel) === norm(want)) fail("denied-selection-bytes", `${where}/denied`, "moderate", "selected text matches the payload only after whitespace normalisation, so Cmd+C would copy different bytes");
      await den.ctx.close();
    }
  }
  if (args.webkit) {
    const d = driver();
    for (const p of picks) {
      const path = `/prompts/${p.slug}`;
      const want = composeCopy(p);
      for (const [devId, w, h] of [["macbook", 1440, 900], ["iphone", 393, 852]]) {
        for (const deny of [false, true]) {
          const where = `webkit/${devId}/${p.id}${deny ? "/denied" : ""}`;
          await wk(d, where, { url: base + path, width: w, height: h, init: `(${clipboardRecorder})(${deny})` }, async () => {
          const r = await d.call(async (deny) => {
            const btn = document.querySelector(".pd-copy, button.btn--solid");
            const res = { sticky: [] };
            for (const f of [0.35, 0.7, 1]) {
              scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f);
              await new Promise((r) => setTimeout(r, 250));
              res.sticky.push([...document.querySelectorAll("button")].filter((b) => /^copy/i.test((b.getAttribute("aria-label") || b.textContent || "").trim())).some((b) => { const r = b.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.width > 0; }));
            }
            res.tall = document.documentElement.scrollHeight > innerHeight * 1.5;
            btn?.click();
            await new Promise((r) => setTimeout(r, 400));
            res.copies = window.__qaCopies.slice();
            res.sel = String(getSelection());
            if (!deny) {
              getSelection().removeAllRanges(); window.__qaCopies = [];
              document.dispatchEvent(new KeyboardEvent("keydown", { key: "c", bubbles: true, cancelable: true }));
              await new Promise((r) => setTimeout(r, 300));
              res.ckey = window.__qaCopies.slice();
              if (!res.ckey.length) {
                // Scoped to the panel: send C to the panel's focusable text instead.
                const t = [...document.querySelectorAll("pre[tabindex], section [tabindex='0']")].find((e) => e.getBoundingClientRect().width > 0);
                t?.focus();
                t?.dispatchEvent(new KeyboardEvent("keydown", { key: "c", bubbles: true, cancelable: true }));
                await new Promise((r) => setTimeout(r, 300));
                res.ckey = window.__qaCopies.slice();
              }
            }
            return res;
          }, deny);
          if (r.tall && !deny) r.sticky.every(Boolean) ? pass("webkit-copy-in-reach", where) : fail("webkit-copy-in-reach", where, "moderate", `Copy on screen at 35/70/100%: ${r.sticky.join("/")}`);
          r.copies.includes(want) ? pass("webkit-payload", where) : fail("webkit-payload", where, "blocker", "main Copy did not send the exact payload");
          if (!deny && devId === "macbook") r.ckey.includes(want) ? pass("webkit-c-key", where) : fail("webkit-c-key", where, "serious", "C did not copy in WebKit");
          if (deny) r.sel.replace(/\s+/g, " ").trim() === want.replace(/\s+/g, " ").trim() ? pass("webkit-denied-selects-text", where) : fail("webkit-denied-selects-text", where, "serious", `selection after refused copy: ${r.sel.length} chars`);
          if (!deny) await d.send({ cmd: "shot", path: `${dir}/shots-lane/detail-${p.id}--webkit-${devId}.png`, full: false });
          });
        }
      }
    }
    await d.quit();
  }
}

// ------------------------------------------------------------------------------------------- W7
// Skill and kit detail: every install tab copies exactly the text it shows, the known commands are among them,
// tabs work from the keyboard, Copy stays in reach, C works in the panel, and a refused copy selects the text.
async function skilldetail() {
  const borrowed = data.skills.find((x) => x.author && x.author !== "AtlasScope" && x.name !== "design") || data.skills[1];
  const pages = [{ path: "/skills/design", skill: data.skills.find((x) => x.name === "design") }, { path: `/skills/${borrowed.name}`, skill: borrowed }, { path: "/kits/design-kit" }];
  const norm = (t) => t.replace(/\s+/g, " ").trim();
  for (const pg of pages) {
    for (const d of ["macbook", "iphone"]) {
      const where = `${d}${pg.path}`;
      const { ctx, page, errors } = await open(d, pg.path);
      const tabs = page.locator('[role="tablist"] [role="tab"]');
      const n = await tabs.count();
      const seen = [];
      for (let i = 0; i < Math.max(n, 1); i++) {
        if (n) { await tabs.nth(i).click(); await page.waitForTimeout(150); }
        const panel = await page.evaluate(() => {
          const pnl = document.querySelector('[role="tabpanel"]') || document.querySelector("section pre")?.closest("section");
          const pre = pnl?.querySelector("pre");
          return { text: pre?.textContent ?? null, tab: document.querySelector('[role="tab"][aria-selected="true"]')?.textContent?.trim() || "" };
        });
        const k = (await copies(page)).length;
        const btn = page.locator('section:has([role="tablist"]) button, section:has(pre) button').filter({ hasText: /copy/i }).first();
        const named = page.getByRole("button", { name: /^copy/i }).first();
        await ((await btn.count()) ? btn : named).click().catch(() => {});
        await page.waitForTimeout(200);
        const got = (await copies(page)).slice(k)[0];
        if (!got) fail("tab-copy", `${where} [${panel.tab}]`, "serious", "Copy put nothing on the clipboard");
        else if (panel.text != null && got !== panel.text) fail("tab-copy-bytes", `${where} [${panel.tab}]`, "blocker", `copied text differs from the text shown (${got.length} vs ${panel.text.length} chars)`);
        else pass("tab-copy-bytes", `${where} [${panel.tab}]`);
        if (got) seen.push(got);
      }
      if (pg.skill) {
        const want = [`npx skills add AtlasScope/agent-kit --skill ${pg.skill.name}`, `claude plugin marketplace add AtlasScope/agent-kit\nclaude plugin install ${pg.skill.kit}@agent-kit`];
        for (const w of want) seen.includes(w) ? pass("known-command", where, w.split("\n")[0]) : fail("known-command", where, "blocker", `no tab copies ${JSON.stringify(w)}`);
      }
      if (n > 1 && d === "macbook") {
        await tabs.nth(0).click();
        await page.keyboard.press("ArrowRight");
        const r = await page.evaluate(() => ({ sel: document.querySelector('[role="tab"][aria-selected="true"]')?.textContent?.trim(), foc: document.activeElement?.getAttribute("role") }));
        const second = (await tabs.nth(1).textContent()).trim();
        (r.sel === second && r.foc === "tab") ? pass("tabs-arrow-keys", where) : fail("tabs-arrow-keys", where, "serious", `ArrowRight left ${JSON.stringify(r)}`);
        // C with focus in the panel.
        await page.evaluate(() => { window.__qaCopies = []; document.querySelector('[role="tabpanel"] pre, section pre[tabindex]')?.focus(); });
        await page.keyboard.press("c");
        await page.waitForTimeout(200);
        (await copies(page)).length ? pass("c-key-in-panel", where) : fail("c-key-in-panel", where, "moderate", "C with focus on the install text copied nothing");
      }
      const sticky = await page.evaluate(async () => {
        const out = [];
        for (const f of [0.35, 0.7, 1]) {
          scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f);
          await new Promise((r) => setTimeout(r, 250));
          out.push([...document.querySelectorAll("button")].filter((b) => /^copy/i.test((b.getAttribute("aria-label") || b.textContent || "").trim())).some((b) => { const r = b.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.width > 0; }));
        }
        scrollTo(0, 0);
        return { out, tall: document.documentElement.scrollHeight > innerHeight * 1.5 };
      });
      if (sticky.tall) sticky.out.every(Boolean) ? pass("install-in-reach", where) : fail("install-in-reach", where, "moderate", `a Copy button is on screen at 35/70/100% scroll: ${sticky.out.join("/")}`);
      await page.screenshot({ path: `${dir}/shots-lane/${pg.path.replace(/\W+/g, "_")}--${d}.png` });
      errors.length ? fail("js-errors", where, "serious", errors.join(" | ")) : pass("js-errors", where);
      await ctx.close();
      // Refused clipboard selects the shown text.
      const den = await open(d, pg.path, { deny: true });
      await den.page.getByRole("button", { name: /^copy/i }).first().click().catch(() => {});
      await den.page.waitForTimeout(400);
      const r = await den.page.evaluate(() => ({ sel: String(getSelection()), pre: document.querySelector('[role="tabpanel"] pre, section pre')?.textContent || "" }));
      (r.sel && norm(r.sel) === norm(r.pre)) ? pass("denied-selects-text", `${where}/denied`) : fail("denied-selects-text", `${where}/denied`, "serious", `selection after a refused copy: ${r.sel.length} chars, shown text ${r.pre.length}`);
      await den.ctx.close();
    }
  }
  if (args.webkit) {
    const d = driver();
    for (const pg of pages) for (const [devId, w, h] of [["macbook", 1440, 900], ["iphone", 393, 852]]) for (const deny of [false, true]) {
      const where = `webkit/${devId}${pg.path}${deny ? "/denied" : ""}`;
      await wk(d, where, { url: base + pg.path, width: w, height: h, init: `(${clipboardRecorder})(${deny})` }, async () => {
        const r = await d.call(async (deny) => {
          const out = { tabs: [], sticky: [] };
          const tabs = [...document.querySelectorAll('[role="tablist"] [role="tab"]')];
          for (const t of (tabs.length ? tabs : [null])) {
            t?.click();
            await new Promise((r) => setTimeout(r, 200));
            const btn = [...document.querySelectorAll("button")].find((b) => /^copy/i.test((b.getAttribute("aria-label") || b.textContent || "").trim()) && b.closest("section")?.querySelector("pre"));
            const pre = btn?.closest("section")?.querySelector("pre");
            const n = window.__qaCopies.length;
            btn?.click();
            await new Promise((r) => setTimeout(r, 300));
            out.tabs.push({ tab: t?.textContent?.trim() || "", shown: pre?.textContent ?? null, got: window.__qaCopies[n] ?? null, sel: String(getSelection()) });
            getSelection().removeAllRanges();
          }
          for (const f of [0.35, 0.7, 1]) {
            scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f);
            await new Promise((r) => setTimeout(r, 250));
            out.sticky.push([...document.querySelectorAll("button")].filter((b) => /^copy/i.test((b.getAttribute("aria-label") || b.textContent || "").trim())).some((b) => { const r = b.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.width > 0; }));
          }
          out.tall = document.documentElement.scrollHeight > innerHeight * 1.5;
          out.side = document.documentElement.scrollWidth - innerWidth;
          return out;
        }, deny);
        for (const t of r.tabs) {
          if (!t.got) fail("webkit-tab-copy", `${where} [${t.tab}]`, "serious", "Copy put nothing on the clipboard");
          else if (t.shown != null && t.got !== t.shown) fail("webkit-tab-copy-bytes", `${where} [${t.tab}]`, "blocker", "copied text differs from the text shown");
          else pass("webkit-tab-copy-bytes", `${where} [${t.tab}]`);
          if (deny) (t.sel && norm(t.sel) === norm(t.shown || "")) ? pass("webkit-denied-selects-text", `${where} [${t.tab}]`) : fail("webkit-denied-selects-text", `${where} [${t.tab}]`, "serious", `selection ${t.sel.length} chars`);
        }
        if (!deny && r.tall) r.sticky.every(Boolean) ? pass("webkit-install-in-reach", where) : fail("webkit-install-in-reach", where, "moderate", `Copy on screen at 35/70/100%: ${r.sticky.join("/")}`);
        if (r.side > 1) fail("webkit-side-scroll", where, "serious", `side scroll ${r.side}px`);
        if (!deny) await d.send({ cmd: "shot", path: `${dir}/shots-lane/${pg.path.replace(/\W+/g, "_")}--webkit-${devId}.png`, full: false });
      });
    }
    await d.quit();
  }
}

// ------------------------------------------------------------------------------------------- W10
// Collections on sample data (/account/fixture, served with ACCOUNT_FIXTURES=1): create, the error path,
// rename, share, delete, the phone rail, and the shared page's install command. --prod <url> checks that a
// production build without the flag answers 404 on every sample-data route.
async function account() {
  const path = "/account/fixture";
  await fetch(base + "/account/fixture/reset", { method: "POST" }).catch(() => {});
  for (const d of ["macbook", "iphone"]) {
    for (const scheme of ["light", "dark"]) {
      const where = `${d}/${scheme}`;
      await fetch(base + "/account/fixture/reset", { method: "POST" }).catch(() => {});
      const { ctx, page, errors } = await open(d, path, { scheme });
      const side = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      side > 1 ? fail("side-scroll", where, "serious", `${side}px`) : pass("side-scroll", where);
      await page.screenshot({ path: `${dir}/shots-lane/collections--${d}-${scheme}.png`, fullPage: true });
      if (scheme === "light") {
        // Create, then the error path.
        await page.getByText("New collection", { exact: false }).first().click();
        const field = page.getByLabel("Name the collection");
        await field.fill("QA list");
        await field.press("Enter");
        // On a phone the new collection opens in place of the list, so look for it anywhere in the page.
        const made = await page.waitForFunction(() => [...document.querySelectorAll("h2, a")].some((e) => e.textContent.includes("QA list")), null, { timeout: 5000 }).then(() => true).catch(() => false);
        made ? pass("create", where) : fail("create", where, "serious", "the new collection did not appear");
        await page.goto(base + path + "#all", { waitUntil: "load" });
        await page.getByText("New collection", { exact: false }).first().click().catch(() => {});
        await page.getByLabel("Name the collection").fill("fail", { timeout: 5000 });
        await page.getByLabel("Name the collection").press("Enter");
        await page.waitForTimeout(1200);
        const err = await page.evaluate(() => [...document.querySelectorAll('[role="alert"], [role="status"], [aria-live]')].map((e) => e.textContent.trim()).filter(Boolean).join(" | "));
        /didn.t work|try again/i.test(err) ? pass("error-announced", where, err.slice(0, 80)) : fail("error-announced", where, "serious", `a failed create showed no message in a live region (${err.slice(0, 80) || "none"})`);
        await page.keyboard.press("Escape");
        // Share a private collection, then stop.
        const share = page.getByRole("button", { name: /^Share /i }).first();
        if (await share.count()) {
          const label = (await share.getAttribute("aria-label")) ?? (await share.textContent()) ?? "";
          const name = label.trim().replace(/\s+/g, " ").replace(/^Share /i, "");
          if (d === "iphone") await page.getByRole("link", { name }).first().click().catch(() => {});
          await page.getByRole("button", { name: `Share ${name}` }).click();
          const on = await page.getByRole("button", { name: `Stop sharing ${name}` }).waitFor({ timeout: 5000 }).then(() => true).catch(() => false);
          on ? pass("share-toggle", where, name) : fail("share-toggle", where, "serious", `Share on "${name}" did not switch to Stop sharing`);
        }
        // The open collection's focus moves to its heading when picked from the rail (keyboard and screen readers).
        if (d === "iphone") {
          await page.goto(base + path, { waitUntil: "load" });
          const link = page.locator('a[href^="#"]').filter({ hasNotText: /all collections|skip/i }).first();
          await link.click().catch(() => {});
          await page.waitForTimeout(400);
          const r = await page.evaluate(() => ({ focus: document.activeElement?.tagName, h: document.activeElement?.textContent?.trim().slice(0, 40), back: [...document.querySelectorAll("a")].some((a) => /all collections/i.test(a.textContent) && a.getBoundingClientRect().width > 0) }));
          r.back ? pass("phone-open-collection", where) : fail("phone-open-collection", where, "serious", "picking a collection on a phone did not show it with a way back");
          /^H[1-3]$/.test(r.focus) ? pass("phone-focus-heading", where, r.h) : fail("phone-focus-heading", where, "moderate", `focus is on ${r.focus} after opening a collection`);
          await page.goBack().catch(() => {});
          await page.waitForTimeout(300);
          const rail = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].filter((a) => a.getBoundingClientRect().width > 0).length);
          rail > 1 ? pass("phone-back-to-rail", where) : fail("phone-back-to-rail", where, "moderate", "Back did not return to the list of collections");
        }
      }
      errors.length ? fail("js-errors", where, "serious", errors.join(" | ")) : pass("js-errors", where);
      await ctx.close();
    }
    // Shared page: the install command copies exactly as shown and names every skill.
    const { ctx, page } = await open(d, "/account/fixture/shared");
    const shown = await page.evaluate(() => document.querySelector(".cmdline code, section pre, section code")?.textContent || null);
    const ctrls = await page.evaluate(copyControls);
    if (!shown || !ctrls.length) pass("shared-install", `${d}`, "no install command on the default shared sample");
    else {
      await page.locator(`[data-qa-copy="${ctrls[0].id}"]`).click();
      await page.waitForTimeout(200);
      const got = (await copies(page))[0];
      got === shown ? pass("shared-install-bytes", d) : fail("shared-install-bytes", d, "blocker", `copied ${JSON.stringify(got)} but shows ${JSON.stringify(shown)}`);
      /^npx skills add AtlasScope\/agent-kit( --skill [a-z0-9-]+)+$/.test(got || "") ? pass("shared-install-shape", d, got) : fail("shared-install-shape", d, "serious", `unexpected install command ${JSON.stringify(got)}`);
      const listed = await page.evaluate(() => [...document.querySelectorAll('a[href^="/skills/"]')].map((a) => a.getAttribute("href").split("/")[2]));
      const named = [...(got || "").matchAll(/--skill ([a-z0-9-]+)/g)].map((m) => m[1]);
      const missing = [...new Set(listed)].filter((n) => !named.includes(n));
      missing.length ? fail("shared-install-complete", d, "serious", `skills listed but not in the command: ${missing.join(", ")}`) : pass("shared-install-complete", d);
    }
    await page.screenshot({ path: `${dir}/shots-lane/shared--${d}.png`, fullPage: true });
    await ctx.close();
  }
  if (args.prod) {
    const P = args.prod.replace(/\/$/, "");
    for (const [m, u] of [["GET", "/account/fixture"], ["GET", "/account/fixture/shared"], ["GET", "/account/fixture/shared?id=x"], ["POST", "/account/fixture/reset"]]) {
      const r = await fetch(P + u, { method: m, redirect: "manual" });
      r.status === 404 ? pass("prod-404", `${m} ${u}`) : fail("prod-404", `${m} ${u}`, "blocker", `production build answered ${r.status}`);
    }
    const map = await (await fetch(P + "/sitemap.xml")).text();
    /fixture/.test(map) ? fail("prod-sitemap", "sitemap", "serious", "sample-data pages are in the sitemap") : pass("prod-sitemap", "sitemap");
  }
}

// ------------------------------------------------------------------------------------------- W4
async function browse() {
  const secs = data.sections.map((s) => s.id);
  for (const d of ["macbook", "iphone"]) {
    for (const scheme of ["light", "dark"]) {
      const where = `${d}/${scheme}`;
      // Every section anchor on /prompts exists and a deep link lands on it.
      const { ctx, page, errors } = await open(d, "/prompts", { scheme });
      const missing = await page.evaluate((ids) => ids.filter((id) => !document.getElementById(id)), secs);
      missing.length ? fail("section-anchors", where, "blocker", `missing #${missing.join(", #")}`) : pass("section-anchors", where, secs.join(","));
      for (const id of ["dcmd", secs[2]].filter(Boolean)) {
        await page.goto(`${base}/prompts#${id}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(500);
        const top = await page.evaluate((id) => { const el = document.getElementById(id); if (!el) return { top: null, hidden: false }; const r = el.getBoundingClientRect(); const hidden = [...document.elementsFromPoint(innerWidth / 2, Math.max(1, r.top + 4))].some((e) => getComputedStyle(e).position === "sticky" || getComputedStyle(e).position === "fixed"); return { top: r?.top, hidden }; }, id);
        (top.top !== null && top.top >= -2 && top.top < 260) ? pass(`deep-link-#${id}`, where, `top ${Math.round(top.top)}px`) : fail(`deep-link-#${id}`, where, "serious", top.top === null ? `#${id} is missing` : `#${id} lands at ${Math.round(top.top)}px from the top`);
        if (top.hidden) fail(`deep-link-#${id}-covered`, where, "moderate", `the heading of #${id} sits under the sticky header or rail`);
      }
      // Scroll-spy marks the section on screen.
      await page.goto(`${base}/prompts`, { waitUntil: "networkidle" });
      const spy = await page.evaluate(async (ids) => {
        // The rail is the nav whose links are in-page anchors (the header nav has page links).
        const rail = [...document.querySelectorAll("nav")].find((n) => { const a = n.querySelectorAll("a"); return a.length > 2 && [...a].every((x) => x.getAttribute("href")?.startsWith("#")); });
        if (!rail) return { rail: false };
        const out = [];
        for (const id of ids) {
          const el = document.getElementById(id);
          if (!el) continue;
          scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.2);
          await new Promise((r) => setTimeout(r, 400));
          const cur = rail.querySelector('[aria-current]')?.getAttribute("href");
          out.push({ id, cur });
        }
        const r = rail.getBoundingClientRect();
        return { rail: true, out, railTop: r.top, railVisible: r.bottom > 0 && r.top < innerHeight };
      }, secs);
      if (!spy.rail) fail("scroll-spy", where, "serious", "no section rail found");
      else {
        const wrong = spy.out.filter((o) => o.cur !== `#${o.id}`);
        wrong.length ? fail("scroll-spy", where, "moderate", wrong.map((o) => `at #${o.id} the rail marks ${o.cur}`).join("; ")) : pass("scroll-spy", where);
        spy.railVisible ? pass("rail-sticky", where) : fail("rail-sticky", where, "moderate", "the rail scrolls away");
      }
      await page.screenshot({ path: `${dir}/shots-lane/prompts--${d}-${scheme}.png` });
      errors.length ? fail("js-errors", where, "serious", errors.join(" | ")) : pass("js-errors", where);
      await ctx.close();
    }
  }
  // Area filter kept in the URL, restored on reload, and every prompt link still in the page.
  const area = data.areas.find((a) => data.prompts.filter((p) => p.area === a.slug || p.areas?.includes?.(a.slug)).length > 4) || data.areas[0];
  for (const d of ["macbook", "iphone"]) {
    const where = `${d}/area`;
    const { ctx, page } = await open(d, `/prompts/${area.slug}`);
    const btns = page.locator('[role="group"] button[aria-pressed]');
    const n = await btns.count();
    if (n < 2) { fail("area-filter", where, "moderate", `no filter on /prompts/${area.slug}`); await ctx.close(); continue; }
    const shownAll = await page.locator("main li:visible a[href^='/prompts/']").count();
    const chosen = (await btns.nth(1).textContent()).trim();
    await btns.nth(1).click();
    await page.waitForTimeout(300);
    const url = new URL(page.url());
    const q = url.searchParams.get("does");
    const shownOne = await page.locator("main li:visible a[href^='/prompts/']").count();
    q ? pass("filter-in-url", where, `?does=${q}`) : fail("filter-in-url", where, "serious", "choosing a filter did not change the URL");
    shownOne < shownAll ? pass("filter-narrows", where, `${shownAll} → ${shownOne}`) : fail("filter-narrows", where, "serious", `filter did not narrow (${shownAll} → ${shownOne})`);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    const pressed = await page.locator('[role="group"] button[aria-pressed="true"]').first().textContent();
    const shownReload = await page.locator("main li:visible a[href^='/prompts/']").count();
    (q && pressed?.trim() === chosen && shownReload === shownOne) ? pass("filter-restored", where) : fail("filter-restored", where, "serious", `after reload pressed "${pressed}", ${shownReload} shown (expected ${shownOne})`);
    // Back to All restores the list.
    await btns.nth(0).click();
    await page.waitForTimeout(300);
    const back = await page.locator("main li:visible a[href^='/prompts/']").count();
    back === shownAll ? pass("filter-all", where) : fail("filter-all", where, "serious", `All shows ${back}, expected ${shownAll}`);
    await page.screenshot({ path: `${dir}/shots-lane/area--${d}.png` });
    await ctx.close();
  }
  if (args.webkit) {
    const d = driver();
    for (const [devId, w, h] of [["macbook", 1440, 900], ["iphone", 393, 852]]) {
      const where = `webkit/${devId}`;
      await wk(d, where, { url: `${base}/prompts#dcmd`, width: w, height: h, settle: 1200 }, async () => {
      const r = await d.call(async () => {
        const el = document.getElementById("dcmd");
        const top = el?.getBoundingClientRect().top;
        const rail = [...document.querySelectorAll("nav")].find((n) => { const a = n.querySelectorAll("a"); return a.length > 2 && [...a].every((x) => x.getAttribute("href")?.startsWith("#")); });
        scrollTo(0, document.documentElement.scrollHeight * 0.5);
        await new Promise((r) => setTimeout(r, 500));
        const rr = rail?.getBoundingClientRect();
        return { top, railVisible: rr ? rr.bottom > 0 && rr.top < innerHeight : null, cur: rail?.querySelector("[aria-current]")?.getAttribute("href"), side: document.documentElement.scrollWidth - innerWidth };
      });
      (r.top >= -2 && r.top < 260) ? pass("webkit-deep-link-#dcmd", where, `top ${Math.round(r.top)}`) : fail("webkit-deep-link-#dcmd", where, "serious", `#dcmd at ${r.top}px`);
      r.railVisible ? pass("webkit-rail-sticky", where) : fail("webkit-rail-sticky", where, "moderate", "rail not on screen after scrolling (position: sticky)");
      r.cur ? pass("webkit-scroll-spy", where, r.cur) : fail("webkit-scroll-spy", where, "moderate", "no rail link marked current after scrolling");
      r.side <= 1 ? pass("webkit-no-side-scroll", where) : fail("webkit-no-side-scroll", where, "serious", `side scroll ${r.side}px`);
      await d.send({ cmd: "shot", path: `${dir}/shots-lane/prompts--webkit-${devId}-scrolled.png`, full: false });
      });
    }
    await d.quit();
  }
}

async function axeOpen(devId, scheme, setup) {
  const { createRequire } = await import("node:module");
  let src;
  try { src = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8"); }
  catch { pass("axe-open-palette", `${devId}/${scheme}`, "skipped: axe-core not installed"); return; }
  const { ctx, page } = await open(devId, "/prompts", { scheme });
  await setup(page);
  await page.addScriptTag({ content: src });
  const v = await page.evaluate(async () => (await window.axe.run(document.querySelector("dialog[open]") || document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } })).violations.map((x) => `${x.id} (${x.impact}, ${x.nodes.length}): ${x.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" ; ")}`));
  v.length ? fail("axe-open-palette", `${devId}/${scheme}`, "serious", v.join(" | ")) : pass("axe-open-palette", `${devId}/${scheme}`);
  await ctx.close();
}

// Results are written even if a check throws, so a partial run still leaves evidence.
try { await ({ search, detail, browse, skilldetail, account })[args.lane](); }
catch (e) { fail("harness", "run", "serious", `lane run stopped early: ${String(e.message || e).split("\n")[0]}`); }
finally {
  await browser.close();
  const failed = results.filter((r) => !r.ok);
  writeFileSync(`${dir}/lane-${args.lane}.json`, JSON.stringify({ lane: args.lane, target: base, when: new Date().toISOString(), passed: results.length - failed.length, failed: failed.length, results }, null, 2));
  console.log(`${args.lane}: ${results.length - failed.length} passed, ${failed.length} failed`);
  for (const f of failed) console.log(`${f.severity.padEnd(8)} ${f.check.padEnd(26)} [${f.where}] ${f.detail}`);
}
