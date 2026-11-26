// The install page, visited directly and arriving from the homepage, at desktop and phone sizes.
//   npm run build && node --test tests/smoke/install.smoke.mjs
// Set SMOKE_URL to test a running site instead of starting `next start` here.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { smokeTarget } from "./run.mjs";
import { chromium } from "playwright";
import { AGENTS, INSTALL_MESSAGE, KITS } from "../../lib/site.ts";

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
    // The message is copied, not shown: only a blocked copy shows it.
    assert.equal(await page.locator(".inst__say").count(), 0);
    assert.equal(await page.getByText(INSTALL_MESSAGE).isVisible(), false);
    // Nothing claims a copy before one happens.
    assert.equal(await page.locator(".inst__note").count(), 0);
    await page.getByRole("button", { name: "Copy install" }).click();
    assert.equal(await clip(page), INSTALL_MESSAGE);
    await page.locator(".inst__note", { hasText: "Message copied" }).waitFor();
    await page.locator(".inst__chip", { hasText: "Copied" }).waitFor();
    assert.equal(await page.locator(".inst__agent").count(), 3, "Claude Code, Codex and Cursor can be opened");
    assert.equal(await page.getByText(INSTALL_MESSAGE).isVisible(), false, "still folded after copying");
    // No visible heading: it is for screen readers, however the page is reached.
    assert.ok((await page.locator(".inst h1").boundingBox()).height <= 1);

    // The panel opens on the kits; the by-hand commands are behind the Run it yourself tab.
    assert.equal(await page.getByRole("tab", { name: "What it installs" }).getAttribute("aria-selected"), "true");
    assert.equal(await page.getByRole("tab", { name: "Codex" }).isVisible(), false);
    await page.getByRole("tab", { name: "Run it yourself" }).click();
    for (const id of ["claude", "codex", "cursor", "any"]) {
      const a = AGENTS.find((x) => x.id === id);
      await page.getByRole("tab", { name: a.label }).click();
      await page.locator("#inst-cmd").getByRole("button", { name: /^Copy/ }).click();
      assert.equal(await clip(page), a.steps.join("\n"), `${a.label} copies every step exactly`);
    }
    await page.locator(".inst__note", { hasText: "Install command copied" }).waitFor();
    // Arrow keys move between agents.
    await page.getByRole("tab", { name: "Any agent" }).focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "it-claude");

    // The kits are cards linking to their pages; past six, a last card links to all of them.
    const cap = Number(await page.locator(".inst__kits ul").getAttribute("data-cap"));
    for (const k of KITS.slice(0, cap)) assert.equal(await page.locator(`.inst__kits a[href="/kits/${k}"]`).count(), 1, k);
    assert.equal(await page.locator('.inst__kits a[href="/kits"]').count(), KITS.length > cap ? 1 : 0);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size.name}: arriving from the homepage says the message is copied, and #manual opens the commands`, async () => {
    const { page, ctx, errors } = await open(size, "/");
    await page.evaluate(() => sessionStorage.setItem("agent-kit:copied", JSON.stringify({ message: true, at: Date.now() })));
    await page.goto(base + "/install", { waitUntil: "networkidle" });
    await page.locator(".inst__note", { hasText: "Message copied" }).waitFor();
    assert.equal(await page.locator(".inst[data-arrived]").count(), 1);
    // A flash of Copied, clear of every button; the message is never shown, and the bar has no green dot after the name.
    await page.locator(".inst__chip", { hasText: "Copied" }).waitFor();
    await page.waitForTimeout(500);
    const chip = await page.locator(".inst__chip").boundingBox();
    assert.ok(chip.y + chip.height <= (await page.locator(".inst__paths").boundingBox()).y, "the chip overlaps nothing");
    await page.locator(".inst__chip").waitFor({ state: "hidden" });
    assert.equal(await page.locator(".inst__say").count(), 0);
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector(".wordmark__name"), "::after").display), "none");
    // A full load (here, or a reload) never blanks the column: the settle plays only on an in-site navigation.
    assert.equal(await page.locator(".inst__in").evaluate((e) => e.getAnimations().length), 0);
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
    await page.getByRole("tab", { name: "What it installs" }).click();
    await page.evaluate(() => { location.hash = ""; location.hash = "manual"; });
    await page.getByRole("tab", { name: "Claude Code" }).waitFor();
    // And a same-page link while the address already ends in #manual.
    await page.getByRole("tab", { name: "What it installs" }).click();
    await page.evaluate(() => { const l = document.createElement("a"); l.href = "#manual"; l.id = "to-manual"; l.textContent = "commands"; document.querySelector(".inst__chips")?.append(l); });
    await page.locator("#to-manual").click();
    await page.getByRole("tab", { name: "Claude Code" }).waitFor();
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size.name}: a blocked copy says so and selects the message`, async () => {
    const { page, ctx } = await open(size, "/install", { clipboard: false });
    await page.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error("denied")); });
    await page.getByRole("button", { name: "Copy install" }).click();
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

// On a phone the button is on screen before the page's scripts have started. A press then must still copy the message
// and arrive on Copied, not follow the bare link and copy nothing (seen on an iPhone).
test("phone: Install pressed before the page's scripts start still copies and arrives on Copied", async () => {
  const ctx = await browser.newContext({ ...SIZES[1], permissions: ["clipboard-read", "clipboard-write"],
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1" });
  const page = await ctx.newPage();
  let release; const gate = new Promise((r) => (release = r));
  await page.route(/_next\/static\/chunks\/.*\.js/, async (route) => { await gate; await route.continue(); });
  await page.goto(base + "/", { waitUntil: "commit" });
  await page.locator(".launch__go").click({ noWaitAfter: true });
  await page.waitForURL(/\/install$/, { waitUntil: "commit" });
  await page.locator(".inst h1").waitFor({ state: "attached" });
  assert.ok(await page.locator(".inst__chip", { hasText: "Copied" }).isVisible(), "Copied from the first paint, before scripts");
  release();
  await page.waitForLoadState("networkidle");
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), INSTALL_MESSAGE);
  // On a phone, Cursor's button opens its app when installed (cursor.com/agents is in its app links).
  assert.equal(await page.locator(".inst__agent", { hasText: "Cursor" }).getAttribute("href"), "https://cursor.com/agents");
  await ctx.close();
});

// On a Mac or Windows PC each tile opens that desktop app with the message typed in; elsewhere it opens the website.
const message = encodeURIComponent(INSTALL_MESSAGE);
const APPS = { "Claude Code": `claude://code/new?q=${message}`, Codex: `codex://threads/new?prompt=${message}`, Cursor: `cursor://anysphere.cursor-deeplink/prompt?text=${message}` };
for (const [os, userAgent] of [["Mac", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15"], ["Windows", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"]]) {
  test(`${os}: each agent tile opens its desktop app with the message, and offers a way on if nothing opens`, async () => {
    const { page, ctx, errors } = await open({ ...SIZES[0], userAgent }, "/install");
    for (const [label, href] of Object.entries(APPS)) {
      const tile = page.locator(".inst__agent", { hasText: label });
      assert.equal(await tile.getAttribute("href"), href);
      assert.equal(await tile.getAttribute("target"), null);
    }
    // No app is launched by the test: keep the click, stop the hand-off to the system.
    const codex = page.locator(".inst__agent", { hasText: "Codex" });
    await codex.evaluate((a) => a.addEventListener("click", (e) => e.preventDefault()));
    await codex.click();
    assert.equal(await page.locator(".inst__say").count(), 0, "an app tile never brings the message onto the page");
    assert.equal(await clip(page), INSTALL_MESSAGE, "it copies the message too, for the web if the app is missing");
    assert.match(await page.locator(".inst__opened").innerText(), /^Opening Codex with the message filled in\. Send it there\.\s+Nothing opened\? Get the app or use the web\.$/);
    assert.equal(await page.locator(".inst__opened a").getAttribute("href"), "https://chatgpt.com/codex");
    assert.deepEqual(errors, []);
    await ctx.close();
  });
}

