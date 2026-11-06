---
name: engineer
description: Use only when the user explicitly invokes /engineer or $engineer. Turns a description of what is going on in a codebase (a symptom, a worry, a plan) into one starting move from the Agent Engineering Field Guide - an investigation prompt to paste, an installed skill to run, or a thinking prompt - and says why in a line. Ordinary engineering talk must not activate it.
disable-model-invocation: true
metadata:
  short-description: Suggest the right investigation or skill
  author: AtlasScope/engineering-kit
---

# Engineer

The user types `/engineer` and what is going on, in their own words. They have 48 investigations, 10 thinking prompts and two dozen skills, and do not want to remember which fits. They get one starting move and one line on why. This router suggests; it does not run a workflow.

The library is in two references, generated from the guide:

- `references/start-here.md`: symptoms mapped to investigations, every skill with the investigations it covers, the thinking prompts in full, and how to wrap an investigation prompt. Read it first, every time.
- `references/investigations.md`: all 48 investigations with the prompt, what it finds, the evidence to ask for, when to skip it, and the usual agent blind spot. Read only the entries you are weighing.

## Choose one move

1. **A skill**, when an installed skill does the job end to end: a bug to chase (`/diagnosing-bugs`), test-first work (`/tdd`), a diff to check (`/code-review`, `/security-review`, `/differential-review:diff-review`), CI cost (`/ci-optimizer:ci-check`), a dependency worry (`/supply-chain-risk-auditor`).
2. **An investigation**, when they need to find out whether a problem exists or where it lives. Match their words to a symptom, then pick the one investigation whose "Finds" line fits best. Check its "Skip when" line against what you know of the repo.
3. **A thinking prompt**, when the issue is how an agent is working rather than the code: a vague task (`M07`, `M01`), a plan that sounds too easy (`M02`), a repeat bug (`M03`), a fix that adds machinery (`M04`), "tests pass" as proof (`M06`), a costly decision (`M09`), a long session ending (`M10`).

If an investigation or thinking prompt covers it, say **no skill needed** and give the prompt. Never chain moves or suggest a second one unless they ask what comes after.

## Gates

- **Ask once, then stop.** If their words could mean two different jobs (a review or a fix? one route or the whole app?), ask the one question that separates them and end the turn.
- **Reviews only when asked.** Pick a review skill only when their words ask for a review, an audit or a check.
- **Check it is installed.** Plugin skills may be namespaced (`variant-analysis:variants`, `audit-context-building:audit-context`). If the pick is missing, name the plugin that provides it, then give the closest investigation prompt instead.
- **Suggest, do not start.** Do not run the skill or the investigation in the same turn unless they say go. Running a pick never authorizes commits, merges or deploys; project rules win.

## Building a copy-ready prompt

For an investigation: its prompt text, then the mode line for its `mode` (from `start-here.md`), a scope line if they named a branch or a slice, then the footer. Add the entry's "Watch for" sentence as a last line when it names a trap the agent would fall into. Keep the prompt's wording; do not expand it.

## Harness

| | Claude Code | Codex |
|---|---|---|
| Model-callable skill | Skill tool | `$name` |
| Command-only skill (all engineering-kit commands) | The Skill tool cannot call these. To run one after they say go, read its SKILL.md and follow it; their `/engineer` request is the explicit invocation | Read its SKILL.md and follow it |

## Output

- **Bare `/engineer`:** list the symptoms from `start-here.md`, one line each, and ask which is closest. Stop.
- Otherwise, first line: **Start with:** the pick (`/skill`, an investigation ID and title, or a thinking prompt ID and title) and why, in one sentence a non-engineer would follow.
- For a skill, a second line with what to type, including the argument.
- For a prompt, the copy-ready block in a fenced `text` block with nothing else inside it.
- One last line, only if useful: what to run next if it finds something.

The references are generated. When the guide changes, rebuild them with `node scripts/build_references.cjs <guide.html> plugins/engineering-kit/skills/engineer/references` from the repo root and land the change through a PR.
