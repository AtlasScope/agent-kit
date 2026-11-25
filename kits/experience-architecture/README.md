# experience-architecture

Source, test fixtures, and validation for the **Experience Architecture** plugin for Claude Code, Codex, and Cursor. The plugin itself is in [`plugins/experience-architecture`](plugins/experience-architecture/README.md), and it ships as part of the `AtlasScope/agent-kit` marketplace.

## Install

See the [plugin README](plugins/experience-architecture/README.md#install) for Claude Code, cloud sessions, Codex, and Cursor. In short:

```bash
claude plugin marketplace add AtlasScope/agent-kit
claude plugin install experience-architecture@agent-kit
```

For development from `kits/experience-architecture/`, `claude --plugin-dir ./plugins/experience-architecture` loads the working copy for one session.

## Layout

| Path | What |
|---|---|
| `plugins/experience-architecture/` | The plugin: manifest, 4 skills (diagnose, rethink, verify, and walkthrough in preview), playbooks and references, the `ea` toolkit, eval suite |
| `fixtures/northwind/` | Next.js App Router app with 20 planted defects (written alongside the toolkit) |
| `fixtures/fernway/` | Vite + React Router app with 18 planted defects (written blind by a separate agent) |
| `fixtures/lumen/` | Next.js App Router (`src/`, parallel and intercepting routes) with 18 planted defects (written blind, held out from tuning) |
| `fixtures/tidewater/` | Vite + React Router app where the right answer is structural: one job split across pages, nav organised by back-office systems, plus decoys that look wrong but are justified (written blind for v0.2) |
| `fixtures/kestrel/` | Next.js clinic app written after v0.2 was frozen: the held-out test (structural problem, a structure to keep, defects, decoys) |
| `fixtures/meridian/` | Large Next.js App Router app (workspaces in the path, three nav systems, parallel routes) with defects, structural problems and decoys (written blind for v0.2) |
| `tests/ground-truth/` | Answer keys for each fixture. Never copy these into a workspace an evaluated agent can read |
| `tests/*.test.mjs` | Toolkit tests (`npm test`) |
| `tests/journeys/`, `tests/proposals/` | Journey, proposal and mapping examples used by the tests |
| `tests/results/` | Recorded validation results |
| `tests/compare/` | Historical comparison prompts and methodology; not an active runner |
| `../../.agents/plugins/marketplace.json`, `plugins/experience-architecture/skills/*/agents/openai.yaml` | Codex marketplace (at the repo root) and per-skill settings |
| `plugins/experience-architecture/scripts/install-skills.mjs` | Installs the skills as plain folders for Cursor (or Codex, or any tool that reads skill folders) |

## Develop

From `kits/experience-architecture/`, run `npm test` for deterministic toolkit checks. No fixture app installs are needed for static analysis, transition, privacy and installer checks. If changing browser behavior, install Playwright (`npm ci`, `npx playwright install chromium`), install and start Northwind (`cd fixtures/northwind && npm ci && npm run dev -- --port 3100`), then run the affected browser tests. Validate changed manifests with `claude plugin validate plugins/experience-architecture`.

Fixtures, answer keys, saved reports and comparison prompts preserve actual product evidence. Run a new model comparison only if it would change a capability or release decision, with the current models and a relevant held-out app. Do not rerun the historical matrix by default. Load the working-copy plugin directly rather than building a second marketplace archive.
