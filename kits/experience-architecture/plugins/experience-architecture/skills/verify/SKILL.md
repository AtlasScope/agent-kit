---
name: verify
description: >-
  Prove how a web app actually behaves in a real browser. Reproduces navigation and state bugs, checks that shared links open the right thing in a fresh browser signed out, as the same user and as a different account, that links open in new tabs, that Back, Forward and refresh keep the user's place, and that layouts work at desktop, phone and narrow side-panel widths. Records every step, fails loudly when an action cannot run, blocks data-changing requests by default, and keeps the journeys as a regression suite for after a change.
when_to_use: >-
  "prove this bug", "test the main flows", "did the redesign break anything", "do links work for someone who isn't signed in", before and after any navigation change, and whenever a Diagnose or Rethink finding needs browser proof.
argument-hint: "[journeys or goal] [running URL] [app path]"
allowed-tools:
  - Bash(ea:*)
  - Read
  - Grep
  - Glob
---

# Verify

Request: $ARGUMENTS

## Where things are

`${CLAUDE_PLUGIN_ROOT}` means this plugin's folder. Claude Code fills it in. In Codex or Cursor it is the folder two levels above this file (`skills/verify/SKILL.md`), unless the installer has already written the full path. Where the `ea` command is not found, run `node <plugin folder>/scripts/ea.mjs` in its place. If the request line above shows `$ARGUMENTS`, the request is the user's message.

Read `${CLAUDE_PLUGIN_ROOT}/references/formats.md` (journey spec) and `${CLAUDE_PLUGIN_ROOT}/references/toolkit.md` (browser modes and what the checks catch).

## Static map (generated when this skill loaded)

!`ea brief . --area chrome,continuity`

If the line above shows a command instead of a route summary, run it yourself now and read the output before going further.

## 1. Get a target

A running URL is required. Use the one the user named. If the user said how to run the app, start it that way; if only a dev script exists, ask once before starting it. Stop anything you started. For signed-in journeys use test accounts: cookies or a storage-state file from the user, or the project's seed data. Define each account the journeys need under `profiles` (for example `member` and `admin`). Never use real personal accounts or create accounts without permission.

## 2. Choose journeys from intent

Derive them from the route map, the request and any findings to confirm. Write each journey's `intent` in user terms. Cover what applies:

- the core loops (find → open → act → return), with `label` and `sameAs` to check the user comes back to the view they left;
- shared links: `coldOpen` on representative URLs `as: "signed-out"` (sign-in must keep the destination), `as: "same"` (the URL alone reproduces the view) and as another profile where permissions differ;
- new tabs: `openInNewTab` on list rows, cards, breadcrumbs and menu items, which catches clickable things that are not links;
- transitions between navigation systems (sidebar → tab → contextual link → Back);
- overlays (open, Back, Escape, refresh while open, a link to it);
- switching records (next/previous, search jump, related records) with typed input in progress;
- the same loops at `mobile` and at any narrow width the product is used at, such as `560x900` for a side panel.

Add `expect` only for promises the product makes; the automatic checks cover generic breakage.

## 3. Run

`ea journey <spec> --out <out>/journeys` (add `--screenshots` only when a visual matters). Use the runner for navigation checks rather than hand-written browser scripts: it records history push and replace counts and full state snapshots, which the checks depend on. If one interaction truly cannot be expressed as steps, script only that part and record `ea probe` snapshots so `ea transitions` can analyse it. Without Playwright, drive your browser tools, run the `ea probe` output after each step, assemble the log, and run `ea transitions <log>`.

Safety is built in and stays on: write requests are blocked unless the spec lists them in `allowWrites` (allow only what a journey must do, such as signing in), typed values and cookie values are replaced by a length and fingerprint everywhere the runner writes (step descriptions, errors, logs and reports), secret-looking URL parameters are masked, and page text is dropped before the log is written. Blocking write requests does not make a run read-only: some apps change data through ordinary page loads or links. Run journeys against a local or staging copy with test accounts, never production with real data. Never automate destructive actions (delete, pay, send, change an account), and stay on the host the user gave you.

## 4. Read the result honestly

Open `transitions.md`. Its first line is the verdict:

- **PASS**: every stated check was met, no journey stopped, and the automatic checks found no defect you have not accepted. Only this is a verified result.
- **FAIL**: a stated check failed, a journey stopped, or the automatic checks found a defect. Heuristic warnings (likely, judgment, info) never fail a run.
- **EXPLORATORY**: nothing failed, but no stated check was evaluated, so nothing was verified. Report findings as discovered.

If a defect is intended behaviour, list it under `accept` in the spec with a reason (`{"type": "view-state-push", "journey": "record-tabs", "reason": "tabs are separate places"}`) rather than deleting the check.

- **Journeys that did not finish** are listed first. A step that could not run (a missing button, a timeout) fails the journey and skips the rest. Fix the step and rerun, or report the app problem that made it fail. Never call such a journey verified.
- **Failed checks** are broken promises: report each with the step.
- **Anomalies**: for each `defect` or `likely`, rerun the step alone to rule out flakiness, compare the state before and after, and find the responsible code. `judgment` items, such as tab clicks that add history entries, are product decisions; present them as questions with a recommendation. `info` items (focus left on the page body, stale titles) are real accessibility and polish issues; group them.
- `write-blocked` means a step tried to change data and was stopped; check that the journey still tested what it meant to.

## 5. Record

One finding record per real problem (`${CLAUDE_PLUGIN_ROOT}/references/evidence.md`), class reproduced, with the journey id and step. Keep `journeys.json` as a regression suite: `ea journey journeys.json --base <url> --ci` exits 0 on PASS, 1 on FAIL and 2 when nothing was verified.

## Output

`<out>/journeys/` holds `journeys.json`, `journey-log.json`, `transitions.md`, `transitions.mmd` and `journeys.md` with the reproduced findings and a coverage table (journey × viewport × finished, passed or failed). In chat, say what was reproduced, what passed, what could not be tested and why, in plain words.
