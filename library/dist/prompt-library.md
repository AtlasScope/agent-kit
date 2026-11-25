# Prompt Library

Prompts and commands for coding agents, by area. Open prompt-library.html to search and copy.

## Design

Give a product an original look, or find out what is wrong with a screen and fix it. Type /keen and what you want; typed alone it shows a short menu and suggests one job.

### Make something new

**/keen create** Turns a product idea, a new screen or a tired one into an original creative direction and a built, working result. This is the job for "make me something", not "fix this".

### Set up and plan

**/keen init** Writes PRODUCT.md: who the product is for and what it should feel like. Every other job reads it, so a critique judges against this product and not against design in general.

**/keen document** Writes down the design the product already has, in a DESIGN.md that every later job reads: its colours, text sizes, spacing, shapes, components and the reasons behind them.

**/keen shape** Plans a screen or feature that does not exist yet, before any of it is built. The result is a short brief and three rough layouts to choose from.

### Find out what is wrong

**/keen critique** Says what is wrong with a screen, in order of how much it matters, and which job would fix each thing.

**/keen audit** Measures a screen against published standards and reports what passes, what fails and who each failure stops. Measurements and yes-or-no checks only. For an opinion on whether the design works, the job is critique.

**/keen variants** Builds two or three different versions of one part of a screen, shows them running beside the original, revises any of them on request, and applies the one the person picks.

### Change what is on the screen

**/keen distill** Makes a crowded screen simple by taking things away, so the one thing the screen is for stands out.

**/keen layout** Fixes where things sit on a screen: what comes first, what is grouped with what, and how much room each thing gets. Everything stays; its position and weight change.

**/keen words** Rewrites the words on a screen so a person knows what each thing is, what will happen when they press it, and what to do when something goes wrong.

**/keen onboard** Designs the first few minutes of a product: what a new person sees before they have any data, and how quickly they get to the first thing worth having.

**/keen convert** Reworks a landing, pricing or sign-up page so more of the people who arrive understand the offer and take the next step.

### Change how it looks

**/keen type** Makes the text on a screen easy to read and gives it a clear order: a small set of sizes, each with one purpose.

**/keen colour** Gives a screen a small set of colours where each one has a purpose, and makes sure everything can be read. Also answers to /keen color.

**/keen bolder** Gives a screen that looks safe, flat or like every other product a point of view: it finds what the screen is really about and makes that unmistakable.

**/keen quieter** Calms a screen that shouts: too many colours, weights, borders, shadows or things moving. Everything stays on the screen; it stops competing.

**/keen polish** The finishing pass on a screen whose structure is already right. It fixes the small inconsistencies that make good work look unfinished.

### Make it hold up

**/keen harden** Makes a screen survive real use: real data, slow connections, mistakes and bad luck. Demo data is short, complete and always loads. Real data is none of those.

**/keen adapt** Makes a screen work properly at other sizes and with other ways of pointing: a phone held in one hand, a tablet, a wide monitor, a finger where a mouse was assumed.

**/keen native** Makes a phone or tablet app behave the way its platform's own apps do, so people can use it without learning anything new.

**/keen optimize** Makes a screen feel fast: the main thing appears sooner, taps get an answer at once, and nothing jumps while loading.

**/keen extract** Tidies the design behind the screens without changing how they look: repeated values get one name, and repeated parts become one shared part.

### Also in Agent Kit

**UI108 · /palette-builder** Inspects your current colors and generates an interactive palette workbook so you can preview full color schemes on your own screens before changing any tokens.

```text
/palette-builder the marketing site in apps/web
```

**UI106 · /design-setup** Explains the design kit's two choices in plain words (whether /design starts on its own, and whether it asks before a skill edits files), then saves your answers to your Claude Code settings after showing the change. Claude Code only; takes effect next session.

```text
/design-setup
```

## Motion

Anything that moves: decide how the product moves, plan an entrance, build one animation, or find and fix motion that stutters.

### Commands

**UI100 · /motion** Front door for all animation work — describe what you want and it picks setup, storyboard, build, review, or fix. Typed alone, it audits current motion and suggests three next steps.

```text
/motion the dropdowns feel slow and each one opens differently
```

**UI101 · /motion setup** Audits existing transitions and proposes one small, consistent set of durations, curves, and springs, writing `MOTION.md` and motion tokens after you approve.

```text
/motion setup
```

**UI102 · /motion storyboard** Plans a multi-step animation beat by beat — timing, purpose, total length, and reduced-motion fallback — before any code is written.

```text
/motion storyboard the homepage hero entrance
```

**UI103 · /motion build** Implements one specific animation cleanly using your project's motion values, handling mid-animation interruptions and reduced-motion settings, then verifies it frame by frame.

```text
/motion build make the bottom sheet draggable
```

**UI104 · /motion review** Runs a read-only audit of existing motion with frame captures, listing what to delete first, what is broken or choppy, and where feedback is missing.

```text
/motion review the checkout flow
```

**UI105 · /motion fix** Reproduces choppy, flickering, restarting, or sluggish motion, measures the cause, applies the smallest fix, and recaptures frames to confirm.

```text
/motion fix the sidebar stutters when it opens on my phone
```

**RC23 · A motion system for the whole app** Decide once how the product moves, then bring the existing animation in line.

1. /motion setup: agree the durations, curves and springs; writes MOTION.md
2. /motion review: what to cut, fix and add, with frames as evidence
3. /motion build: fix the worst three, one at a time
4. /motion review: check the result against MOTION.md

### Prompts that work without the plugin

**MO02 · Animations that cost frames** Finds animations that trigger expensive browser recalculations and stutter on phones or older laptops, backed by throttled performance recordings.

```text
Find animations and transitions that trigger expensive layout or paint work per frame (animating width, height, top, left, margin, padding, heavy shadows or blurs, or driving styles from scroll/pointer events through React or component state). For the worst three candidates, record the interaction in a browser with CPU throttling enabled and report layout counts and dropped frames. Propose a cheaper alternative (such as transform or opacity) and note any visual tradeoff.
```

**MO01 · Motion nobody chose** Shows whether the app's motion follows a system or was typed one animation at a time.

```text
List every animation and transition in this codebase with its duration, easing and animated properties. Count the distinct durations and the distinct easing curves. Find values used only once, transitions that name no property or no easing, and places that should share a value and do not. Propose the smallest set of shared durations and curves that covers what exists, and show which existing values map to which.
```

**MO04 · Animations that restart, block or never finish** Catches animations that look fine when clicked slowly and break under fast, impatient real-world clicking — restarting awkwardly, ignoring taps, or vanishing without exiting.

```text
Find animations and transitions that break when users act quickly instead of waiting for them to finish. Check for keyframe animations that restart abruptly on rapid triggers, exit animations skipped because elements unmount immediately, clicks or keyboard input blocked until a transition ends, focus shifting only after an animation completes, and end states that snap back to a different resting style. Reproduce up to three of the most reachable cases by re-triggering mid-animation, and propose the smallest fix for each.
```

**MO03 · Motion with no off switch** Checks how the app behaves when a user turns on "Reduce Motion" on their phone or computer, catching dizzying loops, trapped gestures, and content that fails to appear.

```text
Audit how this product behaves when the user's operating system requests reduced motion (`prefers-reduced-motion: reduce`). List every animation that translates, scales, rotates, or loops and check whether it has a reduced-motion fallback. Flag content that stays invisible if an entrance animation is skipped, auto-playing motion lasting over five seconds without a pause control, and drag/swipe gestures lacking a button or keyboard alternative. For each gap, specify the sensible reduced-motion replacement (usually a brief opacity fade or instant change).
```

**MO05 · Motion with no job** Audits every animation and lists the decorative or repetitive ones to delete or shorten so the interface feels snappier right away.

```text
Inventory every animation and transition in this product and state what concrete job it does for the user: confirming input, showing where an element came from or went, orienting navigation, indicating loading, or highlighting a state change. Flag every animation that conveys nothing or runs so frequently that it slows people down (menus, tooltips, keyboard-driven actions). Recommend remove, shorten, or keep for each with one sentence of reasoning. Do not propose adding new animations.
```

**MO06 · State changes with no feedback** Finds the few high-impact moments where something saves, deletes, or shifts silently and leaves users wondering if their click worked.

```text
Walk the product's main user flows and list up to ten moments where the interface changes with no visible feedback: a button press with no response, a deleted row vanishing abruptly, a panel appearing with no spatial cue, a multi-second wait with no loading indicator, or a save/error that happens silently. Exclude rapid, high-frequency actions users trigger dozens of times per minute. Rank the gaps by how much confusion each causes, and write a one-line motion spec (what changes, duration, and reduced-motion behavior) for each.
```

## Bugs and speed

Find out why something broke or got slow, prove it, and fix the cause. Type /engineer and describe what is going on; it picks one starting move.

### Start here

**EC01 · /engineer** Takes your plain-English description of a bug, slowdown, or worry and picks the single best starting prompt or skill from this library, explaining why. (In Codex: `$engineer`.)

```text
/engineer
```

**EC36 · /engineering-setup** Walks you through two settings for Claude Code — whether `/engineer` and `/database` can activate automatically from plain chat, and whether they keep a local pick log — and saves your choice after confirmation.

```text
/engineering-setup
```

### Something broke

**EC02 · /diagnosing-bugs** For hard bugs and slowdowns. Builds a check that fails on the bug, shrinks it, ranks likely causes, adds logging, fixes it with a test that keeps it from coming back, then cleans up.

```text
/diagnosing-bugs
```

**A06 · Code that relies on lucky timing** Finds background steps, requests, or UI events that silently assume one thing finishes before another without enforcing it.

```text
Find asynchronous operations whose correctness relies on events arriving in a lucky order without an explicit lock, sequence check, or state guard. Trace scheduling, retries, cancellation, and concurrent writes; reproduce the highest-risk case and propose the smallest enforceable contract.
```

**R06 · Half-finished failures** Traces what gets left stuck or half-saved when an action crashes, times out, or gets cancelled midway.

```text
Trace error, timeout, and cancellation paths for database transactions, locks, file handles, temporary files, background jobs, and external network calls. Find paths that leave resources held open or data half-committed when something fails midway, and demonstrate the highest-risk case with controlled failure injection where practical.
```

**R04 · Dates, times and time zones** Hunts down date and clock bugs around midnight, daylight saving shifts, expirations, and users in other time zones.

```text
Audit how this application handles dates and time: time zones, daylight saving transitions, day boundaries, expirations, scheduled jobs, client-versus-server clock skew, and historical date queries.
```

**G06 · Screens showing a change that was refused** Checks features that update the screen immediately before the server responds, to see if rejected saves stay stuck on screen looking saved.

```text
Trace every flow where the interface updates local state or cache optimistically before the server confirms the write. Show what happens to screen accuracy, queued actions, and error notices when the server rejects the request, times out, or returns different canonical values.
```

**G04 · When an outside service goes down** Maps what happens to your app when Stripe, an AI provider, email, or another third-party API hangs, rate-limits you, or goes offline.

```text
Assume each external API, AI provider, or webhook source this product depends on hangs for 30 seconds, returns 429 or 503 for an hour, or delivers a burst of out-of-order webhooks when it recovers. Trace whether database transactions or connection pools stay held open during those calls, and whether core user flows degrade cleanly or lock up.
```

**R02 · Fallbacks that look like real data** Finds places where an error quietly turns into a normal-looking zero, empty list, or stale value so users never know loading failed.

```text
Trace every place the application quietly substitutes a default, zero, null, stale value, or empty list when a request, query, or calculation fails. Determine whether a user could mistake that fallback for valid, up-to-date information.
```

**EC17 · /variant-analysis** After one bug is found, hunts for the other places with the same root cause.

```text
/variant-analysis
```

**A07 · Timers and connections nobody closes** Finds timers, listeners and connections that nobody clearly owns or shuts off.

```text
Map external side effects and resource lifecycles across this application: connections, subscriptions, listeners, timers, streams, cache entries and background workers. Find unclear ownership, incomplete cleanup and operations that outlive their intended scope. Prioritize evidenced leaks or correctness risks over stylistic patterns.
```

**P07 · Memory that keeps growing** Finds unclosed timers, listeners, connections, and growing caches that make a tab or server sluggish or crash the longer it stays running.

```text
Investigate sustained memory growth and leaked resources across the browser and server: unbounded caches, unremoved event listeners, timers and intervals never cleared, unclosed database or network connections, leaked streams or subscriptions, detached DOM nodes, and retained closures or request payloads. Validate top suspects with repeatable growth checks or heap snapshots where available.
```

### It is slow or costly

**P01 · Slowest journeys, end to end** Measures your five slowest user flows from button click to database reply and pinpoints which steps burn the most time.

```text
Trace and measure the five slowest or heaviest user journeys from browser interaction to database response. Look for unnecessary network round trips, sequential waterfalls, slow queries, repeated work, heavy synchronous handlers blocking other requests, and quadratic loops over growing collections. Measure each step's share of total latency before ranking fixes.
```

**P02 · Steps that wait for no reason** Finds slow chains of steps running one after another that could safely run together, as well as parallel batches with no cap that could overload your database or APIs.

```text
Audit asynchronous hot paths for two opposite problems: (1) independent operations waiting sequentially when they could safely run in parallel without breaking ordering, rate limits, or database transaction boundaries, and (2) parallel fan-outs or queues running with no concurrency cap that could exhaust connection pools, memory, or external API limits at realistic scale.
```

**P04 · Work repeated for nothing** Spots expensive calculations, fetches, or renders that rerun on every click or request even when their inputs never changed.

```text
Find expensive computations, queries, API calls, or UI renders that run repeatedly even though their inputs have not changed. Measure how often each runs and what it costs before considering caching, memoization, batching, or incremental updates.
```

