import test from "node:test";
import assert from "node:assert/strict";
import { commands, render, serve } from "../scripts/worksheet.mjs";

const report = {
  title: "Keen critique: <Today>",
  verdict: "The day arrives late.",
  report: { happened: "Looked at Today.", means: "You scroll to see the day." },
  problems: [{ title: "The day is late", body: "First paragraph.\n\nSecond <b>paragraph</b>." }],
  steps: [
    { label: "Simplify the list", why: "Biggest problem.", command: "/keen distill Today", suggested: true },
    { label: "Fix the phone", why: "Second.", command: '/keen adapt "Today" </script><script>alert(1)</script>' },
  ],
  bundle: { label: "Run both in order", why: "Less to resize.", command: "Run distill then adapt on Today." },
  details: "npm run dev",
  notChecked: "A real phone.",
};

const start = (options = {}) => {
  let ready;
  const url = new Promise((resolve) => (ready = resolve));
  const chosen = serve(report, { minutes: 1, ...options, onReady: ready });
  return { url, chosen };
};

test("commands lists each step, then the bundle", () => {
  assert.deepEqual(commands(report), [report.steps[0].command, report.steps[1].command, report.bundle.command]);
  assert.deepEqual(commands({}), []);
});

test("render escapes text and keeps script-closing text out of the page's script", () => {
  const html = render(report);
  assert.match(html, /Keen critique: &lt;Today&gt;/);
  assert.match(html, /Second &lt;b&gt;paragraph&lt;\/b&gt;\./);
  assert.ok(!html.includes("<script>alert(1)"), "a command must not be able to open a script tag");
  assert.match(html, /\\u003c\/script>\\u003cscript>alert\(1\)/);
  assert.equal(html.toLowerCase().split("<script").length - 1, 1, "the page has exactly one script tag, in any letter case");
});

test("a static page offers copy only", () => {
  const html = render(report);
  assert.match(html, /<body>/);
  assert.match(html, /const TOKEN = "";/);
  assert.match(html, /Suggested/);
  assert.match(html, /Details for someone technical/);
});

test("a report with no next steps says there is nothing to do", () => {
  const html = render({ title: "Keen polish", report: { happened: "Tidied.", means: "Looks finished." } });
  assert.match(html, /Nothing\./);
  assert.ok(!html.includes("Pick a next step"));
});

test("the server needs the key, accepts only a listed choice, and reports it", async () => {
  const { url, chosen } = start();
  const address = await url;
  assert.match(address, /^http:\/\/127\.0\.0\.1:\d+\/\?k=[0-9a-f]{32}$/);
  const origin = new URL(address).origin;
  const key = new URL(address).searchParams.get("k");

  assert.equal((await fetch(`${origin}/`)).status, 403);
  const page = await fetch(address);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /<body class="live">/);

  const post = (body) => fetch(`${origin}/choose`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  assert.equal((await post({ k: "wrong", index: 0 })).status, 403);
  assert.equal((await post({ k: key, index: 9 })).status, 400);
  assert.equal((await post({ k: key, index: "0" })).status, 400);
  assert.equal((await post({ k: key, command: "rm -rf /" })).status, 400);
  assert.equal((await post({ k: key, index: 2 })).status, 200);
  assert.equal(await chosen, report.bundle.command);
});

test("with no press before the time limit it resolves with null", async () => {
  const { url, chosen } = start({ minutes: 0.002 });
  await url;
  assert.equal(await chosen, null);
});
