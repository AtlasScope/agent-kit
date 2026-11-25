// Reviewed read-only SQL for a PostgreSQL investigation. This module only builds text; it connects to nothing.
//
// A plan is a list of named queries. They run as ONE statement inside a READ ONLY transaction, so every
// result comes from the same snapshot, with a statement timeout, a lock timeout and a row cap. Builders take
// identifiers and literal values only, never SQL fragments; anything else goes in a query you write yourself
// ({ "name", "sql" }), which must be a single SELECT, WITH, VALUES or TABLE statement.
//
// READ ONLY stops SQL writes in this database, including writes made inside functions. It does not stop
// effects outside the transaction: writes through dblink into another connection, session-level advisory
// locks, cancelling other sessions' queries. Check the functions a query calls (the `functions` builder lists
// them) before running it anywhere that matters.

export const DEFAULTS = Object.freeze({ statementTimeoutMs: 15000, lockTimeoutMs: 2000, rowCap: 500, timeZone: "UTC", rowSecurity: "on" });
const MAX_QUERIES = 20;
const UNITS = ["hour", "day", "week", "month", "quarter", "year"];

const fail = (message) => { throw new Error(message); };

/** A double-quoted identifier. Rejects names PostgreSQL would silently truncate. */
export function ident(name) {
  if (typeof name !== "string" || !name || name.includes("\0")) fail(`Invalid identifier: ${JSON.stringify(name)}`);
  if (Buffer.byteLength(name, "utf8") > 63) fail(`Identifier longer than 63 bytes would be truncated: ${name.slice(0, 40)}...`);
  return `"${name.replace(/"/g, '""')}"`;
}

/** A schema-qualified relation: "schema.table", or ["schema", "table"] when a name holds a dot. */
export function relation(name) {
  const parts = Array.isArray(name) ? name : typeof name === "string" ? name.split(".") : [];
  if (parts.length !== 2) fail(`Name the schema and relation, like "public.orders" (got ${JSON.stringify(name)})`);
  return parts.map(ident).join(".");
}

/** A literal value. Strings with a backslash become E'' strings, which read the same whatever standard_conforming_strings says. */
export function literal(value) {
  if (value === null) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") { if (!Number.isFinite(value)) fail(`Invalid number: ${value}`); return String(value); }
  if (typeof value !== "string" || value.includes("\0")) fail(`Invalid literal: ${JSON.stringify(value)}`);
  const quoted = value.replace(/'/g, "''");
  return value.includes("\\") ? `E'${quoted.replace(/\\/g, "\\\\")}'` : `'${quoted}'`;
}

const columns = (cols, what) => {
  const list = Array.isArray(cols) ? cols : typeof cols === "string" ? [cols] : [];
  if (!list.length) fail(`${what}: give at least one column`);
  return list.map(ident);
};

/**
 * Returns the statement with trailing semicolons removed, or throws. Not a security boundary (the READ ONLY
 * transaction is); it refuses a second statement, a psql backslash command and anything that is not a query,
 * so mistakes fail before they reach the database. Quotes, dollar quotes and comments are skipped correctly.
 */
export function checkQuery(sql) {
  if (typeof sql !== "string" || sql.includes("\0")) fail("A query must be text");
  const text = sql.replace(/[\s;]+$/, "");
  let i = 0, depth = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i], next = text[i + 1];
    if (c === "-" && next === "-") { while (i < n && text[i] !== "\n") i++; continue; }
    if (c === "/" && next === "*") {
      let level = 1; i += 2;
      while (i < n && level) { if (text[i] === "/" && text[i + 1] === "*") { level++; i += 2; } else if (text[i] === "*" && text[i + 1] === "/") { level--; i += 2; } else i++; }
      if (level) fail("Unclosed comment");
      continue;
    }
    if (c === "'") {
      const escapes = /[eE]/.test(text[i - 1] || "") && !/[\w$]/.test(text[i - 2] || "");
      i++;
      while (i < n) { if (escapes && text[i] === "\\") { i += 2; continue; } if (text[i] === "'") { if (text[i + 1] === "'") { i += 2; continue; } break; } i++; }
      if (i >= n) fail("Unclosed string literal");
      i++; continue;
    }
    if (c === '"') { i++; while (i < n) { if (text[i] === '"') { if (text[i + 1] === '"') { i += 2; continue; } break; } i++; } if (i >= n) fail("Unclosed quoted identifier"); i++; continue; }
    if (c === "$" && !/[\w$]/.test(text[i - 1] || "")) {
      const tag = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(text.slice(i));
      if (tag) { const end = text.indexOf(tag[0], i + tag[0].length); if (end < 0) fail("Unclosed dollar-quoted string"); i = end + tag[0].length; continue; }
    }
    if (c === ";") fail("One statement only: remove the semicolon in the middle of the query");
    if (c === "\\") fail("Backslash outside a string: psql would read it as a command");
    if (c === "(") depth++;
    if (c === ")") { depth--; if (depth < 0) fail("Unbalanced parentheses"); }
    i++;
  }
  if (depth) fail("Unbalanced parentheses");
  const first = text.replace(/^(\s|--[^\n]*\n|\/\*[\s\S]*?\*\/|\()+/, "").match(/^[A-Za-z]+/);
  if (!first || !["select", "with", "values", "table"].includes(first[0].toLowerCase())) fail("Only a SELECT, WITH, VALUES or TABLE query can run here");
  return text;
}

