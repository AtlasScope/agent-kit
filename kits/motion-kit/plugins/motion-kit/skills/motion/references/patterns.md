# Patterns: the spec for each common piece

Each pattern gives its job, spec lines in the notation from SKILL.md, and the mistakes that are common for it. Token names (`fast`, `base`, `out`, `smooth`) are defined in [values.md](values.md) or the project's MOTION.md. Start from these and adjust to the register.

## Controls

### Button press

Job: answer.

```text
button answer: scale 1 → 0.97 · instant · out · from center · reduced: background color only
button release: scale → 1 · fast · out
```

- Start on pointer down, not on click. Click fires on release, which is too late.
- Color change on hover is `instant`. A hover that takes 300ms trails the pointer.
- No press scale on links in text, table rows or anything wider than about 400px. Scaling a wide element moves its edges several pixels.

### Toggle, checkbox, radio

Job: answer.

```text
switch thumb answer: x off → on · fast · out · reduced: instant
switch track: background-color · fast · linear
checkmark: stroke drawn 0 → 100% · fast · out · reduced: instant
```

- The state changes immediately. The animation shows the change; it does not delay it.
- A switch the user can drag follows the pointer and settles with `snappy`.

### Hover on cards and rows

Job: answer.

```text
card answer: translateY 0 → -2px or box-shadow rest → raised · fast · out · reduced: border-color only
```

- One property. Lift, scale and shadow together read as a template.
- Apply hover motion only where hover exists: `@media (hover: hover)`.
- Dense table rows change background color with no transition.

## Things that appear over the page

### Tooltip

Job: answer.

```text
tooltip in: opacity 0 → 1 + y 4px → 0 · fast · out · from the trigger side · reduced: opacity only
tooltip out: opacity → 0 · instant · linear
```

- First one waits 300 to 500ms. While the pointer stays within the same group, the next ones show with no delay and no animation.
- Never animate a tooltip that follows keyboard focus.

### Dropdown menu, select, popover

Job: connect.

```text
menu in: opacity 0 → 1 + scale 0.97 → 1 · fast to base · out · origin at the trigger corner · reduced: opacity only
menu out: opacity → 0 + scale → 0.98 · fast · out
```

- `transform-origin` is the corner or edge nearest the trigger. A menu that scales from its center looks unattached.
- A context menu opened at the pointer appears with no animation and fades out on dismiss. People open these fast and often.
- Submenus appear with opacity only.

### Dialog

Job: orient.

```text
dialog in: opacity 0 → 1 + scale 0.96 → 1 · base to slow · out · from center · reduced: opacity only, fast
backdrop in: opacity 0 → 1 · base · linear
dialog out: opacity → 0 + scale → 0.98 · fast · out
```

- Move focus into the dialog when it opens, not when the animation ends.
- A dialog that came from a specific element (an image, a card) is a shared-element move instead.
- The exit is shorter than the entrance and does not travel.

### Drawer and bottom sheet

Job: orient.

```text
drawer in: x -100% → 0 · slow · out · from its edge · reduced: opacity only, fast
sheet in: y 100% → 0 · spring smooth · follows the finger when dragged · reduced: opacity only, fast
sheet out: y → 100% · base · in, or the release velocity when thrown
```

- This is the case for `in` on exit: the element leaves the screen.
- A sheet the user can drag needs everything in [gestures.md](gestures.md): one-to-one tracking, velocity on release, rubber-banding at the top.
- The page behind may scale or dim slightly. It does not blur at full size on phones; that costs frames.

### Toast

Job: point.

```text
toast in: opacity 0 → 1 + y 8px → 0 · base · out · from its screen edge · reduced: opacity only
toast out: opacity → 0 · fast · linear
stack: y of older toasts → new offset · base · out
```

- Pause the dismiss timer on hover and on focus. Give enough time to read: about 4 seconds plus 1 for every 12 words.
- A toast that reports an error stays until dismissed.
- Announce it to assistive technology when it is added, not when the animation ends.

## Content that changes in place

### Accordion and disclosure

Job: connect.

```text
panel open: height 0 → auto + opacity 0 → 1 · base · out · reduced: instant
chevron: rotate 0 → 90deg · base · out
```

- This is the accepted exception to "no layout properties": the content below has to move. Keep the panel small, or use the grid-rows technique in [web.md](web.md).
- Content inside does not stagger.

### Tabs and segmented controls

Job: orient.

```text
indicator orient: x and width → the selected tab · base · in-out · reduced: instant
panel swap: opacity old → 0 · instant, then new 0 → 1 · fast · linear
```

- The indicator moves; the panels crossfade or swap. Sliding whole panels sideways is right only when the tabs are also swipeable.
- Switching by keyboard shortcut swaps with no animation.

### List: add, remove, reorder

Job: connect.

