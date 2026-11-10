# MOTION.md: the project's motion system

Setup mode writes this file at the repository root, next to DESIGN.md if there is one. Every later `/motion` run reads it first and follows it over the defaults in this skill. Keep it under about 120 lines. It records decisions; the reasoning lives in the references.

## Before writing it

1. Run `node <skill-dir>/scripts/motion-scan.mjs`. The duration and easing histograms are the raw material.
2. Read PRODUCT.md and DESIGN.md for who uses the product and how it should feel.
3. Map what exists onto tokens. Show the mapping and get a yes:

```text
Existing            → Token
100, 120, 150ms     → fast (120ms)
175, 200, 250ms     → base (200ms)
300, 350ms          → slow (320ms)
450, 500, 700ms     → scene (450ms), or cut: see list
ease, ease-in-out   → out, except tab indicator and reorder → in-out
ease-in (4 places)  → out; none of them leave the screen
```

4. Ask only what the files cannot answer: the register for each kind of surface, and whether the product has brand moments.

Writing MOTION.md does not change any animation. Migrating existing code to the tokens is a separate, reviewable change.

## Template

```markdown
# Motion

How this product moves. Read by people and by coding agents before adding or changing any animation.
Last reviewed: <date>.

## Register

| Surface | Register | Notes |
|---|---|---|
| App (signed in) | Quiet | Used all day. Nothing bounces |
| Marketing pages | Expressive | Hero sequence and scroll reveals allowed |
| Onboarding | Fluid | Three steps, each with one lead element |

## Tokens

Defined in `<path to token file>`.

| Token | Value | For |
|---|---|---|
| `--motion-instant` | 80ms | Hover, press, focus |
| `--motion-fast` | 120ms | Small elements, exits |
| `--motion-base` | 200ms | Popovers, menus, toasts |
| `--motion-slow` | 320ms | Dialogs, drawers, sheets |
| `--motion-scene` | 450ms | One beat of a sequence |
| `--ease-out` | cubic-bezier(0.22, 1, 0.36, 1) | Entering and answering. Default |
| `--ease-in-out` | cubic-bezier(0.65, 0, 0.35, 1) | Moving between two on-screen states |
| `--ease-in` | cubic-bezier(0.4, 0, 1, 1) | Leaving the screen only |
| `spring.snappy` | duration 0.25, bounce 0 | Presses, toggles |
| `spring.smooth` | duration 0.4, bounce 0 | Sheets, layout changes, drag release |

Enter offset 8px. Popover scale from 0.97. Press scale 0.97. Stagger 30ms, at most 8 items.

## Rules for this product

- <What never animates here: for example, table rows, anything in the editor canvas.>
- <Direction mapping: for example, deeper pages enter from the right; sheets rise from the bottom.>
- <Library: for example, CSS for state changes; Motion only for drag and layout.>
- <Budgets: for example, no backdrop blur on phones.>

## Patterns in use

One spec line per pattern. Components follow these; a new pattern is added here first.

- popover connect: opacity 0 → 1 + scale 0.97 → 1 · fast · out · origin at trigger · reduced: opacity only
- dialog orient: opacity 0 → 1 + scale 0.96 → 1 · base · out · reduced: opacity only, fast
- drawer orient: x -100% → 0 · slow · out · reduced: opacity only, fast
- toast point: opacity 0 → 1 + y 8px → 0 · base · out · reduced: opacity only
- <…>

## Reduced motion

Global safety net in `<path>`. Each pattern above names its own reduced version. <In-app switch: yes or no, and where.>

## Open questions

- <Anything undecided, with who decides.>
```

## Token files by stack

Put tokens where the project already keeps design tokens, in the form it already uses.

**CSS custom properties**

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

**Tailwind v4**

```css
@theme {
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
}
```

Durations stay as custom properties on `:root`, used as `duration-(--motion-base)`. In Tailwind v3, extend `transitionDuration` and `transitionTimingFunction` in the config.

**TypeScript, for Motion and other libraries**

```ts
export const duration = { instant: 0.08, fast: 0.12, base: 0.2, slow: 0.32, scene: 0.45 } as const; // seconds
export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  in: [0.4, 0, 1, 1],
} as const;
export const spring = {
  snappy: { type: "spring", visualDuration: 0.25, bounce: 0 },
  smooth: { type: "spring", visualDuration: 0.4, bounce: 0 },
  lively: { type: "spring", visualDuration: 0.45, bounce: 0.3 },
} as const;
```

**Swift**

```swift
enum Motion {
    static let fast = Animation.timingCurve(0.22, 1, 0.36, 1, duration: 0.12)
    static let base = Animation.timingCurve(0.22, 1, 0.36, 1, duration: 0.2)
    static let slow = Animation.timingCurve(0.22, 1, 0.36, 1, duration: 0.32)
    static let snappy = Animation.spring(duration: 0.25, bounce: 0)
    static let smooth = Animation.spring(duration: 0.4, bounce: 0)
}
```

One source of truth per stack. If CSS and TypeScript both need the values, generate one from the other or have the script check they match.

## Keeping it true

- A review that finds a value outside the tokens either fixes the code or adds the value to MOTION.md with a reason. It does not leave both.
- When the inventory shows more distinct durations than MOTION.md lists, the file is out of date or the code has drifted. Say which.
- Update "Last reviewed" only when a person has looked at the product moving.
