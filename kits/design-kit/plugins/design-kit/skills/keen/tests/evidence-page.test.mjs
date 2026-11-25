import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { addPage, credentialsIn, readBook, render, serve, wait, writePacket } from "../scripts/worksheet.mjs";
import { evidencePacket, parseBundle } from "../scripts/evidence.mjs";
import { bundle, evidencePage } from "./evidence-fixture.mjs";

const scripts = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "scripts");
const tmp = (name) => fs.mkdtempSync(path.join(os.tmpdir(), `keen-${name}-`));
const up = async (t, dir) => { const s = await serve(dir); t.after(() => s.close()); return s; };
const post = (s, route, data = {}) => fetch(`http://127.0.0.1:${s.port}${route}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ k: s.token, ...data }) });

test("a page's evidence is checked, stored with the page and shown under it, collapsed", () => {
  const dir = tmp("ev");
  assert.equal(addPage(dir, evidencePage()), 1);
  const [stored] = readBook(dir);
  assert.deepEqual(stored.evidence, bundle());
  const html = render([stored]);
  assert.match(html, /<details class="evbox" data-ev-box><summary><span class="evq">Why does the dashboard show more revenue than the invoices\?<\/span><span class="evn">4 claims · 4 observations · 3 sources<\/span>/);
  assert.ok(html.indexOf('data-ev aria-label="Evidence"') > html.indexOf('class="steps"'), "the evidence sits under the page's own content");
  for (const text of ["Stored totals are already net of discounts", "Contradicted", "Database read", "Real run", "Proposed · not approved", "public.orders.total_cents", "sha256 bbbbbbbbbbbb", "from database · 2026-11-25 10:04 UTC", "uncommitted working tree"]) assert.ok(html.includes(text), text);
  assert.match(html, /<p class="rests" data-rests="0:0"><span>Rests on<\/span><button type="button" class="jump" data-jump="pre-discount">The dashboard sums prices before discounts<\/button>/);
  assert.match(html, /data-rests="1:0"><span>Rests on/, "an option shows what it rests on");
  assert.ok(!html.includes('data-rests="1:1"'), "an option that rests on nothing says nothing");
});

test("evidence is shown as text: markup in it cannot reach the page", () => {
  const page = evidencePage();
  page.evidence.claims[1].title = '<img src=x onerror="alert(1)">';
  page.evidence.observations[1].details = { note: "</script><script>alert(2)</script>" };
  page.evidence.title = "<b>bold</b>";
  const html = render([page]);
  assert.ok(!html.includes("<img src=x"), "a claim title is escaped");
  assert.ok(html.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"));
  assert.ok(!html.includes("<script>alert(2)"));
  assert.equal(html.toLowerCase().split("<script").length - 1, 1, "still exactly one script tag");
  const js = html.slice(html.indexOf("<script>") + 8, html.lastIndexOf("</script>"));
  assert.doesNotThrow(() => new Function(js), "the page's script still parses with evidence and the packet code in it");
});

test("evidence that breaks the contract is refused with the reason, and nothing is added", () => {
  const dir = tmp("ev");
  const page = evidencePage();
  page.evidence.claims[0].scope = "runtime-observation";
  assert.throws(() => addPage(dir, page), /not a valid atlasscope\.evidence\/v1 bundle: Cross-scope evidence cannot support or refute a claim/);
  assert.throws(() => addPage(dir, evidencePage({ evidence: { schema: "x" } })), /not a valid atlasscope\.evidence\/v1 bundle/);
  assert.throws(() => addPage(dir, evidencePage({ steps: [{ label: "Go", why: "x", claims: ["missing"], command: "/engineer go" }] })), /steps\[0\]\.claims names missing, which the page's evidence does not have/);
  assert.throws(() => addPage(dir, { title: "x", steps: [{ label: "Go", why: "x", claims: ["pre-discount"], command: "/engineer go" }] }), /names claims, but the page has no evidence/);
  assert.equal(readBook(dir).length, 0);
});

test("evidence that looks like it holds a credential is refused, saying where, without repeating it", () => {
  const dir = tmp("ev");
  const secrets = [
    ["A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8", (s) => `ghp_${s}`, /a GitHub token in evidence\.observations\[0\]\.details\.text/],
    ["hunter2", (s) => `postgres://app:${s}@db.internal:5432/shop`, /an address with a password in it in evidence\.observations\[0\]\.details\.text/],
    ["b3BlbnNzaC1rZXktdjEAAAA", (s) => `-----BEGIN OPENSSH PRIVATE KEY-----\n${s}\n-----END OPENSSH PRIVATE KEY-----`, /a private key in evidence\.observations\[0\]\.details\.text/],
    ["IOSFODNN7EXAMPLE", (s) => `key AKIA${s} in env`, /an AWS access key/],
    ["4f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c", (s) => `sk-proj-${s}`, /an API key/],
    ["123456789012-abcdefghij", (s) => `xoxb-${s}`, /a Slack token/],
  ];
  for (const [secret, wrap, where] of secrets) {
    const page = evidencePage();
    page.evidence.observations[0].details.text = wrap(secret);
    let message = "";
    try { addPage(dir, page); } catch (error) { message = error.message; }
    assert.match(message, where);
    assert.match(message, /Take each one out of the evidence/);
    assert.ok(!message.includes(secret), "the refusal does not repeat the secret");
  }
  const named = evidencePage();
  named.evidence.observations[0].details = { github_pat_11ABCDEFG0123456789abcdefghij: { note: "x" } };
  assert.throws(() => addPage(dir, named), (error) => /a GitHub token in a key name in evidence\.observations\[0\]\.details/.test(error.message) && !error.message.includes("11ABCDEFG"));
  // A secret in a field that also makes the bundle invalid is still refused as a secret, never quoted by validation.
  const invalid = evidencePage();
  invalid.evidence.observations[0].source = "ghp_A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8";
  assert.throws(() => addPage(dir, invalid), (error) => /a GitHub token in evidence\.observations\[0\]\.source/.test(error.message) && !error.message.includes("A1b2C3d4"));
  assert.equal(readBook(dir).length, 0);

  // Ordinary text and redacted addresses are fine.
  const fine = evidencePage();
  fine.evidence.observations[0].details = { url: "postgres://app:***@db.internal/shop", other: "postgres://app@db/shop", words: "task-runner-for-skeleton-components and desk-lamp", see: "https://example.com/a:b@c" };
  assert.deepEqual(credentialsIn(fine.evidence), []);
  assert.equal(addPage(dir, fine), 1);
});

