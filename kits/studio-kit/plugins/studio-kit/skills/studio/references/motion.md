# Motion studio

Build with `--modules motion` (or `button,palette,type,motion`). It designs how the interface moves: how movement feels, how long it takes, how things arrive, how a group arrives, how controls answer touch, page changes, loading and what happens under Less motion. Drawings are one small scene (a card, four rows, a button, a switch, two pages, a loader) that plays; tiles play when pointed at, and a still tile shows a trail of positions, a ghost of where things start or the curve. It paints the example page through `scene` and offers its values to other studios as `share().motion`.

## What the agent fills in: `PROJECT.motion`

```js
motion: {
  measured: true,                 // true only when `today` was read from the project's code
  today: { ease: 'out', dur: 200, enter: 'rise', seq: 'quick', stagger: 40, press: 'lift', bounce: 30, dist: 12, page: 'fade', load: 'shimmer', reduce: 'fade' },
  drop: [],                       // group ids to hide: feel speed enter seq press spring dist page load reduce
}
```

Every key is optional. Read the project's transition and animation durations, easing functions, keyframes, hover and press styles and its `prefers-reduced-motion` rules. Map each to the nearest id below; a duration or distance that is not on a tile is fine (it shows as "Today"). An easing that matches no id: pick the closest and add the exact curve under `MORE` if it matters.

## State keys

| key | meaning | values |
|---|---|---|
| ease | the curve movement follows | out, ease, snappy, even, inout, floaty, in, overshoot, anticipate, spring, bouncy |
| dur | base time for a movement, ms (touch is half, pages one and a half times) | 40 to 1200 (tiles 100 to 600) |
| enter | how things arrive | none, fade, rise, drop, slide, scale, blur, tilt, grow |
| seq | order a group arrives in | together, quick, cascade, slow, bottom, centre, edges |
| stagger | gap between items, ms | 0 to 300 (picking a seq sets it) |
| press | answer to hover and press | none, lift, press, liftpress, sink, glow, squash, grow |
| bounce | spring overshoot, % (only with ease spring) | 0 to 60 |
| dist | travel distance, px | 0 to 80 |
| page | page change | none, fade, dip, slide, push, rise, scale, shared |
| load | loading display | shimmer, pulse, spinner, dots, bar, none |
| reduce | what Less motion does | fade, none |

## What other studios and the page get

`share()`: `{ motion: { dur, durFast, durSlow, ease, easeOf, easeOut, spring, distance, stagger, enter, press, reduce } }`. `ease` is a CSS easing string (`cubic-bezier(...)` or a `linear(...)` spring); `easeOut` is the same unless the curve overshoots, in which case it is the gentle one used for fades.
`scene()` sets `--sc-dur`, `--sc-ease`, `--sc-dist`, `--sc-stagger`, `--sc-lift`.

## Reach

Two scopes: the shared motion rules (tokens `--motion-fast/base/slow`, `--ease-standard`, `--ease-soft` and one reduced-motion rule), or only the movements shown. The proposal notes list the exact tokens.

## Adding choices later (`MORE`)

```js
'motion.ease': [['crisp', 'Crisp stop', 'Fast and firm, with no glide.']],   // an id needs an entry in EASES in src/motion/module.js
'motion.dur': [[180, 'Brisk', 'Just under the usual speed.']],
'motion.seq': [['fast', 'Fast ripple', 'A very small gap.', { set: { stagger: 25 } }]],
'motion.look': [['docs', 'Docs site', 'Almost still, with a fade and a gentle lift.',
  { set: { ease: 'out', dur: 160, enter: 'fade', seq: 'together', stagger: 0, press: 'lift', dist: 6, page: 'fade', load: 'pulse' } }]],
```

Numbers (`dur`, `dist`, `bounce`, `stagger`) can take any value inside the ranges above. A new id for `ease`, `enter`, `seq`, `press`, `page` or `load` needs code in the module, so for those prefer a new category through `MORE.dims`, or a new look. Words follow the usual rules: plain name, one plain sentence. Run `studio.mjs check` after every edit.
