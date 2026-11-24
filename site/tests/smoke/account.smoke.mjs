// Collections, shared collection and reading-page journeys against a production build, at desktop and phone sizes.
//   npm run build && npm run smoke
// The signed-in pages are exercised through the sample-data routes (/account/fixture), which serve here because
// this file starts `next start` with ACCOUNT_FIXTURES=1. Set SMOKE_URL to test a running site that has them on.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import { composeCopy } from "../../lib/copy.ts";

const require = createRequire(import.meta.url);
const data = require("../../content/generated.json");
const PORT = 3998; // journeys.smoke.mjs uses 3999 and may run at the same time.
let base = process.env.SMOKE_URL?.replace(/\/$/, "");
let server, browser;

const DESKTOP = { viewport: { width: 1440, height: 900 } };
const PHONE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const STARRED = "00000000-0000-4000-8000-000000000001";
const DESIGN = "00000000-0000-4000-8000-000000000002";
const EMPTY = "00000000-0000-4000-8000-000000000004";

before(async () => {
  if (!base) {
    server = spawn("npx", ["next", "start", "-p", String(PORT)], {
      cwd: new URL("../..", import.meta.url), stdio: "ignore", detached: true, env: { ...process.env, ACCOUNT_FIXTURES: "1" },
    });
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
const noSideScroll = async (page, label) => {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(over <= 1, `${label} scrolls sideways by ${over}px`);
};
const openPanel = (page) => page.locator(".ws__panel:visible");

test("desktop: the rail opens collections, Back returns, and the last one opened is remembered", async () => {
  const { page, ctx, errors } = await open(DESKTOP, "/account/fixture");
  assert.equal(await openPanel(page).count(), 1, "exactly one collection is open");
  assert.equal(await openPanel(page).getAttribute("data-col"), STARRED, "Starred opens first");
  assert.equal(await page.locator(`[data-for="${STARRED}"]`).getAttribute("aria-current"), "true");

  await page.locator(`[data-for="${DESIGN}"]`).click();
  await page.waitForURL(`**#${DESIGN}`);
  assert.equal(await openPanel(page).getAttribute("data-col"), DESIGN);
  assert.equal(await page.locator(`[data-for="${DESIGN}"]`).getAttribute("aria-current"), "true");
  assert.equal(await page.locator(`[data-for="${STARRED}"]`).getAttribute("aria-current"), null);

  await page.goBack();
  assert.equal(await openPanel(page).getAttribute("data-col"), DESIGN, "no hash: the remembered collection stays open");

  // A fresh visit with no hash opens the remembered collection before paint (no flash of Starred).
  await page.goto(base + "/account/fixture", { waitUntil: "domcontentloaded" });
  assert.equal(await page.locator("#ws").getAttribute("data-sel"), DESIGN);
  await noSideScroll(page, "/account/fixture");
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("desktop: a prompt copies the same payload as its page, the install command copies, empty collections link out", async () => {
  const { page, ctx } = await open(DESKTOP, `/account/fixture#${STARRED}`);
  const p = data.prompts.find((x) => x.id === "A01");
  const row = openPanel(page).locator(".citem", { hasText: p.t });
  await row.getByRole("button", { name: /Copy/ }).click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), composeCopy(p), "prompt payload is byte-identical");
  await openPanel(page).locator(".cpanel__install button").click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), "npx skills add AtlasScope/agent-kit --skill diagnosing-bugs");

  await page.locator(`[data-for="${EMPTY}"]`).click();
  await page.waitForURL(`**#${EMPTY}`);
  await openPanel(page).getByRole("link", { name: "Browse prompts" }).waitFor();
  await ctx.close();
});

test("phone: the rail is the first screen, a collection replaces it, and All collections goes back", async () => {
  const { page, ctx, errors } = await open(PHONE, "/account/fixture");
  assert.ok(await page.locator(".ws__rail").isVisible(), "rail shows first");
  assert.equal(await openPanel(page).count(), 0, "no collection open on the first screen");
  await page.locator(`[data-for="${DESIGN}"]`).tap();
  await page.waitForURL(`**#${DESIGN}`);
  assert.ok(!(await page.locator(".ws__rail").isVisible()), "rail gives way");
  assert.equal(await openPanel(page).getAttribute("data-col"), DESIGN);
  assert.equal(await page.evaluate(() => document.activeElement?.id), `col-${DESIGN}`, "focus moves to the collection's heading");
  await noSideScroll(page, "phone collection");
  await openPanel(page).getByRole("link", { name: "All collections" }).tap();
  await page.locator(".ws__rail").waitFor({ state: "visible" });
  assert.equal(await openPanel(page).count(), 0);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test("desktop: New collection creates one and opens it; Remove takes an item out after asking", async () => {
  const { page, ctx } = await open(DESKTOP, "/account/fixture");
  const name = `Smoke ${Date.now()}`;
  await page.getByText("New collection").click();
  await page.getByLabel("Name the collection").fill(name);
  await page.getByRole("button", { name: "Create" }).click();
  await page.locator(".ws__panel:visible h2", { hasText: name }).waitFor({ timeout: 10000 });
  const id = await openPanel(page).getAttribute("data-col");
  assert.ok(page.url().endsWith(`#${id}`), "the new collection is in the URL");

  await page.locator(`[data-for="${DESIGN}"]`).click();
  const before = await openPanel(page).locator(".citem").count();
  await openPanel(page).getByRole("button", { name: /Remove ux-heuristics/ }).click();
  await openPanel(page).getByRole("button", { name: "Remove", exact: true }).click();
  await page.waitForFunction((n) => document.querySelectorAll(".ws__panel[data-col$='0002'] .citem").length === n - 1, before, { timeout: 10000 });

  await ctx.close();
});

test("shared collection: install command, prompt copy, and the owner's way back", async () => {
  for (const size of [DESKTOP, PHONE]) {
    const { page, ctx, errors } = await open(size, `/account/fixture/shared?id=${DESIGN}`);
    assert.equal(await page.locator("h1").count(), 1);
    await page.getByRole("heading", { name: "Install its skills" }).waitFor();
    const manage = page.getByRole("link", { name: "Manage in Collections" });
    assert.equal(await manage.getAttribute("href"), `/account/fixture#${DESIGN}`);
    await noSideScroll(page, "shared collection");
    assert.deepEqual(errors, []);
    await ctx.close();
  }
});

test("reading pages keep one h1, their sections, and a working contents list", async () => {
  for (const [path, first] of [["/privacy", "reading"], ["/terms", "as-is"], ["/about", "what"], ["/mcp-setup", "claude-code"]]) {
    const { page, ctx, errors } = await open(DESKTOP, path);
    assert.equal(await page.locator("h1").count(), 1, `${path} has one h1`);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    assert.ok(canonical?.endsWith(path), `${path} keeps its canonical`);
    await page.locator(`.doc__toc a[href="#${first}"]`).click();
    await page.waitForFunction((id) => document.querySelector(`.doc__toc a[href="#${id}"]`)?.getAttribute("aria-current") === "location", first);
    assert.deepEqual(errors, []);
    await ctx.close();
    const phone = await open(PHONE, path);
    await phone.page.locator(".doc__minitoc summary").tap();
    assert.ok(await phone.page.locator(`.doc__minitoc a[href="#${first}"]`).isVisible(), `${path} contents opens on phones`);
    await noSideScroll(phone.page, path);
    await phone.ctx.close();
  }
});

test("MCP setup still copies the exact server URL and client config", async () => {
  const { page, ctx } = await open(DESKTOP, "/mcp-setup");
  await page.locator(".mcp-url button").click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), "https://www.atlasscope.dev/mcp");
  await page.locator("#claude-code .block button").click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), "claude mcp add --transport http agent-kit https://www.atlasscope.dev/mcp");
  await ctx.close();
});

test("404 says so and links to the library", async () => {
  const ctx = await browser.newContext(DESKTOP);
  const page = await ctx.newPage();
  const res = await page.goto(base + "/no-such-page");
  assert.equal(res.status(), 404);
  await page.getByRole("heading", { name: "Not here" }).waitFor();
  for (const href of ["/prompts", "/skills", "/kits", "/fix", "/start"]) assert.equal(await page.locator(`.notfound__ways a[href="${href}"]`).count(), 1);
  await ctx.close();
});
