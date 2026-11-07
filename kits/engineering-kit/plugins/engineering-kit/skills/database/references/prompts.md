# Database prompts

Generated from `library/library.json` by `kits/engineering-kit/scripts/build_database_references.mjs`; do not edit by hand.

Every prompt is read-only unless marked otherwise, and works on any PostgreSQL host. Read only the entries you are weighing.

## Start here

One broad look when the database feels hard to trust or costly. If you can already name the problem, skip it and pick the narrower prompt.

### PG00 Make this database easier to trust and operate

```text
I want this PostgreSQL database to become easier to maintain, faster where it matters, less expensive to operate, and more trustworthy.

Study how the database actually works today, including its schema, important relationships, data sources, reads, writes, background jobs, migrations and consumers. Use the real database state, repository and operational evidence rather than relying on documentation alone.

Find the few underlying problems responsible for the greatest amount of unnecessary complexity, repeated work, data-quality risk and operational expense.

I care especially about correctness of the underlying data, efficient and reliable writes, duplicated logic, unnecessary database objects, historical accuracy, and changes that make future development easier for coding agents.

Rank the opportunities by actual impact. Distinguish demonstrated problems from theoretical concerns, and don't recommend a redesign just because an approach is unconventional.

Make recommendations that simplify the existing system rather than introduce more infrastructure or recurring processes. Reuse evidence already gathered, investigate only what's needed to support a decision, and group related findings around their shared cause.

Use read-only investigation initially. Don't modify production data, schemas or infrastructure. Give me the strongest findings, what proves them, and the smallest changes that would produce meaningful improvements.
```

- When: The broad starting point when the database feels hard to trust or costly, and you can't yet name one problem.
- Evidence to ask for: A short ranked list of confirmed problems, each with the tables, writers and consumers involved, and the proof: query plans, samples, counts or a check against the source.
- Skip when: You already know the specific problem. Go straight to the narrower prompt for it.
- Avoid: Turning one look into a standing review, a new process or automated governance.
- Needs: the repository and read-only database access. Helps: query statistics (pg_stat_statements) and, on Supabase, the built-in Advisors.
- Mode: read-only.
- Tools that can help: Supabase agent skills, pg_stat_statements, Supabase Advisors
- Related: `PG01`, `PG05`, `PG10`, `PG13`

## Accuracy and evidence

Proves the data is right, not just valid: rebuilt figures, whole populations, stable identities and past results that still reproduce.

### PG01 Can we independently prove these numbers?

```text
Take a representative set of important figures from this database and independently reconstruct them from their original sources. Don't rely on the existing calculation code to verify itself. Find discrepancies in definitions, source selection, units, dates, classifications, and relationships. Determine which errors are isolated and which come from shared logic, then rank corrections by analytical impact.
```

- When: Important figures may be wrong even though their lineage is documented.
- Evidence to ask for: Samples from the original sources, an independent rebuild of each figure, each disagreement classified, how many records it affects, and the shared causes.
- Skip when: The figures are copied straight from the source with no calculation applied.
- Avoid: Checking a value with the same code or source reading that produced it.
- Needs: the repository, read-only database access and the original source documents.
- Mode: read-only.
- Related: `D02`, `D01`, `PG02`, `PG04`

### PG02 Find data that is internally consistent but wrong

```text
Look for data that passes the database's constraints and ordinary validation but is still analytically wrong. Test cross-table relationships, accounting identities, historical continuity, plausible ranges, source coverage, and independent calculations. Focus on contradictions that existing checks would miss, and distinguish genuine errors from legitimate differences in definitions or reporting periods.
```

- When: Every check passes, but totals or outputs still look implausible.
- Evidence to ask for: Cross-table reconciliations, identities and expected-population comparisons that fail, with source samples and how much data is affected.
- Skip when: There is no derived or analytical output, only records stored as entered.
- Avoid: Calling different grains, as-of dates or reporting bases errors without checking their definitions.
- Needs: the repository and read-only database access. Helps: pgTAP on a local or branch database, to turn confirmed rules into tests.
- Mode: read-only.
- Tools that can help: pgTAP database tests
- Related: `D01`, `R03`, `PG01`, `PG03`

### PG03 Find where records silently change identity

