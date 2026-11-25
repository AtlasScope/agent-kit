// The design-system page's primitives against a production build: FloatingCopy's handoff, at desktop and phone sizes.
//   npm run build && npm run smoke
// Set SMOKE_URL to test a running site instead of starting `next start` here.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { smokeTarget } from "./run.mjs";
import { chromium } from "playwright";

let target, base, browser;

const SIZES = [
  { name: "desktop", viewport: { width: 1440, height: 900 } },
  { name: "phone", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
];

before(async () => {
  target = await smokeTarget();
  base = target.url;
  browser = await chromium.launch();
});

after(async () => {
  try { await browser?.close(); } finally { await target?.close(); }
});

// Is any part of this button the topmost element somewhere inside the viewport below the header?
// Samples its visible area on a small grid, the way a finger or pointer would find it.
const pressable = (s) => {
  const b = document.querySelector(s);
  if (!b) return false;
  const r = b.getBoundingClientRect();
  const top = Math.max(r.top, document.querySelector(".top").getBoundingClientRect().bottom), bottom = Math.min(r.bottom, innerHeight);
  if (bottom - top < 1 || r.width < 1) return false;
  for (const fy of [0.1, 0.5, 0.9]) for (const fx of [0.2, 0.5, 0.8]) {
    const hit = document.elementFromPoint(r.left + r.width * fx, top + (bottom - top) * fy);
    if (hit && b.contains(hit)) return true;
  }
  return false;
};

for (const size of SIZES) {
  test(`${size.name}: FloatingCopy leaves no scroll position where neither Copy can be pressed`, async () => {
    const ctx = await browser.newContext({ ...size, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base + "/design-system", { waitUntil: "networkidle" });
    const [from, to] = await page.evaluate(() => {
      const h = document.querySelector(".ds-float .block__head").getBoundingClientRect();
      const w = document.querySelector(".ds-float").getBoundingClientRect();
      return [Math.floor(h.top + scrollY - innerHeight / 2), Math.ceil(w.bottom + scrollY - 120)];
    });
    let seenBar = false;
    for (let y = Math.max(0, from); y <= to; y += 4) {
      await page.evaluate((v) => scrollTo(0, v), y);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      const panel = await page.evaluate(pressable, ".ds-float .block__head .copy");
      const bar = await page.evaluate(pressable, ".fcopy[data-on] .fcopy__copy");
      seenBar ||= bar;
      assert.ok(panel || bar, `at scrollY ${y} neither the panel's Copy nor the floating Copy can be pressed`);
    }
    assert.ok(seenBar, "the floating bar showed somewhere in the range");
    // Past the example's end edge the bar hides again.
    const past = await page.evaluate(() => Math.ceil(document.querySelector(".ds-float").getBoundingClientRect().bottom + scrollY + 40));
    await page.evaluate((v) => scrollTo(0, v), past);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    assert.equal(await page.locator(".fcopy[data-on]").count(), 0, "the bar hides once the example has scrolled past");
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size.name}: a blocked copy in FloatingCopy brings the text back selected, keeps the message up, and a later copy works`, async () => {
    const ctx = await browser.newContext({ ...size, reducedMotion: "reduce" });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => { window.__block = true; navigator.clipboard.writeText = () => (window.__block ? Promise.reject(new Error("blocked")) : Promise.resolve()); });
    await page.goto(base + "/design-system", { waitUntil: "networkidle" });
    const away = async () => {
      await page.evaluate(() => scrollTo(0, Math.ceil(document.querySelector(".ds-float .block__head").getBoundingClientRect().bottom + scrollY - 20)));
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      return page.evaluate(() => scrollY);
    };
    const landed = () => page.waitForFunction(() => {
      const pre = document.querySelector(".ds-float pre"), r = pre.getBoundingClientRect();
      return document.activeElement === pre && String(getSelection()).trim() === pre.textContent.trim()
        && r.top >= document.querySelector(".top").getBoundingClientRect().bottom && r.bottom <= innerHeight;
    }, null, { timeout: 5000 });
    const bar = page.locator(".fcopy[data-on] .fcopy__copy");
    // Twice: a repeat block while the first message still shows recovers too.
    for (const round of [1, 2]) {
      await away();
      await page.evaluate(() => { getSelection().removeAllRanges(); document.activeElement?.blur(); });
      await bar.click();
      await landed().catch(() => assert.fail(`round ${round}: the text did not come back selected and focused`));
      assert.match(await bar.textContent(), /Copy blocked/, `round ${round}: the bar keeps its blocked message up`);
    }
    // Pressing the bar while it is up only for its message: it stays up and shows the new outcome.
    await page.evaluate(() => { window.__block = false; });
    await bar.click();
    await page.locator(".fcopy[data-on] .fcopy__copy[data-copied]").waitFor();
    // Once the clipboard works, a press copies and the page stays where it is.
    const y = await away();
    await bar.click();
    await page.locator(".fcopy__copy[data-copied]").waitFor();
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => scrollY), y, "a successful copy does not scroll the page");
    // Keyboard focus holds the bar up even with the panel back on screen; once focus moves on, it hides and goes inert.
    await page.locator(".fcopy__copy:not([data-copied])").waitFor();
    await away();
    await page.locator(".ds-float .block__head .copy").evaluate((el) => el.focus({ preventScroll: true }));
    await page.keyboard.press("Tab");
    assert.ok(await page.locator(".fcopy__copy").evaluate((el) => el === document.activeElement), "Tab reaches the bar's Copy");
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(500);
    assert.equal(await page.locator(".fcopy[data-on]").count(), 1, "the bar stays up while it holds keyboard focus");
    await page.keyboard.press("Shift+Tab");
    await page.waitForFunction(() => !document.querySelector(".fcopy[data-on]"), null, { timeout: 4000 });
    assert.ok(await page.locator(".fcopy").evaluate((el) => el.inert));
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}
