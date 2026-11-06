# Investigations

Generated from the Agent Engineering Field Guide by `scripts/build_references.cjs`; do not edit by hand.

Each one is a prompt to paste into a fresh agent session. `mode` is the default wrapper from start-here.md (read: read-only; repro: may add a failing test or script). `split` means run it as two passes, find then verify, rather than one long session.

## Architecture and hidden complexity

Where the shape of the code makes bugs likely: scattered state, drifting meaning, layers that cost more than they give.

### A01 Implicit state machines

```text
Find every implicit state machine in this application. Identify where states, transitions, and invalid combinations are scattered across flags, conditionals, and components.
```

- Finds: Finds features whose real states live in a pile of booleans, where impossible combinations become reachable.
- Evidence to ask for: A list of states and transitions per feature, each with file:line, plus one reachable invalid combination shown concretely.
- Skip when: Small features with one status field that is already an enum and checked in one place.
- Watch for: Agents tend to list every boolean as a state. Ask which combinations are reachable and which are only theoretical.
- Mode: read, split, wide scope. Needs: Repository access only.
- Skills: `/improve-codebase-architecture`, `/grill-me`
- Related: `A06`, `G06`, `R03`

### A02 Semantic drift through the stack

```text
Trace the same business concept across the entire stack. Find places where its meaning, representation, or validation changes between the UI, API, database, and background jobs.
```

- Finds: Shows where one word (a task, a fund, a run) means slightly different things in different layers.
- Evidence to ask for: One table per concept: layer, type or column, validation rule, file:line. Mismatches marked.
- Skip when: Concepts that only live in one layer.
- Watch for: This is an unbounded trace. Name one concept up front or it will wander.
- Mode: read, split, wide scope. Needs: Repository and read-only database schema access.
- Skills: `/grill-with-docs`, `/spec-to-code-compliance`
- Related: `D01`, `D03`, `G03`

### A03 Abstractions past their usefulness

```text
Identify abstractions that no longer earn their complexity. Find wrappers, factories, inheritance, and generic utilities that make the application harder to understand than a simpler implementation would.
```

- Finds: Finds layers you could delete so the code, and the agents reading it, get simpler.
- Evidence to ask for: For each candidate: callers count, what deleting it would move where (the deletion test), and what tests would change.
- Skip when: Right after a refactor, or when the abstraction isolates a third-party SDK.
- Watch for: Agents call thin adapters redundant when they exist to isolate an unstable SDK or give tests a seam.
- Mode: read, single pass, wide scope. Needs: Repository access only.
- Skills: `/improve-codebase-architecture`, `/simplify`
- Related: `A05`, `M04`

### A04 Competing sources of truth

```text
Find places where two systems can disagree about the same truth. Trace their ownership, synchronization, cache invalidation, and recovery behavior.
```

- Finds: Finds data held in two places (a cache and a table, a client and a server) that can quietly disagree.
- Evidence to ask for: Pairs of stores with the field, who writes each, how they sync, and a sequence of events that makes them diverge.
- Skip when: Read-only mirrors that are rebuilt from scratch on every load.
- Watch for: undefined
- Mode: read, split, wide scope. Needs: Repository and read-only database access.
- Skills: `/audit-context-building`
- Related: `R05`, `G06`, `D02`

### A05 Obsolete architectural assumptions

```text
Look for architectural decisions that were reasonable when this project was smaller but are now liabilities. Distinguish actual problems from stylistic preferences.
```

- Finds: Separates choices that now cost real time or bugs from ones that are only out of fashion.
- Evidence to ask for: Each decision with the original reason, the current cost (incidents, workarounds, slow paths) and evidence for that cost.
- Skip when: Projects younger than a few months.
- Watch for: undefined
- Mode: read, single pass, wide scope. Needs: Repository, git history.
- Skills: `/improve-codebase-architecture`
- Related: `A03`, `P05`

### A06 Implicit ordering contracts

```text
Identify asynchronous operations whose correctness depends on events happening in a particular order without an explicit guarantee. Trace the scheduling, retries, cancellation, and conflicting writes; reproduce the highest-risk cases and propose the smallest enforceable contract.
```

