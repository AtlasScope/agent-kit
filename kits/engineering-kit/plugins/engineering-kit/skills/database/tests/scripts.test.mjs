// Behavior that needs no database: quoting, the read-only script, output parsing, the bridge and the evidence
// builder. Run: node --test "kits/engineering-kit/plugins/engineering-kit/skills/database/tests/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { ident, relation, literal, checkQuery, readOnlyScript, queriesOf, BUILDERS } from "../scripts/sql.mjs";
import { connectionEnv, parseOutput } from "../scripts/run.mjs";
import { bridge } from "../scripts/bridge.mjs";
import { seal } from "../scripts/bundle.mjs";
import { validateBundle, SCOPES } from "../scripts/evidence.mjs";

test("identifiers are quoted, never trusted", () => {
  assert.equal(ident('Order "Lines"'), '"Order ""Lines"""');
  assert.equal(relation("public.orders"), '"public"."orders"');
  assert.equal(relation(["odd.schema", 'x"; DROP TABLE t; --']), '"odd.schema"."x""; DROP TABLE t; --"');
  assert.throws(() => relation("orders"), /schema and relation/);
  assert.throws(() => ident(""), /Invalid identifier/);
  assert.throws(() => ident("a".repeat(64)), /truncated/);
});

test("literals survive quotes and backslashes in either string mode", () => {
  assert.equal(literal("O'Brien"), "'O''Brien'");
  assert.equal(literal("C:\\tmp\\'x"), "E'C:\\\\tmp\\\\''x'");
  assert.equal(literal(null), "NULL");
  assert.equal(literal(12.5), "12.5");
  assert.throws(() => literal(Infinity), /Invalid number/);
  assert.throws(() => literal({}), /Invalid literal/);
});

test("only one query statement gets through, whatever is inside literals and comments", () => {
  assert.equal(checkQuery("SELECT 1;  \n"), "SELECT 1");
  assert.equal(checkQuery("WITH x AS (SELECT ';' AS s) SELECT * FROM x"), "WITH x AS (SELECT ';' AS s) SELECT * FROM x");
  checkQuery("SELECT $q$ ; \\ $q$, E'it\\'s; fine', \"semi;colon\" -- a ; comment\nFROM t /* ; \\ */");
  checkQuery("/* lead */ (SELECT 1) UNION SELECT 2");
  assert.throws(() => checkQuery("SELECT 1; DROP TABLE t"), /One statement/);
  assert.throws(() => checkQuery("SELECT 1 \\! rm -rf ."), /Backslash/);
  assert.throws(() => checkQuery("DELETE FROM t"), /Only a SELECT/);
  assert.throws(() => checkQuery("SELECT 'open"), /Unclosed string/);
  assert.throws(() => checkQuery("SELECT (1"), /Unbalanced/);
});

test("the script is one READ ONLY transaction with its limits, a capped result per query, then ROLLBACK", () => {
  const { script, queries, limits } = readOnlyScript({ rowCap: 25, statementTimeoutMs: 5000, lockTimeoutMs: 500, queries: [{ name: "few", sql: "SELECT 1 AS one" }] });
  const lines = script.trim().split("\n");
  assert.equal(lines[0], "BEGIN TRANSACTION READ ONLY;");
  assert.equal(lines.at(-1), "ROLLBACK;");
  assert.match(script, /SET LOCAL statement_timeout = 5000;/);
  assert.match(script, /SET LOCAL lock_timeout = 500;/);
  assert.match(script, /SET LOCAL row_security = on;/);
  assert.match(script, /LIMIT 26\) AS r\)/);
  assert.equal((script.match(/^SELECT json_build_object/gm) || []).length, 1, "every query shares one statement, so one snapshot");
  assert.deepEqual(queries.map((q) => q.name), ["few"]);
  assert.equal(limits.timeZone, "UTC");
  assert.throws(() => readOnlyScript({ rowCap: 0, queries: [{ name: "a", sql: "SELECT 1" }] }), /rowCap/);
  assert.throws(() => readOnlyScript({ rowSecurity: "maybe", queries: [{ name: "a", sql: "SELECT 1" }] }), /rowSecurity/);
  assert.throws(() => queriesOf({ queries: [{ name: "a", sql: "SELECT 1" }, { name: "a", sql: "SELECT 2" }] }), /Two queries/);
  assert.throws(() => queriesOf({ queries: [{ name: "Bad-Name", sql: "SELECT 1" }] }), /name/);
  assert.throws(() => queriesOf({ queries: [{ name: "a", builder: "drop_everything" }] }), /unknown builder/);
});