```text
Trace how real-world entities are identified, matched and connected across imports, source documents and database tables. Find cases where distinct entities are merged, identical entities are duplicated, or historical relationships become disconnected. Identify the matching rule responsible and the affected population before proposing corrections.
```

- When: Sources use aliases, changing identifiers, share classes or inconsistent names for the same thing.
- Evidence to ask for: Likely duplicates and false merges with their source IDs, the matching rule behind each, the records affected and a counterexample you can rerun.
- Skip when: Every source shares one stable identifier and nothing is matched by name.
- Avoid: Merging entities just because their names look alike.
- Needs: Repository and read-only database access.
- Mode: read-only.
- Related: `D05`, `D04`, `A02`, `PG02`

### PG04 Reproduce what the database believed in the past

```text
Choose important historical records and determine whether the system can reproduce what was known and reported at a specific past date, using the definitions and evidence available then. Distinguish later source corrections from later classification changes. Find where current logic silently rewrites historical meaning and recommend the smallest reliable solution.
```

- When: Past reports, backfills, restatements or changed classification rules matter.
- Evidence to ask for: Two or more past checkpoints, when each record was true and when it was known, the source revisions, and changes you can demonstrate.
- Skip when: Nobody needs past results to stay reproducible.
- Avoid: Requiring bitemporal storage everywhere. Work out what is actually needed before choosing a structure.
- Needs: Repository and read-only database access.
- Mode: read-only.
- Related: `D03`, `R04`, `PG01`, `PG15`

## Writes and ingestion

Who writes what, how often it changes nothing, and whether imports survive retries and corrections.

### PG05 Map every place that writes to the database

```text
Map the actual write paths for the important tables in this application. Identify every script, job, API, function, trigger and agent that can create, update or delete their records. Show who owns each field, which paths overlap, and where two writers can disagree or overwrite each other. Recommend the simplest ownership model supported by the existing system.
```

- When: Several jobs, functions, APIs or agents change the same data, or nobody is sure who owns it.
- Evidence to ask for: A map from each writer to its tables and columns, then to triggers, side effects and consumers, with the cases where writers overlap or conflict.
- Skip when: One code path writes each table.
- Avoid: Treating every extra writer as wrong. Find the paths that actually conflict.
- Needs: Repository and read-only database access.
- Mode: read-only.
- Related: `A04`, `R05`, `PG06`, `PG09`

### PG06 Stop rewriting data that hasn't changed

```text
Investigate how much database write activity actually changes meaningful information. Find repeated upserts, unchanged updates, unnecessary delete-and-reinsert operations, repeated index maintenance and cascading refreshes. Measure their cost where practical and determine which writes can be eliminated without changing correctness, history or recovery behavior.
```

- When: Upserts and updates run at high volume, imports are costly, or vacuum and write-ahead log churn look high.
- Evidence to ask for: Statement counts, the share of writes that really change a row, dead-row and churn figures, index and WAL effects where measurable, and before-and-after tests on a copy.
- Skip when: Write volume is small, or every write is a change that has to happen.
- Avoid: Suppressing deliberate last-seen timestamps, trigger side effects, version counters or refreshes that are meant to happen.
- Needs: the repository and read-only database access. Helps: query statistics (pg_stat_statements).
- Mode: read-only.
- Tools that can help: pg_stat_statements, Postgres best practices skill (Supabase)
- Related: `P04`, `P09`, `PG05`, `PG07`, `PG13`

### PG07 Is our ingestion process more complicated than necessary?

```text
Trace one complete ingestion cycle from the original source to the final database records. Identify repeated parsing, unnecessary intermediate states, duplicate validation, repeated reads, redundant transformations and writes that could be consolidated. Recommend the simplest workflow that preserves accuracy, traceability, failure recovery and the ability to process corrections.
```

- When: The import pipeline is long, slow to correct, or does the same work at several stages.
- Evidence to ask for: One real trace from source to final rows, the work done twice, the checkpoints, a shorter path, and checks that the shorter path gives the same results and still replays.
- Skip when: The pipeline is already one short step from source to table.
- Avoid: Removing evidence, provenance or checkpoints that recovery depends on.
- Needs: Repository and read-only database access.
- Mode: read-only.
- Related: `D04`, `PG05`, `PG06`, `PG08`, `PG09`

