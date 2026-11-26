// The install page's two ways on (a free account, and Explore), at desktop and phone sizes, through the sample-data copy of the page
// (/account/fixture/install), which turns the offer on without Clerk. The runner starts that server with ACCOUNT_FIXTURES=1.
//   npm run build && npm run smoke
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { smokeTarget } from "./run.mjs";
import { chromium } from "playwright";

const PATH = "/account/fixture/install";
const SIZES = [
  { name: "desktop", viewport: { width: 1440, height: 900 } },
  { name: "phone", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
];
let target, base, browser;

before(async () => {
  target = await smokeTarget({ fixtures: true });
  base = target.url;
  browser = await chromium.launch();
});
after(async () => {
  try { await browser?.close(); } finally { await target?.close(); }
});

async function open(size, extra = {}) {
  const ctx = await browser.newContext({ ...size, permissions: ["clipboard-read", "clipboard-write"], ...extra });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const res = await page.goto(base + PATH, { waitUntil: "networkidle" });
  assert.equal(res.status(), 200, "sample data is on at this server");
  return { page, ctx, errors };
}
const copy = async (page) => { await page.getByRole("button", { name: /Copy the message/ }).first().click(); await page.locator(".inst__msg.is-copied").waitFor(); };
const offer = (page) => page.locator(".inst__row--out");
const join = (page) => page.locator(".inst__row--out");
const explore = (page) => page.getByRole("button", { name: "Explore Agent Kit" });

for (const size of SIZES) {
  test(`${size.name}: after a copy, the two ways on are an account and Explore, both in view`, async () => {
    const { page, ctx, errors } = await open(size);
    await copy(page);
    assert.equal((await page.locator(".inst h1").innerText()).trim(), "Copied");
    // Nothing else competes on the first screen: no prompt to copy before the install message is pasted.
    assert.equal(await page.locator(".inst__msg .copy, .inst__msg [data-copied]").count(), 0);
    await offer(page).waitFor();
    assert.match(await offer(page).innerText(), /^Create a free account\s+Keep your favourite prompts and skills/);
    // One row, one control: it goes to sign-in, which comes back here.
    assert.equal(await join(page).getAttribute("href"), "/sign-in?redirect_url=%2Finstall");
    assert.equal(await offer(page).locator("a, button").count(), 0, "no buttons nested in the row");
    // Below the agent buttons, and on a computer both ways on are on the first screen.
    const agents = await page.locator(".inst__agents").boundingBox(), j = await join(page).boundingBox(), e = await explore(page).boundingBox();
    assert.ok(j.y > agents.y + agents.height, "the paths sit below the agent buttons");
    assert.ok(j.height >= 44 && e.height >= 44);
    if (size.name === "desktop") assert.ok(j.y + j.height <= size.viewport.height && e.y + e.height <= size.viewport.height, "both are in view");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, "no sideways scroll");
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size.name}: opening an agent keeps this page, says where it went and brings the account row forward`, async () => {
    const { page, ctx } = await open(size);
    await copy(page);
    const agent = page.locator(".inst__agent", { hasText: "Codex" });
    assert.equal(await agent.getAttribute("target"), "_blank");
    // The agent's own site isn't loaded in the test: stop the new tab, keep the click.
    await agent.evaluate((a) => a.addEventListener("click", (e) => e.preventDefault(), { once: true }));
    await agent.click();
    assert.equal(await page.locator(".inst__opened").innerText(), "Codex opens in a new tab. Paste the message there.");
    assert.equal(await page.locator(".inst__paths[data-nudge]").count(), 1);
    assert.match(page.url(), /\/install$/);
    await ctx.close();
  });

  test(`${size.name}: Explore opens a drawer to each part of the site, and Escape closes it`, async () => {
    const { page, ctx } = await open(size);
    await explore(page).click();
    const drawer = page.getByRole("dialog", { name: "Explore Agent Kit" });
    await drawer.waitFor();
    for (const name of ["Prompts", "Skills", "Kits", "Fix a problem", "New to coding agents?"]) assert.equal(await drawer.getByRole("link", { name: new RegExp(`^${name.replace("?", "\\?")}`) }).count(), 1, name);
    // An account entry at its foot for someone signed out.
    assert.equal(await drawer.getByRole("link", { name: "Create a free account" }).getAttribute("href"), "/sign-in?redirect_url=%2Finstall");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    assert.equal(await page.locator(".inst__drawer[open]").count(), 0);
    await ctx.close();
  });

  test(`${size.name}: signed in, the account path becomes Your collections, also after a reload`, async () => {
    const { page, ctx } = await open(size);
    await offer(page).waitFor();
    // Clerk sets __client_uat to a timestamp when another tab signs in; coming back to this tab re-reads it.
    await page.evaluate(() => { document.cookie = "__client_uat=1764000000; path=/"; dispatchEvent(new Event("focus")); });
    await page.getByRole("link", { name: "Your collections" }).waitFor();
    assert.equal(await offer(page).isVisible(), false);
    // After a reload it reads the cookie again. (On the live site the layout's before-paint hint, html[data-auth], picks
    // the signed-in version from the first frame; this sample-data server has no Clerk keys, so that hint is off here.)
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("link", { name: "Your collections" }).waitFor();
    assert.equal(await offer(page).isVisible(), false);
    await ctx.close();
  });
}

test("the sign-in page: a way on without an account, back where the visitor came from", async () => {
  const { page, ctx } = await open(SIZES[0]);
  const res = await page.goto(base + "/account/fixture/sign-in?redirect_url=%2Finstall", { waitUntil: "networkidle" });
  assert.equal(res.status(), 200);
  assert.equal(await page.getByRole("heading", { level: 1 }).innerText(), "Make Agent Kit yours");
  assert.equal(await page.getByRole("link", { name: "Continue without an account" }).getAttribute("href"), "/install");
  // Another site (however it is spelled), a loop back to sign-in, or a page that needs an account falls back to the library.
  for (const bad of ["%2F%2Fevil.example", "%2F%5Cevil.example", "https%3A%2F%2Fevil.example%2F", "%2Faccount", "%2Fsign-in"]) {
    await page.goto(base + `/account/fixture/sign-in?redirect_url=${bad}`, { waitUntil: "networkidle" });
    assert.equal(await page.getByRole("link", { name: "Continue without an account" }).getAttribute("href"), "/prompts", bad);
  }
  await ctx.close();
});

test("reduced motion: the drawer opens without animating", async () => {
  const { page, ctx } = await open(SIZES[0], { reducedMotion: "reduce" });
  await explore(page).click();
  await page.locator(".inst__drawer[open]").waitFor();
  assert.equal(await page.locator(".inst__drawer").evaluate((e) => e.getAnimations().length), 0);
  await ctx.close();
});