- Finds: Finds code that only works because things usually happen in the right order.
- Evidence to ask for: The assumed order, what can reorder it (retry, webhook, slow network), and a reproduction for the worst case.
- Skip when: Strictly sequential scripts with no concurrency.
- Watch for: undefined
- Mode: repro, split, wide scope. Needs: Repository; a way to run the code locally for the reproduction.
- Skills: `/diagnosing-bugs`
- Related: `R05`, `A01`, `G04`

### A07 Side-effect and resource ownership

```text
Map external side effects and resource lifecycles across this application: connections, subscriptions, listeners, timers, streams, cache entries and background workers. Find unclear ownership, incomplete cleanup and operations that outlive their intended scope. Prioritize evidenced leaks or correctness risks over stylistic patterns.
```

- Finds: Finds timers, listeners and connections nobody clearly owns or closes.
- Evidence to ask for: Each resource with where it is created, who should release it, and the path where it is not released.
- Skip when: Short-lived scripts and serverless handlers with no long-lived state.
- Watch for: undefined
- Mode: read, single pass, wide scope. Needs: Repository access; heap snapshots help confirm.
- Skills: `/audit-context-building`
- Related: `P07`, `R06`

## Performance and scale

Where time and money go as data grows. Every claim here needs a measurement, before and after.

### P01 Expensive journeys

```text
Trace the five most expensive user journeys from browser interaction to database response. Find unnecessary round trips, waterfalls, serialization, and repeated computations, and measure their contribution to latency.
```

- Finds: Shows where the seconds go on the paths people actually use.
- Evidence to ask for: A timed trace per journey (browser network panel, server timing, query time) with each step's share of the total.
- Skip when: When nobody has reported slowness and costs are flat.
- Watch for: Static reading guesses at latency. Require a measured trace before any ranking.
- Mode: read, split, wide scope. Needs: Browser DevTools or Playwright traces, server logs or timing headers, EXPLAIN on the queries.
- Skills: `/diagnosing-bugs`
- Related: `P02`, `P03`, `M08`

### P02 Sequential asynchronous work

```text
Find all hot paths where independent asynchronous operations run sequentially. Establish which can safely run concurrently without violating ordering, rate limits, or transaction boundaries.
```

- Finds: Finds awaits that wait on each other for no reason.
- Evidence to ask for: Each chain with the operations, why they are independent, and a before/after timing on a realistic input.
- Skip when: Paths that run once a day or already finish in a few milliseconds.
- Watch for: Agents wrap awaits in Promise.all without noticing they share one database transaction or hit a rate-limited API. Check transactions, rate limits and pool sizes before changing anything.
- Mode: read, single pass, narrow scope. Needs: Repository; a timing harness for the after measurement.
- Skills: `/diagnosing-bugs`
- Related: `P09`, `A06`, `M08`

### P03 Query scaling

```text
Find database queries whose cost grows disproportionately with records, tenants, or relationships. Examine execution plans, indexes, joins, pagination, and application-side filtering.
```

- Finds: Finds the queries that will be the first to hurt as tables grow.
- Evidence to ask for: EXPLAIN ANALYZE output for each suspect query at realistic row counts, plus the index or rewrite and its new plan.
- Skip when: Tables that will stay small (settings, lookup lists).
- Watch for: undefined
- Mode: read, single pass, narrow scope. Needs: Read-only database access with EXPLAIN. Neon or Supabase branch for anything heavier.
- Related: `P01`, `P05`, `P06`

### P04 Repeated expensive work

```text
Identify expensive work that is repeated despite unchanged inputs. Investigate caching, memoization, batch operations, and incremental computation before recommending changes.
```

- Finds: Finds work recomputed on every request or render when its inputs did not change.
- Evidence to ask for: The operation, how often it runs, how often its inputs change, and its measured cost.
- Skip when: Work that is already cheap, where a cache would add invalidation risk for little gain.
- Watch for: A cache is a second source of truth. Any cache proposal must say who invalidates it and when.
- Mode: read, single pass, wide scope. Needs: Profiler or request logs to count repeats.
- Related: `A04`, `P01`

### P05 Tenfold growth stress

