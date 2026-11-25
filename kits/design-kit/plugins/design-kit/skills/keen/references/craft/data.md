# Data

When numbers are the content, the graphic is the argument. It must be true first and beautiful second, and the best ones are both.

## Moves

- **Pick the encoding by how accurately people read it.** Cleveland and McGill ("Graphical Perception", 1984) ranked how precisely people judge values: position on a common scale best, then length, then angle and slope, then area, then colour saturation and hue. Put the comparison that matters on position. A pie chart asks people to compare angles; a bar chart asks them to compare lengths.
- **Match the visual variable to the data type.** Jacques Bertin (*Semiology of Graphics*, 1967) defined the visual variables (position, size, value, texture, colour, orientation, shape) and which carry order and which only difference. Hue says "different kinds"; lightness says "more or less". Tamara Munzner (*Visualization Analysis and Design*, 2014) calls this expressiveness: the encoding must express exactly the data's structure, no more.
- **Remove what does not carry data.** Edward Tufte (*The Visual Display of Quantitative Information*, 1983) asks for most of the ink to be data: drop heavy gridlines, borders, 3D, backgrounds and legends that a direct label could replace. Then add back only what helps reading: a light reference line, a label on the value that matters.
- **Label directly.** Put the series name at the end of its line, the value on its bar. A legend makes the eye travel back and forth.
- **Annotate the point.** Say what the chart shows in its title ("Swimmable from 6:40 to 8:10") and mark the moment that matters on the chart itself. A chart without a point is a table drawn badly.
- **Colour for data.** Sequential palettes for ordered values (one hue, lightness stepping evenly in OKLCH), diverging palettes around a meaningful midpoint (two hues meeting at a neutral), categorical palettes of equal lightness for kinds. Never rainbow for magnitude: its uneven lightness invents edges that are not in the data (Borland and Taylor, "Rainbow color map (still) considered harmful", 2007). Viridis (Smith and van der Walt, 2015) is a tested perceptually uniform default.
- **Small multiples.** Many small charts on the same scale beat one chart with many lines (Tufte). A week of tides is seven small curves, not one tangled one.
- **Numbers as type.** Tabular figures, aligned on the decimal, units smaller and lighter than the value, the most important number largest on the screen.
- **The data can be the image.** A product whose data is beautiful (tides, weather, sound, movement, money over time) can use its own data as its signature graphic, drawn live. This is the most owned picture a product can have; see [procedural.md](procedural.md).

## Checks

- Cover the legend. Can you still read it?
- Is the zero baseline there for bars? Is any axis truncated in a way that exaggerates?
- Is every chart readable at 390 wide, or does it need a different form on a phone?

## Sources

Cleveland and McGill, "Graphical Perception" (JASA, 1984). Bertin, *Semiology of Graphics* (1967). Tufte, *The Visual Display of Quantitative Information* (1983). Munzner, *Visualization Analysis and Design* (2014). Borland and Taylor (IEEE CG&A, 2007). Smith and van der Walt, viridis (2015).
