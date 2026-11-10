# Web: CSS and the platform

Reach for these in order. Stop at the first one that does the job.

1. A CSS transition on a class, attribute or pseudo-class change.
2. CSS keyframes, for sequences and things that play on their own.
3. Newer platform features (entry and exit styles, view transitions, scroll-driven animations), with a fallback.
4. The Web Animations API, when values are only known at run time.
5. A library the project already has ([react.md](react.md)).

## Support: check, do not remember

Safe to use without a fallback: transitions, keyframes, the Web Animations API, `linear()` easing, the individual `translate`, `scale` and `rotate` properties, and `prefers-reduced-motion`.

Check the project's browser targets (browserslist, the framework's defaults, or ask) and current support data before relying on: `@starting-style`, `transition-behavior: allow-discrete`, `overlay`, `interpolate-size`, view transitions (same-document and cross-document separately), scroll-driven animations, and anchor positioning. These shipped at different times in different engines. Write them so that an engine without the feature shows the end state with no animation, which is an acceptable result.

## Transitions

```css
.button {
  transition:
    background-color var(--motion-instant) linear,
    transform var(--motion-instant) var(--ease-out);
}
.button:active { transform: scale(0.97); }
```

- List the properties. `transition: all` animates whatever changes next year too.
- Give each property its own duration and curve when they differ. Color is often `linear`; movement is `out`.
- A transition redirects when its target changes mid-flight. That is why it is the right tool for hover, press, open and close.
- Put the transition on the base rule, not the state rule, unless enter and exit should differ. To make them differ, declare the exit timing on the base rule and the enter timing on the state rule: the rule that applies at the destination decides.

```css
.menu { opacity: 0; transition: opacity var(--motion-fast) var(--ease-out); }             /* timing used when closing */
.menu[data-open] { opacity: 1; transition-duration: var(--motion-base); }                 /* timing used when opening */
```

### Entering from `display: none`, and leaving to it

```css
[popover] {
  opacity: 0;
  transform: scale(0.97);
  transition:
    opacity var(--motion-fast) var(--ease-out),
    transform var(--motion-fast) var(--ease-out),
    display var(--motion-fast) allow-discrete,
    overlay var(--motion-fast) allow-discrete;
}
[popover]:popover-open { opacity: 1; transform: none; }
@starting-style {
  [popover]:popover-open { opacity: 0; transform: scale(0.97); }
}
```

`@starting-style` gives the browser a "before" for an element that just appeared. `allow-discrete` on `display` keeps the element rendered until the exit finishes, and `overlay` keeps it in the top layer. The filmstrip lists those two as `switch`: they flip once and cost nothing. The same shape works for `<dialog>` with `[open]`, and its `::backdrop`. Where unsupported, the element appears and disappears instantly.

### Height to and from auto

For small panels, animate a grid row. It works everywhere and needs no measuring:

```css
.panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--motion-base) var(--ease-out); }
.panel[data-open] { grid-template-rows: 1fr; }
.panel > div { overflow: hidden; min-height: 0; }
```

This does run layout on each frame, which is the cost of content below having to move. Keep it to accordions and disclosures. `interpolate-size: allow-keywords` lets `height: auto` transition directly where supported.

## Keyframes

Use for anything that plays through without input: a loading shimmer, a staged entrance, a shake.

```css
@keyframes rise { from { opacity: 0; transform: translateY(8px); } }

.item { animation: rise var(--motion-base) var(--ease-out) backwards; }
.item:nth-child(2) { animation-delay: 30ms; }
.item:nth-child(3) { animation-delay: 60ms; }
.item:nth-child(n + 4) { animation-delay: 90ms; }
```

- Leave out the `to` keyframe so the animation ends on the element's real styles. The last frame is then the design by construction.
- `backwards` holds the first keyframe during the delay, so staggered items do not flash at full opacity before their turn.
- Keyframes restart when retriggered. If the user can cause it twice in a row, use a transition.
- A component library that waits for `animationend` before unmounting (Radix does) needs its exit written as keyframes.

## Springs in CSS

`linear()` takes a list of points, which is enough to record a spring. Generate it; never type one by hand.

```sh
node scripts/spring.mjs --duration 0.4 --bounce 0.3
```

