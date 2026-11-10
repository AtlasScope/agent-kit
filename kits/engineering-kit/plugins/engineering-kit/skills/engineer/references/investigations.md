# Investigations

Generated from `library/library.json` by `kits/engineering-kit/scripts/build_references.mjs`; do not edit by hand.

Each one is a prompt to paste into a fresh agent session. `mode` is the default wrapper from start-here.md (read: read-only; repro: may add a failing test or script). `split` means run it as two passes, find then verify, rather than one long session.

## Architecture and hidden complexity

Spots where the way the code is built invites bugs: status spread across many places, words that change meaning between layers, and layers that cost more than they help.

### A01 Status hidden in a pile of flags

```text
Find every implicit state machine in this application. Identify where states, transitions, and invalid combinations are scattered across flags, conditionals, and components.
```

- Finds: Finds features whose real status is spread across a pile of yes/no flags, so combinations that should be impossible can happen.
- Evidence to ask for: A list of states and transitions per feature, each with file:line, plus one reachable invalid combination shown concretely.
- Skip when: Small features with one status field that has a fixed list of values and is checked in one place.
- Watch for: Agents tend to list every boolean as a state. Ask which combinations are reachable and which are only theoretical.
- Mode: read, split, wide scope. Needs: Repository access only.
- Skills: `/improve-codebase-architecture`, `/grill-me`
- Related: `A06`, `G06`, `R03`

### A02 Meaning drift across the stack

```text
Trace the same business concept across the entire stack. Find places where its meaning, representation, or validation changes between the UI, API, database, and background jobs.
```

- Finds: Shows where one word (a task, a fund, a run) means slightly different things in different parts of the app.
- Evidence to ask for: One table per concept: layer, type or column, validation rule, file:line. Mismatches marked.
- Skip when: Ideas that only live in one part of the app.
- Watch for: This is an unbounded trace. Name one concept up front or it will wander.
- Mode: read, split, wide scope. Needs: Repository access and read-only access to the database layout.
- Skills: `/grill-with-docs`, `/spec-to-code-compliance`
- Related: `D01`, `D03`, `G03`

### A03 Layers that don't earn their keep

```text
Identify abstractions that no longer earn their complexity. Find wrappers, factories, inheritance, and generic utilities that make the application harder to understand than a simpler implementation would.
```

- Finds: Finds extra layers of code you could delete so the code, and the agents reading it, get simpler.
- Evidence to ask for: For each candidate: callers count, what deleting it would move where (the deletion test), and what tests would change.
- Skip when: Right after a cleanup of the code, or when the layer walls off an outside company's toolkit.
- Watch for: Agents call thin adapters redundant when they exist to isolate an unstable SDK or give tests a seam.
- Mode: read, single pass, wide scope. Needs: Repository access only.
- Skills: `/improve-codebase-architecture`, `/simplify`
- Related: `A05`, `M04`, `PG10`

### A04 Two systems that disagree

```text
Find places where two systems can disagree about the same truth. Trace their ownership, synchronization, cache invalidation, and recovery behavior.
```

- Finds: Finds data kept in two places (a saved copy and a table, the browser and the server) that can quietly disagree.
- Evidence to ask for: Pairs of stores with the field, who writes each, how they sync, and a sequence of events that makes them diverge.
- Skip when: Read-only copies that are rebuilt from scratch on every load.
- Mode: read, split, wide scope. Needs: Repository and read-only database access.
- Skills: `/audit-context-building`
- Related: `R05`, `G06`, `D02`, `PG05`, `PG11`

### A05 Old design choices that now cost you

```text
Look for architectural decisions that were reasonable when this project was smaller but are now liabilities. Distinguish actual problems from stylistic preferences.
```

- Finds: Separates old design choices that now cost real time or bugs from ones that are only out of fashion.
- Evidence to ask for: Each decision with the original reason, the current cost (incidents, workarounds, slow paths) and evidence for that cost.
- Skip when: Projects younger than a few months.
- Mode: read, single pass, wide scope. Needs: Repository and its git history.
- Skills: `/improve-codebase-architecture`
- Related: `A03`, `P05`