```text
Investigate what happens when this application's data volume and concurrent users increase tenfold. Identify the first likely bottlenecks using evidence from its current design.
```

- Finds: Names the first thing to break if the project takes off, before it does.
- Evidence to ask for: Current sizes and rates, the projected tenfold numbers, and the limit each bottleneck hits (pool size, plan limit, query cost).
- Skip when: Products with no growth in sight; revisit quarterly.
- Watch for: undefined
- Mode: read, single pass, wide scope. Needs: Database stats, hosting plan limits, current traffic numbers.
- Related: `P03`, `P09`

### P06 Growth complexity analysis

```text
Identify potentially quadratic or worse operations in frequently used code paths, including nested joins in application memory, copy-on-every-iteration patterns and repeated scans. Determine realistic input sizes and benchmark the highest-impact candidates before changing their algorithms.
```

- Finds: Finds loops inside loops that are fine at 50 rows and painful at 50,000.
- Evidence to ask for: Each candidate with realistic input size and a benchmark at that size; ignore candidates whose real inputs stay small.
- Skip when: Code whose inputs are bounded and small by design.
- Watch for: Static scanners flag nested loops over tiny arrays. Without real sizes the list is mostly noise.
- Mode: read, single pass, narrow scope. Needs: A benchmark harness. The experimental agent-complexity-optimizer scanner can suggest candidates.
- Related: `P03`, `M08`

### P07 Allocation and memory retention

```text
Investigate sustained memory growth and allocation pressure. Look for unbounded caches, retained closures, unremoved listeners, large error objects, detached DOM references and accidentally retained request data. Use heap profiles or repeatable growth tests to validate candidates.
```

- Finds: Finds why a page or process gets slower or crashes the longer it runs.
- Evidence to ask for: Two heap snapshots over a repeated action, with the growing object type and what retains it.
- Skip when: When memory is flat over a long session.
- Watch for: undefined
- Mode: read, single pass, narrow scope. Needs: Chrome DevTools heap snapshots or Node --inspect.
- Skills: `/diagnosing-bugs`
- Related: `A07`

### P08 Event loop and blocking I/O

```text
Find synchronous work performed in latency-sensitive asynchronous handlers, including filesystem operations, parsing, compression, large serialization and CPU-heavy transforms. Measure event-loop impact and identify safe offloading, batching or scheduling fixes.
```

- Finds: Finds one slow synchronous step that stalls every other request.
- Evidence to ask for: Event-loop delay or long-task measurements tied to the specific handler.
- Skip when: Background scripts where nothing else shares the process.
- Watch for: undefined
- Mode: read, single pass, narrow scope. Needs: Node profiler or browser Performance panel.
- Related: `P01`, `P04`

### P09 Concurrency boundedness

```text
Examine places where work is parallelized or queued without explicit limits. Find cases where a speed optimization could overwhelm rate limits, memory, connection pools or a downstream service; propose and test concurrency bounds with realistic load.
```

- Finds: Finds parallel work with no ceiling that can flood a pool or an API.
- Evidence to ask for: Each fan-out with its maximum width at realistic input, the downstream limit, and a load test with a bound.
- Skip when: Fan-outs over a fixed, small list.
- Watch for: undefined
- Mode: read, single pass, narrow scope. Needs: Repository; a load script against a non-production target.
- Related: `P02`, `G04`

## Correctness and reliability

What happens on retry, failure, timeout and bad timing, and whether users can tell a fallback from the truth.

### R01 Retry and idempotency failures

```text
Find operations that cannot safely be retried. Examine duplicate events, partial failures, idempotency, transaction boundaries, and recovery from interrupted execution.
```

- Finds: Finds actions that do damage when they run twice: double sends, double charges, duplicate rows.
- Evidence to ask for: Each operation with its trigger, what a second run does, and whether a key or constraint prevents it.
- Skip when: Pure reads.
- Watch for: undefined
- Mode: read, split, wide scope. Needs: Repository and read-only database schema.
- Skills: `/diagnosing-bugs`
- Related: `R05`, `R06`, `D04`

### R02 Misleading fallbacks

