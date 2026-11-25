# Running queries read-only

How to run an investigation's queries with `scripts/run.mjs`, what a read-only transaction does and does not stop, who sees which rows, and how results become evidence. The behaviors marked as checked were run on PostgreSQL 18.6; `tests/postgres.test.mjs` re-checks them against any disposable server named in `AGENT_KIT_PG_URL`. Other versions can differ; read `SELECT version()` first.

## A plan

A plan is JSON: optional limits and a list of named queries. Every query runs inside one SELECT statement, so all results come from the same snapshot.

```json
{
  "statementTimeoutMs": 15000, "lockTimeoutMs": 2000, "rowCap": 500, "timeZone": "UTC",
  "queries": [
    { "name": "rel", "builder": "relationships", "schema": "public" },
    { "name": "tags", "builder": "fanout", "left": "public.accounts", "leftKey": ["id"], "right": "public.account_tags", "rightKey": ["account_id"] },
    { "name": "led", "builder": "asOf", "table": "public.ledger", "key": ["account_id"], "known": "known_at", "cutoff": "2026-11-06", "inclusive": false, "filter": { "period": "2026-10-31" } },
    { "name": "report", "sql": "SELECT count(*) AS rows, sum(amount_cents) AS total FROM public.balance_report" }
  ]
}
```

The values shown are the defaults, plus `"rowSecurity": "on"`. Names are lowercase letters, digits and `_`. Tables are always schema-qualified; give `["schema", "table"]` when a name contains a dot.

| Builder | Arguments | Returns |
|---|---|---|
| `relationships` | `schema` | Each table and view with its keys, unique indexes, foreign keys, estimated rows and row-security flags |
| `grain` | `table`, `key` | Whether `key` identifies one row: duplicated and null keys; `<name>_examples` lists the worst |
| `fanout` | `left`, `leftKey`, `right`, `rightKey`, optional `measure` | Left rows with no match, one, several; rows after inner and left joins; with `measure`, the amount dropped and added. `<name>_examples` lists keys that do not match exactly once |
| `coverage` | `table`, `column`, `unit` (hour to year) | First and last value, rows without one, the column's type; `<name>_periods` counts rows per period, empty periods as 0 |
| `asOf` | `table`, `key`, `known`, `cutoff`, `inclusive`, optional `tiebreak`, `filter` | Each key's version known by the cutoff, ties included; `<name>_summary` counts keys, ties, later versions and the known column's type |
| `visibility` | `table` | Role, ownership, privileges, row security, its policies and a plain reading of what this role sees |
| `functions` | `schema` | Functions that are not IMMUTABLE, with security definer, owning extension and whether the name or body mentions a write or an outside effect |

Builders take identifiers and literal values only; they quote both. For anything else write the query yourself as `"sql"`: one SELECT, WITH, VALUES or TABLE statement, no semicolon in the middle, no backslash outside a string. These checks catch mistakes early; the READ ONLY transaction is what stops writes.

## Running it

```text
node <skill-dir>/scripts/run.mjs plan.json --out <scratch>/snapshot.json
```