// Each builder returns [{ name, sql }]. A second query, "<name>_examples", holds example keys.
const where = (filter = {}, alias = "") => {
  if (filter === null || typeof filter !== "object" || Array.isArray(filter)) fail("filter must be an object of column: value");
  const p = alias ? `${alias}.` : "";
  return Object.entries(filter).map(([col, value]) => (value === null ? `${p}${ident(col)} IS NULL` : `${p}${ident(col)} = ${literal(value)}`));
};

export const BUILDERS = {
  /** Tables and views in a schema with their keys, foreign keys, row estimates and row-security flags. */
  relationships({ name, schema = "public" }) {
    return [{ name, sql: `WITH keys AS (
  SELECT k.conrelid AS relid, CASE k.contype WHEN 'p' THEN 'primary key' WHEN 'u' THEN 'unique' ELSE 'foreign key' END AS key_type,
         k.conname::text AS key_name, k.conkey AS cols, k.confrelid AS ref_relid, k.confkey AS ref_cols, NULL::text AS partial_where
  FROM pg_constraint k WHERE k.contype IN ('p', 'u', 'f')
  UNION ALL
  SELECT i.indrelid, 'unique index', ic.relname::text,
         (SELECT array_agg(x.num ORDER BY x.ord) FROM unnest(i.indkey::int2[]) WITH ORDINALITY x(num, ord) WHERE x.ord <= i.indnkeyatts), -- key columns only, not INCLUDE
         NULL, NULL, pg_get_expr(i.indpred, i.indrelid)
  FROM pg_index i JOIN pg_class ic ON ic.oid = i.indexrelid
  WHERE i.indisunique AND NOT EXISTS (SELECT 1 FROM pg_constraint k WHERE k.conindid = i.indexrelid)
)
SELECT n.nspname || '.' || c.relname AS relation,
       CASE c.relkind WHEN 'r' THEN 'table' WHEN 'p' THEN 'partitioned table' WHEN 'v' THEN 'view' WHEN 'm' THEN 'materialized view' ELSE 'foreign table' END AS kind,
       c.reltuples::bigint AS estimated_rows,
       c.relrowsecurity AS row_security, c.relforcerowsecurity AS force_row_security,
       k.key_type, k.key_name,
       (SELECT array_agg(coalesce(a.attname::text, '(expression)') ORDER BY x.ord) FROM unnest(k.cols) WITH ORDINALITY x(num, ord) LEFT JOIN pg_attribute a ON a.attrelid = k.relid AND a.attnum = x.num) AS key_columns,
       k.partial_where,
       fn.nspname || '.' || fc.relname AS references_relation,
       (SELECT array_agg(a.attname::text ORDER BY x.ord) FROM unnest(k.ref_cols) WITH ORDINALITY x(num, ord) JOIN pg_attribute a ON a.attrelid = k.ref_relid AND a.attnum = x.num) AS references_columns
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN keys k ON k.relid = c.oid
LEFT JOIN pg_class fc ON fc.oid = k.ref_relid
LEFT JOIN pg_namespace fn ON fn.oid = fc.relnamespace
WHERE n.nspname = ${literal(schema)} AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
ORDER BY relation, k.key_type, k.key_name` }];
  },

  /** Whether the given columns identify one row: duplicate and null key counts, and the worst keys. */
  grain({ name, table, key }) {
    const t = relation(table), k = columns(key, "grain key");
    const nullCheck = k.map((c) => `${c} IS NULL`).join(" OR ");
    return [
      { name, sql: `SELECT count(*) AS key_values, coalesce(sum(n), 0) AS rows,
       count(*) FILTER (WHERE n > 1) AS duplicated_key_values,
       coalesce(sum(n) FILTER (WHERE n > 1), 0) AS rows_in_duplicated_keys,
       coalesce(max(n), 0) AS max_rows_per_key,
       count(*) FILTER (WHERE has_null) AS key_values_with_null
FROM (SELECT count(*) AS n, (${nullCheck}) AS has_null FROM ${t} GROUP BY ${k.join(", ")}) AS g` },
      { name: `${name}_examples`, sql: `SELECT ${k.join(", ")}, count(*) AS rows FROM ${t} GROUP BY ${k.join(", ")} HAVING count(*) > 1 ORDER BY count(*) DESC, ${k.join(", ")} LIMIT 20` },
    ];
  },

  /**
   * What joining `left` to `right` on the keys does to left rows: rows dropped by an inner join, rows
   * multiplied, and, with `measure` (a left column), how much of it each effect adds or removes.
   * measure_after_inner_join = measure_on_left - measure_dropped_by_inner_join + measure_added_by_duplication.
   */
  fanout({ name, left, leftKey, right, rightKey, measure }) {
    const l = relation(left), r = relation(right), lk = columns(leftKey, "leftKey"), rk = columns(rightKey, "rightKey");
    if (lk.length !== rk.length) fail("fanout: leftKey and rightKey need the same number of columns");
    const alias = rk.map((_, i) => `"rk_${i + 1}"`);
    const on = lk.map((c, i) => `l.${c} = r.${alias[i]}`).join(" AND ");
    const grouped = `r AS (SELECT ${rk.map((c, i) => `${c} AS ${alias[i]}`).join(", ")}, count(*) AS "rk_rows" FROM ${r} GROUP BY ${rk.join(", ")})`;
    const m = measure ? `l.${ident(measure)}` : null;
    const measures = m ? `,
       sum(measure) AS measure_on_left,
       sum(measure * matches) AS measure_after_inner_join,
       sum(measure * greatest(matches, 1)) AS measure_after_left_join,
       coalesce(sum(measure) FILTER (WHERE matches = 0), 0) AS measure_dropped_by_inner_join,
       coalesce(sum(measure * (matches - 1)) FILTER (WHERE matches > 1), 0) AS measure_added_by_duplication` : "";
    return [
      { name, sql: `WITH ${grouped},
m AS (SELECT coalesce(r."rk_rows", 0) AS matches${m ? `, ${m} AS measure` : ""} FROM ${l} AS l LEFT JOIN r ON ${on})
SELECT count(*) AS left_rows,
       count(*) FILTER (WHERE matches = 0) AS left_rows_without_match,
       count(*) FILTER (WHERE matches = 1) AS left_rows_with_one_match,
       count(*) FILTER (WHERE matches > 1) AS left_rows_with_many_matches,
       coalesce(sum(matches), 0) AS inner_join_rows,
       coalesce(sum(greatest(matches, 1)), 0) AS left_join_rows,
       coalesce(max(matches), 0) AS max_matches${measures}
FROM m` },
      { name: `${name}_examples`, sql: `WITH ${grouped}
SELECT ${lk.map((c) => `l.${c}`).join(", ")}, coalesce(r."rk_rows", 0) AS matches
FROM ${l} AS l LEFT JOIN r ON ${on}
WHERE coalesce(r."rk_rows", 0) <> 1
ORDER BY coalesce(r."rk_rows", 0) = 0, coalesce(r."rk_rows", 0) DESC, ${lk.map((c) => `l.${c}`).join(", ")}
LIMIT 20` },
    ];
  },

  /** First and last values of a time column, rows without one, and rows per period with empty periods shown as 0. */
  coverage({ name, table, column, unit = "day" }) {
    if (!UNITS.includes(unit)) fail(`coverage unit must be one of ${UNITS.join(", ")}`);
    const t = relation(table), c = ident(column);
    return [
      { name, sql: `SELECT min(${c}) AS first_value, max(${c}) AS last_value, count(*) AS rows, count(*) FILTER (WHERE ${c} IS NULL) AS rows_without_value,
       (SELECT format_type(a.atttypid, a.atttypmod) FROM pg_attribute a WHERE a.attrelid = ${literal(t)}::regclass AND a.attname = ${literal(column)}) AS column_type
FROM ${t}` },
      { name: `${name}_periods`, sql: `WITH b AS (SELECT date_trunc(${literal(unit)}, ${c}) AS period, count(*) AS rows FROM ${t} WHERE ${c} IS NOT NULL GROUP BY 1),
s AS (SELECT generate_series(min(period), max(period), ${literal(`1 ${unit}`)}::interval) AS period FROM b)
SELECT s.period, coalesce(b.rows, 0) AS rows FROM s LEFT JOIN b ON b.period = s.period ORDER BY s.period` },
    ];
  },

  /**
   * Each key's version as it was known at `cutoff` (inclusive unless inclusive is false): the latest row by
   * `known`, then by `tiebreak`. Rows that tie on every ordering column all come back rather than one picked
   * silently; versions_at_that_time counts the versions sharing the winner's known time, so a tie the tiebreak
   * settled stays visible. The summary counts keys, unresolved ties, versions known
   * only after the cutoff (later corrections) and rows with no known time, and reports the known column's type:
   * a date-only cutoff compared with a timestamp means midnight at the start of that day, in the plan's time zone.
   */
  asOf({ name, table, key, known, cutoff, inclusive = true, tiebreak = [], filter = {} }) {
    const t = relation(table), k = columns(key, "asOf key"), kn = ident(known);
    if (cutoff === undefined || cutoff === null) fail("asOf: give a cutoff");
    const tb = (Array.isArray(tiebreak) ? tiebreak : [tiebreak]).map(ident);
    const order = [`${kn} DESC`, ...tb.map((c) => `${c} DESC`)].join(", ");
    const before = `${kn} ${inclusive ? "<=" : "<"} ${literal(cutoff)}`;
    const filters = where(filter);
    const scope = filters.length ? filters.join(" AND ") : "TRUE";
    return [
      { name, sql: `SELECT * FROM (
  SELECT t.*, rank() OVER (PARTITION BY ${k.join(", ")} ORDER BY ${order}) AS as_of_rank,
         count(*) OVER (PARTITION BY ${[...k, kn].join(", ")}) AS versions_at_that_time
  FROM ${t} AS t WHERE ${scope} AND ${before}
) AS v WHERE as_of_rank = 1 ORDER BY ${k.join(", ")}` },
      { name: `${name}_summary`, sql: `WITH versions AS (SELECT ${k.join(", ")}, rank() OVER (PARTITION BY ${k.join(", ")} ORDER BY ${order}) AS r FROM ${t} WHERE ${scope} AND ${before}),
winners AS (SELECT ${k.join(", ")}, count(*) AS n FROM versions WHERE r = 1 GROUP BY ${k.join(", ")})
SELECT (SELECT count(*) FROM (SELECT DISTINCT ${k.join(", ")} FROM ${t} WHERE ${scope}) AS d) AS keys,
       (SELECT count(*) FROM winners) AS keys_known_by_cutoff,
       (SELECT count(*) FROM winners WHERE n > 1) AS keys_with_unresolved_ties,
       (SELECT count(*) FROM ${t} WHERE ${scope} AND NOT (${before})) AS versions_known_after_cutoff,
       (SELECT count(*) FROM ${t} WHERE ${scope} AND ${kn} IS NULL) AS versions_without_known_time,
       (SELECT format_type(a.atttypid, a.atttypmod) FROM pg_attribute a WHERE a.attrelid = ${literal(t)}::regclass AND a.attname = ${literal(known)}) AS known_type,
       ${literal(String(cutoff))}::text AS cutoff, ${inclusive ? "'inclusive'" : "'exclusive'"}::text AS cutoff_bound` },
    ];
  },

  /**
   * Whether this role sees every row of a table: privileges, ownership, row security and its policies.
   * To prove filtering for a given query, run it again with "rowSecurity": "off": PostgreSQL then raises an
   * error instead of filtering, and the error is the answer.
   */
  visibility({ name, table }) {
    const t = relation(table);
    return [{ name, sql: `SELECT current_user::text AS role, session_user::text AS session_role,
       r.rolsuper AS superuser, r.rolbypassrls AS bypasses_row_security,
       pg_get_userbyid(c.relowner)::text AS owner, pg_has_role(c.relowner, 'USAGE') AS has_owner_privileges,
       c.relrowsecurity AS row_security, c.relforcerowsecurity AS force_row_security,
       has_table_privilege(c.oid, 'SELECT') AS can_select,
       (SELECT coalesce(json_agg(json_build_object('policy', p.policyname, 'command', p.cmd, 'permissive', p.permissive, 'roles', p.roles, 'using', p.qual) ORDER BY p.policyname), '[]'::json)
          FROM pg_policies p WHERE p.schemaname = n.nspname AND p.tablename = c.relname) AS policies,
       CASE WHEN NOT has_table_privilege(c.oid, 'SELECT') THEN 'No SELECT privilege: queries fail with an error, they do not return fewer rows.'
            WHEN NOT c.relrowsecurity THEN 'Row security is off: anyone who can select sees every row.'
            WHEN r.rolsuper OR r.rolbypassrls THEN 'This role bypasses row security and sees every row.'
            WHEN pg_has_role(c.relowner, 'USAGE') AND NOT c.relforcerowsecurity THEN 'This role has the owner''s privileges and row security is not forced: it sees every row.'
            WHEN NOT EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = n.nspname AND p.tablename = c.relname) THEN 'Row security is on with no policy: this role sees no rows.'
            ELSE 'Row security filters this role: counts are rows visible to this role, not rows that exist.' END AS reading
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace JOIN pg_roles r ON r.rolname = current_user
WHERE c.oid = ${literal(t)}::regclass` }];
  },

  /** Functions that are not IMMUTABLE in a schema, flagging names or bodies that mention a write or an outside effect. Review before a query calls one. */
  functions({ name, schema = "public" }) {
    const effects = literal("(insert|update|delete|merge|truncate|copy|dblink|notify|nextval|setval|advisory|http|lo_import|lo_export|terminate|cancel)");
    return [{ name, sql: `SELECT n.nspname || '.' || p.proname AS function, pg_get_function_identity_arguments(p.oid) AS arguments,
       CASE p.provolatile WHEN 'v' THEN 'volatile' ELSE 'stable' END AS volatility,
       l.lanname::text AS language, p.prosecdef AS security_definer, pg_get_userbyid(p.proowner)::text AS owner,
       (SELECT e.extname::text FROM pg_depend d JOIN pg_extension e ON e.oid = d.refobjid WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e' LIMIT 1) AS extension,
       (p.proname || ' ' || p.prosrc) ~* ${effects} AS mentions_effects
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname = ${literal(schema)} AND p.prokind IN ('f', 'p') AND p.provolatile <> 'i'
ORDER BY 1, 2` }];
  },
};

