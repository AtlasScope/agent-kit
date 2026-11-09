---
name: viewport-proof
description: >-
  Use only when the user explicitly invokes /viewport-proof or $viewport-proof.
  Judges a real rendered UI across representative viewports for production
  readiness: it works, stays consistent across device sizes, and looks
  deliberately composed. Delivers one of three verdicts with a visual proof sheet
  of saved screenshots, mechanical geometry checks, and every exclusion named.
  Ordinary UI, screenshot, review, or coding requests must not activate it.
disable-model-invocation: true
---

# Viewport Proof

The user needs to know whether a screen can ship, and to see why without reading code. Deliver one verdict, **production ready**, **minor fixes required**, or **not production ready**, backed by a proof sheet they can open and look at.

This is quality assurance against a bar; redesign is out of scope. When a surface misses the bar because its direction is wrong, record that as a material issue with the exact symptom, and stop. Proposing a new direction belongs to a design pass.

Invoking the skill authorizes capture and the report. It does not authorize code edits. If the surrounding task already authorized implementation, fix clear in-scope blockers and material issues, then re-capture the affected frames. Stop for anything that changes product direction.

## Harness

The proof is the same everywhere: saved frames, `scripts/geometry_check.js` results, and the sheet from `scripts/build_proof_sheet.py`.

| Harness | Look and interact | Save frames to disk | Deliver the sheet |
|---|---|---|---|
| **Claude Code** | Browser pane: `resize_window` (custom width and height), `computer` screenshot and `zoom`, `javascript_tool` for the geometry script. Claude in Chrome when the page needs the user's signed-in session | Pane screenshots reach you, not the disk. Save frames with the project's Playwright runner or a short Playwright script through the shell | **Publish `index.html` with the `Artifact` tool**, passing the printed `files` map so the frames ship with it. Load the artifact guidance first. Keep the local run folder |
| **Codex** | Codex's browser, or Playwright | Playwright (`page.screenshot`, `page.evaluate` for the geometry script) | Serve the run folder on a spare local port, open it, and give the URL and path |
| **Cursor** | Cursor's browser tool (evaluate the geometry script on the tab) | Playwright | Same as Codex |

Use Playwright only if the project or machine already has it. Never install it for a proof. If nothing can save images, inspect in session, mark those frames as unsaved, and say so in the verdict. With no browser at all, give no verdict; report what blocked the proof.

## 1. Pin the target

Name the routes, the states that change geometry, the expected branch and commit, and the behavior that must not change.

Prove the server is running that exact checkout. A listening port is not proof: another worktree, a stale dev server, or a cached preview often answers on it. Find something the change introduced (a string, a class, an element) and confirm it in the live DOM, or match a build marker to the commit. If you cannot prove it, stop and say which server answered.

## 2. Choose coverage

Pick **Targeted**, **Expanded**, or **Release** and the viewports from [references/matrix.md](references/matrix.md). Add probes at every breakpoint the change touched. More devices do not replace breakpoint reasoning.

## 3. Capture each route, state, and viewport

Read [references/capture.md](references/capture.md) before the first capture. It covers settling the page, states, themes, touch, and the traps that make frames lie.

For every frame:
1. Set the viewport and input mode, load meaningful data, and wait until the page is settled. A skeleton, spinner, or half-loaded font is not evidence.
2. Run `scripts/geometry_check.js` on the page. Re-capture if `settled.ok` is false. Record the fail and warn counts on the frame.
3. Save the screenshot into the run folder and look at it yourself, zooming where detail matters.

The geometry script is the mechanical floor. A clean result does not mean ready. Every `fail` is either an issue or explained as intentional in the frame note.

## 4. Judge

Judge with [references/production-readiness-rubric.md](references/production-readiness-rubric.md): does it work, does it stay consistent across sizes, does it look deliberately composed. Review each viewport alone, then side by side.

To claim a baseline was preserved, compare base and head frames at the affected phone and laptop sizes, or cite an earlier reviewed proof. A head-only frame cannot prove nothing changed.

Chromium is the baseline. Add a Safari or Firefox check when the change touches sticky or scroll behavior, form inputs, viewport-height units, backdrop filters, or other engine-sensitive CSS. Name engines you could not run under "not checked".

## 5. Build and deliver the proof

Write `proof.json` in the run folder per [references/proof-sheet.md](references/proof-sheet.md), then run `python3 <skill-dir>/scripts/build_proof_sheet.py <run-dir>/proof.json`. If it refuses, the verdict and the evidence disagree; fix the proof. Deliver the sheet as the Harness table says. Screenshots stay in the gitignored run folder; commit them only if the repo treats them as reviewed fixtures.

Reply in chat with:

```text
Verdict: <verdict>. <One sentence on why, in user terms.>
Must fix: <blockers and material issues, each with route, state, viewport, and what a user sees>
Small fixes: <minor issues, or "none">
Not checked: <engines, states, routes, themes left out, and why>
Proof sheet: <artifact link, or local URL and path>
```

Never say "all devices". Name the sizes, states, input modes, and engines you actually checked.

## Done

Every selected route and state has a frame or a stated exclusion. The serving commit is proven. Every geometry `fail` is an issue or explained. The verdict matches the rubric: **production ready** allows no known blocker, no material issue, and no missing required evidence.
