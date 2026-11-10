---
name: walkthrough
description: >-
  Learn what a web product is for and what using it is like, then say what it should become and the most valuable change to make. Starts from a feeling rather than a known defect ("it works but feels unfinished", "it looks thrown together", "I keep adding things and it never comes right", "people don't get it"). Uses the running app the way a newcomer would before reading its code, or follows the owner through a real task while they say what they expected. Produces a short product brief, what must be preserved, what was seen, and for each job a direction and the size of change it implies. Changes no application code. When the owner asked for the product to be improved and not only examined, carries the assignment on through direction, build and verification. Preview.
when_to_use: >-
  A whole-product complaint with no named cause: the app feels unfinished, confusing, stitched together, visually weak or hard to explain; the owner cannot say what to fix first; the owner wants it turned into a better product; or the owner asks to be walked through it ("walk through it with me", "watch me use it"). Applies to one screen as much as to many when the doubt is about what the screen should be. For a known symptom in navigation, URLs, Back or state, use Diagnose. For a cosmetic fix the owner has already specified, use a design skill.
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

Read `${CLAUDE_PLUGIN_ROOT}/references/walkthrough.md` now. It holds the brief and observation formats, the five evidence labels, what to look for on a screen, and how to run a session with the owner. Read `${CLAUDE_PLUGIN_ROOT}/references/levels.md` at step 6, and `${CLAUDE_PLUGIN_ROOT}/references/evidence.md` before writing the report. If the owner asked for the product to be improved, read `${CLAUDE_PLUGIN_ROOT}/references/assignment.md` now as well.

This skill loads no route map. Steps 1 to 4 use only what a person using the product could see. The code comes in at step 5.

## 1. Frame

- Write the complaint down in the owner's words. Keep their words through to the report. Note separately anything they said about how the product should feel: that is a design objective.
- Note how far the owner asked you to go: examine only, recommend a direction, or build an agreed improvement. That is the authorised scope.
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
- Capture each state at desktop and phone width (`ea capture <urls> --widths desktop,mobile`, `ea journey <spec> --screenshots` for states that need clicks, or the session's browser tools) and look at the images. Add a narrow width such as `560x900` when the product is used beside another app.
- After each step, fill one observation record (`walkthrough.md`): what the screen says it is for, what draws the eye first, what you would do next and why, what happened, and whether you could tell you were finished.
- Then take the hard turns on the same journey: arrive by a pasted link, go Back, leave halfway and return, reach an empty state, cause an error.
- A journey that stops at a step you could not complete ends there. Report the block; say nothing about the steps after it.

Last, put the captured screens side by side and look at them as one product, using "One product or several" in `walkthrough.md`.

## 4. Write what must be preserved

Before naming any problem, list the value and contracts a change must keep: what people can accomplish, each role's access, links people will have saved or shared, data and work in progress, density that practised users rely on, identity the owner chose on purpose. Record the value, and leave the surface that delivers it today free to change ("the ability to compare two records", and the comparison page itself only if something depends on that page). Each entry says who relies on it. Later steps check their recommendations against this list.

## 5. Read the code to settle what you saw

Open the source only for questions the pass raised: is the second navigation a phone layout of the first, does that separate page protect a permission, is the empty state missing or unreachable. Use `ea map` and the layer playbooks under `${CLAUDE_PLUGIN_ROOT}/references/layers/` as Diagnose does. An observation the code explains gets its cause. When the code appears to contradict what the browser did, keep the observation as it happened and record the disagreement as something to investigate: the deployment, stored state, a redirect or the revision may differ.

## 6. Develop the direction, job by job

Read `${CLAUDE_PLUGIN_ROOT}/references/levels.md` in full before writing any verdict; the report is incomplete without a direction statement and an evidence status for each job.

1. Write the **direction statement**: what using the improved product should be like, in two to four sentences specific to this product.
2. For each job, recommend the intervention with the strongest justified benefit, and name its level (**leave**, **repair**, **clarify**, **recompose**, **restructure**, **reconceive**) as a description of its size. Say whether it answers a demonstrated problem or a design objective.
3. Give each verdict an evidence status: established, supported, or not established. A concern you could not reproduce is "not established", with what would test it.
4. Say how each preserved item survives, and name the smaller and larger alternatives you rejected and what each would give up.
5. Separately, name the first step worth building. It can be much smaller than the direction.

## 7. Report

The output folder is `.experience-architecture/<YYYY-MM-DD>-<slug>/` at the app root, or the artifacts location the project's CLAUDE.md or AGENTS.md names. Use it even when the session offers a scratch folder: the owner must be able to find the report beside the app. Write `<output-dir>/walkthrough.md`:

1. **The read**, in three to six plain sentences: what using the product is like now, what it should become, and the first change worth making.
2. **Product brief** and the direction statement.
3. **What must be preserved.**
4. **Jobs**, most affected first: the recommendation described as what using it would be like afterwards, its level and evidence status, the observations behind it with captures, and what would change your mind.
5. **Not looked at**, and why.
6. **Evidence record**: the observation records with their labels.

Run `ea refs <output-dir>/walkthrough.md --root .` when the report cites code.

In chat, follow "Talking to the owner" in `evidence.md`: the read, the one decision you need, the report path. Write it plainly; the labels live in the evidence record.

## 8. Carry on, or stop

- **The owner asked only to examine or be walked through it:** stop here. Offer the next stage in one line.
- **The owner asked for the product to be improved:** continue as `${CLAUDE_PLUGIN_ROOT}/references/assignment.md` describes, in this same conversation, using what is already known. Ask only for the decision that is theirs: the direction, when it changes what the product is.

## Rules

- This skill changes no application source, configuration or tests, and no real customer data. It writes reports and captures to the output folder. Throwaway prototypes go in the output folder too, never in the app's source folders. These are instructions to you; the host's own permission settings are what enforce them, so say so if the session would let you write where you should not.
- A walkthrough by an agent is an inspection of the product. Describe it as that, and describe people only where a person was observed.
- Evidence is tasks and screens. Give verdicts in words.
- An ambitious direction with a small first step, and "this works; leave it", are both complete answers. Size the report to what you found.
