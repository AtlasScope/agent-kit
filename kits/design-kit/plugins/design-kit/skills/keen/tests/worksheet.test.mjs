import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { tooLong, LIMITS, addPage, bookDir, commandFor, commands, optionsOf, readBook, render, serve } from "../scripts/worksheet.mjs";

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
const up = async (t, dir, options = {}) => { const s = await serve(dir, options); t.after(() => s.close()); return s; };
const get = (s, route) => fetch(`http://127.0.0.1:${s.port}${route}${route.includes("?") ? "&" : "?"}k=${s.token}`);
const post = (s, route, data = {}, k = s.token) => fetch(`http://127.0.0.1:${s.port}${route}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ k, ...data }) });
const state = async (s) => (await (await get(s, "/state")).json()).live;

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

test("the page has every page of the book, a job picker, Keen's own header and no outside files", () => {
  const html = render([page1, page2]);
  assert.equal(html.split("<script>")[0].split('<section class="page">').length - 1, 2);
  assert.match(html, /<select data-step="0">/);
  assert.match(html, /Add all \d, in this order/);
  assert.match(html, /<span>Details<\/span>/);
  assert.match(html, />AtlasScope<\/span><span class="tool">Keen<\/span>/);
  assert.match(render([{ title: "x", area: "Engineer <x>" }]), /<span class="tool">Engineer &lt;x&gt;<\/span>/);
  assert.match(html, /id="start">Start<\/button>/);
  assert.ok(!/(src|href)="https?:/.test(html), "nothing is fetched from elsewhere, so it looks the same everywhere");
});

test("smaller findings are listed and escaped", () => {
  const html = render([{ title: "x", also: ["Two buttons share a <name>."] }]);
  assert.match(html, /Also found \(1\)<\/span><\/summary><div class="body"><ul><li>Two buttons share a &lt;name&gt;\.<\/li><\/ul>/);
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

test("a short name is kept in the cache folder, not the project, and a path is used as given", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "keen-home-"));
  const project = fs.mkdtempSync(path.join(os.tmpdir(), "keen-proj-"));
  const dir = bookDir("Kits page!", { cwd: project, env: { KEEN_HOME: home } });
  assert.ok(dir.startsWith(home) && dir.endsWith(`${path.sep}kits-page`));
  assert.ok(!dir.startsWith(project));
  assert.equal(bookDir("./books/x", { cwd: project, env: {} }), path.join(project, "books", "x"));
  assert.throws(() => bookDir(""), /short name/);
});

test("adding a page copies its screenshots in and refuses a page with no title", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "keen-add-"));
  const shots = fs.mkdtempSync(path.join(os.tmpdir(), "keen-shots-"));
  fs.writeFileSync(path.join(shots, "a.png"), Buffer.from("iVBORw0KGgo=", "base64"));
  assert.equal(addPage(dir, { title: "One", shots: [{ src: "a.png", caption: "c" }] }, { baseDir: shots }), 1);
  assert.equal(addPage(dir, { title: "Two" }), 2);
  fs.rmSync(shots, { recursive: true });
  assert.match(readBook(dir)[0].shots[0].src, /^data:image\/png;base64,/);
  assert.throws(() => addPage(dir, { verdict: "no title" }), /title/);
  assert.throws(() => addPage(dir, { title: "x", shots: [{ src: "notes.txt" }] }, { baseDir: shots }), /png, jpg, webp or gif/);
});

test("the server needs the key, and a start reaches a waiting agent in the person's order", async (t) => {
  const s = await up(t, book(page1));
  assert.match(s.url, /^http:\/\/127\.0\.0\.1:\d+\/\?k=[0-9a-f]{32}$/);
  const origin = `http://127.0.0.1:${s.port}`;
  assert.equal((await fetch(`${origin}/`)).status, 403);
  assert.equal((await fetch(`${origin}/state`)).status, 403);
  assert.equal((await fetch(`${origin}/wait`)).status, 403);
  assert.equal((await fetch(s.url)).status, 200);
  assert.deepEqual(await state(s), { working: [], held: [], listening: false, progress: "", stale: [] });

  assert.equal((await post(s, "/choose", { page: 0, picks: [["s", 0, 0]] }, "wrong")).status, 403);
  assert.equal((await post(s, "/choose", { page: 0, picks: [["s", 9, 0]] })).status, 400);
  assert.equal((await post(s, "/choose", { page: 5, picks: [["s", 0, 0]] })).status, 400);
  assert.equal((await post(s, "/choose", { page: 0, picks: [] })).status, 400);
  assert.equal((await post(s, "/choose", { page: 0, command: "rm -rf /" })).status, 400);

  const waiting = get(s, "/wait").then((r) => r.json());
  await new Promise((r) => setTimeout(r, 50));
  assert.equal((await state(s)).listening, true);
  const res = await (await post(s, "/choose", { page: 0, picks: [["s", 1], ["s", 0, 1], ["m", 0]] })).json();
  assert.equal(res.delivered, true);
  assert.deepEqual((await waiting).chosen, [page1.steps[1].command, "/keen polish Today", "/keen harden Today"]);
  assert.deepEqual((await state(s)).working, ["Fix the phone", "Tidy only", "Harden"]);
});

