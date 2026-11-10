# Start here

Generated from `library/library.json` by `kits/engineering-kit/scripts/build_references.mjs`; do not edit by hand.

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
| Your computer is full or browser tests are flaky | `I07`, `I01`, `T01` |
| Users get lost, or Back and shared links misbehave | `R07`, `A08`, `A01`, `T01` |
| Animations stutter, lag or all feel different | `MO02`, `MO01`, `MO04`, `MO03` |

## Skills

Every skill the router may pick, what it does, and the investigations it can run or follow up. Check it is installed before picking it.

### Engineering kit

This plugin's commands. All run only when typed.

| Command | What it does | Covers |
|---|---|---|
| `/database` | Describe a PostgreSQL problem in plain words and it picks one database prompt from this library, says why, and runs it read-only when it can reach the code and database. In Codex it's $database. |  |
| `/diagnosing-bugs` | For hard bugs and slowdowns. Builds a check that fails on the bug, shrinks it, ranks likely causes, adds logging, fixes it with a test that keeps it from coming back, then cleans up. | `P01`, `R05`, `A06`, `G06` |
| `/tdd` | Writes the tests first, one small working slice at a time. Agrees with you where the tests will hook into the code before writing any. | `R03`, `T02`, `T06` |
| `/improve-codebase-architecture` | Looks at recently busy parts of the code for modules that add little behind their interface, writes a before/after HTML report to the temp folder, then interviews you about one. | `A01`, `A03`, `A05` |
| `/grill-me` | Asks rounds of numbered questions, each with a suggested answer, until every open question in a plan is settled. For product direction, not routine fixes. | `A01` |
| `/grill-with-docs` | The same interview, but it writes terms into GLOSSARY.md and records each settled decision as an ADR (a short decision record). | `A02`, `D05` |
| `/research` | A background agent answers a question from original sources and saves a Markdown note with citations in the repo. |  |
| `/retro` | Reviews a session and suggests changes to the agent's setup: how it finds its way around, its checks, its instruction files and what its tools cost. | `G01` |
| `/wizard` | Writes a bash script that walks you through the steps only you can do, like dashboards, secrets and switchovers. |  |
| `/to-questionnaire` | Turns a decision you can't make alone into a questionnaire for the person who can. |  |
| `/wait-what` | Asks the agent to explain its last message again in plain words. |  |

### Trail of Bits

Security plugins from trailofbits/skills, installed one at a time (see the README). Some run multi-agent workflows, which cost more than a single pass.

| Command | What it does | Covers |
|---|---|---|
| `/insecure-defaults:audit` | Finds unsafe defaults: fallback secrets, default passwords, switches that let everything through when they fail, weak encryption, loose access rules and debug details leaking out. | `T05`, `S06`, `R02` |
| `/supply-chain-risk-auditor` | Checks your direct dependencies and the ones in the lockfile for security warnings, abandoned projects and risky publishers. | `T04`, `I06` |
| `/agentic-actions-auditor` | Checks GitHub Actions that run Claude, Codex or Gemini for exposed tokens and prompt injection (hidden instructions in issues and PRs that the AI might follow). | `T04` |
| `/differential-review:diff-review` | Security review of a set of code changes, using git history and counting how many callers each change could affect. | `T03`, `G02` |
| `/sharp-edges` | Finds APIs that are easy to misuse and configuration options that are dangerous. | `T05` |
| `/variant-analysis` | After one bug is found, hunts for the other places with the same root cause. |  |
| `/property-based-testing` | Writes and reviews property tests (tests that throw many generated inputs at a rule) with fast-check or Hypothesis. | `R03`, `R04`, `T02` |
| `/dimensional-analysis` | Finds bugs from mixed-up units and decimal scaling by labeling each value with its unit. | `G05`, `D02` |
| `/spec-to-code-compliance` | Checks code against the document that specifies it, one requirement at a time. | `D01`, `D02`, `A02` |
| `/audit-context-building` | Reads code one function at a time and records what each one assumes, before any bug hunt starts. | `T03`, `A04`, `A07` |
| `/goal-prompt` | Drafts /goal commands with a checkable finish line and limits on when to stop. |  |

### Experience architecture

The experience-architecture plugin in AtlasScope/agent-kit (separate install, see its README): how an app's pages, navigation, URLs and state serve its users. Diagnose and Rethink can start on their own when the topic comes up; all three are read-only until the owner picks a change.

| Command | What it does | Covers |
|---|---|---|
| `/experience-architecture:diagnose` | Start here for any complaint about navigation, the Back button, filters, shared links or too many pages. Finds the causes, says whether the page structure is the problem, and checks its own file references before reporting. | `A08`, `R07`, `A01` |
| `/experience-architecture:rethink` | For questions like whether a page should exist, where a feature belongs, or whether to add a tab. Gives a recommendation, and for a real structural problem two or three options with a clickable prototype and a move-over plan that keeps old links working. | `A08`, `A05` |
| `/experience-architecture:verify` | Proves behaviour in a browser and saves the user journeys as a repeat check that ends PASS, FAIL or EXPLORATORY. Typed values and secrets stay out of the logs. | `R07`, `T01`, `G06` |

### Built in

Claude Code commands and the ci-optimizer plugin.