**P03 · Queries that grow badly** Identifies database queries that are fine with sample data and will bog down as rows, users, or accounts pile up.

```text
Find database queries whose execution cost grows disproportionately as rows, users, tenants, or relationships increase. Inspect query plans, missing or unused indexes, N+1 joins, unbounded pagination, and filtering done in application memory instead of the database.
```

**P06 · Loops that blow up with big data** Finds loops inside loops that are fine at 50 rows and painful at 50,000.

```text
Identify potentially quadratic or worse operations in frequently used code paths, including nested joins in application memory, copy-on-every-iteration patterns and repeated scans. Determine realistic input sizes and benchmark the highest-impact candidates before changing their algorithms.
```

**P08 · One slow step that blocks the rest** Finds one slow step that makes every other request wait in line behind it.

```text
Find synchronous work performed in latency-sensitive asynchronous handlers, including filesystem operations, parsing, compression, large serialization and CPU-heavy transforms. Measure event-loop impact and identify safe offloading, batching or scheduling fixes.
```

**P09 · Parallel work with no limit** Finds work run in parallel with no limit, which can swamp the database connections or an outside service.

```text
Examine places where work is parallelized or queued without explicit limits. Find cases where a speed optimization could overwhelm rate limits, memory, connection pools or a downstream service; propose and test concurrency bounds with realistic load.
```

**P05 · What breaks at ten times the size** Projects your current numbers tenfold to show which database limit, hosting cap, or code bottleneck fails first if growth takes off.

```text
Model what happens when this product's stored data and concurrent active users grow tenfold. Use real table counts, request rates, query plans, and hosting/database plan limits to identify the first bottlenecks that break or spike cost.
```

### Tests that prove it works

**T01 · Unit tests that give false comfort** Finds features whose automated checks all pass and that still break for real people.

```text
Find critical user journeys that have extensive unit-test coverage but insufficient evidence that they work end to end. Strengthen the smallest set of tests that closes the real gaps.
```

**T06 · What the tests really prove** Checks what your tests actually prove about key user flows, exposes mocked-out or toothless tests that still pass when features break, and adds one real check for the biggest gap.

```text
Audit the test suite covering this product's critical user journeys. Look for three failure modes: (1) heavy unit-test coverage that mocks away real auth, database, or browser behavior so broken integrations still pass, (2) assertions that test implementation details or cannot fail meaningfully when user behavior breaks, and (3) critical flows with no end-to-end check at all. For the single highest-risk gap, write one independent test that would catch a real user-facing regression.
```

**T02 · Tests that can't fail** Finds tests that pass no matter what.

```text
Find tests that would continue passing if the underlying feature stopped working. Examine mocks, fixtures, assertions, and tests that merely reproduce implementation details.
```

**EC03 · /tdd** Writes the tests first, one small working slice at a time. Agrees with you where the tests will hook into the code before writing any.

```text
/tdd
```

**EC18 · /property-based-testing** Writes and reviews property tests (tests that throw many generated inputs at a rule) with fast-check or Hypothesis.

```text
/property-based-testing
```

**EC20 · /spec-to-code-compliance** Checks code against the document that specifies it, one requirement at a time.

```text
/spec-to-code-compliance
```

## Data

Prove the numbers are right, make imports cheaper and safer, and change a database without breaking it. Everything here starts read-only.

### Start here

**EC35 · /database** Takes your plain-English description of a PostgreSQL problem, picks the right database investigation from this library, and runs it read-only. (In Codex: `$database`.)

```text
/database
```

**PG00 · Make this database easier to trust and operate** Runs one high-level check across a PostgreSQL database and ranks the handful of root issues causing most of the slowness, cost, or data-quality risk.

```text
Study how this PostgreSQL database actually works today — schema, relationships, data sources, reads, writes, background jobs, migrations, and consumers — using the live database state, repository, and operational evidence instead of documentation alone.

Identify the few root problems driving the most complexity, wasted work, data-quality risk, and operating cost. Focus on data correctness, reliable writes, duplicated logic, unused database objects, historical accuracy, and clarity for future maintenance.

Rank findings by measured impact. Separate confirmed problems from theoretical worries, and recommend changes that simplify the database instead of adding new infrastructure or recurring review processes.

Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.

Bring back: A short ranked list of confirmed problems, each naming the tables, writers, and readers involved, the proof (query plans, counts, or source checks), and the smallest change that helps.

If this describes the project, say so and stop instead: You already know the exact Postgres issue and should run the narrower prompt for it, or this project does not use PostgreSQL.

Avoid: Turning a one-time audit into ongoing process or extra infrastructure.
```

### Are the numbers right?

**D02 · Where did this number come from?** Traces every calculated number on screen back to its raw source records and recomputes an example independently to prove it is right.

```text
Trace each important derived number shown to users back to its raw source records, transformation logic, filters, and assumptions. Recompute a representative sample independently from raw inputs without relying on the existing calculation code to check itself. Flag discrepancies in definitions, units, dates, or source selection, and distinguish one-off errors from shared calculation bugs.
```

**D01 · Missing vs zero vs stale** Spots places where "unknown", "not loaded", or "not applicable" quietly turns into `0` and corrupts averages, charts, or totals.

```text
Find where this application blurs the difference between missing, zero, unavailable, estimated, stale, and not applicable. Trace how each state is stored, how totals or averages handle it, and what appears on screen.
```

**PG01 · Can we independently prove these numbers?** Rebuilds your most important figures from the original sources to prove whether the database has them right.

```text
Take a representative set of important figures from this database and independently reconstruct them from their original sources. Don't rely on the existing calculation code to verify itself. Find discrepancies in definitions, source selection, units, dates, classifications, and relationships. Determine which errors are isolated and which come from shared logic, then rank corrections by analytical impact.
```

**A04 · Two systems that disagree** Finds facts stored in two places (database vs. Stripe, table vs. cache, client state vs. server) that can quietly drift out of sync.

```text
Find places where the same fact is stored in more than one place — across database tables, derived columns, caches, browser storage, or external services like billing or search. For each pair, trace which copy is authoritative, how they stay in sync, what sequence of failures makes them diverge, and which copies actually earn their keep for speed or history.
```

**PG02 · Find data that is internally consistent but wrong** Checks cross-table totals, accounting identities, and realistic ranges to catch data that passes every database rule yet is still factually wrong.

```text
Look for data in this PostgreSQL database that passes schema constraints and validation yet is analytically wrong. Test cross-table totals, accounting identities, historical continuity, plausible ranges, and expected source coverage. Separate real errors from intentional differences in reporting periods, granularity, or definitions.

Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.

Bring back: Failed cross-table reconciliations, broken identities, and unexpected gaps with example rows and how many records are affected.

If this describes the project, say so and stop instead: The database stores only raw user-entered records with no derived figures, aggregations, or multi-table reconciliations.

Avoid: Flagging intentional differences in reporting periods or definitions as bugs without checking them first.
```

**DBR01 · Is the data actually right?** Several database prompts in order: prove the numbers are right, then fix only what was confirmed.

```text
Is the data actually right? Prove the numbers before fixing anything.
Work through this in order and check in with me after each step. Stay read-only until I approve a change.

1. Start: PG01 when a figure disagrees with its source; PG02 when everything validates but still looks wrong.

Can we independently prove these numbers? (PG01)
Take a representative set of important figures from this database and independently reconstruct them from their original sources. Don't rely on the existing calculation code to verify itself. Find discrepancies in definitions, source selection, units, dates, classifications, and relationships. Determine which errors are isolated and which come from shared logic, then rank corrections by analytical impact.

Find data that is internally consistent but wrong (PG02)
Look for data in this PostgreSQL database that passes schema constraints and validation yet is analytically wrong. Test cross-table totals, accounting identities, historical continuity, plausible ranges, and expected source coverage. Separate real errors from intentional differences in reporting periods, granularity, or definitions.

Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.

Bring back: Failed cross-table reconciliations, broken identities, and unexpected gaps with example rows and how many records are affected.

If this describes the project, say so and stop instead: The database stores only raw user-entered records with no derived figures, aggregations, or multi-table reconciliations.

Avoid: Flagging intentional differences in reporting periods or definitions as bugs without checking them first.

2. If needed: PG03 for identity gaps; PG04 when the meaning of past records matters.

Find where records silently change identity (PG03)
Trace how real-world entities are identified, matched, and linked across imports, source documents, and PostgreSQL tables. Find distinct entities merged by mistake, identical entities duplicated under separate IDs, and historical links that broke across updates. Identify the matching rule responsible and how many rows are affected before proposing fixes.

Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.

Bring back: Confirmed duplicate groups and false merges with their source IDs, the matching rule (file:line), affected row counts, and a repeatable query that surfaces them.

If this describes the project, say so and stop instead: Every data source shares one stable external ID and nothing is matched by name or fuzzy rules.

Avoid: Merging records solely because their names look similar.

Reproduce what the database believed in the past (PG04)
Choose important historical records and determine whether the system can reproduce what was known and reported at a specific past date, using the definitions and evidence available then. Distinguish later source corrections from later classification changes. Find where current logic silently rewrites historical meaning and recommend the smallest reliable solution.

3. Change: Fix only the confirmed shared causes, and add SQL or metric tests for them.

4. Done when: Recomputed examples that now match, an estimate of how much data was affected, and any source limits stated plainly.
```

**G05 · Rounding and unit mix-ups** Catches pennies lost to floating-point math, percentages off by 100x (`0.05` vs `5`), and cents-versus-dollars mismatches across layers.

```text
Trace every calculation involving money, percentages, basis points, quantities, weights, or rates across storage, API payloads, math helpers, and UI formatting. Flag binary floating-point arithmetic used where exact integer or decimal math is required, premature rounding that compounds across sums, and unclear unit conventions (such as cents versus dollars, or 0.05 versus 5.0 for 5%).
```

**EC19 · /dimensional-analysis** Finds bugs from mixed-up units and decimal scaling by labeling each value with its unit.

```text
/dimensional-analysis
```

**D03 · Old records, new meanings** Checks whether changing a rule, plan tier, or category today accidentally rewrites what historical records meant in the past.

```text
Find historical records whose meaning shifts when today's rules, categories, tax rates, plan limits, or schemas are applied retroactively. Check whether the system can still reproduce what a past record or report showed on an earlier date, distinguishing later source corrections from later rule changes. Recommend the smallest reliable fix without over-engineering full bitemporal storage unless truly required.
```

**PG04 · Reproduce what the database believed in the past** Checks whether you can still reproduce what the database said on an earlier date, after the data or the rules changed.

```text
Choose important historical records and determine whether the system can reproduce what was known and reported at a specific past date, using the definitions and evidence available then. Distinguish later source corrections from later classification changes. Find where current logic silently rewrites historical meaning and recommend the smallest reliable solution.
```

**PG03 · Find where records silently change identity** Catches real-world entities (customers, companies, products) that got split into duplicate rows or accidentally merged into one across imports.

```text
Trace how real-world entities are identified, matched, and linked across imports, source documents, and PostgreSQL tables. Find distinct entities merged by mistake, identical entities duplicated under separate IDs, and historical links that broke across updates. Identify the matching rule responsible and how many rows are affected before proposing fixes.

Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.

Bring back: Confirmed duplicate groups and false merges with their source IDs, the matching rule (file:line), affected row counts, and a repeatable query that surfaces them.

If this describes the project, say so and stop instead: Every data source shares one stable external ID and nothing is matched by name or fuzzy rules.

Avoid: Merging records solely because their names look similar.
```

**D05 · Links between records worth adding** Finds links between records worth adding, and ones the evidence does not support.

```text
Identify where data relationships have greater analytical value than isolated fields. Find missing links, broken historical continuity, and relationships the source evidence cannot actually support.
```

**PG11 · Are we storing the same truth multiple times?** Finds the same facts stored in several places that have drifted apart, and says which copy to trust.

```text
Find concepts and values maintained in multiple tables, materialized views, caches or derived columns. Trace which representation is authoritative, why each copy exists, how it stays synchronized, and what happens when the copies disagree. Recommend which duplication is justified by performance or history and which should be removed.
```

### Writes, imports and doubles

**R01 · Safe to run twice?** Finds actions — charges, emails, webhooks, imports, and form submits — that cause double-billing, duplicate sends, or corrupted rows if retried.

```text
Find write operations, webhooks, imports, and user actions that cannot safely run twice or resume after an interruption. Examine duplicate requests, webhook retries, out-of-order arrivals, idempotency keys, unique constraints, and transaction boundaries. Do not assume an ON CONFLICT clause alone guarantees safe reruns; check side effects like emails, charges, and counters too.
```

**R05 · Updates that overwrite each other** Finds places where two tabs, users, webhooks, or jobs edit the same record at once and the slower one silently wipes out the newer change.

```text
Find race conditions and lost-update paths across concurrent UI edits, API calls, caches, webhooks, and background jobs. Prove real risks with a concrete reproduction instead of listing theoretical possibilities.
```

**D04 · Imports that fail quietly** Audits CSV uploads, syncs, and data imports for rows that get dropped, overwritten, duplicated, or attached to the wrong record without throwing an error.

```text
Audit every data import, CSV upload, and external sync for records that can be silently skipped, duplicated, overwritten, or linked to the wrong entity without raising an error. Check matching keys, conflict handling, partial failures, and summary logging.
```

**I04 · Background jobs that hang or stop halfway** Audits scheduled tasks and background queues to see what happens when a job hangs, overlaps with the next run, or dies during a deploy.

```text
Audit every scheduled job, cron task, and background worker for hangs, overlapping runs, partial updates, missing timeouts, unsafe retries, and deploy interruptions.
```