### A06 Code that relies on lucky timing

```text
Identify asynchronous operations whose correctness depends on events happening in a particular order without an explicit guarantee. Trace the scheduling, retries, cancellation, and conflicting writes; reproduce the highest-risk cases and propose the smallest enforceable contract.
```

- Finds: Finds code that only works because things usually happen in the right order.
- Evidence to ask for: The assumed order, what can reorder it (retry, webhook, slow network), and a reproduction for the worst case.
- Skip when: Scripts that do one step at a time with nothing running side by side.
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

### A08 Screens that fight how people work

```text
Map this application's pages, navigation and URLs against the jobs its users actually do. Find pages that should merge, become a tab or panel, or go away; navigation systems that compete for the same destinations; and jobs users have to assemble by hand across screens. Say whether the structure itself causes the problems, and if it does, name the end state it should reach.
```

- Finds: Finds when confusing screens are a symptom of how the product is organised rather than a list of separate bugs.
- Evidence to ask for: A verdict per page (keep, merge, demote, retire) with the evidence for each, the two to five causes behind the symptoms, and today's site map next to the proposed one.
- Skip when: Products with a handful of pages, or right after a navigation redesign nobody has used yet.
- Watch for: Agents propose a redesign for every complaint. Ask whether one structural cause explains two or more findings; if none does, the structure is sound and the fixes are local.
- Mode: read, split, wide scope. Needs: Repository; the app running locally with test accounts for the browser checks.
- Skills: `/experience-architecture:diagnose`, `/experience-architecture:rethink`
- Related: `A05`, `R07`, `A02`

## Performance and scale

Where time and money go as the data grows. Every claim here needs a measurement before and after.

### P01 Slowest journeys, end to end

```text
Trace the five most expensive user journeys from browser interaction to database response. Find unnecessary round trips, waterfalls, serialization, and repeated computations, and measure their contribution to latency.
```

- Finds: Shows where the seconds go on the paths people actually use.
- Evidence to ask for: A timed trace per journey (browser network panel, server timing, query time) with each step's share of the total.
- Skip when: When nobody has reported slowness and costs are flat.
- Watch for: Static reading guesses at latency. Require a measured trace before any ranking.
- Mode: read, split, wide scope. Needs: Browser developer tools or Playwright recordings, server logs or timing data, and the database's query plan (EXPLAIN).
- Skills: `/diagnosing-bugs`
- Related: `P02`, `P03`, `M08`

### P02 Steps that wait for no reason

```text
Find all hot paths where independent asynchronous operations run sequentially. Establish which can safely run concurrently without violating ordering, rate limits, or transaction boundaries.
```

- Finds: Finds steps that wait for each other to finish when they could run at the same time.
- Evidence to ask for: Each chain with the operations, why they are independent, and a before/after timing on a realistic input.
- Skip when: Paths that run once a day or already finish in a few milliseconds.
- Watch for: Agents wrap awaits in Promise.all without noticing they share one database transaction or hit a rate-limited API. Check transactions, rate limits and pool sizes before changing anything.
- Mode: read, single pass, narrow scope. Needs: Repository; a timing script to measure the result afterward.
- Skills: `/diagnosing-bugs`
- Related: `P09`, `A06`, `M08`

### P03 Queries that grow badly

```text
Find database queries whose cost grows disproportionately with records, tenants, or relationships. Examine execution plans, indexes, joins, pagination, and application-side filtering.
```

