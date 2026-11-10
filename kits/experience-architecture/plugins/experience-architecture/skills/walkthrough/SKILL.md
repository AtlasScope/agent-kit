---
name: walkthrough
description: >-
  Learn what a web product is for and what using it is like, then say how big a change it needs. Starts from a feeling rather than a known defect ("it works but feels unfinished", "it looks thrown together", "I keep adding things and it never comes right", "people don't get it"). Uses the running app the way a newcomer would before reading its code, or follows the owner through a real task while they say what they expected. Produces a short product brief, what already works and must be kept, what was seen, and a verdict for each job: leave, repair, clarify, recompose, restructure or reconceive. Read-only. Preview.
when_to_use: >-
  A whole-product complaint with no named cause: the app feels unfinished, confusing, stitched together, visually weak or hard to explain; the owner cannot say what to fix first; or the owner asks to be walked through their own product ("walk through it with me", "watch me use it"). For a known symptom in navigation, URLs, Back or state, use Diagnose. For the look of one screen alone, use a design skill.
argument-hint: "[what feels wrong] [with me] [running URL] [app path]"
allowed-tools:
  - Bash(ea:*)
  - Read
  - Grep
  - Glob
---

# Walkthrough

Request: $ARGUMENTS

## Where things are

`${CLAUDE_PLUGIN_ROOT}` means this plugin's folder. Claude Code fills it in. In Codex or Cursor it is the folder two levels above this file (`skills/walkthrough/SKILL.md`), unless the installer has already written the full path. Where the `ea` command is not found, run `node <plugin folder>/scripts/ea.mjs` in its place. If the request line above shows `$ARGUMENTS`, the request is the user's message.

Read `${CLAUDE_PLUGIN_ROOT}/references/walkthrough.md` now. It holds the brief and observation formats, the five evidence labels, what to look for on a screen, and how to run a session with the owner. Read `${CLAUDE_PLUGIN_ROOT}/references/levels.md` at step 6, and `${CLAUDE_PLUGIN_ROOT}/references/evidence.md` before writing the report.

This skill loads no route map. Steps 1 to 4 use only what a person using the product could see. The code comes in at step 5.

## 1. Frame

- Write the complaint down in the owner's words. Keep their words through to the report.
- Find a running URL: the request, a dev script in `package.json`, or ask once. If the owner gave a URL or said how to run the app, that is permission to start it and use it in the browser; stop anything you started. Use a local or staging copy and test accounts.
- Choose the mode. **With the owner** when they ask to show you or to be walked through it: follow "A session with the owner" in `walkthrough.md`. **Alone** otherwise. The two combine: an owner session on the task that frustrates them, then a pass alone on the rest.
- With no running app, screenshots or a recording still support steps 2 to 4. With only source code, say that this is a reading of the code, skip to step 5, and mark every statement about what users see as a guess.

## 2. Write the product brief

From what the owner said, the product's own public words (landing page, onboarding, PRODUCT.md, the README's first paragraph) and nothing deeper:

- what the product is for, in one sentence a customer would agree with;
- who uses it, told apart by what they know and what they are trying to finish;
- the three to five jobs people come to do, each with what finished looks like.

Mark each line as said by the owner, stated by the product, or your guess. If the purpose or the main job is a guess, ask the owner one question to settle it before going on.

Choose the journeys: the job the complaint is about, the job done most often, and one job the owner believes works. Three journeys is the usual size. The brief is done when each chosen journey has a starting point a real person would use and a finish you could recognise.

## 3. Use it before reading it

Do each journey as the person in the brief, starting where they would start.

- Where the session can start a fresh sub-agent, give it only the URL, the role, the job and the record format, and let it do the pass. That is a **cold pass**. A pass you make yourself after seeing any source is **source-informed**; say which this was.
- Use what is on screen: visible text, layout, and the names assistive technology would read. Reach pages by the controls a person would use.
- Capture each state at desktop and phone width (`ea journey <spec> --screenshots`, or the session's browser tools) and look at the images. Add a narrow width such as `560x900` when the product is used beside another app.
- After each step, fill one observation record (`walkthrough.md`): what the screen says it is for, what draws the eye first, what you would do next and why, what happened, and whether you could tell you were finished.
- Then take the hard turns on the same journey: arrive by a pasted link, go Back, leave halfway and return, reach an empty state, cause an error.
- A journey that stops at a step you could not complete ends there. Report the block; say nothing about the steps after it.

Last, put the captured screens side by side and look at them as one product, using "One product or several" in `walkthrough.md`.

## 4. Write the keep list

Before naming any problem, list what works and must survive a change: journeys that went cleanly, dense views that serve people who know the domain, deliberate identity, pages that exist for a distinct audience, links people will have saved. Each entry says why it earns its place. Later steps check their recommendations against this list.

## 5. Read the code to settle what you saw

Open the source only for questions the pass raised: is the second navigation a phone layout of the first, does that separate page protect a permission, is the empty state missing or unreachable. Use `ea map` and the layer playbooks under `${CLAUDE_PLUGIN_ROOT}/references/layers/` as Diagnose does. An observation the code explains gets its cause. An observation the code contradicts is corrected and stays in the record as corrected.

## 6. Choose the level, job by job

Read `${CLAUDE_PLUGIN_ROOT}/references/levels.md`. For each job in the brief give one verdict: **leave**, **repair**, **clarify**, **recompose**, **restructure** or **reconceive**, with the observations that decide it and the entry on the keep list it must respect. Choose the lowest level that removes the causes you found. State the verdict you rejected one level up and one level down, and why.

## 7. Report

Write `<output-dir>/walkthrough.md` (output folder rules are in `evidence.md`):

1. **The read**, in three to six plain sentences: what using the product is like, the level of change it needs, and the first change worth making.
2. **Product brief.**
3. **Keep list.**
4. **Jobs**, most affected first: the verdict, the observations behind it with their labels and screen captures, the direction described as what using it would be like afterwards, and what would change your mind.
5. **Not looked at**, and why.

Run `ea refs <output-dir>/walkthrough.md --root .` when the report cites code.

In chat, follow "Talking to the owner" in `evidence.md`: the read, the one decision you need, the report path. Then name the next step and stop: Diagnose for a repair whose cause is still open, Rethink for restructure or reconceive, and for clarify or recompose the specific screens and what each should lead with.

## Rules

- Read-only. This skill ends at a recommendation. Building it is separate work the owner asks for.
- Every statement carries one of the five labels in `walkthrough.md`. A walkthrough by an agent is an inspection of the product. Describe it as that, and describe people only where a person was observed.
- Evidence is tasks and screens. Give verdicts in words.
- "Leave" and "the structure is sound, two screens need a clearer order" are complete answers. Size the report to what you found.