**PG08 · Can we rerun everything without damaging the data?** Checks whether rerunning an import or a failed job can duplicate or damage data, and how to make reruns safe.

```text
Examine the ingestion and correction workflows under retries, interrupted runs, duplicate source files, out-of-order arrivals and repeated execution. Demonstrate where these cases produce duplicate records, lost corrections, partial results or unnecessary rewrites. Find the smallest durable approach that makes each operation safely repeatable.
```

**PG05 · Map every place that writes to the database** Lists every API route, script, trigger, background job, and agent that writes to your core tables, highlighting where two writers can collide.

```text
Map every code path that creates, updates, or deletes rows in the core PostgreSQL tables: API endpoints, scripts, scheduled jobs, database functions, triggers, and automated agents. Show which writer owns each column, where writers overlap, and where two writers can overwrite or contradict each other. Recommend the simplest ownership model the current design supports.

Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.

Bring back: A writer-to-table-and-column map (with triggers and downstream consumers), plus every overlapping or conflicting write path.

If this describes the project, say so and stop instead: Each table is written by a single clear code path.

Avoid: Treating multiple writers as a bug automatically; focus on paths that actually conflict or leave ownership unclear.
```

**PG06 · Stop rewriting data that hasn't changed** Measures how many database writes actually change data versus needlessly rewriting identical rows and inflating Postgres storage and billing.

```text
Measure how much PostgreSQL write activity actually changes meaningful data. Look for repeated upserts rewriting identical rows, unnecessary delete-and-reinsert batches, needless index churn, and cascading refreshes. Identify writes that can be skipped safely without losing audit history, intentional last-seen timestamps, or recovery behavior.

Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.

Anything that changes state, such as a rebuild, replay or migration test, runs only on a separate database with safe test data, never on production.

Bring back: Write volume stats, the share of writes that leave row values unchanged, dead-tuple or bloat figures where measurable, and before/after comparisons on a separate test copy if available.

If this describes the project, say so and stop instead: Write volume is low, or every write updates actually changed values.

Avoid: Suppressing deliberate last-seen timestamps, trigger side effects, or version counters that downstream logic relies on.
```

**PG07 · Is our ingestion process more complicated than necessary?** Follows one full data import from raw source to final Postgres tables and cuts out redundant parsing, intermediate tables, and double work.

```text
Trace one complete data-ingestion run from raw source files or APIs to final PostgreSQL tables. Identify redundant parsing, unnecessary staging tables, repeated validation, duplicate reads, and consolidatable writes. Propose the simplest pipeline that preserves accuracy, source traceability, failure recovery, and re-processing of corrections.

Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.

Anything that changes state, such as a rebuild, replay or migration test, runs only on a separate database with safe test data, never on production.

Bring back: One end-to-end trace from source to final rows, every duplicated step (file:line), the checkpoints recovery relies on, and a simpler pipeline proposal verified against the same outputs on a test copy where practical.

If this describes the project, say so and stop instead: Data arrives in one straightforward step directly into its target table.

Avoid: Stripping away provenance records or recovery checkpoints that let you trace or replay bad imports.
```

**PG09 · Find where write logic should live** Untangles validation and business rules split across app code, Postgres triggers, SQL functions, and background jobs, and picks one clear home for each.

```text
Trace where records are validated, transformed, and written across application code, PostgreSQL functions, triggers, constraints, and background workers. Find rules duplicated across layers or buried where they are hard to test and evolve. Recommend one clear ownership boundary for each rule, without biasing either toward or away from putting logic inside Postgres.

Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.

Bring back: Each rule with every layer that enforces it (file:line), duplicated or conflicting checks, testability tradeoffs, and the simplest ownership boundary.

If this describes the project, say so and stop instead: All write rules already live cleanly in one layer with no database triggers or stored procedures.

Avoid: Defaulting blindly to stored procedures or insisting everything move out of Postgres.
```

**DBR02 · Make ingestion simpler and cheaper** Several database prompts in order to make imports cheaper and simpler without losing where the data came from.

```text
Make ingestion simpler and cheaper Less work per import, without losing provenance or corrections.
Work through this in order and check in with me after each step. Stay read-only until I approve a change.

1. Start: PG05 when it is unclear who writes what; otherwise PG07.

Map every place that writes to the database (PG05)
Map every code path that creates, updates, or deletes rows in the core PostgreSQL tables: API endpoints, scripts, scheduled jobs, database functions, triggers, and automated agents. Show which writer owns each column, where writers overlap, and where two writers can overwrite or contradict each other. Recommend the simplest ownership model the current design supports.

Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.

Bring back: A writer-to-table-and-column map (with triggers and downstream consumers), plus every overlapping or conflicting write path.

If this describes the project, say so and stop instead: Each table is written by a single clear code path.

Avoid: Treating multiple writers as a bug automatically; focus on paths that actually conflict or leave ownership unclear.

Is our ingestion process more complicated than necessary? (PG07)
Trace one complete data-ingestion run from raw source files or APIs to final PostgreSQL tables. Identify redundant parsing, unnecessary staging tables, repeated validation, duplicate reads, and consolidatable writes. Propose the simplest pipeline that preserves accuracy, source traceability, failure recovery, and re-processing of corrections.

Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.

Anything that changes state, such as a rebuild, replay or migration test, runs only on a separate database with safe test data, never on production.

Bring back: One end-to-end trace from source to final rows, every duplicated step (file:line), the checkpoints recovery relies on, and a simpler pipeline proposal verified against the same outputs on a test copy where practical.

If this describes the project, say so and stop instead: Data arrives in one straightforward step directly into its target table.

Avoid: Stripping away provenance records or recovery checkpoints that let you trace or replay bad imports.

2. If needed: PG06 for writes that change nothing; PG08 for replay or correction failures; PG09 for validation done in several places.

Stop rewriting data that hasn't changed (PG06)
Measure how much PostgreSQL write activity actually changes meaningful data. Look for repeated upserts rewriting identical rows, unnecessary delete-and-reinsert batches, needless index churn, and cascading refreshes. Identify writes that can be skipped safely without losing audit history, intentional last-seen timestamps, or recovery behavior.

Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.

Anything that changes state, such as a rebuild, replay or migration test, runs only on a separate database with safe test data, never on production.

Bring back: Write volume stats, the share of writes that leave row values unchanged, dead-tuple or bloat figures where measurable, and before/after comparisons on a separate test copy if available.

If this describes the project, say so and stop instead: Write volume is low, or every write updates actually changed values.

Avoid: Suppressing deliberate last-seen timestamps, trigger side effects, or version counters that downstream logic relies on.

Can we rerun everything without damaging the data? (PG08)
Examine the ingestion and correction workflows under retries, interrupted runs, duplicate source files, out-of-order arrivals and repeated execution. Demonstrate where these cases produce duplicate records, lost corrections, partial results or unnecessary rewrites. Find the smallest durable approach that makes each operation safely repeatable.

Find where write logic should live (PG09)
Trace where records are validated, transformed, and written across application code, PostgreSQL functions, triggers, constraints, and background workers. Find rules duplicated across layers or buried where they are hard to test and evolve. Recommend one clear ownership boundary for each rule, without biasing either toward or away from putting logic inside Postgres.

Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.

Bring back: Each rule with every layer that enforces it (file:line), duplicated or conflicting checks, testability tradeoffs, and the simplest ownership boundary.

If this describes the project, say so and stop instead: All write rules already live cleanly in one layer with no database triggers or stored procedures.

Avoid: Defaulting blindly to stored procedures or insisting everything move out of Postgres.

3. Change: Make the smallest change to one cause at a time, keeping provenance and corrections.

4. Done when: The same results for reference inputs, measurably less work, and retries that do no harm.
```

### Schema and cost

**PG10 · Which database objects no longer earn their keep?** Inventories your Postgres views, materialized views, triggers, functions, and indexes to flag unused or redundant objects and what removing each would risk.

```text
Inventory the tables, views, materialized views, functions, triggers, and indexes in this PostgreSQL database. Flag obsolete, redundant, or overlapping objects and unnecessary dependency chains. Verify actual readers and dynamic callers before suggesting removal, and rank candidates by complexity eliminated and migration risk.

Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.

Bring back: A dependency map of database objects, usage stats where available, ranked removal candidates, and the migration risk for each.

If this describes the project, say so and stop instead: A small schema where every table, view, and index has a known active reader.

Avoid: Marking objects unused without checking dynamic SQL, reporting tools, or external database consumers.
```

**PG12 · Can the schema be easier to understand without losing depth?** Spots confusing table names, overloaded columns, and tangled schema boundaries that keep tripping up people and coding agents.

```text
Review this PostgreSQL schema's structure and naming as if onboarding a senior engineer unfamiliar with the repo. Identify misleading table or column names, tables mixing unrelated responsibilities, inconsistent naming conventions, and hidden relationships. Recommend only the least disruptive improvements (such as views, comments, or targeted boundary cleanups) that reduce confusion without losing historical detail or triggering risky migrations.

Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.

Bring back: Specific schema confusions tied to real bugs or agent mistakes, a clear entity map, and low-risk naming or boundary fixes.

If this describes the project, say so and stop instead: The schema is small and neither you nor your agents have misread it recently.

Avoid: Proposing cosmetic renames or wide migrations that break live queries for minor tidy-ups.
```

**DBR03 · Simplify a crowded schema** Several database prompts in order to cut the views, functions and tables you don't need, with the same results.

```text
Simplify a crowded schema Fewer objects with the same outcomes.
Work through this in order and check in with me after each step. Stay read-only until I approve a change.

1. Start: Inventory objects and their real consumers.

Which database objects no longer earn their keep? (PG10)
Inventory the tables, views, materialized views, functions, triggers, and indexes in this PostgreSQL database. Flag obsolete, redundant, or overlapping objects and unnecessary dependency chains. Verify actual readers and dynamic callers before suggesting removal, and rank candidates by complexity eliminated and migration risk.

Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.

Bring back: A dependency map of database objects, usage stats where available, ranked removal candidates, and the migration risk for each.

If this describes the project, say so and stop instead: A small schema where every table, view, and index has a known active reader.

Avoid: Marking objects unused without checking dynamic SQL, reporting tools, or external database consumers.

2. If needed: PG11 for copies of the same fact; PG12 for confusing names; PG17 before any schema change ships.

Are we storing the same truth multiple times? (PG11)
Find concepts and values maintained in multiple tables, materialized views, caches or derived columns. Trace which representation is authoritative, why each copy exists, how it stays synchronized, and what happens when the copies disagree. Recommend which duplication is justified by performance or history and which should be removed.

Can the schema be easier to understand without losing depth? (PG12)
Review this PostgreSQL schema's structure and naming as if onboarding a senior engineer unfamiliar with the repo. Identify misleading table or column names, tables mixing unrelated responsibilities, inconsistent naming conventions, and hidden relationships. Recommend only the least disruptive improvements (such as views, comments, or targeted boundary cleanups) that reduce confusion without losing historical detail or triggering risky migrations.

Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.

Bring back: Specific schema confusions tied to real bugs or agent mistakes, a clear entity map, and low-risk naming or boundary fixes.

If this describes the project, say so and stop instead: The schema is small and neither you nor your agents have misread it recently.

Avoid: Proposing cosmetic renames or wide migrations that break live queries for minor tidy-ups.

Are our database changes safe before we merge? (PG17)
Review this database change against the live schema, existing consumers, prior migrations and deployment process. Establish whether it preserves current records, supports old and new application versions during rollout, and can be verified on an isolated database. Identify the smallest necessary migration and a realistic recovery path before approving it.

3. Change: Confirm consumers before retiring anything, and keep old and new versions working during rollout.

4. Done when: Less complexity with unchanged results for users and data.
```

**PG13 · Find the true sources of database waste** Measures which Postgres tables, unused indexes, bloated rows, and heavy queries consume the most storage, CPU, and money.

```text
Measure which PostgreSQL tables, indexes, queries, and background maintenance tasks consume the most storage, CPU, and write I/O. Separate necessary capacity from avoidable waste — unused indexes, table bloat, row churn, bad query plans, and unnecessary full scans. Base every recommendation on observed workload stats.

Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.

Bring back: Top table and index sizes, highest-cost queries, index usage counts, dead-row/bloat metrics, EXPLAIN output for top offenders, and expected savings per change.

If this describes the project, say so and stop instead: Postgres storage, CPU, and billing are small and steady.

Avoid: Judging index usefulness by grepping code alone, or optimizing read speed while ignoring write overhead.
```

**PG14 · What will become expensive as the database grows?** Estimates when each table and query will get slow or expensive as the data grows.

```text
Use actual table sizes, row growth, query plans and workload patterns to identify the first database operations likely to become disproportionately expensive as data grows. Evaluate indexing, partitioning, pagination, aggregation and retention only where the evidence justifies them. Show what scale would trigger a change rather than optimizing everything prematurely.
```

**DBR04 · Reduce PostgreSQL resource cost** Several database prompts in order to lower the Postgres bill where the measurements say the money goes.

