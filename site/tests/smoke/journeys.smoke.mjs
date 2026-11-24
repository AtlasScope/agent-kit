// Browser smoke journeys against a production build, at desktop and phone sizes.
//   npm run build && npm run smoke
// Set SMOKE_URL to test a running site instead of starting `next start` here.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import { composeCopy } from "../../lib/copy.ts";
import { AGENTS, INSTALL_MESSAGE } from "../../lib/site.ts";
import { STEPS, REQUEST } from "../../lib/start.ts";
import { STARTS } from "../../lib/starts.ts";
import { LESSONS } from "../../lib/lessons.ts";

const require = createRequire(import.meta.url);
const data = require("../../content/generated.json");
const PORT = 3999;
let base = process.env.SMOKE_URL?.replace(/\/$/, "");
let server, browser;

const SIZES = [
  // Wider than the 1248px menu bar, so the full header row is under test; the tablet journey covers the menu bar.
  { name: "desktop", viewport: { width: 1440, height: 900 } },
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
    // The homepage is one screen. Install copies one message for any agent on the click and opens /install, which
    // says so. It is the same on a phone and a computer.
    assert.ok(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight) <= 1, "the homepage does not scroll");
    await page.locator(".launch__go", { hasText: "Install Agent Kit" }).click();
    await page.waitForURL(/\/install$/);
    await page.locator(".inst__note", { hasText: "Message copied" }).waitFor();
    assert.equal(await clipboard(page), INSTALL_MESSAGE, "Install copies the message to paste into an agent");
    await page.getByRole("button", { name: /Copy the message/ }).click();
    assert.equal(await clipboard(page), INSTALL_MESSAGE, "the install page copies the same message");
    for (const agent of ["claude", "any"].map((id) => AGENTS.find((a) => a.id === id))) {
      await page.getByRole("tab", { name: agent.label }).click();
      const copy = page.getByRole("tabpanel").getByRole("button", { name: /^Copy/ });
      await copy.click();
      assert.equal(await clipboard(page), agent.steps.join("\n"), `${agent.label} tab copies every step`);
    }
    await page.locator(".inst__more a", { hasText: "Prompts" }).click();
    await page.waitForURL(/\/prompts$/);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size.name}: the header reaches every section and search`, async () => {
    const { page, ctx, errors } = await open(size, "/prompts");
    if (size.name === "phone") {
      await page.getByRole("button", { name: "Menu", exact: true }).click();
      await page.getByRole("dialog").getByRole("link", { name: "Skills" }).click();
    } else {
      await page.getByRole("banner").getByRole("link", { name: "Skills" }).click();
    }
    await page.waitForURL(/\/skills$/);
    // Search opens from the header: the field-shaped button on a computer, the Search button on a phone.
    const banner = page.getByRole("banner");
    await (size.name === "phone" ? banner.getByRole("button", { name: "Search", exact: true }) : banner.getByRole("button", { name: /^Search prompts/ })).click();
    await page.getByRole("combobox", { name: "Search the library" }).fill("slow page");
    await page.locator('#search-results a[role="option"]').first().waitFor();
    await noSideScroll(page, "/skills");
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size.name}: the search palette opens, copies, opens a result and remembers it`, async () => {
    const p = data.prompts.find((x) => x.id === "PG02" && !x.replacedBy);
    const { page, ctx, errors } = await open(size, "/skills");
    const mod = process.platform === "darwin" ? "Meta" : "Control";
    // The shortcut hint reads "⌘K" or "Ctrl K" once the page has hydrated and the shortcut listener is attached.
    await page.getByRole("banner").locator(".kbd", { hasText: "K" }).waitFor({ state: "attached" });
    await page.keyboard.press(`${mod}+k`);
    const box = page.getByRole("combobox", { name: "Search the library" });
    await box.waitFor();
    assert.ok(await box.evaluate((el) => el === document.activeElement), "the field has focus");
    // With nothing typed it offers the main pages.
    await page.locator('#search-results a[role="option"][href="/install"]').waitFor();
    await box.fill("PG02");
    const first = page.locator('#search-results a[role="option"]').first();
    await first.waitFor();
    assert.equal(await first.getAttribute("href"), `/prompts/${p.slug}`, "an exact id comes first");
    assert.equal(await first.getAttribute("aria-selected"), "true");
    assert.equal(await box.getAttribute("aria-activedescendant"), await first.getAttribute("id"));
    await box.press(`${mod}+Enter`);
    await page.getByRole("status").filter({ hasText: "copied" }).waitFor();
    assert.equal(await clipboard(page), composeCopy(p), "the palette copies the same text as the prompt page");
    // Escape clears the query first, then closes.
    await box.press("Escape");
    assert.equal(await box.inputValue(), "");
    await box.press("Escape");
    await box.waitFor({ state: "hidden" });
    // "/" opens it too; arrows move and Enter opens the result.
    await page.keyboard.press("/");
    await box.fill("tdd");
    await page.locator('#search-results a[role="option"][href="/skills/tdd"]').waitFor();
    await box.press("Enter");
    await page.waitForURL(/\/skills\/tdd$/);
    await box.waitFor({ state: "hidden" });
    await page.keyboard.press(`${mod}+k`);
    const recent = page.getByRole("group", { name: "Recent" });
    await recent.locator('a[href="/skills/tdd"]').waitFor();
    await recent.locator(`a[href="/prompts/${p.slug}"]`).waitFor();
    await noSideScroll(page, "/skills/tdd");
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

// Tablet width (the menu bar with search in it): the menu opens and links work, and an open menu closes itself when
// the window widens past the menu bar (an iPad turned to landscape), so the page never stays locked behind it.
test("tablet: the menu works and closes when the window widens", async () => {
  const size = { name: "tablet", viewport: { width: 1024, height: 768 } };
  const { page, ctx, errors } = await open(size, "/prompts");
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  await page.setViewportSize({ width: 1366, height: 1024 });
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("banner").getByRole("link", { name: "Skills" }).click();
  await page.waitForURL(/\/skills$/);
  assert.deepEqual(errors, []);
  await ctx.close();
});

