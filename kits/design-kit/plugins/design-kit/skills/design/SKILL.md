---
name: design
description: Use only when the user explicitly invokes /design or $design. Turns a design request (a new page, a change to an existing one, a redesign, a review, copy, color, type, motion, mobile, images, charts) into the one right skill or recipe from the design library, says why in a line, and starts it. Resumes a recipe already in progress. Ordinary design talk must not activate it.
disable-model-invocation: true
metadata:
  short-description: Route design work to the right skill
  author: AtlasScope/design-kit
---

# Design

The user types `/design` and what they want, in their own words. They have dozens of design skills and do not want to choose. They get the pick, one line on why, and the first step running.

The library lives in three references, generated from the Design Skills Field Guide:

- `references/situations.md`: what they might say, mapped to the usual pick and the alternative; then how to choose when several skills cover the same job. Read it first, every time.
- `references/recipes.md`: named chains of skills. Read it when the job needs more than one skill.
- `references/catalog.md`: every skill, what it does, whether it edits, reports or advises, and when to skip it. Read the rows for your pick before running it.

## Gates

- **Choose exactly one.** One skill, or one recipe. Never run two competing skills on the same job to compare them. If two fit, the overlap section in `situations.md` decides.
- **Ask once, then stop.** If the request could mean two different jobs (a review or a fix? this page or the whole site?), ask the one question that separates them and end the turn. Do not guess on a redesign or anything that rewrites a whole page.
- **Reviews only when they asked for one.** Pick a review skill (critique, audit, harsh-review, design-review, heuristics, Steve Jobs review, viewport proof) only when their words ask for a review, an opinion or a check. A recipe they chose that contains a review step counts as asking.
- **Nothing leaves the machine unasked.** Never pick a skill that sends their work to an outside service unless they named it.
- **Project rules win.** Read the repo's AGENTS.md or CLAUDE.md, PRODUCT.md and DESIGN.md before the first edit. Routing does not authorize commits, merges or deploys.

## Steps

1. **Read the ground.** Is there PRODUCT.md and DESIGN.md? What is the surface: marketing page, app screen, native app, a single component? Are they starting, changing, or judging?
2. **No PRODUCT.md and the job edits UI:** the first step is `/impeccable init`. Say so and start there, then continue the route.
3. **Pick.** Match their words to a situation. If the job spans steps (new landing page, rescue, pre-launch), pick the recipe instead. If nothing matches, use the catalog and say the pick is a judgment call.
4. **Check it is installed in this harness.** Skills from this kit may be namespaced `design-kit:<name>`; others come from their own plugins (Impeccable, Interface Design, Humanizer, Sepia, Vale) or the user's own folders. If one is missing, use the overlap alternative and say which, and name the plugin that provides it.
5. **Say the route, then start it.** Unless the ask-once gate stopped you, run the first skill in the same turn.
6. **Recipes keep a progress file** at `<primary-checkout>/.artifacts/design/<recipe-slug>.md`: the recipe, the target, each step with done or pending and a one-line result. Run one step per turn and show its result. Continue when they say go, or run it through if they said to.
7. **`/design next` or `/design` with a recipe in progress:** read the newest progress file, say where it stands in one line, and run the next step.
8. **Bare `/design`:** read the ground and offer the three starting points that fit this project best (situation, pick, one line each). Then stop.

## Harness

| | Claude Code | Codex | Cursor |
|---|---|---|---|
| Run a skill the model can call | Skill tool | `$name` | `/name` |
| Run a command-only skill (`/harsh-review`, `/image`, `/prototype`, `/ux-heuristics` and other review skills) | The Skill tool cannot call these. Read its SKILL.md from the skills folder and follow it as if they had typed it; their `/design` request is the explicit invocation | Read its SKILL.md and follow it | Same as Codex |
| Plugin skills (`/impeccable`, `/interface-design`, `/vale:*`, `example-skills:*`) | Skill tool with the plugin name | Installed as plain skills where present; check first | Check first |

## Traps

- `/impeccable <command>` is one skill with a sub-command, not a separate skill. Pass the sub-command and target as its argument.
- Several skills are named alike across packs: Impeccable's animate is not Emil's `/animate`; Hallmark audit is not Impeccable audit. Use the catalog's exact command.
- A skill switched off in Claude's settings does not appear and cannot run. If a pick fails to load, say it may be switched off rather than retrying.
- The references are generated. When the field guide changes, rebuild them with `node scripts/build_references.cjs <guide.html> plugins/design-kit/skills/design/references --public` from the design-kit repo root, and land the change through a PR.

## Output

First line: **Route:** the skill or recipe, and why, in one sentence a non-designer would follow. If it is a recipe, the steps on one line each. Then run step one. After each step: what changed, what is next, and whether anything needs their decision. Plain English; no file paths unless they must open one.