```text
Trace every place the application silently substitutes a default, null, stale value, or empty result when something fails. Determine whether users could mistake the fallback for valid information.
```

- Finds: Finds screens that show a confident zero or an empty list when the real answer is 'we could not load this'.
- Evidence to ask for: Each fallback with its trigger, what the user sees, and whether anything tells them it is a fallback.
- Skip when: Fallbacks that are already labelled in the UI.
- Watch for: undefined
- Mode: read, single pass, wide scope. Needs: Repository; the app running to see what users see.
- Skills: `/insecure-defaults:audit`
- Related: `D01`, `T05`, `S06`

### R03 Unenforced invariants

```text
Identify business invariants the system assumes but never enforces. Find the appropriate enforcement point and develop tests that attempt to violate them.
```

- Finds: Finds the rules everyone assumes (one owner per task, no negative balance) that nothing actually checks.
- Evidence to ask for: Each invariant, where it is assumed, where it could be enforced (constraint, schema, server check) and a test that breaks it today.
- Skip when: Invariants already backed by database constraints.
- Watch for: undefined
- Mode: repro, single pass, wide scope. Needs: Repository; a test database or branch.
- Skills: `/property-based-testing`, `/tdd`
- Related: `A01`, `T02`

### R04 Time handling

```text
Analyze the system's handling of time: time zones, daylight saving, expiration, scheduled jobs, clock differences, and historical as-of queries.
```

- Finds: Finds the date bugs that show up twice a year, at midnight, or in another time zone.
- Evidence to ask for: Each time-sensitive path with the zone it assumes, and a test at a DST boundary and at midnight in Memphis and UTC.
- Skip when: Features that never show or compare dates.
- Watch for: undefined
- Mode: repro, single pass, wide scope. Needs: Repository; tests with a pinned clock.
- Skills: `/property-based-testing`
- Related: `D03`

### R05 Races and stale writes

```text
Find race conditions and out-of-order updates across background jobs, UI mutations, caches, webhooks, and database writes. Prove suspected problems with reproducible cases.
```

- Finds: Finds updates that overwrite newer data because two things wrote at once.
- Evidence to ask for: A reproduction for each race (a script or test that loses an update) rather than a theory.
- Skip when: Single-writer data.
- Watch for: Agents list theoretical races freely. Count only the ones with a reproduction.
- Mode: repro, split, wide scope. Needs: Repository; a local or branch database for the reproduction.
- Skills: `/diagnosing-bugs`
- Related: `A06`, `A04`, `R01`

### R06 Partial resource cleanup on failure

```text
Trace error, timeout and cancellation paths for transactions, locks, file handles, temporary files, worker jobs and network connections. Identify paths that leave resources held or state half-committed, and demonstrate them with controlled failure injection where practical.
```

- Finds: Finds what is left behind when something fails halfway.
- Evidence to ask for: Each failure path with the resource left held, shown by injecting the failure.
- Skip when: Code with no resources beyond a single request.
- Watch for: undefined
- Mode: repro, single pass, wide scope. Needs: Repository; ability to inject errors in tests.
- Skills: `/diagnosing-bugs`
- Related: `A07`, `R01`, `I04`

## Testing and security

What the tests actually prove, and where outside input reaches something sensitive.

### T01 False confidence from unit tests

```text
Find critical user journeys that have extensive unit-test coverage but insufficient evidence that they work end to end. Strengthen the smallest set of tests that closes the real gaps.
```

- Finds: Finds features that are green in CI and still break for real people.
- Evidence to ask for: Each journey with what the tests cover, what they skip (real auth, real DB, real browser), and the one added check.
- Skip when: Journeys already covered by a browser test.
- Watch for: undefined
- Mode: repro, single pass, wide scope. Needs: Playwright or the in-app browser for the end-to-end check.
- Skills: `/tdd`
- Related: `T02`, `T06`, `I02`

### T02 Tests that cannot fail meaningfully

```text
Find tests that would continue passing if the underlying feature stopped working. Examine mocks, fixtures, assertions, and tests that merely reproduce implementation details.
```

