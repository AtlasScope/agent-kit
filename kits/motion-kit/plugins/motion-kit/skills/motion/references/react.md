# React

## Choose the tool

| Need | Use |
|---|---|
| A state change toggles a class or attribute (open, pressed, selected, `data-state`) | CSS transition ([web.md](web.md)). No library |
| An element must animate out before React removes it | The component library's own presence handling, or Motion's `AnimatePresence` |
| Things move because the layout changed (reorder, expand, shared element) | Motion's `layout` and `layoutId`, or view transitions |
| Drag, swipe, velocity, interruptible springs | Motion |
| A long authored timeline or a pinned scroll scene | GSAP, if the project has it |
| A designer-made illustration animation | Lottie or Rive, lazy loaded |

Use what is installed. Read `package.json` first. Do not add a motion library to animate one dropdown.

API names below are from memory of the libraries' documented surface. Check the installed version's docs before using an option you have not seen in this codebase.

## CSS first, with headless components

Headless libraries expose state as attributes. Style those.

```css
.popover { opacity: 0; transform: scale(0.97); transition: opacity var(--motion-fast) var(--ease-out), transform var(--motion-fast) var(--ease-out); }
.popover[data-state="open"] { opacity: 1; transform: none; }
```

- **Radix** keeps a closing element mounted while a CSS animation runs on it, by listening for `animationend`. Write the exit as `@keyframes` on `[data-state="closed"]`. It also sets `--radix-*-content-transform-origin`; use it as the `transform-origin` so content grows from its trigger.
- **Base UI** marks the first and last frames with `data-starting-style` and `data-ending-style`, which work with plain transitions.
- **React Aria** exposes `data-entering` and `data-exiting`.

Server-rendered content should be visible in the HTML. An entrance that depends on JavaScript setting `opacity: 0` first will flash or, if the script fails, never show. Prefer CSS keyframes without a `to` frame for anything above the fold.

## Motion

The package is `motion`; React components import from `motion/react`. Older projects have `framer-motion` with the same API. In files that are server components by default, add `"use client"` or import from `motion/react-client`.

```tsx
import { motion, AnimatePresence, MotionConfig } from "motion/react";

<AnimatePresence initial={false}>
  {open && (
    <motion.div
      key="panel"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.12 } }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    />
  )}
</AnimatePresence>
```

Durations are in seconds.

### Presence

- `AnimatePresence` must stay mounted while its child leaves. Put it outside the condition, never inside the component that unmounts.
- Each direct child needs a stable `key`. An index key makes the wrong element animate out.
- `initial={false}` on `AnimatePresence` skips the entrance for things already present on first render.
- `mode="wait"` finishes the exit before the entrance starts (a swap in place). `mode="popLayout"` takes the leaving element out of flow so siblings can move at once (lists).

### Layout

```tsx
<motion.li layout transition={{ type: "spring", stiffness: 246.7, damping: 31.4, mass: 1 }} />
<motion.div layoutId="active-tab" />
```

- `layout` animates any size or position change with transform. One line replaces a hand-written FLIP.
- Because it scales, children and corner radii distort mid-flight. Use `layout="position"` when only position changes, add `layout` to children that must keep their shape, and set `borderRadius` in the `style` prop so Motion can correct it.
- `layoutId` connects two different elements: the tab indicator under whichever tab is selected, a card and its expanded view. Only one element with a given id is rendered at a time per `LayoutGroup`.
- Layout animation measures the DOM. Hundreds of `layout` elements on one screen will show up in the performance run.

### Springs

```tsx
transition={{ type: "spring", stiffness: 631.7, damping: 50.3, mass: 1 }}  // snappy, from <skill-dir>/scripts/spring.mjs
transition={{ type: "spring", stiffness: 247, damping: 31.4, mass: 1 }}  // smooth, from <skill-dir>/scripts/spring.mjs
```

Take stiffness and damping from the spring calculator. Motion also accepts `visualDuration` and `bounce`, but it converts them differently from SwiftUI (the same numbers give a spring about 20 percent slower), so the tokens would not match across platforms.

Motion's default for transforms is a spring with some bounce. Set the transition explicitly, or set a project default once:

```tsx
<MotionConfig reducedMotion="user" transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
  <App />
</MotionConfig>
```

`reducedMotion="user"` turns off transform and layout animation for people who asked for less motion and keeps opacity and color. Add it at the root of every project that uses Motion. `useReducedMotion()` gives the same answer as a boolean for cases that need different content.

### Gestures

```tsx
<motion.div
  drag="y"
  dragConstraints={{ top: 0, bottom: 0 }}
  dragElastic={0.2}
  onDragEnd={(_, info) => {
    const fast = info.velocity.y > 500;
    const far = info.offset.y > height / 2;
    if (fast || far) close();
  }}
  whileTap={{ scale: 0.97 }}
/>
```

- `whileTap` responds on pointer down. `whileHover` applies only on devices with hover.
- `info.velocity` is in pixels per second.
- For custom gestures, drive a motion value directly: `const y = useMotionValue(0)` in the `style` prop, updated from pointer events, then `animate(y, target, { type: "spring", velocity })` on release. Rules in [gestures.md](gestures.md).

### Values without re-renders

`useMotionValue`, `useTransform`, `useSpring` and `useScroll` update styles outside React's render cycle. Anything that changes every frame (a drag position, scroll progress, a pointer-following highlight) belongs in a motion value, not in `useState`.

```tsx
const { scrollYProgress } = useScroll();
<motion.div style={{ scaleX: scrollYProgress, transformOrigin: "left" }} />
```

### Sequences

```tsx
const list = { show: { transition: { staggerChildren: 0.03 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

<motion.ul variants={list} initial="hidden" animate="show">
  {items.slice(0, 8).map((i) => <motion.li key={i.id} variants={item} />)}
</motion.ul>
```

Cap the staggered set so the total stays inside the budget in [values.md](values.md).

### Cost

- `LazyMotion` with `domAnimation` and the `m` component loads a fraction of the library. Use it when Motion is on a landing page or a critical route.
- Transform, opacity, filter and clip-path animations can run on the compositor. Animating `width`, `height`, `top` or `left` through Motion runs on the main thread every frame.

## Common React defects

| Symptom | Cause |
|---|---|
| Exit never plays | The condition is above `AnimatePresence`, or the component returns `null` before its own exit |
| Animation replays on unrelated state changes | Unstable `key`, or a component defined inside another component so it remounts every render |
| Entrance plays twice in development | Strict Mode mounts effects twice. Confirm in a production build before fixing |
| Content flashes visible, then animates in | The initial state is applied by script after first paint. Put the initial style in CSS, or render it on the server |
| Whole list re-staggers when one item changes | The stagger is on the parent, which re-ran `initial`. Use `initial={false}` after first mount |
| Layout animation jumps when the page scrolls | The scroll container is not marked. Add `layoutScroll` to the scrolling ancestor |
| Janky drag | Position stored in `useState`. Move it to a motion value |

## GSAP

For timelines with many labeled beats and for pinned scroll scenes. Use `useGSAP` from `@gsap/react` with a `scope` ref so everything is cleaned up on unmount, and `gsap.matchMedia()` to branch on `(prefers-reduced-motion: reduce)`. GSAP's licence is its own, not MIT; check it suits the project.

## Lottie and Rive

Authored animation is content. Load it lazily, give it explicit dimensions, pause it offscreen, and replace it with a still frame under reduced motion. Rive's state machines suit interactive illustrations; Lottie suits linear ones.
