// A small, made-up investigation used by the evidence tests: why a shop's dashboard shows more revenue than
// its invoices. It uses each kind of thing the contract knows: files, a database relation, a metric, three
// scopes, every claim status, a proposal and a case.
const sha = (c) => c.repeat(64);

export const bundle = () => ({
  schema: "atlasscope.evidence/v1",
  id: "revenue-gap",
  title: "Dashboard revenue versus invoices",
  project: { repository: "example/shop", revision: "working-tree" },
  producer: { capability: "database", at: "2026-11-25T10:04:05Z" },
  subjects: [
    { id: "total-code", kind: "file", key: "src/billing/total.ts", label: "Order total code" },
    { id: "orders-total", kind: "relation", key: "public.orders.total_cents", label: "Stored order totals" },
    { id: "revenue", kind: "metric", key: "dashboard.revenue.monthly", label: "Dashboard revenue" },
  ],
  sources: [
    { id: "code", label: "Billing code read", scope: "repository-snapshot", artifact: "src/billing/total.ts", sha256: sha("a"), method: "Read the file at the working tree.", limits: "Only this file was read." },
    { id: "db", label: "Read-only queries", scope: "database-snapshot", artifact: "queries/revenue.sql", sha256: sha("b"), method: "Two SELECT queries against the staging copy at 10:00 UTC.", limits: "Staging copy, refreshed nightly; not production." },
    { id: "run", label: "Invoice test run", scope: "runtime-observation", artifact: "logs/invoice-test.txt", sha256: sha("c"), method: "Ran npm test -- invoice in the checkout.", limits: "One run on one machine." },
  ],
  observations: [
    { id: "o-sum", source: "code", locator: "src/billing/total.ts:41", subjects: ["total-code", "revenue"], kind: "Source line", summary: "The dashboard adds line prices before discounts.", details: { line: 41, text: "lines.reduce((t, l) => t + l.price, 0)" } },
    { id: "o-stored", source: "db", locator: "queries/revenue.sql#1", subjects: ["orders-total"], kind: "Query result", summary: "Stored totals already have discounts taken off.", details: { rows: 3, sample: [{ id: 7, total_cents: 1800, discount_cents: 200 }] } },
    { id: "o-test", source: "run", locator: "logs/invoice-test.txt:12", subjects: ["total-code"], kind: "Test failure", summary: "The invoice test fails: expected 1800, got 2000.", details: { exit: 1 } },
    { id: "o-refunds", source: "db", locator: "queries/revenue.sql#2", subjects: ["orders-total", "revenue"], kind: "Query result", summary: "Refunds are stored as separate rows.", details: {} },
  ],
  claims: [
    { id: "pre-discount", title: "The dashboard sums prices before discounts", statement: "Revenue on the dashboard is computed from line prices, so discounts are never taken off.", scope: "repository-snapshot", status: "supported", limits: "Read from code; not yet seen on a running dashboard.", subjects: ["total-code", "revenue"], links: [{ observation: "o-sum", relation: "supports" }, { observation: "o-stored", relation: "context" }] },
    { id: "stored-net", title: "Stored totals are already net of discounts", statement: "public.orders.total_cents holds the amount charged.", scope: "database-snapshot", status: "observed", limits: "Staging copy only.", subjects: ["orders-total"], links: [{ observation: "o-stored", relation: "supports" }] },
    { id: "test-passes", title: "The invoice test passes today", statement: "The existing invoice test covers discounts and passes.", scope: "runtime-observation", status: "contradicted", limits: "One run.", subjects: ["total-code"], links: [{ observation: "o-test", relation: "refutes" }] },
    { id: "refunds", title: "Refunds may be counted twice", statement: "Refund rows might be added to revenue as well as subtracted.", scope: "database-snapshot", status: "open", limits: "Not checked against the dashboard query.", subjects: ["revenue"], links: [{ observation: "o-refunds", relation: "context" }] },
  ],
  decisions: [
    { id: "use-stored", title: "Sum stored totals instead of line prices", recommendation: "Compute dashboard revenue from public.orders.total_cents.", state: "proposed", claims: ["pre-discount", "stored-net"], verification: "November revenue on the dashboard matches the invoice export to the cent." },
  ],
  cases: [
    { id: "gap", title: "Revenue gap", question: "Why does the dashboard show more revenue than the invoices?", summary: "The dashboard ignores discounts that the stored totals already include.", subjects: ["total-code", "orders-total", "revenue"], claims: ["pre-discount", "stored-net", "test-passes", "refunds"], decisions: ["use-stored"] },
  ],
});

/** A page that carries the bundle, with a step resting on two claims and a step resting on none. */
export const evidencePage = (over = {}) => ({
  tab: "Revenue gap",
  title: "Database: revenue gap",
  area: "Database",
  verdict: "The dashboard counts revenue before discounts.",
  evidence: bundle(),
  steps: [
    { label: "Fix the revenue sum", why: "The proposal the evidence supports.", suggested: true, claims: ["pre-discount", "stored-net"], command: "/engineer fix the dashboard revenue sum" },
    { label: "Check refunds", why: "Still open.", options: [{ label: "Query refunds", why: "Reads only.", command: "/database check refunds", claims: ["refunds"] }, { label: "Ask finance", why: "No data needed.", command: "/engineer draft a question for finance" }] },
  ],
  ...over,
});