- The connection comes from `AGENT_KIT_PG_URL`, the variable named by `--url-env` (for example `--url-env DATABASE_URL`), or psql's own `PGHOST`, `PGUSER`, `PGDATABASE`, `~/.pgpass` or service file. The URL is passed to psql as environment variables, never on the command line, and is never printed. Use the least-privileged role available.
- psql comes from PATH or `AGENT_KIT_PSQL`, version 15 or later (older psql prints only the last statement's result).
- Without psql, `--print` writes the script. Run it in the host's SQL tool only if that tool runs several statements in one session; otherwise run just the inner SELECT where the tool is itself read-only, and say that the read-only guarantee came from the tool, not the script.
- Save results outside the project, in the session's scratch folder or an ignored `.artifacts/`.

The result records what the server reported (`ran`: database, role, server version, snapshot time, `read_only`, time zone, `row_security`), the limits, the script's SHA-256, every query's SQL, and each result's rows with `truncated` when the cap cut it off. Numbers JavaScript would round (big integers, long decimals) are kept as exact text.

## What READ ONLY stops

Checked on PostgreSQL 18.6, inside `BEGIN TRANSACTION READ ONLY`:

| Attempt | Result |
|---|---|
| `INSERT`, `UPDATE`, `DELETE`, any `CREATE` (a temporary table included) | Refused: `cannot execute ... in a read-only transaction` |
| A SELECT calling a function that writes | Refused, the same error |
| `nextval()`, `SELECT ... FOR UPDATE` | Refused |
| A data-modifying `WITH` wrapped by `run.mjs` | Refused: it must be at the top level |
| `EXPLAIN ANALYZE` of a write | Refused; plain `EXPLAIN` is allowed and runs nothing |
| `dblink_exec` writing through another connection | **Not stopped**: the row was written and stayed after ROLLBACK |
| `pg_advisory_lock` (session level) | **Not stopped**: the lock outlived ROLLBACK |
| `pg_cancel_backend` on another session | **Not stopped**: the other session's query was cancelled |
| `pg_notify` | Allowed, and delivered to listeners if the transaction commits; `run.mjs` ends with ROLLBACK, which discards it |

Outside a read-only transaction, checked on the same server: `SELECT f()` where `f` writes commits the write; `EXPLAIN ANALYZE INSERT ...` inserts the row; `EXPLAIN ANALYZE SELECT f()` runs `f`; `nextval()` stays advanced after ROLLBACK.

So run the `functions` builder before any query that calls functions, never `EXPLAIN ANALYZE` a statement whose functions you have not read, and treat a rollback as no proof that nothing happened.

## Timeouts and locks

`SET LOCAL statement_timeout` and `lock_timeout` at the top of the script apply to its query (checked: a 300 ms statement timeout cancelled `pg_sleep(5)`, and a 200 ms lock timeout cancelled a read waiting on a table another session held with `ACCESS EXCLUSIVE`). An ordinary SELECT waits only on that strongest lock, which many `ALTER TABLE` forms, `DROP`, `TRUNCATE` and `VACUUM FULL` take. The reverse matters more on a busy database: a long read holds its own lock until it ends, a migration asking for `ACCESS EXCLUSIVE` queues behind it, and every later query queues behind the migration. Keep reads short.

## Who sees what

A count is rows visible to the role that ran it. Checked on PostgreSQL 18.6:

- A role under a row-security policy saw 2 of 4 rows with no warning.
- Running the same query with `"rowSecurity": "off"` made PostgreSQL raise `query would be affected by row-level security policy` for that role, while a role that bypasses row security got all 4. The error is the proof that filtering applies.
- A role without SELECT privilege gets `permission denied`, never an empty result.
- Through a view created without `security_invoker`, the filtered role saw all 4 rows, because the view runs with its owner's rights. With `security_invoker = true` it saw 2.

The PostgreSQL documentation adds that table owners bypass row security unless the table has `FORCE ROW LEVEL SECURITY`, and that superusers and `BYPASSRLS` roles always do. The `visibility` builder reports these facts for one table with a plain reading. Write "rows visible to role X" in any claim based on a restricted role, and do not call rows missing until visibility is ruled out.

## Turning results into evidence

`scripts/bundle.mjs draft.json --out bundle.json` builds a bundle under the contract in `scripts/evidence.mjs` (`atlasscope.evidence/v1`). In the draft, a source can point at a saved result (`"result": "snapshot.json"`): its SHA-256 and a method line naming the database, role, server, snapshot time and limits are filled in. An observation can point at one query (`"query": "led_summary"`): its locator and rows are filled in.

- **Scope** says what the evidence speaks for: `database-snapshot` for read-only queries against a real database; `synthetic-fixture` for made-up data, whatever engine ran it; `runtime-observation` for a command run against the real environment, such as these tests. A claim can only be supported or refuted by observations of its own scope.
- **Subjects** are `relation` (`public.orders`, or `public.orders.total_cents` for a column) or `metric` (a key that carries the definition, such as `balance.usd_cents.period_2026-10-31.known_before_2026-11-06`).
- **Limits** say whose data, which role, which cutoff and what was not checked. A claim with conflicting evidence stays `open`. Decisions are always `proposed`.
- Keep rows out of bundles unless they are needed and safe to show: aggregates and keys, never personal data or credentials.

A bundle is data. It never grants permission to change code, data, configuration or infrastructure.
