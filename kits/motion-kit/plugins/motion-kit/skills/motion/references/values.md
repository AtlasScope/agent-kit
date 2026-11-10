# Values: durations, curves, springs, distances

Defaults for a project with no MOTION.md. Once MOTION.md exists, it replaces this file's numbers; the reasoning still applies.

## Durations

Four tokens cover an interface. A fifth exists for sequences.

| Token | Default | Use for |
|---|---|---|
| `instant` | 80ms | Hover and press color, focus changes, anything seen hundreds of times a day |
| `fast` | 120ms | Tooltips, toggles, checkboxes, menu highlights, exits of small things |
| `base` | 200ms | Popovers, dropdowns, accordions, toasts, most entrances |
| `slow` | 320ms | Dialogs, drawers, sheets, large panels, shared-element moves |
| `scene` | 450ms | One beat of a storyboarded sequence, a full-screen change |

How to pick within the scale:

- **Size and distance.** The more pixels change, the longer it takes. A tooltip and a full-height drawer should not share a duration.
- **Exits run at about two thirds of the entrance.** `base` in, `fast` out. `slow` in, `base` out.
- **Register.** Quiet uses the token as written or one step down. Expressive may go one step up.
- **Above 500ms** is for once-a-session moments and for motion the user drives directly, such as scroll-linked effects.
- **Under 100ms** a move is not seen as movement. Use it for color and opacity, where that is the point.
- **Phones.** Travel distances are a larger share of the screen, so sheets and page changes sit at `slow` even when the desktop equivalent is `base`.

Perception limits worth knowing: a response within about 100ms feels caused by the input; a wait under about a second keeps the user's train of thought; past that, show progress.

## Curves

| Token | CSS | Use for |
|---|---|---|
| `out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Anything entering or answering input. The default. Fast start, long soft landing |
| `in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Something that stays on screen and moves from one place or size to another |
| `in` | `cubic-bezier(0.4, 0, 1, 1)` | Something leaving the screen entirely, and only that |
| `linear` | `linear` | Opacity and color on their own, progress bars, constant rotation |

Why these:

- A response should begin at full speed, because the user is already waiting for it. `out` puts most of the change in the first third of the time.
- `in` starts slowly. Used for a response, it reads as lag. It only looks right when the element is accelerating away and will not be seen arriving anywhere.
- The browser's default `ease` is a mild in-out that nobody chose. Replace it wherever it appears.
- `out` is strong. If a Quiet surface finds it too eager on large elements, soften it to `cubic-bezier(0.25, 1, 0.5, 1)` and record that in MOTION.md.

Fades inside a movement share the movement's curve. A fade alone can be `linear` when it is under 150ms.

## Springs

A spring has no fixed duration. It is described by how long it looks like it takes and how much it bounces, and it carries velocity from whatever came before. `<skill-dir>/scripts/spring.mjs` converts one description into every platform's form.

| Token | Duration | Bounce | Use for |
|---|---|---|---|
| `snappy` | 0.25s | 0 | Presses, toggles, small things settling |
| `smooth` | 0.4s | 0 | Sheets, drawers, layout changes, anything released from a drag |
| `lively` | 0.45s | 0.3 | Something the user threw or dropped, and Expressive moments |

Use a spring when:

- the user's finger or pointer set the starting velocity (drag, swipe, flick);
- the animation can be redirected mid-flight and must not restart;
- a layout change moves things an unknown distance.

Use a curve when:

- a click or key press triggers a short fixed move;
- only opacity or color changes, since neither can visibly overshoot.

Bounce above 0 says "this had momentum". On something the user never touched, it reads as a toy. Bounce 0.3 passes the target by about 5 percent and 0.5 by about 16 percent.

## Distance and scale

| Situation | From |
|---|---|
| Small element entering (tooltip, menu, toast) | 4 to 8px offset in the direction it comes from, with opacity 0 |
| Larger panel entering (dialog, card) | 8 to 16px offset or scale 0.96 to 0.98, with opacity 0 |
| Something that lives offscreen (drawer, sheet, page) | Its full width or height. This is the one case for long travel |
| Press feedback | Scale 0.97 to 0.98. Never below 0.95 |
| Hover lift | 1 to 2px, or a shadow change. One of them |

Scale from the point the thing is attached to. A menu opened from a button at the top right has `transform-origin: top right`. A dialog with no trigger scales from its center.

## Stagger

- 20 to 40ms between items.
- The whole stagger finishes within about 250ms, however many items there are. Past the first six to eight, the rest arrive together.
- Order follows reading order, or spreads from the thing that triggered it.
- Only on first appearance. Filtering, sorting and paging do not re-stagger.
- Never on content the user asked for and is waiting to read.

## Delay

- Hover intent: a tooltip waits 300 to 500ms before its first appearance, then shows the next ones immediately while the pointer stays in the group.
- Loading indicators wait about 200ms before showing, so fast responses show none, and stay at least about 400ms once shown, so they do not flash.
- A delay before a response to a click or tap is a bug.

## Writing them down

Tokens go where the project already keeps design tokens. Shapes for each stack are in [motion-md.md](motion-md.md). In CSS:

```css
:root {
  --motion-instant: 80ms;
  --motion-fast: 120ms;
  --motion-base: 200ms;
  --motion-slow: 320ms;
  --motion-scene: 450ms;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
}
```