### PG08 Can we rerun everything without damaging the data?

```text
Examine the ingestion and correction workflows under retries, interrupted runs, duplicate source files, out-of-order arrivals and repeated execution. Demonstrate where these cases produce duplicate records, lost corrections, partial results or unnecessary rewrites. Find the smallest durable approach that makes each operation safely repeatable.
```

- When: Imports get retried, schedulers overlap, files are replayed, or runs fail halfway.
- Evidence to ask for: Replay scenarios with their conflict keys, interrupted-run cases, before-and-after data comparisons and a safe way to resume.
- Skip when: Every import runs once, by hand, with nothing to retry.
- Avoid: Calling an import safe to rerun just because the SQL has ON CONFLICT.
- Needs: the repository and read-only database access. Helps: an isolated database for replay tests, and pgTAP.
- Mode: read-only.
- Tools that can help: pgTAP database tests
- Related: `R01`, `R06`, `PG05`, `PG07`

### PG09 Find where write logic should live

```text
Trace how records are validated, transformed and written across application code, database functions, triggers and background jobs. Find rules duplicated in different layers or placed where they are difficult to test and maintain. Recommend the simplest ownership boundary for each rule, without assuming that moving more logic into Postgres is automatically better.
```

- When: Business rules are split across SQL, triggers, edge functions, server routes and workers.
- Evidence to ask for: Each rule with the layers that enforce it, the current owner, duplicated checks, how testable each place is, transaction limits and what a change would touch.
- Skip when: Each rule already lives in exactly one place.
- Avoid: Automatically favouring stored procedures, or automatically moving everything out of the database.
- Needs: Repository and read-only database access.
- Mode: read-only.
- Related: `A02`, `PG05`, `PG07`, `PG10`

## Schema and dependencies

Fewer objects, one home for each fact, and a model a new engineer or agent can read.

### PG10 Which database objects no longer earn their keep?

```text
Examine the tables, views, functions, triggers, indexes and materialized views in this database. Identify redundant representations, obsolete objects, overlapping responsibilities, unnecessary dependency chains and abstractions that no longer provide meaningful value. Verify actual consumers before recommending removal. Rank opportunities by complexity eliminated, operational savings and migration risk.
```

- When: The list of views, functions and triggers has grown hard to reason about.
- Evidence to ask for: A map of objects, what depends on them and who uses them, the removal candidates, migration risks and how much complexity goes away.
- Skip when: The schema is small and every object has a known reader.
- Avoid: Deleting objects that look unused but are called dynamically or by outside clients.
- Needs: read-only database access to the catalog, plus the repository and any outside clients.
- Mode: read-only.
- Tools that can help: Postgres best practices skill (Supabase)
- Related: `A03`, `I06`, `PG09`, `PG11`, `PG12`

### PG11 Are we storing the same truth multiple times?

```text
Find concepts and values maintained in multiple tables, materialized views, caches or derived columns. Trace which representation is authoritative, why each copy exists, how it stays synchronized, and what happens when the copies disagree. Recommend which duplication is justified by performance or history and which should be removed.
```

- When: Caches, aggregates, materialized views or derived columns drift from the raw facts.
- Evidence to ask for: The authoritative source and each copy, how each is refreshed, examples of drift, and what each copy costs readers and writers.
- Skip when: Each fact is stored once.
- Avoid: Rejecting all denormalisation. Copies kept for speed or history can be worth it.
- Needs: Repository and read-only database access.
- Mode: read-only.
- Related: `A04`, `D02`, `PG05`, `PG10`

### PG12 Can the schema be easier to understand without losing depth?

```text
Review the database's logical organization from the perspective of a new senior engineer. Identify confusing names, mixed responsibilities, inconsistent conventions, unclear relationships and schemas that obscure the business domain. Recommend structural improvements that make the model easier to understand and maintain without sacrificing useful historical detail or creating unnecessary migrations.
```

