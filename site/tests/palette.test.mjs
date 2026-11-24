// Command palette logic: scope filters, title highlighting and the Recent list. The palette ranks with the same
// rank() as /api/search, so the plain and vague benchmarks in search.test.mjs hold for it too; this file checks
// that adding kits, fixes and pages to the documents doesn't push the right prompt or skill out of reach.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { promptDoc, skillDoc } from "../lib/search.ts";
import { find, marks, pushRecent, keyOf, RECENT_MAX } from "../lib/palette.ts";
import { PLAIN, VAGUE } from "./search.test.mjs";

const data = JSON.parse(fs.readFileSync(new URL("../content/generated.json", import.meta.url), "utf8"));
const lc = (...xs) => xs.flat(2).filter(Boolean).join(" ").toLowerCase();
const page = (ref, title, aka = "") => ({ kind: "page", ref, title, summary: "", href: `/${ref}`, meta: "Page", fields: [[ref, 60], [lc(title), 40], [lc(aka), 25], ["", 10]] });
const entries = [
  page("install", "Install Agent Kit", "setup add plugin marketplace"), page("fix", "Fix a problem", "symptom broken debug"), page("kits", "Kits", "plugins bundles"),
  ...data.kits.map((k) => ({ kind: "kit", ref: k.name, title: k.title, summary: k.description, href: `/kits/${k.name}`, meta: "Kit",
    fields: [[k.name, 60], [lc(k.name.replace(/-/g, " ")), 40], ["kit plugin", 25], [lc(k.description), 10], [lc(k.skills), 3]] })),
  ...data.fixes.map((f) => ({ kind: "fix", ref: f.slug, title: f.title, summary: "", href: `/fix/${f.slug}`, meta: "Fix",
    fields: [[f.slug, 60], [lc(f.title), 40], [f.scope === "database" ? "database postgresql postgres" : "app", 25], ["fix problem symptom", 3]] })),
  ...data.prompts.filter((p) => !p.replacedBy).map((p) => ({ ...promptDoc(p), href: `/prompts/${p.slug}`, meta: "" })),
  ...data.skills.map((s) => ({ ...skillDoc(s), href: `/skills/${s.name}`, meta: "" })),
];
const key = (r) => (r.kind === "skill" ? "s:" : r.kind === "prompt" ? "" : r.kind + ":") + r.ref;

test("the benchmark still finds a right answer among the first five palette results", () => {
  const misses = [];
  for (const [q, ok] of [...PLAIN, ...VAGUE]) {
    const top = find(entries, q, "all", 5).map(key);
    if (!top.some((k) => ok.includes(k))) misses.push(`"${q}" → ${top.join(", ")}`);
  }
  assert.deepEqual(misses, []);
});

test("names of pages and kits land on them", () => {
  for (const [q, want] of [["install", "page:install"], ["kits", "page:kits"], ["design kit", "kit:design-kit"], ["motion-kit", "kit:motion-kit"], ["/design", "design"], ["tdd", "s:tdd"]]) {
    assert.equal(key(find(entries, q, "all", 1)[0]), want, q);
  }
});

test("a fix page is found by its symptom", () => {
  const f = data.fixes[0];
  assert.ok(find(entries, f.title, "all", 3).some((e) => e.kind === "fix" && e.ref === f.slug), f.title);
});

test("scopes keep to their kinds", () => {
  for (const [scope, kinds] of [["prompt", ["prompt", "area"]], ["skill", ["skill"]], ["kit", ["kit"]], ["fix", ["fix"]]]) {
    const r = find(entries, "design", scope);
    assert.ok(r.every((e) => kinds.includes(e.kind)), scope);
  }
  assert.ok(find(entries, "database", "fix").length > 0);
  assert.equal(find(entries, "", "all").length, 0);
});

test("marks underline whole-word starts, merged and in order", () => {
  assert.deepEqual(marks("Feels right on a phone", "phone right"), [[6, 11], [17, 22]]);
  assert.deepEqual(marks("ux-writing", "writing"), [[3, 10]]);
  assert.deepEqual(marks("Two apps", "app"), [[4, 8]]);
  assert.deepEqual(marks("apple", "app"), []);
  assert.deepEqual(marks("Grapple", "app"), []);
  assert.deepEqual(marks("Anything", "the"), []);
});

test("Recent keeps the newest first, once each, up to the limit", () => {
  let r = [];
  for (let i = 0; i < RECENT_MAX + 3; i++) r = pushRecent(r, { kind: "prompt", ref: "p" + i });
  assert.equal(r.length, RECENT_MAX);
  assert.equal(r[0].ref, "p" + (RECENT_MAX + 2));
  r = pushRecent(r, { kind: "prompt", ref: "p" + (RECENT_MAX + 0) });
  assert.equal(r[0].ref, "p" + RECENT_MAX);
  assert.equal(new Set(r.map(keyOf)).size, r.length);
});