Paste the easing and the duration it prints. The recording cannot take a starting velocity or redirect smoothly, so it suits click-triggered moves. Gestures need a real spring.

## View transitions

The browser snapshots the old state, you change the DOM, and it animates between the two. Good for route changes, shared elements and list reordering without a library.

```js
function withTransition(update) {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduce) return update();
  document.startViewTransition(update);
}
```

```css
::view-transition-old(root),
::view-transition-new(root) { animation-duration: var(--motion-fast); }

.card[aria-current="true"] { view-transition-name: active-card; }
::view-transition-group(active-card) {
  animation-duration: var(--motion-slow);
  animation-timing-function: var(--ease-in-out);
}
```

- The default is a root crossfade. That alone is often the right page transition.
- A `view-transition-name` must be unique among rendered elements at the moment of capture. Set it only on the element taking part, usually just before the transition.
- The page does not respond to input while a transition runs. Keep it at `slow` or under.
- Between full page loads on the same origin: `@view-transition { navigation: auto; }` in both pages' CSS.
- Frameworks wrap this (React's `<ViewTransition>`, router options in Next.js, Astro, SvelteKit). Check what the installed version supports before hand-rolling.

## Scroll-driven animations

Progress comes from scroll position, off the main thread.

```css
@keyframes reveal { from { opacity: 0; transform: translateY(12px); } }
@keyframes grow { from { transform: scaleX(0); } }

@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal {
      animation: reveal linear both;
      animation-timeline: view();
      animation-range: entry 0% entry 60%;
    }
  }
}

.reading-progress {
  transform-origin: left;
  animation: grow linear both;
  animation-timeline: scroll(root);
}
```

- Declare `animation-timeline` after the `animation` shorthand, which resets it.
- Everything sits inside `@supports`, so other browsers show the content in place.
- A view-timeline reveal plays backward when scrolling up. For a reveal that plays once on a timer, use `IntersectionObserver` to add a class, then `unobserve`.

## Web Animations API

For values computed at run time: a FLIP move, a position from a pointer, a generated path.

```js
const anim = el.animate(
  [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "none" }],
  { duration: 200, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" }
);
await anim.finished;
```

- Runs on the compositor for transform and opacity, like CSS.
- Before starting a new one on the same element, read where the old one got to (`getComputedStyle`), cancel it, and start from there. Otherwise it jumps.
- Avoid `fill: "forwards"` as a way to hold the end state. Set the real style and let the animation end.

### FLIP for layout changes

Measure, change the layout, then animate the difference with transform:

```js
const first = el.getBoundingClientRect();
applyLayoutChange();
const last = el.getBoundingClientRect();
el.style.transformOrigin = "top left";
el.animate(
  [{ transform: `translate(${first.left - last.left}px, ${first.top - last.top}px) scale(${first.width / last.width}, ${first.height / last.height})` },
   { transform: "none" }],
  { duration: 200, easing: "cubic-bezier(0.65, 0, 0.35, 1)" }
);
```

Layout runs once. Scaling distorts children and corner radii, so move with translate alone when the size is unchanged, or counter-scale the children.

## Tailwind

- Name the properties: `transition-[opacity,transform]`, `transition-colors`, `transition-opacity`. Avoid `transition-all`.
- Durations and curves from tokens: define `--ease-out` and friends in `@theme` (v4) or `theme.extend.transitionTimingFunction` (v3), then `ease-out duration-200`, or reference a variable with `duration-(--motion-base)` in v4.
- `motion-reduce:` and `motion-safe:` variants map to the media query. `motion-safe:animate-…` is the safest default for anything decorative.
- `starting:` (v4) writes `@starting-style`.
- `animate-spin`, `animate-pulse`, `animate-ping` and `animate-bounce` run forever. Each needs a `motion-reduce:` counterpart.

## Small things that matter

- `:active` applies on pointer down. Use it for press feedback.
- Wrap hover motion in `@media (hover: hover)`.
- `will-change` only just before a heavy animation, removed after. Never in a base rule for many elements.
- Animating a custom property that feeds a transform runs on the main thread. Animate the transform itself.
- `transform` on an element creates a stacking context and changes what `position: fixed` children are fixed to. Check dropdowns and sticky headers inside animated containers.
- Give animated images and embeds explicit dimensions so nothing shifts when they load mid-animation.
