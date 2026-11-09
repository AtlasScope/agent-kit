// Browser smoke journeys against a production build, at desktop and phone sizes.
//   npm run build && npm run smoke
// Set SMOKE_URL to test a running site instead of starting `next start` here.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import { composeCopy } from "../../lib/copy.ts";
import { AGENTS } from "../../lib/site.ts";
import { STEPS, REQUEST } from "../../lib/start.ts";
import { STARTS } from "../../lib/starts.ts";
import { LESSONS } from "../../lib/lessons.ts";

const require = createRequire(import.meta.url);
const data = require("../../content/generated.json");
const PORT = 3999;
let base = process.env.SMOKE_URL?.replace(/\/$/, "");
let server, browser;

const SIZES = [
  { name: "desktop", viewport: { width: 1280, height: 800 } },
  { name: "phone", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
];

before(async () => {
  if (!base) {
    // Its own process group, so after() can stop next and the server process it starts.
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

async function noSideScroll(page, path) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(over <= 1, `${path} scrolls sideways by ${over}px`);
}

const clipboard = (page) => page.evaluate(() => navigator.clipboard.readText());

for (const size of SIZES) {
  test(`${size.name}: home page copies the install steps and leads to the library`, async () => {
    const { page, ctx, errors } = await open(size, "/");
    await noSideScroll(page, "/");
    for (const agent of ["claude", "any"].map((id) => AGENTS.find((a) => a.id === id))) {
      await page.getByRole("tab", { name: agent.label }).click();
      const copy = page.getByRole("tabpanel").getByRole("button");
      await copy.click();
      assert.equal(await clipboard(page), agent.steps.join("\n"), `${agent.label} tab copies every step`);
    }
    await page.getByRole("link", { name: /Browse prompts/ }).click();
    await page.waitForURL(/\/prompts$/);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size.name}: a prompt page copies the whole prompt with its rules`, async () => {
    const p = data.prompts.find((x) => x.id === "PG01");
    const path = `/prompts/${p.slug}`;
    const { page, ctx, errors } = await open(size, path);
    await noSideScroll(page, path);
    // The page's main button (related prompts further down have their own).
    await page.locator("button.btn--solid", { hasText: "Copy prompt" }).first().click();
    assert.equal(await clipboard(page), composeCopy(p));
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size.name}: the prompt hub leads with best starting points that copy`, async () => {
    const { page, ctx, errors } = await open(size, "/prompts");
    await noSideScroll(page, "/prompts");
    const cards = page.locator(".scard");
    assert.equal(await cards.count(), STARTS.length);
    for (let i = 0; i < STARTS.length; i++) {
      const p = data.prompts.find((x) => x.id === STARTS[i].pick);
      await cards.nth(i).locator(".pcard__a button").click();
      assert.equal(await clipboard(page), composeCopy(p), `${STARTS[i].slug} copies ${p.id}`);
    }
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size.name}: a skill page gives working install commands`, async () => {
    const s = data.skills.find((x) => x.name === "design");
    const path = `/skills/${s.name}`;
    const { page, ctx, errors } = await open(size, path);
    await noSideScroll(page, path);
    const copies = page.locator(".cmdline").getByRole("button");
    await copies.nth(0).click();
    assert.equal(await clipboard(page), `npx skills add AtlasScope/agent-kit --skill ${s.name}`);
    await copies.nth(1).click();
    assert.equal(await clipboard(page), `claude plugin marketplace add AtlasScope/agent-kit\nclaude plugin install ${s.kit}@agent-kit`);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size.name}: the first-app guide walks every step and copies the request`, async () => {
    const { page, ctx, errors } = await open(size, "/start");
    await noSideScroll(page, "/start");
    await page.getByRole("link", { name: /haven.t installed an agent/ }).click();
    for (let i = 0; i < STEPS.length; i++) {
      await page.waitForURL(new RegExp(`/start/${STEPS[i].slug}$`));
      await noSideScroll(page, `/start/${STEPS[i].slug}`);
      assert.equal(await page.getByRole("heading", { level: 1 }).textContent(), STEPS[i].title);
      if (STEPS[i].slug === "create") {
        await page.getByRole("button", { name: "Copy the request" }).click();
        assert.equal(await clipboard(page), REQUEST);
      }
      if (i < STEPS.length - 1) await page.getByRole("link", { name: `Next: ${STEPS[i + 1].title}` }).click();
    }
    // The guide hands off to the lessons, and each lesson copies its action.
    await page.getByRole("link", { name: "Next: five short lessons" }).click();
    await page.waitForURL(/\/learn$/);
    for (const l of LESSONS) {
      await page.goto(`${base}/learn/${l.slug}`);
      await noSideScroll(page, `/learn/${l.slug}`);
      await page.getByRole("button", { name: l.action.label }).click();
      assert.equal(await clipboard(page), l.action.text, `${l.slug} copies its action`);
    }
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}
