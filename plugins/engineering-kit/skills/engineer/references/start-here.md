# Start here

Generated from the Agent Engineering Field Guide by `scripts/build_references.cjs`; do not edit by hand.

## Symptoms

What the user says, mapped to the investigations that usually explain it, best first.

| Symptom | Investigations |
|---|---|
| Numbers on screen don't match the source | `D01`, `D02`, `A04`, `G05` |
| A workflow got slow, or database cost jumped | `P01`, `P02`, `P03`, `P04` |
| Tests are green but production keeps breaking | `T01`, `T02`, `I02`, `S06` |
| Agents break nearby features on small edits | `A01`, `A02`, `R03`, `G01` |
| Things happen twice, or not at all | `R01`, `R05`, `D04`, `I04` |
| Merged but not live, or a deploy broke something | `I02`, `G02`, `S06`, `I05` |
| Worried about who can see or change what | `T03`, `T05`, `G03`, `S06` |
| The app hangs when an outside service is down | `G04`, `P09`, `R02`, `R06` |
| This Mac is full or browser tests are flaky | `I07`, `I01`, `T01` |

## Skills

Every skill the router may pick, what it does, and the investigations it can run or follow up. Check it is installed before picking it.

### Engineering kit

This plugin's commands. All run only when typed.

| Command | What it does | Covers |
|---|---|---|
| `/diagnosing-bugs` | Hard bugs and slowdowns: build a check that goes red on this bug, shrink it, rank hypotheses, instrument, fix with a regression test, clean up. | `P01`, `R05`, `A06`, `G06` |
| `/tdd` | Test-first in vertical slices. Agrees the test seams with you before writing any test. | `R03`, `T02`, `T06` |
| `/improve-codebase-architecture` | Scans recent hot spots for shallow modules, writes a before/after HTML report to the temp folder, then interviews you on one. | `A01`, `A03`, `A05` |
| `/grill-me` | Rounds of numbered questions with a recommended answer each, until a plan has no open branches. For product direction, not routine fixes. | `A01` |
| `/grill-with-docs` | The same interview, writing GLOSSARY.md terms and ADRs as decisions settle. | `A02`, `D05` |
| `/research` | A background agent answers a question from primary sources and saves a cited Markdown note in the repo. |  |
| `/retro` | Reviews a session and suggests changes to the agent's environment: navigation, checks, steering files, tool cost. | `G01` |
| `/wizard` | Writes a bash script that walks you through steps only you can do: dashboards, secrets, cutovers. |  |
| `/to-questionnaire` | Turns a decision you cannot answer alone into a questionnaire for the person who can. |  |
| `/wait-what` | Asks the agent to re-pitch its last message plainly. |  |

### Trail of Bits

Security plugins from trailofbits/skills, installed one at a time (see the README). Some run multi-agent workflows, which cost more than a single pass.

| Command | What it does | Covers |
|---|---|---|
| `/insecure-defaults:audit` | Fallback secrets, default credentials, fail-open switches, weak crypto, permissive access, debug leakage. | `T05`, `S06`, `R02` |
| `/supply-chain-risk-auditor` | Advisories for direct and lockfile dependencies, abandoned upstreams, risky publishers. | `T04`, `I06` |
| `/agentic-actions-auditor` | GitHub Actions that run Claude, Codex or Gemini: prompt injection from issues and PRs, token exposure. | `T04` |
| `/differential-review:diff-review` | Security review of a diff with git history and blast radius by caller count. | `T03`, `G02` |
| `/sharp-edges` | Footgun APIs and dangerous configuration options. | `T05` |
| `/variant-analysis` | After one bug is found, hunts the other places with the same root cause. | `M03` |
| `/property-based-testing` | Writes and reviews property tests with fast-check or Hypothesis. | `R03`, `R04`, `T02` |
| `/dimensional-analysis` | Unit and decimal-scaling bugs, annotating each value with its unit. | `G05`, `D02` |
| `/spec-to-code-compliance` | Checks code against the document that specifies it, one requirement at a time. | `D01`, `D02`, `A02` |
| `/audit-context-building` | Reads code function by function, recording what each assumes, before any bug hunt. | `T03`, `A04`, `A07` |
| `/goal-prompt` | Drafts /goal commands with verifiable completion conditions and stop bounds. |  |

### Built in

Claude Code commands and the ci-optimizer plugin.

| Command | What it does | Covers |
|---|---|---|
| `/code-review` | Correctness review of a diff or PR at an effort level. | `D06` |
| `/security-review` | Security review of pending changes on the current branch. | `T03`, `G03` |
| `/simplify` | Reuse and simplification pass on changed code, applying the fixes. | `A03` |
| `/ci-optimizer:ci-check` | Checks CI workflow files for speed, cost and safety problems. | `I03`, `T04` |
| `/ci-optimizer:ci-timings` | Slowest jobs, steps and flaky tests from recent runs. | `I03` |

## Thinking prompts

Short prompts that change how an agent works on any task. Paste as written.