const NAME = /^[a-z][a-z0-9_]{0,40}$/;
const int = (v, lo, hi, what) => { if (!Number.isInteger(v) || v < lo || v > hi) fail(`${what} must be a whole number from ${lo} to ${hi}`); return v; };

/** Expands a plan's entries into named queries, each checked. */
export function queriesOf(plan) {
  if (!plan || typeof plan !== "object" || !Array.isArray(plan.queries) || !plan.queries.length) fail('A plan needs "queries": [...]');
  const out = [];
  for (const q of plan.queries) {
    if (!q || typeof q !== "object" || !NAME.test(q.name || "")) fail(`Each query needs a name of lowercase letters, digits and _ (got ${JSON.stringify(q?.name)})`);
    if (q.sql !== undefined) { if (q.builder) fail(`${q.name}: give sql or builder, not both`); out.push({ name: q.name, sql: checkQuery(q.sql) }); continue; }
    const build = BUILDERS[q.builder];
    if (!build) fail(`${q.name}: unknown builder ${JSON.stringify(q.builder)}; use one of ${Object.keys(BUILDERS).join(", ")} or give sql`);
    for (const built of build(q)) out.push({ name: built.name, builder: q.builder, sql: checkQuery(built.sql) });
  }
  const names = out.map((q) => q.name);
  const dup = names.find((n, i) => names.indexOf(n) !== i);
  if (dup) fail(`Two queries are named ${dup}`);
  if (out.length > MAX_QUERIES) fail(`At most ${MAX_QUERIES} queries in one plan`);
  return out;
}