test("the page's own key is never accepted into evidence or written into a packet", async (t) => {
  const dir = tmp("ev");
  const s = await up(t, dir);
  const page = evidencePage();
  page.evidence.sources[0].method = `Opened http://127.0.0.1:${s.port}/?k=${s.token}`;
  assert.throws(() => addPage(dir, page), /this page's own key in evidence\.sources\[0\]\.method/);
  addPage(dir, evidencePage());
  const file = writePacket(dir, readBook(dir)[0], ["pre-discount"], s.token);
  assert.ok(!fs.readFileSync(file, "utf8").includes(s.token));
});

test("starting a step that rests on claims hands the agent a packet of exactly those claims", async (t) => {
  const dir = tmp("ev");
  addPage(dir, evidencePage());
  const s = await up(t, dir);
  const waiting = wait(dir, { minutes: 1 });
  await new Promise((r) => setTimeout(r, 150));
  const res = await (await post(s, "/choose", { page: 0, picks: [["s", 0], ["s", 1, 1], ["s", 1, 0]] })).json();
  assert.equal(res.delivered, true);
  assert.ok(!JSON.stringify(res).includes("packet-"), "the page is never told where packets are kept");
  const chosen = await waiting;
  assert.deepEqual([...chosen], ["/engineer fix the dashboard revenue sum", "/engineer draft a question for finance", "/database check refunds"]);
  assert.equal(chosen.evidence[1], "", "a choice that rests on nothing carries no packet");
  const [first, , third] = chosen.evidence;
  assert.ok(path.isAbsolute(first));
  assert.equal(path.dirname(first), path.resolve(dir), "the packet is in the book folder");
  const packet = parseBundle(fs.readFileSync(first, "utf8"));
  assert.deepEqual(packet, evidencePacket(bundle(), ["pre-discount", "stored-net"]));
  assert.deepEqual(packet.decisions.map((d) => d.id), ["use-stored"]);
  assert.deepEqual(parseBundle(fs.readFileSync(third, "utf8")).claims.map((c) => c.id), ["refunds"]);
  assert.ok(!fs.readFileSync(first, "utf8").includes(s.token));
  assert.deepEqual(fs.readdirSync(dir).filter((n) => n.endsWith(".tmp")), [], "nothing half-written is left behind");
  assert.equal(writePacket(dir, readBook(dir)[0], ["stored-net", "pre-discount"]), first, "the same claims make the same file");
});

// The page is copied into other skills without Keen's workspace.mjs. It must work there, from the command line.
test("the page runs from a folder that has no workspace.mjs: add, serve, wait with EVIDENCE, packet, stop", async (t) => {
  const copy = tmp("copy");
  for (const name of ["worksheet.mjs", "evidence.mjs"]) fs.copyFileSync(path.join(scripts, name), path.join(copy, name));
  const book = path.join(tmp("book"), "work");
  const pageFile = path.join(tmp("page"), "page.json");
  fs.writeFileSync(pageFile, JSON.stringify(evidencePage()));
  const cli = path.join(copy, "worksheet.mjs");
  const run = (...args) => execFileSync(process.execPath, [cli, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  t.after(() => { try { run("stop", book); } catch { /* already stopped */ } });

  const added = run("add", book, "--from", pageFile);
  assert.match(added, /^PAGE: 1\nURL: http:\/\/127\.0\.0\.1:\d+\/\?k=[0-9a-f]{32}\n$/);
  const { port, token } = JSON.parse(fs.readFileSync(path.join(book, "server.json"), "utf8"));
  const state = await (await fetch(`http://127.0.0.1:${port}/state?k=${token}`)).json();
  assert.deepEqual(state.live.stale, [], "with no workspace, nothing is ever stale");
  assert.equal((await fetch(`http://127.0.0.1:${port}/?k=${token}`)).status, 200);

  const waiter = spawn(process.execPath, [cli, "wait", book, "--minutes", "1"], { stdio: ["ignore", "pipe", "pipe"] });
  let out = "";
  waiter.stdout.on("data", (c) => { out += c; });
  const done = new Promise((r) => waiter.on("exit", r));
  for (let i = 0; i < 50 && !(await (await fetch(`http://127.0.0.1:${port}/state?k=${token}`)).json()).live.listening; i += 1) await new Promise((r) => setTimeout(r, 100));
  await post({ port, token }, "/choose", { page: 0, picks: [["s", 0]] });
  assert.equal(await done, 0);
  const lines = out.trim().split("\n");
  assert.equal(lines[0], "CHOSEN: /engineer fix the dashboard revenue sum");
  assert.match(lines[1], /^EVIDENCE: /);
  const packetFile = lines[1].slice("EVIDENCE: ".length);
  assert.deepEqual(parseBundle(fs.readFileSync(packetFile, "utf8")).claims.map((c) => c.id), ["pre-discount", "stored-net"]);

  assert.equal(run("packet", book, "1", "pre-discount,stored-net"), `EVIDENCE: ${packetFile}\n`, "the packet command writes the same packet");
  assert.throws(() => run("packet", book, "2", "refunds"), /There is no page 2/);
  assert.throws(() => run("packet", book, "1", "nope"), /Unknown claim/);
});