- Finds: Finds tests that pass no matter what.
- Evidence to ask for: For each suspect test, break the feature on purpose and show the test still passes.
- Skip when: Brand-new suites written test-first.
- Watch for: undefined
- Mode: repro, single pass, wide scope. Needs: Repository and the test runner.
- Skills: `/property-based-testing`, `/tdd`
- Related: `T06`, `T01`

### T03 Input-to-sensitive-operation tracing

```text
Trace every external input from entry point to sensitive operation. Investigate authorization gaps, injection risks, unsafe parsing, and tenant isolation failures.
```

- Finds: Follows untrusted input to the places it can do harm.
- Evidence to ask for: Each path: entry point, checks along the way, sensitive operation, and the missing check if any, with file:line.
- Skip when: Never skip for anything that holds other people's data or money.
- Watch for: undefined
- Mode: read, split, wide scope. Needs: Repository access.
- Skills: `/security-review`, `/audit-context-building`, `/differential-review:diff-review`
- Related: `T05`, `S06`, `G03`

### T04 Supply-chain exposure

```text
Review dependency and CI supply-chain exposure: install scripts, untrusted pull requests, privileged tokens, outdated packages, and unsafe automation permissions.
```

- Finds: Checks what a malicious package or pull request could reach.
- Evidence to ask for: Advisories matched to installed versions, install scripts present, workflow permissions and which secrets each job can read.
- Skip when: Rarely; run after adding dependencies or CI jobs.
- Watch for: undefined
- Mode: read, single pass, narrow scope. Needs: Lockfile, CI workflow files, npm audit or the auditor skill.
- Skills: `/supply-chain-risk-auditor`, `/agentic-actions-auditor`, `/ci-optimizer:ci-check`
- Related: `I06`, `I03`

### T05 Fail-open security paths

```text
Search for security-sensitive behavior that fails open when configuration is missing, an authorization service fails, or a request is malformed.
```

- Finds: Finds checks that let people in when something goes wrong.
- Evidence to ask for: Each check with what happens on missing config, thrown error and malformed input, shown with a request or test.
- Skip when: Never skip for sign-in, keys or owner checks.
- Watch for: undefined
- Mode: read, single pass, narrow scope. Needs: Repository; the app running locally in demo mode.
- Skills: `/insecure-defaults:audit`, `/sharp-edges`
- Related: `S06`, `T03`, `R02`

### T06 Test claims versus real evidence

```text
Choose critical features and ask what the existing tests truly prove. Identify mocks that bypass important integration behavior, assertions that cannot fail meaningfully, and tests that reproduce the implementation's assumptions. Produce the smallest independent check that catches a real regression.
```

- Finds: Asks what each test really proves, then adds one check that would catch a real regression.
- Evidence to ask for: For each feature, the claim the tests make, what they actually exercise, and a new check that fails when the feature is broken.
- Skip when: Features with an existing end-to-end check that has caught a real bug.
- Watch for: undefined
- Mode: repro, single pass, narrow scope. Needs: Repository and test runner.
- Skills: `/tdd`, `/property-based-testing`
- Related: `T02`, `T01`, `M06`

### S06 Configuration and secure default drift

```text
Audit settings that differ between local development, CI, preview and production. Find ambiguous fallbacks, fail-open access controls and configuration whose behavior silently changes when an environment variable is missing. Verify against the actual deployment configuration, not only README examples.
```

- Finds: Finds settings that behave differently in production than anyone expects.
- Evidence to ask for: A table of each setting per environment, the default when missing, and the behavior that changes.
- Skip when: Projects with one environment.
- Watch for: Never print secret values. The audit needs variable names and code paths, not contents.
- Mode: read, single pass, narrow scope. Needs: Vercel env listing (names only, never values), CI config, the code that reads each variable.
- Skills: `/insecure-defaults:audit`
- Related: `T05`, `I05`, `G02`

## Infrastructure and environment

The path from merge to production, the cost of CI, and the machine the agents run on.

### I01 Toolchain and cache hygiene

```text
Inventory the development environment's browser runtimes, caches, SDKs, package managers, and duplicate installations. Identify obsolete or wasteful components, assess dependencies, and propose a safe cleanup.
```

