---
name: rethink
description: >-
  Decide whether a web app's structure should change and what it should become - which pages should exist, merge or go, how navigation should be organised, and whether a fundamentally different product structure would serve users better. Produces two or three genuinely different options (one ambitious when the evidence supports it) as a clickable prototype, explains each as what using the product would feel like, recommends one, and plans a migration that keeps existing links working. Changes the app only after the owner picks an option and says go.
when_to_use: >-
  "should we restructure", "give me options", "is this the right navigation", "do these pages need to exist", "what would a better structure look like"; also any request to add, move or remove a page, tab, section or nav item ("should we just add a tab for X", "where should this new feature live", "users asked for a page that shows Y"), because the right answer may be a different structure rather than the item asked for. After Diagnose finds a structural cause, or before a navigation redesign.
argument-hint: "[goal or constraint] [app path] [running URL]"
allowed-tools:
  - Bash(ea:*)
  - Read
  - Grep
  - Glob
---

# Rethink

Request: $ARGUMENTS

## Where things are

`${CLAUDE_PLUGIN_ROOT}` means this plugin's folder. Claude Code fills it in. In Codex or Cursor it is the folder two levels above this file (`skills/rethink/SKILL.md`), unless the installer has already written the full path. Where the `ea` command is not found, run `node <plugin folder>/scripts/ea.mjs` in its place. If the request line above shows `$ARGUMENTS`, the request is the user's message.

Read `${CLAUDE_PLUGIN_ROOT}/references/judgment.md` (how to decide what should exist), `${CLAUDE_PLUGIN_ROOT}/references/evidence.md` (boundaries and how to talk to the owner) and the proposal format in `${CLAUDE_PLUGIN_ROOT}/references/formats.md`.

If the output folder holds a `case.md`, this work is a stage of a larger assignment: read it and `${CLAUDE_PLUGIN_ROOT}/references/assignment.md` first, use what is already established, and do only what is still open.

## Static map (generated when this skill loaded)

!`ea brief .`

If the line above shows a command instead of a route summary, run it yourself now and read the output before going further.

## 1. Start from a diagnosis

A redesign without a diagnosis is decoration. If this conversation has no Diagnose result, build the minimum now: the concept table from the structure playbook (`${CLAUDE_PLUGIN_ROOT}/references/layers/structure.md`, step 2) and the responsibility matrix from the navigation playbook (`${CLAUDE_PLUGIN_ROOT}/references/layers/navigation.md`, step 2). Name the users' core loops and the organising idea the product uses today.

## 2. Sort the constraints

Read ADRs, design docs and navigation decisions. Sort each constraint:

- **hard**: sign-in and permission boundaries, data ownership, legal requirements, public and partner URL contracts, accessibility;
- **costly to change**: established habits, search traffic, integrations;
- **historical**: decided for reasons that no longer hold.

Only hard constraints bind the options. If the owner set a constraint ("keep the sidebar"), follow it and name the better options it rules out.

## 3. Decide what should exist

For every current page, give a verdict from `judgment.md` (keep, merge, demote, promote, move, retire) with its evidence, plus any destination that should be introduced. Then answer the bigger question: does the product's organising idea fit the shape of the users' work, and which alternative idea would fit better?

## 4. Two or three options that differ in kind

Scale this to the question and the evidence. For one item (add this tab, move this page), answer with a recommendation, the end state it moves toward and the first step; skip the proposal files, prototype and consolidation table unless the evidence shows a substantial structural problem. Build the full set below for a structural decision across several pages.

Options change the organising idea, not the spacing. Include one **conservative** option (today's model, cleaned up) and one **ambitious** option when the evidence supports it (a different primary model). The conservative option is there for comparison: recommend it only if the evidence says the current organising idea fits the users' work. For each:

1. The idea in two sentences, and which causes it removes.
2. A proposal JSON in `<out>/proposals/<id>.json`, marking absorbed pages, new destinations and retirements.
3. `ea sitemap <proposal>` → `<out>/sitemap-proposed-<id>.mmd`.
4. The state rules for its key screens, each derived from what users expect (`${CLAUDE_PLUGIN_ROOT}/references/state-ownership.md`).
5. Tradeoffs: what existing users relearn, how many URLs move (a draft mapping through `ea migrate` counts them), engineering size, risks to hard constraints, and what it makes possible.

Build one prototype with all options: `ea prototype <out>/proposals/*.json --out <out>/prototype.html`. Click through each option's core loops (your browser tool, or `ea journey` against the file served locally) and note where it strains: a destination with no obvious home, breadcrumbs too deep, a tab set that keeps growing.

Write `<out>/consolidation.md`: one row per current page, one column per option (keep, merge→X, tab of X, view of X, move→X, retire, new).

## 5. Present the choice

Run `ea refs <out>/rethink.md --root .` first and fix every reference it marks wrong.

Lead with the recommendation. Then one short paragraph per option, written as what using the product would feel like ("You'd open a customer and see everything about them on one page; the separate Activity and Notes pages go away"), what changes for current users, and the size of the work. Say why the losers lost and what would change your mind. Ask for the decision in one question. Keep framework vocabulary out of this part; the report holds it.

## 6. Plan the move

For the chosen option (or the recommendation, if the owner wants the plan first), follow `${CLAUDE_PLUGIN_ROOT}/references/migration.md`: a mapping for every current URL, `ea migrate`, the blast radius, a sequence of steps that each ship on their own, and regression journeys.

## 7. Implement only on a clear go

Change the app only when the owner has picked an option and explicitly asked you to build it. Then: confirm the first step's scope, work on a new branch, one step per commit, and run the regression journeys with Verify after each step (`ea journey <spec> --ci`). Never remove old routes in the same step that adds their redirects. Preserve every hard constraint; if a step would weaken one, stop and say so.

## Output

`<out>/` holds `rethink.md` (diagnosis summary, constraints, page verdicts, options, recommendation), `proposals/`, `sitemap-proposed-*.mmd`, `consolidation.md`, `prototype.html` and `migration/`.
