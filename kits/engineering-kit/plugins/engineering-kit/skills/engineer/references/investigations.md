# Investigations

Generated from `library/library.json` by `kits/engineering-kit/scripts/build_references.mjs`; do not edit by hand.

Each one is a prompt to paste into a fresh agent session. `mode` is the default wrapper from start-here.md (read: read-only; repro: may add a failing test or script). `split` means run it as two passes, find then verify, rather than one long session.

## Architecture and hidden complexity

Spots where the way the code is built invites bugs: status spread across many places, words that change meaning between layers, and layers that cost more than they help.

### A01 Status hidden in a pile of flags

```text
Find implicit state machines where a feature's lifecycle is scattered across separate boolean flags, conditionals, and UI checks instead of one explicit status. Identify reachable invalid combinations and unclear transitions.
```

- Finds: Finds features whose real status is spread across a pile of yes/no flags, so combinations that should be impossible can happen.
- Evidence to ask for: For each affected feature, its flags and transitions (file:line), plus at least one concrete reachable invalid combination showing how a user or system event produces it.
- Skip when: Features already use a single explicit status enum checked in one place.
- Watch for: Do not flag every boolean field as a state machine. Report only flag combinations that are actually reachable and cause bugs.
- Mode: read, split, wide scope. Needs: Repository access only.
- Skills: `/improve-codebase-architecture`, `/grill-me`
- Related: `A06`, `G06`, `R03`

### A02 Meaning drift across the stack

```text
Trace one core business concept end to end across the UI, API, database schema, and background jobs. If I did not name a specific concept, pick the single most central entity in this product and state which one you chose. Find every place its meaning, fields, nullability, or validation rules shift between layers.
```

- Finds: Shows where one word (a task, a fund, a run) means slightly different things in different parts of the app.
- Evidence to ask for: One table for that concept listing each layer, its name/type/column, its validation rules, and file:line, with every mismatch clearly flagged.
- Skip when: A simple concept that exists in only one layer of the app.
- Watch for: Tracing five concepts at once produces a vague essay. Keep the trace tightly focused on one concept.
- Mode: read, split, wide scope. Needs: Repository access and read-only access to the database layout.
- Skills: `/grill-with-docs`, `/spec-to-code-compliance`
- Related: `D01`, `D03`, `G03`

### A03 Layers that don't earn their keep

```text
Find code abstractions that add indirection without real benefit: single-use wrappers, generic factories, deep inheritance, and pass-through utilities that make changes harder to follow than plain direct code. Separate dead weight from thin adapters that legitimately isolate an unstable third-party SDK or create a test boundary.
```

- Finds: Finds extra layers of code you could delete so the code, and the agents reading it, get simpler.
- Evidence to ask for: Each removal candidate (file:line), how many callers it has, what deleting it would inline or simplify, and which tests would update.
- Skip when: A small, direct codebase or one that just went through a cleanup pass.
- Watch for: Do not flag thin boundary wrappers around external payment, email, or AI SDKs as useless — those protect against vendor changes.
- Mode: read, single pass, wide scope. Needs: Repository access only.
- Skills: `/improve-codebase-architecture`, `/simplify`
- Related: `A05`, `M04`, `PG10`

### A04 Two systems that disagree

```text
Find places where the same fact is stored in more than one place — across database tables, derived columns, caches, browser storage, or external services like billing or search. For each pair, trace which copy is authoritative, how they stay in sync, what sequence of failures makes them diverge, and which copies actually earn their keep for speed or history.
```

- Finds: Finds data kept in two places (a saved copy and a table, the browser and the server) that can quietly disagree.
- Evidence to ask for: Each duplicated fact with its authoritative source and copies (file:line), how updates propagate, a concrete failure sequence that causes drift, and whether the extra copy should stay or be removed.
- Skip when: Every fact lives in one place, or caches are rebuilt cleanly on every read.
- Mode: read, split, wide scope. Needs: Repository and read-only database access.
- Skills: `/audit-context-building`
- Related: `R05`, `G06`, `D02`, `PG05`, `PG11`

### A05 Old design choices that now cost you

```text
Examine the codebase and git history for early architectural choices that were reasonable when the project started and now create measurable friction: recurring bugs, repeated workarounds, or slow feature work. Separate real operational liabilities from out-of-fashion tech preferences.
```

- Finds: Separates old design choices that now cost real time or bugs from ones that are only out of fashion.
- Evidence to ask for: Each architectural liability with its original rationale, concrete evidence of today's cost (repeated bug fixes, workarounds, slow paths, or commits), and the smallest practical path forward.
- Skip when: A brand-new codebase under a couple of months old with little change history.
- Mode: read, single pass, wide scope. Needs: Repository and its git history.
- Skills: `/improve-codebase-architecture`
- Related: `A03`, `P05`

### A06 Code that relies on lucky timing

```text
Find asynchronous operations whose correctness relies on events arriving in a lucky order without an explicit lock, sequence check, or state guard. Trace scheduling, retries, cancellation, and concurrent writes; reproduce the highest-risk case and propose the smallest enforceable contract.
```

- Finds: Finds code that only works because things usually happen in the right order.
- Evidence to ask for: Each assumed ordering, what real-world event can break it (retry, slow network, double click, webhook burst), and a reproducible case for the highest-risk bug.
- Skip when: Strictly sequential scripts with no concurrent requests, timers, webhooks, or background tasks.
- Mode: repro, split, wide scope. Needs: Repository; a way to run the code locally to reproduce the problem.
- Skills: `/diagnosing-bugs`
- Related: `R05`, `A01`, `G04`

### A07 Timers and connections nobody closes

```text
Map external side effects and resource lifecycles across this application: connections, subscriptions, listeners, timers, streams, cache entries and background workers. Find unclear ownership, incomplete cleanup and operations that outlive their intended scope. Prioritize evidenced leaks or correctness risks over stylistic patterns.
```

- Finds: Finds timers, listeners and connections that nobody clearly owns or shuts off.
- Evidence to ask for: Each resource with where it is created, who should release it, and the path where it is not released.
- Skip when: Short-lived scripts and one-off server functions that keep nothing running between calls.
- Mode: read, single pass, wide scope. Needs: Repository access; memory snapshots help confirm.
- Skills: `/audit-context-building`
- Related: `P07`, `R06`

## Explore



### AD07 Sign-up, sign-in, and locked-out users

```text
Trace the full account lifecycle in this application: sign-up, email verification, password sign-in, magic links, OAuth/social login, password reset, email change, session refresh and expiry, sign-out, role or team revocation, and account deletion. Look for ways a real person gets stuck or locked out (expired links with no resend button, case-sensitive email mismatches, OAuth colliding with an existing password account, redirect loops after sign-in, sessions dropping on refresh) and ways revoked users keep access (cached tokens, active sessions that survive password change or removal). Check both code and auth provider configuration where visible in the repo.
```

- Finds: Traces every way someone creates an account, signs in, resets a password, switches devices, or deletes an account, and finds where people can get locked out or keep access they shouldn't have.
- Evidence to ask for: A walkthrough of each account flow with file:line, every lockout or leftover-access failure found, and any auth provider settings that live outside the repo and need my check in a named dashboard.
- Skip when: A public tool or static site with no accounts or sign-in.
- Watch for: Agents test only the happy sign-in path. Trace duplicate emails across sign-in methods, expired tokens, and what happens to open browser tabs after a user is removed or changes their password.
- Mode: read, single pass, wide scope. Needs: Repository access.

## Architecture and hidden complexity

Spots where the way the code is built invites bugs: status spread across many places, words that change meaning between layers, and layers that cost more than they help.

### A08 Screens that fight how people work

```text
Map this product's pages, routes, and navigation against the real jobs users come to do. Look for pages that should merge, shrink into a tab or panel, or go away; competing menus pointing to the same destinations; and workflows users must piece together across multiple screens. State clearly whether the underlying page structure causes two or more of these issues; if not, keep the structure and recommend local fixes.
```

- Finds: Finds when confusing screens are a symptom of how the product is organised rather than a list of separate bugs.
- Evidence to ask for: A verdict per page (keep, merge, demote, or retire) with evidence, the two to five root causes behind user confusion, and today's site map beside the proposed one.
- Skip when: A tiny app with fewer than five screens, or a navigation redesign that just shipped with no user feedback yet.
- Watch for: Do not propose a full redesign for isolated screen bugs. Recommend structural changes only when one cause explains multiple problems.
- Mode: read, split, wide scope. Needs: Repository; the app running locally with test accounts for the browser checks.
- Skills: `/experience-architecture:diagnose`, `/experience-architecture:rethink`
- Related: `A05`, `R07`, `A02`

## Performance and scale

Where time and money go as the data grows. Every claim here needs a measurement before and after.

### P01 Slowest journeys, end to end

```text
Trace and measure the five slowest or heaviest user journeys from browser interaction to database response. Look for unnecessary network round trips, sequential waterfalls, slow queries, repeated work, heavy synchronous handlers blocking other requests, and quadratic loops over growing collections. Measure each step's share of total latency before ranking fixes.
```

- Finds: Shows where the seconds go on the paths people actually use.
- Evidence to ask for: A measured timing breakdown per journey (browser network timing, server timing, query plan, or event-loop delay) showing each step's share of total time, ranked by impact.
- Skip when: Every main flow already feels fast and server/database bills are flat.
- Watch for: Reading code statically guesses at latency and flags tiny loops that never matter. Require actual measurements at realistic data sizes before ranking anything.
- Mode: read, split, wide scope. Needs: Browser developer tools or Playwright recordings, server logs or timing data, and the database's query plan (EXPLAIN).
- Skills: `/diagnosing-bugs`
- Related: `P02`, `P03`, `M08`