### M01 Professional-grade, not larger

Use: Before handing an agent a task you only half know how to specify.

```text
I want the professional-grade version of this task, not a larger version. Look at what I'm trying to accomplish and tell me what a genuinely excellent practitioner would notice, investigate, or verify that I've overlooked. Start with the original evidence instead of just relying on existing summaries. Identify the methods that would materially improve the result and the independent evidence that would establish whether it's correct. Then improve the assignment accordingly. Keep the objective and scope intact. Don't add process or complexity just to make the work sound more sophisticated.
```

### M02 Falsification

Use: When an agent's plan sounds right and you cannot tell why it might not be.

```text
Assume the proposed solution is wrong. Find the strongest evidence against it before recommending we proceed.
```

### M03 Root cause

Use: The second time the same kind of bug shows up.

```text
Don't fix the visible symptom yet. Work backward through the system until you can explain why it occurred and what other behavior shares that cause.
```

### M04 Complexity reduction

Use: When the proposed fix adds a new flag, table or service.

```text
Solve this by making the existing system simpler. First determine whether we can remove a layer, rule, dependency, or special case rather than add something.
```

### M05 Expert delegation

Use: When an agent keeps asking you technical questions you cannot judge.

```text
Treat the technical decisions as yours to make. Apply established engineering standards, investigate uncertainties, and escalate only genuine product or risk decisions.
```

### M06 Independent verification

Use: Before you accept 'tests pass' as proof.

```text
Design a way to prove your solution works that doesn't depend on the assumptions, code, or tests you just created.
```

### M07 Outcome-bound spec without needless interview

Use: The default opener for a real task. The opposite of /grill-me.

```text
Turn my request into a compact working specification: desired outcome, actual scope, meaningful exclusions, observable acceptance criteria, and stopping point. Resolve technical ambiguity from the repository and authoritative references yourself; ask me only for product preferences, permissions, or genuine tradeoffs you cannot determine independently. Then execute if the task is authorized and ready.
```

### M08 Reproduce, measure, prove

Use: The second session, after a read-only investigation found something real.

```text
Before repairing a suspected defect or performance problem, establish a reproducible failing case or measurable baseline. Find the root cause, implement the narrowest defensible fix, rerun an independent check, and report the before/after evidence. If you can't measure or reproduce it, say what evidence is missing instead of claiming a win.
```

### M09 Three-way tradeoff

Use: Decisions that will be expensive to reverse.

```text
Do not implement the first viable approach you find. Present three genuinely distinct ways to solve this problem: (1) the smallest, most conservative patch to the existing code, (2) the cleanest long-term structural design, and (3) a subtractive approach that removes an existing constraint, layer, or edge case. Compare their blast radius, testability, and failure modes, recommend one, and wait for my decision.
```

### M10 Cold-start handoff checkpoint

Use: Before compacting or ending a long session.

```text
Prepare a compact, self-contained technical checkpoint so a fresh agent session can resume this work cold. Document only: (1) verified facts and current system state, (2) approaches already tested and why they were ruled out, (3) exact files and uncommitted changes in flight, and (4) the single next falsifiable step. Summarize system ground truth, not our conversation history.
```

## Wrapping an investigation prompt

An investigation prompt is sent as: the prompt, one mode line, an optional scope line, then the footer.

Modes:

- `read` (Read-only): Treat this as a read-only investigation. Do not edit code, data, configuration, credentials or infrastructure. Report each finding with file:line or a command I can rerun, and a confidence.
- `repro` (Reproducer only): You may add a failing test or a small reproduction script for the highest-risk finding. Do not change application code, data or configuration.
- `change` (Propose a fix): After reporting, propose the smallest fix for the top confirmed finding as a diff for my review. Do not apply it to production, run migrations, or delete anything.

Scopes:

- `repo` (Whole repo): no line added.
- `branch` (This branch): Limit this to files changed on the current branch (git diff main...HEAD) and their direct callers.
- `slice` (One slice first): Start with one high-traffic route, module or entity. Report on that slice, then stop before scanning the rest.

Footer:

```text
End with a table I can paste into my playbook, one row per finding:
| ID | Project | Verdict (Clean / Suspect / Confirmed) | Evidence | False-positive notes |
```

## When to run what

| When | Look at | Keep it lean |
|---|---|---|
| Significant feature or change | End-to-end check of the touched journey, integration effects, regression review. | Scope to touched surfaces. No full-system audit for a small change. |
| Weekly, if something moved | Recent changes with signs of slowdown, flakiness, deploy or correctness trouble. | Skip when nothing meaningful merged and no signal changed. |
| Monthly | Known debt: flaky tests, dependency risk, CI waste, repeated expensive work. | Prioritize known problem areas. Don't rerun unchanged scans. |
| Quarterly | Architecture and growth assumptions, ownership boundaries, technical debt. | Only when the system or the evidence changed. |
| After an incident | Root cause, a reproducing test, the shared-cause repair. | Stop once recurrence is addressed. No standing machinery by default. |
