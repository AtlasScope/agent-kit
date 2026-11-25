import test from "node:test";
import assert from "node:assert/strict";
import { oklch, judge, pageScript, defaultAccentHue } from "../scripts/fingerprint.mjs";
import { browserSkip, launch } from "./browser.mjs";

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} is not within ${tol} of ${b}`);

test("OKLCH matches the published values for white, black and sRGB primaries", () => {
  near(oklch([255, 255, 255])[0], 1, 1e-3, "white lightness");
  near(oklch([255, 255, 255])[1], 0, 1e-3, "white chroma");
  near(oklch([0, 0, 0])[0], 0, 1e-6, "black lightness");
  // CSS Color 4 gives sRGB red as oklch(62.8% 0.2577 29.23).
  const red = oklch([255, 0, 0]);
  near(red[0], 0.628, 2e-3, "red lightness");
  near(red[1], 0.2577, 2e-3, "red chroma");
  near(red[2], 29.23, 0.3, "red hue");
  // and sRGB blue as oklch(45.2% 0.313 264.05).
  const blue = oklch([0, 0, 255]);
  near(blue[0], 0.452, 2e-3, "blue lightness");
  near(blue[2], 264.05, 0.3, "blue hue");
});

test("a grey has no hue, and the default band holds indigo and violet but not teal or orange", () => {
  assert.equal(oklch([128, 128, 128])[2], 0);
  assert.ok(defaultAccentHue(oklch([99, 102, 241])[2]), "indigo-500");
  assert.ok(defaultAccentHue(oklch([139, 92, 246])[2]), "violet-500");
  assert.ok(!defaultAccentHue(oklch([20, 184, 166])[2]), "teal");
  assert.ok(!defaultAccentHue(oklch([234, 88, 12])[2]), "orange");
});

const generic = {
  type: { families: [{ family: "inter", share: 1 }], body: 16, largest: 30, scaleContrast: 1.875, emojiIcons: 4 },
  colour: { chromatic: [{ h: 277, share: 0.1 }], gradients: 3, gradientText: true },
  form: { boxes: 10, mainRadius: "12px", mainRadiusShare: 0.9, shadowShare: 0.6, blur: 3, cardRows: 1 },
  layout: { centredShare: 0.7, centredHero: 'heading "Ship faster" centred with 2 filled button(s) below' },
};

test("a page built from every default is told so, item by item", () => {
  const ids = judge(generic).map((d) => d.id).sort();
  assert.deepEqual(ids, ["card-grid", "centred-hero", "centred-text", "emoji-icons", "glass", "gradient", "one-radius", "shadow-everywhere", "stock-type", "timid-scale", "violet-accent"].sort());
});

test("a page with chosen type, colour and form reports no defaults", () => {
  const chosen = {
    type: { families: [{ family: "fraunces", share: 0.6 }, { family: "inter", share: 0.4 }], body: 17, largest: 96, scaleContrast: 5.6, emojiIcons: 0 },
    colour: { chromatic: [{ h: 68, share: 0.05 }], gradients: 0, gradientText: false },
    form: { boxes: 4, mainRadius: "0px", mainRadiusShare: 1, shadowShare: 0, blur: 0, cardRows: 0 },
    layout: { centredShare: 0.05, centredHero: "" },
  };
  assert.deepEqual(judge(chosen), []);
});

test("the page script is one expression that parses and carries its own maths", () => {
  const script = pageScript();
  assert.doesNotThrow(() => new Function(`return ${script}`));
  for (const name of ["function oklch", "function judge", "function readPage", "STOCK_FONTS"]) assert.ok(script.includes(name), name);
});

// In a real browser (see browser.mjs for where Playwright comes from).
const GENERIC_PAGE = `<!doctype html><html lang="en"><body style="margin:0;font-family:Inter,system-ui,sans-serif;background:#fff">
<header style="text-align:center;padding:80px 20px"><h1 style="font-size:40px;background:linear-gradient(90deg,#6366f1,#8b5cf6);-webkit-background-clip:text;background-clip:text;color:transparent">Ship faster</h1>
<p style="font-size:18px">The all-in-one platform for modern teams.</p>
<a href="#" style="background:#6366f1;color:#fff;padding:12px 20px;border-radius:12px">Get started</a> <a href="#" style="background:#8b5cf6;color:#fff;padding:12px 20px;border-radius:12px">Learn more</a></header>
<section style="display:flex;gap:16px;padding:20px">${["Fast", "Secure", "Simple"].map((t) => `<div style="flex:1;border-radius:12px;box-shadow:0 4px 12px #0002;background:#f5f5ff;padding:24px;height:120px"><h3>${t}</h3><p>Lorem ipsum dolor sit amet.</p></div>`).join("")}</section></body></html>`;

test("in a browser, a stock landing page is fingerprinted as stock", { skip: browserSkip }, async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.setContent(GENERIC_PAGE);
    const f = await page.evaluate(pageScript());
    const ids = f.defaults.map((d) => d.id);
    for (const id of ["stock-type", "violet-accent", "gradient", "card-grid", "centred-hero"]) assert.ok(ids.includes(id), `${id} in ${ids.join(", ")}`);
    assert.equal(f.type.families[0].family, "inter");
    assert.match(f.note, /says nothing about whether the design is good/);
  } finally { await browser.close(); }
});

// A page whose colour and lettering live in a drawing: the fingerprint must see them.
const DRAWN_PAGE = `<!doctype html><html lang="en"><body style="margin:0;font-family:Georgia,serif;background:#faf8f1;color:#141a1f">
<h1 style="font-size:64px;margin:0 0 8px">07:45</h1>
<p style="font-size:17px;max-width:none">${"A single line of reading text that never wraps because its box is far wider than it is. ".repeat(2).trim()}</p>
<svg width="1280" height="500" viewBox="0 0 1280 500"><rect width="1280" height="500" fill="#a3156e"/>
<path d="M0 400 C400 100 800 100 1280 400" fill="none" stroke="#0b6e4f" stroke-width="6"/>
<text x="40" y="60" font-family="Courier New" font-size="28" fill="#faf8f1">HIGH WATER 08:02</text></svg></body></html>`;

test("in a browser, SVG fills, strokes and text are read, and an unwrapped line is as long as its text", { skip: browserSkip }, async () => {
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.setContent(DRAWN_PAGE);
    const f = await page.evaluate(pageScript());
    assert.equal(f.graphics.svgs, 1);
    assert.ok(f.graphics.shapes >= 2, `shapes ${f.graphics.shapes}`);
    assert.ok(f.graphics.firstScreenShare > 0.4, `drawn share ${f.graphics.firstScreenShare}`);
    assert.ok(f.type.families.some((x) => x.family === "courier new"), f.type.families.map((x) => x.family).join(", "));
    const magenta = f.colour.chromatic[0];
    assert.ok(magenta && magenta.h > 330 && magenta.c > 0.15, `main colour ${JSON.stringify(magenta)}`);
    assert.ok(f.colour.chromatic.some((c) => c.h > 150 && c.h < 175), "the green stroke is seen");
    assert.ok(f.type.measure.median <= 190, `measure ${f.type.measure.median} should be the line's own length`);
  } finally { await browser.close(); }
});
