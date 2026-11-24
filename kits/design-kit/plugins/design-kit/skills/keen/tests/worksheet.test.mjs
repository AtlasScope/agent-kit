import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { commandFor, commands, optionsOf, readBook, render, serve } from "../scripts/worksheet.mjs";

const page1 = {
  tab: "Critique",
  title: "Keen critique: <Today>",
  verdict: "The day arrives late.",
  report: { happened: "Looked at Today.", means: "You scroll to see the day." },
  problems: [{ title: "The day is late", body: "First paragraph.\n\nSecond <b>paragraph</b>." }],
  steps: [
    {
      label: "Simplify the list",
      why: "Biggest problem.",
      suggested: true,
      options: [
        { label: "Simplify", why: "Removes things.", command: "/keen distill Today" },
        { label: "Tidy only", why: "Lighter.", command: "/keen polish Today" },
      ],
    },
    { label: "Fix the phone", why: "Second.", command: '/keen adapt "Today" </script><script>alert(1)</script>' },
  ],
  menu: [{ label: "Harden", why: "Real data.", command: "/keen harden Today" }],
  details: "npm run dev",
  notChecked: "A real phone.",
};
const page2 = { tab: "After simplify", title: "Keen distill: Today", report: { happened: "Folded the list.", means: "The day shows sooner." }, steps: [{ label: "Fix the phone", why: "Next.", command: "/keen adapt Today" }] };

