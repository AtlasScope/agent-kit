// The skill page's text helpers keep every character of the source and give every heading a unique anchor.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { demote, withAnchors, splitLead } from "../components/skills/detail/prose.ts";

const { skills, kits } = createRequire(import.meta.url)("../content/generated.json");

test("splitting a description keeps all of it", () => {
  for (const d of [...skills, ...kits].map((x) => x.description)) {
    const [lead, more] = splitLead(d);
    assert.ok(d.startsWith(lead));
    assert.equal(more ? `${lead}${d.slice(lead.length, d.length - more.length)}${more}` : lead, d);
    if (more) assert.match(d.slice(lead.length, d.length - more.length), /^\s+$/);
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
    for (const r of ["install", "contents", "source", "prompts", "skill-doc"]) assert.ok(!ids.includes(r), `${s.name} reuses #${r}`);
  }
});
