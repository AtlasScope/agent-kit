# Prompt Library

252 prompts, commands and recipes for coding and design agents. Open prompt-library.html for search, stars and the prompt composer.

## Investigations

### Architecture and hidden complexity

**A01 · Status hidden in a pile of flags** Finds features whose real status is spread across a pile of yes/no flags, so combinations that should be impossible can happen.

```text
Find every implicit state machine in this application. Identify where states, transitions, and invalid combinations are scattered across flags, conditionals, and components.
```

**A02 · Meaning drift across the stack** Shows where one word (a task, a fund, a run) means slightly different things in different parts of the app.

```text
Trace the same business concept across the entire stack. Find places where its meaning, representation, or validation changes between the UI, API, database, and background jobs.
```

**A03 · Layers that don't earn their keep** Finds extra layers of code you could delete so the code, and the agents reading it, get simpler.

```text
Identify abstractions that no longer earn their complexity. Find wrappers, factories, inheritance, and generic utilities that make the application harder to understand than a simpler implementation would.
```

**A04 · Two systems that disagree** Finds data kept in two places (a saved copy and a table, the browser and the server) that can quietly disagree.

```text
Find places where two systems can disagree about the same truth. Trace their ownership, synchronization, cache invalidation, and recovery behavior.
```

**A05 · Old design choices that now cost you** Separates old design choices that now cost real time or bugs from ones that are only out of fashion.

```text
Look for architectural decisions that were reasonable when this project was smaller but are now liabilities. Distinguish actual problems from stylistic preferences.
```

**A06 · Code that relies on lucky timing** Finds code that only works because things usually happen in the right order.

```text
Identify asynchronous operations whose correctness depends on events happening in a particular order without an explicit guarantee. Trace the scheduling, retries, cancellation, and conflicting writes; reproduce the highest-risk cases and propose the smallest enforceable contract.
```

**A07 · Timers and connections nobody closes** Finds timers, listeners and connections that nobody clearly owns or shuts off.

```text
Map external side effects and resource lifecycles across this application: connections, subscriptions, listeners, timers, streams, cache entries and background workers. Find unclear ownership, incomplete cleanup and operations that outlive their intended scope. Prioritize evidenced leaks or correctness risks over stylistic patterns.
```

**A08 · Screens that fight how people work** Finds when confusing screens are a symptom of how the product is organised rather than a list of separate bugs.

```text
Map this application's pages, navigation and URLs against the jobs its users actually do. Find pages that should merge, become a tab or panel, or go away; navigation systems that compete for the same destinations; and jobs users have to assemble by hand across screens. Say whether the structure itself causes the problems, and if it does, name the end state it should reach.
```

### Performance and scale

**P01 · Slowest journeys, end to end** Shows where the seconds go on the paths people actually use.

```text
Trace the five most expensive user journeys from browser interaction to database response. Find unnecessary round trips, waterfalls, serialization, and repeated computations, and measure their contribution to latency.
```

**P02 · Steps that wait for no reason** Finds steps that wait for each other to finish when they could run at the same time.

```text
Find all hot paths where independent asynchronous operations run sequentially. Establish which can safely run concurrently without violating ordering, rate limits, or transaction boundaries.
```

**P03 · Queries that grow badly** Finds the database queries that will be the first to slow down as tables grow.

```text
Find database queries whose cost grows disproportionately with records, tenants, or relationships. Examine execution plans, indexes, joins, pagination, and application-side filtering.
```

**P04 · Work repeated for nothing** Finds work redone on every request or screen redraw when nothing it depends on changed.

```text
Identify expensive work that is repeated despite unchanged inputs. Investigate caching, memoization, batch operations, and incremental computation before recommending changes.
```

**P05 · What breaks at ten times the size** Names the first thing to break if the project takes off, before it does.

```text
Investigate what happens when this application's data volume and concurrent users increase tenfold. Identify the first likely bottlenecks using evidence from its current design.
```

**P06 · Loops that blow up with big data** Finds loops inside loops that are fine at 50 rows and painful at 50,000.

```text
Identify potentially quadratic or worse operations in frequently used code paths, including nested joins in application memory, copy-on-every-iteration patterns and repeated scans. Determine realistic input sizes and benchmark the highest-impact candidates before changing their algorithms.
```

**P07 · Memory that keeps growing** Finds why a page or process gets slower or crashes the longer it runs.

```text
Investigate sustained memory growth and allocation pressure. Look for unbounded caches, retained closures, unremoved listeners, large error objects, detached DOM references and accidentally retained request data. Use heap profiles or repeatable growth tests to validate candidates.
```

**P08 · One slow step that blocks the rest** Finds one slow step that makes every other request wait in line behind it.

```text
Find synchronous work performed in latency-sensitive asynchronous handlers, including filesystem operations, parsing, compression, large serialization and CPU-heavy transforms. Measure event-loop impact and identify safe offloading, batching or scheduling fixes.
```

**P09 · Parallel work with no limit** Finds work run in parallel with no limit, which can swamp the database connections or an outside service.

```text
Examine places where work is parallelized or queued without explicit limits. Find cases where a speed optimization could overwhelm rate limits, memory, connection pools or a downstream service; propose and test concurrency bounds with realistic load.
```

### Correctness and reliability

**R01 · Safe to run twice?** Finds actions that do damage when they run twice: double sends, double charges, duplicate rows.

```text
Find operations that cannot safely be retried. Examine duplicate events, partial failures, idempotency, transaction boundaries, and recovery from interrupted execution.
```

**R02 · Fallbacks that look like real data** Finds screens that show a confident zero or an empty list when the real answer is 'we could not load this'.

```text
Trace every place the application silently substitutes a default, null, stale value, or empty result when something fails. Determine whether users could mistake the fallback for valid information.
```

**R03 · Rules the data never enforces** Finds the rules everyone assumes (one owner per task, no negative balance) that nothing actually checks.

```text
Identify business invariants the system assumes but never enforces. Find the appropriate enforcement point and develop tests that attempt to violate them.
```

**R04 · Dates, times and time zones** Finds the date bugs that show up twice a year, at midnight, or in another time zone.

```text
Analyze the system's handling of time: time zones, daylight saving, expiration, scheduled jobs, clock differences, and historical as-of queries.
```

**R05 · Updates that overwrite each other** Finds updates that overwrite newer data because two things wrote at once.

```text
Find race conditions and out-of-order updates across background jobs, UI mutations, caches, webhooks, and database writes. Prove suspected problems with reproducible cases.
```

**R06 · Half-finished failures** Finds what is left behind when something fails halfway.

```text
Trace error, timeout and cancellation paths for transactions, locks, file handles, temporary files, worker jobs and network connections. Identify paths that leave resources held or state half-committed, and demonstrate them with controlled failure injection where practical.
```

**R07 · Lost place: Back, refresh and shared links** Finds the everyday friction where Back closes the wrong thing, a filter resets, or a pasted link opens the wrong view.

```text
Check whether this application keeps the user's place. In a real browser, open lists, filters, tabs, panels and records, then press Back and Forward, refresh, open links in a new tab, and open shared links in a fresh browser both signed out and as another account. Find where users lose a filter, scroll position, draft or open panel, or land somewhere other than what was shared, and trace each case to where that state lives.
```

### Testing and security

**T01 · Unit tests that give false comfort** Finds features whose automated checks all pass and that still break for real people.

```text
Find critical user journeys that have extensive unit-test coverage but insufficient evidence that they work end to end. Strengthen the smallest set of tests that closes the real gaps.
```

**T02 · Tests that can't fail** Finds tests that pass no matter what.

```text
Find tests that would continue passing if the underlying feature stopped working. Examine mocks, fixtures, assertions, and tests that merely reproduce implementation details.
```

**T03 · Outside input reaching sensitive actions** Follows input from outsiders to the places it can do harm.

```text
Trace every external input from entry point to sensitive operation. Investigate authorization gaps, injection risks, unsafe parsing, and tenant isolation failures.
```

**T04 · Risk from outside packages** Checks what a harmful outside package or pull request could reach.

```text
Review dependency and CI supply-chain exposure: install scripts, untrusted pull requests, privileged tokens, outdated packages, and unsafe automation permissions.
```

**T05 · Security checks that fail open** Finds security checks that let people in when something goes wrong.

```text
Search for security-sensitive behavior that fails open when configuration is missing, an authorization service fails, or a request is malformed.
```

**T06 · What the tests really prove** Asks what each test really proves, then adds one check that would catch a real break.

```text
Choose critical features and ask what the existing tests truly prove. Identify mocks that bypass important integration behavior, assertions that cannot fail meaningfully, and tests that reproduce the implementation's assumptions. Produce the smallest independent check that catches a real regression.
```

**S06 · Settings that differ in production** Finds settings that behave differently in production than anyone expects.

