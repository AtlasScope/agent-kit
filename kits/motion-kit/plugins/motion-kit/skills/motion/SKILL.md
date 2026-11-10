---
name: motion
description: Use only when the user explicitly invokes /motion or $motion. One command for interface motion on the web, in React, SwiftUI and React Native. From a plain request it sets up a project's motion system (MOTION.md and tokens), storyboards a sequence before code, builds an animation, reviews existing motion, or fixes motion that stutters, flickers or feels wrong. It measures before it judges, with a code inventory and frame-by-frame captures from a real browser. Ordinary talk about animation must not activate it.
disable-model-invocation: true
metadata:
  short-description: Design, build, review and fix interface motion
  author: AtlasScope/agent-kit
---

# Motion

The user types `/motion` and what they want in their own words. They get motion that has a reason to exist, uses the project's own values, holds its frame rate, and has a version for people who asked their system for less movement. They also get evidence: numbers from the code and frames from a browser.

You cannot watch an animation. Work from what you can measure and see as stills, and say plainly what only a person can feel.

## Pick the mode

Match their words to one mode. Say which one in the first line. They never need to type the mode name; if they do (`/motion review …`), use that mode.

| They say something like | Mode | Files |
|---|---|---|
| "set up motion", "we have no motion system", "make our animations consistent" | **setup** | Writes MOTION.md and the token file after they approve the values |
| "plan the hero animation", "how should this page come in", "onboarding should feel alive" | **storyboard** | Writes a storyboard for approval. No code |
| "animate this", "add a transition", "make the sheet draggable", "this button feels dead" | **build** | Edits code |
| "review our animations", "is this motion any good", "where should things move" | **review** | Report only |
| "it stutters", "it flickers", "the exit doesn't play", "it feels slow, off, cheap" | **fix** | Diagnoses first, then edits |
| `/motion` alone | **status** | Report only |

If the request fits two modes that do different things to files (a review or a fix?), ask the one question that separates them and stop. A request to make one screen "feel better" is **review** scoped to that screen.

## Rules that hold in every mode

1. **Every animation has a job.** Answer, connect, orient, wait, point or express ([references/judgment.md](references/judgment.md)). If you cannot name the job in four words, cut the animation.
2. **How often sets how much.** Something seen a hundred times a day gets little or nothing. Something seen once can take its time.
3. **Respond in the same frame as the input.** Motion may finish later; it may not start later. Nothing blocks the next input.
4. **Use the project's values.** Durations, curves and springs come from MOTION.md. With no MOTION.md, use the defaults in [references/values.md](references/values.md) and offer setup.
5. **Move with transform and opacity.** Anything else needs a measured reason ([references/performance.md](references/performance.md)).
6. **If it can be triggered again mid-flight, it must redirect from where it is.** Transitions and springs do. Keyframes restart.
7. **Write the reduced-motion version in the same change.** Keep the meaning, drop the movement ([references/accessibility.md](references/accessibility.md)).
8. **The last frame is the design.** With the animation removed, on a slow device or with scripts off, the content is still there and correct.
9. **Evidence before opinion.** Run the inventory before reviewing. Capture frames before saying an animation is right. Report what you measured and what you did not.

## Spec lines

Describe every animation in one line, in reports, storyboards, MOTION.md and code comments. It makes a review checkable and a handoff exact.

```text
<element> <job>: <property> <from> → <to> [+ more] · <duration> · <curve or spring> · <origin or direction> · reduced: <what happens instead>
```

```text
popover connect: opacity 0 → 1 + scale 0.97 → 1 · base · out · from the trigger · reduced: opacity only, fast
sheet orient: y 100% → 0 · spring smooth · follows the finger · reduced: opacity only, fast
```

## Modes

### Status

Run the inventory (`<skill-dir>/scripts/motion-scan.mjs`), read MOTION.md if it exists, and reply with: what moves today in three or four numbers, whether reduced motion is handled, and the three most valuable next moves, each as a `/motion …` line they can copy. Then stop.

### Setup

1. Read PRODUCT.md, DESIGN.md, AGENTS.md or CLAUDE.md, and the token or theme files. Run the inventory.
2. Choose a register for each kind of surface (quiet, fluid, expressive) from [references/judgment.md](references/judgment.md). Ask only what the code and docs cannot answer, two questions at most: which register fits, and whether there are brand moments.
3. Propose the values: the inventory's sprawl mapped onto four durations, three curves and up to three springs, with which existing values fold into which token. Show it as a table and wait for a yes.
4. Write MOTION.md from [references/motion-md.md](references/motion-md.md) and the token file in the form the project already uses. Do not migrate existing animations in this mode; list them as follow-up.

### Storyboard

For anything with more than two moving elements: a hero, a page entrance, onboarding, a scroll sequence, a success moment. Read [references/choreography.md](references/choreography.md). Produce the beat table (time, element, spec line, job), the total length, the reduced-motion version, and what the page looks like if nothing plays. Stop for approval. Build only after a yes.

