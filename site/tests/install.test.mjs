// Install paths: no tab may stop at registering the marketplace, which installs nothing.
import { test } from "node:test";
import assert from "node:assert/strict";
import { AGENTS } from "../lib/site.ts";

test("every agent has at least one step and a way to check it worked", () => {
  for (const a of AGENTS) {
    assert.ok(a.steps.length > 0, `${a.label} has no steps`);
    assert.equal(a.cmd, a.steps[0]);
    assert.ok(a.check.trim(), `${a.label} has no check`);
  }
});

test("the plugin agents install every kit in the catalog", async () => {
  const { kits } = (await import("node:module")).createRequire(import.meta.url)("../content/generated.json");
  for (const id of ["claude", "codex"]) {
    const a = AGENTS.find((x) => x.id === id);
    for (const k of kits) assert.ok(a.steps.some((s) => s.endsWith(` ${k.name}@agent-kit`)), `${a.label} does not install ${k.name}`);
  }
});

test("a marketplace step is always followed by an install step", () => {
  for (const a of AGENTS) a.steps.forEach((s, i) => {
    if (/marketplace add/.test(s)) assert.match(a.steps[i + 1] || "", /plugin (install|add) \S+@agent-kit/, `${a.label} stops after registering the marketplace`);
  });
});
