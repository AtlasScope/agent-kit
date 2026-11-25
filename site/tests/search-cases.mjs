// Search benchmark cases, shared by search.test.mjs (the site and MCP search) and palette.test.mjs. Each query
// lists the results that genuinely answer it; "s:" marks a skill, anything else is a listed prompt's slug.
export const PLAIN = [
  ["my app is slow", ["slowest-journeys-end-to-end", "diagnosing-bugs", "s:diagnosing-bugs"]],
  ["the page looks cramped on a phone", ["feels-right-on-a-phone", "design", "s:design", "impeccable-adapt"]],
  ["numbers in the database are wrong", ["is-the-data-actually-right-rdbr01", "where-did-this-number-come-from", "s:database"]],
  ["check accessibility", ["web-design-guidelines", "impeccable-audit", "pre-ship-check"]],
  ["write better error messages", ["ux-writing", "s:ux-writing"]],
  ["review my pull request", ["code-review", "differential-review-diff-review"]],
  ["plan a new feature", ["spec-without-the-interview", "grill-me", "s:grill-me", "s:to-questionnaire"]],
  ["code is too complicated", ["s:improve-codebase-architecture", "improve-codebase-architecture", "layers-that-dont-earn-their-keep", "simplify", "s:codebase-design"]],
  ["security holes", ["security-review", "outside-input-reaching-sensitive-actions", "security-checks-that-fail-open"]],
  ["tests pass but bugs still ship", ["what-the-tests-really-prove"]],
  ["deploy broke production", ["ship-or-recover-safely-rdbr05", "why-production-might-not-match-main"]],
  ["landing page", ["new-landing-page", "landing-page-that-converts"]],
  ["make it look less like AI", ["it-looks-ai-generated", "interface-design-design-deslop", "stop-slop", "s:stop-slop"]],
  ["duplicate data in the database", ["two-systems-that-disagree", "find-where-records-silently-change-identity", "s:database"]],
  ["is this migration safe", ["database-changes-during-a-deploy", "ship-or-recover-safely-rdbr05"]],
  ["animations feel janky", ["s:animation-performance", "animation-performance", "s:improve-animations", "improve-animations"]],
  ["make the buttons clearer", ["impeccable-clarify", "ux-writing", "s:ux-writing"]],
  ["database is too expensive", ["reduce-postgresql-resource-cost-rdbr04", "find-the-true-sources-of-database-waste", "what-breaks-at-ten-times-the-size"]],
  ["production doesn't match main", ["why-production-might-not-match-main", "settings-that-differ-in-production"]],
  ["memory leak", ["memory-that-keeps-growing"]],
  // Keen: an original direction, built alternatives compared side by side, and a screen made better.
  ["compare design alternatives", ["s:keen", "fix-a-screen-that-feels-off", "s:prototype", "prototype", "impeccable-generate"]],
  ["compare alternatives of my interface", ["s:keen", "fix-a-screen-that-feels-off", "s:prototype", "prototype", "impeccable-generate"]],
  ["make my page look better", ["s:keen", "fix-a-screen-that-feels-off", "design", "s:design", "this-page-kind-of-stinks", "impeccable-critique", "impeccable-polish", "hierarchy-fix-in-an-hour"]],
  ["an original design direction", ["s:keen", "design-a-new-screen-or-product", "interface-design", "example-skills-frontend-design", "s:hallmark"]],
  // Engineer: what a change reaches, and proof that a fix worked.
  ["what will this change break", ["s:engineer", "engineer", "who-notices-this-change", "differential-review-diff-review", "walk-me-through-what-changed-before-i-merge", "before-you-ship-a-change"]],
  ["prove the fix worked", ["check-it-independently", "reproduce-measure-prove", "s:engineer", "engineer"]],
  // Database: figures that disagree.
  ["two reports show different totals", ["two-systems-that-disagree", "meaning-drift-across-the-stack", "find-data-that-is-internally-consistent-but-wrong", "the-numbers-look-wrong", "s:database", "database"]],
  ["why does this total not match", ["the-numbers-look-wrong", "where-did-this-number-come-from", "find-data-that-is-internally-consistent-but-wrong", "missing-vs-zero-vs-stale", "is-the-data-actually-right-rdbr01", "s:database", "database"]],
];

// Vague or misleading: the answer should be a router or the broad starting point, not a random match.
export const VAGUE = [
  ["it doesn't work", ["engineer", "s:engineer", "diagnosing-bugs", "s:diagnosing-bugs"]],
  ["make it better", ["design", "s:design", "engineer", "s:engineer", "this-page-kind-of-stinks"]],
  ["help", ["engineer", "s:engineer", "design", "s:design", "s:recommend", "recommend"]],
  ["something is off with the data", ["is-the-data-actually-right-rdbr01", "s:database", "database", "make-this-database-easier-to-trust-and-operate", "find-data-that-is-internally-consistent-but-wrong"]],
  ["fast", ["slowest-journeys-end-to-end", "s:animation-performance", "impeccable-optimize"]],
  ["users leave", ["people-sign-up-and-drift-away", "improve-retention", "s:improve-retention"]],
  ["bad design", ["design", "s:design", "this-page-kind-of-stinks", "impeccable-critique"]],
  ["ai", ["it-looks-ai-generated", "write-prose-that-doesnt-sound-like-ai"]],
  ["fix", ["engineer", "s:engineer", "design", "s:design", "diagnosing-bugs", "s:diagnosing-bugs", "s:fix-writing", "fix-writing"]],
  ["page looks bad", ["this-page-kind-of-stinks", "design", "s:design", "impeccable-critique"]],
];
