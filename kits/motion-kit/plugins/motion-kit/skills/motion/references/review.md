# Review: judging motion that exists

Review mode reads and reports. It changes nothing.

## Procedure

1. **Scope.** The whole product, one surface, or one component, as the user asked. Name what is left out.
2. **Inventory.** `node <skill-dir>/scripts/motion-scan.mjs <dir>`. Read the histograms before any single finding: how many durations and curves exist says whether there is a system at all.
3. **Standard.** MOTION.md if present. Otherwise the defaults in [values.md](values.md), and say that no project standard exists.
4. **Pick what to look at.** The interactions people meet most (navigation, the main list, the primary action), plus anything the inventory flagged as `fix`. Five interactions at most unless asked for more.
5. **Capture.** For each one: a filmstrip, a second with `--reduced`, and `--perf` when it animates layout or paint properties or covers a large area ([proof.md](proof.md)).
6. **Judge** each animation with the twelve checks.
7. **Report** in the order below.

## The twelve checks

Ask these of each animation. A "no" is a finding.

| # | Check | A "no" looks like |
|---|---|---|
| 1 | **Job.** Does it answer, connect, orient, wait, point or express? | Nobody would miss it. A reveal on body text. A hover that lifts everything |
| 2 | **Frequency.** Is its weight right for how often it is seen? | A 300ms fade on a tooltip. An animated command palette |
| 3 | **Response.** Does something visible change in the first frame after input? | An `in` curve or a delay on a click. Press feedback on release instead of on down |
| 4 | **Duration.** Does it fit the size and distance, on the token scale? | A small menu at 400ms. A full-height drawer at 120ms. A value that is not a token |
| 5 | **Curve.** Does the curve match what the element is doing? | Default `ease`. `linear` movement. `in` on an entrance. Bounce on something nobody threw |
| 6 | **Origin and direction.** Does it come from where it belongs and leave the way it came? | A menu scaling from its center. A sheet that rises from the bottom and exits to the right |
| 7 | **Interruption.** Triggered again mid-flight, does it redirect smoothly, and is input never blocked? | A restart from the beginning. Clicks ignored until it finishes |
| 8 | **Cost.** Transform and opacity, or a measured reason? | `height`, `top` or `margin` animating on a large subtree. `transition: all` |
| 9 | **Reduced motion.** Is there a version that keeps the meaning without the movement? | Same movement with the setting on. Or content that never appears |
| 10 | **Last frame.** Does it end exactly on the static design, and does the page work if it never plays? | A jump at the end. Content at `opacity: 0` when scripts fail |
| 11 | **Consistency.** Do the same kinds of thing move the same way everywhere? | Two dropdowns with different timings. Dialogs that enter three ways |
| 12 | **Company.** With others moving at once, is there one lead and is the total inside the budget? | Everything on the page animating in. A stagger that runs for a second |

Checks 1, 3, 9 and 10 decide whether something is broken. The rest decide whether it is good.

## Severity

| Level | Meaning | Examples |
|---|---|---|
| **Cut** | No job. Remove it | Decorative reveals on text, hover effects on dense rows, loops beside reading content |
| **Broken** | Harms or blocks people | Movement with no reduced-motion version on a large surface; input blocked during animation; content invisible if the animation fails; flashing; layout shift |
| **Wrong** | Has a job and fails at it | Wrong origin or direction; too slow for its frequency; restarts when interrupted; exit missing |
| **Rough** | Works, lacks finish | Off-token values; default curve; stagger slightly long; press feedback missing on one button |
| **Add** | A job nobody is doing | No press feedback anywhere; rows vanish on delete with no gap closing; route changes with no orientation |

## Report

```markdown
# Motion review: <scope>

Standard: <MOTION.md | skill defaults, no MOTION.md yet>
Inventory: <n> transitions, <n> keyframe sets, <n> springs. <n> distinct durations, <n> distinct curves. Reduced motion: <covered | partly | not handled>.
Looked at: <the interactions captured, with viewport>

## Cut
- <element>, <file:line>. <Why it has no job, one sentence.>

## Broken
- <element>, <file:line or frame>. <What a person experiences.>
  Should be: <spec line>

## Wrong
- …

## Rough
- …

## Add
- <where>. <The job going undone.>
  Should be: <spec line>

## What is already right
- <Two or three things to keep, so a later pass does not undo them.>

Measured: <numbers from the inventory and captures>
Not checked: <browsers, devices, gestures, states>
Feel it yourself: <two or three things only a person can judge>
```

Rules for the report:

- Every finding has a location and, unless it is a cut, a spec line for what it should be.
- Describe the effect on a person before the technical cause: "the menu feels late" and then "`ease-in` on open".
- Group repeated findings. "`transition: all` in 14 places" is one finding with a list.
- Ten findings that matter beat forty that are true. Rank within each level by how often the thing is seen.
- If the product's motion is fine, say so and stop. A review does not owe anyone a list.

## Finding where motion is missing

For the **Add** list, walk the main flows and ask at each state change:

- Did the user do something? Is it answered at once?
- Did something appear or go away? Is it clear where from and where to?
- Did the location change? Is it clear which way they went?
- Is anything loading for more than a second with no sign of it?
- Did something change that the user was not looking at?

Then discard every candidate that fails the frequency rule in [judgment.md](judgment.md). Most apps need five to ten animations done well.