- Finds: Finds disk and confusion spent on duplicate SDKs and stale caches on this Mac.
- Evidence to ask for: Each component with size, version, what depends on it, and whether deleting it is safe and reversible.
- Skip when: When disk is fine and builds are stable.
- Watch for: Treat every deletion as a proposal. Shared runtimes break other apps silently.
- Mode: read, single pass, narrow scope. Needs: Shell on this Mac.
- Related: `I07`

### I02 Merge-to-production trace

```text
Trace a change from commit to production, including builds, migrations, deployment triggers, cache refreshes, and background services. Identify every reason production might not reflect merged code.
```

- Finds: Lists every way 'merged' can fail to mean 'live'.
- Evidence to ask for: The real pipeline as steps with their config files, and for each, how it can skip or fail without anyone noticing.
- Skip when: Right after the same trace, unless the pipeline changed.
- Watch for: undefined
- Mode: read, single pass, narrow scope. Needs: CI and Vercel config, deployment history (read-only).
- Related: `G02`, `I05`

### I03 CI cost versus confidence

```text
Analyze CI and deployment costs against actual failures detected. Find repeated work, redundant checks, and expensive jobs that contribute little incremental confidence.
```

- Finds: Finds CI minutes spent on checks that never catch anything.
- Evidence to ask for: Per job: run count, minutes, failures that were real bugs, and what else would have caught them.
- Skip when: When CI bills are small and runs are fast.
- Watch for: undefined
- Mode: read, single pass, narrow scope. Needs: GitHub Actions run history via gh.
- Skills: `/ci-optimizer:ci-timings`, `/ci-optimizer:ci-check`
- Related: `T04`

### I04 Blocking and partial background jobs

```text
Find background jobs that can block other work or leave partially updated data. Examine queues, locks, timeouts, retries, deployment behavior, and observability.
```

- Finds: Finds crons and workers that can hang, overlap or stop halfway.
- Evidence to ask for: Each job with its trigger, timeout, what happens if two run at once, and what happens if it dies midway.
- Skip when: Projects with no background jobs.
- Watch for: undefined
- Mode: read, single pass, narrow scope. Needs: Repository, vercel.json crons, logs.
- Related: `R06`, `R01`, `G02`

### I05 Infrastructure drift

```text
Compare declared infrastructure configuration with the running environment and identify drift that affects reliability, security, or developer productivity.
```

- Finds: Finds where the dashboard and the repo disagree.
- Evidence to ask for: Each setting declared in the repo next to its live value, with the source of each.
- Skip when: Infrastructure that is fully managed from the repo.
- Watch for: undefined
- Mode: read, single pass, narrow scope. Needs: Vercel and database dashboards or MCP tools, read-only.
- Related: `S06`, `I02`

### I06 Ghost and phantom dependencies

```text
Audit dependencies for packages declared but unused, imports satisfied only through transitive dependencies, and heavyweight libraries used for trivial behavior. Check build-time and runtime use, dynamic imports, tooling and security advisories before recommending removal or replacement.
```

- Finds: Finds packages nobody uses and packages that work only by accident.
- Evidence to ask for: Each package with every import site (including config files and scripts) and the bundle or install cost.
- Skip when: Right after a dependency cleanup.
- Watch for: Static scans flag packages as unused when they load from PostCSS, Vite or Next config, CLI scripts or file-based routing.
- Mode: read, single pass, narrow scope. Needs: Repository; a dependency checker such as knip or depcheck if already present.
- Skills: `/supply-chain-risk-auditor`
- Related: `T04`

### I07 Runtime inventory and support lifecycle

```text
Inventory actual versions and dependencies of Playwright, Puppeteer, system Chrome, Chromium caches and Electron apps. Verify current vendor-supported and security-fix thresholds rather than trusting hard-coded version numbers. Distinguish safe disposable caches from app-owned runtimes and report the rollback path before any cleanup.
```

- Finds: The safe version of the viral 'delete old Chromium builds' prompt.
- Evidence to ask for: Each runtime with version, owner app, support status from the vendor, size, and a rollback path.
- Skip when: When browser tests are stable and disk is fine.
- Watch for: Do not delete shared runtimes or force a system Chrome until every dependent app is known.
- Mode: read, single pass, narrow scope. Needs: Shell on this Mac; vendor release pages.
- Related: `I01`

