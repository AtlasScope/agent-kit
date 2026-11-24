// The design-system page's primitives against a production build: FloatingCopy's handoff, at desktop and phone sizes.
//   npm run build && npm run smoke
// Set SMOKE_URL to test a running site instead of starting `next start` here.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const PORT = 3993;
let base = process.env.SMOKE_URL?.replace(/\/$/, "");
let server, browser;

const SIZES = [
  { name: "desktop", viewport: { width: 1440, height: 900 } },
  { name: "phone", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
];

before(async () => {
  if (!base) {
    server = spawn("npx", ["next", "start", "-p", String(PORT)], { cwd: new URL("../..", import.meta.url), stdio: "ignore", detached: true });
    base = `http://localhost:${PORT}`;
    for (let i = 0; i < 60; i++) {
      try { if ((await fetch(base)).ok) break; } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  if (server) process.kill(-server.pid, "SIGTERM");
});

// Is any part of this button the topmost element somewhere inside the viewport below the header?
// Samples its visible area on a small grid, the way a finger or pointer would find it.
const pressable = (sel) => (s) => {
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
      const panel = await page.evaluate(pressable(), ".ds-float .block__head .copy");
      const bar = await page.evaluate(pressable(), ".fcopy[data-on] .fcopy__copy");
      seenBar ||= bar;
      assert.ok(panel || bar, `at scrollY ${y} neither the panel's Copy nor the floating Copy can be pressed`);
    }
    assert.ok(seenBar, "the floating bar showed somewhere in the range");
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}