```text
Reduce PostgreSQL resource cost Spend less where the measurements say the money goes.
Work through this in order and check in with me after each step. Stay read-only until I approve a change.

1. Start: Measure the top consumers first.

Find the true sources of database waste (PG13)
Measure which PostgreSQL tables, indexes, queries, and background maintenance tasks consume the most storage, CPU, and write I/O. Separate necessary capacity from avoidable waste — unused indexes, table bloat, row churn, bad query plans, and unnecessary full scans. Base every recommendation on observed workload stats.

Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.

Bring back: Top table and index sizes, highest-cost queries, index usage counts, dead-row/bloat metrics, EXPLAIN output for top offenders, and expected savings per change.

If this describes the project, say so and stop instead: Postgres storage, CPU, and billing are small and steady.

Avoid: Judging index usefulness by grepping code alone, or optimizing read speed while ignoring write overhead.

2. If needed: PG06 for write churn; PG14 when growth is the driver; P03 for one slow query.

Stop rewriting data that hasn't changed (PG06)
Measure how much PostgreSQL write activity actually changes meaningful data. Look for repeated upserts rewriting identical rows, unnecessary delete-and-reinsert batches, needless index churn, and cascading refreshes. Identify writes that can be skipped safely without losing audit history, intentional last-seen timestamps, or recovery behavior.

Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.

Anything that changes state, such as a rebuild, replay or migration test, runs only on a separate database with safe test data, never on production.

Bring back: Write volume stats, the share of writes that leave row values unchanged, dead-tuple or bloat figures where measurable, and before/after comparisons on a separate test copy if available.

If this describes the project, say so and stop instead: Write volume is low, or every write updates actually changed values.

Avoid: Suppressing deliberate last-seen timestamps, trigger side effects, or version counters that downstream logic relies on.

What will become expensive as the database grows? (PG14)
Use actual table sizes, row growth, query plans and workload patterns to identify the first database operations likely to become disproportionately expensive as data grows. Evaluate indexing, partitioning, pagination, aggregation and retention only where the evidence justifies them. Show what scale would trigger a change rather than optimizing everything prematurely.

Queries that grow badly (P03)
Find database queries whose execution cost grows disproportionately as rows, users, tenants, or relationships increase. Inspect query plans, missing or unused indexes, N+1 joins, unbounded pagination, and filtering done in application memory instead of the database.

3. Change: Take the biggest measured savings first. No speculative indexes or partitions.

4. Done when: Workload figures before and after, with no loss of correctness.
```

### Changing it safely

**PG17 · Are our database changes safe before we merge?** Checks a database change before you merge it: what it touches, whether the running app survives it, and how to undo it.

```text
Review this database change against the live schema, existing consumers, prior migrations and deployment process. Establish whether it preserves current records, supports old and new application versions during rollout, and can be verified on an isolated database. Identify the smallest necessary migration and a realistic recovery path before approving it.
```

**G02 · Database changes during a deploy** Checks a pending database or API change to verify existing records survive, running users and old app versions don't break mid-deploy, and a real rollback path exists.

```text
Review the pending database migration or API schema change against the current live schema, previous release's queries, active background workers, and deployment sequence. Check whether it preserves existing data, causes table locks, breaks older client bundles or workers still draining during deploy (such as column renames, drops, or non-nullable additions), and whether a real rollback or recovery path exists. Never assume reverting app code alone rolls back a schema change.
```

**DBR05 · Ship or recover safely** Several database prompts in order to ship a schema change, or test a restore, safely.

```text
Ship or recover safely A schema change or a restore you have actually tested.
Work through this in order and check in with me after each step. Stay read-only until I approve a change.

1. Start: PG17 for a change about to ship; PG15 for rebuilding or recovery.

Are our database changes safe before we merge? (PG17)
Review this database change against the live schema, existing consumers, prior migrations and deployment process. Establish whether it preserves current records, supports old and new application versions during rollout, and can be verified on an isolated database. Identify the smallest necessary migration and a realistic recovery path before approving it.

Can we rebuild this database from its sources? (PG15)
Determine whether this PostgreSQL database can be rebuilt from the repository, migration files, original source materials, and retained records. Flag anything that exists only in production, manual fixes that cannot be replayed, and data that would be lost forever. Where feasible, test rebuilding onto an isolated test database and compare sampled rows and relationships against production.

Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.

Anything that changes state, such as a rebuild, replay or migration test, runs only on a separate database with safe test data, never on production.

Bring back: The exact inputs and migration sequence required to rebuild, any irreplaceable production-only state, and a sampled comparison from an isolated rebuild if run.

If this describes the project, say so and stop instead: The database is either a disposable cache or holds primary user-authored records backed up via snapshots instead of rebuilt from external sources.

Avoid: Testing restores against production, or treating the existence of backup files as proof they restore cleanly.

2. If needed: G02 for deploy timing; R06 for half-finished failures; PG04 when past results must not move.

Database changes during a deploy (G02)
Review the pending database migration or API schema change against the current live schema, previous release's queries, active background workers, and deployment sequence. Check whether it preserves existing data, causes table locks, breaks older client bundles or workers still draining during deploy (such as column renames, drops, or non-nullable additions), and whether a real rollback or recovery path exists. Never assume reverting app code alone rolls back a schema change.

Half-finished failures (R06)
Trace error, timeout, and cancellation paths for database transactions, locks, file handles, temporary files, background jobs, and external network calls. Find paths that leave resources held open or data half-committed when something fails midway, and demonstrate the highest-risk case with controlled failure injection where practical.

Reproduce what the database believed in the past (PG04)
Choose important historical records and determine whether the system can reproduce what was known and reported at a specific past date, using the definitions and evidence available then. Distinguish later source corrections from later classification changes. Find where current logic silently rewrites historical meaning and recommend the smallest reliable solution.

3. Change: Run migrations and restores on a separate database, check compatibility, and plan the recovery.

4. Done when: A migration or restore tested on a separate database, and no claim about production that wasn't proved.
```

**PG15 · Can we rebuild this database from its sources?** Checks whether your Postgres database could be recreated from scratch using your repo, migrations, and raw source files, and exposes what exists only in production.

```text
Determine whether this PostgreSQL database can be rebuilt from the repository, migration files, original source materials, and retained records. Flag anything that exists only in production, manual fixes that cannot be replayed, and data that would be lost forever. Where feasible, test rebuilding onto an isolated test database and compare sampled rows and relationships against production.

Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.

Anything that changes state, such as a rebuild, replay or migration test, runs only on a separate database with safe test data, never on production.

Bring back: The exact inputs and migration sequence required to rebuild, any irreplaceable production-only state, and a sampled comparison from an isolated rebuild if run.

If this describes the project, say so and stop instead: The database is either a disposable cache or holds primary user-authored records backed up via snapshots instead of rebuilt from external sources.

Avoid: Testing restores against production, or treating the existence of backup files as proof they restore cleanly.
```

**PG16 · Which decisions should an expert agent make without me?** Writes down the rules an agent can use to settle the data questions it keeps asking you.

```text
Find recurring database decisions that agents currently escalate to me, including field classification, record matching, write conflicts, source precedence and schema choices. Determine which can be resolved through established standards, existing precedent and authoritative evidence. Make the decision rules reusable, identify their limits, and reserve escalation for genuine product or risk decisions.
```

## Navigation

People get lost, Back does the wrong thing, a filter resets, or a shared link opens the wrong view. Find the cause, decide whether the structure is the problem, and prove the fix in a browser.

### Commands

**EC23 · /experience-architecture:diagnose** Investigates broken navigation, confusing menus, Back-button bugs, reset filters, and broken shared links, stating whether the page structure itself needs rethinking.

```text
/experience-architecture:diagnose
```

**EC24 · /experience-architecture:rethink** Answers structural questions ("should these two pages merge?", "where does this feature belong?") with concrete options, a clickable prototype for major changes, and a transition plan that keeps old links working.

```text
/experience-architecture:rethink
```

**EC25 · /experience-architecture:verify** Tests real user journeys in a browser (Back/Forward, refresh, signed-out links, different accounts, screen widths) and saves repeatable PASS/FAIL checks without logging secrets.

```text
/experience-architecture:verify
```

### Prompts that work without the plugin

**R07 · Lost place: Back, refresh and shared links** Tests Back, Forward, page refresh, new tabs, and shared URLs to find where filters reset, drafts disappear, or pasted links land on the wrong screen.

```text
Check whether this application preserves the user's place. In a local or staging browser (never production with real accounts), open lists, filters, tabs, modals, and detail records, then test Back, Forward, page refresh, opening links in a new tab, and opening copied URLs in a fresh session both signed out and as another user. Trace every lost filter, scroll jump, wiped draft, broken Back action, or wrong landing screen to the code that owns that state.
```

**A08 · Screens that fight how people work** Checks whether confusing screens are caused by how pages and menus are organized overall, then proposes a cleaner site map if the structure itself is the problem.

```text
Map this product's pages, routes, and navigation against the real jobs users come to do. Look for pages that should merge, shrink into a tab or panel, or go away; competing menus pointing to the same destinations; and workflows users must piece together across multiple screens. State clearly whether the underlying page structure causes two or more of these issues; if not, keep the structure and recommend local fixes.
```

## Hard-to-change code

Agents break nearby things on small edits, or every change takes longer than it should. Find what makes the code hard to change and make it simpler.

### Find it

**EC04 · /improve-codebase-architecture** Finds parts of the code that add complexity without doing much, writes a before-and-after report, then talks the changes through with you.

```text
/improve-codebase-architecture
```

**A01 · Status hidden in a pile of flags** Finds features tracking status through scattered yes/no flags (`isPaid`, `isCancelled`, `isPending`) that allow impossible combinations to happen.

```text
Find implicit state machines where a feature's lifecycle is scattered across separate boolean flags, conditionals, and UI checks instead of one explicit status. Identify reachable invalid combinations and unclear transitions.
```

**A02 · Meaning drift across the stack** Checks whether one core business word (like "order", "project", or "member") means slightly different things in the UI, API, database, and background jobs.

```text
Trace one core business concept end to end across the UI, API, database schema, and background jobs. If I did not name a specific concept, pick the single most central entity in this product and state which one you chose. Find every place its meaning, fields, nullability, or validation rules shift between layers.
```

**A03 · Layers that don't earn their keep** Identifies unnecessary wrappers, factories, and pass-through helpers you can delete so the codebase is smaller and easier for agents to edit safely.

```text
Find code abstractions that add indirection without real benefit: single-use wrappers, generic factories, deep inheritance, and pass-through utilities that make changes harder to follow than plain direct code. Separate dead weight from thin adapters that legitimately isolate an unstable third-party SDK or create a test boundary.
```

**A05 · Old design choices that now cost you** Pinpoints early technical shortcuts that made sense on day one and now cause recurring bugs, workarounds, or slow delivery.

```text
Examine the codebase and git history for early architectural choices that were reasonable when the project started and now create measurable friction: recurring bugs, repeated workarounds, or slow feature work. Separate real operational liabilities from out-of-fashion tech preferences.
```

**R03 · Rules the data never enforces** Uncovers core business rules everyone assumes are true (such as "no negative balance" or "one owner per account") that neither the server nor database actually blocks.

```text
Identify critical business invariants this product assumes (such as non-negative balances, unique ownership, valid status combinations, or plan limits) that are enforced only in UI code or never enforced at all. Recommend the right enforcement layer (database constraint, schema validation, or server check) and write a test demonstrating how the top rule can be broken today.
```

**EC21 · /audit-context-building** Reads the code one function at a time and writes down what each one assumes, before any bug hunt starts.

```text
/audit-context-building
```

### Fix it

**M12 · Deepen modules, simplify interfaces** Runs a focused cleanup pass over recently changed code to merge duplicated logic and hide messy internals behind one clear entry point.

```text
Run a cleanup pass on the code touched by this branch or recent change. Look for logic duplicated in multiple places, functions whose callers need to know internal details, and thin pass-through wrappers that add indirection without value. Merge duplicates, put the core logic behind one clear entry point, and keep each interface simpler than the work inside it. Keep external behavior identical: run the existing tests before and after, and skip anything you cannot verify is safe. Summarize what you merged, moved, or deleted in plain English first, with file paths underneath.
```

**M04 · Simpler first** Makes the agent try solving the problem by removing an existing layer, setting, or special case before adding anything new.

```text
Before adding any new code, layer, setting, table, or dependency, look for something you can remove instead. Check whether deleting a redundant wrapper, special case, duplicate path, or unused rule solves the problem or makes it simpler. Only if removal cannot solve it, propose the smallest addition that works and justify each new piece. Judge options by how little there will be to understand and maintain next month, avoiding unnecessary moving parts.
```

**EC28 · /simplify** Scans recently changed code for duplicated logic or avoidable complexity and tidies it directly.

```text
/simplify
```

## Before you ship

Reviews that report first, so you decide what gets fixed: bugs, security, how it looks on every screen size, and whether merged really means live.

### Review the change

**EC26 · /code-review** Reviews uncommitted changes or a pull request for bugs and logic errors at your chosen depth.

```text
/code-review
```

**EC31 · /harsh-review** Gives a blunt, severity-ranked critique of a branch, page, or plan backed by evidence, then applies and verifies up to four small, certain fixes right away.

```text
/harsh-review
```

**EC32 · /viewport-proof** Opens your app at phone, tablet, and desktop sizes, captures screenshots, and reports whether the layout is ready to ship.

```text
/viewport-proof
```

**EC15 · /differential-review:diff-review** Security review of a set of code changes, using their history and how many other places each change could affect.

```text
/differential-review:diff-review
```

### Security

**EC27 · /security-review** Checks the unmerged changes on your current branch for security holes before you ship.

```text
/security-review
```

**T03 · Outside input reaching sensitive actions** Traces every form field, upload, URL parameter, webhook, and AI output from entry to sensitive actions to find missing permission or safety checks.

```text
Trace every untrusted external input — forms, URL parameters, file uploads, headers, webhooks, and AI model outputs — from entry point to sensitive operations (database writes, auth changes, billing, file access, admin actions, outbound requests). Check for missing authorization or ownership checks, tenant isolation gaps, injection vectors, and unsafe parsing.
```

**T05 · Security checks that fail open** Finds sign-in, permission, or webhook checks that accidentally let people through when a setting is missing, a service errors out, or a request is malformed.

```text
Audit every authentication, authorization, rate-limit, and webhook-signature check for fail-open behavior: cases where a missing environment variable, null user object, thrown exception, network timeout, or malformed request results in access being granted instead of denied.
```

