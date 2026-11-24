# Composition

Where things go, how big, and in what order the eye meets them.

## Moves

- **Write the layout as a programme, not a picture.** Karl Gerstner's *Designing Programmes* (1964) treats a layout as rules that generate many correct pages: a grid of so many units, type that snaps to a baseline, images that span whole units. Interfaces are programmes whether or not anyone wrote the rules down; write them down as CSS custom properties and a grid, and every new screen inherits the idea instead of improvising.
- **Derive the grid from the content's unit.** Josef Müller-Brockmann (*Grid Systems in Graphic Design*, 1981) built grids from the type: line height sets the baseline, the baseline sets the module. On screen, start from body size and line height, make spacing multiples of the line, and choose column counts that divide the real content (a table of 7 days wants 7 or 14 columns, not 12).
- **Contrast of scale is the strongest move there is.** A page where the largest thing is five times body size reads as designed; at 1.5 times it reads as a form. Pick the one element that carries the idea and give it a scale nothing else approaches. Then make the rest quieter than feels safe.
- **Asymmetry holds attention, symmetry rests it.** Centred layouts are static and formal; they suit ceremony (an invitation, a title card) and not much else. Rudolf Arnheim (*Art and Visual Perception*, 1954) describes visual weight: size, darkness, colour, isolation and position all add weight, and a balanced asymmetric page offsets a heavy element with space. `fingerprint.mjs` reports `firstScreenWeightX`: 0.5 is dead centre.
- **Space is a material.** Uneven space (generous around the one important thing, tight within groups) is what makes structure visible. Gestalt proximity (Wertheimer, 1923) means things close together are read as one; use it instead of boxes and borders.
- **Pace the page like a publication.** Alexey Brodovitch, art directing *Harper's Bazaar* from 1934, paced spreads like film: wide, then close, then wide again, never the same rhythm twice in a row. A long page needs changes of tempo: a dense section, then an open one; a full-bleed moment, then a narrow column. Repeating one section shape down the page (heading, three cards, repeat) is the generated-page default.
- **Crop with intent.** A tight, unexpected crop of a picture or a number creates tension and scale; a picture shown whole and centred is a catalogue.
- **Break the grid once.** One element that crosses the column, overlaps an edge or hangs into the margin proves the grid exists. Every element doing it proves there is none.

## Checks

- At 300 pixels wide, can you still see the structure and the one loud thing?
- Is every spacing value a multiple of the base unit, except the ones you broke on purpose?
- Does a 390-wide layout keep the idea, or does it collapse into a centred stack? The phone version is often where the idea dies; recompose it, do not only stack it.

## Sources

Gerstner, *Designing Programmes* (1964). Müller-Brockmann, *Grid Systems in Graphic Design* (1981). Arnheim, *Art and Visual Perception* (1954). Wertheimer, "Laws of organization in perceptual forms" (1923). Vignelli, *The Vignelli Canon* (2010). CSS Grid Layout Module Level 2 (subgrid).