### P02 Steps that wait for no reason

```text
Audit asynchronous hot paths for two opposite problems: (1) independent operations waiting sequentially when they could safely run in parallel without breaking ordering, rate limits, or database transaction boundaries, and (2) parallel fan-outs or queues running with no concurrency cap that could exhaust connection pools, memory, or external API limits at realistic scale.
```

- Finds: Finds steps that wait for each other to finish when they could run at the same time.
- Evidence to ask for: For each sequential chain, the current measured duration, why the steps are independent, and any shared transaction or rate limit to respect; for each unbounded fan-out, its maximum width on realistic data next to the downstream limit and a recommended cap.
- Skip when: Fast paths finishing in a few milliseconds, or fixed tiny lists with no external or database pressure.
- Watch for: Wrapping awaits in Promise.all breaks when calls share a single database transaction or hit a rate-limited API. Check transaction scopes, pool sizes, and vendor rate limits before recommending parallelism.
- Mode: read, single pass, narrow scope. Needs: Repository; a timing script to measure the result afterward.
- Skills: `/diagnosing-bugs`
- Related: `P09`, `A06`, `M08`

### P03 Queries that grow badly

```text
Find database queries whose execution cost grows disproportionately as rows, users, tenants, or relationships increase. Inspect query plans, missing or unused indexes, N+1 joins, unbounded pagination, and filtering done in application memory instead of the database.
```