```text
Audit settings that differ between local development, CI, preview and production. Find ambiguous fallbacks, fail-open access controls and configuration whose behavior silently changes when an environment variable is missing. Verify against the actual deployment configuration, not only README examples.
```

### Infrastructure and environment

**I01 · Duplicate tools and stale caches** Finds disk space and confusion spent on duplicate developer tools and stale saved files on your computer.

```text
Inventory the development environment's browser runtimes, caches, SDKs, package managers, and duplicate installations. Identify obsolete or wasteful components, assess dependencies, and propose a safe cleanup.
```

**I02 · Why production might not match main** Lists every way 'merged' can fail to mean 'live'.

```text
Trace a change from commit to production, including builds, migrations, deployment triggers, cache refreshes, and background services. Identify every reason production might not reflect merged code.
```

**I03 · Check time that catches nothing** Finds paid automated-check minutes spent on checks that never catch anything.

```text
Analyze CI and deployment costs against actual failures detected. Find repeated work, redundant checks, and expensive jobs that contribute little incremental confidence.
```

**I04 · Background jobs that hang or stop halfway** Finds scheduled jobs and background workers that can hang, overlap or stop halfway.

```text
Find background jobs that can block other work or leave partially updated data. Examine queues, locks, timeouts, retries, deployment behavior, and observability.
```

**I05 · Dashboard and repo out of sync** Finds where the hosting dashboard and the repo disagree.

```text
Compare declared infrastructure configuration with the running environment and identify drift that affects reliability, security, or developer productivity.
```

**I06 · Packages nobody uses, or that work by luck** Finds packages nobody uses and packages that work only by accident.

```text
Audit dependencies for packages declared but unused, imports satisfied only through transitive dependencies, and heavyweight libraries used for trivial behavior. Check build-time and runtime use, dynamic imports, tooling and security advisories before recommending removal or replacement.
```

**I07 · Old runtimes and when support ends** Finds old browser runtimes on your computer and which are safe to remove, before a cleanup breaks an app that needs them.

```text
Inventory actual versions and dependencies of Playwright, Puppeteer, system Chrome, Chromium caches and Electron apps. Verify current vendor-supported and security-fix thresholds rather than trusting hard-coded version numbers. Distinguish safe disposable caches from app-owned runtimes and report the rollback path before any cleanup.
```

### Data integrity and analytics

**D01 · Missing vs zero vs stale** Finds where 'we don't know' turns into 0 and then into a wrong total.

```text
Identify where the application confuses missing, zero, unavailable, estimated, stale, and not applicable. Trace the consequences through storage, calculations, and presentation.
```

**D02 · Where did this number come from?** Checks that every number on screen can be traced back to a source document.

```text
Trace every derived metric to its raw evidence, transformation logic, assumptions, and historical version. Find calculations that cannot be independently reproduced.
```

**D03 · Old records, new meanings** Finds old records that read differently once today's rules are applied to them.

```text
Find historical records whose meanings change when current classifications or schemas are applied retroactively. Identify where time-aware interpretation is necessary.
```

**D04 · Imports that fail quietly** Finds rows that go missing or land on the wrong record during import, with no error.

```text
Audit data ingestion for records that could be duplicated, overwritten, silently omitted, or assigned to the wrong entity without triggering an error.
```

**D05 · Links between records worth adding** Finds links between records worth adding, and ones the evidence does not support.

```text
Identify where data relationships have greater analytical value than isolated fields. Find missing links, broken historical continuity, and relationships the source evidence cannot actually support.
```

**D06 · Code health, with proof** A general health check of the code that refuses findings without evidence.

```text
Perform a focused code-health audit calibrated to this repository's own conventions and operational risks. Require a specific file/line, reproducible command, trace or commit for every finding; grade confidence and impact; reject generic style complaints. Return a short ranked list of repairable issues rather than hundreds of speculative observations.
```

### Agent harness and modern stack

**G01 · Out-of-date agent instructions** Finds instructions that send agents to files and patterns that no longer exist.

```text
Compare every agent instruction and documentation file in this repository (CLAUDE.md, AGENTS.md, .cursorrules, SKILL.md, README.md, architecture docs) against the actual directory structure, package scripts, and code patterns. Identify stale rules that reference deleted paths, replaced libraries, or deprecated patterns that mislead coding agents.
```

**G02 · Database changes during a deploy** Checks that each database change works with the old code that is still live while a release finishes.

```text
Trace what happens during the deployment window when a new database migration or API schema change goes live while previous client bundles, active background workers, or queue consumers are still running. Identify column renames, non-nullable additions, or contract changes that break backwards compatibility before the old code finishes draining.
```

**G03 · Hidden data anyone can read** Finds data sent to the browser that the screen hides but anyone can read.

```text
Inspect API responses, Server Component and SSR serialization payloads, and RPC returns crossing from server to browser. Find places where full database rows or internal objects (internal flags, other tenants' keys, audit metadata, large unused JSON columns) are serialized over the network and merely hidden in the UI.
```

**G04 · When an outside service goes down** Asks what happens to the app when an outside API, an AI provider or a service that sends it updates goes down.

```text
Assume each external API, LLM provider, or webhook source this application depends on either hangs for 30 seconds, returns 429 or 503 for an hour, or delivers a burst of out-of-order webhooks on recovery. Trace which transactions or connection pools are held open during external calls, and whether core journeys degrade gracefully or lock up.
```

**G05 · Rounding and unit mix-ups** Finds money and percentage values that change scale or lose precision along the way.

```text
Trace calculations involving currency, percentages, basis points, share counts, weights, or rates across storage, transformation, and UI display. Identify where binary floating-point math is used instead of exact decimal or integer types, where premature rounding compounds across aggregations, or where scale conventions (0.05 versus 5.0 for 5%, cents versus dollars) are ambiguous across boundaries.
```

**G06 · Screens showing a change that was refused** Finds screens that show a change right away and keep showing it after the server refused it.

```text
Trace every flow where the client updates UI state or local cache optimistically before server confirmation. Demonstrate what happens to user state, queued actions, and screen accuracy when the server rejects the mutation, times out, or returns canonical values that differ from the client's assumption.
```

### Motion

**MO01 · Motion nobody chose** Shows whether the app's motion follows a system or was typed one animation at a time.

```text
List every animation and transition in this codebase with its duration, easing and animated properties. Count the distinct durations and the distinct easing curves. Find values used only once, transitions that name no property or no easing, and places that should share a value and do not. Propose the smallest set of shared durations and curves that covers what exists, and show which existing values map to which.
```

**MO02 · Animations that cost frames** Finds the animations that stutter on slower phones and laptops, and what each one costs.

```text
Find animations and transitions that make the browser run layout or heavy paint on every frame: width, height, top, left, margin, padding, large shadows and blurs, and anything driven from a scroll or pointer handler through component state. For the worst three, measure the interaction in a browser with CPU throttling and report how many layouts and long frames happen during it. Propose the cheaper equivalent for each (transform, opacity, or a single measured move) and say what would look different.
```

**MO03 · Motion with no off switch** Finds motion that can make people dizzy or lock them out, and content that disappears when animation is turned off.

```text
Check how this app behaves for people who have asked their system for reduced motion. List every animation that moves, scales, rotates or loops, and say whether it has a reduced-motion version. Find content that only becomes visible through an animation, motion that starts on its own and runs longer than five seconds with no pause control, and gestures with no button or keyboard alternative. For each gap, say what the reduced version should be: usually a short fade or an instant change that keeps the meaning.
```

**MO04 · Animations that restart, block or never finish** Finds motion that works in a demo and breaks under fast, real use.

```text
Find animations that break when the user does not wait for them. Look for keyframe animations on things that can be triggered twice in a row, exits that never play because the element is removed first, input ignored until an animation ends, focus that moves only after an animation, and end states that differ from the element's resting style. Reproduce the three most reachable cases by triggering the interaction again mid-animation, and propose the smallest fix for each.
```

**MO05 · Motion with no job** Produces a list of animations to delete or shorten, which is usually the cheapest way to make an app feel faster.

```text
Go through every animation in this product and say what it tells the user: that their input registered, where something came from or went, where they now are, that work is in progress, or that one thing changed. List the ones that tell the user nothing, and the ones seen so often that they slow people down (tooltips, menus, anything triggered from the keyboard). For each, recommend removing it, shortening it or keeping it, with one sentence of reasoning. Do not propose new animations.
```

**MO06 · State changes with no feedback** Finds the few places where a small animation would remove real confusion.

```text
Walk the main flows of this app and list every moment where the interface changes with no visible answer or explanation: a press with no pressed state, an item that vanishes on delete, a panel that appears with no sign of where it came from, a page change with no sense of direction, a wait of more than a second with no indicator. For each, say what the user is left guessing, and specify the smallest motion that would answer it: what changes, for how long, and what happens with reduced motion. Leave out anything the user triggers many times a minute.
```

