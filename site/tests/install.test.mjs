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

test("a marketplace step is always followed by an install step", () => {
  for (const a of AGENTS) a.steps.forEach((s, i) => {
    if (/marketplace add/.test(s)) assert.match(a.steps[i + 1] || "", /plugin (install|add) \S+@agent-kit/, `${a.label} stops after registering the marketplace`);
  });
});
