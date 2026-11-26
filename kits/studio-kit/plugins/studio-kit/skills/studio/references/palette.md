# Palette studio

Build with `--modules palette` (or `button,palette`). The module paints the example page and offers its accent to
the button studio. Roles follow Palette Builder: page, surface, line, control, text, text2, text3, accent, fill,
on-fill, ok, warn, bad. The proposal lists every role as `id: #HEX oklch(...)`; map them onto the project's tokens.

## Project input: `PROJECT.palette`

```js
palette:{
  hexes:{ page:'#0B0D12', surface:'#151922', text:'#E8EAF0', accent:'#7C5CFF', fill:'#7C5CFF', ok:'#3DD68C', warn:'#F5B94A', bad:'#F87171' },
  today:{},        // optional: state keys to force, laid over what was read from hexes
  measured:true,   // optional: set automatically when hexes or today are given
  drop:[]          // group ids to leave out: mode, greys, accent, action, status, words
}
```

Give whatever hexes you found; `page` is required for the rest to be read. From them the studio sets light or dark,
how far the background is from black or white, the grey family and how tinted it is (from `page`), card separation
(from `surface`), text strength (`text`), accent colour, vividness and lightness (`accent`), what the main button
follows (`fill`: same as accent, same as text, a pale wash, or its own hue) and status colours (`ok`, `warn`, `bad`).
"Today" is then the first look, and choices that do not match a built-in one appear as "Today".

What cannot be represented exactly: `surface`, `line`, `control`, `text2`, `text3` and `on-fill` are derived, not
copied (lines and field edges follow the separation; secondary and faint words follow text strength); greys share one
tint, so a page and cards in different hues collapse to the page's; words, field edges and status colours are raised
until readable, so a project colour that fails contrast is shown at its nearest readable shade; status colours share
one strength and lightness; transparency and gradients are ignored. Say so in the chat when it matters.

## State keys

| key | values |
| --- | --- |
| `side` | `'dark'` or `'light'` |
| `base` | 0 to 1: 0 is pure black or white, 1 is a deep grey or paper tone |
| `tint`, `gH`, `gC`, `tintk` | grey family name; its hue (0 to 359) and base tint (0 to 0.05); how much of it (0 to 4) |
| `sep` | 0.2 to 3: how far apart page, cards and lines are |
| `hue`, `vivid`, `lift` | accent hue (0 to 359), how vivid (0 to 0.32, 0 is grey), lighter or darker (-0.3 to 0.25) |
| `fill`, `fillHue` | `'accent'`, `'ink'`, `'own'` (uses `fillHue`) or `'soft'`; any other value draws as `'accent'` |
| `stSet`, `okH`, `warnH`, `badH`, `stC` | status family name, the three hues, how strong (0.02 to 0.26) |
| `textk` | 0 to 1: softer to crisper words |

## Adding choices (MORE block)

Add entries under `'palette.<key>'` in the MORE object. Numbers draw as they are; names draw through `set`:

```js
'palette.hue':[[200,'Ocean','A deep sea blue.']],
'palette.vivid':[[0.11,'Gentle','Between soft and clear.']],
'palette.tint':[['Mint','Mint','Fresh green-blue greys.',{set:{gH:170,gC:0.025}}]],
'palette.stSet':[['brand','Brand','Your own success, caution and error colours.',{set:{okH:165,warnH:85,badH:5}}]],
'palette.look':[['dune','Dune','Sand greys and a rust accent.',{set:{side:'light',base:0.5,tint:'Sand',gH:80,gC:0.026,tintk:1.4,hue:40,vivid:0.14,lift:-0.05}}]],
```

A new name for `tint` or `stSet` only works through `set`, because the drawing reads the numbers, not the name. Do
not add new `fill` or `side` values: they have no numbers behind them and draw as the accent button or dark. Looks
should set every key that matters; unset keys come from the starting point. Run `studio.mjs check` after.
