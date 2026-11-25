// Search benchmark: plain-language queries and vague or misleading ones, run against the real built content.
// Each query lists the results that genuinely answer it; one of them must be in the top three. "s:" marks a
// skill, anything else is a prompt slug. When a query fails, fix the ranking or the synonyms in lib/search.ts,
// not the expectation, unless the expectation was wrong.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { makeSearch, promptDoc, skillDoc, isAgentSentence, INTENTS } from "../lib/search.ts";

const data = JSON.parse(fs.readFileSync(new URL("../content/generated.json", import.meta.url), "utf8"));
// Retired entries keep their pages but leave search (lib/content.ts), so the benchmark runs on what the site searches.
const listed = data.prompts.filter((p) => !p.replacedBy);
const search = makeSearch(listed, data.skills);
const key = (r) => (r.kind === "skill" ? "s:" : "") + r.ref;

import { PLAIN, VAGUE } from "./search-cases.mjs";

// A retired entry never comes back from search, so an answer or a synonym row naming one can never count.
const slugs = new Set([...listed.map((p) => p.slug), ...data.skills.map((s) => "s:" + s.name)]);
test("every expected answer and synonym target is in search", () => {
  for (const [q, ok] of [...PLAIN, ...VAGUE]) for (const k of ok) assert.ok(slugs.has(k), `${q}: no listed result ${k}`);
  for (const [re, refs] of INTENTS) for (const k of refs) assert.ok(slugs.has(k), `${re}: no listed result ${k}`);
});

// What find and the palette show under each title: a real line for every prompt, and for a skill the line written
// for a person, never one of its trigger rules.
test("every result has a summary, and no skill's summary is a trigger rule", () => {
  for (const d of [...listed.map(promptDoc), ...data.skills.map(skillDoc)]) {
    assert.ok(d.summary.trim(), `${key(d)} has no summary`);
    if (d.kind === "skill") assert.ok(!isAgentSentence(d.summary) && !/\b(explicitly invokes|must not activate)\b/i.test(d.summary), `${key(d)}: ${d.summary}`);
  }
});

test("Keen leads its own jobs", () => {
  for (const q of ["compare design alternatives", "make my page look better", "an original design direction"]) assert.equal(key(search(q, 1)[0]), "s:keen", q);
});

for (const [name, set] of [["plain", PLAIN], ["vague", VAGUE]]) {
  test(`${name} queries put a right answer in the top three`, () => {
    const misses = [];
    for (const [q, ok] of set) {
      const top = search(q, 3).map(key);
      if (!top.some((k) => ok.includes(k))) misses.push(`"${q}" → ${top.join(", ") || "nothing"}`);
    }
    assert.deepEqual(misses, []);
  });
}

test("exact ids, commands and skill names still come first", () => {
  for (const [q, want] of [["PG02", "find-data-that-is-internally-consistent-but-wrong"], ["/design", "design"], ["ux-writing", "s:ux-writing"], ["impeccable polish", "impeccable-polish"], ["tdd", "s:tdd"]]) {
    assert.equal(key(search(q, 1)[0]), want, q);
  }
});

// The two intent rows added for cost and duplicates, pinned exactly. /api/search and the MCP server's
// find tool both call this same search over the listed prompts (lib/content.ts), so these are the
// results /mcp returns. Before the rows, the top results were the /database router and
// find-where-write-logic-should-live, neither of which the benchmark above counts as an answer.
test("cost and duplicate queries lead with exactly these results", () => {
  // The first two are what the rows put there; anything after them comes from ordinary word matches.
  const two = (q) => search(q, 2).map(key);
  assert.deepEqual(two("database is too expensive"), ["find-the-true-sources-of-database-waste", "reduce-postgresql-resource-cost-rdbr04"]);
  assert.deepEqual(two("duplicate data in the database"), ["find-where-records-silently-change-identity", "two-systems-that-disagree"]);
  assert.deepEqual(two("the database bill doubled"), ["find-the-true-sources-of-database-waste", "reduce-postgresql-resource-cost-rdbr04"]);
});
