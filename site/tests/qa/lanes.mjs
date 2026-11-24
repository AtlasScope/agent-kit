// Interaction checks written for one redesign lane's new behaviour, run in Chromium (Apple device
// emulation) and in WebKitGTK where the behaviour can be driven without real input events.
//   node tests/qa/lanes.mjs --lane search|browse|detail --target http://localhost:4003 [--label w3] [--webkit]
// Results go to <out>/<label>/lane-<lane>.json. Each check records pass or a finding with severity.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { DEVICES } from "./config.mjs";
import { clipboardRecorder } from "./checks.mjs";
import { driver } from "./webkit/driver.mjs";
import { composeCopy } from "../../lib/copy.ts";

const { values: args } = parseArgs({ options: {
  lane: { type: "string" }, target: { type: "string" }, label: { type: "string" }, webkit: { type: "boolean", default: false },
  out: { type: "string", default: new URL("../../../.artifacts/qa", import.meta.url).pathname },
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
        await d.send({ cmd: "open", url: base + "/prompts", width: w, height: h, dark: scheme === "dark", init: `(${clipboardRecorder})(false)` });
        const r = await d.call(async (isPhone) => {
          if (isPhone) [...document.querySelectorAll("header button")].find((b) => /search/i.test(b.getAttribute("aria-label") || b.textContent))?.click();
          else document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
          await new Promise((r) => setTimeout(r, 400));
          const dlg = document.querySelector("dialog[open]");
          if (!dlg) return { open: false };
          const input = dlg.querySelector('[role="combobox"]');
          const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
          set.call(input, "slow page");
          input.dispatchEvent(new Event("input", { bubbles: true }));
          await new Promise((r) => setTimeout(r, 1200));
          const rect = dlg.getBoundingClientRect();
          return { open: true, options: dlg.querySelectorAll('[role="option"]').length, w: rect.width / innerWidth, h: rect.height / innerHeight, font: parseFloat(getComputedStyle(input).fontSize), side: document.documentElement.scrollWidth - innerWidth };
        }, devId === "iphone");
        if (!r.open) { fail("webkit-open", where, "blocker", "palette did not open in WebKit"); continue; }
        r.options > 0 ? pass("webkit-results", where, `${r.options} options`) : fail("webkit-results", where, "serious", "no results listed in WebKit");
        if (devId === "iphone") { r.font >= 16 ? pass("webkit-input-16px", where) : fail("webkit-input-16px", where, "serious", `input ${r.font}px`); (r.w > 0.97 && r.h > 0.9) ? pass("webkit-fullscreen", where) : fail("webkit-fullscreen", where, "moderate", `${Math.round(r.w * 100)}% x ${Math.round(r.h * 100)}%`); }
        await d.send({ cmd: "shot", path: `${dir}/shots-lane/palette--webkit-${devId}-${scheme}.png`, full: false });
      }
    }
    await d.quit();
  }
}

// ------------------------------------------------------------------------------------------- W5
async function detail() {
  const picks = [data.prompts.find((x) => x.id === "PG01"), data.prompts.find((x) => x.steps && !x.replacedBy), data.prompts.find((x) => x.sec === "ecmd" && !x.replacedBy)];
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
        const c2 = await copies(page);
        c2.includes(want) ? pass("c-key", where) : fail("c-key", where, "serious", `pressing C copied ${c2.length ? "something else" : "nothing"}`);
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
          await d.send({ cmd: "open", url: base + path, width: w, height: h, init: `(${clipboardRecorder})(${deny})` });
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
            }
            return res;
          }, deny);
          if (r.tall && !deny) r.sticky.every(Boolean) ? pass("webkit-copy-in-reach", where) : fail("webkit-copy-in-reach", where, "moderate", `Copy on screen at 35/70/100%: ${r.sticky.join("/")}`);
          r.copies.includes(want) ? pass("webkit-payload", where) : fail("webkit-payload", where, "blocker", "main Copy did not send the exact payload");
          if (!deny && devId === "macbook") r.ckey.includes(want) ? pass("webkit-c-key", where) : fail("webkit-c-key", where, "serious", "C did not copy in WebKit");
          if (deny) r.sel.replace(/\s+/g, " ").trim() === want.replace(/\s+/g, " ").trim() ? pass("webkit-denied-selects-text", where) : fail("webkit-denied-selects-text", where, "serious", `selection after refused copy: ${r.sel.length} chars`);
          if (!deny) await d.send({ cmd: "shot", path: `${dir}/shots-lane/detail-${p.id}--webkit-${devId}.png`, full: false });
        }
      }
    }
    await d.quit();
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
      for (const id of ["dcmd", secs[2]]) {
        await page.goto(`${base}/prompts#${id}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(500);
        const top = await page.evaluate((id) => { const el = document.getElementById(id); const r = el?.getBoundingClientRect(); const hidden = [...document.elementsFromPoint(innerWidth / 2, Math.max(1, r.top + 4))].some((e) => getComputedStyle(e).position === "sticky" || getComputedStyle(e).position === "fixed"); return { top: r?.top, hidden }; }, id);
        (top.top >= -2 && top.top < 260) ? pass(`deep-link-#${id}`, where, `top ${Math.round(top.top)}px`) : fail(`deep-link-#${id}`, where, "serious", `#${id} lands at ${Math.round(top.top)}px from the top`);
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
    (pressed?.includes(q) && shownReload === shownOne) ? pass("filter-restored", where) : fail("filter-restored", where, "serious", `after reload pressed "${pressed}", ${shownReload} shown (expected ${shownOne})`);
    // Back to All restores the list.
    await btns.nth(0).click();
    const back = await page.locator("main li:visible a[href^='/prompts/']").count();
    back === shownAll ? pass("filter-all", where) : fail("filter-all", where, "serious", `All shows ${back}, expected ${shownAll}`);
    await page.screenshot({ path: `${dir}/shots-lane/area--${d}.png` });
    await ctx.close();
  }
  if (args.webkit) {
    const d = driver();
    for (const [devId, w, h] of [["macbook", 1440, 900], ["iphone", 393, 852]]) {
      const where = `webkit/${devId}`;
      await d.send({ cmd: "open", url: `${base}/prompts#dcmd`, width: w, height: h, settle: 1200 });
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
    }
    await d.quit();
  }
}

async function axeOpen(devId, scheme, setup) {
  const { createRequire } = await import("node:module");
  const src = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
  const { ctx, page } = await open(devId, "/prompts", { scheme });
  await setup(page);
  await page.addScriptTag({ content: src });
  const v = await page.evaluate(async () => (await window.axe.run(document.querySelector("dialog[open]") || document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] } })).violations.map((x) => `${x.id} (${x.impact}, ${x.nodes.length}): ${x.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" ; ")}`));
  v.length ? fail("axe-open-palette", `${devId}/${scheme}`, "serious", v.join(" | ")) : pass("axe-open-palette", `${devId}/${scheme}`);
  await ctx.close();
}

await ({ search, detail, browse })[args.lane]();
await browser.close();
const failed = results.filter((r) => !r.ok);
writeFileSync(`${dir}/lane-${args.lane}.json`, JSON.stringify({ lane: args.lane, target: base, when: new Date().toISOString(), passed: results.length - failed.length, failed: failed.length, results }, null, 2));
console.log(`${args.lane}: ${results.length - failed.length} passed, ${failed.length} failed`);
for (const f of failed) console.log(`${f.severity.padEnd(8)} ${f.check.padEnd(26)} [${f.where}] ${f.detail}`);
