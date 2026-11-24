// Skill and kit detail pages (lane W7): every install control copies its exact command, the section list jumps to
// its heading, the page never scrolls sideways, and no script errors. Desktop and phone, light and dark.
//   npm run build && node --test tests/smoke/skill-kit-detail.smoke.mjs
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import { SITE, kitInstallMessage } from "../../lib/site.ts";

const require = createRequire(import.meta.url);
const data = require("../../content/generated.json");
const PORT = 3998;
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

async function open(size, scheme, path) {
  const ctx = await browser.newContext({ ...size, colorScheme: scheme, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const res = await page.goto(base + path, { waitUntil: "networkidle" });
  assert.equal(res.status(), 200, `${path} returned ${res.status()}`);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(over <= 1, `${path} scrolls sideways by ${over}px`);
  assert.equal(await page.locator("h1").count(), 1, `${path} has one h1`);
  return { page, ctx, errors };
}

const clipboard = (page) => page.evaluate(() => navigator.clipboard.readText());

for (const size of SIZES) for (const scheme of ["light", "dark"]) {
  test(`${size.name} ${scheme}: skill pages copy exact install commands`, async () => {
    for (const name of ["design", "apple-design", "grill-me"]) {
      const s = data.skills.find((x) => x.name === name);
      const { page, ctx, errors } = await open(size, scheme, `/skills/${name}`);
      // Install is reachable without scrolling past the skill's text.
      const box = await page.locator("#install").boundingBox();
      assert.ok(box.y < size.viewport.height * (size.isMobile ? 3 : 1), `${name}: install starts at ${box.y}px`);
      await page.getByRole("button", { name: `Copy the command that installs ${name}` }).click();
      assert.equal(await clipboard(page), `npx skills add AtlasScope/agent-kit --skill ${name}`);
      await page.getByRole("button", { name: `Copy the Claude Code commands that install ${s.kit}` }).click();
      assert.equal(await clipboard(page), `claude plugin marketplace add ${SITE.repoSlug}\nclaude plugin install ${s.kit}@agent-kit`);
      // What the page shows is what it copies.
      const shown = await page.locator(".sd-cmd pre").allTextContents();
      assert.deepEqual(shown, [`npx skills add AtlasScope/agent-kit --skill ${name}`, `claude plugin marketplace add ${SITE.repoSlug}\nclaude plugin install ${s.kit}@agent-kit`]);
      assert.deepEqual(errors, []);
      await ctx.close();
    }
  });

  test(`${size.name} ${scheme}: a skill's section list jumps to its heading`, async () => {
    const { page, ctx, errors } = await open(size, scheme, "/skills/apple-design");
    if (size.isMobile) {
      await page.locator(".sd-jump summary").click();
      await page.locator(".sd-jump a").nth(2).click();
    } else {
      await page.locator(".sd-toc a").nth(2).click();
    }
    const id = decodeURIComponent(new URL(page.url()).hash.slice(1));
    assert.ok(id, "the link sets a hash");
    const top = await page.evaluate((i) => document.getElementById(i).getBoundingClientRect().top, id);
    assert.ok(top >= 0 && top < 250, `heading ${id} lands near the top (${top}px)`);
    if (!size.isMobile) {
      await page.waitForFunction((i) => document.querySelector(`.sd-toc a[href="#${i}"]`)?.getAttribute("aria-current") === "location", id);
    }
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size.name} ${scheme}: kit pages copy the install message and commands exactly`, async () => {
    for (const k of data.kits) {
      const { page, ctx, errors } = await open(size, scheme, `/kits/${k.name}`);
      await page.getByRole("button", { name: `Copy the message that installs ${k.name}` }).click();
      assert.equal(await clipboard(page), kitInstallMessage(k.name));
      await page.getByRole("button", { name: "Copy the Claude Code commands" }).click();
      assert.equal(await clipboard(page), `claude plugin marketplace add ${SITE.repoSlug}\nclaude plugin install ${k.name}@agent-kit`);
      await page.getByRole("button", { name: "Copy the Codex commands" }).click();
      assert.equal(await clipboard(page), `codex plugin marketplace add ${SITE.repoSlug}\ncodex plugin add ${k.name}@agent-kit`);
      // Every skill in the kit is listed once, linked to its page.
      const links = await page.locator(".kd-row__name a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
      assert.deepEqual([...links].sort(), k.skills.map((n) => `/skills/${n}`).sort());
      assert.deepEqual(errors, []);
      await ctx.close();
    }
  });
}