- Finds: Finds the database queries that will be the first to slow down as tables grow.
- Evidence to ask for: Each suspect query (file:line), its EXPLAIN ANALYZE output (or query plan) at realistic row counts, the exact scaling bottleneck, and the proposed index or query rewrite. If a safe non-production copy exists, note whether the rewrite can be benchmarked there in a follow-up step.
- Skip when: Projects with only tiny, fixed-size tables (such as settings or short lookup lists).
- Mode: read, single pass, narrow scope. Needs: Read-only database access with EXPLAIN (the database's query plan). A Neon or Supabase branch copy for anything heavier.
- Related: `P01`, `P05`, `P06`, `PG13`

### P04 Work repeated for nothing

```text
Find expensive computations, queries, API calls, or UI renders that run repeatedly even though their inputs have not changed. Measure how often each runs and what it costs before considering caching, memoization, batching, or incremental updates.
```

- Finds: Finds work redone on every request or screen redraw when nothing it depends on changed.
- Evidence to ask for: Each repeated operation (file:line), how often it runs, how often its inputs actually change, its measured cost, and — if you recommend caching — exactly how and when that cache gets invalidated.
- Skip when: Operations that are already cheap, where caching would add stale-data bugs for negligible gain.
- Watch for: Every cache creates a second source of truth. Reject any caching proposal that cannot explain invalidation cleanly.
- Mode: read, single pass, wide scope. Needs: A profiler or request logs to count repeats.
- Related: `A04`, `P01`, `PG06`

### P05 What breaks at ten times the size

```text
Model what happens when this product's stored data and concurrent active users grow tenfold. Use real table counts, request rates, query plans, and hosting/database plan limits to identify the first bottlenecks that break or spike cost.
```

- Finds: Names the first thing to break if the project takes off, before it does.
- Evidence to ask for: Current baseline sizes and rates (marking anything estimated), projected 10x numbers, the exact ceiling each bottleneck hits (connection pool, query time, storage quota, rate limit, or plan tier), and the threshold at which you should actually fix it.
- Skip when: A personal tool or fixed-audience app with flat usage and no growth expected.
- Mode: read, single pass, wide scope. Needs: Database stats, hosting plan limits, current traffic numbers.
- Related: `P03`, `P09`

### P06 Loops that blow up with big data

```text
Identify potentially quadratic or worse operations in frequently used code paths, including nested joins in application memory, copy-on-every-iteration patterns and repeated scans. Determine realistic input sizes and benchmark the highest-impact candidates before changing their algorithms.
```

- Finds: Finds loops inside loops that are fine at 50 rows and painful at 50,000.
- Evidence to ask for: Each candidate with realistic input size and a benchmark at that size; ignore candidates whose real inputs stay small.
- Skip when: Code whose inputs are small and capped by design.
- Watch for: Static scanners flag nested loops over tiny arrays. Without real sizes the list is mostly noise.
- Mode: read, single pass, narrow scope. Needs: A speed-test setup. The experimental agent-complexity-optimizer scanner can suggest places to look.
- Related: `P03`, `M08`

### P07 Memory that keeps growing

```text
Investigate sustained memory growth and leaked resources across the browser and server: unbounded caches, unremoved event listeners, timers and intervals never cleared, unclosed database or network connections, leaked streams or subscriptions, detached DOM nodes, and retained closures or request payloads. Validate top suspects with repeatable growth checks or heap snapshots where available.
```

- Finds: Finds why a page or process gets slower or crashes the longer it runs.
- Evidence to ask for: Each leak or unclosed resource with where it is created (file:line), who should clean it up, the path where cleanup is skipped, and heap-snapshot or growth evidence for the top suspects.
- Skip when: Short-lived scripts or stateless functions with flat memory usage over time.
- Mode: read, single pass, narrow scope. Needs: Chrome DevTools memory snapshots or Node --inspect.
- Skills: `/diagnosing-bugs`
- Related: `A07`

### P08 One slow step that blocks the rest

```text
Find synchronous work performed in latency-sensitive asynchronous handlers, including filesystem operations, parsing, compression, large serialization and CPU-heavy transforms. Measure event-loop impact and identify safe offloading, batching or scheduling fixes.
```

- Finds: Finds one slow step that makes every other request wait in line behind it.
- Evidence to ask for: Event-loop delay or long-task measurements tied to the specific handler.
- Skip when: Background scripts where nothing else shares the process.
- Mode: read, single pass, narrow scope. Needs: Node profiler or the browser's Performance panel.
- Related: `P01`, `P04`

### P09 Parallel work with no limit

```text
Examine places where work is parallelized or queued without explicit limits. Find cases where a speed optimization could overwhelm rate limits, memory, connection pools or a downstream service; propose and test concurrency bounds with realistic load.
```

- Finds: Finds work run in parallel with no limit, which can swamp the database connections or an outside service.
- Evidence to ask for: Each fan-out with its maximum width at realistic input, the downstream limit, and a load test with a bound.
- Skip when: Parallel work over a fixed, small list.
- Mode: read, single pass, narrow scope. Needs: Repository; a load-testing script pointed at a non-production copy.
- Related: `P02`, `G04`

## Correctness and reliability

What happens when something runs twice, fails, times out or happens in the wrong order, and whether people can tell a stand-in value from the real one.

### R01 Safe to run twice?

```text
Find write operations, webhooks, imports, and user actions that cannot safely run twice or resume after an interruption. Examine duplicate requests, webhook retries, out-of-order arrivals, idempotency keys, unique constraints, and transaction boundaries. Do not assume an ON CONFLICT clause alone guarantees safe reruns; check side effects like emails, charges, and counters too.
```

- Finds: Finds actions that do damage when they run twice: double sends, double charges, duplicate rows.
- Evidence to ask for: Each unsafe operation (file:line), what triggers a retry or duplicate, what happens on a second run, and whether a key, constraint, or lock currently prevents damage.
- Skip when: Read-only apps that never write records, send messages, or charge cards.
- Mode: read, split, wide scope. Needs: Repository and read-only access to the database layout.
- Skills: `/diagnosing-bugs`
- Related: `R05`, `R06`, `D04`, `PG08`

### R02 Fallbacks that look like real data

```text
Trace every place the application quietly substitutes a default, zero, null, stale value, or empty list when a request, query, or calculation fails. Determine whether a user could mistake that fallback for valid, up-to-date information.
```

- Finds: Finds screens that show a confident zero or an empty list when the real answer is 'we could not load this'.
- Evidence to ask for: Each silent fallback with its trigger, what appears on screen, and whether anything alerts the user that loading failed.
- Skip when: Every error path already displays a clear error or unavailable state on screen.
- Mode: read, single pass, wide scope. Needs: Repository; the app running to see what users see.
- Skills: `/insecure-defaults:audit`
- Related: `D01`, `T05`, `S06`

### R03 Rules the data never enforces

```text
Identify critical business invariants this product assumes (such as non-negative balances, unique ownership, valid status combinations, or plan limits) that are enforced only in UI code or never enforced at all. Recommend the right enforcement layer (database constraint, schema validation, or server check) and write a test demonstrating how the top rule can be broken today.
```

- Finds: Finds the rules everyone assumes (one owner per task, no negative balance) that nothing actually checks.
- Evidence to ask for: Each unenforced rule, where the app assumes it (file:line), where it should be enforced, and a failing test proving it can be violated today.
- Skip when: Core rules are already enforced by database constraints and server-side checks.
- Mode: repro, single pass, wide scope. Needs: Repository; a test database or branch copy.
- Skills: `/property-based-testing`, `/tdd`
- Related: `A01`, `T02`

### R04 Dates, times and time zones

```text
Audit how this application handles dates and time: time zones, daylight saving transitions, day boundaries, expirations, scheduled jobs, client-versus-server clock skew, and historical date queries.
```

- Finds: Finds the date bugs that show up twice a year, at midnight, or in another time zone.
- Evidence to ask for: Each time-sensitive path with the time zone it assumes, plus a failing test at a daylight saving change and around midnight in both UTC and your users' primary time zone.
- Skip when: Features that never store, compare, schedule, or display dates or times.
- Mode: repro, single pass, wide scope. Needs: Repository; tests with the clock fixed to a set time.
- Skills: `/property-based-testing`
- Related: `D03`

### R05 Updates that overwrite each other

```text
Find race conditions and lost-update paths across concurrent UI edits, API calls, caches, webhooks, and background jobs. Prove real risks with a concrete reproduction instead of listing theoretical possibilities.
```

- Finds: Finds updates that overwrite newer data because two things wrote at once.
- Evidence to ask for: Each confirmed race (file:line) with a runnable test or script that reproduces the lost update.
- Skip when: Single-user records written by only one synchronous code path.
- Watch for: Agents list theoretical race conditions freely. Count only races backed by a concrete reproduction or an exact reachable sequence.
- Mode: repro, split, wide scope. Needs: Repository; a local or branch-copy database to reproduce the problem.
- Skills: `/diagnosing-bugs`
- Related: `A06`, `A04`, `R01`, `PG05`

### R06 Half-finished failures

```text
Trace error, timeout, and cancellation paths for database transactions, locks, file handles, temporary files, background jobs, and external network calls. Find paths that leave resources held open or data half-committed when something fails midway, and demonstrate the highest-risk case with controlled failure injection where practical.
```

- Finds: Finds what is left behind when something fails halfway.
- Evidence to ask for: Each failure path, what gets left half-committed or held open, and a reproduction for the highest-risk case.
- Skip when: Simple stateless endpoints or scripts that perform a single atomic read or write with no multi-step state.
- Mode: repro, single pass, wide scope. Needs: Repository; a way to force errors in tests.
- Skills: `/diagnosing-bugs`
- Related: `A07`, `R01`, `I04`

### R07 Lost place: Back, refresh and shared links

```text
Check whether this application preserves the user's place. In a local or staging browser (never production with real accounts), open lists, filters, tabs, modals, and detail records, then test Back, Forward, page refresh, opening links in a new tab, and opening copied URLs in a fresh session both signed out and as another user. Trace every lost filter, scroll jump, wiped draft, broken Back action, or wrong landing screen to the code that owns that state.
```

- Finds: Finds the everyday friction where Back closes the wrong thing, a filter resets, or a pasted link opens the wrong view.
- Evidence to ask for: Each tested journey (start, action, expected result, observed result) with the file:line owning the state and a clear PASS or FAIL verdict.
- Skip when: A simple static site with no filters, panels, drafts, or signed-in views.
- Watch for: Even ordinary page loads can trigger background writes in some apps. Run browser checks only against local development or safe staging test accounts.
- Mode: read, single pass, narrow scope. Needs: The app running locally or on staging with test accounts; Playwright, which the plugin looks for and asks before installing.
- Skills: `/experience-architecture:diagnose`, `/experience-architecture:verify`
- Related: `T01`, `A08`, `G06`

## Testing and security

What the tests really prove, and where input from outside can reach something sensitive.

### T01 Unit tests that give false comfort

```text
Find critical user journeys that have extensive unit-test coverage but insufficient evidence that they work end to end. Strengthen the smallest set of tests that closes the real gaps.
```

- Finds: Finds features whose automated checks all pass and that still break for real people.
- Evidence to ask for: Each journey with what the tests cover, what they skip (real auth, real DB, real browser), and the one added check.
- Skip when: User paths already covered by a browser test.
- Mode: repro, single pass, wide scope. Needs: Playwright or the in-app browser for the full start-to-finish check.
- Skills: `/tdd`
- Related: `T02`, `T06`, `I02`

### T02 Tests that can't fail

```text
Find tests that would continue passing if the underlying feature stopped working. Examine mocks, fixtures, assertions, and tests that merely reproduce implementation details.
```

- Finds: Finds tests that pass no matter what.
- Evidence to ask for: For each suspect test, break the feature on purpose and show the test still passes.
- Skip when: Brand-new test suites written before the code.
- Mode: repro, single pass, wide scope. Needs: Repository and the test runner.
- Skills: `/property-based-testing`, `/tdd`
- Related: `T06`, `T01`

### T03 Outside input reaching sensitive actions

```text
Trace every untrusted external input — forms, URL parameters, file uploads, headers, webhooks, and AI model outputs — from entry point to sensitive operations (database writes, auth changes, billing, file access, admin actions, outbound requests). Check for missing authorization or ownership checks, tenant isolation gaps, injection vectors, and unsafe parsing.
```

- Finds: Follows input from outsiders to the places it can do harm.
- Evidence to ask for: Each risky path listing its entry point, checks along the way, the sensitive operation reached, and the exact missing safeguard (file:line).
- Skip when: A completely static site with zero backend endpoints, forms, uploads, webhooks, or stored user data.
- Mode: read, split, wide scope. Needs: Repository access.
- Skills: `/security-review`, `/audit-context-building`, `/differential-review:diff-review`
- Related: `T05`, `S06`, `G03`

### T04 Risk from outside packages

```text
Audit dependency and CI supply-chain exposure: known security advisories matching installed versions, package install scripts, GitHub Actions or CI workflows triggered by untrusted pull requests, overly broad workflow permissions, and which jobs can read deployment secrets.
```

- Finds: Checks what a harmful outside package or pull request could reach.
- Evidence to ask for: Active advisories matched to installed versions, packages with lifecycle install scripts, workflow permission gaps (file:line), and a map of which CI jobs can access which secrets.
- Skip when: A zero-dependency repository with no automated CI or deployment workflows.
- Mode: read, single pass, narrow scope. Needs: The lockfile (exact package list), automated build workflow files, npm audit or the auditor skill.
- Skills: `/supply-chain-risk-auditor`, `/agentic-actions-auditor`, `/ci-optimizer:ci-check`
- Related: `I06`, `I03`

### T05 Security checks that fail open

```text
Audit every authentication, authorization, rate-limit, and webhook-signature check for fail-open behavior: cases where a missing environment variable, null user object, thrown exception, network timeout, or malformed request results in access being granted instead of denied.
```

- Finds: Finds security checks that let people in when something goes wrong.
- Evidence to ask for: Each security gate (file:line) and what happens on missing config, thrown error, and malformed input, backed by a code trace or safe test request.
- Skip when: A public static app with no authentication, permissions, private endpoints, or webhooks.
- Mode: read, single pass, narrow scope. Needs: Repository; the app running locally in demo mode.
- Skills: `/insecure-defaults:audit`, `/sharp-edges`
- Related: `S06`, `T03`, `R02`

### T06 What the tests really prove

```text
Audit the test suite covering this product's critical user journeys. Look for three failure modes: (1) heavy unit-test coverage that mocks away real auth, database, or browser behavior so broken integrations still pass, (2) assertions that test implementation details or cannot fail meaningfully when user behavior breaks, and (3) critical flows with no end-to-end check at all. For the single highest-risk gap, write one independent test that would catch a real user-facing regression.
```

- Finds: Asks what each test really proves, then adds one check that would catch a real break.
- Evidence to ask for: For each critical journey, what existing tests actually exercise versus what they mock or skip (file:line), any toothless tests found and why they pass on broken code, and the one added check for the top gap.
- Skip when: Every critical user flow is already covered by end-to-end checks that run against real storage and have caught real regressions.
- Watch for: Do not modify application code to "test the tests." Prove toothless assertions by tracing the mocked boundary or writing an independent test against the real requirement.
- Mode: repro, single pass, narrow scope. Needs: Repository and test runner.
- Skills: `/tdd`, `/property-based-testing`
- Related: `T02`, `T01`, `M06`

### S06 Settings that differ in production

```text
Audit configuration and environment variables across local development, CI, preview, and production. Find ambiguous fallbacks, test-mode switches that could stay on, fail-open permissions, and behavior that silently changes when a variable is unset. Check actual code and deployment config files instead of trusting README examples. Never print or expose secret values.
```

- Finds: Finds settings that behave differently in production than anyone expects.
- Evidence to ask for: A table of environment-sensitive settings (variable names only, never values), where each is read (file:line), its fallback when missing, and what breaks or shifts across environments.
- Skip when: A local-only tool with a single environment and no deployment settings.
- Watch for: Never print secret values in output or logs. Report only variable names, code paths, and whether a setting exists.
- Mode: read, single pass, narrow scope. Needs: Vercel settings list (names only, never values), automated build config, the code that reads each setting.
- Skills: `/insecure-defaults:audit`
- Related: `T05`, `I05`, `G02`

## Infrastructure and environment

The path from a merged change to the live site, what automated checks cost, and the computer the agents run on.

### I01 Duplicate tools and stale caches

```text
Inventory the development environment's browser runtimes, caches, SDKs, package managers, and duplicate installations. Identify obsolete or wasteful components, assess dependencies, and propose a safe cleanup.
```

- Finds: Finds disk space and confusion spent on duplicate developer tools and stale saved files on your computer.
- Evidence to ask for: Each component with size, version, what depends on it, and whether deleting it is safe and reversible.
- Skip when: When disk space is fine and builds are stable.
- Watch for: Treat every deletion as a proposal. Shared runtimes break other apps silently.
- Mode: read, single pass, narrow scope. Needs: A terminal on your computer.
- Related: `I07`

### I02 Why production might not match main

```text
Trace a code change from merge to live users: build steps, database migrations, deployment triggers, CDN or app caches, background workers, and mobile/client updates. Identify every point where a deploy step can silently skip, fail, or serve stale code without alerting anyone.
```

- Finds: Lists every way 'merged' can fail to mean 'live'.
- Evidence to ask for: The actual release pipeline step by step with its config files (file:line), and for each step how it can fail or stay stale silently.
- Skip when: You already mapped this pipeline recently and nothing in hosting, builds, or migrations changed since.
- Mode: read, single pass, narrow scope. Needs: Automated build and Vercel config, deployment history (read-only).
- Related: `G02`, `I05`, `PG15`

### I03 Check time that catches nothing

```text
Analyze CI and deployment workflows against the real failures they catch. Look for duplicated build/install steps, missing caches, redundant checks, and expensive jobs that add little confidence over faster checks.
```

- Finds: Finds paid automated-check minutes spent on checks that never catch anything.
- Evidence to ask for: Each CI job (file:line) with its typical duration, run frequency, whether recent runs caught real bugs (where run history is accessible), and the highest-impact speedup or cut.
- Skip when: CI runs finish in a minute or two and cost nothing.
- Mode: read, single pass, narrow scope. Needs: GitHub Actions run history via gh.
- Skills: `/ci-optimizer:ci-timings`, `/ci-optimizer:ci-check`
- Related: `T04`

### I04 Background jobs that hang or stop halfway

```text
Audit every scheduled job, cron task, and background worker for hangs, overlapping runs, partial updates, missing timeouts, unsafe retries, and deploy interruptions.
```

- Finds: Finds scheduled jobs and background workers that can hang, overlap or stop halfway.
- Evidence to ask for: Each job (file:line) with its schedule or trigger, timeout, lock/overlap protection, what happens if it crashes midway, and how a failure is reported.
- Skip when: Projects with no scheduled tasks, queues, or background workers.
- Mode: read, single pass, narrow scope. Needs: Repository, the scheduled jobs in vercel.json, logs.
- Related: `R06`, `R01`, `G02`

### I05 Dashboard and repo out of sync

```text
Compare infrastructure, hosting, cron, and environment settings declared in this repository against live configuration where read-only CLI or API access exists. Where dashboard state cannot be inspected from here, list the exact settings and dashboards I need to compare by hand. Flag drift that creates security, billing, or deploy risk.
```

- Finds: Finds where the hosting dashboard and the repo disagree.
- Evidence to ask for: Each declared setting (file:line) next to its live value (or "check in [named dashboard]"), highlighting every mismatch that affects uptime, security, or deploys.
- Skip when: Every hosting and database setting is managed purely from code with no manual dashboard overrides.
- Mode: read, single pass, narrow scope. Needs: Vercel and database dashboards or MCP tools, read-only.
- Related: `S06`, `I02`

### I06 Packages nobody uses, or that work by luck

```text
Audit declared dependencies for unused packages, undeclared imports satisfied only through transitive dependencies, and heavy libraries imported for trivial functionality. Check runtime code, config files (Next, Vite, PostCSS, Tailwind, ESLint), CLI scripts, and dynamic imports before calling any package unused.
```

- Finds: Finds packages nobody uses and packages that work only by accident.
- Evidence to ask for: Each flagged package with every reference found (including configs and scripts), its install or bundle cost, and whether removal or replacement is safe.
- Skip when: A tiny repo with only a handful of dependencies, or one that just finished a dependency cleanup.
- Watch for: Simple import scanners falsely flag packages loaded by build configs, PostCSS/Tailwind plugins, or CLI scripts. Verify those paths before recommending removal.
- Mode: read, single pass, narrow scope. Needs: Repository; a package checker such as knip or depcheck if already present.
- Skills: `/supply-chain-risk-auditor`
- Related: `T04`

### I07 Old runtimes and when support ends

```text
Inventory actual versions and dependencies of Playwright, Puppeteer, system Chrome, Chromium caches and Electron apps. Verify current vendor-supported and security-fix thresholds rather than trusting hard-coded version numbers. Distinguish safe disposable caches from app-owned runtimes and report the rollback path before any cleanup.
```

- Finds: Finds old browser runtimes on your computer and which are safe to remove, before a cleanup breaks an app that needs them.
- Evidence to ask for: Each runtime with version, owner app, support status from the vendor, size, and a rollback path.
- Skip when: When browser tests are stable and disk space is fine.
- Watch for: Do not delete shared runtimes or force a system Chrome until every dependent app is known.
- Mode: read, single pass, narrow scope. Needs: A terminal on your computer; vendor release pages.
- Related: `I01`

## Explore



### AD05 Did the agent actually finish this?

```text
Audit the current branch (or the feature I name) for incomplete or faked implementation. Look for hardcoded or mock data left in real paths, stubbed or empty handlers, buttons or links wired to nothing, TODO/FIXME placeholders, swallowed errors (empty catch blocks), skipped or loosened tests, missing loading/empty/error states, and requirements from my request that were silently dropped. Check every changed file and trace each user action from the UI to storage and back.
```

- Finds: Checks a completed feature or branch for classic coding-agent shortcuts: placeholder data, dead buttons, stubbed functions, skipped error states, and weakened tests.
- Evidence to ask for: A list of every shortcut, stub, dead control, weakened test, or dropped requirement with file:line and what a user would see if it shipped today, or a clear confirmation of every path you verified end to end.
- Skip when: A pure documentation change with no UI, logic, or test edits.
- Watch for: Agents skim for TODO comments and miss handlers that quietly return fake success or render static sample items. Trace the actual data flow for every new screen and action.
- Mode: read, single pass, narrow scope. Needs: Repository and its git history.

### AD06 How this whole product works

```text
Read the repository and build a plain-English map of how this product actually works today, written for the owner who directs changes and does not read code. Cover: (1) the main user roles and what each can see or do, (2) the key screens and how users move between them, (3) the core data records stored and how they relate, (4) every background job or scheduled task, (5) every external service or API the app depends on, and (6) where the highest-risk logic lives (payments, auth, writes, AI calls). Base every statement on the code and config files present today, ignoring outdated README descriptions.
```

- Finds: Draws a plain-English map of your app — its screens, user roles, stored data, scheduled jobs, and outside services — so you can see how the pieces connect without reading code.
- Evidence to ask for: A one-page plain-English system map covering those six areas, with key entry-point file paths listed underneath so I can point future sessions to the right folder.
- Skip when: A single-file script or a repo that already has an up-to-date plain-English architecture map verified against today's code.
- Watch for: Agents copy stale descriptions from README.md. Verify every screen, service, and table directly from source and config files, and flag any place the docs disagree with the code.
- Mode: read, single pass, wide scope. Needs: Repository access.

## Data integrity and analytics

Telling missing from zero, knowing where each number came from, and records whose meaning changes over time.

### D01 Missing vs zero vs stale

```text
Find where this application blurs the difference between missing, zero, unavailable, estimated, stale, and not applicable. Trace how each state is stored, how totals or averages handle it, and what appears on screen.
```

- Finds: Finds where 'we don't know' turns into 0 and then into a wrong total.
- Evidence to ask for: Each affected field (file:line), how absence is stored, how calculations treat it, what users see, and any chart or total it distorts.
- Skip when: Simple records with no optional numeric fields or aggregations.
- Mode: read, split, wide scope. Needs: Repository and read-only database access.
- Skills: `/spec-to-code-compliance`
- Related: `R02`, `D02`, `G05`

### D02 Where did this number come from?

```text
Trace each important derived number shown to users back to its raw source records, transformation logic, filters, and assumptions. Recompute a representative sample independently from raw inputs without relying on the existing calculation code to check itself. Flag discrepancies in definitions, units, dates, or source selection, and distinguish one-off errors from shared calculation bugs.
```

- Finds: Checks that every number on screen can be traced back to a source document.
- Evidence to ask for: For each key metric: its raw inputs, formula location (file:line), an independent recomputation on at least one real or sample record, and any disagreement ranked by impact.
- Skip when: Every displayed number is stored and shown verbatim with no calculation or aggregation.
- Mode: read, split, wide scope. Needs: Repository, read-only database, and the source documents the numbers come from.
- Skills: `/spec-to-code-compliance`, `/dimensional-analysis`
- Related: `D01`, `D03`, `G05`, `PG01`

### D03 Old records, new meanings

```text
Find historical records whose meaning shifts when today's rules, categories, tax rates, plan limits, or schemas are applied retroactively. Check whether the system can still reproduce what a past record or report showed on an earlier date, distinguishing later source corrections from later rule changes. Recommend the smallest reliable fix without over-engineering full bitemporal storage unless truly required.
```

- Finds: Finds old records that read differently once today's rules are applied to them.
- Evidence to ask for: Each rule or classification that affects past records (file:line), which historical data predates it, concrete examples of how old records read today, and the smallest way to preserve historical accuracy.
- Skip when: An app with no historical reporting or evolving categories/pricing rules.
- Mode: read, single pass, wide scope. Needs: Read-only database access, history of database changes.
- Related: `R04`, `D02`, `PG04`

### D04 Imports that fail quietly

```text
Audit every data import, CSV upload, and external sync for records that can be silently skipped, duplicated, overwritten, or linked to the wrong entity without raising an error. Check matching keys, conflict handling, partial failures, and summary logging.
```

- Finds: Finds rows that go missing or land on the wrong record during import, with no error.
- Evidence to ask for: Each import step (file:line) with its matching key, conflict rule, what gets logged on skip or mismatch, and whether counts-in are reconciled against counts-stored.
- Skip when: Apps where all data is entered one record at a time through forms, with no batch imports or syncs.
- Mode: read, single pass, narrow scope. Needs: Repository, import logs, read-only database.
- Related: `R01`, `D05`

### D05 Links between records worth adding

```text
Identify where data relationships have greater analytical value than isolated fields. Find missing links, broken historical continuity, and relationships the source evidence cannot actually support.
```

- Finds: Finds links between records worth adding, and ones the evidence does not support.
- Evidence to ask for: Each relationship with its source evidence, current coverage, and gaps.
- Skip when: When the data layout is still changing weekly.
- Mode: read, single pass, wide scope. Needs: Read-only database access, source documents.
- Skills: `/grill-with-docs`
- Related: `D04`, `D03`, `PG03`

### D06 Code health, with proof

```text
Run a focused code-health audit calibrated to this repository's real conventions and operational risks. Every finding must cite a specific file:line, runnable command, trace, or commit; reject generic style preferences. Return a short ranked list of under fifteen repairable problems, each graded by confidence and user/maintenance impact.
```

- Finds: A general health check of the code that refuses findings without evidence.
- Evidence to ask for: Under fifteen ranked issues, each with file:line or a reproducible command, confidence, impact, and the smallest sensible fix.
- Skip when: You already have a specific symptom that fits a narrower investigation.
- Mode: read, single pass, wide scope. Needs: Repository access.
- Skills: `/code-review`
- Related: `M02`, `T06`

## Agent harness and modern stack

Newer kinds of trouble: out-of-date agent instructions, old and new versions running at once after a deploy, data leaking into pages, outside services going down, rounding errors, and screens that show a change before it is saved.

### G01 Out-of-date agent instructions

```text
Compare every agent instruction and project doc file (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `SKILL.md`, `README.md`, and architecture notes) against the real directory layout, package scripts, and current code patterns. Flag stale rules referencing deleted files, replaced libraries, broken commands, or retired conventions.
```

- Finds: Finds instructions that send agents to files and patterns that no longer exist.
- Evidence to ask for: Each stale instruction with its file:line and the current repository fact it contradicts, plus the exact replacement or deletion proposed.
- Skip when: You have no agent instruction files yet, or you just audited and updated them.
- Mode: read, single pass, narrow scope. Needs: Repository access.
- Skills: `/retro`
- Related: `M10`

### G02 Database changes during a deploy

```text
Review the pending database migration or API schema change against the current live schema, previous release's queries, active background workers, and deployment sequence. Check whether it preserves existing data, causes table locks, breaks older client bundles or workers still draining during deploy (such as column renames, drops, or non-nullable additions), and whether a real rollback or recovery path exists. Never assume reverting app code alone rolls back a schema change.
```

- Finds: Checks that each database change works with the old code that is still live while a release finishes.
- Evidence to ask for: The migration diff (file:line), every query or consumer affected, how old and new app versions coexist during rollout, lock and rollback risks, and results from replaying the migration on a separate test copy if available.
- Skip when: The pending change touches no database schema, functions, policies, or shared API contracts.
- Mode: read, single pass, narrow scope. Needs: Repository, migrations folder, previous release tag.
- Skills: `/differential-review:diff-review`
- Related: `I02`, `S06`, `PG17`

## Explore



### AD04 Walk me through what changed before I merge

```text
Inspect the current branch diff against the default branch (or the pull request I name) and explain it for a product owner who does not read code. Group the changes by what a user or operator will experience, call out any file touched outside the stated goal, flag risky areas (data writes, permissions, billing, migrations, config changes, deleted checks), and write a five-minute manual click-test checklist I can run myself to verify the change works and did not break nearby flows.
```

- Finds: Explains an entire branch or pull request in plain English, flags edits outside your original request, and gives you a short manual test checklist you can click through yourself.
- Evidence to ask for: A plain-English summary of user-visible and behind-the-scenes changes, a list of any out-of-scope edits with file paths, the top risks with file:line, and a numbered checklist of exact screens and actions for me to test.
- Skip when: A single-line wording fix or a branch with no changes against the default branch.
- Watch for: Agents summarize commit messages instead of reading the actual diff. Read the real diff line by line and flag anything the commits forgot to mention.
- Mode: read, single pass, narrow scope. Needs: Repository and its git history.

### AD09 Links, previews, and what Google sees

```text
Audit this web application's public-facing metadata, share previews, error pages, and crawl settings. Check: page titles and meta descriptions across public routes (flag missing, duplicate, or placeholder defaults like "Create Next App"); Open Graph and Twitter/X preview tags and whether their image URLs resolve with absolute production URLs; favicon and app icons; custom 404 and 500 error pages; broken internal links or redirects; canonical URLs, sitemap, and robots.txt (flag accidental noindex tags or blocked public pages, as well as private or admin routes accidentally exposed to crawlers).
```

- Finds: Checks page titles, social share previews, favicons, 404/error pages, broken internal links, and search-engine settings before you share your site publicly.
- Evidence to ask for: A table of public routes with title, description, share image status, and indexability, plus every missing icon, broken link, default error page, or robots/noindex problem with file:line.
- Skip when: A private internal tool or native-only app with no public web pages.
- Watch for: Relative share-image paths and staging noindex headers often pass local testing and break in production. Check how the base URL and environment flags resolve in production config.
- Mode: read, single pass, wide scope. Needs: Repository access. Some answers need your hosting, billing or vendor dashboards; the report names them.

## Agent harness and modern stack

Newer kinds of trouble: out-of-date agent instructions, old and new versions running at once after a deploy, data leaking into pages, outside services going down, rounding errors, and screens that show a change before it is saved.

### G03 Hidden data anyone can read

```text
Inspect API responses, Server Component props, SSR serialization payloads, and RPC returns sent from server to browser. Find places where full database rows or internal objects (internal flags, private emails, other tenants' IDs, tokens, audit metadata, or large unused blobs) are shipped to the client and merely left unrendered in the UI.
```

- Finds: Finds data sent to the browser that the screen hides but anyone can read.
- Evidence to ask for: Each over-exposed payload (file:line) showing the fields sent over the wire, the fields the screen actually uses, and every field that should stay on the server.
- Skip when: Static public pages with no server payloads or private user data.
- Mode: read, single pass, narrow scope. Needs: Browser network panel or curl against a local server.
- Skills: `/security-review`
- Related: `T03`, `A02`

### G04 When an outside service goes down

```text
Assume each external API, AI provider, or webhook source this product depends on hangs for 30 seconds, returns 429 or 503 for an hour, or delivers a burst of out-of-order webhooks when it recovers. Trace whether database transactions or connection pools stay held open during those calls, and whether core user flows degrade cleanly or lock up.
```

- Finds: Asks what happens to the app when an outside API, an AI provider or a service that sends it updates goes down.
- Evidence to ask for: Each external dependency with its timeout, retry behavior, resources held open while waiting, and what the user sees during an outage.
- Skip when: A self-contained app that makes no outbound API calls and receives no webhooks.
- Mode: read, single pass, wide scope. Needs: Repository; a local run with outside services made to fail on purpose.
- Skills: `/diagnosing-bugs`
- Related: `P09`, `A06`, `R02`

### G05 Rounding and unit mix-ups

```text
Trace every calculation involving money, percentages, basis points, quantities, weights, or rates across storage, API payloads, math helpers, and UI formatting. Flag binary floating-point arithmetic used where exact integer or decimal math is required, premature rounding that compounds across sums, and unclear unit conventions (such as cents versus dollars, or 0.05 versus 5.0 for 5%).
```

- Finds: Finds money and percentage values that change scale or lose precision along the way.
- Evidence to ask for: Each tracked value with its unit and numeric type at every layer (file:line), highlighting every hop where units shift or rounding loses accuracy.
- Skip when: Products that handle no money, rates, percentages, or converted units.
- Mode: read, single pass, wide scope. Needs: Repository and read-only access to the database layout.
- Skills: `/dimensional-analysis`
- Related: `D02`, `D01`

### G06 Screens showing a change that was refused

```text
Trace every flow where the interface updates local state or cache optimistically before the server confirms the write. Show what happens to screen accuracy, queued actions, and error notices when the server rejects the request, times out, or returns different canonical values.
```

- Finds: Finds screens that show a change right away and keep showing it after the server refused it.
- Evidence to ask for: Each optimistic UI flow, what happens when the server rejects or drops the request, and a failing test or screenshot showing any unrolled-back state.
- Skip when: Every write waits for server confirmation before updating the screen.
- Mode: repro, single pass, narrow scope. Needs: In-app browser or Playwright set to block or alter requests.
- Skills: `/diagnosing-bugs`
- Related: `A04`, `A01`

## Motion

How the interface moves: whether animation follows a system, what it costs, who it leaves out, and where it helps or gets in the way. Each prompt works in any agent. The motion-kit plugin's /motion runs the same checks with frame-by-frame captures.

### MO01 Motion nobody chose

```text
List every animation and transition in this codebase with its duration, easing and animated properties. Count the distinct durations and the distinct easing curves. Find values used only once, transitions that name no property or no easing, and places that should share a value and do not. Propose the smallest set of shared durations and curves that covers what exists, and show which existing values map to which.
```

- Finds: Shows whether the app's motion follows a system or was typed one animation at a time.
- Evidence to ask for: A table of distinct durations and curves with counts, each outlier with file:line, and a mapping from existing values to a proposed set of about four durations and three curves.
- Skip when: Apps with a handful of animations, or a motion token file that everything already uses.
- Watch for: Agents propose a token system and start migrating. Ask for the mapping only; migrating is a separate change.
- Mode: read, single pass, wide scope. Needs: Repository access only.
- Skills: `/motion`
- Related: `MO02`, `MO05`

### MO02 Animations that cost frames

```text
Find animations and transitions that trigger expensive layout or paint work per frame (animating width, height, top, left, margin, padding, heavy shadows or blurs, or driving styles from scroll/pointer events through React or component state). For the worst three candidates, record the interaction in a browser with CPU throttling enabled and report layout counts and dropped frames. Propose a cheaper alternative (such as transform or opacity) and note any visual tradeoff.
```

- Finds: Finds the animations that stutter on slower phones and laptops, and what each one costs.
- Evidence to ask for: Each expensive animation (file:line and animated property), plus throttled browser measurements (layout count and long frames) for the top three offenders before any code change.
- Skip when: Motion is limited to simple color, transform, or opacity transitions on small elements.
- Watch for: Code search flags every height transition, including tiny accordions that cost almost nothing. Measure before recommending a rewrite.
- Mode: read, split, wide scope. Needs: Repository; the app running locally and a browser with performance tooling (DevTools or Playwright).
- Skills: `/motion`
- Related: `MO01`, `MO04`, `P01`

### MO03 Motion with no off switch

```text
Audit how this product behaves when the user's operating system requests reduced motion (`prefers-reduced-motion: reduce`). List every animation that translates, scales, rotates, or loops and check whether it has a reduced-motion fallback. Flag content that stays invisible if an entrance animation is skipped, auto-playing motion lasting over five seconds without a pause control, and drag/swipe gestures lacking a button or keyboard alternative. For each gap, specify the sensible reduced-motion replacement (usually a brief opacity fade or instant change).
```

- Finds: Finds motion that can make people dizzy or lock them out, and content that disappears when animation is turned off.
- Evidence to ask for: Every moving animation (file:line) and its reduced-motion handling, results from a browser check with reduced motion emulated showing anything that still moves or disappears, and the WCAG rule behind each gap (2.2.2, 2.3.1, 2.3.3, 2.5.1, or 2.5.7).
- Skip when: A personal prototype nobody else will use, or an app with zero movement animations.
- Watch for: Dropping one global CSS rule that sets all durations to 0ms can hide animated content or break state callbacks. Check what each real transition becomes.
- Mode: read, single pass, wide scope. Needs: Repository; a browser that can emulate prefers-reduced-motion.
- Skills: `/motion`
- Related: `MO02`, `MO05`

### MO04 Animations that restart, block or never finish

```text
Find animations and transitions that break when users act quickly instead of waiting for them to finish. Check for keyframe animations that restart abruptly on rapid triggers, exit animations skipped because elements unmount immediately, clicks or keyboard input blocked until a transition ends, focus shifting only after an animation completes, and end states that snap back to a different resting style. Reproduce up to three of the most reachable cases by re-triggering mid-animation, and propose the smallest fix for each.
```

- Finds: Finds motion that works in a demo and breaks under fast, real use.
- Evidence to ask for: Each broken case (file:line), the exact rapid-input sequence that triggers it, what the user sees (restart, jump, ignored click, or missing exit), and a reproduction for the worst one.
- Skip when: Apps whose only transitions are simple hover and focus color shifts.
- Mode: repro, split, wide scope. Needs: Repository; the app running locally with a browser to trigger interactions quickly.
- Skills: `/motion`
- Related: `MO02`, `MO06`

### MO05 Motion with no job

```text
Inventory every animation and transition in this product and state what concrete job it does for the user: confirming input, showing where an element came from or went, orienting navigation, indicating loading, or highlighting a state change. Flag every animation that conveys nothing or runs so frequently that it slows people down (menus, tooltips, keyboard-driven actions). Recommend remove, shorten, or keep for each with one sentence of reasoning. Do not propose adding new animations.
```

- Finds: Produces a list of animations to delete or shorten, which is usually the cheapest way to make an app feel faster.
- Evidence to ask for: A table with one row per animation: location (file:line), how often a user triggers it daily, the job it performs (or "none"), and remove, shorten, or keep.
- Skip when: An app with almost no motion — check "State changes with no feedback" instead.
- Watch for: Do not defend decorative delays as "polish." If an animation teaches the user nothing and slows them down, mark it for removal or shortening.
- Mode: read, single pass, wide scope. Needs: Repository; the running app helps.
- Skills: `/motion`
- Related: `MO01`, `MO06`

### MO06 State changes with no feedback

```text
Walk the product's main user flows and list up to ten moments where the interface changes with no visible feedback: a button press with no response, a deleted row vanishing abruptly, a panel appearing with no spatial cue, a multi-second wait with no loading indicator, or a save/error that happens silently. Exclude rapid, high-frequency actions users trigger dozens of times per minute. Rank the gaps by how much confusion each causes, and write a one-line motion spec (what changes, duration, and reduced-motion behavior) for each.
```

- Finds: Finds the few places where a small animation would remove real confusion.
- Evidence to ask for: Up to ten ranked moments with their user flow, component (file:line), what leaves the user guessing, and a one-line feedback spec.
- Skip when: You just finished a motion pass, or the complaint is that the app already moves too much (check "Motion with no job" instead).
- Watch for: Do not suggest animating every state change. Limit the list to ten moments at most where missing feedback creates real user doubt.
- Mode: read, single pass, narrow scope. Needs: Repository and the running app.
- Skills: `/motion`
- Related: `MO05`, `MO04`

## Explore



### X01 Promises the product doesn't keep

```text
First read every user-facing promise in this repository: marketing and pricing copy, onboarding screens, button labels, confirmation and error messages, email templates, help text, and terms/privacy pages. A promise is anything a user could rely on (such as "cancel anytime", "we'll email you when ready", "saved automatically", "permanently deleted", "refunded within 5 days", or "private to your team"). Then trace the code and config responsible for keeping each promise on both normal paths and failure paths (failed payment, bounced email, crashed job, mobile browser). Classify each as Kept, Kept on happy path only, Not kept, or Unverifiable from repo (needs manual/dashboard check). Rank broken promises by trust or legal harm.
```

- Finds: Reads every claim your product makes in web pages, pricing tables, buttons, emails, and legal text, then checks whether the code actually keeps each promise.
- Evidence to ask for: A table of promises listing where each is stated (file:line), where code enforces it (file:line or "nowhere"), its verdict, and for the top three broken ones a concrete scenario showing how a user notices.
- Skip when: An internal prototype with no public pages, user-facing emails, or billing.
- Watch for: Read the actual user-facing copy, email templates, and error strings before inspecting backend code — skipping copy misses the broken promises.
- Mode: read, single pass, wide scope. Needs: Repository access.

### X02 Your first support tickets

```text
Walk this product's main user journeys in the code (sign-up, core workflow, billing, account settings, cancellation) and predict up to fifteen real support tickets users will send. Look only for issues grounded in existing code: dead-end error messages that give no next step, states with no escape hatch, buttons that silently do nothing, emails that contradict the screen, hidden limits, and intended behavior that looks broken. Write each ticket in a frustrated user's plain voice, cite the exact code behind it, and propose the smallest fix (often clearer wording, an empty state, or a confirmation). Stop once the real code-backed issues run out instead of padding to fifteen. Rank by how many users will hit each one.
```

- Finds: Reads your main user flows and predicts the confusing screens, vague error messages, and dead ends most likely to generate support emails.
- Evidence to ask for: Up to fifteen ranked tickets in user language, each tied to a specific screen, message, or state (file:line), expected frequency, and the smallest fix that prevents it.
- Skip when: A personal tool used only by you.
- Watch for: Never invent generic complaints like "the app feels slow." Every ticket must cite an actual message, missing state, or code path in this repository.
- Mode: read, single pass, wide scope. Needs: Repository access.

### X03 How a clever user games you

```text
Think like a clever, opportunistic customer with a normal account and no hacking tools. Audit the code for ways they can get paid features for free or run up your bills: repeating free trials with fresh emails, reusing or stacking discount/referral codes, bypassing usage limits enforced only in browser code, timing upgrades/downgrades to dodge charges, keeping access after refunds or chargebacks, sharing accounts or abusing free invites, and triggering unbounded per-use costs (AI calls, SMS, emails, file storage, exports). For each loophole, give the exact user steps, whether the server enforces the rule today, a rough monthly cost if 100 users did it, and whether fixing it is a small code change or a pricing/product policy call.
```

- Finds: Finds loopholes an ordinary signed-in customer could exploit without hacking — infinite trials, stacked coupons, browser-only limits, or running up your AI/SMS bill.
- Evidence to ask for: Each abuse path with reproduction steps, current enforcement (file:line or "missing"), rough cost at 100 abusive users, and whether it needs code or a product decision.
- Skip when: A completely free app with no usage caps and no metered per-action costs.
- Watch for: Stay focused on business-logic and billing loopholes ordinary users can trigger — classic security vulnerabilities like SQL injection belong in the Security checks.
- Mode: read, single pass, wide scope. Needs: Repository access.

### X04 Features you could delete

```text
Identify features, screens, settings, feature flags, integrations, legacy plan tiers, export formats, or unfinished experiments that could be deleted with minimal user impact. Use whatever real evidence is accessible — routes with no navigation links, analytics events, database row counts, logs, flag config, and git history. For each candidate, assess its upkeep cost (code, tests, dependencies, support burden), the evidence it is unused, who could still reach it (including direct URLs, email links, bookmarks, or cron jobs), and what removal takes. Recommend the top three cuts with the best maintenance-saved-to-risk ratio.
```

- Finds: Finds unlinked pages, untouched settings, stale feature flags, and dead integrations that cost maintenance while helping almost nobody.
- Evidence to ask for: A ranked list of deletion candidates with usage evidence (query, count, or analytics check — marking anything that requires your live analytics dashboard), upkeep cost, potential impact, and the top three to remove first.
- Skip when: A brand-new product under a few months old with no real user history yet.
- Watch for: Code with zero internal callers can still be hit via bookmarked URLs, email links, webhooks, or scheduled jobs. Check every entry point before calling a feature dead.
- Mode: read, single pass, wide scope. Needs: Repository access.

### X05 Follow one dollar

```text
Trace a single dollar from the moment a customer pays through every system that records or reacts to it: checkout, payment provider, webhooks, database records, feature access grants, receipts/emails, and revenue reporting. Then trace the unhappy paths: declined card, payment retry, duplicate webhook, out-of-order webhook (arriving before the user or checkout row exists), partial refund, full refund, chargeback, mid-cycle plan change, cancellation, and non-default currency. At each step, identify the source of truth, what happens on failure or retry, and where your records or user access can fall out of sync with the payment provider.
```

- Finds: Traces a single customer payment from checkout through webhooks, database rows, access grants, receipts, refunds, and chargebacks to spot where money or access goes wrong.
- Evidence to ask for: A step-by-step trace of the happy path and each unhappy path with handler locations (file:line), source of truth per step, and every gap where money can be double-counted, lost, or mismatched against granted access.
- Skip when: A product that takes no payments, or links out to a hosted payment page and stores zero payment state.
- Watch for: Do not stop after tracing successful checkouts. Duplicate and out-of-order webhooks plus refunds and chargebacks are where real billing bugs hide.
- Mode: read, single pass, wide scope. Needs: Repository access. Some answers need your hosting, billing or vendor dashboards; the report names them.

### X06 What one more customer costs

```text
Calculate the marginal monthly cost of adding one typical active customer. List every paid service this product uses (hosting, functions, database, file storage, bandwidth, AI models, email, SMS, search, error tracking, third-party APIs) and trace from code what user actions trigger charges. Estimate monthly usage per active customer using logs or database stats where available, stating assumptions clearly where not. Compare total per-user cost against each pricing tier, and highlight features whose cost scales faster than revenue (such as unthrottled AI calls, full-size image uploads, or unlimited free-tier exports). Fetch current published vendor prices if you have web access and cite the URL; if you cannot verify live pricing, mark every price clearly as an estimate for me to confirm on the vendor's pricing page.
```

- Finds: Calculates what each additional active user costs you across hosting, AI models, email, storage, and APIs, and flags features whose cost outruns your subscription price.
- Evidence to ask for: A cost-per-user breakdown by service and feature with triggering code (file:line), stated assumptions, verified vs. estimated prices, margin per plan, and the two or three features that hurt most at 10x users.
- Skip when: A flat-fee static product with zero metered services and no paid plans.
- Watch for: Never present memorized pricing as confirmed fact. Cite a live pricing source or mark the number as an unverified estimate.
- Mode: read, single pass, wide scope. Needs: Repository access. Some answers need your hosting, billing or vendor dashboards; the report names them.

### X07 If a vendor doubles its price or disappears

```text
Map this product's dependence on every external vendor, platform, or API (hosting, database, auth, payments, email, AI providers, app stores, analytics, and third-party SDKs). For each, measure how deeply it is embedded: how many files import or call it directly, whether one internal wrapper isolates it, whether your data can be cleanly exported, and which core features stop without it. Stress-test three scenarios for each vendor: price doubles, terms ban your use case, or it shuts down with 30 days' notice. Rank vendors by potential damage and suggest one cheap hedge for the top two without proposing a migration today.
```

- Finds: Shows how tightly your app is wired to each outside vendor, how hard it would be to leave on 30 days' notice, and one cheap safeguard for the top two risks.
- Evidence to ask for: A vendor table listing file touch count, single wrapper (yes/no), data exportability, features lost on outage, estimated switch effort, and one low-cost hedge for each of the top two risks.
- Skip when: A small project using only one or two standard services already isolated behind clean wrappers.
- Watch for: Do not recommend migrating off vendors immediately. Give a clear risk picture and small, practical hedges.
- Mode: read, single pass, wide scope. Needs: Repository access. Some answers need your hosting, billing or vendor dashboards; the report names them.

### AD08 Emails and messages people actually receive

```text
Find every email, SMS, push notification, or in-app message this application sends. For each one, read the actual template and trigger code and check: what triggers it, whether retries or webhooks can send it twice, whether links inside it could point to localhost or a broken URL in production, what sender name and reply-to address it uses, whether marketing or digest messages include a working unsubscribe link, whether placeholder or embarrassing wording remains, and what happens when the email or SMS provider rejects or bounces it.
```

- Finds: Audits every email, text, or notification your app sends for broken links, placeholder wording, wrong sender details, double sends, and silent delivery failures.
- Evidence to ask for: A list of every outgoing message with its trigger (file:line), template path, link and wording issues, retry/duplicate risk, and a short checklist of DNS or provider dashboard checks (such as SPF, DKIM, DMARC, or verified sender domain) that cannot be verified from the repo.
- Skip when: An app that sends no emails, texts, or notifications.
- Watch for: Agents check that a send function exists and skip reading the actual subject line, body text, and link URL builder. Inspect the rendered text and URL construction for every template.
- Mode: read, single pass, wide scope. Needs: Repository access. Some answers need your hosting, billing or vendor dashboards; the report names them.

### AD11 Build it, buy it, or skip it?

```text
Before we build the feature I am describing, evaluate three paths for a solo builder who wants low ongoing maintenance: (1) build it inside this codebase, (2) use an established service or library that already fits our stack, or (3) ship a much simpler or manual version first until usage proves it needs software. Inspect the repository first so your comparison reflects our actual stack, existing dependencies, and hosting limits. For each option, compare upfront work, ongoing maintenance and edge cases I will own forever (security, compliance, retries, deliverability, edge cases), vendor lock-in, and rough cost. Recommend one option and state what would change your mind.
```

- Finds: Before you ask an agent to build a big feature from scratch, checks whether an existing tool, a simpler manual step, or skipping it makes more sense for a solo builder.
- Evidence to ask for: A plain-English comparison of the three options grounded in this repo's stack (citing package.json or equivalent config), the hidden maintenance traps of building it ourselves, and one clear recommendation.
- Skip when: A tiny feature unique to this product's core value where no off-the-shelf tool applies.
- Watch for: Coding agents default to "we can build this easily" because writing the first version is fast while owning edge cases for two years is invisible. Price the two-year maintenance burden up front.
- Mode: read, single pass, wide scope. Needs: Repository access.

### X08 The app's own AI calls

```text
Audit every place this application calls an AI model at runtime. For each call check: (1) model ID and whether it is deprecated or nearing retirement, (2) what untrusted input enters the prompt (user text, scraped pages, uploaded files, emails) and its prompt-injection exposure, (3) what the model's output can trigger (display text, tool calls, database writes, emails, charges), (4) timeouts, retries, and fallback behavior when the provider is slow or down, (5) schema/length/allowlist validation on outputs before use, (6) cost per call and calls triggered per user action, (7) whether personal user data is sent to the model provider, and (8) whether any eval or test detects answer quality dropping. Rank findings by severity: unauthorized actions first, cost blowups second, silent quality degradation third.
```

- Finds: Audits every runtime AI model call inside your app for prompt-injection traps, runaway costs, retired models, missing output checks, and silent slowdowns.
- Evidence to ask for: Every runtime model call (file:line) with model ID, untrusted inputs, downstream actions triggered by output, timeout/fallback, output validation, estimated calls per action, and ranked risks.
- Skip when: An application that makes zero AI API calls at runtime.
- Watch for: Do not stop at reading the prompt string. Trace where the model's response actually flows and what actions it can execute.
- Mode: read, single pass, wide scope. Needs: Repository access.

### X09 Things that break on a date

```text
Find everything in this project that will break on a future calendar date without any code change. Check: TLS certificates and signing keys, expiring API tokens and OAuth secrets, app store certificates and OAuth verification renewals, domain renewals, free-tier or startup credits expiring, retiring vendor APIs/SDKs/AI model IDs referenced in code, hardcoded years or date cutoffs, scheduled jobs with end dates, and growing counters or storage quotas nearing limits. Put everything on one timeline, soonest first, stating how you found each date and whether any automated alert warns ahead of time. Separate dates verified from code/config from dates you cannot see that I must check in a named dashboard.
```

- Finds: Builds a timeline of everything set to expire or fail automatically — certificates, API keys, app store renewals, startup credits, retiring model versions, and hardcoded dates.
- Evidence to ask for: One chronological risk timeline listing each item, verified date (or "check in [named dashboard]"), evidence (file:line or command), what breaks when it hits, and whether any advance warning exists.
- Skip when: A brand-new local prototype with no deployed domain, external API keys, or scheduled jobs.
- Watch for: Never guess expiry dates you cannot inspect. Mark every dashboard-only renewal clearly for manual verification.
- Mode: read, single pass, wide scope. Needs: Repository access. Some answers need your hosting, billing or vendor dashboards; the report names them.

### X10 How you'd find out it's broken

```text
List the five to ten critical jobs this product must keep working (sign-in, checkout, outgoing emails, core data reads/writes, nightly jobs, imports). For each one, answer directly: if it stopped working at 2am, how would I find out and how long would it take? Inspect only what actually exists in code and config — error trackers, alerting rules, uptime checks, health endpoints, failed-payment hooks, and swallowed exceptions — and flag external alerting dashboards you cannot inspect from the repo. Classify each flow as: alerts within minutes, noticed within a day, or only discovered when a user complains. For each blind spot, propose the single smallest signal that catches it (one alert, one heartbeat check, or one daily count check).
```

- Finds: Checks your core user flows one by one to show which outages would alert you within minutes and which you'd only learn about from an angry user.
- Evidence to ask for: A table of critical flows showing current detection (file:line, dashboard to verify, or "none"), expected delay before you notice, and one lightweight alert for each gap.
- Skip when: A pre-launch prototype with no external users yet.
- Watch for: Writing to a log file nobody alerts on does not count as monitoring. Check who actually gets notified and how.
- Mode: read, single pass, wide scope. Needs: Repository access. Some answers need your hosting, billing or vendor dashboards; the report names them.

### X11 Defaults nobody chose

```text
Audit settings left at their framework, library, or hosting defaults that materially affect users, security, or cost: session duration and idle logout, password and reset-token expiry, upload size caps, request timeouts, cache headers, rate limits, retry counts, default time zone/locale/currency, pagination sizes, email sender and reply-to, image storage settings, log retention, backup schedules, data region, and hard vs. soft deletes. Report only defaults that could plausibly hurt this product. Verify each default value against the installed version's source code in `node_modules` (or equivalent lockfile/package source) or official docs; mark anything you could not verify locally as unconfirmed.
```

- Finds: Exposes invisible framework and hosting defaults your app runs on — session lifetimes, upload limits, timeouts, cache lengths, rate limits, and email headers — and flags the risky ones.
- Evidence to ask for: A focused list of risky defaults showing the setting, current value and where you confirmed it (file:line, installed package source, or doc reference), plain-English user impact, and a suggested explicit value.
- Skip when: Every major runtime, auth, upload, timeout, and retention setting is already explicitly configured in one documented config file.
- Watch for: Framework defaults change between major versions. Verify against the exact version installed instead of quoting from memory.
- Mode: read, single pass, wide scope. Needs: Repository access.

### X12 Where people's personal data ends up

```text
Trace all personal user data from collection (forms, sign-up, billing, uploads, analytics, IP/device metadata, support tools) to every destination it reaches: database tables, file buckets, server logs, error trackers, session recordings, analytics, email/CRM tools, AI API calls, exports, and backups. For each destination, note retention, access scope, and whether data leaves to a third party (flagging external tool settings that need manual dashboard checks). Then trace a real account-deletion request: list every place user data would need to be removed from and whether code handles it today. Highlight sensitive data logged in plain text, unused fields still being collected, and any mismatch with your privacy page.
```

- Finds: Tracks every piece of personal information you collect across databases, logs, error trackers, analytics, emails, and AI calls, and checks what it takes to delete a user completely.
- Evidence to ask for: A map from each collected personal field to every storage/external destination (file:line), a deletion checklist separating automated cleanup from manual steps, and any mismatch with the privacy page.
- Skip when: A local or anonymous tool with zero accounts, forms, analytics, or personal data.
- Watch for: Check server logs, error trackers, and analytics calls first — personal data leaks there far more often than in primary database tables.
- Mode: read, single pass, wide scope. Needs: Repository access. Some answers need your hosting, billing or vendor dashboards; the report names them.

### X13 Things you may not be allowed to ship

```text
Audit everything shipped in this project for licensing or usage restrictions: package licenses in lockfiles (especially copyleft licenses like GPL/AGPL in closed-source products, or non-commercial/source-available licenses in paid apps), code snippets copied without attribution, web/app font files and their license terms, images/icons/illustrations/audio in asset folders, third-party logos or brand assets, AI-generated media whose source tool has commercial terms, and scraped or external datasets. For each flagged item, state the license or provenance found, whether this usage fits, and the next step (attribute, replace, purchase a license, or verify). Flag uncertain items for human or legal review without giving legal advice.
```

- Finds: Checks fonts, icons, images, third-party packages, and copied snippets for licenses that restrict commercial use or require attribution.
- Evidence to ask for: Every asset or package with a potential license issue (file path and where the license was found), whether current use fits, and the concrete action needed, separating clear fixes from items needing human confirmation.
- Skip when: A private personal script nobody else will see, download, or pay for.
- Watch for: Do not stop after scanning `package.json`. Fonts, icon packs, downloaded images, and pasted code snippets in asset/source folders are where real license problems usually hide.
- Mode: read, single pass, wide scope. Needs: Repository access.

### X14 If you disappeared tomorrow

```text
Imagine I became unreachable tomorrow and a capable developer had to keep this product running using only this repository. Identify everything missing from the repo: external accounts and billing ownership (hosting, domain, database, payments, email, app stores), dashboard-only secrets and settings, manual recurring work (deploys, renewals, exports, support replies, data fixes), external cron jobs, undocumented code quirks, and anything tied to my personal machine. For each gap, note what breaks and how soon, plus the smallest fix (a repo doc, script, shared password vault entry, or backup owner). Format the actionable output as a clean one-page emergency runbook naming where each secret lives (names only, never values).
```

- Finds: Finds every account, dashboard setting, manual habit, and secret that lives only in your head or on your computer, and drafts a one-page emergency runbook.
- Evidence to ask for: Single points of failure ranked by how quickly each breaks, a draft one-page runbook covering accounts, deploys, manual tasks, and secret locations (names only, never secret values), and a short list of account-ownership questions only I can fill in.
- Skip when: A disposable weekend experiment with no external accounts, users, or ongoing operations.
- Watch for: Never read, print, or copy secret values into the runbook. Record only variable names and which dashboard or password manager holds them.
- Mode: read, single pass, wide scope. Needs: Repository access. Some answers need your hosting, billing or vendor dashboards; the report names them.

### X15 What agents keep getting wrong here

```text
Analyze this repository's git history to uncover mistakes coding agents keep repeating. Look for reverts, rapid follow-up fix commits, files that repeatedly change together yet live far apart, and edits to generated files or broken conventions. Group recurring mistakes by root cause (undocumented rule, generated file, required rebuild step, misleading name, synced pair of files, broken local test). For each recurring cause, cite two or three commit hashes as proof and draft one or two crisp lines for `AGENTS.md`/`CLAUDE.md` — or an automated check — that would have prevented it. Skip anything already clearly documented.
```

- Finds: Mines your git history for reverts and fix-on-fix commits to spot mistakes coding agents keep repeating, and drafts exact lines for `AGENTS.md` or `CLAUDE.md` to prevent them.
- Evidence to ask for: Recurring causes ranked by frequency, supporting commit hashes, and exact proposed additions or edits for your instruction file (marked New or Replaces).
- Skip when: A new repository with fewer than roughly fifty commits of history.
- Watch for: Reject vague platitudes like "write clean tests." Every proposed rule must trace directly to real commits in this repository.
- Mode: read, single pass, wide scope. Needs: Repository and its git history.

### X16 The first bad day

```text
From the actual code, config, deploy setup, data model, and third-party dependencies in this repository, identify the three likeliest ways this product suffers its first serious incident: data loss or corruption, prolonged outage, security/privacy leak, or a surprise usage bill. Take the #1 likeliest scenario and write a grounded pre-mortem incident report: exact trigger, hour-by-hour timeline, how you find out, what compounds the damage, what gets lost, recovery time, and impact. Every single step in the timeline must cite a real file, setting, or missing safeguard in this repo (or explicitly flag a dashboard setting to check). End with three preventive fixes ordered by effort, naming the single one worth doing this week.
```

- Finds: Writes a grounded, hour-by-hour preview of the most likely serious outage, data loss, security leak, or surprise bill waiting in your current setup — and the one fix worth doing this week.
- Evidence to ask for: Three ranked incident risks with triggers, one evidence-backed incident timeline citing real files/settings at every step, and three preventive fixes with effort estimates.
- Skip when: A throwaway prototype with no users, no stored data worth keeping, and no metered billing.
- Watch for: Do not write dramatic fiction. Every link in the incident chain must be possible under this repository's actual code and configuration.
- Mode: read, single pass, wide scope. Needs: Repository access.

### AD10 Can you get your data back if something goes wrong?

```text
Audit how this product protects against accidental data loss across every store it uses (SQLite, Postgres, Supabase, Firebase, Convex, cloud file storage, or external SaaS data). From the repository, infrastructure config, and scripts, trace: what destructive operations exist in code or admin tools (hard deletes, cascades, overwrites, migration drops), whether soft-delete or undo exists for user-triggered deletions, what backup or point-in-time recovery settings are declared in config, and what data lives in places with no backup configured. Clearly separate what you verified in the repository from backup settings that live only in a hosting dashboard and require my check.
```

- Finds: Checks whether your database, uploaded files, and user content are actually backed up and restorable — whatever database or host you use.
- Evidence to ask for: Every data store and file bucket found (file:line), the destructive paths that can wipe data permanently, what backup/restore mechanism is visible in config, and a short checklist of dashboard settings I must confirm and one safe restore drill to run.
- Skip when: A stateless tool or static site that stores no user data or uploaded files.
- Watch for: Agents assume a managed database host includes tested backups by default. Free tiers often have no point-in-time recovery or short retention, and file buckets (avatars, uploads) are frequently unbacked-up even when the database is. Flag every assumption that needs dashboard verification.
- Mode: read, single pass, wide scope. Needs: Repository access. Some answers need your hosting, billing or vendor dashboards; the report names them.
