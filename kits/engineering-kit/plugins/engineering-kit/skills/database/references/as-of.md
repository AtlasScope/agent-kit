# What was known when

Use this when past reports change after corrections, when a figure is meant to be "as of" a date, or when records change identity over time (`PG03`, `PG04`, `PG08`, `PG15`).

## Three different times

- **Effective time**: the period a fact describes (the October 31 balance).
- **Knowledge time**: when this version of the fact became available (the statement line received November 3, the correction received November 12).
- **Ingestion time**: when the system wrote it. It is not the source's publication time unless something proves they match.

A later correction can legitimately restate an old period. It must not change a report that claims to show what was known at a past moment. Both numbers are valid; name which one is wanted and label each.

## Cutoffs are exact

State whether the cutoff is inclusive or exclusive and in which time zone. On PostgreSQL 18.6, checked:

- A date-only literal compared with a `timestamptz` column means midnight at the start of that day: `'2026-11-05 10:00+00' <= '2026-11-05'` is false. To include the whole day, write `< '2026-11-06'` (in the `asOf` builder, `"cutoff": "2026-11-06", "inclusive": false`).
- A timestamp without a zone is read in the session's time zone. `run.mjs` sets it to UTC unless the plan's `timeZone` says otherwise; the same cutoff `'2026-11-05 11:00'` included a 16:30 UTC version when read in America/Chicago and excluded it in UTC.
- The `asOf` summary reports the known column's type, so check it against the cutoff you wrote.

## One version per key

The `asOf` builder picks each key's latest version known by the cutoff using `rank()`, so versions that tie on the known time all come back instead of one being picked silently, and `keys_with_unresolved_ties` counts them. `DISTINCT ON` and `row_number()` pick arbitrarily among ties; use them only after the summary shows there are none, or with an explicit tiebreak column. With `tiebreak`, `versions_at_that_time` still shows how many versions shared the winner's time, so a tie the tiebreak settled stays visible.

`versions_known_after_cutoff` counts corrections that had not arrived yet. If a report meant to be as-known includes one of them, it is leaking future knowledge; the bridge step is the difference between the as-known version and the one the report used.

## Can the past be reconstructed at all?

Only if old versions still exist. If rows are updated in place with no version column, history table, audit trigger or event log, the current database cannot say what was known then; report that instead of inferring history from current values. Look for version or `valid_from` columns, history and audit tables, triggers that copy old rows, and backups with point-in-time recovery (which are restored on a separate database the user names, never over production).

A `REPEATABLE READ` transaction gives one consistent snapshot of now, not access to the past. Keep snapshots short: a long-open transaction holds back cleanup of dead rows for the whole database.

## What kind of change is it

Sort each difference between two moments into one of: late-arriving data, a restatement of the same fact, a reclassification, a change in the rules, or missing source coverage. The `coverage` builder shows rows per period with empty periods as zero, which separates "nothing happened" from "nothing arrived".

## Identity over time

A row's key and the real-world thing it stands for are different questions. Check merges (two keys that are one thing), splits (one key that became two), and which version of the matching rule linked them. Report ambiguous matches instead of choosing one. A checksum shows two copies have the same bytes, not that the facts in them are right.

Reference: PostgreSQL transaction isolation and snapshots, https://www.postgresql.org/docs/current/transaction-iso.html. Check the version the database actually runs.