## Database

### Start here

**PG00 · Make this database easier to trust and operate** The broad starting point when the database feels hard to trust or costly, and you can't yet name one problem.

```text
I want this PostgreSQL database to become easier to maintain, faster where it matters, less expensive to operate, and more trustworthy.

Study how the database actually works today, including its schema, important relationships, data sources, reads, writes, background jobs, migrations and consumers. Use the real database state, repository and operational evidence rather than relying on documentation alone.

Find the few underlying problems responsible for the greatest amount of unnecessary complexity, repeated work, data-quality risk and operational expense.

I care especially about correctness of the underlying data, efficient and reliable writes, duplicated logic, unnecessary database objects, historical accuracy, and changes that make future development easier for coding agents.

Rank the opportunities by actual impact. Distinguish demonstrated problems from theoretical concerns, and don't recommend a redesign just because an approach is unconventional.

Make recommendations that simplify the existing system rather than introduce more infrastructure or recurring processes. Reuse evidence already gathered, investigate only what's needed to support a decision, and group related findings around their shared cause.

Use read-only investigation initially. Don't modify production data, schemas or infrastructure. Give me the strongest findings, what proves them, and the smallest changes that would produce meaningful improvements.
```

### Accuracy and evidence

**PG01 · Can we independently prove these numbers?** Important figures may be wrong even though their lineage is documented.

```text
Take a representative set of important figures from this database and independently reconstruct them from their original sources. Don't rely on the existing calculation code to verify itself. Find discrepancies in definitions, source selection, units, dates, classifications, and relationships. Determine which errors are isolated and which come from shared logic, then rank corrections by analytical impact.
```

**PG02 · Find data that is internally consistent but wrong** Every check passes, but totals or outputs still look implausible.

```text
Look for data that passes the database's constraints and ordinary validation but is still analytically wrong. Test cross-table relationships, accounting identities, historical continuity, plausible ranges, source coverage, and independent calculations. Focus on contradictions that existing checks would miss, and distinguish genuine errors from legitimate differences in definitions or reporting periods.
```

**PG03 · Find where records silently change identity** Sources use aliases, changing identifiers, share classes or inconsistent names for the same thing.

```text
Trace how real-world entities are identified, matched and connected across imports, source documents and database tables. Find cases where distinct entities are merged, identical entities are duplicated, or historical relationships become disconnected. Identify the matching rule responsible and the affected population before proposing corrections.
```

**PG04 · Reproduce what the database believed in the past** Past reports, backfills, restatements or changed classification rules matter.

```text
Choose important historical records and determine whether the system can reproduce what was known and reported at a specific past date, using the definitions and evidence available then. Distinguish later source corrections from later classification changes. Find where current logic silently rewrites historical meaning and recommend the smallest reliable solution.
```

### Writes and ingestion

**PG05 · Map every place that writes to the database** Several jobs, functions, APIs or agents change the same data, or nobody is sure who owns it.

```text
Map the actual write paths for the important tables in this application. Identify every script, job, API, function, trigger and agent that can create, update or delete their records. Show who owns each field, which paths overlap, and where two writers can disagree or overwrite each other. Recommend the simplest ownership model supported by the existing system.
```

**PG06 · Stop rewriting data that hasn't changed** Upserts and updates run at high volume, imports are costly, or vacuum and write-ahead log churn look high.

```text
Investigate how much database write activity actually changes meaningful information. Find repeated upserts, unchanged updates, unnecessary delete-and-reinsert operations, repeated index maintenance and cascading refreshes. Measure their cost where practical and determine which writes can be eliminated without changing correctness, history or recovery behavior.
```

**PG07 · Is our ingestion process more complicated than necessary?** The import pipeline is long, slow to correct, or does the same work at several stages.

```text
Trace one complete ingestion cycle from the original source to the final database records. Identify repeated parsing, unnecessary intermediate states, duplicate validation, repeated reads, redundant transformations and writes that could be consolidated. Recommend the simplest workflow that preserves accuracy, traceability, failure recovery and the ability to process corrections.
```

**PG08 · Can we rerun everything without damaging the data?** Imports get retried, schedulers overlap, files are replayed, or runs fail halfway.

```text
Examine the ingestion and correction workflows under retries, interrupted runs, duplicate source files, out-of-order arrivals and repeated execution. Demonstrate where these cases produce duplicate records, lost corrections, partial results or unnecessary rewrites. Find the smallest durable approach that makes each operation safely repeatable.
```

**PG09 · Find where write logic should live** Business rules are split across SQL, triggers, edge functions, server routes and workers.

```text
Trace how records are validated, transformed and written across application code, database functions, triggers and background jobs. Find rules duplicated in different layers or placed where they are difficult to test and maintain. Recommend the simplest ownership boundary for each rule, without assuming that moving more logic into Postgres is automatically better.
```

### Schema and dependencies

**PG10 · Which database objects no longer earn their keep?** The list of views, functions and triggers has grown hard to reason about.

```text
Examine the tables, views, functions, triggers, indexes and materialized views in this database. Identify redundant representations, obsolete objects, overlapping responsibilities, unnecessary dependency chains and abstractions that no longer provide meaningful value. Verify actual consumers before recommending removal. Rank opportunities by complexity eliminated, operational savings and migration risk.
```

**PG11 · Are we storing the same truth multiple times?** Caches, aggregates, materialized views or derived columns drift from the raw facts.

```text
Find concepts and values maintained in multiple tables, materialized views, caches or derived columns. Trace which representation is authoritative, why each copy exists, how it stays synchronized, and what happens when the copies disagree. Recommend which duplication is justified by performance or history and which should be removed.
```

**PG12 · Can the schema be easier to understand without losing depth?** New developers or agents keep misunderstanding names, concepts or relationships.

```text
Review the database's logical organization from the perspective of a new senior engineer. Identify confusing names, mixed responsibilities, inconsistent conventions, unclear relationships and schemas that obscure the business domain. Recommend structural improvements that make the model easier to understand and maintain without sacrificing useful historical detail or creating unnecessary migrations.
```

### Performance and maintenance

**PG13 · Find the true sources of database waste** The bill is high, CPU or disk usage is high, storage keeps growing, or you suspect bloat.

```text
Measure which tables, indexes, queries and maintenance activities consume the most storage, execution time and write resources. Distinguish useful capacity from avoidable waste, including unused indexes, row churn, bloat, poor plans and excessive scans. Recommend changes based on observed workload and realistic savings, not generic optimization rules.
```

**PG14 · What will become expensive as the database grows?** Fact or history tables are growing fast, or you need to plan capacity.

```text
Use actual table sizes, row growth, query plans and workload patterns to identify the first database operations likely to become disproportionately expensive as data grows. Evaluate indexing, partitioning, pagination, aggregation and retention only where the evidence justifies them. Show what scale would trigger a change rather than optimizing everything prematurely.
```

### Rebuild and safe change

**PG15 · Can we rebuild this database from its sources?** You worry about disaster recovery, production-only state, or whether the data could be rebuilt.

```text
Determine whether this database can be reconstructed from the repository, migrations, original source material and retained operational records. Identify anything that exists only in production, any transformations that cannot be reproduced, and data that would be permanently lost. Where possible, test the reconstruction on an isolated database and compare the resulting records and relationships.
```

**PG17 · Are our database changes safe before we merge?** A migration, or a change to functions, views, RLS, types or column meaning, is about to ship.

```text
Review this database change against the live schema, existing consumers, prior migrations and deployment process. Establish whether it preserves current records, supports old and new application versions during rollout, and can be verified on an isolated database. Identify the smallest necessary migration and a realistic recovery path before approving it.
```

### Agent decisions

**PG16 · Which decisions should an expert agent make without me?** Agents keep asking you to classify fields, match records or pick between sources.

```text
Find recurring database decisions that agents currently escalate to me, including field classification, record matching, write conflicts, source precedence and schema choices. Determine which can be resolved through established standards, existing precedent and authoritative evidence. Make the decision rules reusable, identify their limits, and reserve escalation for genuine product or risk decisions.
```

### Workflows

**DBR01 · Is the data actually right?** Prove the numbers before fixing anything.

