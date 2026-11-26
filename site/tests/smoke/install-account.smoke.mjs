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
const copy = (page) => page.getByRole("button", { name: /Copy the message/ }).first().click();
const offer = (page) => page.locator(".inst__path--out");
const join = (page) => page.getByRole("link", { name: "Create a free account" });
const explore = (page) => page.getByRole("button", { name: "Explore", exact: true });

for (const size of SIZES) {
  test(`${size.name}: after a copy, the two ways on are an account and Explore, both in view`, async () => {
    const { page, ctx, errors } = await open(size);
    await copy(page);
    assert.equal((await page.locator(".inst__done").innerText()).trim(), "Copied");
    // Nothing else competes on the first screen: no prompt to copy before the install message is pasted.
    assert.equal(await page.locator(".inst__msg .copy, .inst__msg [data-copied]").count(), 0);
    await offer(page).waitFor();
    assert.equal(await page.getByRole("heading", { name: "Keep what works" }).count(), 1);
    assert.match(await offer(page).innerText(), /Star prompts and skills[\s\S]*collections[\s\S]*Free/);
    // Create a free account and Sign in go to sign-in, which comes back here.
    for (const l of [join(page), offer(page).getByRole("link", { name: "Sign in" })]) assert.equal(await l.getAttribute("href"), "/sign-in?redirect_url=%2Finstall");
    // Below the agent buttons, and on a computer both ways on are on the first screen.
    const agents = await page.locator(".inst__agents").boundingBox(), j = await join(page).boundingBox(), e = await explore(page).boundingBox();
    assert.ok(j.y > agents.y + agents.height, "the paths sit below the agent buttons");
    assert.ok(j.height >= 44 && e.height >= 44);
    if (size.name === "desktop") assert.ok(j.y + j.height <= size.viewport.height && e.y + e.height <= size.viewport.height, "both are in view");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, "no sideways scroll");
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size.name}: Explore opens a drawer to each part of the site, and Escape closes it`, async () => {
    const { page, ctx } = await open(size);
    await explore(page).click();
    const drawer = page.getByRole("dialog", { name: "Explore Agent Kit" });
    await drawer.waitFor();
    for (const name of ["Prompts", "Skills", "Kits", "Fix a problem", "New to coding agents?"]) assert.equal(await drawer.getByRole("link", { name: new RegExp(`^${name.replace("?", "\\?")}`) }).count(), 1, name);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    assert.equal(await page.locator(".inst__drawer[open]").count(), 0);
    await ctx.close();
  });

  test(`${size.name}: signed in, the account path becomes Your collections, with nothing swapping on load`, async () => {
    const { page, ctx } = await open(size);
    await offer(page).waitFor();
    // Clerk sets __client_uat to a timestamp when another tab signs in; coming back to this tab re-reads it.
    await page.evaluate(() => { document.cookie = "__client_uat=1764000000; path=/"; dispatchEvent(new Event("focus")); });
    await page.getByRole("link", { name: "Your collections" }).waitFor();
    assert.equal(await offer(page).isVisible(), false);
    // On a fresh load the before-paint hint picks the signed-in version from the first frame.
    await page.reload({ waitUntil: "domcontentloaded" });
    assert.equal(await offer(page).isVisible(), false);
    assert.equal(await page.getByRole("link", { name: "Your collections" }).isVisible(), true);
    await ctx.close();
  });
}

test("reduced motion: the drawer opens without animating", async () => {
  const { page, ctx } = await open(SIZES[0], { reducedMotion: "reduce" });
  await explore(page).click();
  await page.locator(".inst__drawer[open]").waitFor();
  assert.equal(await page.locator(".inst__drawer").evaluate((e) => e.getAnimations().length), 0);
  await ctx.close();
});