/** The plan's limits, defaults filled in and checked. */
export function limitsOf(plan = {}) {
  const l = { ...DEFAULTS, ...Object.fromEntries(Object.entries(plan).filter(([k]) => k in DEFAULTS)) };
  int(l.statementTimeoutMs, 100, 600000, "statementTimeoutMs");
  int(l.lockTimeoutMs, 10, 60000, "lockTimeoutMs");
  int(l.rowCap, 1, 10000, "rowCap");
  if (typeof l.timeZone !== "string" || !/^[A-Za-z0-9_+\-/:]{1,64}$/.test(l.timeZone)) fail("timeZone must be a zone name such as UTC or America/Chicago");
  if (!["on", "off"].includes(l.rowSecurity)) fail('rowSecurity must be "on" or "off"');
  return l;
}

/**
 * The whole script: one READ ONLY transaction, its limits, one SELECT that returns every result as JSON with
 * where and as whom it ran, then ROLLBACK. Each query gets rowCap + 1 rows so a cut-off result is detectable.
 */
export function readOnlyScript(plan) {
  const queries = queriesOf(plan), l = limitsOf(plan);
  const results = queries.map((q) => `    ${literal(q.name)}, (SELECT coalesce(json_agg(r), '[]'::json) FROM (SELECT * FROM (\n${q.sql}\n    ) AS q LIMIT ${l.rowCap + 1}) AS r)`).join(",\n");
  const script = `BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = ${l.statementTimeoutMs};
SET LOCAL lock_timeout = ${l.lockTimeoutMs};
SET LOCAL idle_in_transaction_session_timeout = ${Math.max(l.statementTimeoutMs * 2, 60000)};
SET LOCAL TimeZone = ${literal(l.timeZone)};
SET LOCAL row_security = ${l.rowSecurity};
SELECT json_build_object(
  'ran', json_build_object('database', current_database(), 'role', current_user, 'server', current_setting('server_version'),
    'at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'), 'read_only', current_setting('transaction_read_only'),
    'time_zone', current_setting('TimeZone'), 'row_security', current_setting('row_security')),
  'results', json_build_object(
${results}
  )
)::text AS agent_kit_result;
ROLLBACK;
`;
  return { script, queries, limits: l };
}
