# Icons studio

Build with `--modules icons` (or `button,palette,type,icons`). It designs how interface icons look and sit: the family, line weight, size, fill, placement next to a label, corners and line ends, a hand-drawn feel, optical balance, containers and colour. The glyphs are a small original set drawn inside the module (search, home, settings, account, alerts, add, done, close, next, download, menu, like, copy, messages, calendar, delete) on a 24 grid; they stand in for the project's own icons so the style can be judged. With the Palette and Typography studios open, icons sit on the palette's page colour and use its fonts, so line weight and lettering weight can be compared.

## What the agent fills in: `PROJECT.icons`

```js
icons: {
  measured: true,                       // true only when `today` was read from the project's code
  library: 'Lucide',                    // optional: the icon set the project uses now; named in the proposal
  today: { family: 'regular', stroke: 1.75, size: 20, fill: 'line', cap: 'round', join: 'round', corner: 2,
           gap: 8, place: 'before', optical: 'off', box: 'none', colour: 'text', lw: 500 },
  drop: [],                             // group ids to hide: family stroke size fill place shape feel optical box colour
}
```

Every key is optional. Read the project's icon component for size, stroke-width, caps, joins, the gap beside labels and whether icons sit in a container. `stroke` is on the 24 grid, so a 20px icon with `stroke-width: 1.5` on a 24 viewBox is `1.5`; if the project sets a pixel stroke at another size, convert it (`stroke * 24 / size`).

## State keys

| key | meaning | values |
|---|---|---|
| family | a named set of the values below (picking one sets them) | regular, fine, bold, rounded, sharp, solid, duo, blocky, hand |
| stroke | line weight on the 24 grid | 0.75 to 3.5 |
| match | work the line out from the label's thickness | off, text |
| size | icon size, px | 12 to 48 |
| fill | outline, solid, tinted, accent marks, or filled/tinted when selected | line, solid, duo, accent, active, activeduo |
| place | where the icon sits next to its label | before, after, above, below, hover, edge |
| gap | space between icon and label, px | 0 to 24 |
| cap | ends of lines | round, square, butt |
| join | corners where lines meet | round, miter |
| corner | roundness of boxes inside icons, on the grid | 0 to 6 |
| rough | hand-drawn looseness | 0 to 3 |
| optical | heavier line when small, nudged to sit level with the lettering | on, off |
| box | container behind the icon | none, circle, square, tint |
| colour | icon colour | text, accent, muted |
| lw | label thickness beside icons | 400, 500, 600 |

`family` is only a shortcut: it sets stroke, cap, join, corner, fill and rough together. After that each key can change on its own.

## What it shares and paints

`share` gives `{ icons: { family, stroke, size, fill, cap, join, gap, optical, draw(name, px, { active, knock }) } }`. `draw` returns an inline SVG of one glyph in the current style (`''` for an unknown name); it uses `currentColor`, and the cut-outs of solid icons use the CSS custom property `--ic-knock` (or the `knock` option) so they match whatever the icon sits on. `scene` sets `--sc-icon` (px), `--sc-icon-stroke` (grid units) and `--sc-icon-gap` (px).

## Warnings

Only real problems: a line under 1px on screen, an icon with no visible label (nothing to point at on a phone) and a tap area under 40px, a quiet grey or accent icon colour under 3 to 1 against the page.

## Adding choices later (`MORE`)

```js
'icons.size': [[22, 'Between', 'One step between medium and large.']],
'icons.stroke': [[1.6, 'Crisp', 'A touch lighter than regular.']],
'icons.family': [['brand', 'Our own', 'Matches the project’s icons.', { set: { stroke: 1.5, cap: 'butt', join: 'miter', corner: 1, fill: 'line', rough: 0 } }]],
'icons.look': [['docs', 'Docs site', 'Small quiet icons beside the text.',
  { set: { family: 'fine', size: 16, gap: 6, colour: 'muted', place: 'before' } }]],
```

Values must sit inside the ranges above (a new `family` should carry `set` values: the id is only a name, the drawing follows stroke, cap, join, corner, fill and rough). Words follow the usual rules: a plain name, one plain sentence, no jargon. Run `studio.mjs check` after every edit.
