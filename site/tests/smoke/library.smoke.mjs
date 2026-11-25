// Prompt library browsing: the index rail, area rows, the area filter and row copy, at desktop and phone sizes.
//   npm run build && node --test tests/smoke/library.smoke.mjs   (or SMOKE_URL=... to test a running site)
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import { composeCopy } from "../../lib/copy.ts";

const require = createRequire(import.meta.url);
const data = require("../../content/generated.json");
const PORT = 3997;
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

async function open(size, path) {
  const ctx = await browser.newContext({ ...size, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const res = await page.goto(base + path, { waitUntil: "networkidle" });
  assert.equal(res.status(), 200, `${path} returned ${res.status()}`);
  return { page, ctx, errors };
}

// The page itself must not be wider than the screen (an absolutely placed child can widen a phone's layout viewport).
async function noSideScroll(page, path) {
  const over = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
  assert.ok(over <= 1, `${path} scrolls sideways by ${over}px`);
}

// An area whose entries differ in what they change, so the filter shows. Labels as components/prompts/browse/mode.ts
// makes them (kept in step by hand: that file is TypeScript with path aliases the test runner can't resolve).
const MODES = { read: "Changes nothing", repro: "Adds a test that shows it", change: "Suggests a fix" };
const modeOf = (p) => (p.mode ? (p.iso ? "Tests on a copy" : MODES[p.mode]) : p.dmode) || "";
const mixed = data.areas.find((a) => {
  const labels = new Set(a.prompts.map((s) => data.prompts.find((p) => p.slug === s)).filter(Boolean).map(modeOf).filter(Boolean));
  return labels.size > 1;
});

for (const size of SIZES) {
  test(`${size.name}: the index lists every area page and its rail jumps to a section`, async () => {
    const { page, ctx, errors } = await open(size, "/prompts");
    await noSideScroll(page, "/prompts");
    assert.equal(await page.locator(".areas .area").count(), data.areas.length);
    for (const a of data.areas) assert.equal(await page.locator(`.areas a[href="/prompts/${a.slug}"]`).count(), 1, a.slug);
    // The design commands anchor is linked from elsewhere on the site; it must keep working.
    await page.locator('.rail a[href="#dcmd"]').click();
    await page.waitForFunction(() => location.hash === "#dcmd");
    await page.locator('.rail a[href="#dcmd"][aria-current="location"]').waitFor();
    // At the bottom of the page the last, short section is current.
    const last = data.sections.at(-1).id;
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.locator(`.rail a[href="#${last}"][aria-current="location"]`).waitFor();
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size.name}: an area page lists its prompts as rows that copy the exact payload`, async () => {
    const a = data.areas.find((x) => x.slug === "slow-or-costly");
    const { page, ctx, errors } = await open(size, `/prompts/${a.slug}`);
    await noSideScroll(page, `/prompts/${a.slug}`);
    const rows = page.locator("#area-list .prows > li");
    assert.equal(await rows.count(), a.prompts.length);
    const first = data.prompts.find((p) => p.slug === a.prompts[0]);
    await rows.first().getByRole("button", { name: /^Copy/ }).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), composeCopy(first));
    // The rail (computer) and the selector (phone) both mark this page.
    for (const href of await page.locator(`.sibs a[aria-current="page"]`).evaluateAll((as) => as.map((x) => x.getAttribute("href")))) assert.equal(href, `/prompts/${a.slug}`);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size.name}: the area filter narrows the rows and keeps the choice in the address`, async () => {
    assert.ok(mixed, "some area mixes modes");
    const { page, ctx, errors } = await open(size, `/prompts/${mixed.slug}`);
    const group = page.getByRole("group", { name: "Show prompts by what they change" });
    const option = group.getByRole("button").nth(1);
    const label = (await option.textContent()).replace(/\s*\d+$/, "").trim();
    const n = Number((await option.locator(".afilter__n").textContent()).trim());
    await option.click();
    assert.equal(await option.getAttribute("aria-pressed"), "true");
    assert.equal(await page.locator("#area-list .prows > li:not([hidden])").count(), n);
    assert.ok(new URL(page.url()).searchParams.get("does") === label);
    assert.equal((await page.locator(".lib__count").textContent()).trim(), `${n} of ${mixed.prompts.length} prompts`);
    // Reopening the address restores the filter.
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.locator("#area-list .prows > li:not([hidden])").count(), n);
    // Following the plain link to this same page clears the filter, in the address and in the list.
    const pick = page.locator(".sibs__pick > summary");
    if (await pick.isVisible()) await pick.click();
    await page.locator('.sibs a[aria-current="page"]:visible').click();
    await page.waitForFunction(() => !location.search);
    assert.equal(await page.locator("#area-list .prows > li:not([hidden])").count(), mixed.prompts.length);
    await page.goto(`${base}/prompts/${mixed.slug}?does=${encodeURIComponent(label)}`, { waitUntil: "networkidle" });
    await group.getByRole("button", { name: /^All/ }).click();
    assert.equal(await page.locator("#area-list .prows > li:not([hidden])").count(), mixed.prompts.length);
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

// A phone on its side: a short screen still marks the section a rail link jumped to.
test("phone landscape: a rail jump marks its section", async () => {
  const size = { name: "landscape", viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true };
  const { page, ctx, errors } = await open(size, "/prompts");
  await page.locator('.rail a[href="#plan"]').click();
  await page.locator('.rail a[href="#plan"][aria-current="location"]').waitFor();
  assert.deepEqual(errors, []);
  await ctx.close();
});

// Fix pages use the ordered variant of the shared row: numbered, the first marked Best first.
test("desktop: a Fix page numbers its prompts in order", async () => {
  const f = data.fixes[0];
  const { page, ctx, errors } = await open(SIZES[0], `/fix/${f.slug}`);
  const n = await page.locator("ol.prows > li .prow__n").allTextContents();
  assert.deepEqual(n, f.prompts.filter((s) => data.prompts.some((p) => p.slug === s)).map((_, i) => String(i + 1)));
  assert.equal(await page.locator("ol.prows > li").first().locator(".best").first().textContent(), "Best first");
  assert.deepEqual(errors, []);
  await ctx.close();
});
