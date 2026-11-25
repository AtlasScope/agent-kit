// A real browser for the tests that need one, when Playwright is on this machine (MOTION_PLAYWRIGHT_DIR,
// NODE_PATH or the global modules). KEEN_REQUIRE_BROWSER=1 (set in CI) turns a missing Playwright into a
// failure, and a browser that will not launch always fails: a test that cannot look must never pass as if it had.
import assert from "node:assert/strict";
import path from "node:path";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";

function findPlaywright() {
  let globalRoot = "";
  try { globalRoot = execSync("npm root -g", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch { /* no npm */ }
  const bases = [process.env.MOTION_PLAYWRIGHT_DIR, ...(process.env.NODE_PATH || "").split(path.delimiter), globalRoot, path.resolve(process.execPath, "../../lib/node_modules"), path.resolve(process.execPath, "../node_modules")].filter(Boolean);
  for (const base of bases) for (const dir of [path.join(base, "node_modules", "playwright"), path.join(base, "playwright")]) {
    try { return createRequire(path.join(dir, "package.json"))(dir); } catch { /* not here */ }
  }
  return null;
}
const pw = findPlaywright();
const required = process.env.KEEN_REQUIRE_BROWSER === "1";
export const browserSkip = pw || required ? false : "Playwright is not available on this machine (set KEEN_REQUIRE_BROWSER=1 to make this a failure)";

export async function launch() {
  assert.ok(pw, "KEEN_REQUIRE_BROWSER=1 but Playwright was not found");
  // Playwright's own browser first, then an installed Chrome or Edge.
  const errors = [];
  for (const opts of [{}, { channel: "chrome" }, { channel: "msedge" }]) {
    try { return await pw.chromium.launch(opts); } catch (e) { errors.push(`${opts.channel || "bundled"}: ${String(e.message).split("\n")[0]}`); }
  }
  assert.fail(`Playwright is installed but no browser launched:\n${errors.join("\n")}`);
}