```text
Is the data actually right? Prove the numbers before fixing anything.
Work through this in order and check in with me after each step. Stay read-only until I approve a change.

1. Start: PG01 when a figure disagrees with its source; PG02 when everything validates but still looks wrong.

Can we independently prove these numbers? (PG01)
Take a representative set of important figures from this database and independently reconstruct them from their original sources. Don't rely on the existing calculation code to verify itself. Find discrepancies in definitions, source selection, units, dates, classifications, and relationships. Determine which errors are isolated and which come from shared logic, then rank corrections by analytical impact.

Find data that is internally consistent but wrong (PG02)
Look for data that passes the database's constraints and ordinary validation but is still analytically wrong. Test cross-table relationships, accounting identities, historical continuity, plausible ranges, source coverage, and independent calculations. Focus on contradictions that existing checks would miss, and distinguish genuine errors from legitimate differences in definitions or reporting periods.

2. If needed: PG03 for identity gaps; PG04 when the meaning of past records matters.

Find where records silently change identity (PG03)
Trace how real-world entities are identified, matched and connected across imports, source documents and database tables. Find cases where distinct entities are merged, identical entities are duplicated, or historical relationships become disconnected. Identify the matching rule responsible and the affected population before proposing corrections.

Reproduce what the database believed in the past (PG04)
Choose important historical records and determine whether the system can reproduce what was known and reported at a specific past date, using the definitions and evidence available then. Distinguish later source corrections from later classification changes. Find where current logic silently rewrites historical meaning and recommend the smallest reliable solution.

3. Change: Fix only the confirmed shared causes, and add SQL or metric tests for them.

4. Done when: Recomputed examples that now match, an estimate of how much data was affected, and any source limits stated plainly.
```

**DBR02 · Make ingestion simpler and cheaper** Less work per import, without losing provenance or corrections.

```text
Make ingestion simpler and cheaper Less work per import, without losing provenance or corrections.
Work through this in order and check in with me after each step. Stay read-only until I approve a change.

1. Start: PG05 when it is unclear who writes what; otherwise PG07.

Map every place that writes to the database (PG05)
Map the actual write paths for the important tables in this application. Identify every script, job, API, function, trigger and agent that can create, update or delete their records. Show who owns each field, which paths overlap, and where two writers can disagree or overwrite each other. Recommend the simplest ownership model supported by the existing system.

Is our ingestion process more complicated than necessary? (PG07)
Trace one complete ingestion cycle from the original source to the final database records. Identify repeated parsing, unnecessary intermediate states, duplicate validation, repeated reads, redundant transformations and writes that could be consolidated. Recommend the simplest workflow that preserves accuracy, traceability, failure recovery and the ability to process corrections.

2. If needed: PG06 for writes that change nothing; PG08 for replay or correction failures; PG09 for validation done in several places.

Stop rewriting data that hasn't changed (PG06)
Investigate how much database write activity actually changes meaningful information. Find repeated upserts, unchanged updates, unnecessary delete-and-reinsert operations, repeated index maintenance and cascading refreshes. Measure their cost where practical and determine which writes can be eliminated without changing correctness, history or recovery behavior.

Can we rerun everything without damaging the data? (PG08)
Examine the ingestion and correction workflows under retries, interrupted runs, duplicate source files, out-of-order arrivals and repeated execution. Demonstrate where these cases produce duplicate records, lost corrections, partial results or unnecessary rewrites. Find the smallest durable approach that makes each operation safely repeatable.

Find where write logic should live (PG09)
Trace how records are validated, transformed and written across application code, database functions, triggers and background jobs. Find rules duplicated in different layers or placed where they are difficult to test and maintain. Recommend the simplest ownership boundary for each rule, without assuming that moving more logic into Postgres is automatically better.

3. Change: Make the smallest change to one cause at a time, keeping provenance and corrections.

4. Done when: The same results for reference inputs, measurably less work, and retries that do no harm.
```

**DBR03 · Simplify a crowded schema** Fewer objects with the same outcomes.

```text
Simplify a crowded schema Fewer objects with the same outcomes.
Work through this in order and check in with me after each step. Stay read-only until I approve a change.

1. Start: Inventory objects and their real consumers.

Which database objects no longer earn their keep? (PG10)
Examine the tables, views, functions, triggers, indexes and materialized views in this database. Identify redundant representations, obsolete objects, overlapping responsibilities, unnecessary dependency chains and abstractions that no longer provide meaningful value. Verify actual consumers before recommending removal. Rank opportunities by complexity eliminated, operational savings and migration risk.

2. If needed: PG11 for copies of the same fact; PG12 for confusing names; PG17 before any schema change ships.

Are we storing the same truth multiple times? (PG11)
Find concepts and values maintained in multiple tables, materialized views, caches or derived columns. Trace which representation is authoritative, why each copy exists, how it stays synchronized, and what happens when the copies disagree. Recommend which duplication is justified by performance or history and which should be removed.

Can the schema be easier to understand without losing depth? (PG12)
Review the database's logical organization from the perspective of a new senior engineer. Identify confusing names, mixed responsibilities, inconsistent conventions, unclear relationships and schemas that obscure the business domain. Recommend structural improvements that make the model easier to understand and maintain without sacrificing useful historical detail or creating unnecessary migrations.

Are our database changes safe before we merge? (PG17)
Review this database change against the live schema, existing consumers, prior migrations and deployment process. Establish whether it preserves current records, supports old and new application versions during rollout, and can be verified on an isolated database. Identify the smallest necessary migration and a realistic recovery path before approving it.

3. Change: Confirm consumers before retiring anything, and keep old and new versions working during rollout.

4. Done when: Less complexity with unchanged results for users and data.
```

**DBR04 · Reduce PostgreSQL resource cost** Spend less where the measurements say the money goes.

```text
Reduce PostgreSQL resource cost Spend less where the measurements say the money goes.
Work through this in order and check in with me after each step. Stay read-only until I approve a change.

1. Start: Measure the top consumers first.

Find the true sources of database waste (PG13)
Measure which tables, indexes, queries and maintenance activities consume the most storage, execution time and write resources. Distinguish useful capacity from avoidable waste, including unused indexes, row churn, bloat, poor plans and excessive scans. Recommend changes based on observed workload and realistic savings, not generic optimization rules.

2. If needed: PG06 for write churn; PG14 when growth is the driver; P03 for one slow query.

Stop rewriting data that hasn't changed (PG06)
Investigate how much database write activity actually changes meaningful information. Find repeated upserts, unchanged updates, unnecessary delete-and-reinsert operations, repeated index maintenance and cascading refreshes. Measure their cost where practical and determine which writes can be eliminated without changing correctness, history or recovery behavior.

What will become expensive as the database grows? (PG14)
Use actual table sizes, row growth, query plans and workload patterns to identify the first database operations likely to become disproportionately expensive as data grows. Evaluate indexing, partitioning, pagination, aggregation and retention only where the evidence justifies them. Show what scale would trigger a change rather than optimizing everything prematurely.

Queries that grow badly (P03)
Find database queries whose cost grows disproportionately with records, tenants, or relationships. Examine execution plans, indexes, joins, pagination, and application-side filtering.

3. Change: Take the biggest measured savings first. No speculative indexes or partitions.

4. Done when: Workload figures before and after, with no loss of correctness.
```

**DBR05 · Ship or recover safely** A schema change or a restore you have actually tested.

```text
Ship or recover safely A schema change or a restore you have actually tested.
Work through this in order and check in with me after each step. Stay read-only until I approve a change.

1. Start: PG17 for a change about to ship; PG15 for rebuilding or recovery.

Are our database changes safe before we merge? (PG17)
Review this database change against the live schema, existing consumers, prior migrations and deployment process. Establish whether it preserves current records, supports old and new application versions during rollout, and can be verified on an isolated database. Identify the smallest necessary migration and a realistic recovery path before approving it.

Can we rebuild this database from its sources? (PG15)
Determine whether this database can be reconstructed from the repository, migrations, original source material and retained operational records. Identify anything that exists only in production, any transformations that cannot be reproduced, and data that would be permanently lost. Where possible, test the reconstruction on an isolated database and compare the resulting records and relationships.

2. If needed: G02 for deploy timing; R06 for half-finished failures; PG04 when past results must not move.

Database changes during a deploy (G02)
Trace what happens during the deployment window when a new database migration or API schema change goes live while previous client bundles, active background workers, or queue consumers are still running. Identify column renames, non-nullable additions, or contract changes that break backwards compatibility before the old code finishes draining.

Half-finished failures (R06)
Trace error, timeout and cancellation paths for transactions, locks, file handles, temporary files, worker jobs and network connections. Identify paths that leave resources held or state half-committed, and demonstrate them with controlled failure injection where practical.

Reproduce what the database believed in the past (PG04)
Choose important historical records and determine whether the system can reproduce what was known and reported at a specific past date, using the definitions and evidence available then. Distinguish later source corrections from later classification changes. Find where current logic silently rewrites historical meaning and recommend the smallest reliable solution.

3. Change: Run migrations and restores on a separate database, check compatibility, and plan the recovery.

4. Done when: A migration or restore tested on a separate database, and no claim about production that wasn't proved.
```

## Thinking prompts

### Thinking prompts

**M01 · Deeper, not bigger**

