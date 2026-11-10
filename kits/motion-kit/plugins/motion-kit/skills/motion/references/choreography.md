# Choreography: more than one thing moving

Use this for a storyboard: a hero, a page entrance, onboarding, a scroll sequence, a completion moment. A single component animating on its own is in [patterns.md](patterns.md).

## Principles

**One lead.** Decide which element the eye should follow. It moves first, farthest or longest. Everything else supports it with less movement, later, or none. If two elements compete, the sequence has no subject.

**One direction.** Within one transition, things travel along the same axis and agree on which way is "in". Elements arriving from four sides look like a slideshow template.

**Structure decides direction.** Deeper in a hierarchy comes forward or from the right; back reverses it. A layer above the page rises from the edge it will return to. Once chosen, the mapping holds across the product.

**Overlap, don't queue.** Start the next beat before the previous one ends, usually at 50 to 70 percent through. Beats that wait politely for each other make a sequence feel twice its length.

**Out before in, briefly.** When content replaces content in the same place, the old leaves quickly (`fast`) and the new arrives as it goes. A full pause between them reads as a blank state.

**Fewer movers.** Three distinct movements in one transition is the practical ceiling. Group the rest and move each group as one thing, or leave it still.

**Hold still on purpose.** Persistent elements (navigation, a sidebar, a header) do not move during a transition. Their stillness is what makes the change legible.

**The sequence ends ready.** The first action the user can take is available before the last decorative beat finishes.

## Time budgets

| Sequence | Total | Beats |
|---|---|---|
| Component with a few parts (card with image, title, action) | Under 400ms | 2 to 3 |
| Page or view entrance inside an app | Under 500ms | 2 to 3 |
| Marketing hero | 800 to 1200ms | 3 to 5 |
| Onboarding step | Under 700ms per step | 2 to 4 |
| Completion moment | Under 1000ms | 2 to 3 |

The primary content is readable within the first 200ms of any sequence. If the budget is blown, cut beats before shortening durations.

## The storyboard

Write this and get a yes before building.

```markdown
## Storyboard: <name>

Register: <quiet | fluid | expressive>. Plays: <once per visit | every time | on scroll>. Total: <ms>.
Lead: <the element the eye follows>.

| # | Starts at | Element | Spec | Job |
|---|---|---|---|---|
| 1 | 0ms | Headline | opacity 0 → 1 + y 12px → 0 · scene · out | express |
| 2 | 80ms | Subhead | opacity 0 → 1 + y 8px → 0 · slow · out | express |
| 3 | 160ms | Primary button | opacity 0 → 1 · base · out | point |
| 4 | 240ms | Product image | opacity 0 → 1 + scale 0.98 → 1 · scene · out | express |

Interactive at: 160ms (the button is clickable as soon as it appears).
Reduced motion: everything visible at 0ms; the image fades in over fast.
If nothing plays: all four elements are in the page HTML at full opacity. The animation is added by a class set in the first frame.
Interrupted: scrolling or clicking during the sequence jumps every beat to its end state.
Cost: transform and opacity only. Image has explicit width and height so nothing shifts.
```

Every row uses the spec-line notation. Every row has a job; a beat whose job is "express" three times in a row is a candidate to cut.

## Checks before building

- **Still frames.** Imagine frames at 0, 25, 50, 75 and 100 percent. Each should look like a deliberate layout, with nothing overlapping text or half-clipped. After building, the filmstrip shows these frames for real.
- **Squint.** With detail blurred, is it obvious what moved and where it ended up?
- **Second visit.** Would this be welcome the tenth time? If the answer is no, it plays once and is remembered (session storage, or a flag on the user).
- **Slow device.** If frames drop, does the sequence still land in the right end state at the right time? Time-based animation does. Frame-counted animation does not.
- **Skip.** Any sequence over about a second that sits before content needs a way past it: scroll, click or a key.

## Scroll sequences

Two kinds, with different rules.

**Triggered by scroll.** The element plays its own timed animation once when it enters the viewport. Budget it like any entrance. Trigger when a meaningful part is visible (15 to 25 percent), not at the first pixel.

**Linked to scroll.** Progress follows the scroll position, forward and back. The user is the clock, so there is no duration and the curve is `linear` relative to scroll.

- The page still scrolls at the speed the user set. Do not smooth, hijack or snap it for effect.
- A pinned section holds for at most about two screen heights, and shows how much is left.
- Use few layers at close speeds. A background at 0.85 of scroll speed gives depth. Layers at 0.3 and 1.5 give nausea.
- Text that must be read is fully visible and still for most of its time on screen.
- On touch devices test with a real flick. Scroll-linked effects that look fine with a wheel can lag a finger.
- Provide the whole experience as a plain stacked page under reduced motion.

## Continuity between views

When the same object exists before and after a change, it should not disappear and reappear.

1. **Morph** it (shared element) when its identity matters: a photo, a card, a selected item.
2. **Keep it in place** when it is chrome.
3. **Crossfade** when the two views share nothing.
4. **Cut** when the change is frequent or made from the keyboard.

Pick the highest option that is honest. Morphing between two things that are not the same object is a lie the user has to unlearn.