test("builders put caller values only in quoted identifiers and literals", () => {
  const hostile = 'x"; DELETE FROM t; --';
  const [summary] = BUILDERS.fanout({ name: "f", left: ["public", hostile], leftKey: ["id"], right: "public.tags", rightKey: ["account_id"], measure: "amount" });
  assert.match(summary.sql, /"public"\."x""; DELETE FROM t; --"/);
  checkQuery(summary.sql);
  const asOf = BUILDERS.asOf({ name: "v", table: "public.ledger", key: ["account_id"], known: "known_at", cutoff: "2026-11-06", inclusive: false, filter: { period: "2026-10-31'; --" } });
  assert.match(asOf[0].sql, /"known_at" < '2026-11-06'/);
  assert.match(asOf[0].sql, /"period" = '2026-10-31''; --'/);
  assert.throws(() => BUILDERS.coverage({ name: "c", table: "public.t", column: "at", unit: "fortnight" }), /unit/);
  assert.throws(() => BUILDERS.fanout({ name: "f", left: "public.a", leftKey: ["x", "y"], right: "public.b", rightKey: ["x"] }), /same number/);
  for (const [name, build] of Object.entries(BUILDERS)) {
    const args = { name: "q", table: "public.t", key: ["id"], left: "public.a", leftKey: ["id"], right: "public.b", rightKey: ["a_id"], column: "at", known: "at", cutoff: "2026-01-01" };
    for (const q of build(args)) assert.doesNotThrow(() => checkQuery(q.sql), name);
  }
});

test("output parsing finds the result, cuts rows to the cap and keeps exact numbers", () => {
  const stdout = 'SET\n{"ran" : {"role" : "reader"}, "results" : {"a" : [{"n":1}, \n {"n":2}, \n {"n":3}], "b" : [{"big":9007199254740993,"cents":1.50,"plain":670500}]}}\n';
  const out = parseOutput(stdout, 2);
  assert.equal(out.ran.role, "reader");
  assert.deepEqual(out.results.a, { rows: [{ n: 1 }, { n: 2 }], truncated: true });
  assert.deepEqual(out.results.b.rows[0], { big: "9007199254740993", cents: "1.50", plain: 670500 });
  assert.throws(() => parseOutput("", 10), /psql 15/);
});

test("a connection URL becomes PG* variables and errors never echo it", () => {
  assert.deepEqual(connectionEnv("postgresql://reader:p%40ss%3Aword@db.example.com:6543/app?sslmode=verify-full&application_name=agent-kit"), { PGHOST: "db.example.com", PGPORT: "6543", PGUSER: "reader", PGPASSWORD: "p@ss:word", PGDATABASE: "app", PGSSLMODE: "verify-full", PGAPPNAME: "agent-kit" });
  const secret = "postgres://u:hunter2@h/db?sslmode=require&weird=1";
  assert.throws(() => connectionEnv(secret), (e) => /weird/.test(e.message) && !e.message.includes("hunter2"));
  assert.throws(() => connectionEnv("mysql://u:hunter2@h/db"), (e) => !e.message.includes("hunter2"));
});

// The Provenance scenario's numbers (synthetic, USD cents): statement as known on Nov 5 versus the report.
const provenance = {
  unit: "USD cents",
  from: { label: "Statement as known on Nov 5, comparable accounts", value: 670500 },
  steps: [
    { label: "Ingestion differs from the statement", value: -2000 },
    { label: "Nov 12 correction leaks past the cutoff", value: -15000 },
    { label: "Tag join counts an account twice", value: 87500 },
    { label: "Inner join drops an untagged account", value: -52000 },
  ],
  to: { label: "Report, comparable accounts", value: 689000 },
  outside: [{ label: "Reported with no independent evidence", value: 43000 }],
  keys: [{ key: "A02", delta: 87500 }, { key: "A03", delta: -15000 }, { key: "A06", delta: -2000 }, { key: "A07", delta: -52000 }],
};

test("bridge contributions sum exactly; outside amounts and offsetting errors stay visible", () => {
  const b = bridge(provenance);
  assert.equal(b.observed, 18500);
  assert.equal(b.explained, 18500);
  assert.equal(b.residual, 0);
  assert.equal(b.exact, true);
  assert.equal(b.steps.at(-1).running, 689000);
  assert.deepEqual(b.outside, { items: [{ label: "Reported with no independent evidence", value: 43000 }], total: 43000, to_plus_outside: 732000 });
  assert.deepEqual(b.keys, { count: 4, net: 18500, gross: 156500, raising: 1, lowering: 3, offsetting: true, matches_observed: true });
});