```text
I want the professional-grade version of this task, not a larger version. Look at what I'm trying to accomplish and tell me what a genuinely excellent practitioner would notice, investigate, or verify that I've overlooked. Start with the original evidence instead of just relying on existing summaries. Identify the methods that would materially improve the result and the independent evidence that would establish whether it's correct. Then improve the assignment accordingly. Keep the objective and scope intact. Don't add process or complexity just to make the work sound more sophisticated.
```

**M02 · Prove it wrong**

```text
Assume the proposed solution is wrong. Find the strongest evidence against it before recommending we proceed.
```

**M03 · Root cause first**

```text
Don't fix the visible symptom yet. Work backward through the system until you can explain why it occurred and what other behavior shares that cause.
```

**M04 · Simpler first**

```text
Solve this by making the existing system simpler. First determine whether we can remove a layer, rule, dependency, or special case rather than add something.
```

**M05 · Let the expert decide**

```text
Treat the technical decisions as yours to make. Apply established engineering standards, investigate uncertainties, and escalate only genuine product or risk decisions.
```

**M06 · Check it independently**

```text
Design a way to prove your solution works that doesn't depend on the assumptions, code, or tests you just created.
```

**M07 · Spec without the interview**

```text
Turn my request into a compact working specification: desired outcome, actual scope, meaningful exclusions, observable acceptance criteria, and stopping point. Resolve technical ambiguity from the repository and authoritative references yourself; ask me only for product preferences, permissions, or genuine tradeoffs you cannot determine independently. Then execute if the task is authorized and ready.
```

**M08 · Reproduce, measure, prove**

```text
Before repairing a suspected defect or performance problem, establish a reproducible failing case or measurable baseline. Find the root cause, implement the narrowest defensible fix, rerun an independent check, and report the before/after evidence. If you can't measure or reproduce it, say what evidence is missing instead of claiming a win.
```

**M09 · Compare three options**

```text
Do not implement the first viable approach you find. Present three genuinely distinct ways to solve this problem: (1) the smallest, most conservative patch to the existing code, (2) the cleanest long-term structural design, and (3) a subtractive approach that removes an existing constraint, layer, or edge case. Compare their blast radius, testability, and failure modes, recommend one, and wait for my decision.
```

**M10 · Handoff note before you stop**

```text
Prepare a compact, self-contained technical checkpoint so a fresh agent session can resume this work cold. Document only: (1) verified facts and current system state, (2) approaches already tested and why they were ruled out, (3) exact files and uncommitted changes in flight, and (4) the single next falsifiable step. Summarize system ground truth, not our conversation history.
```

**M11 · Thorough and bold**

```text
Go past the first answer. For each claim you make, check the original evidence (the code, the data or the docs) and say which claims you verified and which you assumed. Then give one clear recommendation, the strongest argument against it, and the result that would change your mind.
```

**M12 · Deepen modules, simplify interfaces**

```text
Deepen modules and simplify interfaces.
```

## Engineering commands

### Engineering kit

**EC01 · /engineer** Describe what's going on and it picks one starting move from this guide (an investigation prompt, an installed skill, or a plain prompt with nothing to install) and says why. In Codex it's $engineer.

```text
/engineer
```

**EC35 · /database** Describe a PostgreSQL problem in plain words and it picks one database prompt from this library, says why, and runs it read-only when it can reach the code and database. In Codex it's $database.

```text
/database
```

**EC02 · /diagnosing-bugs** For hard bugs and slowdowns. Builds a check that fails on the bug, shrinks it, ranks likely causes, adds logging, fixes it with a test that keeps it from coming back, then cleans up.

```text
/diagnosing-bugs
```

**EC03 · /tdd** Writes the tests first, one small working slice at a time. Agrees with you where the tests will hook into the code before writing any.

```text
/tdd
```

**EC04 · /improve-codebase-architecture** Looks at recently busy parts of the code for modules that add little behind their interface, writes a before/after HTML report to the temp folder, then interviews you about one.

```text
/improve-codebase-architecture
```

**EC05 · /grill-me** Asks rounds of numbered questions, each with a suggested answer, until every open question in a plan is settled. For product direction, not routine fixes.

```text
/grill-me
```

**EC06 · /grill-with-docs** The same interview, but it writes terms into GLOSSARY.md and records each settled decision as an ADR (a short decision record).

```text
/grill-with-docs
```

**EC07 · /research** A background agent answers a question from original sources and saves a Markdown note with citations in the repo.

```text
/research
```

**EC08 · /retro** Reviews a session and suggests changes to the agent's setup: how it finds its way around, its checks, its instruction files and what its tools cost.

```text
/retro
```

**EC09 · /wizard** Writes a bash script that walks you through the steps only you can do, like dashboards, secrets and switchovers.

```text
/wizard
```

**EC10 · /to-questionnaire** Turns a decision you can't make alone into a questionnaire for the person who can.

```text
/to-questionnaire
```

**EC11 · /wait-what** Asks the agent to explain its last message again in plain words.

```text
/wait-what
```

### Trail of Bits

**EC12 · /insecure-defaults:audit** Finds unsafe defaults: fallback secrets, default passwords, switches that let everything through when they fail, weak encryption, loose access rules and debug details leaking out.

```text
/insecure-defaults:audit
```

**EC13 · /supply-chain-risk-auditor** Checks your direct dependencies and the ones in the lockfile for security warnings, abandoned projects and risky publishers.

```text
/supply-chain-risk-auditor
```

**EC14 · /agentic-actions-auditor** Checks GitHub Actions that run Claude, Codex or Gemini for exposed tokens and prompt injection (hidden instructions in issues and PRs that the AI might follow).

```text
/agentic-actions-auditor
```

**EC15 · /differential-review:diff-review** Security review of a set of code changes, using git history and counting how many callers each change could affect.

```text
/differential-review:diff-review
```

**EC16 · /sharp-edges** Finds APIs that are easy to misuse and configuration options that are dangerous.

```text
/sharp-edges
```

**EC17 · /variant-analysis** After one bug is found, hunts for the other places with the same root cause.

```text
/variant-analysis
```

**EC18 · /property-based-testing** Writes and reviews property tests (tests that throw many generated inputs at a rule) with fast-check or Hypothesis.

```text
/property-based-testing
```

**EC19 · /dimensional-analysis** Finds bugs from mixed-up units and decimal scaling by labeling each value with its unit.

```text
/dimensional-analysis
```

**EC20 · /spec-to-code-compliance** Checks code against the document that specifies it, one requirement at a time.

```text
/spec-to-code-compliance
```

**EC21 · /audit-context-building** Reads code one function at a time and records what each one assumes, before any bug hunt starts.

```text
/audit-context-building
```

**EC22 · /goal-prompt** Drafts /goal commands with a checkable finish line and limits on when to stop.

```text
/goal-prompt
```

### Experience architecture

**EC23 · /experience-architecture:diagnose** Start here for any complaint about navigation, the Back button, filters, shared links or too many pages. Finds the causes, says whether the page structure is the problem, and checks its own file references before reporting.

```text
/experience-architecture:diagnose
```

**EC24 · /experience-architecture:rethink** For questions like whether a page should exist, where a feature belongs, or whether to add a tab. Gives a recommendation, and for a real structural problem two or three options with a clickable prototype and a move-over plan that keeps old links working.

```text
/experience-architecture:rethink
```

**EC25 · /experience-architecture:verify** Proves behaviour in a browser and saves the user journeys as a repeat check that ends PASS, FAIL or EXPLORATORY. Typed values and secrets stay out of the logs.

```text
/experience-architecture:verify
```

### Other commands that help

**EC26 · /code-review** Checks a set of changes or a PR for bugs, at an effort level you pick. Run it at high or above before marking a PR ready.

```text
/code-review
```

**EC27 · /security-review** Security review of the not-yet-merged changes on the current branch.

```text
/security-review
```

**EC28 · /simplify** Looks over changed code for things to reuse or simplify, and makes the fixes.

```text
/simplify
```

**EC29 · /ci-optimizer:ci-check** Checks CI workflow files (the automatic build and test runs) for speed, cost and safety problems.

```text
/ci-optimizer:ci-check
```

**EC30 · /ci-optimizer:ci-timings** Finds the slowest jobs and steps, and flaky tests (ones that pass and fail at random), from recent CI runs.

```text
/ci-optimizer:ci-timings
```

**EC31 · /harsh-review** Blunt critique, ranked by how serious each problem is, then the small fixes it is sure of.

```text
/harsh-review
```

**EC32 · /viewport-proof** Takes screenshots at phone, tablet and desktop sizes and says whether it's ready to ship.

```text
/viewport-proof
```

**EC34 · /recommend** Lays out the options and tradeoffs, then recommends one.

```text
/recommend
```

## Design commands

### Impeccable

**UI001 · /impeccable** Typed alone, it looks at where this project stands and suggests the next command. If there is no PRODUCT.md yet, it suggests init first.