- When: New developers or agents keep misunderstanding names, concepts or relationships.
- Evidence to ask for: The specific confusions, the work they affect, a schema map, and the least disruptive naming or boundary fixes.
- Skip when: Nobody has misread the schema recently.
- Avoid: Cosmetic renames and broad migrations with no shown maintenance benefit.
- Needs: the repository and read-only database access. Helps: declarative schema files, if the project uses them.
- Mode: read-only.
- Tools that can help: Declarative schemas (Supabase)
- Related: `A02`, `G01`, `PG10`, `PG11`

## Performance and maintenance

Where storage, time and write cost actually go, and what grows expensive first. Every claim needs a measurement.

### PG13 Find the true sources of database waste

```text
Measure which tables, indexes, queries and maintenance activities consume the most storage, execution time and write resources. Distinguish useful capacity from avoidable waste, including unused indexes, row churn, bloat, poor plans and excessive scans. Recommend changes based on observed workload and realistic savings, not generic optimization rules.
```

- When: The bill is high, CPU or disk usage is high, storage keeps growing, or you suspect bloat.
- Evidence to ask for: Table and index sizes, the top statements, usage counts, dead-row and maintenance figures, EXPLAIN output and the savings you expect.
- Skip when: Usage and cost are small and steady.
- Avoid: Judging an index from a code search alone, or looking only at query time and ignoring write cost.
- Needs: read-only database access and query statistics (pg_stat_statements). Helps: Supabase Advisors, and HypoPG to test an index without building it.
- Mode: read-only.
- Tools that can help: pg_stat_statements, Supabase Advisors, HypoPG, Postgres best practices skill (Supabase)
- Related: `P03`, `I03`, `PG06`, `PG14`

### PG14 What will become expensive as the database grows?

```text
Use actual table sizes, row growth, query plans and workload patterns to identify the first database operations likely to become disproportionately expensive as data grows. Evaluate indexing, partitioning, pagination, aggregation and retention only where the evidence justifies them. Show what scale would trigger a change rather than optimizing everything prematurely.
```

- When: Fact or history tables are growing fast, or you need to plan capacity.
- Evidence to ask for: Current row counts and growth rates, the workload assumed, the size at which each operation becomes a bottleneck, and costs before and after at a realistic scale.
- Skip when: Data volume is small and flat.
- Avoid: Partitioning or new layers without a measured or credible need.
- Needs: read-only database access. Helps: query statistics (pg_stat_statements) and HypoPG.
- Mode: read-only.
- Tools that can help: pg_stat_statements, HypoPG
- Related: `P03`, `P05`, `PG13`

## Rebuild and safe change

Changes and restores proved on a separate database before anyone relies on them.

### PG15 Can we rebuild this database from its sources?

```text
Determine whether this database can be reconstructed from the repository, migrations, original source material and retained operational records. Identify anything that exists only in production, any transformations that cannot be reproduced, and data that would be permanently lost. Where possible, test the reconstruction on an isolated database and compare the resulting records and relationships.
```

- When: You worry about disaster recovery, production-only state, or whether the data could be rebuilt.
- Evidence to ask for: The exact inputs needed to rebuild, the migration chain, a sampled comparison of a rebuilt copy against production, and the gaps that can't be recovered.
- Skip when: The database is a disposable cache you can refill at any time.
- Avoid: Running a destructive restore against production, or treating a list of backups as proof they restore.
- Needs: the repository, read-only production access and a separate database you are allowed to build into.
- Mode: read-only on production; any rebuild, replay or migration test runs on a separate database the user approves.
- Tools that can help: pgTAP database tests
- Related: `I02`, `D02`, `PG04`, `PG17`

### PG17 Are our database changes safe before we merge?

```text
Review this database change against the live schema, existing consumers, prior migrations and deployment process. Establish whether it preserves current records, supports old and new application versions during rollout, and can be verified on an isolated database. Identify the smallest necessary migration and a realistic recovery path before approving it.
```

- When: A migration, or a change to functions, views, RLS, types or column meaning, is about to ship.
- Evidence to ask for: The migration diff, the consumers it touches, how old and new app versions coexist during rollout, locks and rollback, and a replay on a separate database.
- Skip when: The change touches no schema, functions or policies.
- Avoid: Claiming a rollback exists because the application code can be reverted.
- Needs: the repository, read-only access to the live schema and a separate database to replay the migration. Helps: pgTAP and, on Supabase, Advisors and branches.
- Mode: read-only on production; any rebuild, replay or migration test runs on a separate database the user approves.
- Tools that can help: pgTAP database tests, Supabase Advisors, Declarative schemas (Supabase), Postgres best practices skill (Supabase)
- Related: `G02`, `I02`, `S06`, `PG15`

