# v0.2 comparison (2026-11-06)

Three setups, the same prompts, the same model (Sonnet), three runs each:

- **baseline**: Claude with no plugin and no skill;
- **skill**: the standalone experience-architecture skill (from the separate skill-only session);
- **plugin**: this plugin.

Every run had its own copy of the app, a copy of Playwright, no user settings, connectors or memory, and reads of personal folders denied (`tests/compare/`). No run in any setup edited application source. Reports were scored by fresh judge agents that saw the answer key and the reports under random letters. Letter-to-run mappings are kept beside each score file.

## Apps

| App | Built by | Kind | Used to tune v0.2? |
|---|---|---|---|
| Fieldbook | the standalone skill's session (its own eval app and graders) | vanilla JS + Python, ~240 lines of app code | yes, after round 1 |
| Tidewater | a separate agent, blind | Vite + React Router; the right answer is structural; three decoys | yes, after round 1 |
| Meridian | a separate agent, blind | large Next.js app, 57 routes, ~5,100 lines; 15 defects, 2 structural problems, 4 decoys | yes (scanner fixes), after round 1 |
| **Kestrel** | a separate agent, blind, after the plugin was frozen | Next.js, 31 routes, ~3,400 lines; structural problem, a structure to keep, 10 defects, 3 decoys | **no: held out** |

Fieldbook favours the standalone skill: its graders were written alongside it.

## Held-out result: Kestrel

The plugin was frozen before Kestrel was written. These numbers are the cleanest evidence in this folder.

| | Baseline | Skill | Plugin |
|---|---|---|---|
| Broad: structural verdict (0-5, mean of 3) | 3.0 | 4.7 | **5.0** |
| Broad: defects found (of 10) | 3.3 | **9.0** | 7.3 |
| Broad: false or unsupported claims (total over 3 runs) | 2 | 2 | 7 |
| Broad: owner clarity (1-5) | 4.3 | 4.3 | **5.0** |
| Narrow: structural verdict (0-5): fixes Back *and* names the structural cause | 2.7 | 1.7 | **5.0** |
| Narrow: defects found | 1.0 | 2.0 | 2.0 |
| Cost per run, broad / narrow | $0.50 / $0.19 | $0.81 / $0.28 | $0.58 / $0.34 |

All nine reports respected the structure that should be kept, and none fell for a decoy. Baseline run 1 upheld the ADR that should be overturned. On the narrow question, two skill runs defended it.

## Tuning rounds (in-sample)

Round 1 measured the first v0.2 plugin. Its weaknesses led to general fixes:

- starting the app when the user gave a run command or a URL;
- checking for a second cause on narrow questions;
- judging ADRs on their merits;
- committing to an end state instead of hedging;
- a trigger for "should we add this tab or page";
- scanner fixes for links built from a workspace prefix, components used everywhere, and duplicate pages under a workspace path.

Three more plugin runs per prompt then used the final version. Round 2 re-scored all twelve reports per prompt together, blind, so every setup was judged in one pass. These apps shaped the fixes, so treat the final-plugin column as in-sample.

| Prompt | Measure | Baseline | Skill | Plugin round 1 | Plugin final |
|---|---|---|---|---|---|
| Fieldbook full review | rubric items (of 12) | 9.0 | **12.0** | 11.0 | 11.3 |
| Fieldbook narrow (Back and task links) | rubric items (of 8) | 5.3 | **6.7** | 5.0 | 6.0 |
| Tidewater broad | structural verdict (0-5) | **5.0** | 4.7 | 4.3 | **5.0** |
| Tidewater broad | false claims (total) | 7 | 1 | 3 | 3 |
| Tidewater narrow ("add a tab?") | structural verdict (0-5) | 2.0 | 3.7 | 2.0 | **4.3** |
| Meridian broad | defects (of 15) | **13.0** | 12.3 | 10.3 | 11.7 |
| Meridian broad | structural problems (of 2) | **1.3** | 0.8 | 0.8 | 0.8 |
| Meridian narrow (shared links after sign-in) | both causes and a safe fix | all runs | all runs | all runs | all runs |

Round 1 plugin numbers come from the round-2 re-score; the first scoring pass agreed within half a point everywhere it overlapped.

## What this shows

- **Structural judgment is the plugin's strength.** On the held-out app it reached the key's structural conclusion in all six runs, broad and narrow. On narrow questions, it is the only setup that reliably treats the symptom as a sign of the structure while still fixing the symptom.
- **It is not the best bug finder.** On the large app (Meridian), plain Claude found the most defects. On Kestrel, the standalone skill found the most. The plugin is in between.
- **It makes more unsupported claims than the others on Kestrel** (7 over three broad runs, against 2 each). Most are wrong details in long reports, such as a misnamed component or an overstated count. They are not wrong conclusions.
- **Owner clarity is consistently highest:** 5/5 in nine of the twelve final and held-out broad runs, and never below 4.
- **Cost** is 1.2 to 1.8 times plain Claude per run, and below the standalone skill on broad reviews.
- **Triggering.** The final version fired in all 18 final runs and all 6 held-out runs. In a separate one-line chat question ("should the drawer be its own page? keep it short"), it did not fire, and Claude answered without it.

## Not shown

- n = 3 per cell. Differences of half a point or less are within run-to-run noise.
- Every app is synthetic, and the judges are models. Nothing here has run on a real product.
- Fieldbook and the in-sample columns overstate whichever setup was tuned on them.

Files: `round1/` and `round2/` (score sheets and mappings), `kestrel-heldout/`, `run-stats.txt` (cost, turns, whether a skill fired, browser tool use, source edits per run). The prompts and harness are in `tests/compare/`. 111 runs cost $41.29 in total, excluding judging.