```text
/impeccable
```

**UI002 · /impeccable init** One-time setup for a project. It asks you questions, then writes PRODUCT.md (who uses it, the brand, the guiding principles), which every other command reads.

```text
/impeccable init
```

**UI003 · /impeccable shape** Plans how a page should work and look before any code is written. It asks a few questions and writes a design brief for you to approve. For a new page or a new look, it then makes three image mockups, you pick one, and it builds to match.

```text
/impeccable shape the billing settings page
```

**UI004 · /impeccable document** Writes DESIGN.md by reading the code you already have: colors, fonts, spacing and the building blocks of the interface.

```text
/impeccable document
```

**UI005 · /impeccable extract** Finds styles that repeat across the app and turns them into shared settings and pieces. Use it when the look has drifted out of sync.

```text
/impeccable extract the card styles
```

**UI006 · /impeccable critique** Reviews how easy a screen is to use: what stands out, how things are organized, and how much it asks you to think. Gives scores and tests it from the view of different kinds of users.

```text
/impeccable critique the dashboard
```

**UI007 · /impeccable audit** Runs technical checks: accessibility, speed, light and dark themes, how it fits different screens, and common mistakes. Ranks problems from P0 (worst) to P3. Checks phone apps against Apple's and Google's rules.

```text
/impeccable audit the checkout flow
```

**UI008 · /impeccable polish** The last pass before you ship. Fixes alignment, spacing, consistency and small details.

```text
/impeccable polish the pricing page
```

**UI009 · /impeccable bolder** Makes a safe or bland design stand out more, without making it harder to use.

```text
/impeccable bolder the hero
```

**UI010 · /impeccable quieter** Tones down a design that is too loud or busy.

```text
/impeccable quieter the sidebar
```

**UI011 · /impeccable distill** Removes what isn't needed so the screen is less cluttered.

```text
/impeccable distill the settings screen
```

**UI012 · /impeccable harden** Gets a screen ready for real use: error messages, very long text, other languages and unusual data.

```text
/impeccable harden the signup form
```

**UI013 · /impeccable onboard** Designs what new users see first, what empty screens show, and the moments that get people to start using the product.

```text
/impeccable onboard new users
```

**UI014 · /impeccable animate** Adds motion that has a purpose, plus small animated responses to clicks and taps, as part of a design pass.

```text
/impeccable animate the modal
```

**UI015 · /impeccable colorize** Adds color in chosen places to an interface that looks flat or gray.

```text
/impeccable colorize the stats cards
```

**UI016 · /impeccable typeset** Fixes the font choice, which text stands out most, text sizes and how easy it is to read.

```text
/impeccable typeset the article page
```

**UI017 · /impeccable layout** Fixes spacing, the visual rhythm of a page, and screens where nothing clearly stands out.

```text
/impeccable layout the home screen
```

**UI018 · /impeccable delight** Adds personality and small touches people remember.

```text
/impeccable delight the empty state
```

**UI019 · /impeccable overdrive** Goes beyond the usual with advanced graphics, bouncy realistic motion and effects that react as you scroll. For moments meant to impress.

```text
/impeccable overdrive the landing hero
```

**UI020 · /impeccable clarify** Rewrites confusing on-screen text, labels and error messages.

```text
/impeccable clarify the error messages
```

**UI021 · /impeccable adapt** Makes a design work on different screen sizes, devices and platforms, including phone apps built with SwiftUI, Compose, React Native and Flutter.

```text
/impeccable adapt the table for mobile
```

**UI022 · /impeccable optimize** Finds and fixes slow loading, choppy scrolling or drawing, large images and too much code sent to the browser.

```text
/impeccable optimize the fund list
```

**UI023 · /impeccable live** Click an element in the app running on your computer and see different versions of it swapped in right away.

```text
/impeccable live
```

**UI024 · /impeccable generate** Name an element and the change you want, and get as many versions as you ask for to flip through and pick from.

```text
/impeccable generate 3 bolder variants of the pricing card
```

**UI025 · /impeccable hooks on|off|status** Turns on or off the design check that runs on its own after you edit interface files, or shows its status. It can also ignore a rule, file or value you have accepted, or reset those choices.

```text
/impeccable hooks ignore-file app/legacy.tsx
```

**UI026 · /impeccable doctor** Finds and fixes places where PRODUCT.md, DESIGN.md and the installed version no longer match.

```text
/impeccable doctor
```

**UI027 · /impeccable pin <command>** Makes a shortcut so a command like /audit works without typing /impeccable first. Unpin removes the shortcut.

```text
/impeccable pin audit
```

### Routers and working-style

**UI028 · /design** One command for any design work. Say what you want and it picks the one right skill or recipe from this guide, tells you why, and starts it. /design next picks a recipe back up.

```text
/design the inbox feels cluttered on my phone
```

**UI029 · /harsh-review** A blunt review of code or product work, with problems ranked by how serious they are and proof for each one. It then makes the small fixes it is sure of and checks them.

```text
/harsh-review the settings page
```

**UI031 · /viewport-proof** Takes screenshots of the real page at phone, tablet and desktop sizes, checks the layout automatically, and gives one of three ship verdicts with a sheet of proof. Heavier than /impeccable audit, so save it for a final check on a big page.

```text
/viewport-proof the inbox page
```

### Built into Claude

**UI032 · /dataviz** Picks the right kind of chart, builds a color set that works for everyone and checks it with a tool, then sets the shapes, axes and hover labels.

```text
/dataviz a weekly task-completion chart
```

### Wondelai UX design

**UI033 · /web-typography** Picks fonts and pairs them, then sets text sizes, line spacing and how fonts load.

```text
/web-typography pair a serif with Instrument Sans for the notes page
```

**UI034 · /refactoring-ui** Fixes what stands out, spacing, color and depth using the method from the book Refactoring UI.

```text
/refactoring-ui the task list looks amateur
```

**UI035 · /microinteractions** Designs the small moments, like how buttons, switches and loading indicators react, what sets them off, and how they repeat or change.

```text
/microinteractions the complete-task checkbox
```

**UI036 · /top-design** Builds showpiece websites like the ones that win Awwwards: stories told as you scroll, layers that move at different speeds, and movie-like motion.

```text
/top-design a launch page that feels cinematic
```

**UI037 · /ios-hig-design** Designs iPhone and iPad screens that follow Apple's Human Interface Guidelines.

```text
/ios-hig-design the iPhone tab bar
```

**UI038 · /ux-heuristics** Checks how easy something is to use against Nielsen's well-known usability rules, and walks through it step by step as a new user would.

```text
/ux-heuristics the onboarding flow
```

**UI039 · /steve-jobs-design-review** A harsh review of a design or feature that pushes for simplicity and focus.

```text
/steve-jobs-design-review the home screen
```

**UI040 · /design-everyday-things** Explains why something is confusing: whether it shows how to use it, gives feedback, and helps people avoid mistakes.

```text
/design-everyday-things why do people miss the filter button?
```

**UI041 · /improve-retention** Works out why people sign up and then stop coming back, using what is known about how habits and behavior work.

```text
/improve-retention people stop opening the weekly brief
```

**UI042 · /hooked-ux** Designs habits people repeat: a prompt, an action, a reward, and something they put in that brings them back.

```text
/hooked-ux a daily check-in habit
```

**UI043 · /lean-ux** Turns a design argument into a clear guess you can test with a quick experiment.

```text
/lean-ux should the inbox default to unread?
```

### Color skills

**UI044 · /oklch-skill** Converts colors to OKLCH, a color system, then builds color scales and dark mode, fixes text that is hard to read against its background, and writes Tailwind v4 color settings.

```text
/oklch-skill build a 10-step scale from the brand accent
```

**UI045 · /color-expert** Answers color questions: contrast checks (APCA and WCAG), ways to build a palette, and color names and history.

```text
/color-expert why does this blue look purple in dark mode?
```

### UX writing

**UI046 · /ux-writing** Writes or edits the words in an app so they are clear, short and in the right tone.

```text
/ux-writing the error messages on sign-in
```

### Marketing copy

**UI047 · /product-marketing** Asks you questions once and writes the product-marketing file that /copywriting and /cro both read.

```text
/product-marketing for the app
```

**UI048 · /copywriting** Writes or rewrites the words on a page. It bans phrases that sound written by AI and asks you to back up every claim.

```text
/copywriting the landing page hero
```

**UI049 · /cro** Finds why a page or form doesn't get people to sign up or buy, and what to change first.

```text
/cro the signup page
```

### SwiftUI Pro