test("a start while the agent is busy or away is held, shown, and handed over at the next wait", async (t) => {
  const s = await up(t, book(page1));
  const away = await (await post(s, "/choose", { page: 0, picks: [["s", 0, 0]] })).json();
  assert.equal(away.delivered, false);
  assert.deepEqual(away.live.held, ["Simplify"]);
  await post(s, "/choose", { page: 0, picks: [["m", 0]] });
  assert.deepEqual((await (await get(s, "/wait")).json()).chosen, ["/keen distill Today", "/keen harden Today"]);

  const busy = await (await post(s, "/choose", { page: 0, picks: [["s", 1]] })).json();
  assert.equal(busy.delivered, false);
  assert.deepEqual(busy.live, { working: ["Simplify", "Harden"], held: ["Fix the phone"], listening: false, progress: "", stale: [] });
  await post(s, "/say", { text: "Halfway" });
  assert.equal((await state(s)).progress, "Halfway");
  await post(s, "/turned");
  assert.deepEqual((await state(s)).working, ["Harden"]);
  assert.deepEqual((await (await get(s, "/wait")).json()).chosen, [page1.steps[1].command]);
});

test("a new page shows up on the open page without restarting anything", async (t) => {
  const dir = book(page1);
  const s = await up(t, dir);
  assert.equal((await (await get(s, "/state")).json()).count, 1);
  addPage(dir, page2);
  assert.equal((await (await get(s, "/state")).json()).count, 2);
  const fresh = await (await get(s, "/pages")).json();
  assert.deepEqual(fresh.pages.map((p) => p.tab), ["Critique", "After simplify"]);
  assert.equal(fresh.html.length, 2);
});

test("a wait that nobody answers is told to ask again, and a stop ends it", async (t) => {
  const s = await up(t, book(page1), { sliceMs: 40 });
  assert.deepEqual(await (await get(s, "/wait")).json(), { again: true });
  const waiting = get(s, "/wait").then((r) => r.json());
  await new Promise((r) => setTimeout(r, 10));
  await post(s, "/stop");
  assert.deepEqual(await waiting, { stopped: true });
});

test("a page with too many words is refused, and the refusal names each part to shorten", () => {
  const long = "word ".repeat(LIMITS.verdict + 1).trim();
  assert.deepEqual(tooLong({ title: "x", verdict: "Short and true." }), []);
  const found = tooLong({ title: "x", verdict: long, problems: [{ title: "a" }, { title: "b" }, { title: "c" }, { title: "d" }], steps: [{ label: "ok", why: long + " more words here to go over", command: "/keen polish" }] });
  assert.equal(found.length, 3);
  assert.match(found[0], /^verdict is 17 words; 16 at most\./);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "keen-long-"));
  assert.throws(() => addPage(dir, { title: "x", verdict: long }), /too many words[\s\S]*verdict is 17 words/);
  assert.equal(readBook(dir).length, 0);
});

test("a book is private to the person running it: folder, pages and the page key", { skip: process.platform === "win32" && "Windows uses access lists, not mode bits" }, async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "keen-private-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.chmodSync(dir, 0o755); // an existing cache folder made before this change
  addPage(dir, page1);
  const s = await up(t, dir);
  const mode = (file) => fs.statSync(path.join(dir, file)).mode & 0o777;
  assert.equal(fs.statSync(dir).mode & 0o777, 0o700, "the folder lets no one else in");
  assert.equal(mode("page-1.json"), 0o600);
  assert.equal(mode("server.json"), 0o600, "the page key is readable by its owner alone");
  assert.ok(s.token);
});