test("whatever the steps do not explain is reported as residual, not absorbed", () => {
  const b = bridge({ ...provenance, steps: provenance.steps.slice(0, 3), outside: [], keys: [] });
  assert.equal(b.residual, -52000);
  assert.equal(b.exact, false);
  const stages = bridge({ from: { value: "10.05" }, stages: [{ label: "a", value: "10.10" }, { label: "b", value: "9.999" }], to: { value: "10.000" } });
  assert.deepEqual(stages.steps.map((s) => s.value), ["0.050", "-0.101"]);
  assert.equal(stages.residual, "0.001");
  assert.throws(() => bridge({ ...provenance, to: { value: 0.1 + 0.2 } }), /decimal string/);
  assert.throws(() => bridge({ from: { value: 1 }, to: { value: 2 }, steps: [], stages: [] }), /not both/);
});

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "agent-kit-db-"));

test("a run result becomes a valid database-snapshot bundle with its digest and method", () => {
  const dir = tmp();
  try {
    const result = { tool: "agent-kit database run.mjs", ran: { database: "app", role: "reader", server: "18.6", at: "2026-11-25T07:00:00.000000Z", read_only: "on", time_zone: "UTC", row_security: "on" }, limits: { statementTimeoutMs: 15000, lockTimeoutMs: 2000, rowCap: 500 }, script_sha256: "a".repeat(64), queries: [{ name: "tags", builder: "fanout", sql: "SELECT 1" }], results: { tags: { rows: [{ left_rows: 8, inner_join_rows: 8 }], truncated: false } } };
    fs.writeFileSync(path.join(dir, "snapshot.json"), JSON.stringify(result));
    const draft = {
      id: "demo", title: "Demo", project: { repository: "example/app", revision: "working-tree" }, producer: { capability: "database" },
      subjects: [{ id: "tags", kind: "relation", key: "public.tags", label: "Tags" }],
      sources: [{ id: "snap", label: "Read-only snapshot", result: "snapshot.json", limits: "Rows visible to role reader only." }],
      observations: [{ id: "fan", source: "snap", query: "tags", subjects: ["tags"], kind: "Join fan-out", summary: "Eight rows in, eight out." }],
      claims: [{ id: "c1", title: "Row count hides the fan-out", statement: "Same count, different rows.", scope: "database-snapshot", status: "observed", limits: "One snapshot.", links: [{ observation: "fan", relation: "supports" }], subjects: ["tags"] }],
    };
    const b = seal(draft, dir, { now: new Date("2026-11-25T08:00:00Z") });
    assert.equal(b.sources[0].scope, "database-snapshot");
    assert.equal(b.sources[0].sha256, crypto.createHash("sha256").update(fs.readFileSync(path.join(dir, "snapshot.json"))).digest("hex"));
    assert.match(b.sources[0].method, /READ ONLY transaction .* role reader, PostgreSQL 18\.6/);
    assert.equal(b.observations[0].locator, "/results/tags");
    assert.deepEqual(b.observations[0].details.rows, [{ left_rows: 8, inner_join_rows: 8 }]);
    assert.deepEqual(b.producer, { capability: "database", at: "2026-11-25T08:00:00.000Z" });
    assert.throws(() => seal({ ...draft, sources: [{ ...draft.sources[0], result: "../snapshot.json" }] }, dir), /inside the draft/);
    assert.throws(() => seal({ ...draft, sources: [{ id: "f", label: "x", scope: "synthetic-fixture", artifact: "snapshot.json", sha256: "0".repeat(64), method: "m", limits: "l" }], observations: [], claims: [] }, dir), /does not match/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("the contract takes the additive v1 changes and still rejects unknown keys", () => {
  assert.ok(SCOPES.includes("runtime-observation") && SCOPES.includes("database-snapshot"));
  const base = { schema: "atlasscope.evidence/v1", id: "b", title: "B", project: { repository: "r", revision: "working-tree" }, subjects: [{ id: "s", kind: "relation", key: "public.orders.total_cents", label: "Order total" }], sources: [], observations: [], claims: [], decisions: [], cases: [] };
  validateBundle(base);
  validateBundle({ ...base, project: { repository: "r", revision: "f".repeat(64) } });
  validateBundle({ ...base, producer: { capability: "database", at: "2026-11-25T08:00:00Z" } });
  assert.throws(() => validateBundle({ ...base, producer: { capability: "database", at: "yesterday" } }), /producer/);
  assert.throws(() => validateBundle({ ...base, producer: { capability: "database", at: "2026-11-25T08:00:00Z", by: "x" } }), /producer/);
  assert.throws(() => validateBundle({ ...base, project: { repository: "r", revision: "main" } }), /Repository snapshot/);
  assert.throws(() => validateBundle({ ...base, extra: 1 }), /Invalid bundle shape/);
});