- Finds: Finds the database queries that will be the first to slow down as tables grow.
- Evidence to ask for: EXPLAIN ANALYZE output for each suspect query at realistic row counts, plus the index or rewrite and its new plan.
- Skip when: Tables that will stay small (settings, lookup lists).
- Mode: read, single pass, narrow scope. Needs: Read-only database access with EXPLAIN (the database's query plan). A Neon or Supabase branch copy for anything heavier.
- Related: `P01`, `P05`, `P06`, `PG13`

### P04 Work repeated for nothing

```text
Identify expensive work that is repeated despite unchanged inputs. Investigate caching, memoization, batch operations, and incremental computation before recommending changes.
```

- Finds: Finds work redone on every request or screen redraw when nothing it depends on changed.
- Evidence to ask for: The operation, how often it runs, how often its inputs change, and its measured cost.
- Skip when: Work that is already cheap, where saving results would add a risk of stale data for little gain.
- Watch for: A cache is a second source of truth. Any cache proposal must say who invalidates it and when.
- Mode: read, single pass, wide scope. Needs: A profiler or request logs to count repeats.
- Related: `A04`, `P01`, `PG06`

### P05 What breaks at ten times the size

```text
Investigate what happens when this application's data volume and concurrent users increase tenfold. Identify the first likely bottlenecks using evidence from its current design.
```

- Finds: Names the first thing to break if the project takes off, before it does.
- Evidence to ask for: Current sizes and rates, the projected tenfold numbers, and the limit each bottleneck hits (pool size, plan limit, query cost).
- Skip when: Products with no growth in sight; revisit quarterly.
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
Investigate sustained memory growth and allocation pressure. Look for unbounded caches, retained closures, unremoved listeners, large error objects, detached DOM references and accidentally retained request data. Use heap profiles or repeatable growth tests to validate candidates.
```

- Finds: Finds why a page or process gets slower or crashes the longer it runs.
- Evidence to ask for: Two heap snapshots over a repeated action, with the growing object type and what retains it.
- Skip when: When memory use stays flat over a long session.
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
Find operations that cannot safely be retried. Examine duplicate events, partial failures, idempotency, transaction boundaries, and recovery from interrupted execution.
```

- Finds: Finds actions that do damage when they run twice: double sends, double charges, duplicate rows.
- Evidence to ask for: Each operation with its trigger, what a second run does, and whether a key or constraint prevents it.
- Skip when: Actions that only read data.
- Mode: read, split, wide scope. Needs: Repository and read-only access to the database layout.
- Skills: `/diagnosing-bugs`
- Related: `R05`, `R06`, `D04`, `PG08`

### R02 Fallbacks that look like real data

```text
Trace every place the application silently substitutes a default, null, stale value, or empty result when something fails. Determine whether users could mistake the fallback for valid information.
```

- Finds: Finds screens that show a confident zero or an empty list when the real answer is 'we could not load this'.
- Evidence to ask for: Each fallback with its trigger, what the user sees, and whether anything tells them it is a fallback.
- Skip when: Fallbacks that are already labelled on screen.
- Mode: read, single pass, wide scope. Needs: Repository; the app running to see what users see.
- Skills: `/insecure-defaults:audit`
- Related: `D01`, `T05`, `S06`

### R03 Rules the data never enforces

```text
Identify business invariants the system assumes but never enforces. Find the appropriate enforcement point and develop tests that attempt to violate them.
```

- Finds: Finds the rules everyone assumes (one owner per task, no negative balance) that nothing actually checks.
- Evidence to ask for: Each invariant, where it is assumed, where it could be enforced (constraint, schema, server check) and a test that breaks it today.
- Skip when: Rules the database itself already enforces.
- Mode: repro, single pass, wide scope. Needs: Repository; a test database or branch copy.
- Skills: `/property-based-testing`, `/tdd`
- Related: `A01`, `T02`

### R04 Dates, times and time zones

```text
Analyze the system's handling of time: time zones, daylight saving, expiration, scheduled jobs, clock differences, and historical as-of queries.
```

- Finds: Finds the date bugs that show up twice a year, at midnight, or in another time zone.
- Evidence to ask for: Each time-sensitive path with the zone it assumes, and a test at a DST boundary and at midnight in your users' main time zone and in UTC.
- Skip when: Features that never show or compare dates.
- Mode: repro, single pass, wide scope. Needs: Repository; tests with the clock fixed to a set time.
- Skills: `/property-based-testing`
- Related: `D03`

### R05 Updates that overwrite each other

```text
Find race conditions and out-of-order updates across background jobs, UI mutations, caches, webhooks, and database writes. Prove suspected problems with reproducible cases.
```

- Finds: Finds updates that overwrite newer data because two things wrote at once.
- Evidence to ask for: A reproduction for each race (a script or test that loses an update) rather than a theory.
- Skip when: Data that only one thing ever writes.
- Watch for: Agents list theoretical races freely. Count only the ones with a reproduction.
- Mode: repro, split, wide scope. Needs: Repository; a local or branch-copy database to reproduce the problem.
- Skills: `/diagnosing-bugs`
- Related: `A06`, `A04`, `R01`, `PG05`

### R06 Half-finished failures

```text
Trace error, timeout and cancellation paths for transactions, locks, file handles, temporary files, worker jobs and network connections. Identify paths that leave resources held or state half-committed, and demonstrate them with controlled failure injection where practical.
```

- Finds: Finds what is left behind when something fails halfway.
- Evidence to ask for: Each failure path with the resource left held, shown by injecting the failure.
- Skip when: Code that holds nothing open beyond a single request.
- Mode: repro, single pass, wide scope. Needs: Repository; a way to force errors in tests.
- Skills: `/diagnosing-bugs`
- Related: `A07`, `R01`, `I04`

### R07 Lost place: Back, refresh and shared links

```text
Check whether this application keeps the user's place. In a real browser, open lists, filters, tabs, panels and records, then press Back and Forward, refresh, open links in a new tab, and open shared links in a fresh browser both signed out and as another account. Find where users lose a filter, scroll position, draft or open panel, or land somewhere other than what was shared, and trace each case to where that state lives.
```

- Finds: Finds the everyday friction where Back closes the wrong thing, a filter resets, or a pasted link opens the wrong view.
- Evidence to ask for: Each case as a recorded journey (start, action, expected, observed) with the file and line that owns the state, and the journey runner's verdict: PASS, FAIL or EXPLORATORY.
- Skip when: Static sites with no filters, panels or signed-in pages.
- Watch for: Blocking data-changing requests does not make a browser run read-only, because some apps change data on an ordinary page load. Never point it at production with real accounts.
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
Trace every external input from entry point to sensitive operation. Investigate authorization gaps, injection risks, unsafe parsing, and tenant isolation failures.
```

- Finds: Follows input from outsiders to the places it can do harm.
- Evidence to ask for: Each path: entry point, checks along the way, sensitive operation, and the missing check if any, with file:line.
- Skip when: Never skip for anything that holds other people's data or money.
- Mode: read, split, wide scope. Needs: Repository access.
- Skills: `/security-review`, `/audit-context-building`, `/differential-review:diff-review`
- Related: `T05`, `S06`, `G03`

### T04 Risk from outside packages

```text
Review dependency and CI supply-chain exposure: install scripts, untrusted pull requests, privileged tokens, outdated packages, and unsafe automation permissions.
```

- Finds: Checks what a harmful outside package or pull request could reach.
- Evidence to ask for: Advisories matched to installed versions, install scripts present, workflow permissions and which secrets each job can read.
- Skip when: Rarely; run after adding packages or automated build jobs.
- Mode: read, single pass, narrow scope. Needs: The lockfile (exact package list), automated build workflow files, npm audit or the auditor skill.
- Skills: `/supply-chain-risk-auditor`, `/agentic-actions-auditor`, `/ci-optimizer:ci-check`
- Related: `I06`, `I03`

### T05 Security checks that fail open

```text
Search for security-sensitive behavior that fails open when configuration is missing, an authorization service fails, or a request is malformed.
```

- Finds: Finds security checks that let people in when something goes wrong.
- Evidence to ask for: Each check with what happens on missing config, thrown error and malformed input, shown with a request or test.
- Skip when: Never skip for sign-in, keys or owner checks.
- Mode: read, single pass, narrow scope. Needs: Repository; the app running locally in demo mode.
- Skills: `/insecure-defaults:audit`, `/sharp-edges`
- Related: `S06`, `T03`, `R02`

### T06 What the tests really prove

```text
Choose critical features and ask what the existing tests truly prove. Identify mocks that bypass important integration behavior, assertions that cannot fail meaningfully, and tests that reproduce the implementation's assumptions. Produce the smallest independent check that catches a real regression.
```

- Finds: Asks what each test really proves, then adds one check that would catch a real break.
- Evidence to ask for: For each feature, the claim the tests make, what they actually exercise, and a new check that fails when the feature is broken.
- Skip when: Features with an existing start-to-finish check that has caught a real bug.
- Mode: repro, single pass, narrow scope. Needs: Repository and test runner.
- Skills: `/tdd`, `/property-based-testing`
- Related: `T02`, `T01`, `M06`

### S06 Settings that differ in production

```text
Audit settings that differ between local development, CI, preview and production. Find ambiguous fallbacks, fail-open access controls and configuration whose behavior silently changes when an environment variable is missing. Verify against the actual deployment configuration, not only README examples.
```

- Finds: Finds settings that behave differently in production than anyone expects.
- Evidence to ask for: A table of each setting per environment, the default when missing, and the behavior that changes.
- Skip when: Projects with one environment.
- Watch for: Never print secret values. The audit needs variable names and code paths, not contents.
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
Trace a change from commit to production, including builds, migrations, deployment triggers, cache refreshes, and background services. Identify every reason production might not reflect merged code.
```

- Finds: Lists every way 'merged' can fail to mean 'live'.
- Evidence to ask for: The real pipeline as steps with their config files, and for each, how it can skip or fail without anyone noticing.
- Skip when: Right after the same trace, unless the release process changed.
- Mode: read, single pass, narrow scope. Needs: Automated build and Vercel config, deployment history (read-only).
- Related: `G02`, `I05`, `PG15`

### I03 Check time that catches nothing

```text
Analyze CI and deployment costs against actual failures detected. Find repeated work, redundant checks, and expensive jobs that contribute little incremental confidence.
```

- Finds: Finds paid automated-check minutes spent on checks that never catch anything.
- Evidence to ask for: Per job: run count, minutes, failures that were real bugs, and what else would have caught them.
- Skip when: When the bills for automated checks are small and runs are fast.
- Mode: read, single pass, narrow scope. Needs: GitHub Actions run history via gh.
- Skills: `/ci-optimizer:ci-timings`, `/ci-optimizer:ci-check`
- Related: `T04`

### I04 Background jobs that hang or stop halfway

```text
Find background jobs that can block other work or leave partially updated data. Examine queues, locks, timeouts, retries, deployment behavior, and observability.
```

- Finds: Finds scheduled jobs and background workers that can hang, overlap or stop halfway.
- Evidence to ask for: Each job with its trigger, timeout, what happens if two run at once, and what happens if it dies midway.
- Skip when: Projects with no background jobs.
- Mode: read, single pass, narrow scope. Needs: Repository, the scheduled jobs in vercel.json, logs.
- Related: `R06`, `R01`, `G02`

### I05 Dashboard and repo out of sync

```text
Compare declared infrastructure configuration with the running environment and identify drift that affects reliability, security, or developer productivity.
```

- Finds: Finds where the hosting dashboard and the repo disagree.
- Evidence to ask for: Each setting declared in the repo next to its live value, with the source of each.
- Skip when: Setups that are fully managed from the repo.
- Mode: read, single pass, narrow scope. Needs: Vercel and database dashboards or MCP tools, read-only.
- Related: `S06`, `I02`

### I06 Packages nobody uses, or that work by luck

```text
Audit dependencies for packages declared but unused, imports satisfied only through transitive dependencies, and heavyweight libraries used for trivial behavior. Check build-time and runtime use, dynamic imports, tooling and security advisories before recommending removal or replacement.
```

- Finds: Finds packages nobody uses and packages that work only by accident.
- Evidence to ask for: Each package with every import site (including config files and scripts) and the bundle or install cost.
- Skip when: Right after a package cleanup.
- Watch for: Static scans flag packages as unused when they load from PostCSS, Vite or Next config, CLI scripts or file-based routing.
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

## Data integrity and analytics

Telling missing from zero, knowing where each number came from, and records whose meaning changes over time.

### D01 Missing vs zero vs stale

```text
Identify where the application confuses missing, zero, unavailable, estimated, stale, and not applicable. Trace the consequences through storage, calculations, and presentation.
```

- Finds: Finds where 'we don't know' turns into 0 and then into a wrong total.
- Evidence to ask for: Each field with how each absence state is stored, how calculations treat it, and how it displays.
- Skip when: Data with no optional values.
- Mode: read, split, wide scope. Needs: Repository and read-only database access.
- Skills: `/spec-to-code-compliance`
- Related: `R02`, `D02`, `G05`

### D02 Where did this number come from?

```text
Trace every derived metric to its raw evidence, transformation logic, assumptions, and historical version. Find calculations that cannot be independently reproduced.
```

- Finds: Checks that every number on screen can be traced back to a source document.
- Evidence to ask for: For each metric: raw inputs, formula with file:line, and an independent recomputation for one real record.
- Skip when: Numbers shown exactly as stored, with no math applied.
- Mode: read, split, wide scope. Needs: Repository, read-only database, and the source documents the numbers come from.
- Skills: `/spec-to-code-compliance`, `/dimensional-analysis`
- Related: `D01`, `D03`, `G05`, `PG01`

### D03 Old records, new meanings

```text
Find historical records whose meanings change when current classifications or schemas are applied retroactively. Identify where time-aware interpretation is necessary.
```

- Finds: Finds old records that read differently once today's rules are applied to them.
- Evidence to ask for: Each classification with when it changed, which records predate it, and how the app reads them now.
- Skip when: Data with no history or no categories.
- Mode: read, single pass, wide scope. Needs: Read-only database access, history of database changes.
- Related: `R04`, `D02`, `PG04`

### D04 Imports that fail quietly

```text
Audit data ingestion for records that could be duplicated, overwritten, silently omitted, or assigned to the wrong entity without triggering an error.
```

- Finds: Finds rows that go missing or land on the wrong record during import, with no error.
- Evidence to ask for: Each ingestion step with its matching key, conflict rule and what it logs, plus counts in versus counts stored.
- Skip when: Data that is only typed in by hand.
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
Perform a focused code-health audit calibrated to this repository's own conventions and operational risks. Require a specific file/line, reproducible command, trace or commit for every finding; grade confidence and impact; reject generic style complaints. Return a short ranked list of repairable issues rather than hundreds of speculative observations.
```

- Finds: A general health check of the code that refuses findings without evidence.
- Evidence to ask for: A ranked list of under fifteen issues, each with file:line or a command, confidence and impact.
- Skip when: When a narrower investigation above already fits the symptom.
- Mode: read, single pass, wide scope. Needs: Repository access.
- Skills: `/code-review`
- Related: `M02`, `T06`

## Agent harness and modern stack

Newer kinds of trouble: out-of-date agent instructions, old and new versions running at once after a deploy, data leaking into pages, outside services going down, rounding errors, and screens that show a change before it is saved.

### G01 Out-of-date agent instructions

```text
Compare every agent instruction and documentation file in this repository (CLAUDE.md, AGENTS.md, .cursorrules, SKILL.md, README.md, architecture docs) against the actual directory structure, package scripts, and code patterns. Identify stale rules that reference deleted paths, replaced libraries, or deprecated patterns that mislead coding agents.
```

- Finds: Finds instructions that send agents to files and patterns that no longer exist.
- Evidence to ask for: Each stale line with the file it lives in and the current fact it contradicts.
- Skip when: Right after an instruction-file cleanup.
- Mode: read, single pass, narrow scope. Needs: Repository access.
- Skills: `/retro`
- Related: `M10`

### G02 Database changes during a deploy

```text
Trace what happens during the deployment window when a new database migration or API schema change goes live while previous client bundles, active background workers, or queue consumers are still running. Identify column renames, non-nullable additions, or contract changes that break backwards compatibility before the old code finishes draining.
```

- Finds: Checks that each database change works with the old code that is still live while a release finishes.
- Evidence to ask for: Each recent migration checked against the previous release's queries, with any break shown.
- Skip when: Changes that touch neither the database layout nor how parts of the app talk to each other.
- Mode: read, single pass, narrow scope. Needs: Repository, migrations folder, previous release tag.
- Skills: `/differential-review:diff-review`
- Related: `I02`, `S06`, `PG17`

### G03 Hidden data anyone can read

```text
Inspect API responses, Server Component and SSR serialization payloads, and RPC returns crossing from server to browser. Find places where full database rows or internal objects (internal flags, other tenants' keys, audit metadata, large unused JSON columns) are serialized over the network and merely hidden in the UI.
```

- Finds: Finds data sent to the browser that the screen hides but anyone can read.
- Evidence to ask for: Each payload with the fields sent, the fields used, and any field that should never leave the server.
- Skip when: Static pages with no user data.
- Mode: read, single pass, narrow scope. Needs: Browser network panel or curl against a local server.
- Skills: `/security-review`
- Related: `T03`, `A02`

### G04 When an outside service goes down

```text
Assume each external API, LLM provider, or webhook source this application depends on either hangs for 30 seconds, returns 429 or 503 for an hour, or delivers a burst of out-of-order webhooks on recovery. Trace which transactions or connection pools are held open during external calls, and whether core journeys degrade gracefully or lock up.
```

- Finds: Asks what happens to the app when an outside API, an AI provider or a service that sends it updates goes down.
- Evidence to ask for: Each dependency with its timeout, retry policy, what is held open while waiting, and the user-visible result.
- Skip when: Features with no outside calls.
- Mode: read, single pass, wide scope. Needs: Repository; a local run with outside services made to fail on purpose.
- Skills: `/diagnosing-bugs`
- Related: `P09`, `A06`, `R02`

### G05 Rounding and unit mix-ups

```text
Trace calculations involving currency, percentages, basis points, share counts, weights, or rates across storage, transformation, and UI display. Identify where binary floating-point math is used instead of exact decimal or integer types, where premature rounding compounds across aggregations, or where scale conventions (0.05 versus 5.0 for 5%, cents versus dollars) are ambiguous across boundaries.
```

- Finds: Finds money and percentage values that change scale or lose precision along the way.
- Evidence to ask for: Each value's unit at every hop, with any hop where the unit or rounding changes.
- Skip when: Apps with no money, rates or counts.
- Mode: read, single pass, wide scope. Needs: Repository and read-only access to the database layout.
- Skills: `/dimensional-analysis`
- Related: `D02`, `D01`

### G06 Screens showing a change that was refused

```text
Trace every flow where the client updates UI state or local cache optimistically before server confirmation. Demonstrate what happens to user state, queued actions, and screen accuracy when the server rejects the mutation, times out, or returns canonical values that differ from the client's assumption.
```

- Finds: Finds screens that show a change right away and keep showing it after the server refused it.
- Evidence to ask for: Each optimistic flow with a forced rejection and a screenshot or test of what the screen then shows.
- Skip when: Flows that wait for the server before updating the screen.
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
Find animations and transitions that make the browser run layout or heavy paint on every frame: width, height, top, left, margin, padding, large shadows and blurs, and anything driven from a scroll or pointer handler through component state. For the worst three, measure the interaction in a browser with CPU throttling and report how many layouts and long frames happen during it. Propose the cheaper equivalent for each (transform, opacity, or a single measured move) and say what would look different.
```

- Finds: Finds the animations that stutter on slower phones and laptops, and what each one costs.
- Evidence to ask for: Each candidate with file:line and the property involved; for the worst three, a throttled recording with the layout count and the frames over budget, taken before any change.
- Skip when: When motion is limited to color and opacity changes on small elements.
- Watch for: Static reading flags every height transition. A small accordion is fine; ask for the measurement before any rewrite.
- Mode: read, split, wide scope. Needs: Repository; the app running locally and a browser with performance tooling (DevTools or Playwright).
- Skills: `/motion`
- Related: `MO01`, `MO04`, `P01`

### MO03 Motion with no off switch

```text
Check how this app behaves for people who have asked their system for reduced motion. List every animation that moves, scales, rotates or loops, and say whether it has a reduced-motion version. Find content that only becomes visible through an animation, motion that starts on its own and runs longer than five seconds with no pause control, and gestures with no button or keyboard alternative. For each gap, say what the reduced version should be: usually a short fade or an instant change that keeps the meaning.
```

- Finds: Finds motion that can make people dizzy or lock them out, and content that disappears when animation is turned off.
- Evidence to ask for: A list of moving animations with file:line and whether each has a reduced version; a browser run with reduced motion emulated showing what still moves; the WCAG criterion behind each gap (2.2.2, 2.3.1, 2.3.3, 2.5.1 or 2.5.7).
- Skip when: Internal prototypes nobody else will use.
- Watch for: Agents add one global rule that zeroes every duration and call it done. That is a floor. Ask what each large movement becomes instead.
- Mode: read, single pass, wide scope. Needs: Repository; a browser that can emulate prefers-reduced-motion.
- Skills: `/motion`
- Related: `MO02`, `MO05`

### MO04 Animations that restart, block or never finish

```text
Find animations that break when the user does not wait for them. Look for keyframe animations on things that can be triggered twice in a row, exits that never play because the element is removed first, input ignored until an animation ends, focus that moves only after an animation, and end states that differ from the element's resting style. Reproduce the three most reachable cases by triggering the interaction again mid-animation, and propose the smallest fix for each.
```

- Finds: Finds motion that works in a demo and breaks under fast, real use.
- Evidence to ask for: Each case with file:line, the sequence of inputs that triggers it, and what the user sees: a restart, a jump, an ignored click or a missing exit.
- Skip when: Apps whose only motion is hover and focus color.
- Mode: repro, split, wide scope. Needs: Repository; the app running locally with a browser to trigger interactions quickly.
- Skills: `/motion`
- Related: `MO02`, `MO06`

### MO05 Motion with no job

```text
Go through every animation in this product and say what it tells the user: that their input registered, where something came from or went, where they now are, that work is in progress, or that one thing changed. List the ones that tell the user nothing, and the ones seen so often that they slow people down (tooltips, menus, anything triggered from the keyboard). For each, recommend removing it, shortening it or keeping it, with one sentence of reasoning. Do not propose new animations.
```

- Finds: Produces a list of animations to delete or shorten, which is usually the cheapest way to make an app feel faster.
- Evidence to ask for: One row per animation: where it is (file:line), how often a person meets it in a day, the job it does or "none", and remove, shorten or keep.
- Skip when: Apps with almost no motion. Look for missing feedback instead (MO06).
- Watch for: Agents defend every animation as polish. Ask what the user learns from it; if the answer is nothing, it goes.
- Mode: read, single pass, wide scope. Needs: Repository; the running app helps.
- Skills: `/motion`
- Related: `MO01`, `MO06`

### MO06 State changes with no feedback

```text
Walk the main flows of this app and list every moment where the interface changes with no visible answer or explanation: a press with no pressed state, an item that vanishes on delete, a panel that appears with no sign of where it came from, a page change with no sense of direction, a wait of more than a second with no indicator. For each, say what the user is left guessing, and specify the smallest motion that would answer it: what changes, for how long, and what happens with reduced motion. Leave out anything the user triggers many times a minute.
```

- Finds: Finds the few places where a small animation would remove real confusion.
- Evidence to ask for: Each moment with its flow, the component (file:line), what the user is left guessing, and a one-line spec for the motion.
- Skip when: Right after a motion pass, or when the complaint is that the app already moves too much (MO05).
- Watch for: Agents add an animation to every state change. Ask for ten at most, ranked by how confusing the moment is without one.
- Mode: read, single pass, narrow scope. Needs: Repository and the running app.
- Skills: `/motion`
- Related: `MO05`, `MO04`
