// PostgreSQL behavior the skill relies on, checked on a real server. Skips unless AGENT_KIT_PG_URL is set.
//
// AGENT_KIT_PG_URL must point at a DISPOSABLE database. The tests create a schema and a role named
// agent_kit_t_<random>, fill them with synthetic rows, and drop both at the end. The connecting role needs to
// create schemas and roles (a local superuser is simplest). psql comes from PATH or AGENT_KIT_PSQL.
//
//   AGENT_KIT_PG_URL=postgres://postgres@127.0.0.1:5432/scratch node --test "kits/engineering-kit/plugins/engineering-kit/skills/database/tests/*.test.mjs"
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { readOnlyScript, ident, literal } from "../scripts/sql.mjs";
import { connectionEnv, parseOutput, runPlan } from "../scripts/run.mjs";

const URL_ = process.env.AGENT_KIT_PG_URL;
const PSQL = process.env.AGENT_KIT_PSQL || "psql";
const hasPsql = () => { try { execFileSync(PSQL, ["--version"], { stdio: "ignore" }); return true; } catch { return false; } };
const skip = !URL_ ? "AGENT_KIT_PG_URL is not set (point it at a disposable database to run these)" : !hasPsql() ? `psql not found (${PSQL})` : false;

const tag = `agent_kit_t_${crypto.randomBytes(4).toString("hex")}`;
const S = ident(tag), READER = ident(`${tag}_reader`);
const env = () => ({ ...process.env, ...connectionEnv(URL_) });
const psql = (text) => {
  try { return execFileSync(PSQL, ["-X", "-A", "-t", "-q", "-w", "-c", text], { env: env(), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim(); }
  catch (e) { throw new Error(String(e.stderr || e.message).trim()); }
};
const lastLine = (text) => text.split("\n").at(-1);
const run = (plan) => runPlan(plan, { psql: PSQL, url: URL_ });
// The same read-only script, run after SET ROLE, to see what a less privileged role sees.
const runAs = (role, plan) => {
  const { script, limits } = readOnlyScript(plan);
  return parseOutput(psql(`SET ROLE ${role};\n${script}`), limits.rowCap).results;
};
const one = (results, name) => results[name].rows[0];
const count = (sql) => Number(lastLine(psql(sql)));

describe("PostgreSQL behavior", { skip }, () => {
  before(() => {
    psql(`CREATE SCHEMA ${S};
CREATE ROLE ${READER} NOLOGIN;
GRANT ${READER} TO CURRENT_USER;
GRANT USAGE ON SCHEMA ${S} TO ${READER};
CREATE TABLE ${S}.accounts (id text PRIMARY KEY, name text NOT NULL);
CREATE TABLE ${S}.tags (account_id text NOT NULL REFERENCES ${S}.accounts, tag text NOT NULL, PRIMARY KEY (account_id, tag));
CREATE TABLE ${S}.balances (account_id text PRIMARY KEY REFERENCES ${S}.accounts, amount bigint NOT NULL);
CREATE TABLE ${S}.ledger (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, account_id text NOT NULL, period date NOT NULL, known_at timestamptz, amount bigint NOT NULL);
CREATE UNIQUE INDEX ledger_version ON ${S}.ledger (account_id, period, known_at, amount);
CREATE TABLE ${S}.events (at timestamptz);
CREATE TABLE ${S}.audit (at timestamptz DEFAULT clock_timestamp(), what text);
CREATE SEQUENCE ${S}.seq;
CREATE FUNCTION ${S}.touch() RETURNS int LANGUAGE plpgsql VOLATILE AS $$ BEGIN INSERT INTO ${S}.audit (what) VALUES ('touched'); RETURN 1; END $$;
CREATE TABLE ${S}.tenant_rows (id int PRIMARY KEY, tenant text NOT NULL, amount bigint NOT NULL);
ALTER TABLE ${S}.tenant_rows ENABLE ROW LEVEL SECURITY;
CREATE POLICY north_only ON ${S}.tenant_rows FOR SELECT TO ${READER} USING (tenant = 'north');
GRANT SELECT ON ${S}.tenant_rows TO ${READER};
CREATE VIEW ${S}.tenant_rows_view AS SELECT * FROM ${S}.tenant_rows;
CREATE VIEW ${S}.tenant_rows_invoker WITH (security_invoker = true) AS SELECT * FROM ${S}.tenant_rows;
GRANT SELECT ON ${S}.tenant_rows_view, ${S}.tenant_rows_invoker TO ${READER};
CREATE TABLE ${S}.secret (id int);
INSERT INTO ${S}.accounts VALUES ('A01','Harbor'),('A02','Juniper'),('A03','Meridian'),('A04','North'),('A05','Orchard'),('A06','Pine'),('A07','Ridge'),('A08','Summit');
INSERT INTO ${S}.tags VALUES ('A01','Core'),('A02','Core'),('A02','Income'),('A03','Income'),('A04','Core'),('A05','Core'),('A06','Income'),('A08','Core');
INSERT INTO ${S}.balances VALUES ('A01',125000),('A02',87500),('A03',225000),('A04',0),('A05',43000),('A06',64000),('A07',52000),('A08',100000);
INSERT INTO ${S}.ledger (account_id, period, known_at, amount) VALUES
  ('A01','2026-10-31','2026-11-04 09:00Z',125000),
  ('A03','2026-10-31','2026-11-04 09:00Z',240000),
  ('A03','2026-10-31','2026-11-12 10:00Z',225000),
  ('A06','2026-10-31','2026-11-05 16:30Z',64000),
  ('A08','2026-10-31','2026-11-04 09:00Z',100000),
  ('A08','2026-10-31','2026-11-04 09:00Z',100100),
  ('A01','2026-09-30','2026-10-03 09:00Z',120000);
INSERT INTO ${S}.events VALUES ('2026-11-01 10:00Z'),('2026-11-01 11:00Z'),('2026-11-03 09:00Z'),(NULL);
INSERT INTO ${S}.tenant_rows VALUES (1,'north',10),(2,'north',20),(3,'south',30),(4,'south',40);`);
  });

  after(() => {
    try { psql(`DROP SCHEMA IF EXISTS ${S} CASCADE`); } finally { psql(`DROP OWNED BY ${READER}; DROP ROLE IF EXISTS ${READER}`); }
  });

  test("fan-out: the tag join drops one account and doubles another while the row count looks right", () => {
    const r = run({ queries: [{ name: "tags", builder: "fanout", left: `${tag}.balances`, leftKey: ["account_id"], right: `${tag}.tags`, rightKey: ["account_id"], measure: "amount" }] }).results;
    assert.deepEqual(one(r, "tags"), { left_rows: 8, left_rows_without_match: 1, left_rows_with_one_match: 6, left_rows_with_many_matches: 1, inner_join_rows: 8, left_join_rows: 9, max_matches: 2, measure_on_left: 696500, measure_after_inner_join: 732000, measure_after_left_join: 784000, measure_dropped_by_inner_join: 52000, measure_added_by_duplication: 87500 });
    assert.deepEqual(r.tags_examples.rows, [{ account_id: "A02", matches: 2 }, { account_id: "A07", matches: 0 }]);
    // Independent check: the join itself, written by hand.
    assert.equal(count(`SELECT sum(b.amount) FROM ${S}.balances b JOIN ${S}.tags t ON t.account_id = b.account_id`), 732000);
  });

  test("grain: tags is one row per account and tag, not per account", () => {
    const r = run({ queries: [{ name: "g", builder: "grain", table: `${tag}.tags`, key: ["account_id"] }] }).results;
    assert.deepEqual(one(r, "g"), { key_values: 7, rows: 8, duplicated_key_values: 1, rows_in_duplicated_keys: 2, max_rows_per_key: 2, key_values_with_null: 0 });
    assert.deepEqual(r.g_examples.rows, [{ account_id: "A02", rows: 2 }]);
  });

  test("as-of: a date-only cutoff stops at midnight, later corrections stay out, same-time versions are not picked silently", () => {
    const base = { name: "v", builder: "asOf", table: `${tag}.ledger`, key: ["account_id"], known: "known_at", filter: { period: "2026-10-31" } };
    const inclusive = run({ queries: [{ ...base, cutoff: "2026-11-05" }] }).results;
    assert.deepEqual(one(inclusive, "v_summary"), { keys: 4, keys_known_by_cutoff: 3, keys_with_unresolved_ties: 1, versions_known_after_cutoff: 2, versions_without_known_time: 0, known_type: "timestamp with time zone", cutoff: "2026-11-05", cutoff_bound: "inclusive" });
    const a08 = inclusive.v.rows.filter((row) => row.account_id === "A08");
    assert.deepEqual(a08.map((row) => [row.amount, row.versions_at_that_time]).sort(), [[100000, 2], [100100, 2]]);
    assert.equal(inclusive.v.rows.find((row) => row.account_id === "A03").amount, 240000);

    const endOfDay = run({ queries: [{ ...base, cutoff: "2026-11-06", inclusive: false, tiebreak: ["id"] }] }).results;
    assert.deepEqual([one(endOfDay, "v_summary").keys_known_by_cutoff, one(endOfDay, "v_summary").keys_with_unresolved_ties, one(endOfDay, "v_summary").versions_known_after_cutoff], [4, 0, 1]);
    const settled = endOfDay.v.rows.filter((row) => row.account_id === "A08");
    assert.deepEqual(settled.map((row) => [row.amount, row.versions_at_that_time]), [[100100, 2]], "the tiebreak picks one, and the tie it settled stays visible");

    // A cutoff without a zone is read in the plan's time zone: 11:00 is 11:00 UTC by default, 17:00 UTC in Chicago.
    const utc = run({ queries: [{ ...base, cutoff: "2026-11-05 11:00" }] }).results;
    const chicago = run({ timeZone: "America/Chicago", queries: [{ ...base, cutoff: "2026-11-05 11:00" }] }).results;
    assert.deepEqual([one(utc, "v_summary").keys_known_by_cutoff, one(chicago, "v_summary").keys_known_by_cutoff], [3, 4]);
  });

  test("READ ONLY stops writes inside the transaction, including writes hidden in a function", () => {
    const before = count(`SELECT count(*) FROM ${S}.audit`);
    assert.throws(() => run({ queries: [{ name: "w", sql: `SELECT ${tag}.touch() AS wrote` }] }), /cannot execute INSERT in a read-only transaction/);
    assert.throws(() => run({ queries: [{ name: "l", sql: `SELECT * FROM ${tag}.accounts FOR UPDATE` }] }), /cannot execute SELECT FOR UPDATE in a read-only transaction/);
    assert.throws(() => run({ queries: [{ name: "n", sql: `SELECT nextval('${tag}.seq') AS n` }] }), /cannot execute nextval\(\) in a read-only transaction/);
    assert.equal(count(`SELECT count(*) FROM ${S}.audit`), before);
    // Outside a read-only transaction the same SELECT writes, and the write is kept.
    psql(`SELECT ${S}.touch()`);
    assert.equal(count(`SELECT count(*) FROM ${S}.audit`), before + 1);
  });

  test("EXPLAIN ANALYZE runs the statement; plain EXPLAIN does not; READ ONLY refuses the first", () => {
    const n = () => count(`SELECT count(*) FROM ${S}.audit`);
    const start = n();
    psql(`EXPLAIN INSERT INTO ${S}.audit (what) VALUES ('plain explain')`);
    assert.equal(n(), start);
    psql(`EXPLAIN ANALYZE INSERT INTO ${S}.audit (what) VALUES ('explain analyze')`);
    assert.equal(n(), start + 1);
    psql(`EXPLAIN ANALYZE SELECT ${S}.touch()`);
    assert.equal(n(), start + 2, "EXPLAIN ANALYZE of a SELECT runs the functions it calls");
    assert.throws(() => psql(`BEGIN READ ONLY; EXPLAIN ANALYZE INSERT INTO ${S}.audit (what) VALUES ('blocked'); ROLLBACK;`), /read-only transaction/);
    assert.equal(n(), start + 2);
  });

  test("statement_timeout and lock_timeout set by the script apply to its query", async () => {
    const t0 = Date.now();
    assert.throws(() => run({ statementTimeoutMs: 300, queries: [{ name: "slow", sql: "SELECT pg_sleep(5) AS slept" }] }), /statement timeout/);
    assert.ok(Date.now() - t0 < 4000);
    const holder = spawn(PSQL, ["-X", "-A", "-t", "-q", "-w", "-c", `BEGIN; LOCK TABLE ${S}.accounts IN ACCESS EXCLUSIVE MODE; SELECT pg_sleep(4); COMMIT;`], { env: env(), stdio: "ignore" });
    const exited = new Promise((resolve) => holder.on("exit", resolve));
    try {
      const deadline = Date.now() + 5000;
      while (count(`SELECT count(*) FROM pg_locks WHERE relation = '${S}.accounts'::regclass AND mode = 'AccessExclusiveLock' AND granted`) !== 1) {
        if (Date.now() > deadline) throw new Error("the lock holder never got its lock");
        await new Promise((r) => setTimeout(r, 100));
      }
      assert.throws(() => run({ lockTimeoutMs: 200, queries: [{ name: "blocked", sql: `SELECT count(*) AS n FROM ${tag}.accounts` }] }), /lock timeout/);
    } finally { holder.kill(); await exited; }
  });

  test("row security: a restricted role sees fewer rows, and row_security off turns silent filtering into an error", () => {
    const plan = (extra = {}) => ({ ...extra, queries: [{ name: "n", sql: `SELECT count(*) AS n FROM ${tag}.tenant_rows` }, { name: "vis", builder: "visibility", table: `${tag}.tenant_rows` }] });
    const owner = run(plan()).results;
    assert.equal(one(owner, "n").n, 4);
    const reader = runAs(READER, plan());
    assert.equal(one(reader, "n").n, 2);
    const vis = one(reader, "vis");
    assert.equal(vis.row_security, true);
    assert.equal(vis.can_select, true);
    assert.equal(vis.superuser, false);
    assert.equal(vis.policies.length, 1);
    assert.match(vis.reading, /filters this role/);
    assert.throws(() => runAs(READER, plan({ rowSecurity: "off" })), /row-level security/);
    assert.equal(one(run(plan({ rowSecurity: "off" })).results, "n").n, 4, "a role that bypasses row security is not stopped by row_security off");
    // A view runs with its owner's rights unless security_invoker is set, so the reader sees every row through it.
    const views = runAs(READER, { queries: [{ name: "plain", sql: `SELECT count(*) AS n FROM ${tag}.tenant_rows_view` }, { name: "invoker", sql: `SELECT count(*) AS n FROM ${tag}.tenant_rows_invoker` }] });
    assert.deepEqual([one(views, "plain").n, one(views, "invoker").n], [4, 2]);
    // No privilege is an error, never an empty result.
    assert.throws(() => runAs(READER, { queries: [{ name: "s", sql: `SELECT count(*) AS n FROM ${tag}.secret` }] }), /permission denied/);
  });

  test("catalog builders: keys and foreign keys, coverage with empty periods, functions that write", () => {
    const r = run({ queries: [{ name: "rel", builder: "relationships", schema: tag }, { name: "cov", builder: "coverage", table: `${tag}.events`, column: "at", unit: "day" }, { name: "fn", builder: "functions", schema: tag }] }).results;
    const tagsFk = r.rel.rows.find((row) => row.relation === `${tag}.tags` && row.key_type === "foreign key");
    assert.deepEqual([tagsFk.key_columns, tagsFk.references_relation, tagsFk.references_columns], [["account_id"], `${tag}.accounts`, ["id"]]);
    const version = r.rel.rows.find((row) => row.key_name === "ledger_version");
    assert.deepEqual([version.key_type, version.key_columns], ["unique index", ["account_id", "period", "known_at", "amount"]]);
    assert.equal(r.rel.rows.find((row) => row.relation === `${tag}.tenant_rows`).row_security, true);
    assert.deepEqual([one(r, "cov").rows, one(r, "cov").rows_without_value, one(r, "cov").column_type], [4, 1, "timestamp with time zone"]);
    assert.deepEqual(r.cov_periods.rows.map((p) => p.rows), [2, 0, 1], "the empty day is shown, not skipped");
    assert.deepEqual(r.fn.rows.map((f) => [f.function, f.volatility, f.mentions_effects]), [[`${tag}.touch`, "volatile", true]]);
  });

  test("effects outside the transaction survive READ ONLY and ROLLBACK", (t) => {
    const key = 900000 + Math.floor(Math.random() * 99999);
    const held = psql(`BEGIN READ ONLY; SELECT pg_advisory_lock(${key}); ROLLBACK; SELECT count(*) FROM pg_locks WHERE locktype = 'advisory' AND objid = ${key} AND pid = pg_backend_pid();`);
    assert.equal(lastLine(held), "1", "a session-level advisory lock taken in a read-only transaction outlives the rollback");
    const installed = count("SELECT count(*) FROM pg_extension WHERE extname = 'dblink'");
    if (installed) return t.skip("dblink is already installed in this database; not touching it");
    try { psql(`CREATE EXTENSION dblink SCHEMA ${S}`); } catch (e) { return t.skip(`dblink is not available: ${e.message.split("\n")[0]}`); }
    const c = connectionEnv(URL_), conn = Object.entries({ host: c.PGHOST, port: c.PGPORT, user: c.PGUSER, password: c.PGPASSWORD, dbname: c.PGDATABASE }).filter(([, v]) => v).map(([k, v]) => `${k}='${v.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`).join(" ");
    const before = count(`SELECT count(*) FROM ${S}.audit`);
    try {
      const r = run({ queries: [{ name: "x", sql: `SELECT ${tag}.dblink_exec(${literal(conn)}, ${literal(`INSERT INTO ${S}.audit (what) VALUES ('through dblink')`)}) AS status` }] }).results;
      assert.equal(one(r, "x").status, "INSERT 0 1");
    } catch (e) {
      if (/password|authentication|connection/i.test(e.message)) return t.skip(`dblink could not connect back: ${e.message.split("\n")[0]}`);
      throw e;
    }
    assert.equal(count(`SELECT count(*) FROM ${S}.audit`), before + 1, "the write landed through another connection; READ ONLY did not stop it");
  });
});
