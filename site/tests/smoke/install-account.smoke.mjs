// The install page's account offer, at desktop and phone sizes, through the sample-data copy of the page
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
const offer = (page) => page.locator(".inst__acct");

for (const size of SIZES) {
  test(`${size.name}: the offer sits under the install panel, in view, with one big button`, async () => {
    const { page, ctx, errors } = await open(size);
    // Offered before a copy too: an account is optional, and the offer never blocks the install.
    await offer(page).waitFor();
    assert.equal(await page.getByRole("heading", { name: "Keep what works" }).count(), 1);
    // It is the panel's own foot, not a box under it.
    assert.equal(await page.locator(".inst__msg .inst__acct").count(), 1);
    await copy(page);
    // Copied and the agent buttons come first.
    await page.locator(".inst__agents").waitFor();
    const agents = await page.locator(".inst__agents").boundingBox(), acct = await offer(page).boundingBox();
    assert.ok(acct.y > agents.y + agents.height, "the offer sits below the agent buttons");
    // One big button and a smaller Sign in, both to sign-in, which comes back here.
    const join = page.getByRole("link", { name: /^Create a free account/ });
    const signIn = offer(page).getByRole("link", { name: /^Sign in/ });
    for (const l of [join, signIn]) {
      assert.equal(await l.getAttribute("href"), "/sign-in?redirect_url=%2Finstall");
    }
    const big = await join.boundingBox(), small = await signIn.boundingBox();
    assert.ok(big.height >= 44 && big.width > small.width * 2, "Create a free account is the big one");
    // On a computer the whole offer, button included, is on the first screen after a copy.
    if (size.name === "desktop") assert.ok(big.y + big.height <= size.viewport.height, "Create a free account is in view");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) <= 1, "no sideways scroll");
    // It names only what an account really does: stars, collections and shared collections.
    assert.match(await offer(page).innerText(), /prompts and skills you star, in collections[\s\S]*Installing and browsing stay free/);
    assert.deepEqual(errors, []);
    await ctx.close();
  });

  test(`${size.name}: Not now holds for the session, with nothing flashing on a reload`, async () => {
    const { page, ctx } = await open(size);
    await offer(page).waitFor();
    await offer(page).getByRole("button", { name: "Not now" }).click();
    assert.equal(await offer(page).count(), 0);
    assert.equal(await page.evaluate(() => document.activeElement?.matches(".inst__search")), true, "focus moves on, not to the top");
    await copy(page);
    await page.waitForTimeout(400);
    assert.equal(await offer(page).count(), 0, "copying doesn't bring it back");
    await page.reload({ waitUntil: "domcontentloaded" });
    // The before-paint mark hides it from the first frame, before React has run.
    assert.equal(await page.locator(".inst[data-no-offer]").count(), 1);
    await page.waitForLoadState("networkidle");
    assert.equal(await offer(page).count(), 0, "nor does a reload");
    await ctx.close();
  });

  test(`${size.name}: signed in, there is no offer; signing in elsewhere turns it into a welcome`, async () => {
    const { page, ctx } = await open(size);
    await offer(page).waitFor();
    // Clerk sets __client_uat to a timestamp when another tab signs in; coming back to this tab re-reads it.
    await page.evaluate(() => { document.cookie = "__client_uat=1764000000; path=/"; dispatchEvent(new Event("focus")); });
    await page.locator(".inst__welcome", { hasText: "You’re signed in" }).waitFor();
    assert.equal(await offer(page).count(), 0);
    // A visitor already signed in is never offered one.
    await page.evaluate(() => sessionStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    assert.equal(await offer(page).count(), 0);
    assert.equal(await page.locator(".inst__welcome").count(), 0);
    await ctx.close();
  });
}

test("a star pressed signed out goes to sign-in and, back here, shows that same prompt so it can be kept", async () => {
  const { page, ctx } = await open(SIZES[0]);
  await page.getByRole("tab", { name: "Improve a page" }).click();
  const star = page.locator(".inst__tryacts .star");
  assert.match(await star.getAttribute("href"), /^\/sign-in\?redirect_url=/);
  // Sign-in isn't set up on the sample-data server, so stop at the link and come back as sign-in would.
  await star.evaluate((e) => e.addEventListener("click", (ev) => ev.preventDefault(), { once: true }));
  await star.click();
  assert.match(await page.evaluate(() => localStorage.getItem("agent-kit:intent")), /"kind":"prompt"/);
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.getByRole("tab", { name: "Improve a page" }).getAttribute("aria-selected"), "true");
  await ctx.close();
});

test("reduced motion: the offer arrives without animating", async () => {
  const { page, ctx } = await open(SIZES[0], { reducedMotion: "reduce" });
  await copy(page);
  await offer(page).waitFor();
  const running = await page.evaluate(() => [...document.querySelectorAll(".inst__acct, .inst__acct *")].flatMap((e) => e.getAnimations()).length);
  assert.equal(running, 0);
  await ctx.close();
});