**UI050 · /swiftui-pro** Reviews SwiftUI code (Apple's app-building toolkit) against current methods and best practice.

```text
/swiftui-pro review the task list view
```

### Interface Design

**UI051 · /interface-design** Builds or improves app screens. It suggests a direction, asks you to confirm, builds it, then offers to save the design system for reuse.

```text
/interface-design build a fund comparison table
```

**UI052 · /interface-design:design-review** A strict review, in several passes, of a screen's craft and what stands out first, with severity scores and a pass bar. It judges first and rebuilds only if you ask.

```text
/interface-design:design-review the settings page
```

**UI053 · /interface-design:design-deslop** A quick pass over a branch that removes signs a UI was made by AI: nothing stands out, identical cards, default fonts, timid color.

```text
/interface-design:design-deslop
```

**UI054 · design status / audit / extract** Plain requests it understands: summarize the saved design system, check files for drift from it, or find repeated values worth turning into shared patterns.

```text
Use interface-design to check the dashboard for drift from system.md
```

### Hallmark

**UI055 · /hallmark <prompt>** Designs a new page. It asks once about material, audience, use and tone, then builds the big top section (the hero) first.

```text
/hallmark a landing page for a fund research tool
```

**UI056 · /hallmark redesign <path>** Fully redesigns an existing page while keeping its content and how it is wired up.

```text
/hallmark redesign src/app/page.tsx
```

**UI057 · /hallmark audit <path>** Report only. Checks a page against Hallmark's minimum quality bar.

```text
/hallmark audit src/app/page.tsx
```

**UI058 · Genre families** It picks from four looks: atmospheric, editorial, modern-minimal, playful. Name one to steer it.

```text
/hallmark an editorial landing page for a chess coaching app
```

### Emil Kowalski skills

**UI059 · /emil-design-eng** Emil's core approach to polish, component design and the small details users never notice. Reviews in a fixed format.

```text
/emil-design-eng review this button component
```

**UI060 · /apple-design** Apple-style smooth, physical-feeling web interfaces: gestures, springy motion, slide-up sheets, see-through layers, typography.

```text
/apple-design make this bottom sheet draggable
```

**UI061 · /break-ui** Fills a component with the worst realistic data (long names, emoji, zero items, huge numbers) behind an on/off switch and reports what broke.

```text
/break-ui the player card
```

**UI062 · /prototype** Builds 3 truly different versions you can switch between. Add x5 for more. Then try variations or keep one.

```text
/prototype a team switcher x4
```

**UI063 · /animate** Builds an animation in order: should it animate, why, which tool, what moves, how it speeds and slows, what happens if interrupted, and a version for people who turn motion off.

```text
/animate the dropdown menu
```

**UI064 · /animate-expo** The same idea for phone apps built with React Native and Expo: Reanimated, gestures, slide-up sheets, haptics (vibration feedback).

```text
/animate-expo a swipe-to-dismiss card
```

**UI065 · /animation-vocabulary** Turns a vague description of motion into the right term to use in a prompt.

```text
/animation-vocabulary what's it called when a list item bounces in?
```

**UI066 · /review-animations** Strict review of animation code against Emil's ten standards. It flags problems by default.

```text
/review-animations src/components/Modal.tsx
```

**UI067 · /find-animation-opportunities** Read-only sweep for places that should animate, with exact settings. It rules out the rest.

```text
/find-animation-opportunities the onboarding flow
```

**UI068 · /improve-animations** Checks all motion in a codebase and writes plans for other agents to carry out. Variants: quick, deep, a focus like performance, plan, execute, reconcile.

```text
/improve-animations deep performance
```

**UI069 · /animation-performance** Fixes animation that stutters or drops frames. Covers properties the browser can animate cheaply, CSS vs JavaScript, and the will-change hint.

```text
/animation-performance the scroll reveal stutters
```

**UI070 · /pick-ui-library** Opinionated library picks for numbers, one-time login codes, charts, command menus, drag and drop, pop-up notices (toasts), app state and styling.

```text
/pick-ui-library drag and drop for a kanban
```

**UI071 · /ask-sonner** The Sonner pop-up notice (toast) library: setup, notices that track a running task, styling, and fixes for toasts that do not show.

```text
/ask-sonner toasts sit behind my modal
```

**UI072 · /mobile-native** Makes a web app feel like an installed app on a phone: tap flashes, the full-screen height bug, inputs that zoom the page, the notch, pull-to-refresh.

```text
/mobile-native the checkout page
```

**UI073 · /write-swift** Modern Swift for Apple apps: Swift 6 concurrency (code safely running at the same time), value types, Swift Testing, memory management (ARC) and performance.

```text
/write-swift fix this data race
```

### Motion kit

**UI100 · /motion** One command for anything that moves. Say what you want and it picks the mode (set up, storyboard, build, review or fix), says which, and starts. Typed alone, it reports how the project moves today and suggests three next steps.

```text
/motion the dropdowns feel slow and each one opens differently
```

**UI101 · /motion setup** Reads how the project moves today and proposes one small set of durations, curves and springs, showing which existing values fold into which. After you approve, it writes MOTION.md and the token file. It changes no animations.

```text
/motion setup
```

**UI102 · /motion storyboard** Plans a sequence before any code: each beat with its timing and reason, the total length, the reduced-motion version and what shows if nothing plays. Then waits for your yes.

```text
/motion storyboard the homepage hero entrance
```

**UI103 · /motion build** Builds one animation from a one-line spec: the lightest tool that works, the project's own values, the interrupted case and a reduced-motion version. Then captures it frame by frame to check the result.

```text
/motion build make the bottom sheet draggable
```

**UI104 · /motion review** Read-only review backed by a code inventory and frame captures. Lists motion to cut first, then what is broken, wrong or rough, then where motion is missing, each with its file and what it should be.

```text
/motion review the checkout flow
```

**UI105 · /motion fix** Reproduces motion that stutters, flickers, restarts or feels slow, names the cause with a measurement, makes the smallest change and captures it again.

```text
/motion fix the sidebar stutters when it opens on my phone
```

### Web Design Guidelines

**UI074 · /web-design-guidelines <file-or-pattern>** Reviews the files you name for accessibility, usability and interface best practices.

```text
/web-design-guidelines src/components/**/*.tsx
```

### Anthropic example-skills

**UI075 · example-skills:frontend-design** Gives new UI a distinctive look: a visual direction, font choices, and avoiding template defaults.

```text
example-skills:frontend-design a landing page for a coaching app
```

**UI076 · example-skills:theme-factory** Applies one of 10 preset themes (arctic-frost, ocean-depths, midnight-galaxy, golden-hour and others) or makes a new one.

```text
example-skills:theme-factory apply ocean-depths to this deck
```

**UI077 · example-skills:canvas-design** Makes original posters and still art as PNG or PDF, starting from a written design philosophy.

```text
example-skills:canvas-design a poster for a chess tournament
```

**UI078 · example-skills:brand-guidelines** Applies Anthropic's own colors and fonts to an artifact.

```text
example-skills:brand-guidelines style this page
```

**UI079 · example-skills:algorithmic-art** Art drawn by code in p5.js, with repeatable randomness and settings you can adjust.

```text
example-skills:algorithmic-art a flow-field piece I can tweak
```

**UI080 · example-skills:slack-gif-creator** Makes animated GIFs sized and checked to work in Slack.

```text
example-skills:slack-gif-creator a rook sliding across the board
```

**UI081 · example-skills:webapp-testing** Tests a web app running on your own computer with Playwright (a browser robot): screenshots, console logs, how the UI behaves.

```text
example-skills:webapp-testing the signup flow on localhost:3000
```

**UI082 · example-skills:web-artifacts-builder** Builds claude.ai artifacts with many parts, using React, Tailwind and shadcn/ui. Not for simple pages.

```text
example-skills:web-artifacts-builder a multi-view artifact with routing
```

### Fix writing

**UI083 · /fix-writing** Paste the text or point at a file and line range. It picks the right tools and rules for you.

```text
/fix-writing README.md:12-40
```

### Humanizer

**UI084 · /humanizer** Removes signs of AI writing: not-X-but-Y contrasts, one-line closers, staged openers, forced lists of three, dashes everywhere, inflated claims, sales language, stock AI words, bold labels, filler.

```text
/humanizer rewrite this PR description
```

### Vale

**UI085 · /vale:setup** Installs Vale (a writing checker), writes .vale.ini, downloads its style rules and does a first run. Only for a repo with no Vale setup yet.

```text
/vale:setup
```

**UI086 · /vale:triage** Turns a huge first run into a decision for each rule: fix, downgrade or switch off. Gives a short plan in order.

```text
/vale:triage vale is too noisy in this repo
```

**UI087 · /vale:fix** Runs Vale and fixes the error-level problems, one pull request per file. Leaves warnings and suggestions for you.

```text
/vale:fix the docs folder
```

**UI088 · /vale:vocab** Adds your own terms (product names, APIs, jargon) to a word list so spell check stops flagging them.

```text
/vale:vocab stop flagging our product names
```

**UI089 · /vale:ci** Sets Vale to run automatically: in GitHub Actions, as a check before each commit, or in another runner.

```text
/vale:ci run vale on pull requests
```

**UI090 · vale <path>** The Vale checker itself, run in a terminal from the repo's main folder.

```text
vale docs/
```

### Stop Slop

**UI091 · /stop-slop** Writes or rewrites text under its rules: no filler openers, no not-X-but-Y, no passive voice, no lists of three, varied sentence length.

```text
/stop-slop write the launch post
```

### Sepia

**UI092 · /sepia:sepia** Picks the right operation and document rules for you.

```text
/sepia:sepia de-AI these release notes
```

**UI093 · /sepia:sepia-review** Points out the signs of AI writing without changing anything.

```text
/sepia:sepia-review this PR reply
```

**UI094 · /sepia:sepia-refactor** Makes small edits in place and keeps your structure.

```text
/sepia:sepia-refactor the postmortem draft
```

**UI095 · /sepia:sepia-recreate** Rewrites the whole piece from the same facts.

```text
/sepia:sepia-recreate this blog post
```

**UI096 · /sepia:sepia-write** Writes a new piece under the rules for its format.

```text
/sepia:sepia-write release notes for v2.3
```

**UI097 · /sepia:sepia-hemingway** Fiction writing in a spare, Hemingway-style voice.

```text
/sepia:sepia-hemingway revise this short story
```

### slop-guard

**UI098 · /slop-guard** Runs the slop-guard checker on a file, folder or pasted text and explains the top problems.

```text
/slop-guard README.md
```

**UI099 · sg -v <path>** The slop-guard checker itself, run in a terminal.

```text
sg -v docs/*.md
```

## Recipes

### Design recipes

**RC01 · New landing page** From blank to a shipped page that does not look templated.

1. /impeccable init: once per project, so later passes know the brand
2. /hallmark <prompt>: build the page in a chosen genre
3. /break-ui: stress the hero and cards with ugly data
4. /web-design-guidelines <path>: rule check before shipping
5. /impeccable polish: final spacing and detail pass

**RC02 · New dashboard or tool** Product screens with a design system that stays consistent next session.

1. /impeccable shape: agree the screen's job and layout first
2. /interface-design: build it and save system.md
3. /break-ui: long names, zero rows, huge numbers
4. /impeccable harden: error, loading and empty states
5. /interface-design:design-review: strict approval pass

**RC03 · This page kind of stinks** Find out why, then fix the worst of it. Stays inside your design system.

1. /impeccable critique <page>: scored review: what's wrong and what to fix first
2. /impeccable typeset: if the critique flagged hierarchy or type
3. /impeccable layout: if it flagged spacing or structure
4. /impeccable colorize: if it flagged flat or muddy color
5. /impeccable polish: tidy up after the bigger passes

**RC04 · Rethink it, rules off** Let it suggest new fonts, colors and hierarchy even if that breaks the design system.

1. /impeccable critique <page>, ignore DESIGN.md and suggest new fonts, colors and hierarchy: a critique that isn't held to the current system
2. /prototype <page> x3: three different directions to look at side by side
3. /impeccable bolder: push the winner further
4. /impeccable document: save the new look as the design system

**RC05 · It looks AI-generated** Rescue a bland or generic screen without starting over.

1. /interface-design:design-deslop: strip the generic tells
2. /impeccable typeset: real type hierarchy
3. /impeccable bolder: give it a point of view
4. /impeccable polish: tidy what the bigger passes left

**RC06 · Motion done properly** Add animation where it helps and nowhere else.

1. /find-animation-opportunities: read-only list of where motion earns its place
2. /animate: build the chosen ones
3. /review-animations: check against the ten standards
4. /animation-performance: only if anything drops frames

**RC07 · Pre-ship check** Catch problems before users do. The first three only report.

1. /impeccable audit: accessibility, performance, theming, scored
2. /web-design-guidelines <path>: file:line rule findings
3. example-skills:webapp-testing: click through the real flow in a browser
4. /impeccable polish: fix what the reports found

**RC08 · Feels right on a phone** Make a web app feel like an installed app instead of a website.

1. /impeccable adapt: layout across screen sizes
2. /mobile-native: tap, notch, 100vh and input-zoom fixes
3. /apple-design: gestures, sheets and springs where it matters

**RC09 · Explore before committing** See real options instead of arguing about one.

1. /impeccable shape: write the brief
2. /prototype <component> x3: three genuinely different versions
3. /impeccable live: refine the winner in the running app

**RC10 · Clean up a repo's docs** Get a noisy first run of Vale (the prose checker) down to problems worth fixing.

1. /vale:triage: decide per rule: fix, downgrade or switch off
2. /vale:vocab: teach it your product names
3. /vale:fix: fix the error-level alerts that remain
4. /humanizer: rewrite the pages that still read as machine-made

**RC11 · Write prose that doesn't sound like AI** Take one piece of writing from draft to ready to send.

1. /stop-slop: draft it with the anti-AI rules on
2. /slop-guard: get a score and the list of AI phrases
3. /humanizer: rewrite those phrases, facts unchanged
4. /slop-guard: score again; it should go up

**RC12 · Type and color system from scratch** Fonts, a palette scale and dark mode, saved so every later pass uses them.

1. /web-typography: pick and pair the faces, set the type scale
2. /oklch-skill: palette scale, dark mode, contrast, Tailwind tokens
3. /impeccable document: save both as DESIGN.md
4. /impeccable audit: check contrast and theming held up

**RC13 · Landing page that converts** From how you pitch the product to a page that's checked for turning visitors into sign-ups.

1. /product-marketing: once per product: audience, claims, voice
2. /copywriting: headline, value props, calls to action
3. /hallmark <prompt>: build the page around that copy
4. /image: a real hero image if the page needs one
5. /cro: what will stop people converting, in order
6. /harsh-review: the blunt pass before you share it

**RC14 · Native iPhone screen** SwiftUI screens that someone who knows iPhones well would trust.

1. /ios-hig-design: the platform patterns this screen should use
2. /impeccable shape: agree the screen's job first
3. /swiftui-pro: review the SwiftUI against modern practice
4. /impeccable audit: native accessibility and platform rules

**RC15 · Usability rescue** People get lost or make mistakes. Find out where, then fix it.

1. /ux-heuristics: usability audit by Nielsen's rules
2. /design-everyday-things: the why: affordances, feedback, mapping
3. /impeccable distill: cut what is in the way
4. /ux-writing: labels and errors that explain themselves

**RC16 · Brutal pre-launch review** Every tough review angle at once, then the fixes. Only when you ask for it.

1. /harsh-review: blunt, evidence-backed, ships the small fixes
2. /steve-jobs-design-review: what to cut for focus
3. /viewport-proof: proof it works at every screen size
4. /impeccable polish: the last detail pass

**RC17 · Dark mode done right** Colors that keep their contrast and character in both light and dark themes.

1. /oklch-skill: build the dark scale in OKLCH
2. /impeccable colorize: apply it with intent, not inversion
3. /impeccable audit: contrast and theming checks
4. /viewport-proof: screenshots of both themes at each size

**RC18 · Interactions that feel alive** Feedback on every action, and motion only where it earns its place.

1. /microinteractions: design the trigger, rule and feedback
2. /animate: build the motion properly
3. /review-animations: check against the ten standards
4. /animation-performance: only if anything drops frames

**RC19 · People sign up and drift away** Design how people get started and come back, instead of hoping they will.

1. /improve-retention: where the drop happens and why
2. /impeccable onboard: first run and empty states
3. /ux-writing: the words on those screens
4. /hooked-ux: a return habit, checked for manipulation

**RC20 · Image-led hero** A page built around a real image instead of a gradient.

1. /image: make the image, sized for where it goes
2. /impeccable shape: plan the hero around it
3. /hallmark redesign <path>: rebuild the page to match
4. /impeccable optimize: keep the image from slowing the page

**RC21 · Cinematic launch page** A memorable launch moment that still loads fast.

1. /top-design: scroll story, dramatic type, motion plan
2. /image: the key visuals
3. /animate: each motion built in the right order
4. /animation-performance: hold the frame rate
5. /viewport-proof: check it on a phone

**RC22 · Hierarchy fix in an hour** The page works but looks amateur.

1. /refactoring-ui: hierarchy, spacing, color and depth
2. /impeccable layout: rhythm and structure
3. /impeccable typeset: type sizes and weights
4. /impeccable polish: tidy the details

**RC23 · A motion system for the whole app** Decide once how the product moves, then bring the existing animation in line.

1. /motion setup: agree the durations, curves and springs; writes MOTION.md
2. /motion review: what to cut, fix and add, with frames as evidence
3. /motion build: fix the worst three, one at a time
4. /motion review: check the result against MOTION.md
