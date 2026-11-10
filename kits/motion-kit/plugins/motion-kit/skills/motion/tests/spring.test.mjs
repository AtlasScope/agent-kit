import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "../scripts/spring.mjs");
const spring = (...a) => JSON.parse(execFileSync(process.execPath, [script, "--json", ...a], { encoding: "utf8" }));

test("no bounce is critically damped and never passes the target", () => {
  const s = spring("--duration", "0.4", "--bounce", "0");
  assert.equal(s.overshootPercent, 0);
  assert.equal(s.damping, Math.round(2 * Math.sqrt(s.stiffness) * 10) / 10, "damping equals 2√stiffness");
  const stops = s.css.easing.slice(7, -1).split(", ").map(Number);
  assert.equal(stops[0], 0); assert.equal(stops.at(-1), 1);
  assert.ok(stops.every((v, i) => i === 0 || v >= stops[i - 1]), "position only rises");
});

test("bounce overshoots, and more bounce overshoots more", () => {
  const a = spring("--duration", "0.4", "--bounce", "0.2"), b = spring("--duration", "0.4", "--bounce", "0.4");
  assert.ok(a.overshootPercent > 0 && b.overshootPercent > a.overshootPercent);
  assert.equal(a.stiffness, b.stiffness, "bounce changes damping only");
});

test("a shorter duration is a stiffer spring that settles sooner", () => {
  const fast = spring("--duration", "0.2"), slow = spring("--duration", "0.6");
  assert.ok(fast.stiffness > slow.stiffness && fast.settleMs < slow.settleMs);
});

test("the Motion output is physical values, not Motion's differently scaled visualDuration", () => {
  const s = spring("--duration", "0.4", "--bounce", "0");
  assert.equal(s.motion, '{ type: "spring", stiffness: 246.7, damping: 31.4, mass: 1 }');
  assert.ok(!JSON.stringify(s).includes("visualDuration"));
});

test("values outside the range are refused", () => {
  assert.equal(spawnSync(process.execPath, [script, "--bounce", "2"]).status, 2);
});
