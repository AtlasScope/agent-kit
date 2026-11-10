# Performance: holding the frame rate

A frame has 16.7ms at 60Hz and 8.3ms at 120Hz. An animation that misses frames is worse than no animation, because the user sees the miss every time.

## What each property costs

The browser does up to four things per frame: recalculate style, lay out, paint, composite. An animation is cheap when it skips the middle two.

| Cost | Properties | Notes |
|---|---|---|
| **Composite only** | `transform`, `translate`, `scale`, `rotate`, `opacity` | Can run off the main thread. Keeps moving while scripts are busy. The default choice |
| **Often composite** | `filter`, `backdrop-filter`, `clip-path` | Engine-dependent, and the effect itself can be expensive. Blur cost grows with radius and area |
| **Paint** | `color`, `background-color`, `border-color`, `box-shadow`, `border-radius`, `outline`, gradients | Fine on small elements. Measure on anything large |
| **Layout** | `width`, `height`, `top`, `left`, `right`, `bottom`, `inset`, `margin`, `padding`, `gap`, `font-size`, `line-height`, `border-width`, grid and flex sizing | Recomputes positions for the element and often its neighbours, every frame |

Swaps that keep the look and drop the cost:

| Instead of animating | Animate |
|---|---|
| `top`, `left` | `transform: translate()` |
| `width`, `height` of a box that only looks bigger | `transform: scale()`, with children counter-scaled or excluded |
| `box-shadow` | `opacity` of a pseudo-element that carries the larger shadow |
| `height` to reveal content | `clip-path: inset()` when nothing below needs to move; a grid row when it does |
| Position after a layout change | FLIP: measure, change once, animate the difference with transform |
| A large blur | A pre-blurred image, or a smaller radius on a smaller layer |

Layout animation is acceptable when content below really has to move (an accordion) and the affected subtree is small. Say so in the spec line, and measure it.

## What takes an animation off the fast path

- Driving it from `requestAnimationFrame` or a JavaScript library value. It then needs the main thread on every frame.
- Animating a custom property that a transform reads.
- Changing `left`/`top` alongside the transform.
- Reading layout (`offsetHeight`, `getBoundingClientRect`) inside the frame loop after writing styles. Read everything first, then write.
- A scroll or pointer handler that sets state in a framework and re-renders a tree.

## Layers

Promoting an element to its own layer makes moving it cheap and costs memory.

- The browser promotes automatically for running transform and opacity animations.
- `will-change: transform` promotes ahead of time. Add it just before a heavy animation and remove it after. On many elements at once it exhausts GPU memory on phones, which looks like flicker or blank tiles.
- Text on a promoted layer can render slightly differently. If type shifts weight at the start or end of an animation, that is why.
- `contain: layout paint` (or `content`) on an animated component tells the browser its changes cannot affect the rest of the page.

## Measuring

1. **The filmstrip's real-time run.** `node <skill-dir>/scripts/filmstrip.mjs <url> --do '<action>' --perf` reports frames produced, frames over 25ms, and how many layouts and style recalculations ran, at a 4× CPU slowdown.
   - A transform-and-opacity animation should show a handful of layouts at most. A count near the frame count means something is laying out every frame.
   - Compare against a run of the same page with no action to see the idle baseline.
2. **The property table.** The filmstrip's "What moved" list labels each animation `compositor`, `paint` or `LAYOUT`.
3. **The browser's performance panel**, when the user can run it: record the interaction with CPU throttling, and look for long tasks and purple (layout) bars under the animation.

Limits: headless Chromium on this machine is not the user's phone. Numbers from the script show what kind of work happens, and they compare a before with an after. They do not certify a frame rate on a device. Say that under "Not checked".

## Symptoms

| What the user sees | Usual cause | Fix |
|---|---|---|
| Stutters throughout | A layout property is animating, or JavaScript is driving it while the main thread is busy | Swap to transform and opacity; move it to CSS or the Web Animations API |
| Stutters only at the start | Layer creation, image decode or a large first paint when the animation begins | Promote just before (`will-change`), decode images ahead, render the element before it is needed |
| Smooth on desktop, bad on phones | Blur or shadow over a large area, too many layers, or main-thread work a fast CPU hides | Shrink the effect's area, drop the blur on small screens, test with the CPU slowdown |
| Flash of the final state before it animates in | The starting style is applied by script after first paint, or keyframes with a delay lack `backwards` | Put the starting state in CSS; `animation-fill-mode: backwards`; `@starting-style` |
| Jumps at the end | The animation's last frame differs from the element's real style | Omit the final keyframe so it ends on real styles; set the real style before the animation ends |
| Jumps when interrupted | Keyframes restarted from the beginning | Use a transition or a spring, which continue from the current value |
| Exit never plays | The element is removed from the DOM immediately | Presence handling, `allow-discrete`, or wait for `finished` before removing |
| Flickers on hover | The element moves out from under the pointer, ending the hover | Put the hover target on a still parent and move a child |
| Text goes blurry or changes weight while moving | Fractional scale or position on a promoted layer | End on whole pixels and scale 1; remove `will-change` afterwards |
| One-pixel shake at rest | Sub-pixel end position | Round the final translate |
| Scrolling stutters when the effect is on | A scroll listener does layout or re-renders | Scroll-driven animation or `IntersectionObserver`; passive listeners; no state updates per scroll event |
| Content below jumps | Something animating changed size in flow, or an image loaded without dimensions | Reserve the space; animate transform; give media a width and height |
| Animation replays unexpectedly | The component remounted (unstable key, parent re-created) | Stabilise keys and component identity |
| Sluggish everywhere, nothing obviously wrong | Durations are simply too long, or an `in` or default `ease` curve delays the start | Shorten to the token scale; use `out` |

The last row is the most common "performance" complaint that is not a performance problem. Check the values before profiling.

## Budgets worth stating in MOTION.md

- No animation runs layout on more than a small subtree.
- No more than about a dozen elements animate at once on a phone.
- `backdrop-filter` and blurs above 8px stay under about a third of the viewport, and never animate their radius.
- Motion libraries load only on the routes that use them.
