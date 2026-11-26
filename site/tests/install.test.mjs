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

test("the message Install copies names the repo and the agent-readable steps", async () => {
  const { INSTALL_MESSAGE, SITE } = await import("../lib/site.ts");
  assert.ok(INSTALL_MESSAGE.includes(SITE.repo));
  assert.ok(INSTALL_MESSAGE.includes(`${SITE.url}/install.md`));
  assert.ok(!INSTALL_MESSAGE.includes("\n"), "one line, so it pastes cleanly anywhere");
});

test("the agent-readable install page has each agent's exact commands and nothing from an untabbed agent", async () => {
  const { installMd } = await import("../lib/site.ts");
  const md = installMd();
  for (const id of ["claude", "codex", "cursor", "any"]) for (const s of AGENTS.find((a) => a.id === id).steps) assert.ok(md.includes(s), `install.md is missing: ${s}`);
  assert.ok(!md.includes("gemini-cli") && !md.includes("github-copilot"));
  assert.match(md, /Do not run commands from any other section/);
});

test("signed in follows Clerk's __client_uat cookie, which is 0 when signed out", async () => {
  const { signedIn, SIGNED_IN_HINT } = await import("../lib/auth-hint.ts");
  assert.equal(signedIn(""), false);
  assert.equal(signedIn("__client_uat=0"), false);
  assert.equal(signedIn("a=1; __client_uat_Xy12=0; b=2"), false);
  assert.equal(signedIn("__client_uat=1764000000"), true);
  assert.equal(signedIn("a=1; __client_uat_Xy12=1764000000"), true);
  assert.equal(signedIn("x__client_uat=1764000000"), false, "only the cookie itself");
  // The before-paint hint uses the same rule.
  assert.ok(SIGNED_IN_HINT.includes(String(/(?:^|; )__client_uat[^=]*=(?!0(?:;|$))[^;]/)));
});