### Build

1. Read the component, MOTION.md, and the pattern in [references/patterns.md](references/patterns.md). For anything dragged, swiped or thrown, read [references/gestures.md](references/gestures.md).
2. Write the spec lines first and show them. For a single small animation, continue in the same turn. For a sequence, that is a storyboard: stop for approval.
3. Choose the lightest tool that can do it: a CSS transition, then CSS keyframes, then the platform's newer features with a fallback, then the motion library the project already has. Do not add a library for one animation. Platform notes: [references/web.md](references/web.md), [references/react.md](references/react.md), [references/native.md](references/native.md).
4. Implement, with the reduced-motion version and the interrupted case.
5. Prove it ([references/proof.md](references/proof.md)): capture the filmstrip, look at the sheet, capture again with `--reduced`. Fix what the frames show.

### Review

Read-only. Read [references/review.md](references/review.md).

1. Run the inventory on the scope they named.
2. For the interactions that matter most (five at most unless they asked for all), capture filmstrips, normal and `--reduced`, with `--perf` where cost is in doubt.
3. Judge each animation against the twelve checks.
4. Report in this order: **Cut** (motion with no job), **Broken**, **Wrong**, **Rough**, **Add** (places a job is going undone). Every item has a file and line or a frame, a spec line for what it should be, and the reason in one sentence.

Lead with the cut list. Removing motion is the cheapest improvement and the one most reviews skip.

### Fix

1. Reproduce it. Capture the filmstrip with `--perf`, and at a phone viewport if they saw it on a phone.
2. Match the symptom in [references/performance.md](references/performance.md) ("Symptoms") or, for "feels wrong", run the twelve checks in [references/review.md](references/review.md) on that one animation.
3. Say the cause with the evidence, make the smallest change that removes it, and capture again to show the difference.

If you cannot reproduce it, say so, say what you tried, and ask for the device, browser and steps. Do not guess a fix.

## Scripts

All three ship in this skill's own `scripts/` folder. `<skill-dir>` below is the absolute path of the folder this SKILL.md was loaded from: the installed plugin or skills folder, never the project being worked on. Resolve it once and run the scripts by that full path. If the project has its own `scripts/motion-scan.mjs`, `filmstrip.mjs` or `spring.mjs`, that is a different file; do not run it in their place. They need Node 18 or later and install nothing.

| Script | What it gives you |
|---|---|
| `node <skill-dir>/scripts/motion-scan.mjs [dir] [--json]` | Inventory from source: every duration, curve, animated property and library, reduced-motion coverage, and the places worth a look with file and line |
| `node <skill-dir>/scripts/filmstrip.mjs <url> --do "click:<selector>" [--clip <selector>] [--reduced] [--perf] [--viewport mobile]` | Frames of one interaction stepped at equal intervals, a contact sheet to look at, what animated (properties, duration, curve, layout or compositor), and optional real-time frame and layout counts |
| `node <skill-dir>/scripts/spring.mjs --duration 0.4 --bounce 0.3` | One spring written for CSS `linear()`, Motion, SwiftUI and Reanimated |

`filmstrip.mjs` loads Playwright from the machine (global Node modules or `MOTION_PLAYWRIGHT_DIR`). It will not load a copy from the project unless you pass `--project-playwright`, because importing that copy runs the project's code in your process. Pass the flag only when the user owns or trusts the project; in a checkout from someone else, such as a pull request under review, leave it off. If it is missing, follow "Without the script" in [references/proof.md](references/proof.md). Never install a browser or a package for a proof.

## Harness

| | Claude Code | Codex | Cursor |
|---|---|---|---|
| Look at frames | Read `sheet.png` | View `sheet.png` | View `sheet.png` |
| No Playwright | Browser tools with the scrub snippet in `references/proof.md` | Same | Same |
| Show the user | Publish `sheet.html` as an artifact with its frames when they asked for a review, or give the path | Give the path | Give the path |

## Boundaries

- Invoking `/motion` authorizes the mode's file changes and nothing else. No commits, pushes, deploys or new dependencies without a yes.
- Project rules win. If MOTION.md, DESIGN.md or AGENTS.md says something different from the references here, follow the project and mention the difference once.
- Visual design, layout, color and copy are other skills' jobs. If the motion problem is really a layout problem (things move because the layout shifts), say so and stop at the diagnosis.
- Marketing-page spectacle (WebGL, 3D, video) is out of scope beyond choreography and performance advice.

## Output

First line: `Mode: <mode>. <What you will do and what it does to files, in one sentence.>`

End every build, review and fix with:

```text
Measured: <what the inventory and frames showed, in numbers>
Not checked: <browsers, devices, gestures and states you could not run>
Feel it yourself: <two or three things only a person can judge, each as an action to try>
```

Plain English. Milliseconds and curve names only where the user needs to change them.