## Agent decisions

Turns questions agents keep asking you into rules they can apply themselves.

### PG16 Which decisions should an expert agent make without me?

```text
Find recurring database decisions that agents currently escalate to me, including field classification, record matching, write conflicts, source precedence and schema choices. Determine which can be resolved through established standards, existing precedent and authoritative evidence. Make the decision rules reusable, identify their limits, and reserve escalation for genuine product or risk decisions.
```

- When: Agents keep asking you to classify fields, match records or pick between sources.
- Evidence to ask for: The kinds of question that repeat, the standards and precedents that settle them, each rule with its exceptions, and where escalation really belongs.
- Skip when: Agents rarely escalate database questions.
- Avoid: Inventing accounting, source-precedence or product policy where no authority exists.
- Needs: the repository, past agent transcripts or notes, and read-only database access.
- Mode: read-only.
- Related: `M05`, `M07`, `G01`, `PG01`, `PG09`

## Workflows

Routes for a whole job. Offer one only when the user asks for the whole job, not for a single question.

### DBR01 Is the data actually right?

Prove the numbers before fixing anything.

- Start: `PG01`, `PG02`. PG01 when a figure disagrees with its source; PG02 when everything validates but still looks wrong.
- If needed: `PG03`, `PG04`. PG03 for identity gaps; PG04 when the meaning of past records matters.
- Change: Fix only the confirmed shared causes, and add SQL or metric tests for them.
- Done when: Recomputed examples that now match, an estimate of how much data was affected, and any source limits stated plainly.

### DBR02 Make ingestion simpler and cheaper

Less work per import, without losing provenance or corrections.

- Start: `PG05`, `PG07`. PG05 when it is unclear who writes what; otherwise PG07.
- If needed: `PG06`, `PG08`, `PG09`. PG06 for writes that change nothing; PG08 for replay or correction failures; PG09 for validation done in several places.
- Change: Make the smallest change to one cause at a time, keeping provenance and corrections.
- Done when: The same results for reference inputs, measurably less work, and retries that do no harm.

### DBR03 Simplify a crowded schema

Fewer objects with the same outcomes.

- Start: `PG10`. Inventory objects and their real consumers.
- If needed: `PG11`, `PG12`, `PG17`. PG11 for copies of the same fact; PG12 for confusing names; PG17 before any schema change ships.
- Change: Confirm consumers before retiring anything, and keep old and new versions working during rollout.
- Done when: Less complexity with unchanged results for users and data.

### DBR04 Reduce PostgreSQL resource cost

Spend less where the measurements say the money goes.

- Start: `PG13`. Measure the top consumers first.
- If needed: `PG06`, `PG14`, `P03`. PG06 for write churn; PG14 when growth is the driver; P03 for one slow query.
- Change: Take the biggest measured savings first. No speculative indexes or partitions.
- Done when: Workload figures before and after, with no loss of correctness.

### DBR05 Ship or recover safely

A schema change or a restore you have actually tested.

- Start: `PG17`, `PG15`. PG17 for a change about to ship; PG15 for rebuilding or recovery.
- If needed: `G02`, `R06`, `PG04`. G02 for deploy timing; R06 for half-finished failures; PG04 when past results must not move.
- Change: Run migrations and restores on a separate database, check compatibility, and plan the recovery.
- Done when: A migration or restore tested on a separate database, and no claim about production that wasn't proved.

## Related prompts from the investigations

These live in the /engineer catalog. Use them when the routing table names them.