test("Linux: the agent tiles open the websites", async () => {
  const { page, ctx } = await open({ ...SIZES[0], userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36" }, "/install");
  assert.equal(await page.locator(".inst__agent", { hasText: "Codex" }).getAttribute("href"), "https://chatgpt.com/codex");
  assert.equal(await page.locator(".inst__agent", { hasText: "Codex" }).getAttribute("target"), "_blank");
  const tile = page.locator(".inst__agent", { hasText: "Codex" });
  await tile.evaluate((a) => a.addEventListener("click", (e) => e.preventDefault()));
  await tile.click();
  assert.equal(await clip(page), INSTALL_MESSAGE, "a website tile copies the message to paste there");
  await ctx.close();
});

test("the What it installs and Run it yourself tabs follow the arrow, Home and End keys", async () => {
  const { page, ctx } = await open(SIZES[0], "/install");
  const kits = page.getByRole("tab", { name: "What it installs" }), term = page.getByRole("tab", { name: "Run it yourself" });
  await kits.focus();
  await page.keyboard.press("End");
  assert.equal(await term.getAttribute("aria-selected"), "true");
  await page.keyboard.press("Home");
  assert.equal(await kits.getAttribute("aria-selected"), "true");
  await page.keyboard.press("ArrowRight");
  assert.equal(await term.getAttribute("aria-selected"), "true");
  assert.equal(await page.evaluate(() => document.activeElement?.id), "iv-term");
  await ctx.close();
});

test("Back goes to the homepage", async () => {
  const { page, ctx } = await open(SIZES[0], "/install");
  assert.equal(await page.locator(".inst__chips a", { hasText: "Back" }).getAttribute("href"), "/");
  await page.locator(".inst__chips a", { hasText: "Back" }).click();
  await page.waitForURL(base + "/");
  await page.locator(".hero h1").waitFor();
  await ctx.close();
});

test("without scripts the terminal commands are still on the page", async () => {
  const ctx = await browser.newContext({ ...SIZES[0], javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(base + "/install");
  assert.ok(await page.locator("#iv-term-p").isVisible(), "the commands panel shows");
  assert.ok(await page.locator("#iv-kits-p").isVisible(), "and the kits");
  await ctx.close();
});

test("Firefox: an app tile opens the app from a hidden frame, so a missing app can't replace the page", async () => {
  const ctx = await browser.newContext({ ...SIZES[0], permissions: ["clipboard-read", "clipboard-write"], userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 15.0; rv:140.0) Gecko/20100101 Firefox/140.0" });
  const page = await ctx.newPage();
  await page.goto(base + "/install", { waitUntil: "networkidle" });
  await page.route(/^codex:/, (route) => route.abort());
  await page.locator(".inst__agent", { hasText: "Codex" }).click();
  assert.match(page.url(), /\/install$/);
  assert.equal(await page.locator('iframe[src^="codex://threads/new"]').count(), 1);
  await ctx.close();
});
