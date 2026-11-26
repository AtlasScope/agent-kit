# Palette studio

Build with `--modules palette` (or `button,palette`). The module shows coordinated palettes as big swatches, every
colour role with its exact value and token, the roles at work in a representative piece of the product, and a
readability list measured now and today. It paints the example page and offers its accent to the button studio.

## Project input: `PROJECT.palette`

Use Palette Builder's role contract (design-kit `palette-builder/references/config.md`), so a palette read for one
tool works in the other. Read the colours the same way it does: `palette-builder/scripts/extract.mjs` on the repo, or
its `capture-page.js` on the running page, when Design Kit is installed; otherwise read the tokens and the main
components yourself.

```js
palette:{
  measured:true,
  roles:[
    { id:'page', name:'Page', type:'page', side:'dark', value:'#000000', used:'The sky behind the homepage',
      tokens:[{ name:'--c-canvas', file:'site/app/styles/tokens.css', scope:':root', format:'hex' }] },
    { id:'text', name:'Main text', type:'text', side:'dark', value:'#F4F5F7', used:'Headings and body',
      against:[['page',4.5]], tokens:[{ name:'--c-fg', file:'site/app/styles/tokens.css', format:'oklch' }] },
    // 10 to 25 roles in the product's own words, at most 40
  ],
  drop:[]          // group ids to leave out: roles, mode, greys, accent, action, status, words, read
}
```

| field | what it is |
| --- | --- |
| `id` | lower case and hyphens; the saved key. Never rename it once the user has picks |
| `type` | `page`, `surface`, `line`, `control`, `text`, `text2`, `text3`, `fill`, `on-fill`, `accent`, `signal`. It decides the families and shades offered and where the role is drawn |
| `side` | `dark` or `light`: the ground the role sits on |
| `value` | today's colour as `#RRGGBB`, exactly as found. Flatten transparency onto its background and say so in `note` |
| `used` | the real places it appears ("Install button", not "primary actions") |
| `against` | `[[other role id, minimum]]`: text 4.5, large text 3, edges and fills 3 |
| `tokens` | where the value lives: `name`, `file`, `scope`, `format` (`hex`, `rgb`, `rgb-channels`, `hsl`, `hsl-channels`, `oklch`, `oklch-channels`, the `-comma` forms). The proposal writes the new value in that format |
| `source` | `measured` (default) or `estimated` when read from source rather than a running page |
| `note` | anything the value cannot say: transparency, a gradient, an image behind it |

Every found value is the baseline exactly: nothing is nudged, rebuilt or made readable behind the user's back. A
pair that fails today shows in Readability as a finding about the product, apart from any change. Each role opens
Palette Builder's families and shades; a failing role offers "Use the nearest readable shade" as a choice, never as
a silent repair. Gradients, glass and images behind words are not measured; the page says so.

Signals map by name: an id or name with warn, warm, caution or star draws as the caution colour; err, bad, fail,
danger or destructive as the error colour; others as success. With several roles of one type, the first is drawn in
the representative piece; all of them are listed, changed and proposed.

Light and dark: give a product that has both themes its roles for each side (`side:'light'` and `side:'dark'`, each with
its own tokens and scope). Both are then drawn side by side, changed together by every direction, measured on their own
and proposed role by role. A product with one theme can ask for a matched twin (Themes, "Light and dark, matched"):
derived from the same greys, accent and status colours, drawn beside it, measured, and proposed as a new theme under
the project's own light or dark selector.

Older pages may give `hexes:{ page, surface, text, accent, fill, ok, warn, bad }` instead. Those become exact values
for the thirteen standard roles and the rest are marked Proposed.

## Directions

The looks and the direction controls (Light or dark, Greys, Accent colour, Main button, Status colours, Words) propose
values for whole families of roles at once. Changing one lets go of the hand-set values it covers (the greys, the
accent and main button, the status colours); roles it does not cover keep theirs. A look proposes every role.

| key | values |
| --- | --- |
| `side` | `'dark'` or `'light'` |
| `base` | 0 to 1: 0 is pure black or white, 1 is a deep grey or paper tone |
| `tint`, `gH`, `gC`, `tintk` | grey family name; its hue (0 to 359) and base tint (0 to 0.05); how much of it (0 to 4) |
| `sep` | 0.2 to 3: how far apart page, cards and lines are |
| `hue`, `vivid`, `lift` | accent hue (0 to 359), how vivid (0 to 0.32, 0 is grey), lighter or darker (-0.3 to 0.25) |
| `fill`, `fillHue` | `'accent'`, `'ink'`, `'own'` (uses `fillHue`) or `'soft'` |
| `stSet`, `okH`, `warnH`, `badH`, `stC` | status family name, the three hues, how strong (0.02 to 0.26) |
| `textk` | 0 to 1: softer to crisper words |
| `pair` | `'one'` or `'both'`: also propose a matched twin for the other theme. Fixed at `'both'` when the project has roles on both sides |
| `r_<role id>` | a role's own value, `#RRGGBB`, or empty to follow the direction |

## Adding choices (MORE block)

Add entries under `'palette.<key>'` in the MORE object. Numbers draw as they are; names draw through `set`:

```js
'palette.hue':[[200,'Ocean','A deep sea blue.']],
'palette.tint':[['Mint','Mint','Fresh green-blue greys.',{set:{gH:170,gC:0.025}}]],
'palette.look':[['dune','Dune','Sand greys and a rust accent.',{set:{side:'light',base:0.5,tint:'Sand',gH:80,gC:0.026,tintk:1.4,hue:40,vivid:0.14,lift:-0.05}}]],
```

A look may also set `r_<role id>` for a role that should keep a particular colour in that direction. Do not add new
`fill` or `side` values: they have no numbers behind them. Run `studio.mjs check` after.

## The proposal

Role by role, by Palette Builder id: before and after, how today's value was known, and each token with the new value
written in its own format. Unchanged roles are listed once at the end.