- `A02` Meaning drift across the stack: Shows where one word (a task, a fund, a run) means slightly different things in different parts of the app.
- `A03` Layers that don't earn their keep: Finds extra layers of code you could delete so the code, and the agents reading it, get simpler.
- `A04` Two systems that disagree: Finds data kept in two places (a saved copy and a table, the browser and the server) that can quietly disagree.
- `D01` Missing vs zero vs stale: Finds where 'we don't know' turns into 0 and then into a wrong total.
- `D02` Where did this number come from?: Checks that every number on screen can be traced back to a source document.
- `D03` Old records, new meanings: Finds old records that read differently once today's rules are applied to them.
- `D04` Imports that fail quietly: Finds rows that go missing or land on the wrong record during import, with no error.
- `D05` Links between records worth adding: Finds links between records worth adding, and ones the evidence does not support.
- `G01` Out-of-date agent instructions: Finds instructions that send agents to files and patterns that no longer exist.
- `G02` Database changes during a deploy: Checks that each database change works with the old code that is still live while a release finishes.
- `I02` Why production might not match main: Lists every way 'merged' can fail to mean 'live'.
- `I03` Check time that catches nothing: Finds paid automated-check minutes spent on checks that never catch anything.
- `I06` Packages nobody uses, or that work by luck: Finds packages nobody uses and packages that work only by accident.
- `M05` Let the expert decide: undefined
- `M07` Spec without the interview: undefined
- `P03` Queries that grow badly: Finds the database queries that will be the first to slow down as tables grow.
- `P04` Work repeated for nothing: Finds work redone on every request or screen redraw when nothing it depends on changed.
- `P05` What breaks at ten times the size: Names the first thing to break if the project takes off, before it does.
- `P09` Parallel work with no limit: Finds work run in parallel with no limit, which can swamp the database connections or an outside service.
- `R01` Safe to run twice?: Finds actions that do damage when they run twice: double sends, double charges, duplicate rows.
- `R03` Rules the data never enforces: Finds the rules everyone assumes (one owner per task, no negative balance) that nothing actually checks.
- `R04` Dates, times and time zones: Finds the date bugs that show up twice a year, at midnight, or in another time zone.
- `R05` Updates that overwrite each other: Finds updates that overwrite newer data because two things wrote at once.
- `R06` Half-finished failures: Finds what is left behind when something fails halfway.
- `S06` Settings that differ in production: Finds settings that behave differently in production than anyone expects.

## Tools

Install steps last checked 2026-11-07. Check the linked page before telling the user a command is current. None of these is installed by this plugin.

- [Supabase agent skills](https://github.com/supabase/agent-skills): Official skills for Supabase and Postgres work. Install with: claude plugin marketplace add supabase/agent-skills, then claude plugin install supabase@supabase-agent-skills. Other agents: npx skills add supabase/agent-skills.
- [Postgres best practices skill (Supabase)](https://github.com/supabase/agent-skills/blob/main/skills/supabase-postgres-best-practices/SKILL.md): Rules for queries, indexes, connections, locking and RLS. Works on any Postgres, not only Supabase. Install with: claude plugin install postgres-best-practices@supabase-agent-skills.
- [pg_stat_statements](https://supabase.com/docs/guides/database/extensions/pg_stat_statements): Postgres extension that counts how often each statement runs and how long it takes. Check it is enabled before trusting its numbers.
- [Supabase Advisors](https://supabase.com/docs/guides/observability/advisors): Built-in security and performance checks in the Supabase dashboard. Read their output rather than running another scanner.
- [HypoPG](https://supabase.com/docs/guides/database/extensions/hypopg): Tests whether an index would help without building it. Optional, and not needed for most investigations.
- [pgTAP database tests](https://supabase.com/docs/guides/local-development/testing/overview): SQL tests for rules and RLS policies. Run them on a local or branch database, never production.
- [Declarative schemas (Supabase)](https://supabase.com/docs/guides/local-development/declarative-database-schemas): Keep the desired schema in files and generate migrations from it. Weigh it against the migration workflow you already have.
- [PostgreSQL documentation](https://www.postgresql.org/docs/current/): The reference for exact behaviour. Check the version your database runs.

## Wrapping a prompt

Send the prompt as written, then the mode line, then the evidence line:

- `read` (Read-only): Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.
- `repro` (Reproducer only): You may add a failing test or a small reproduction script for the highest-risk finding. Do not change application code, data or configuration.
- `change` (Propose a fix): After reporting, propose the smallest fix for the top confirmed finding as a diff for my review. Do not apply it to production, run migrations, or delete anything.

For prompts marked as testing on a separate database, add: Anything that changes state, such as a rebuild, replay or migration test, runs only on a separate database with safe test data, never on production.