```text
row add: opacity 0 → 1 + height 0 → auto · base · out · reduced: opacity only
row remove: opacity → 0 · fast, then siblings close the gap · base · in-out
row reorder: siblings y → new position · base · in-out; dragged row follows the pointer
```

- Siblings moving to their new places is the valuable part. Use a layout animation (FLIP, `layout` in Motion, view transitions) and transform, so the list itself does not relayout on every frame.
- Do not animate rows on first load, on filtering or on pagination.
- For long lists, animate only rows on screen.

### Number and text changes

Job: point.

```text
count point: old digit y 0 → -100% + opacity → 0, new digit y 100% → 0 · base · out · reduced: instant
status text: opacity crossfade · fast · linear
```

- Use tabular figures so the width does not jitter.
- A number that changes many times a second updates with no animation.
- Count-up from zero belongs to Expressive surfaces, once.

### Form validation

Job: point.

```text
error message point: opacity 0 → 1 + height 0 → auto · fast · out · reduced: instant
field answer (wrong): x 0 → -4 → 4 → -2 → 0 · slow · linear between keyframes · reduced: border-color only
```

- A shake is allowed once per submit. It never repeats and never runs while the user types.
- Reserve the space for the error text if showing it would push the submit button.

## Waiting

### Loading

Job: wait.

```text
skeleton wait: background shimmer or opacity 1 → 0.6 → 1 · 1.5s · linear, infinite · reduced: static placeholder
content arrive: opacity 0 → 1 · fast · linear
spinner: rotate 360deg · 0.8s · linear, infinite · reduced: static icon with "Loading" text
```

- Wait about 200ms before showing any indicator. Once shown, keep it at least 400ms.
- A skeleton has the shape of what is coming. If the shape is unknown, use a spinner.
- When progress is known, show it. A bar that moves at a real rate beats any spinner.
- Content replaces its skeleton in place. Nothing jumps.

### Optimistic updates

Job: answer.

Apply the change at once, as if it succeeded. If the server refuses, reverse it with the same motion and say why. No spinner in between for actions that usually succeed in under a second.

## Navigation

### Page and route changes

Job: orient.

```text
forward orient: new page opacity 0 → 1 + x 16px → 0 · base · out; old page opacity → 0 · fast · reduced: opacity only
back orient: the reverse direction
same level: opacity crossfade · fast
```

- Most page changes in a web app are best with a crossfade under 200ms or nothing. Sliding whole pages suits phone-sized stacks.
- The direction has to match the structure every time. If forward sometimes comes from the right and sometimes fades, it teaches nothing.
- Keep shared chrome (header, sidebar) still. Only the content region changes.

### Shared element

Job: connect.

```text
thumbnail → hero connect: position and size morph · slow · in-out · reduced: crossfade, fast
surrounding content: opacity 0 → 1 · base · out, delayed 80ms
```

- One element makes the trip. The rest of the destination fades in after it lands or just behind it.
- Use view transitions on the web, `layoutId` in Motion, `matchedGeometryEffect` or zoom transitions in SwiftUI.
- If the two ends have different aspect ratios or crops, expect a visible stretch. Match them or crossfade.

## Scroll

### Reveal on scroll

Job: express, sometimes orient.

```text
section reveal: opacity 0 → 1 + y 12px → 0 · base to slow · out · once, when a fifth of it is visible · reduced: visible from the start
```

- Once per element. Scrolling back up does not replay it.
- Content is visible by default and the animation is the enhancement. A failed script must not leave a blank page.
- Headings, images and cards may reveal. Paragraphs of body text do not.
- If every section on a page does the same reveal, remove half of them.

### Scroll-linked

Job: orient or express.

```text
reading progress orient: scaleX 0 → 1 · tied to scroll position · linear · reduced: allowed, it is tied to their own input
parallax express: background y at 0.8 to 0.9 of scroll speed · reduced: none
```

- Never change how far or how fast the page scrolls.
- A pinned sequence holds for at most about two screen heights.
- Keep parallax ratios close to 1. Large differences are a common trigger for motion sickness.

## Moments

### Success after real work

Job: express.

```text
check express: circle stroke 0 → 100% · base · out, then check stroke 0 → 100% · fast · out, delayed · reduced: static icon
```

- For finishing something that took effort: a purchase, a setup, a long form. Saving a field does not qualify.
- It plays once and gets out of the way within about a second. The next action is available throughout.

### Hero entrance

Job: express. Storyboard it first ([choreography.md](choreography.md)).

- The headline is readable in the first frame or within 200ms. It never waits behind decoration.
- Three to five beats, under 1.2 seconds in total.
- It plays once per visit.

## Dragging

Covered in [gestures.md](gestures.md). In short: the dragged thing follows the pointer exactly with no easing, lifts slightly when picked up (scale 1.02 to 1.04 and a shadow, `fast`), and settles with a spring that starts at the release velocity.
