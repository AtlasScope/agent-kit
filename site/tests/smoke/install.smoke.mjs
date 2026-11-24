// The install page, visited directly and arriving from the homepage, at desktop and phone sizes.
//   npm run build && node --test tests/smoke/install.smoke.mjs
// Set SMOKE_URL to test a running site instead of starting `next start` here.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import { AGENTS, INSTALL_MESSAGE, KITS } from "../../lib/site.ts";

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

async function open(size, path, { clipboard = true } = {}) {
  const ctx = await browser.newContext({ ...size, permissions: clipboard ? ["clipboard-read", "clipboard-write"] : [] });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const res = await page.goto(base + path, { waitUntil: "networkidle" });
  assert.equal(res.status(), 200);
  return { page, ctx, errors };
}
const clip = (page) => page.evaluate(() => navigator.clipboard.readText());

for (const size of SIZES) {
  test(`${size.name}: a direct visit copies the exact message and keeps every command behind the disclosure`, async () => {
    const { page, ctx, errors } = await open(size, "/install");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, "no sideways scroll");
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal((await page.locator(".inst__say").textContent()).trim(), INSTALL_MESSAGE);
    // Nothing claims a copy before one happens.
    assert.equal(await page.locator(".inst__note").count(), 0);
    await page.getByRole("button", { name: "Copy the message" }).click();
    assert.equal(await clip(page), INSTALL_MESSAGE);
    await page.locator(".inst__note", { hasText: "Message copied" }).waitFor();

    // The by-hand commands start closed and open on the summary.
    assert.equal(await page.getByRole("tab", { name: "Codex" }).isVisible(), false);
    await page.locator(".inst__manual > summary").click();
    for (const id of ["claude", "codex", "cursor", "any"]) {
      const a = AGENTS.find((x) => x.id === id);
      await page.getByRole("tab", { name: a.label }).click();
      await page.getByRole("tabpanel").getByRole("button", { name: /^Copy/ }).click();
      assert.equal(await clip(page), a.steps.join("\n"), `${a.label} copies every step exactly`);
    }
    await page.locator(".inst__note", { hasText: "Install command copied" }).waitFor();
    // Arrow keys move between agents.
    await page.getByRole("tab", { name: "Any agent" }).focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "it-claude");

    // Every kit in the catalog is listed and links to its page.
    for (const k of KITS) assert.equal(await page.locator(`.inst__kits a[href="/kits/${k}"]`).count(), 1, k);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size.name}: arriving from the homepage says the message is copied, and #manual opens the commands`, async () => {
    const { page, ctx, errors } = await open(size, "/");
    await page.evaluate(() => sessionStorage.setItem("agent-kit:copied", JSON.stringify({ message: true, at: Date.now() })));
    await page.goto(base + "/install", { waitUntil: "networkidle" });
    await page.locator(".inst__note", { hasText: "Message copied" }).waitFor();
    assert.equal(await page.locator(".inst[data-arrived]").count(), 1);
    assert.equal(await page.evaluate(() => document.activeElement?.tagName), "H1");
    // The heading takes focus without a ring or glow.
    assert.equal(await page.locator("h1").evaluate((h) => getComputedStyle(h).boxShadow), "none");
    // A stale hand-off (over ten seconds old) claims nothing. (Leave the page first: a hash-only goto doesn't reload.)
    await page.goto(base + "/kits", { waitUntil: "networkidle" });
    await page.evaluate(() => sessionStorage.setItem("agent-kit:copied", JSON.stringify({ message: true, at: Date.now() - 60_000 })));
    await page.goto(base + "/install#manual", { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    assert.equal(await page.locator(".inst__note").count(), 0);
    assert.equal(await page.locator(".inst[data-arrived]").count(), 0);
    assert.ok(await page.getByRole("tab", { name: "Claude Code" }).isVisible(), "#manual opens the commands");
    // A same-page link to #manual opens it too.
    await page.locator(".inst__manual > summary").click();
    await page.evaluate(() => { location.hash = ""; location.hash = "manual"; });
    await page.getByRole("tab", { name: "Claude Code" }).waitFor();
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size.name}: a blocked copy says so and selects the message`, async () => {
    const { page, ctx } = await open(size, "/install", { clipboard: false });
    await page.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error("denied")); });
    await page.getByRole("button", { name: "Copy the message" }).click();
    await page.locator(".inst__note.is-warn", { hasText: "blocked" }).waitFor();
    assert.equal((await page.evaluate(() => getSelection()?.toString() ?? "")).trim(), INSTALL_MESSAGE);
    assert.equal(await page.getByRole("button", { name: /Copied/ }).count(), 0, "never shows Copied after a failure");
    // How to copy it yourself: keys on a computer, touch on a phone. Never a sentence with the keys missing.
    const hint = await page.locator(".inst__note.is-warn").innerText();
    assert.match(hint, size.name === "phone" ? /Touch and hold it, then choose Copy/ : /Copy it with/);
    assert.doesNotMatch(hint, size.name === "phone" ? /Copy it with/ : /Touch and hold/);
    await ctx.close();
  });
}
