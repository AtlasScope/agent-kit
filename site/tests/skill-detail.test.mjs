// The skill page's text helpers keep every character of the source and give every heading a unique anchor.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { demote, withAnchors, isReserved } from "../components/skills/detail/prose.ts";
import { describe, sentences, isAgentSentence } from "../lib/search.ts";

const { skills, kits } = createRequire(import.meta.url)("../content/generated.json");

test("describing a description keeps every sentence intact, and no lead is a trigger rule", () => {
  // lead, more and agent split the description's sentences between them: each sentence once, unchanged.
  const parts = (t) => sentences(t.trim()).filter(Boolean).sort();
  for (const x of [...skills, ...kits]) {
    const { lead, more, agent } = describe(x.description);
    assert.deepEqual([lead, more, agent].flatMap(parts).sort(), parts(x.description), x.name);
    assert.ok(!lead || !isAgentSentence(lead), `${x.name}: lead is a trigger rule`);
    assert.doesNotMatch(lead, /\b(the user explicitly|must not activate|invokes \/)/i, x.name);
  }
});

test("anchors change no text, are unique, and the page keeps one h1", () => {
  for (const s of skills) {
    const demoted = demote(s.bodyHtml);
    assert.doesNotMatch(demoted, /<h1[\s>]/, s.name);
    const { html, toc } = withAnchors(demoted);
    assert.equal(html.replace(/ id="[^"]*"/g, ""), demoted.replace(/ id="[^"]*"/g, ""), s.name);
    const ids = [...html.matchAll(/<h[23] id="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(new Set(ids).size, ids.length, `${s.name} has duplicate anchors`);
    for (const t of toc) assert.ok(ids.includes(t.id));
    for (const id of ids) assert.ok(!isReserved(id), `${s.name} reuses #${id}`);
  }
});

test("anchors avoid page ids, strip accents, and the lead skips abbreviations", () => {
  const { html } = withAnchors("<h3>Install panel</h3><h3>Résumé tips</h3><h3>Search results</h3>");
  assert.deepEqual([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]), ["s-install-panel", "resume-tips", "s-search-results"]);
  assert.deepEqual(describe("Use it for UI work, e.g. React or Vue. Covers the rest."), { lead: "Use it for UI work, e.g. React or Vue.", more: "Covers the rest.", agent: "" });
  assert.deepEqual(describe("Fix bugs. Then review the whole change carefully. More."), { lead: "Fix bugs. Then review the whole change carefully.", more: "More.", agent: "" });
  assert.deepEqual(describe("Use only when the user explicitly invokes /x. Does a thing for people. Ordinary talk must not activate it."),
    { lead: "Does a thing for people.", more: "", agent: "Use only when the user explicitly invokes /x. Ordinary talk must not activate it." });
  assert.equal(describe("When the user wants copy. For email, see emails.").lead, "");
});

test("trigger rules need a request from the user; a short lead only takes the sentence written after it", () => {
  assert.equal(isAgentSentence("When the user's build fails, it explains the error and proposes a fix."), false);
  assert.equal(isAgentSentence("When the user wants a review, run it."), true);
  assert.equal(describe("Fix bugs. Use only when the user invokes /x. Covers the whole repo safely.").lead, "Fix bugs.");
  assert.equal(describe("Fix bugs. Covers the whole repo safely.").lead, "Fix bugs. Covers the whole repo safely.");
});

test("a description that is all trigger rules still gets a purpose line", () => {
  const cro = skills.find((s) => s.name === "cro");
  const d = describe(cro.description);
  assert.equal(d.lead, "");
  assert.match(d.fallback, /^Optimize, improve, or increase conversions/);
  assert.equal(describe("When the user wants X. For Y, see z.").fallback, undefined);
});