**G03 · Hidden data anyone can read** Checks API responses and server-rendered page data for private database fields sent to the browser and merely hidden from view.

```text
Inspect API responses, Server Component props, SSR serialization payloads, and RPC returns sent from server to browser. Find places where full database rows or internal objects (internal flags, private emails, other tenants' IDs, tokens, audit metadata, or large unused blobs) are shipped to the client and merely left unrendered in the UI.
```

**T04 · Risk from outside packages** Audits installed third-party packages and automated GitHub/CI workflows for known vulnerabilities, risky install scripts, and overly broad secret permissions.

```text
Audit dependency and CI supply-chain exposure: known security advisories matching installed versions, package install scripts, GitHub Actions or CI workflows triggered by untrusted pull requests, overly broad workflow permissions, and which jobs can read deployment secrets.
```

**EC12 · /insecure-defaults:audit** Finds unsafe defaults: fallback secrets, default passwords, switches that let everything through when they fail, weak encryption, loose access rules and debug details leaking out.

```text
/insecure-defaults:audit
```

**EC13 · /supply-chain-risk-auditor** Checks the outside packages your project uses for known security problems, abandoned projects and risky publishers.

```text
/supply-chain-risk-auditor
```

**EC14 · /agentic-actions-auditor** Checks GitHub Actions that run Claude, Codex or Gemini for exposed tokens and prompt injection (hidden instructions in issues and PRs that the AI might follow).

```text
/agentic-actions-auditor
```

**EC16 · /sharp-edges** Finds APIs that are easy to misuse and configuration options that are dangerous.

```text
/sharp-edges
```

### Merged but not live

**I02 · Why production might not match main** Traces every step from merging code to users seeing it live, exposing caches, manual deploys, or skipped migrations that leave production stale.

```text
Trace a code change from merge to live users: build steps, database migrations, deployment triggers, CDN or app caches, background workers, and mobile/client updates. Identify every point where a deploy step can silently skip, fail, or serve stale code without alerting anyone.
```

**S06 · Settings that differ in production** Compares local, preview, and production configuration to catch missing environment variables and defaults that behave differently once live.

```text
Audit configuration and environment variables across local development, CI, preview, and production. Find ambiguous fallbacks, test-mode switches that could stay on, fail-open permissions, and behavior that silently changes when a variable is unset. Check actual code and deployment config files instead of trusting README examples. Never print or expose secret values.
```

**I05 · Dashboard and repo out of sync** Compares infrastructure settings declared in your code against what is actually configured in your hosting or cloud dashboards.

```text
Compare infrastructure, hosting, cron, and environment settings declared in this repository against live configuration where read-only CLI or API access exists. Where dashboard state cannot be inspected from here, list the exact settings and dashboards I need to compare by hand. Flag drift that creates security, billing, or deploy risk.
```

**EC09 · /wizard** Writes a short script that walks you through the steps only you can do, such as dashboard settings, secrets and switching services over.

```text
/wizard
```

## Routine checks

Checks worth running now and then. Run one when something changed, not on a timer.

### Health checks

**D06 · Code health, with proof** Runs a disciplined codebase health check that drops style nitpicks and returns a short ranked list of concrete, repairable problems backed by proof.

```text
Run a focused code-health audit calibrated to this repository's real conventions and operational risks. Every finding must cite a specific file:line, runnable command, trace, or commit; reject generic style preferences. Return a short ranked list of under fifteen repairable problems, each graded by confidence and user/maintenance impact.
```