## Data integrity and analytics

Missing versus zero, where numbers come from, and records whose meaning shifts over time.

### D01 Missing versus zero versus stale

```text
Identify where the application confuses missing, zero, unavailable, estimated, stale, and not applicable. Trace the consequences through storage, calculations, and presentation.
```

- Finds: Finds where 'we don't know' turns into 0 and then into a wrong total.
- Evidence to ask for: Each field with how each absence state is stored, how calculations treat it, and how it displays.
- Skip when: Data with no optional values.
- Watch for: undefined
- Mode: read, split, wide scope. Needs: Repository and read-only database access.
- Skills: `/spec-to-code-compliance`
- Related: `R02`, `D02`, `G05`

### D02 Derived-metric provenance

```text
Trace every derived metric to its raw evidence, transformation logic, assumptions, and historical version. Find calculations that cannot be independently reproduced.
```

- Finds: Checks that every number on screen can be traced back to a source document.
- Evidence to ask for: For each metric: raw inputs, formula with file:line, and an independent recomputation for one real record.
- Skip when: Metrics that are raw values with no transformation.
- Watch for: undefined
- Mode: read, split, wide scope. Needs: Repository, read-only database, the source filings.
- Skills: `/spec-to-code-compliance`, `/dimensional-analysis`
- Related: `D01`, `D03`, `G05`

### D03 Historically changing meaning

```text
Find historical records whose meanings change when current classifications or schemas are applied retroactively. Identify where time-aware interpretation is necessary.
```

- Finds: Finds old records that read differently once today's rules are applied to them.
- Evidence to ask for: Each classification with when it changed, which records predate it, and how the app reads them now.
- Skip when: Data with no history or no classifications.
- Watch for: undefined
- Mode: read, single pass, wide scope. Needs: Read-only database access, migration history.
- Related: `R04`, `D02`

### D04 Silent ingestion errors

```text
Audit data ingestion for records that could be duplicated, overwritten, silently omitted, or assigned to the wrong entity without triggering an error.
```

- Finds: Finds rows that go missing or land on the wrong entity without an error.
- Evidence to ask for: Each ingestion step with its matching key, conflict rule and what it logs, plus counts in versus counts stored.
- Skip when: Manual entry only.
- Watch for: undefined
- Mode: read, single pass, narrow scope. Needs: Repository, ingestion logs, read-only database.
- Related: `R01`, `D05`

### D05 Relationship and historical value

```text
Identify where data relationships have greater analytical value than isolated fields. Find missing links, broken historical continuity, and relationships the source evidence cannot actually support.
```

- Finds: Finds links between entities worth adding, and ones the evidence does not support.
- Evidence to ask for: Each relationship with its source evidence, current coverage, and gaps.
- Skip when: When the data model is still changing weekly.
- Watch for: undefined
- Mode: read, single pass, wide scope. Needs: Read-only database access, source documents.
- Skills: `/grill-with-docs`
- Related: `D04`, `D03`

### D06 Evidence-required code-health audit

```text
Perform a focused code-health audit calibrated to this repository's own conventions and operational risks. Require a specific file/line, reproducible command, trace or commit for every finding; grade confidence and impact; reject generic style complaints. Return a short ranked list of repairable issues rather than hundreds of speculative observations.
```

- Finds: A general health check that refuses findings without evidence.
- Evidence to ask for: A ranked list of under fifteen issues, each with file:line or a command, confidence and impact.
- Skip when: When a narrower investigation above already fits the symptom.
- Watch for: undefined
- Mode: read, single pass, wide scope. Needs: Repository access.
- Skills: `/code-review`
- Related: `M02`, `T06`

## Agent harness and modern stack

Newer failure modes: stale agent instructions, deploy skew, payload leaks, provider outages, precision and optimistic UI.

### G01 Context-file drift

```text
Compare every agent instruction and documentation file in this repository (CLAUDE.md, AGENTS.md, .cursorrules, SKILL.md, README.md, architecture docs) against the actual directory structure, package scripts, and code patterns. Identify stale rules that reference deleted paths, replaced libraries, or deprecated patterns that mislead coding agents.
```

