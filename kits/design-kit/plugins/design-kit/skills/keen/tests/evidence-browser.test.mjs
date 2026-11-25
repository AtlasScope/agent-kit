// The evidence on a real page, in a real browser: open a claim from the step that rests on it, filter, tick
// claims and download a packet, then press Start and see the packet reach the waiting agent.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { addPage, serve, wait } from "../scripts/worksheet.mjs";
import { evidencePacket } from "../scripts/evidence.mjs";
import { bundle, evidencePage } from "./evidence-fixture.mjs";
import { browserSkip, launch } from "./browser.mjs";

test("in a browser, a person can inspect the evidence, download a packet and start a step that rests on it", { skip: browserSkip }, async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "keen-evb-"));
  addPage(dir, evidencePage());
  const s = await serve(dir);
  t.after(() => s.close());
  const browser = await launch();
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(s.url);

  const box = page.locator("[data-ev-box]");
  assert.equal(await box.evaluate((d) => d.open), false, "the evidence starts collapsed");
  await page.locator('[data-step-card="0"] [data-jump="pre-discount"]').click();
  const claim = page.locator('[data-claim="pre-discount"]');
  assert.equal(await box.evaluate((d) => d.open), true, "a step's claim opens the evidence");
  assert.equal(await claim.locator(":scope > details").evaluate((d) => d.open), true, "and that claim");
  assert.deepEqual(await claim.locator(".glabel").allInnerTexts(), ["SUPPORTS 1", "CONTEXT 1"]);

  await page.selectOption("[data-ev-subject]", "orders-total");
  assert.equal(await page.locator("[data-ev-count]").innerText(), "Showing 3 of 4");
  assert.equal(await page.locator('[data-claim="test-passes"]').isHidden(), true);
  await page.selectOption("[data-ev-subject]", "");

  await page.locator('[data-tick="refunds"]').check();
  await page.locator('[data-tick="stored-net"]').check();
  const button = page.locator("[data-packet]");
  assert.equal(await button.innerText(), "Download packet (2 claims)");
  const [download] = await Promise.all([page.waitForEvent("download"), button.click()]);
  const packet = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
  assert.deepEqual(packet, evidencePacket(bundle(), ["stored-net", "refunds"]), "the download is the same packet the agent would get");
  assert.equal(download.suggestedFilename(), "revenue-gap-packet.json");
  assert.ok(!JSON.stringify(packet).includes(s.token));

  const waiting = wait(dir, { minutes: 1 });
  await page.waitForFunction(() => document.getElementById("state").dataset.is === "listening");
  await page.locator('[data-add="0"]').click();
  await page.locator("#start").click();
  const chosen = await waiting;
  assert.deepEqual([...chosen], ["/engineer fix the dashboard revenue sum"]);
  assert.deepEqual(JSON.parse(fs.readFileSync(chosen.evidence[0], "utf8")).claims.map((c) => c.id), ["pre-discount", "stored-net"]);
  await page.locator("#status", { hasText: "The evidence it rests on goes with it." }).waitFor({ timeout: 5000 });
  assert.deepEqual(errors, []);
});