| Command | What it does | Covers |
|---|---|---|
| `/code-review` | Checks a set of changes or a PR for bugs, at an effort level you pick. Run it at high or above before marking a PR ready. | `D06` |
| `/security-review` | Security review of the not-yet-merged changes on the current branch. | `T03`, `G03` |
| `/simplify` | Looks over changed code for things to reuse or simplify, and makes the fixes. | `A03` |
| `/ci-optimizer:ci-check` | Checks CI workflow files (the automatic build and test runs) for speed, cost and safety problems. | `I03`, `T04` |
| `/ci-optimizer:ci-timings` | Finds the slowest jobs and steps, and flaky tests (ones that pass and fail at random), from recent CI runs. | `I03` |

## Thinking prompts

Short prompts that change how an agent works on any task. Paste as written.

### M01 Deeper, not bigger

Use it before you hand an agent a task you only half know how to describe.

```text
I want the professional-grade version of this task, not a larger version. Look at what I'm trying to accomplish and tell me what a genuinely excellent practitioner would notice, investigate, or verify that I've overlooked. Start with the original evidence instead of just relying on existing summaries. Identify the methods that would materially improve the result and the independent evidence that would establish whether it's correct. Then improve the assignment accordingly. Keep the objective and scope intact. Don't add process or complexity just to make the work sound more sophisticated.
```

### M02 Prove it wrong

Use it when an agent's plan sounds right and you can't see why it might be wrong.

```text
Assume the proposed solution is wrong. Find the strongest evidence against it before recommending we proceed.
```

### M03 Root cause first

Use it the second time the same kind of bug shows up.

```text
Don't fix the visible symptom yet. Work backward through the system until you can explain why it occurred and what other behavior shares that cause.
```

### M04 Simpler first

Use it when the proposed fix adds a new setting, table or service.

```text
Solve this by making the existing system simpler. First determine whether we can remove a layer, rule, dependency, or special case rather than add something.
```

### M05 Let the expert decide

Use it when an agent keeps asking you technical questions you can't judge.

```text
Treat the technical decisions as yours to make. Apply established engineering standards, investigate uncertainties, and escalate only genuine product or risk decisions.
```

### M06 Check it independently

Use it before you accept 'tests pass' as proof that something works.

```text
Design a way to prove your solution works that doesn't depend on the assumptions, code, or tests you just created.
```

### M07 Spec without the interview

The default way to start a real task. The opposite of /grill-me.

```text
Turn my request into a compact working specification: desired outcome, actual scope, meaningful exclusions, observable acceptance criteria, and stopping point. Resolve technical ambiguity from the repository and authoritative references yourself; ask me only for product preferences, permissions, or genuine tradeoffs you cannot determine independently. Then execute if the task is authorized and ready.
```

### M08 Reproduce, measure, prove

Use it in the second session, after a read-only investigation found a real problem.

```text
Before repairing a suspected defect or performance problem, establish a reproducible failing case or measurable baseline. Find the root cause, implement the narrowest defensible fix, rerun an independent check, and report the before/after evidence. If you can't measure or reproduce it, say what evidence is missing instead of claiming a win.
```

### M09 Compare three options

Use it for decisions that will be expensive to undo.

```text
Do not implement the first viable approach you find. Present three genuinely distinct ways to solve this problem: (1) the smallest, most conservative patch to the existing code, (2) the cleanest long-term structural design, and (3) a subtractive approach that removes an existing constraint, layer, or edge case. Compare their blast radius, testability, and failure modes, recommend one, and wait for my decision.
```

### M10 Handoff note before you stop

Use it before the agent compacts (shrinks its memory of the chat) or a long session ends.

```text
Prepare a compact, self-contained technical checkpoint so a fresh agent session can resume this work cold. Document only: (1) verified facts and current system state, (2) approaches already tested and why they were ruled out, (3) exact files and uncommitted changes in flight, and (4) the single next falsifiable step. Summarize system ground truth, not our conversation history.
```

### M11 Thorough and bold

Add it to any prompt when you want depth and a firm recommendation, with the checking shown.

```text
Go past the first answer. For each claim you make, check the original evidence (the code, the data or the docs) and say which claims you verified and which you assumed. Then give one clear recommendation, the strongest argument against it, and the result that would change your mind.
```

### M12 Deepen modules, simplify interfaces

Use it as a cleanup pass on each pull request, or on a schedule for overdue maintenance. It pushes the agent to merge duplicated code, put core logic in one place and cut lines. Shared by Chris (@_khrus) on X on 7 Nov 2026; the idea is John Ousterhout's, from A Philosophy of Software Design, and Matt Pocock pointed him to it. /improve-codebase-architecture is the longer version: a scan, a report and an interview.

```text
Deepen modules and simplify interfaces.
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
| After a big feature or change | Check the whole path people use through what changed, what it touches, and that nothing old broke. | Stick to what changed. A small change doesn't need a check of everything. |
| Weekly, if something changed | Recent changes that show signs of slowing down, failing at random, or deploy or accuracy trouble. | Skip it when nothing important was merged and nothing looks different. |
| Monthly | Problems you already know about: tests that fail at random, risky packages, wasted check time, work done over and over. | Start with the known problem areas. Don't rerun checks on things that haven't changed. |
| Quarterly | Whether the overall design still fits, how much growth it can take, who owns what, and old shortcuts that now cost you. | Only when the system or the evidence has changed. |
| After something breaks | The real cause, a test that shows the problem, and a fix for the shared cause. | Stop once it can't happen again. Don't set up anything permanent by default. |