- Finds: Finds instructions that send agents to files and patterns that no longer exist.
- Evidence to ask for: Each stale line with the file it lives in and the current fact it contradicts.
- Skip when: Right after an instruction-file cleanup.
- Watch for: undefined
- Mode: read, single pass, narrow scope. Needs: Repository access.
- Skills: `/retro`
- Related: `M10`

### G02 Migration and rolling-deploy skew

```text
Trace what happens during the deployment window when a new database migration or API schema change goes live while previous client bundles, active background workers, or queue consumers are still running. Identify column renames, non-nullable additions, or contract changes that break backwards compatibility before the old code finishes draining.
```

- Finds: Checks that each migration works with the code that is still live while the deploy finishes.
- Evidence to ask for: Each recent migration checked against the previous release's queries, with any break shown.
- Skip when: Changes with no schema or API contract change.
- Watch for: undefined
- Mode: read, single pass, narrow scope. Needs: Repository, migrations folder, previous release tag.
- Skills: `/differential-review:diff-review`
- Related: `I02`, `S06`

### G03 Wire-boundary over-fetching

```text
Inspect API responses, Server Component and SSR serialization payloads, and RPC returns crossing from server to browser. Find places where full database rows or internal objects (internal flags, other tenants' keys, audit metadata, large unused JSON columns) are serialized over the network and merely hidden in the UI.
```

- Finds: Finds data sent to the browser that the UI hides but anyone can read.
- Evidence to ask for: Each payload with the fields sent, the fields used, and any field that should never leave the server.
- Skip when: Static pages with no user data.
- Watch for: undefined
- Mode: read, single pass, narrow scope. Needs: Browser network panel or curl against a local server.
- Skills: `/security-review`
- Related: `T03`, `A02`

### G04 Third-party outage blast radius

```text
Assume each external API, LLM provider, or webhook source this application depends on either hangs for 30 seconds, returns 429 or 503 for an hour, or delivers a burst of out-of-order webhooks on recovery. Trace which transactions or connection pools are held open during external calls, and whether core journeys degrade gracefully or lock up.
```

- Finds: Asks what happens to the app when Google, the AI Gateway or a webhook source goes down.
- Evidence to ask for: Each dependency with its timeout, retry policy, what is held open while waiting, and the user-visible result.
- Skip when: Features with no outside calls.
- Watch for: undefined
- Mode: read, single pass, wide scope. Needs: Repository; fault injection in a local run.
- Skills: `/diagnosing-bugs`
- Related: `P09`, `A06`, `R02`

### G05 Numerical precision and unit drift

```text
Trace calculations involving currency, percentages, basis points, share counts, weights, or rates across storage, transformation, and UI display. Identify where binary floating-point math is used instead of exact decimal or integer types, where premature rounding compounds across aggregations, or where scale conventions (0.05 versus 5.0 for 5%, cents versus dollars) are ambiguous across boundaries.
```

- Finds: Finds money and percentage values that change scale or lose precision along the way.
- Evidence to ask for: Each value's unit at every hop, with any hop where the unit or rounding changes.
- Skip when: Apps with no money, rates or counts.
- Watch for: undefined
- Mode: read, single pass, wide scope. Needs: Repository and read-only database schema.
- Skills: `/dimensional-analysis`
- Related: `D02`, `D01`

### G06 Optimistic UI rollback failure

```text
Trace every flow where the client updates UI state or local cache optimistically before server confirmation. Demonstrate what happens to user state, queued actions, and screen accuracy when the server rejects the mutation, times out, or returns canonical values that differ from the client's assumption.
```

- Finds: Finds screens that keep showing a change the server refused.
- Evidence to ask for: Each optimistic flow with a forced rejection and a screenshot or test of what the screen then shows.
- Skip when: Flows that wait for the server before updating.
- Watch for: undefined
- Mode: repro, single pass, narrow scope. Needs: In-app browser or Playwright with request interception.
- Skills: `/diagnosing-bugs`
- Related: `A04`, `A01`
