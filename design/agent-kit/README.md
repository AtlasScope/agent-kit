# Agent Kit mark and lockup

Draft, 2026-11-09. Built to sit beside the AtlasScope identity in [../atlasscope](../atlasscope/SPEC.md). Not yet reviewed by Austin.

Agent Kit keeps its own name and mark. It shares AtlasScope's typeface (Montserrat SemiBold), ink (`#0B0C12`), spacing and the one-sided t with an angled top. It does not use the crossbar-free A or the Orbit symbol, which belong to AtlasScope.

## The mark

One tile seen from above at an angle, with the edges of two more tiles beneath it. One colour, no transparency, sharp corners.

| Measure | Value (lettering units, cap height 700) |
|---|---|
| Tile half width | 460 |
| Tile half height | 236 |
| Edge thickness of each lower tile | 96 |
| Gap between tiles | 62 |
| Overall box | 920 wide × 788 tall |

## Files

| Folder | Holds |
|---|---|
| `svg/` | Mark, lockup, and lockup with the "BY ATLASSCOPE" line, in ink and white, cropped tight |
| `svg/padded/` | The same with clear space of half the cap height built in |
| `png/` | Transparent PNGs of the padded files |
| `icons/` | App icon 64 to 1024, `favicon.svg`, `favicon.ico` |
| `sheet/` | Review sheet |
| `source/build.py` | Regenerates everything. Reads the lettering from `../atlasscope/source/geometry.py` |

Use the byline version at 20 px cap height and above. Below that the small line is unreadable, so use the plain lockup.

To regenerate: `python3 design/agent-kit/source/build.py`. It needs Python with fontTools, skia-pathops and Pillow (`pip install fonttools skia-pathops pillow`), and the site's `node_modules`.
