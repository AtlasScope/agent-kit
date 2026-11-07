# Validation results

**v0.2 (current):** see [`v0.2-comparison/`](v0.2-comparison/README.md). It compares plain Claude, the standalone skill and the plugin on four apps, three runs each, including Kestrel, an app written after the plugin was frozen.

The rest of this page records v0.1 (2026-11-06), with eight skills.

## Fixtures

| App | Stack | Planted defects | Written by | Used for tuning |
|---|---|---|---|---|
| Northwind | Next.js 15 App Router, JS | 20 | alongside the toolkit | yes |
| Fernway | Vite, React Router 6 data router, zustand, TS | 18 | separate agent, blind | yes, after the blind baseline below |
| Lumen | Next.js 15 App Router, `src/`, parallel and intercepting routes, TS | 18 | separate agent, blind | no (held out) |

Answer keys are in `tests/ground-truth/`. Every scoring was done by a fresh agent that saw the key and the reports but not which arm produced which report.

## Toolkit on its own

| Measurement | Result |
|---|---|
| Northwind, static map | 22 of the 22 statically visible signals the tests assert (all 20 planted defects represented) |
| Northwind, journeys (10 journeys, generic anomaly checks) | every planted continuity defect caught without expectations; the banner reset needed one expectation |
| Fernway, static map, blind first run | 5 of 18, plus one real defect the key missed and one false positive. This run exposed framework assumptions (nested `<Routes>` mounts, element resolution through imports, nav config arrays, URL helpers, catch-all redirects), which were fixed generally |
| Fernway, after fixes | 15 statically visible defects asserted in `static.test.mjs`; the crawl adds the path/query status duplication and the mobile menu subset |
| **Lumen, held out: static + desktop and mobile crawls, no agent** | **6 of 18.** 12 false signals, mostly "unreachable" pages reached through runtime-computed links. A JSONC parser bug (globs in tsconfig `include` read as comments) found here was fixed and cut false signals to 8 with the same score; orphan signals are now downgraded when computed links exist. See `lumen-toolkit-only/judge-scores.md` |

The held-out number is the honest picture of the static pass and crawler: a source of leads that covers part of IA, routing and chrome, and none of the continuity defects. Those need journeys (sequences of actions), which someone has to write from the app's tasks.

## Claude with and without the plugin (Lumen, held out)

Same prompt (`lumen-comparison/prompt.txt`), Sonnet in both arms, same tools, Playwright available to both, one run per arm.

| | Baseline (no plugin) | Plugin v1 | Plugin v2 |
|---|---|---|---|
| Planted defects found (of 18) | 16.5 | 15.5 | 17.5 |
| IA / routing / chrome / continuity | 2.5 / 6 / 4 / 4 | 2.5 / 5 / 4 / 4 | 3.5 / 6 / 4 / 4 |
| True extra problems / false claims | 10-11 / 1-2 | 6 / 0 | 7 / 1 |
| Evidence quality (1-5) | 3 | 4 | 5 |
| Root-cause synthesis (1-5) | 4 | 5 | 5 |
| Actionability (1-5) | 4 | 4 | 5 |
| Distinct architectural alternatives (1-5) | 2 | 4 | 5 |
| Turns / cost / minutes | 8 / $0.42 / 2.5 | 11 / $0.49 / 3.4 | 12 / $0.57 / 3.0 |

v1 to v2 change: the skills now run `ea brief` at load time, so the static map is always in context. In v1 the model had `ea` available and ignored it. The same baseline report was scored by two different judges (16.5 both times).

What this shows: on a small app (about 800 lines), a strong model reading every file finds nearly all defects either way. The plugin's measurable gains are in how the work is done and reported: reproductions with start, action, expected and observed; one state-ownership table explaining the continuity bugs; genuinely different structures with a consolidation matrix and migration plan; fewer false claims. Detection gains are small (+1 defect in v2, −1 in v1) and within run-to-run noise at n=1.

What it does not show: behaviour on a large app, where reading every file is impossible and the map and crawler should matter more. That is untested.

## Official eval suite (`claude plugin eval`, Northwind, static)

Three cases, one run per arm, with-versus-without ablation, $1.75 total:

| Case | With plugin | Without | Notes |
|---|---|---|---|
| back-closes-drawer | 1.0 (Sonnet judge, 2 of 2 runs) | 1.0 | The default Haiku judge failed a correct plugin answer; use `--judge-model sonnet` |
| merge-question | 1.0 | 1.0 | |
| vague-mess | 1.0 | 1.0 | |

The skill fired in every with-plugin run. On these focused static questions the plugin matches the baseline and costs about 1.5-2.5 times the turns.

## Observed behaviour worth knowing

- In both Lumen runs the model wrote its own Playwright script rather than using `ea journey`, even after the skills said not to. Its targeted checks were good, but they skip the history reconstruction and anomaly checks. The journey runner is most useful when run directly, or by the journey-tester agent on a larger app.
- Neither run dispatched subagents: the coordinator judged the app small enough to do inline, as the skill allows.
- No run modified application source.
