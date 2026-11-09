// Search benchmark: 20 plain-language queries and 10 vague or misleading ones, run against the real
// built content. Each query lists the results that genuinely answer it; one of them must be in the top
// three. "s:" marks a skill, anything else is a prompt slug. When a query fails, fix the ranking or the
// synonyms in lib/search.ts, not the expectation, unless the expectation was wrong.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { makeSearch } from "../lib/search.ts";

const data = JSON.parse(fs.readFileSync(new URL("../content/generated.json", import.meta.url), "utf8"));
const search = makeSearch(data.prompts, data.skills);
const key = (r) => (r.kind === "skill" ? "s:" : "") + r.ref;

export const PLAIN = [
  ["my app is slow", ["slowest-journeys-end-to-end", "diagnosing-bugs", "s:diagnosing-bugs", "one-slow-step-that-blocks-the-rest"]],
  ["the page looks cramped on a phone", ["feels-right-on-a-phone", "design", "s:design", "impeccable-adapt"]],
  ["numbers in the database are wrong", ["can-we-independently-prove-these-numbers", "is-the-data-actually-right", "where-did-this-number-come-from", "s:database"]],
  ["check accessibility", ["web-design-guidelines", "impeccable-audit", "pre-ship-check"]],
  ["write better error messages", ["ux-writing", "s:ux-writing"]],
  ["review my pull request", ["code-review", "differential-review-diff-review"]],
  ["plan a new feature", ["spec-without-the-interview", "grill-me", "s:grill-me", "s:to-questionnaire"]],
  ["code is too complicated", ["s:improve-codebase-architecture", "improve-codebase-architecture", "layers-that-dont-earn-their-keep", "simplify", "s:codebase-design"]],
  ["security holes", ["security-review", "outside-input-reaching-sensitive-actions", "security-checks-that-fail-open"]],
  ["tests pass but bugs still ship", ["unit-tests-that-give-false-comfort", "tests-that-cant-fail", "what-the-tests-really-prove"]],
  ["deploy broke production", ["ship-or-recover-safely", "why-production-might-not-match-main"]],
  ["landing page", ["new-landing-page", "landing-page-that-converts"]],
  ["make it look less like AI", ["it-looks-ai-generated", "interface-design-design-deslop", "stop-slop", "s:stop-slop"]],
  ["duplicate data in the database", ["are-we-storing-the-same-truth-multiple-times", "find-where-records-silently-change-identity", "s:database"]],
  ["is this migration safe", ["are-our-database-changes-safe-before-we-merge", "database-changes-during-a-deploy", "ship-or-recover-safely"]],
  ["animations feel janky", ["s:animation-performance", "animation-performance", "s:improve-animations", "improve-animations"]],
  ["make the buttons clearer", ["impeccable-clarify", "ux-writing", "s:ux-writing"]],
  ["database is too expensive", ["reduce-postgresql-resource-cost", "find-the-true-sources-of-database-waste", "what-will-become-expensive-as-the-database-grows"]],
  ["production doesn't match main", ["why-production-might-not-match-main", "settings-that-differ-in-production"]],
  ["memory leak", ["memory-that-keeps-growing", "timers-and-connections-nobody-closes"]],
];

// Vague or misleading: the answer should be a router or the broad starting point, not a random match.
export const VAGUE = [
  ["it doesn't work", ["engineer", "s:engineer", "diagnosing-bugs", "s:diagnosing-bugs"]],
  ["make it better", ["design", "s:design", "engineer", "s:engineer", "this-page-kind-of-stinks"]],
  ["help", ["engineer", "s:engineer", "design", "s:design", "s:recommend", "recommend"]],
  ["something is off with the data", ["is-the-data-actually-right", "s:database", "database", "make-this-database-easier-to-trust-and-operate", "find-data-that-is-internally-consistent-but-wrong"]],
  ["fast", ["slowest-journeys-end-to-end", "s:animation-performance", "impeccable-optimize", "one-slow-step-that-blocks-the-rest"]],
  ["users leave", ["people-sign-up-and-drift-away", "improve-retention", "s:improve-retention"]],
  ["bad design", ["design", "s:design", "this-page-kind-of-stinks", "impeccable-critique"]],
  ["ai", ["it-looks-ai-generated", "write-prose-that-doesnt-sound-like-ai"]],
  ["fix", ["engineer", "s:engineer", "design", "s:design", "diagnosing-bugs", "s:diagnosing-bugs", "s:fix-writing", "fix-writing"]],
  ["page looks bad", ["this-page-kind-of-stinks", "design", "s:design", "impeccable-critique"]],
];

const slugs = new Set([...data.prompts.map((p) => p.slug), ...data.skills.map((s) => "s:" + s.name)]);
test("every expected answer exists", () => {
  for (const [q, ok] of [...PLAIN, ...VAGUE]) for (const k of ok) assert.ok(slugs.has(k), `${q}: no such result ${k}`);
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
  for (const [q, want] of [["PG01", "can-we-independently-prove-these-numbers"], ["/design", "design"], ["ux-writing", "s:ux-writing"], ["impeccable polish", "impeccable-polish"], ["tdd", "s:tdd"]]) {
    assert.equal(key(search(q, 1)[0]), want, q);
  }
});