const book = (...pages) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "keen-book-"));
  pages.forEach((p, i) => fs.writeFileSync(path.join(dir, `page-${i + 1}.json`), JSON.stringify(p)));
  return dir;
};
const start = (dir, options = {}) => {
  let ready;
  const url = new Promise((resolve) => (ready = resolve));
  const chosen = serve(dir, { minutes: 1, ...options, onReady: ready });
  return { url, chosen };
};
const post = (address, body) => fetch(`${new URL(address).origin}/choose`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const keyOf = (address) => new URL(address).searchParams.get("k");

test("a step offers its options best first, and a plain step is its own option", () => {
  assert.deepEqual(optionsOf(page1.steps[0]).map((o) => o.command), ["/keen distill Today", "/keen polish Today"]);
  assert.deepEqual(optionsOf(page1.steps[1]).map((o) => o.label), ["Fix the phone"]);
  assert.equal(commands(page1).length, 4);
});

test("a pick resolves only to a command the page lists", () => {
  assert.equal(commandFor(page1, ["s", 0, 1]), "/keen polish Today");
  assert.equal(commandFor(page1, ["s", 1]), page1.steps[1].command);
  assert.equal(commandFor(page1, ["m", 0]), "/keen harden Today");
  for (const bad of [["s", 9, 0], ["s", 0, 9], ["m", 4], ["m", -1], ["x", 0], ["s", "0", 0], "rm -rf /", null, { command: "x" }]) assert.equal(commandFor(page1, bad), undefined);
});

test("render escapes text and keeps script-closing text out of the page's script", () => {
  const html = render([page1]);
  assert.match(html, /Keen critique: &lt;Today&gt;/);
  assert.match(html, /Second &lt;b&gt;paragraph&lt;\/b&gt;\./);
  assert.ok(!html.includes("<script>alert(1)"), "a command must not be able to open a script tag");
  assert.equal(html.toLowerCase().split("<script").length - 1, 1, "the page has exactly one script tag, in any letter case");
});

test("a screenshot address cannot add attributes to the image", () => {
  assert.throws(() => render([{ title: "x", shots: [{ src: 'data:image/png,invalid" onerror="alert(1)', caption: "c" }] }]), /Inline screenshot/);
  assert.throws(() => render([{ title: "x", shots: [{ src: "notes.txt", caption: "c" }] }]), /png, jpg, webp or gif/);
  const html = render([{ title: "x", shots: [{ src: "data:image/png;base64,iVBORw0KGgo=", caption: "c" }] }]);
  assert.match(html, /<img src="data:image\/png;base64,iVBORw0KGgo=" alt="c">/);
});

test("the static book has every page, a job picker, and no start", () => {
  const html = render([page1, page2]);
  assert.match(html, /<body class="static">/);
  assert.match(html, /read-only copy to keep or send/);
  assert.match(html, /const TOKEN = "";/);
  assert.equal(html.split("<script>")[0].split('<section class="page">').length - 1, 2);
  assert.match(html, /<select data-step="0">/);
  assert.match(html, /Add all, in this order/);
  assert.match(html, /Details for someone technical/);
});

test("smaller findings are listed and escaped", () => {
  const html = render([{ title: "x", also: ["Two buttons share a <name>."] }]);
  assert.match(html, /<h2>Also found<\/h2><ul><li>Two buttons share a &lt;name&gt;\.<\/li><\/ul>/);
  assert.ok(!render([{ title: "x" }]).includes("Also found"));
});

test("a page with no next steps says there is nothing to do", () => {
  const html = render([{ title: "Keen polish", report: { happened: "Tidied.", means: "Looks finished." } }]);
  assert.match(html, /Nothing\./);
  assert.ok(!html.includes("What you can run next"));
});

test("readBook returns pages in number order and ignores other files", () => {
  const dir = book(page1);
  fs.writeFileSync(path.join(dir, "page-10.json"), JSON.stringify({ title: "ten" }));
  fs.writeFileSync(path.join(dir, "page-2.json"), JSON.stringify(page2));
  fs.writeFileSync(path.join(dir, "session.json"), "{}");
  assert.deepEqual(readBook(dir).map((p) => p.title), [page1.title, page2.title, "ten"]);
});

test("the live page has no read-only note", async () => {
  const { url, chosen } = start(book(page1), { minutes: 0.002 });
  const html = await (await fetch(await url)).text();
  assert.ok(!html.includes("read-only copy"));
  assert.match(html, /id="start"|class="go"/);
  await chosen;
});

test("the server needs the key and reports the picks in the person's order", async () => {
  const { url, chosen } = start(book(page1));
  const address = await url;
  assert.match(address, /^http:\/\/127\.0\.0\.1:\d+\/\?k=[0-9a-f]{32}$/);
  const origin = new URL(address).origin;
  const k = keyOf(address);

  assert.equal((await fetch(`${origin}/`)).status, 403);
  assert.equal((await fetch(`${origin}/state`)).status, 403);
  assert.equal((await fetch(address)).status, 200);
  assert.deepEqual(await (await fetch(`${origin}/state?k=${k}`)).json(), { count: 1, running: [] });

  assert.equal((await post(address, { k: "wrong", page: 0, picks: [["s", 0, 0]] })).status, 403);
  assert.equal((await post(address, { k, page: 0, picks: [["s", 9, 0]] })).status, 400);
  assert.equal((await post(address, { k, page: 5, picks: [["s", 0, 0]] })).status, 400);
  assert.equal((await post(address, { k, page: 0, picks: [] })).status, 400);
  assert.equal((await post(address, { k, page: 0, command: "rm -rf /" })).status, 400);
  assert.equal((await post(address, { k, page: 0, picks: [["s", 1], ["s", 0, 1], ["m", 0]] })).status, 200);
  assert.deepEqual(await chosen, [page1.steps[1].command, "/keen polish Today", "/keen harden Today"]);
});

test("a rerun keeps the same address, shows the new page, and accepts a pick from an earlier page", async () => {
  const dir = book(page1);
  const first = start(dir);
  const address = await first.url;
  assert.equal((await post(address, { k: keyOf(address), page: 0, picks: [["s", 0, 0]] })).status, 200);
  assert.deepEqual(await first.chosen, ["/keen distill Today"]);

  fs.writeFileSync(path.join(dir, "page-2.json"), JSON.stringify(page2));
  const second = start(dir);
  const again = await second.url;
  assert.equal(again, address, "the open page must be able to reconnect");
  const origin = new URL(again).origin;
  assert.deepEqual(await (await fetch(`${origin}/state?k=${keyOf(again)}`)).json(), { count: 2, running: [] });
  const pages = await (await fetch(`${origin}/pages?k=${keyOf(again)}`)).json();
  assert.deepEqual(pages.pages.map((p) => p.tab), ["Critique", "After simplify"]);
  assert.equal(pages.html.length, 2);
  assert.equal((await post(again, { k: keyOf(again), page: 0, picks: [["s", 1]] })).status, 200);
  assert.deepEqual(await second.chosen, [page1.steps[1].command]);
});

test("with no start before the time limit it resolves with null", async () => {
  const { url, chosen } = start(book(page1), { minutes: 0.002 });
  await url;
  assert.equal(await chosen, null);
});

test("an empty folder is an error, not an empty page", async () => {
  await assert.rejects(serve(fs.mkdtempSync(path.join(os.tmpdir(), "keen-empty-"))), /No page-1\.json/);
});
