# Motion Kit

One command, `/motion`, for how an interface moves. Type it with what you want in plain words. It picks one of five modes, says which, and starts.

| You type | What happens | Changes files |
|---|---|---|
| `/motion` | Reports how the project moves today and suggests three next steps | No |
| `/motion set up motion for this app` | Proposes one small set of durations, curves and springs from what the code already uses, then writes `MOTION.md` and a token file | After you approve |
| `/motion storyboard the hero entrance` | Plans a sequence beat by beat before any code | No |
| `/motion make the bottom sheet draggable` | Builds the animation, including the interrupted case and a reduced-motion version | Yes |
| `/motion review the checkout flow` | Lists motion to cut, then what is broken, wrong or rough, then where motion is missing | No |
| `/motion the sidebar stutters on my phone` | Reproduces it, names the cause with a measurement, fixes it | Yes |

It covers CSS and the web platform, React (CSS first, then Motion), SwiftUI and React Native. It runs only when you type it.

## What is different about it

An agent cannot watch an animation, so this kit gives it things it can check.

- **An inventory from the code.** `motion-scan.mjs` counts every duration, curve and animated property and lists the places worth a look, each with file and line. A product with twelve durations and seven curves has no system, and the count says so before anyone gives an opinion.
- **Frames from a real browser.** `filmstrip.mjs` triggers an interaction, pauses every animation the page starts and steps them forward in equal slices of time. The agent looks at the frames on one sheet and reads what moved: target, properties, duration, curve, and whether layout ran. A second run with reduced motion switched on shows what still moves.
- **One line per animation.** Every animation is written as a spec line (`popover connect: opacity 0 → 1 + scale 0.97 → 1 · fast · out · origin at trigger · reduced: opacity only`), so a review can be checked and a handoff is exact.
- **One file per project.** `MOTION.md` holds the product's durations, curves, springs and rules. Later runs follow it.
- **An honest ending.** Every build, review and fix ends with what was measured, what was not checked, and two or three things only a person can feel.

The judgment in the references is written for this kit: six jobs an animation can do, a rule tying how much something moves to how often it is seen, three registers (quiet, fluid, expressive), and a review that lists what to remove before anything else.

## Install

**Claude Code**

```sh
claude plugin marketplace add AtlasScope/agent-kit
claude plugin install motion-kit@agent-kit
```

**Codex**

```sh
codex plugin marketplace add AtlasScope/agent-kit
codex plugin add motion-kit@agent-kit
```

**Cloud Claude Code sessions.** Add `"motion-kit@agent-kit": true` under `enabledPlugins` in the repository's `.claude/settings.json`, alongside the `agent-kit` marketplace entry shown in the [main README](../../README.md#install).

**Any agent that reads skill folders.** Copy `plugins/motion-kit/skills/motion` into the agent's skills folder.

## The scripts on their own

They work without the skill. Node 18 or later, no dependencies to install.

```sh
S=kits/motion-kit/plugins/motion-kit/skills/motion/scripts

node $S/motion-scan.mjs src                    # inventory of a codebase
node $S/filmstrip.mjs http://localhost:3000 \
  --do 'click:#open-menu' --clip '[role=menu]' # frames of one interaction
node $S/filmstrip.mjs http://localhost:3000 \
  --do 'click:#open-menu' --reduced --perf     # with reduced motion, plus frame and layout counts
node $S/spring.mjs --duration 0.4 --bounce 0.3 # one spring for CSS, Motion, SwiftUI and Reanimated
```

`filmstrip.mjs` never installs anything. It loads Playwright from the machine's global Node modules or from `MOTION_PLAYWRIGHT_DIR`. It loads the project's own copy only when you pass `--project-playwright`, because importing that copy runs the project's code; use the flag in projects you own or trust. Without Playwright the skill falls back to the agent's own browser tools.

## Layout

| Path | What |
|---|---|
| `plugins/motion-kit/skills/motion/SKILL.md` | The command: modes, the rules that hold in all of them, the output format |
| `…/references/judgment.md` | Whether something should move, and how much |
| `…/references/values.md` | Default durations, curves, springs, distances, stagger |
| `…/references/patterns.md` | A spec for each common piece: buttons, menus, dialogs, sheets, lists, loading, navigation |
| `…/references/choreography.md` | Sequences and the storyboard format |
| `…/references/gestures.md` | Drag, swipe and throw |
| `…/references/web.md`, `react.md`, `native.md` | Platform notes |
| `…/references/performance.md` | Property costs, measuring, a symptom table |
| `…/references/accessibility.md` | Reduced motion and the WCAG criteria that apply |
| `…/references/motion-md.md` | The `MOTION.md` template and token files per stack |
| `…/references/review.md`, `proof.md` | The twelve checks, the report format, and how to read the captures |
| `…/scripts/` | `motion-scan.mjs`, `filmstrip.mjs`, `spring.mjs` |
| `…/tests/` | Tests and fixtures for the three scripts |

## Tests

```sh
node --test "kits/motion-kit/plugins/motion-kit/skills/motion/tests/*.test.mjs"
```

The filmstrip tests need Playwright with a browser and skip themselves without one. CI installs one outside the checkout and sets `MOTION_REQUIRE_BROWSER=1`, which turns a missing browser into a failure.

## What has and has not been tested

- The three scripts have tests that pass on Chromium, and the code samples in `references/web.md` were run through the filmstrip to confirm they animate as written.
- The skill text has not yet been run end to end by an agent on a real project. The SwiftUI and React Native notes were written from the platforms' documented APIs and not compiled here.
- Frame captures cover Chromium only. Native apps are out of reach of the scripts.

## Sources

The skill is original to Agent Kit and MIT licensed. Its technical claims rest on public specifications and platform documentation: the CSS Transitions, Animations, Easing and View Transitions specifications, the Web Animations API, WCAG 2.2, Apple's Human Interface Guidelines and SwiftUI documentation, and the Motion and Reanimated documentation. It was written without reading the bodies of the motion skills design-kit borrows from other authors; those remain available and credited in [design-kit](../design-kit/THIRD_PARTY.md).
