// Skills and kits browsing against a production build, at desktop and phone sizes.
//   npm run build && npm run smoke
// Set SMOKE_URL to test a running site instead of starting `next start` here.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import { KITS, KIT_GUIDE } from "../../lib/site.ts";

const require = createRequire(import.meta.url);
const data = require("../../content/generated.json");
const PORT = 3996;
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

const sideScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const filter = (page) => page.getByRole("searchbox", { name: "Filter skills by name, job or author" });

for (const size of SIZES) {
  test(`${size.name}: the skills index lists every skill and filters it`, async () => {
    const { page, ctx, errors } = await open(size, "/skills");
    const rows = page.locator("main li h3 a[href^='/skills/']");
    assert.equal(await rows.count(), data.skills.length, "every skill has a row before any filtering");
    // How a skill starts, in the wording every page shares.
    const typed = data.skills.find((x) => x.typedOnly && x.kit !== "experience-architecture");
    assert.ok(typed, "the catalog has a typed-only skill to check the wording on");
    assert.ok(await page.locator("li", { has: page.locator(`a[href='/skills/${typed.name}']`) }).getByText(`Type /${typed.name} to run`).count());
    for (const k of data.kits) assert.ok(await page.locator(`section#${k.name}`).count(), `section #${k.name} keeps its anchor`);

    await filter(page).fill("animation");
    const n = await rows.count();
    assert.ok(n > 0 && n < data.skills.length, `filtering "animation" leaves ${n} rows`);
    assert.match(await page.locator("[aria-live=polite]").filter({ hasText: "skills match" }).innerText(), new RegExp(`${n} of ${data.skills.length} skills match`));
    assert.equal(new URL(page.url()).searchParams.get("q"), "animation", "the filter is shareable from the URL");

    await filter(page).press("Escape");
    assert.equal(await rows.count(), data.skills.length, "Escape clears the filter");

    await filter(page).fill("zzzz-no-such-skill");
    await page.getByRole("button", { name: "clear the filter" }).click();
    assert.equal(await rows.count(), data.skills.length, "the empty state clears back to every skill");

    // On a phone the switches sit behind Filters, collapsed so the list starts on the first screen.
    if (size.isMobile) {
      assert.equal(await page.getByRole("button", { name: /^Borrowed/ }).count(), 0, "switches start folded on a phone");
      await page.getByRole("button", { name: /^Filters/ }).click();
    }
    await page.getByRole("button", { name: /^Borrowed/ }).click();
    assert.equal(await rows.count(), data.skills.filter((s) => s.credit).length, "Borrowed shows only credited skills");
    await page.getByRole("button", { name: "By author" }).click();
    const author = data.skills.find((s) => s.credit).credit.author;
    assert.ok(await page.getByRole("heading", { level: 2, name: author }).isVisible(), `grouping by author shows ${author}`);

    assert.ok((await sideScroll(page)) <= 1, "/skills scrolls sideways");
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size.name}: a shared skills view opens as it was shared`, async () => {
    const { page, ctx } = await open(size, "/skills?q=bug&from=borrowed&by=author");
    await page.waitForFunction(() => document.querySelector("input[type=search][aria-label^='Filter']")?.value === "bug");
    if (size.isMobile) await page.getByRole("button", { name: /^Filters/ }).click();
    assert.equal(await page.getByRole("button", { name: /^Borrowed/ }).getAttribute("aria-pressed"), "true");
    assert.equal(await page.getByRole("button", { name: "By author" }).getAttribute("aria-pressed"), "true");
    await ctx.close();
  });

  test(`${size.name}: the kits page opens each kit and copies its commands exactly`, async () => {
    const { page, ctx, errors } = await open(size, "/kits");
    for (const k of KITS) assert.equal(await page.getByRole("link", { name: k, exact: true }).first().getAttribute("href"), `/kits/${k}`);
    const cmd = KIT_GUIDE["engineering-kit"].type[0];
    await page.getByRole("button", { name: `${cmd} (copy)` }).click();
    assert.equal(await page.evaluate(() => navigator.clipboard.readText()), cmd);
    assert.equal(await page.getByRole("link", { name: `Install all ${KITS.length} kits` }).getAttribute("href"), "/install");
    assert.ok((await sideScroll(page)) <= 1, "/kits scrolls sideways");
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}
