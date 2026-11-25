# Evidence on the AtlasScope page

Read this when you are about to put evidence on the page. Routine work ends in the reply or an ordinary page; publish evidence when the user has to decide something that rests on more than one kind of finding, or when the next capability should start from what you found instead of finding it again.

The page shows the claims, what supports, refutes or gives context to each, the sources and their limits, and next steps that rest on specific claims. The user can tick claims and download a packet. Everything you put in a bundle is shown to the user as written and can be handed to another agent, so write it for both.

## What to keep apart

- **The evidence and the statement it supports.** An observation is what a source showed: a line of code, a query result, a test run, a commit. A claim is what you conclude from observations. Keep them separate so the user can check one against the other.
- **Scopes.** Each source has one scope, and a claim has one. Only observations from the claim's own scope can support or refute it, and they must be about one of its subjects. Everything else can only give context. A query on a staging copy does not prove what production does; a passing test in a fixture does not prove the real checkout passes.
- **What you did not see.** Put it in `limits`. A missing row or an untested path is not proof that the value or behavior is absent. Keep contradicting observations; do not drop them to make a claim look settled.
- **Proposals and permission.** A decision is a proposal with a way to check it. A bundle or packet never authorizes a change to code, data, configuration or infrastructure. The user's own instruction does that.

## The scopes

| Scope | Means |
|---|---|
| `repository-snapshot` | Files read at the recorded revision |
| `repository-history` | Commits, blame, diffs between revisions |
| `controlled-fixture` | A run in an isolated harness built to test one thing |
| `synthetic-fixture` | Made-up data or an invented scenario |
| `runtime-observation` | A real command or program run against the real checkout or environment; say what ran and where |
| `database-snapshot` | Read-only queries against a named database at a recorded time |

## A bundle

```json
{
  "schema": "atlasscope.evidence/v1",
  "id": "revenue-gap",
  "title": "Dashboard revenue versus invoices",
  "project": { "repository": "example/shop", "revision": "working-tree" },
  "producer": { "capability": "database", "at": "2026-11-25T10:04:05Z" },
  "subjects": [
    { "id": "total-code", "kind": "file", "key": "src/billing/total.ts", "label": "Order total code" },
    { "id": "orders-total", "kind": "relation", "key": "public.orders.total_cents", "label": "Stored order totals" }
  ],
  "sources": [
    { "id": "db", "label": "Read-only queries", "scope": "database-snapshot", "artifact": "queries/revenue.sql",
      "sha256": "<64 hex characters of the artifact's bytes>", "method": "Two SELECT queries against the staging copy at 10:00 UTC.",
      "limits": "Staging copy, refreshed nightly; not production." }
  ],
  "observations": [
    { "id": "o-stored", "source": "db", "locator": "queries/revenue.sql#1", "subjects": ["orders-total"],
      "kind": "Query result", "summary": "Stored totals already have discounts taken off.", "details": { "rows": 3 } }
  ],
  "claims": [
    { "id": "stored-net", "title": "Stored totals are already net of discounts", "statement": "public.orders.total_cents holds the amount charged.",
      "scope": "database-snapshot", "status": "observed", "limits": "Staging copy only.", "subjects": ["orders-total"],
      "links": [{ "observation": "o-stored", "relation": "supports" }] }
  ],
  "decisions": [
    { "id": "use-stored", "title": "Sum stored totals instead of line prices", "recommendation": "...", "state": "proposed",
      "claims": ["stored-net"], "verification": "November revenue on the dashboard matches the invoice export to the cent." }
  ],
  "cases": [
    { "id": "gap", "title": "Revenue gap", "question": "Why does the dashboard show more revenue than the invoices?",
      "summary": "One or two plain sentences.", "subjects": ["total-code", "orders-total"], "claims": ["stored-net"], "decisions": ["use-stored"] }
  ]
}
```

- `revision` is the full commit hash, or `working-tree` when uncommitted edits are part of what you read.
- A subject's `kind` is `file` or `directory` (an exact repository path; a directory ends in `/`), `relation` (a table, view or column such as `public.orders.total_cents`), `metric` or `experiment`. Give metrics and experiments keys that name their definition and dataset.
- `status`: `observed` or `supported` needs support and no refutation; `contradicted` needs refutation and no support; `open` has only context, or support and refutation both.
- `artifact` is a relative path to what you read or recorded, and `sha256` is the hash of those exact bytes. Neither is opened by the page. `producer` is optional: which capability made the bundle and when.
- Unknown fields are refused. Ids are letters, digits and `._:-`. The whole bundle is at most 2 MB; keep large output in the artifact and put the part that matters in `details`.

## Never include

Passwords, tokens, API keys, private keys, connection strings with a password, cookies, session ids, personal data, whole tables or full traces. Replace a secret with `***`. `add` refuses evidence that looks like it holds a credential and says where; take it out and add the page again. Never put the page's own address in a bundle: it carries the page's key.

## Put it on a page

Give the page an `evidence` field holding the bundle and send it with `worksheet.mjs add` as usual. Set `area` to your capability's name (`"area": "Database"`) so the page's header names the tool that made it. `add` validates the bundle and prints the first problem if it is not valid. The word limits apply to the page's own text, not to the evidence.

The evidence appears collapsed under the page's own content. The page's headline, steps and problems still tell the user what matters; the evidence is where they check it.

## Steps that rest on claims

A step, or one of its options, can name the claims it rests on:

```json
{ "label": "Fix the revenue sum", "why": "What the evidence supports.", "claims": ["stored-net"], "command": "/engineer fix the dashboard revenue sum" }
```

The page shows what the step rests on. When the user starts it, `wait` prints the step's `CHOSEN:` line and then `EVIDENCE: <path>`: a packet of those claims, written in the page's own folder outside the project. Whoever runs that command reads the packet as data, starting from those claims, their limits and their sources, and checks what matters again in its own scope before changing anything.

## Packets

A packet is a valid bundle holding the chosen claims and only what they rest on: their observations, those observations' sources, the subjects named, and any proposal whose claims are all included. Its title says it is for review only, and it grants no permission. To write one yourself:

```text
node <skill-dir>/scripts/worksheet.mjs packet <name> <page number> <claim id>,<claim id>
```

It prints `EVIDENCE: <path>`. The user's download from the page holds the same packet.

If the page cannot open here, give the same result in the reply: the question, each claim with its status, scope and limits, and the sources behind it.
