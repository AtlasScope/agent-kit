# Routing cases

`cases.json` holds the requests the routers are tested against: `/design`, `/engineer`, `/database`, and the experience-architecture `diagnose` skill. `node tests/routing/check.mjs` checks the file and that every route it names exists. It does not run an agent. Running the cases is a manual step, described below, and no run has been recorded yet.

## Fields

| Field | Meaning |
|---|---|
| `id` | Stable ID. Never reuse one; retire a case by moving it to a note in this file. |
| `set` | `stable` cases are the regression set. `heldout` cases are not used when editing a router, so they show whether a change generalises. |
| `router` | The router the request is typed to, `diagnose` for a request the diagnose skill should pick up on its own, or `none` for plain talk that must not start a router. |
| `kind` | `clear`, `ambiguous` (the router should ask one question), `missing-dep` (run with and without the optional plugin), `cross-kit` (the router should point to another router), or `negative`. |
| `request` | What the user types. |
| `expect` | Routes that pass. The first is the usual pick. `ask` means asking one question and stopping passes. |
| `without` | Routes that pass when the first pick's plugin is not installed. `say-missing` means the router must say what is missing and stop. Required whenever the first pick does not ship in this repo. |
| `context` | What the agent needs to see, and what the case is testing. |
| `disallowed` | Routes that fail the case even if the agent explains them well. |

Routes are written as the router shows them: a command (`/impeccable critique`), a library ID (`D01`, `PG17`, `M02`), or a design recipe (`recipe:New landing page`).

## Running the cases

1. Start a fresh session in a small test app with only the router's kit installed and no optional plugins (no Impeccable, Interface Design, Trail of Bits, Sepia or Vale).
2. Type each request as written. Record the route the agent picked, from its first line.
3. A case passes when:
   - the route is in `expect`, or in `without` when the first pick's plugin is missing;
   - the route is not in `disallowed`;
   - the first line says why, says whether it edits, only reads or advises, and says nothing runs or ships without a yes;
   - with a plugin missing, the agent says so instead of claiming it ran;
   - for a `negative` case, no router starts.
4. Install the optional plugins the `missing-dep` cases name and run those cases again.
5. Save the run as `tests/routing/results/<yyyy-mm-dd>-<agent>.csv` with the header `id,agent,agent_version,plugins,route,pass,notes`.

When a router changes, run the stable set and the held-out set. If a case passed in the previous run and fails now, keep the old behaviour unless the new one is better for a stated reason, and write that reason in `notes`. After a release, add a few fresh held-out cases written without looking at the router text.
