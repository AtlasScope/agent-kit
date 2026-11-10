# Accessibility: motion that is safe for everyone

Movement on a screen can cause dizziness, nausea and headaches for people with vestibular disorders, and distraction for many more. Operating systems let people ask for less of it. Honouring that request is part of building the animation, done in the same change.

## What "reduce" means

Reduced motion asks for less movement. It does not ask for a broken or abrupt interface. Keep whatever told the user something; change how it is told.

| Keep | Replace with a fade or an instant change | Remove |
|---|---|---|
| Color and opacity changes | Slides, drawers, sheets, page transitions | Parallax |
| Press and focus feedback | Scale and zoom on dialogs and popovers | Scroll-linked scenes and pinning |
| Progress bars and determinate indicators | Shared-element morphs | Autoplaying loops and background video |
| Movement the user causes directly (dragging, scrolling) | Layout animations (reorder, expand) | Spinning, bouncing, shaking |
| Short crossfades, `fast` or under | Staggered entrances (show all at once) | Smooth scrolling triggered by code |

The triggers to take most seriously: movement across a large part of the screen, zooming, rotation, layers moving at different speeds, and anything that keeps moving without the user doing anything.

## Writing it

Global safety net, once per project. It catches whatever individual components forget:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This makes everything instant, which is safe and crude. It is the floor. The better result is a designed alternative per component:

```css
.drawer { transform: translateX(-100%); transition: transform var(--motion-slow) var(--ease-out); }
.drawer[data-open] { transform: none; }

@media (prefers-reduced-motion: reduce) {
  .drawer { transform: none; opacity: 0; transition: opacity var(--motion-fast) linear; }
  .drawer[data-open] { opacity: 1; }
}
```

For decorative motion, write it inside `@media (prefers-reduced-motion: no-preference)` so the reduced case is simply the absence of it.

In script:

```js
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
if (!reduce.matches) startDecorativeLoop();
reduce.addEventListener("change", onPreferenceChange);
```

Per platform:

- **Motion (React):** `<MotionConfig reducedMotion="user">` at the root; `useReducedMotion()` where content differs.
- **View transitions:** skip `startViewTransition` when the query matches, or set `::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }` under the media query.
- **Scroll-driven animations:** wrap them in `no-preference`.
- **Tailwind:** `motion-reduce:` and `motion-safe:` variants.
- **SwiftUI:** `@Environment(\.accessibilityReduceMotion)`.
- **React Native:** Reanimated's `useReducedMotion()`.
- **Lottie, Rive, video:** show a still frame and offer a play control.

Every spec line ends with `reduced: …`. If you cannot say what the reduced version is, the animation is not finished.

## Beyond the system setting

- **Pause, stop, hide** (WCAG 2.2.2, level A). Anything that starts on its own, lasts more than five seconds and sits beside other content needs a control to pause or hide it. That covers carousels, tickers, animated backgrounds and looping illustrations.
- **Flashing** (WCAG 2.3.1, level A). Nothing flashes more than three times in a second. Avoid large high-contrast flashes entirely.
- **Animation from interactions** (WCAG 2.3.3, level AAA). Motion triggered by interaction can be turned off unless it is essential. Honouring the system setting meets this.
- **Timing** (WCAG 2.2.1, level A). A toast that disappears on a timer needs enough time to be read, pauses on hover and focus, and anything important stays until dismissed.
- **Gestures** (WCAG 2.5.1 and 2.5.7). Every drag or swipe has a single-pointer or keyboard alternative. See [gestures.md](gestures.md).
- **An in-app switch** is worth adding where motion is heavy (a marketing site with scroll scenes, a game-like app), because many people do not know the system setting exists.

## Focus and assistive technology

- Move focus when the state changes, not when the animation ends. A dialog takes focus as it opens.
- Announce changes (`aria-live`, role `status` or `alert`) at the moment of the change.
- An element that is animating out must not still receive focus or clicks: set `inert` or remove it from the tab order at the start of the exit.
- An element hidden by `opacity: 0` or moved offscreen is still read and focusable. Hide it properly at rest (`display: none`, `visibility: hidden`, `hidden`, `inert`).
- Do not animate the focus ring itself. It appears immediately.

## People who are reading

- Nothing moves in the reader's peripheral vision while they read: no looping badges beside body text, no auto-advancing carousels above an article.
- Text that is appearing must become fully readable quickly and then stay still.
- Blinking and pulsing to demand attention are limited to one element, and they stop after a few cycles.

## Checking

Run the filmstrip twice: once as normal, once with `--reduced`. In the reduced run, the "What moved" list should show opacity and color only, the frames should show the end state arriving at once or by a short fade, and the script prints a warning when movement is still present. Then confirm by hand that the interface still explains itself: the user can still tell what opened, where it came from and how to close it.