**G01 · Out-of-date agent instructions** Checks `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, and project docs against the actual repo to catch outdated paths, deleted commands, and dead patterns that mislead agents.

```text
Compare every agent instruction and project doc file (`AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `SKILL.md`, `README.md`, and architecture notes) against the real directory layout, package scripts, and current code patterns. Flag stale rules referencing deleted files, replaced libraries, broken commands, or retired conventions.
```

**I06 · Packages nobody uses, or that work by luck** Finds installed dependencies nothing uses anymore, imports working only by accident through another package, and huge libraries kept for one tiny helper.

```text
Audit declared dependencies for unused packages, undeclared imports satisfied only through transitive dependencies, and heavy libraries imported for trivial functionality. Check runtime code, config files (Next, Vite, PostCSS, Tailwind, ESLint), CLI scripts, and dynamic imports before calling any package unused.
```

**I03 · Check time that catches nothing** Reviews your automated CI checks to spot slow, expensive, or duplicated jobs that burn minutes without catching real bugs.

```text
Analyze CI and deployment workflows against the real failures they catch. Look for duplicated build/install steps, missing caches, redundant checks, and expensive jobs that add little confidence over faster checks.
```

**EC29 · /ci-optimizer:ci-check** Checks CI workflow files (the automatic build and test runs) for speed, cost and safety problems.

```text
/ci-optimizer:ci-check
```

**EC30 · /ci-optimizer:ci-timings** Finds the slowest jobs and steps, and flaky tests (ones that pass and fail at random), from recent CI runs.

```text
/ci-optimizer:ci-timings
```

**EC08 · /retro** Reviews a session and suggests changes to the agent's setup: how it finds its way around, its checks, its instruction files and what its tools cost.

```text
/retro
```

### Your computer

**I01 · Duplicate tools and stale caches** Finds disk space and confusion spent on duplicate developer tools and stale saved files on your computer.

```text
Inventory the development environment's browser runtimes, caches, SDKs, package managers, and duplicate installations. Identify obsolete or wasteful components, assess dependencies, and propose a safe cleanup.
```

**I07 · Old runtimes and when support ends** Finds old browser runtimes on your computer and which are safe to remove, before a cleanup breaks an app that needs them.

```text
Inventory actual versions and dependencies of Playwright, Puppeteer, system Chrome, Chromium caches and Electron apps. Verify current vendor-supported and security-fix thresholds rather than trusting hard-coded version numbers. Distinguish safe disposable caches from app-owned runtimes and report the rollback path before any cleanup.
```

## Writing

Make docs, pages and messages read like a person wrote them. /fix-writing picks the right tool for the text you give it.

### Start here

**UI083 · /fix-writing** Cleans up stiff, wordy, or AI-sounding copy in pasted text or a file you point to, choosing the right editing rules automatically.

```text
/fix-writing README.md:12-40
```

**RC11 · Write prose that doesn't sound like AI** Take one piece of writing from draft to ready to send.

1. /stop-slop: draft it with the anti-AI rules on
2. /slop-guard: get a score and the list of AI phrases
3. /humanizer: rewrite those phrases, facts unchanged
4. /slop-guard: score again; it should go up

### Check and fix

**UI084 · /humanizer** Removes signs of AI writing: not-X-but-Y contrasts, one-line closers, staged openers, forced lists of three, dashes everywhere, inflated claims, sales language, stock AI words, bold labels, filler.

```text
/humanizer rewrite this PR description
```

**UI091 · /stop-slop** Writes or rewrites text under its rules: no filler openers, no not-X-but-Y, no passive voice, no lists of three, varied sentence length.

```text
/stop-slop write the launch post
```

**UI098 · /slop-guard** Runs the slop-guard checker on a file, folder or pasted text and explains the top problems.

```text
/slop-guard README.md
```

**UI099 · sg -v <path>** The slop-guard checker itself, run in a terminal.

```text
sg -v docs/*.md
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

**UI092 · /sepia:sepia** Picks the right operation and document rules for you.

```text
/sepia:sepia de-AI these release notes
```

**UI096 · /sepia:sepia-write** Writes a new piece under the rules for its format.

```text
/sepia:sepia-write release notes for v2.3
```

### Vale, for a whole repo of docs

**RC10 · Clean up a repo's docs** Get a noisy first run of Vale (the prose checker) down to problems worth fixing.

1. /vale:triage: decide per rule: fix, downgrade or switch off
2. /vale:vocab: teach it your product names
3. /vale:fix: fix the error-level alerts that remain
4. /humanizer: rewrite the pages that still read as machine-made

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

### Page copy

**UI048 · /copywriting** Writes or rewrites the words on a page. It bans phrases that sound written by AI and asks you to back up every claim.

```text
/copywriting the landing page hero
```

**UI047 · /product-marketing** Asks you questions once and writes the product-marketing file that /copywriting and /cro both read.

```text
/product-marketing for the app
```

## Add to any task

Short instructions you put in front of any request to change how the agent works: plan first, prove itself wrong, keep it simple, check its work, hand off cleanly.

### Before you start

**M07 · Spec without the interview** Turns your request into a short, checkable plan with clear boundaries, answering technical questions from the codebase before asking you anything.

```text
Turn my request into a short working specification: desired outcome, what is in scope, what is explicitly out of scope, observable acceptance criteria, and where to stop. Resolve technical questions yourself by reading the repository and primary documentation. Ask me only about product behavior, permissions, or tradeoffs you cannot decide from the codebase. Show me the short spec first and wait for my yes before editing files unless I already told you to proceed immediately.
```

**M01 · Deeper, not bigger** Has the agent point out what a experienced engineer would check or verify that you left out, then tighten the plan without growing the scope.

```text
Give me the thorough, senior-level version of this task without expanding its scope. Look at what I'm trying to accomplish and identify what an experienced practitioner would check, question, or verify that I overlooked. Inspect the original code and data instead of relying on summaries. Name the specific checks or evidence that will prove the result is right, then refine the task plan accordingly. Keep the objective and scope tight, and skip extra process that adds complexity without improving the result.
```

**M09 · Compare three options** Forces the agent to propose three distinct approaches (a minimal patch, a clean long-term fix, and a version that removes complexity) and recommend one before coding.

```text
Do not implement the first workable idea you think of. Lay out three meaningfully different ways to solve this: (1) the smallest conservative patch to the existing code, (2) the cleanest long-term design, and (3) a subtractive option that removes an existing layer, constraint, or special case. For each option, compare what else it could break, how easy it is to test, and how it fails. Recommend one in plain English and wait for my decision before editing anything.
```

**EC05 · /grill-me** Asks rounds of numbered questions, each with a suggested answer, until every open question in a plan is settled. For product direction, not routine fixes.

```text
/grill-me
```

**EC06 · /grill-with-docs** The same question-and-answer session as /grill-me, but it also writes down the terms you agree on and each decision you settle, so later sessions keep them.

```text
/grill-with-docs
```

**EC10 · /to-questionnaire** Turns a decision you can't make alone into a questionnaire for the person who can.

```text
/to-questionnaire
```

**EC22 · /goal-prompt** Drafts /goal commands with a checkable finish line and limits on when to stop.

```text
/goal-prompt
```

### While it works

**M02 · Prove it wrong** Tells the agent to actively hunt for evidence that its own plan will fail before you approve it.

```text
Before we proceed, try to prove the proposed plan wrong. List the key assumptions it relies on, search the code, data, logs, and documentation for evidence against each one, and run the fastest check or test that could break it. Report which assumptions held, which failed, and which you could not check. If any failed, explain what changes and propose the smallest adjustment. Recommend going ahead only if nothing you found contradicts the plan.
```

**M03 · Root cause first** Stops the agent from patching symptoms; it must reproduce the bug, trace the exact cause, and find everywhere else that same cause lives.

```text
Do not patch the visible symptom yet. Reproduce the problem first, then trace backward through code and data until you can explain in one or two plain sentences why it happens, citing the exact files, lines, or records involved. Search the codebase for every other place that shares the same cause. Report the cause, the proof, and every affected location. Then propose one fix that removes the underlying cause everywhere it applies, plus a check that fails if it returns. Wait for my yes before editing.
```

**M05 · Let the expert decide** Tells the agent to make routine technical decisions on its own and escalate only product, cost, or risk calls to you.

```text
Make the technical decisions yourself the way a senior engineer on this project would: follow the repository's existing patterns first, then established standards and official documentation, and inspect the codebase when unsure instead of asking me. Bring me only choices about product behavior, user impact, ongoing cost, or risks I must accept — each with your recommendation and how hard it is to change later. At the end, list the technical choices you made in one line each so I have a record.
```

**M06 · Check it independently** Requires the agent to prove a fix works using a path that cannot pass just because its own tests agree with its own code.

```text
Prove this works without relying only on the code or unit tests you just wrote. Pick an independent check that will actually fail if the fix is broken: walk through the running app like a real user, call the real endpoint, inspect the real stored data, compare against an outside source, or write a check from the original requirement without reading your implementation. Run that check, show the actual output, and state plainly what it still does not cover.
```

**M08 · Reproduce, measure, prove** Enforces a strict before-and-after loop: capture a failing case or baseline measurement first, apply the smallest fix, then rerun an independent check.

```text
Before editing anything to fix this bug or slowdown, create a reproducible failing case or a measured baseline. Trace the root cause, apply the narrowest fix that removes it, rerun an independent check, and report the exact before-and-after evidence. If you cannot reproduce or measure the problem, stop and tell me what evidence is missing instead of claiming it is fixed.
```

**M11 · Thorough and bold** Asks for a thorough answer that says what was checked and what was assumed, and ends with one firm recommendation.

```text
Go past the first answer. For each claim you make, check the original evidence (the code, the data or the docs) and say which claims you verified and which you assumed. Then give one clear recommendation, the strongest argument against it, and the result that would change your mind.
```

### Understand and hand off

**EC11 · /wait-what** Asks the agent to explain its last message again in plain words.

```text
/wait-what
```

**EC34 · /recommend** Lays out the real options and tradeoffs for a decision, then makes one firm recommendation.

```text
/recommend
```

**EC07 · /research** A background agent answers a question from original sources and saves a Markdown note with citations in the repo.

```text
/research
```

**M10 · Handoff note before you stop** Produces a compact, factual status note so a fresh agent session can resume right where this one stopped.

```text
Write a compact, self-contained technical handoff so a fresh agent session can resume this work cold. Include only: (1) verified facts and current system state, (2) approaches already tried and why they were ruled out, (3) exact files modified and any uncommitted changes in flight, and (4) the single next verifiable step. Record ground truth from the repository and commands run, skipping conversational recap.
```

## Explore

Questions most projects never ask until something goes wrong: promises the code doesn't keep, what one more customer costs, things that break on a date, where people's data ends up. Each investigation is read-only and ends with a short list of what to do first.

### Your users and your promises

**X01 · Promises the product doesn't keep** Reads every claim your product makes in web pages, pricing tables, buttons, emails, and legal text, then checks whether the code actually keeps each promise.

```text
First read every user-facing promise in this repository: marketing and pricing copy, onboarding screens, button labels, confirmation and error messages, email templates, help text, and terms/privacy pages. A promise is anything a user could rely on (such as "cancel anytime", "we'll email you when ready", "saved automatically", "permanently deleted", "refunded within 5 days", or "private to your team"). Then trace the code and config responsible for keeping each promise on both normal paths and failure paths (failed payment, bounced email, crashed job, mobile browser). Classify each as Kept, Kept on happy path only, Not kept, or Unverifiable from repo (needs manual/dashboard check). Rank broken promises by trust or legal harm.
```

**X02 · Your first support tickets** Reads your main user flows and predicts the confusing screens, vague error messages, and dead ends most likely to generate support emails.

```text
Walk this product's main user journeys in the code (sign-up, core workflow, billing, account settings, cancellation) and predict up to fifteen real support tickets users will send. Look only for issues grounded in existing code: dead-end error messages that give no next step, states with no escape hatch, buttons that silently do nothing, emails that contradict the screen, hidden limits, and intended behavior that looks broken. Write each ticket in a frustrated user's plain voice, cite the exact code behind it, and propose the smallest fix (often clearer wording, an empty state, or a confirmation). Stop once the real code-backed issues run out instead of padding to fifteen. Rank by how many users will hit each one.
```

**X03 · How a clever user games you** Finds loopholes an ordinary signed-in customer could exploit without hacking — infinite trials, stacked coupons, browser-only limits, or running up your AI/SMS bill.

```text
Think like a clever, opportunistic customer with a normal account and no hacking tools. Audit the code for ways they can get paid features for free or run up your bills: repeating free trials with fresh emails, reusing or stacking discount/referral codes, bypassing usage limits enforced only in browser code, timing upgrades/downgrades to dodge charges, keeping access after refunds or chargebacks, sharing accounts or abusing free invites, and triggering unbounded per-use costs (AI calls, SMS, emails, file storage, exports). For each loophole, give the exact user steps, whether the server enforces the rule today, a rough monthly cost if 100 users did it, and whether fixing it is a small code change or a pricing/product policy call.
```

**X04 · Features you could delete** Finds unlinked pages, untouched settings, stale feature flags, and dead integrations that cost maintenance while helping almost nobody.

```text
Identify features, screens, settings, feature flags, integrations, legacy plan tiers, export formats, or unfinished experiments that could be deleted with minimal user impact. Use whatever real evidence is accessible — routes with no navigation links, analytics events, database row counts, logs, flag config, and git history. For each candidate, assess its upkeep cost (code, tests, dependencies, support burden), the evidence it is unused, who could still reach it (including direct URLs, email links, bookmarks, or cron jobs), and what removal takes. Recommend the top three cuts with the best maintenance-saved-to-risk ratio.
```

### Money and the companies you depend on

**X05 · Follow one dollar** Traces a single customer payment from checkout through webhooks, database rows, access grants, receipts, refunds, and chargebacks to spot where money or access goes wrong.

```text
Trace a single dollar from the moment a customer pays through every system that records or reacts to it: checkout, payment provider, webhooks, database records, feature access grants, receipts/emails, and revenue reporting. Then trace the unhappy paths: declined card, payment retry, duplicate webhook, out-of-order webhook (arriving before the user or checkout row exists), partial refund, full refund, chargeback, mid-cycle plan change, cancellation, and non-default currency. At each step, identify the source of truth, what happens on failure or retry, and where your records or user access can fall out of sync with the payment provider.
```

**X06 · What one more customer costs** Calculates what each additional active user costs you across hosting, AI models, email, storage, and APIs, and flags features whose cost outruns your subscription price.

```text
Calculate the marginal monthly cost of adding one typical active customer. List every paid service this product uses (hosting, functions, database, file storage, bandwidth, AI models, email, SMS, search, error tracking, third-party APIs) and trace from code what user actions trigger charges. Estimate monthly usage per active customer using logs or database stats where available, stating assumptions clearly where not. Compare total per-user cost against each pricing tier, and highlight features whose cost scales faster than revenue (such as unthrottled AI calls, full-size image uploads, or unlimited free-tier exports). Fetch current published vendor prices if you have web access and cite the URL; if you cannot verify live pricing, mark every price clearly as an estimate for me to confirm on the vendor's pricing page.
```

**X07 · If a vendor doubles its price or disappears** Shows how tightly your app is wired to each outside vendor, how hard it would be to leave on 30 days' notice, and one cheap safeguard for the top two risks.

```text
Map this product's dependence on every external vendor, platform, or API (hosting, database, auth, payments, email, AI providers, app stores, analytics, and third-party SDKs). For each, measure how deeply it is embedded: how many files import or call it directly, whether one internal wrapper isolates it, whether your data can be cleanly exported, and which core features stop without it. Stress-test three scenarios for each vendor: price doubles, terms ban your use case, or it shuts down with 30 days' notice. Rank vendors by potential damage and suggest one cheap hedge for the top two without proposing a migration today.
```

**X08 · The app's own AI calls** Audits every runtime AI model call inside your app for prompt-injection traps, runaway costs, retired models, missing output checks, and silent slowdowns.

```text
Audit every place this application calls an AI model at runtime. For each call check: (1) model ID and whether it is deprecated or nearing retirement, (2) what untrusted input enters the prompt (user text, scraped pages, uploaded files, emails) and its prompt-injection exposure, (3) what the model's output can trigger (display text, tool calls, database writes, emails, charges), (4) timeouts, retries, and fallback behavior when the provider is slow or down, (5) schema/length/allowlist validation on outputs before use, (6) cost per call and calls triggered per user action, (7) whether personal user data is sent to the model provider, and (8) whether any eval or test detects answer quality dropping. Rank findings by severity: unauthorized actions first, cost blowups second, silent quality degradation third.
```

### Risks you can't see yet

**X09 · Things that break on a date** Builds a timeline of everything set to expire or fail automatically — certificates, API keys, app store renewals, startup credits, retiring model versions, and hardcoded dates.

```text
Find everything in this project that will break on a future calendar date without any code change. Check: TLS certificates and signing keys, expiring API tokens and OAuth secrets, app store certificates and OAuth verification renewals, domain renewals, free-tier or startup credits expiring, retiring vendor APIs/SDKs/AI model IDs referenced in code, hardcoded years or date cutoffs, scheduled jobs with end dates, and growing counters or storage quotas nearing limits. Put everything on one timeline, soonest first, stating how you found each date and whether any automated alert warns ahead of time. Separate dates verified from code/config from dates you cannot see that I must check in a named dashboard.
```

**X10 · How you'd find out it's broken** Checks your core user flows one by one to show which outages would alert you within minutes and which you'd only learn about from an angry user.

```text
List the five to ten critical jobs this product must keep working (sign-in, checkout, outgoing emails, core data reads/writes, nightly jobs, imports). For each one, answer directly: if it stopped working at 2am, how would I find out and how long would it take? Inspect only what actually exists in code and config — error trackers, alerting rules, uptime checks, health endpoints, failed-payment hooks, and swallowed exceptions — and flag external alerting dashboards you cannot inspect from the repo. Classify each flow as: alerts within minutes, noticed within a day, or only discovered when a user complains. For each blind spot, propose the single smallest signal that catches it (one alert, one heartbeat check, or one daily count check).
```

**X11 · Defaults nobody chose** Exposes invisible framework and hosting defaults your app runs on — session lifetimes, upload limits, timeouts, cache lengths, rate limits, and email headers — and flags the risky ones.

```text
Audit settings left at their framework, library, or hosting defaults that materially affect users, security, or cost: session duration and idle logout, password and reset-token expiry, upload size caps, request timeouts, cache headers, rate limits, retry counts, default time zone/locale/currency, pagination sizes, email sender and reply-to, image storage settings, log retention, backup schedules, data region, and hard vs. soft deletes. Report only defaults that could plausibly hurt this product. Verify each default value against the installed version's source code in `node_modules` (or equivalent lockfile/package source) or official docs; mark anything you could not verify locally as unconfirmed.
```

**X12 · Where people's personal data ends up** Tracks every piece of personal information you collect across databases, logs, error trackers, analytics, emails, and AI calls, and checks what it takes to delete a user completely.

```text
Trace all personal user data from collection (forms, sign-up, billing, uploads, analytics, IP/device metadata, support tools) to every destination it reaches: database tables, file buckets, server logs, error trackers, session recordings, analytics, email/CRM tools, AI API calls, exports, and backups. For each destination, note retention, access scope, and whether data leaves to a third party (flagging external tool settings that need manual dashboard checks). Then trace a real account-deletion request: list every place user data would need to be removed from and whether code handles it today. Highlight sensitive data logged in plain text, unused fields still being collected, and any mismatch with your privacy page.
```

**X13 · Things you may not be allowed to ship** Checks fonts, icons, images, third-party packages, and copied snippets for licenses that restrict commercial use or require attribution.

```text
Audit everything shipped in this project for licensing or usage restrictions: package licenses in lockfiles (especially copyleft licenses like GPL/AGPL in closed-source products, or non-commercial/source-available licenses in paid apps), code snippets copied without attribution, web/app font files and their license terms, images/icons/illustrations/audio in asset folders, third-party logos or brand assets, AI-generated media whose source tool has commercial terms, and scraped or external datasets. For each flagged item, state the license or provenance found, whether this usage fits, and the next step (attribute, replace, purchase a license, or verify). Flag uncertain items for human or legal review without giving legal advice.
```

**X14 · If you disappeared tomorrow** Finds every account, dashboard setting, manual habit, and secret that lives only in your head or on your computer, and drafts a one-page emergency runbook.

```text
Imagine I became unreachable tomorrow and a capable developer had to keep this product running using only this repository. Identify everything missing from the repo: external accounts and billing ownership (hosting, domain, database, payments, email, app stores), dashboard-only secrets and settings, manual recurring work (deploys, renewals, exports, support replies, data fixes), external cron jobs, undocumented code quirks, and anything tied to my personal machine. For each gap, note what breaks and how soon, plus the smallest fix (a repo doc, script, shared password vault entry, or backup owner). Format the actionable output as a clean one-page emergency runbook naming where each secret lives (names only, never values).
```

### Learn from the project's own history

**X15 · What agents keep getting wrong here** Mines your git history for reverts and fix-on-fix commits to spot mistakes coding agents keep repeating, and drafts exact lines for `AGENTS.md` or `CLAUDE.md` to prevent them.

```text
Analyze this repository's git history to uncover mistakes coding agents keep repeating. Look for reverts, rapid follow-up fix commits, files that repeatedly change together yet live far apart, and edits to generated files or broken conventions. Group recurring mistakes by root cause (undocumented rule, generated file, required rebuild step, misleading name, synced pair of files, broken local test). For each recurring cause, cite two or three commit hashes as proof and draft one or two crisp lines for `AGENTS.md`/`CLAUDE.md` — or an automated check — that would have prevented it. Skip anything already clearly documented.
```

**X16 · The first bad day** Writes a grounded, hour-by-hour preview of the most likely serious outage, data loss, security leak, or surprise bill waiting in your current setup — and the one fix worth doing this week.

```text
From the actual code, config, deploy setup, data model, and third-party dependencies in this repository, identify the three likeliest ways this product suffers its first serious incident: data loss or corruption, prolonged outage, security/privacy leak, or a surprise usage bill. Take the #1 likeliest scenario and write a grounded pre-mortem incident report: exact trigger, hour-by-hour timeline, how you find out, what compounds the damage, what gets lost, recovery time, and impact. Every single step in the timeline must cite a real file, setting, or missing safeguard in this repo (or explicitly flag a dashboard setting to check). End with three preventive fixes ordered by effort, naming the single one worth doing this week.
```

### New instructions for any task

**X17 · Mark your guesses** Forces the agent to label every claim as Checked, Inferred, or Guessed so you can tell verified facts from confident assumptions.

```text
Separate what you verified from what you assumed. In your answer, tag every factual claim as Checked (you ran it, read the file, or measured it — state how), Inferred (it follows from something you checked — state what), or Guessed (unverified). Before replying, verify any Guessed claim that your recommendation depends on. List any remaining guesses clearly along with what would change if they turned out wrong. Never state a guess in the same confident tone as a checked fact.
```

**X18 · Plan the failure** Makes the agent imagine the shipped change has already gone wrong, list the likeliest causes specific to your project, and add safeguards before editing.

```text
Before you start, imagine this change is already shipped and has gone badly wrong. List up to five of the likeliest causes specific to this project, such as a false assumption, an untested edge case, a nearby feature broken by the edit, an unexpected bill, or a user doing something unintended. Stop as soon as the real risks run out instead of padding the list. For each risk, state how we would spot it early and what your plan does to prevent it. Show me that plan before changing files. When the work finishes, report which risks you eliminated and which remain possible.
```

**X19 · Teach me what you just did** Wraps up a completed task with a short plain-English explanation of what changed, what could go wrong, and how to test it yourself, plus two quick check-in questions.

```text
When you finish, explain what you changed so I could describe it to someone else and spot trouble later. Assume I understand the product and do not read code. In under 250 words of plain English, cover: what the problem was, what you changed and why you picked this over the main alternative, what a user will notice, what could still go wrong and how I would spot it, and one concrete thing I can open, click, or check myself to confirm it works. End with two short questions to verify I understood the parts that matter most.
```

**X20 · Who notices this change** Maps everyone and everything affected by a change beyond the code — active users, saved bookmarks, emails already sent, search engines, cached copies, and connected services — and plans the transitions.

```text
Before making this change, list everyone and everything that will feel its impact beyond the files you edit: users on each plan, people mid-task during deploy, saved links and bookmarks, links inside emails already sent, search engines, analytics and reports, external apps or scripts calling this, cached responses, older client or app versions still running, in-flight background jobs, and admins or support. For each item that applies to this project, explain what they will experience and whether it needs a redirect, a migration, a notice, or temporary backwards compatibility. Show me the list before editing anything, include the agreed code transitions when you build the change, and separate what you handled from what needs manual action from me.
```

## Other tools

Commands written by other people. Each names the Agent Kit job that now does the same work, where there is one.

**AD07 · Sign-up, sign-in, and locked-out users** Traces every way someone creates an account, signs in, resets a password, switches devices, or deletes an account, and finds where people can get locked out or keep access they shouldn't have.

```text
Trace the full account lifecycle in this application: sign-up, email verification, password sign-in, magic links, OAuth/social login, password reset, email change, session refresh and expiry, sign-out, role or team revocation, and account deletion. Look for ways a real person gets stuck or locked out (expired links with no resend button, case-sensitive email mismatches, OAuth colliding with an existing password account, redirect loops after sign-in, sessions dropping on refresh) and ways revoked users keep access (cached tokens, active sessions that survive password change or removal). Check both code and auth provider configuration where visible in the repo.
```

**AD05 · Did the agent actually finish this?** Checks a completed feature or branch for classic coding-agent shortcuts: placeholder data, dead buttons, stubbed functions, skipped error states, and weakened tests.

```text
Audit the current branch (or the feature I name) for incomplete or faked implementation. Look for hardcoded or mock data left in real paths, stubbed or empty handlers, buttons or links wired to nothing, TODO/FIXME placeholders, swallowed errors (empty catch blocks), skipped or loosened tests, missing loading/empty/error states, and requirements from my request that were silently dropped. Check every changed file and trace each user action from the UI to storage and back.
```

**AD06 · How this whole product works** Draws a plain-English map of your app — its screens, user roles, stored data, scheduled jobs, and outside services — so you can see how the pieces connect without reading code.

```text
Read the repository and build a plain-English map of how this product actually works today, written for the owner who directs changes and does not read code. Cover: (1) the main user roles and what each can see or do, (2) the key screens and how users move between them, (3) the core data records stored and how they relate, (4) every background job or scheduled task, (5) every external service or API the app depends on, and (6) where the highest-risk logic lives (payments, auth, writes, AI calls). Base every statement on the code and config files present today, ignoring outdated README descriptions.
```

**AD04 · Walk me through what changed before I merge** Explains an entire branch or pull request in plain English, flags edits outside your original request, and gives you a short manual test checklist you can click through yourself.

```text
Inspect the current branch diff against the default branch (or the pull request I name) and explain it for a product owner who does not read code. Group the changes by what a user or operator will experience, call out any file touched outside the stated goal, flag risky areas (data writes, permissions, billing, migrations, config changes, deleted checks), and write a five-minute manual click-test checklist I can run myself to verify the change works and did not break nearby flows.
```

**AD09 · Links, previews, and what Google sees** Checks page titles, social share previews, favicons, 404/error pages, broken internal links, and search-engine settings before you share your site publicly.

```text
Audit this web application's public-facing metadata, share previews, error pages, and crawl settings. Check: page titles and meta descriptions across public routes (flag missing, duplicate, or placeholder defaults like "Create Next App"); Open Graph and Twitter/X preview tags and whether their image URLs resolve with absolute production URLs; favicon and app icons; custom 404 and 500 error pages; broken internal links or redirects; canonical URLs, sitemap, and robots.txt (flag accidental noindex tags or blocked public pages, as well as private or admin routes accidentally exposed to crawlers).
```

**AD08 · Emails and messages people actually receive** Audits every email, text, or notification your app sends for broken links, placeholder wording, wrong sender details, double sends, and silent delivery failures.

```text
Find every email, SMS, push notification, or in-app message this application sends. For each one, read the actual template and trigger code and check: what triggers it, whether retries or webhooks can send it twice, whether links inside it could point to localhost or a broken URL in production, what sender name and reply-to address it uses, whether marketing or digest messages include a working unsubscribe link, whether placeholder or embarrassing wording remains, and what happens when the email or SMS provider rejects or bounces it.
```

**AD11 · Build it, buy it, or skip it?** Before you ask an agent to build a big feature from scratch, checks whether an existing tool, a simpler manual step, or skipping it makes more sense for a solo builder.

```text
Before we build the feature I am describing, evaluate three paths for a solo builder who wants low ongoing maintenance: (1) build it inside this codebase, (2) use an established service or library that already fits our stack, or (3) ship a much simpler or manual version first until usage proves it needs software. Inspect the repository first so your comparison reflects our actual stack, existing dependencies, and hosting limits. For each option, compare upfront work, ongoing maintenance and edge cases I will own forever (security, compliance, retries, deliverability, edge cases), vendor lock-in, and rough cost. Recommend one option and state what would change your mind.
```

**AD10 · Can you get your data back if something goes wrong?** Checks whether your database, uploaded files, and user content are actually backed up and restorable — whatever database or host you use.

```text
Audit how this product protects against accidental data loss across every store it uses (SQLite, Postgres, Supabase, Firebase, Convex, cloud file storage, or external SaaS data). From the repository, infrastructure config, and scripts, trace: what destructive operations exist in code or admin tools (hard deletes, cascades, overwrites, migration drops), whether soft-delete or undo exists for user-triggered deletions, what backup or point-in-time recovery settings are declared in config, and what data lives in places with no backup configured. Clearly separate what you verified in the repository from backup settings that live only in a hosting dashboard and require my check.
```

**AD03 · Stop and untangle** Stops an agent that has been going in circles, maps out what was tried and what failed, and proposes one clean way back to a working state.

```text
Stop editing files. Step back and untangle where we are right now. Check git status and git diff against the last known working commit, then tell me in plain English: (1) what the original goal was, (2) every fix we already tried and what happened, (3) which uncommitted changes are half-finished patches that should be reverted, and (4) the single cleanest path forward from a clean base. Wait for my approval before reverting or editing anything.
```

**AD01 · Stay inside the lines** Keeps the agent strictly inside the task you asked for so it does not refactor neighbouring files, reformat code, or upgrade packages on the side.

```text
Stay strictly inside the task I asked for. Do not refactor neighbouring code, rename unrelated variables, reformat untouched files, delete comments, or upgrade dependencies unless the task cannot work without it. If you spot a separate bug or cleanup opportunity while working, leave it untouched and list it at the end under "Spotted outside scope" with the file and line so I can decide whether to do it next. Before finishing, check the diff and revert any accidental edit outside scope.
```

**AD02 · Show the plan and wait** Makes the agent explain its plan in plain product terms and stop for your approval before editing a single file.

```text
Do not edit any files yet. Inspect the codebase and tell me your plan in plain English for someone who knows the product and does not read code. Cover what will change for a user, which areas of the product are touched, any tradeoffs or product choices I need to make, and what could break. Keep it under 200 words, end with any questions that need my call, and wait for my yes before making edits.
```

**EC37 · /experience-architecture:walkthrough** Clicks through your running app as a first-time user, explains what the product appears to be for, highlights what works, and names the single highest-impact fix.

```text
/experience-architecture:walkthrough
```

**EC38 · /ceo** Explains project status, a technical system, or a bug in plain English for a non-coding owner, without pushing you to decide immediately.

```text
/ceo
```

**UI001 · /impeccable** Typed alone, it looks at where this project stands and suggests the next command. If there is no PRODUCT.md yet, it suggests init first.

```text
/impeccable
```

Agent Kit job: `/keen`

**UI002 · /impeccable init** One-time setup for a project. It asks you questions, then writes PRODUCT.md (who uses it, the brand, the guiding principles), which every other command reads.

```text
/impeccable init
```

Agent Kit job: `/keen init`

**UI003 · /impeccable shape** Plans how a page should work and look before any code is written. It asks a few questions and writes a design brief for you to approve. For a new page or a new look, it then makes three image mockups, you pick one, and it builds to match.

```text
/impeccable shape the billing settings page
```

Agent Kit job: `/keen shape`

**UI004 · /impeccable document** Writes DESIGN.md by reading the code you already have: colors, fonts, spacing and the building blocks of the interface.

```text
/impeccable document
```

Agent Kit job: `/keen document`

**UI005 · /impeccable extract** Finds styles that repeat across the app and turns them into shared settings and pieces. Use it when the look has drifted out of sync.

```text
/impeccable extract the card styles
```

Agent Kit job: `/keen extract`

**UI006 · /impeccable critique** Reviews how easy a screen is to use: what stands out, how things are organized, and how much it asks you to think. Gives scores and tests it from the view of different kinds of users.

```text
/impeccable critique the dashboard
```

Agent Kit job: `/keen critique`

**UI007 · /impeccable audit** Runs technical checks: accessibility, speed, light and dark themes, how it fits different screens, and common mistakes. Ranks problems from P0 (worst) to P3. Checks phone apps against Apple's and Google's rules.

```text
/impeccable audit the checkout flow
```

Agent Kit job: `/keen audit`

**UI008 · /impeccable polish** The last pass before you ship. Fixes alignment, spacing, consistency and small details.

```text
/impeccable polish the pricing page
```

Agent Kit job: `/keen polish`

**UI009 · /impeccable bolder** Makes a safe or bland design stand out more, without making it harder to use.

```text
/impeccable bolder the hero
```

Agent Kit job: `/keen bolder`

**UI010 · /impeccable quieter** Tones down a design that is too loud or busy.

```text
/impeccable quieter the sidebar
```

Agent Kit job: `/keen quieter`

**UI011 · /impeccable distill** Removes what isn't needed so the screen is less cluttered.

```text
/impeccable distill the settings screen
```

Agent Kit job: `/keen distill`

**UI012 · /impeccable harden** Gets a screen ready for real use: error messages, very long text, other languages and unusual data.

```text
/impeccable harden the signup form
```

Agent Kit job: `/keen harden`

**UI013 · /impeccable onboard** Designs what new users see first, what empty screens show, and the moments that get people to start using the product.

```text
/impeccable onboard new users
```

Agent Kit job: `/keen onboard`

**UI014 · /impeccable animate** Adds motion that has a purpose, plus small animated responses to clicks and taps, as part of a design pass.

```text
/impeccable animate the modal
```

Agent Kit job: `/motion build`

**UI015 · /impeccable colorize** Adds color in chosen places to an interface that looks flat or gray.

```text
/impeccable colorize the stats cards
```

Agent Kit job: `/keen colour`

**UI016 · /impeccable typeset** Fixes the font choice, which text stands out most, text sizes and how easy it is to read.

```text
/impeccable typeset the article page
```

Agent Kit job: `/keen type`

**UI017 · /impeccable layout** Fixes spacing, the visual rhythm of a page, and screens where nothing clearly stands out.

```text
/impeccable layout the home screen
```

Agent Kit job: `/keen layout`

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

Agent Kit job: `/keen words`

**UI021 · /impeccable adapt** Makes a design work on different screen sizes, devices and platforms, including phone apps built with SwiftUI, Compose, React Native and Flutter.

```text
/impeccable adapt the table for mobile
```

Agent Kit job: `/keen adapt`

**UI022 · /impeccable optimize** Finds and fixes slow loading, choppy scrolling or drawing, large images and too much code sent to the browser.

```text
/impeccable optimize the fund list
```

Agent Kit job: `/keen optimize`

**UI023 · /impeccable live** Click an element in the app running on your computer and see different versions of it swapped in right away.

```text
/impeccable live
```

Agent Kit job: `/keen variants`

**UI024 · /impeccable generate** Name an element and the change you want, and get as many versions as you ask for to flip through and pick from.

```text
/impeccable generate 3 bolder variants of the pricing card
```

Agent Kit job: `/keen variants`

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

**UI028 · /design** One command for any design work. Say what you want and it picks the one right skill or recipe from this guide, tells you why, and starts it. /design next picks a recipe back up.

```text
/design the inbox feels cluttered on my phone
```

Agent Kit job: `/keen`

**UI032 · /dataviz** Picks the right kind of chart, builds a color set that works for everyone and checks it with a tool, then sets the shapes, axes and hover labels.

```text
/dataviz a weekly task-completion chart
```

**UI033 · /web-typography** Picks fonts and pairs them, then sets text sizes, line spacing and how fonts load.

```text
/web-typography pair a serif with Instrument Sans for the notes page
```

Agent Kit job: `/keen type`

**UI034 · /refactoring-ui** Fixes what stands out, spacing, color and depth using the method from the book Refactoring UI.

```text
/refactoring-ui the task list looks amateur
```

Agent Kit job: `/keen layout`

**UI035 · /microinteractions** Designs the small moments, like how buttons, switches and loading indicators react, what sets them off, and how they repeat or change.

```text
/microinteractions the complete-task checkbox
```

Agent Kit job: `/motion`

**UI036 · /top-design** Builds showpiece websites like the ones that win Awwwards: stories told as you scroll, layers that move at different speeds, and movie-like motion.

```text
/top-design a launch page that feels cinematic
```

**UI037 · /ios-hig-design** Designs iPhone and iPad screens that follow Apple's Human Interface Guidelines.

```text
/ios-hig-design the iPhone tab bar
```

Agent Kit job: `/keen native`

**UI038 · /ux-heuristics** Checks how easy something is to use against Nielsen's well-known usability rules, and walks through it step by step as a new user would.

```text
/ux-heuristics the onboarding flow
```

Agent Kit job: `/keen critique`

**UI039 · /steve-jobs-design-review** A harsh review of a design or feature that pushes for simplicity and focus.

```text
/steve-jobs-design-review the home screen
```

Agent Kit job: `/keen critique`

**UI040 · /design-everyday-things** Explains why something is confusing: whether it shows how to use it, gives feedback, and helps people avoid mistakes.

```text
/design-everyday-things why do people miss the filter button?
```

Agent Kit job: `/keen critique`

**UI041 · /improve-retention** Works out why people sign up and then stop coming back, using what is known about how habits and behavior work.

```text
/improve-retention people stop opening the weekly brief
```

Agent Kit job: `/keen onboard`

**UI042 · /hooked-ux** Designs habits people repeat: a prompt, an action, a reward, and something they put in that brings them back.

```text
/hooked-ux a daily check-in habit
```

**UI043 · /lean-ux** Turns a design argument into a clear guess you can test with a quick experiment.

```text
/lean-ux should the inbox default to unread?
```

**UI044 · /oklch-skill** Converts colors to OKLCH, a color system, then builds color scales and dark mode, fixes text that is hard to read against its background, and writes Tailwind v4 color settings.

```text
/oklch-skill build a 10-step scale from the brand accent
```

Agent Kit job: `/keen colour`

**UI045 · /color-expert** Answers color questions: contrast checks (APCA and WCAG), ways to build a palette, and color names and history.

```text
/color-expert why does this blue look purple in dark mode?
```

Agent Kit job: `/keen colour`

**UI046 · /ux-writing** Writes or edits the words in an app so they are clear, short and in the right tone.

```text
/ux-writing the error messages on sign-in
```

Agent Kit job: `/keen words`

**UI049 · /cro** Finds why a page or form doesn't get people to sign up or buy, and what to change first.

```text
/cro the signup page
```

Agent Kit job: `/keen convert`

**UI050 · /swiftui-pro** Reviews SwiftUI code (Apple's app-building toolkit) against current methods and best practice.

```text
/swiftui-pro review the task list view
```

Agent Kit job: `/keen native`

**UI051 · /interface-design** Builds or improves app screens. It suggests a direction, asks you to confirm, builds it, then offers to save the design system for reuse.

```text
/interface-design build a fund comparison table
```

Agent Kit job: `/keen shape`

**UI052 · /interface-design:design-review** A strict review, in several passes, of a screen's craft and what stands out first, with severity scores and a pass bar. It judges first and rebuilds only if you ask.

```text
/interface-design:design-review the settings page
```

Agent Kit job: `/keen critique`

**UI053 · /interface-design:design-deslop** A quick pass over a branch that removes signs a UI was made by AI: nothing stands out, identical cards, default fonts, timid color.

```text
/interface-design:design-deslop
```

Agent Kit job: `/keen bolder`

**UI054 · design status / audit / extract** Plain requests it understands: summarize the saved design system, check files for drift from it, or find repeated values worth turning into shared patterns.

```text
Use interface-design to check the dashboard for drift from system.md
```

Agent Kit job: `/keen document`

**UI055 · /hallmark <prompt>** Designs a new page. It asks once about material, audience, use and tone, then builds the big top section (the hero) first.

```text
/hallmark a landing page for a fund research tool
```

Agent Kit job: `/keen shape`

**UI056 · /hallmark redesign <path>** Fully redesigns an existing page while keeping its content and how it is wired up.

```text
/hallmark redesign src/app/page.tsx
```

**UI057 · /hallmark audit <path>** Report only. Checks a page against Hallmark's minimum quality bar.

```text
/hallmark audit src/app/page.tsx
```

Agent Kit job: `/keen audit`

**UI058 · Genre families** It picks from four looks: atmospheric, editorial, modern-minimal, playful. Name one to steer it.

```text
/hallmark an editorial landing page for a chess coaching app
```

**UI059 · /emil-design-eng** Emil's core approach to polish, component design and the small details users never notice. Reviews in a fixed format.

```text
/emil-design-eng review this button component
```

Agent Kit job: `/keen polish`

**UI060 · /apple-design** Apple-style smooth, physical-feeling web interfaces: gestures, springy motion, slide-up sheets, see-through layers, typography.

```text
/apple-design make this bottom sheet draggable
```

Agent Kit job: `/motion`

**UI061 · /break-ui** Fills a component with the worst realistic data (long names, emoji, zero items, huge numbers) behind an on/off switch and reports what broke.

```text
/break-ui the player card
```

Agent Kit job: `/keen harden`

**UI062 · /prototype** Builds 3 truly different versions you can switch between. Add x5 for more. Then try variations or keep one.

```text
/prototype a team switcher x4
```

Agent Kit job: `/keen variants`

**UI063 · /animate** Builds an animation in order: should it animate, why, which tool, what moves, how it speeds and slows, what happens if interrupted, and a version for people who turn motion off.

```text
/animate the dropdown menu
```

Agent Kit job: `/motion build`

**UI064 · /animate-expo** The same idea for phone apps built with React Native and Expo: Reanimated, gestures, slide-up sheets, haptics (vibration feedback).

```text
/animate-expo a swipe-to-dismiss card
```

Agent Kit job: `/motion build`

**UI065 · /animation-vocabulary** Turns a vague description of motion into the right term to use in a prompt.

```text
/animation-vocabulary what's it called when a list item bounces in?
```

**UI066 · /review-animations** Strict review of animation code against Emil's ten standards. It flags problems by default.

```text
/review-animations src/components/Modal.tsx
```

Agent Kit job: `/motion review`

**UI067 · /find-animation-opportunities** Read-only sweep for places that should animate, with exact settings. It rules out the rest.

```text
/find-animation-opportunities the onboarding flow
```

Agent Kit job: `/motion review`

**UI068 · /improve-animations** Checks all motion in a codebase and writes plans for other agents to carry out. Variants: quick, deep, a focus like performance, plan, execute, reconcile.

```text
/improve-animations deep performance
```

Agent Kit job: `/motion review`

**UI069 · /animation-performance** Fixes animation that stutters or drops frames. Covers properties the browser can animate cheaply, CSS vs JavaScript, and the will-change hint.

```text
/animation-performance the scroll reveal stutters
```

Agent Kit job: `/motion fix`

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

Agent Kit job: `/keen adapt`

**UI073 · /write-swift** Modern Swift for Apple apps: Swift 6 concurrency (code safely running at the same time), value types, Swift Testing, memory management (ARC) and performance.

```text
/write-swift fix this data race
```

**UI074 · /web-design-guidelines <file-or-pattern>** Reviews the files you name for accessibility, usability and interface best practices.

```text
/web-design-guidelines src/components/**/*.tsx
```

Agent Kit job: `/keen audit`

**UI075 · example-skills:frontend-design** Gives new UI a distinctive look: a visual direction, font choices, and avoiding template defaults.

```text
example-skills:frontend-design a landing page for a coaching app
```

Agent Kit job: `/keen shape`

**UI076 · example-skills:theme-factory** Applies one of 10 preset themes (arctic-frost, ocean-depths, midnight-galaxy, golden-hour and others) or makes a new one.

```text
example-skills:theme-factory apply ocean-depths to this deck
```

Agent Kit job: `/keen colour`

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

**UI097 · /sepia:sepia-hemingway** Fiction writing in a spare, Hemingway-style voice.

```text
/sepia:sepia-hemingway revise this short story
```

**RC01 · New landing page** From blank to a shipped page that does not look templated.

1. /impeccable init: once per project, so later passes know the brand
2. /hallmark <prompt>: build the page in a chosen genre
3. /break-ui: stress the hero and cards with ugly data
4. /web-design-guidelines <path>: rule check before shipping
5. /impeccable polish: final spacing and detail pass

Agent Kit job: `/keen shape`

**RC02 · New dashboard or tool** Product screens with a design system that stays consistent next session.

1. /impeccable shape: agree the screen's job and layout first
2. /interface-design: build it and save system.md
3. /break-ui: long names, zero rows, huge numbers
4. /impeccable harden: error, loading and empty states
5. /interface-design:design-review: strict approval pass

Agent Kit job: `/keen shape`

**RC03 · This page kind of stinks** Find out why, then fix the worst of it. Stays inside your design system.

1. /impeccable critique <page>: scored review: what's wrong and what to fix first
2. /impeccable typeset: if the critique flagged hierarchy or type
3. /impeccable layout: if it flagged spacing or structure
4. /impeccable colorize: if it flagged flat or muddy color
5. /impeccable polish: tidy up after the bigger passes

Agent Kit job: `/keen critique`

**RC04 · Rethink it, rules off** Let it suggest new fonts, colors and hierarchy even if that breaks the design system.

1. /impeccable critique <page>, ignore DESIGN.md and suggest new fonts, colors and hierarchy: a critique that isn't held to the current system
2. /prototype <page> x3: three different directions to look at side by side
3. /impeccable bolder: push the winner further
4. /impeccable document: save the new look as the design system

Agent Kit job: `/keen bolder`

**RC05 · It looks AI-generated** Rescue a bland or generic screen without starting over.

1. /interface-design:design-deslop: strip the generic tells
2. /impeccable typeset: real type hierarchy
3. /impeccable bolder: give it a point of view
4. /impeccable polish: tidy what the bigger passes left

Agent Kit job: `/keen bolder`

**RC06 · Motion done properly** Add animation where it helps and nowhere else.

1. /find-animation-opportunities: read-only list of where motion earns its place
2. /animate: build the chosen ones
3. /review-animations: check against the ten standards
4. /animation-performance: only if anything drops frames

Agent Kit job: `/motion`

**RC07 · Pre-ship check** Catch problems before users do. The first three only report.

1. /impeccable audit: accessibility, performance, theming, scored
2. /web-design-guidelines <path>: file:line rule findings
3. example-skills:webapp-testing: click through the real flow in a browser
4. /impeccable polish: fix what the reports found

Agent Kit job: `/keen audit`

**RC08 · Feels right on a phone** Make a web app feel like an installed app instead of a website.

1. /impeccable adapt: layout across screen sizes
2. /mobile-native: tap, notch, 100vh and input-zoom fixes
3. /apple-design: gestures, sheets and springs where it matters

Agent Kit job: `/keen adapt`

**RC09 · Explore before committing** See real options instead of arguing about one.

1. /impeccable shape: write the brief
2. /prototype <component> x3: three genuinely different versions
3. /impeccable live: refine the winner in the running app

Agent Kit job: `/keen variants`

**RC12 · Type and color system from scratch** Fonts, a palette scale and dark mode, saved so every later pass uses them.

1. /web-typography: pick and pair the faces, set the type scale
2. /oklch-skill: palette scale, dark mode, contrast, Tailwind tokens
3. /impeccable document: save both as DESIGN.md
4. /impeccable audit: check contrast and theming held up

Agent Kit job: `/keen colour`

**RC13 · Landing page that converts** From how you pitch the product to a page that's checked for turning visitors into sign-ups.

1. /product-marketing: once per product: audience, claims, voice
2. /copywriting: headline, value props, calls to action
3. /hallmark <prompt>: build the page around that copy
4. /image: a real hero image if the page needs one
5. /cro: what will stop people converting, in order
6. /harsh-review: the blunt pass before you share it

Agent Kit job: `/keen convert`

**RC14 · Native iPhone screen** SwiftUI screens that someone who knows iPhones well would trust.

1. /ios-hig-design: the platform patterns this screen should use
2. /impeccable shape: agree the screen's job first
3. /swiftui-pro: review the SwiftUI against modern practice
4. /impeccable audit: native accessibility and platform rules

Agent Kit job: `/keen native`

**RC15 · Usability rescue** People get lost or make mistakes. Find out where, then fix it.

1. /ux-heuristics: usability audit by Nielsen's rules
2. /design-everyday-things: the why: affordances, feedback, mapping
3. /impeccable distill: cut what is in the way
4. /ux-writing: labels and errors that explain themselves

Agent Kit job: `/keen critique`

**RC16 · Brutal pre-launch review** Every tough review angle at once, then the fixes. Only when you ask for it.

1. /harsh-review: blunt, evidence-backed, ships the small fixes
2. /steve-jobs-design-review: what to cut for focus
3. /viewport-proof: proof it works at every screen size
4. /impeccable polish: the last detail pass

Agent Kit job: `/keen critique`

**RC17 · Dark mode done right** Colors that keep their contrast and character in both light and dark themes.

1. /oklch-skill: build the dark scale in OKLCH
2. /impeccable colorize: apply it with intent, not inversion
3. /impeccable audit: contrast and theming checks
4. /viewport-proof: screenshots of both themes at each size

Agent Kit job: `/keen colour`

**RC18 · Interactions that feel alive** Feedback on every action, and motion only where it earns its place.

1. /microinteractions: design the trigger, rule and feedback
2. /animate: build the motion properly
3. /review-animations: check against the ten standards
4. /animation-performance: only if anything drops frames

Agent Kit job: `/motion`

**RC19 · People sign up and drift away** Design how people get started and come back, instead of hoping they will.

1. /improve-retention: where the drop happens and why
2. /impeccable onboard: first run and empty states
3. /ux-writing: the words on those screens
4. /hooked-ux: a return habit, checked for manipulation

Agent Kit job: `/keen onboard`

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

Agent Kit job: `/keen layout`
