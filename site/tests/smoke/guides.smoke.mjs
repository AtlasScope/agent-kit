// Start, Learn and Fix journeys against a production build, at desktop and phone sizes.
//   npm run build && npm run smoke
// Set SMOKE_URL to test a running site instead of starting `next start` here.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { smokeTarget } from "./run.mjs";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import { STEPS } from "../../lib/start.ts";
import { LESSONS } from "../../lib/lessons.ts";

const require = createRequire(import.meta.url);
const data = require("../../content/generated.json");
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

async function open(size, path) {
  const ctx = await browser.newContext({ ...size });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const res = await page.goto(base + path, { waitUntil: "networkidle" });
  assert.equal(res.status(), 200, `${path} returned ${res.status()}`);
  return { page, ctx, errors };
}

const noSideScroll = async (page, path) => {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(over <= 1, `${path} scrolls sideways by ${over}px`);
};

for (const size of SIZES) {
  test(`${size.name}: progress is kept in the browser and shown on the meter, rail and hub`, async () => {
    const { page, ctx, errors } = await open(size, `/start/${STEPS[0].slug}`);
    // The meter names where you are and links every step.
    const meter = page.getByRole("navigation", { name: `Step 1 of ${STEPS.length}` });
    assert.equal(await meter.getByRole("link").count(), STEPS.length);
    assert.equal(await meter.locator('[aria-current="step"]').count(), 1);
    // Next marks steps done.
    await page.getByRole("link", { name: `Next: ${STEPS[1].title}` }).click();
    await page.waitForURL(new RegExp(`/start/${STEPS[1].slug}$`));
    await page.getByRole("link", { name: `Next: ${STEPS[2].title}` }).click();
    await page.waitForURL(new RegExp(`/start/${STEPS[2].slug}$`));
    await page.getByText(`2 of ${STEPS.length} done`).first().waitFor();
    assert.equal(await page.locator(".meter .is-done").count(), 2);
    const rail = page.getByRole("navigation", { name: "All guide steps" });
    await rail.scrollIntoViewIfNeeded();
    assert.ok(await rail.getByRole("link", { name: /Pick your agent/ }).isVisible(), "the rail lists every step");
    assert.equal(await rail.locator(".is-done").count(), 2);
    // The hub offers to continue from the first unfinished step.
    await page.goto(`${base}/start`, { waitUntil: "networkidle" });
    await noSideScroll(page, "/start");
    await page.getByRole("link", { name: `Continue: ${STEPS[2].title}` }).click();
    await page.waitForURL(new RegExp(`/start/${STEPS[2].slug}$`));
    // Back goes back.
    await page.getByRole("link", { name: `Back: ${STEPS[1].title}` }).click();
    await page.waitForURL(new RegExp(`/start/${STEPS[1].slug}$`));
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size.name}: the three routes link to each other and the learn hub lists every lesson`, async () => {
    const { page, ctx, errors } = await open(size, "/learn");
    await noSideScroll(page, "/learn");
    const routes = page.getByRole("navigation", { name: "Guided routes" });
    assert.equal(await routes.locator('[aria-current="page"]').getAttribute("href"), "/learn");
    for (const l of LESSONS) assert.ok(await page.getByRole("link", { name: new RegExp(l.title) }).first().isVisible());
    // A new reader gets the page's one lit action: Start, on the first lesson.
    const start = page.getByRole("link", { name: `Start: ${LESSONS[0].title}` });
    assert.equal(await start.getAttribute("href"), `/learn/${LESSONS[0].slug}`);
    assert.ok(await start.isVisible());
    await page.goto(`${base}/learn/${LESSONS.at(-1).slug}`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Fix a real problem" }).click();
    await page.waitForURL(/\/fix$/);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size.name}: the fix filter narrows symptoms and a symptom page keeps the prompts in order`, async () => {
    const { page, ctx, errors } = await open(size, "/fix");
    await noSideScroll(page, "/fix");
    const rows = page.locator("[data-fix]");
    assert.equal(await rows.count(), data.fixes.length);
    const box = page.getByRole("searchbox", { name: "Filter symptoms" });
    await box.fill("slow");
    const shown = await page.locator("[data-fix]:not([hidden])").count();
    assert.ok(shown > 0 && shown < data.fixes.length, `filter shows ${shown}`);
    await page.getByText(`${shown} of ${data.fixes.length} symptoms`).waitFor();
    // A group with no matching rows hides with its heading, and each heading counts only what is shown.
    const groups = await page.locator("[data-fix-group]").evaluateAll((gs) => gs.map((g) => ({
      visible: g.checkVisibility(), rows: g.querySelectorAll("[data-fix]:not([hidden])").length, count: Number(g.querySelector("[data-fix-count]")?.textContent),
    })));
    for (const g of groups) { assert.equal(g.visible, g.rows > 0); if (g.rows) assert.equal(g.count, g.rows); }
    await box.fill("migration");
    assert.equal(await page.locator("[data-fix-group]:visible").count(), 1, "only the database group matches migration");
    await box.fill("zzzz-no-such-thing");
    await page.getByText(/No symptom matches/).waitFor();
    await box.press("Escape");
    assert.equal(await page.locator("[data-fix]:not([hidden])").count(), data.fixes.length);

    const f = data.fixes[0];
    await page.getByRole("link", { name: new RegExp(f.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).first().click();
    await page.waitForURL(new RegExp(`/fix/${f.slug}$`));
    await noSideScroll(page, `/fix/${f.slug}`);
    const titles = await page.locator(".prows--ranked .prow__t").allTextContents();
    const want = f.prompts.map((s) => data.prompts.find((p) => p.slug === s)?.t).filter(Boolean);
    assert.deepEqual(titles, want);
    assert.equal(await page.locator(".prows--ranked .prow--best").count(), 1);
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}
