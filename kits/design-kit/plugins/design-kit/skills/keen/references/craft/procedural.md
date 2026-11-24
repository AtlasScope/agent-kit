# Procedural graphics

Drawing with code. A picture computed from the product's own data or rules belongs to the product the way no stock photograph, illustration pack or gradient can.

## Moves

- **Draw the data before inventing decoration.** The best procedural image is the product's own content made visible: a tide curve from real harmonic constituents, a waveform from the actual audio, a contribution field from the actual history. It is honest, it updates, and nobody else has it.
- **A system, then variation.** The first computer artists worked this way: Georg Nees and Frieder Nake (1965) and Vera Molnár, from the late 1960s, wrote rules and let controlled randomness vary them. Decide the rule (a grid of marks, a field of lines, a stack of contours), then the one or two parameters that vary, then how much. Too little variation is wallpaper; too much is noise.
- **Use noise, not random.** Pure random values flicker and clump. Gradient noise (Ken Perlin, 1985; simplex noise, 2001) varies smoothly, so neighbouring values relate and shapes look natural. A seeded generator makes the image repeatable, which matters for screenshots and before-and-after comparisons.
- **Pick the right surface.**
  - **SVG** for anything with fewer than a few thousand shapes, anything that must be sharp at every size, styled with CSS, or read by a screen reader. Paths can be computed in a few lines of JavaScript at build time or load. `feTurbulence` gives paper and grain textures with no image file.
  - **Canvas 2D** for many marks, particles or images redrawn each frame.
  - **WebGL or WebGPU** shaders for full-screen fields, signed distance shapes (Inigo Quilez's articles are the standard reference) and anything per-pixel. Keep a static fallback image for when it cannot run.
- **Restraint in colour and density.** Generative work looks best with a tight palette (two or three inks from the product's palette) and with deliberate empty space. Density that fills every pixel reads as a screensaver.
- **It is still a picture.** Text over it must meet contrast at its worst point (see `measure.mjs` `overPictureNotMeasured`). It needs an `aria-hidden` or a real text alternative that says what it shows. It respects reduced motion: draw it still.
- **Cost.** Measure frame time if it animates (`/motion`, `filmstrip.mjs --perf`). A signature graphic that drops frames on a phone is a fault, not a feature. Prefer drawing once and moving with transform.

## Checks

- Does the graphic show something true about the product, or is it decoration?
- Is it seeded, so the screenshot is the same each time?
- Does the page still work, and still look intended, if the graphic fails to draw?

## Sources

Perlin, "An image synthesizer" (SIGGRAPH 1985) and "Improving noise" (2002). Nees, *Generative Computergraphik* (1969). Molnár, *(Dés)Ordres* (1974). Reas and Fry, *Processing* (2007). Shiffman, *The Nature of Code* (2012, 2024). Quilez, articles on distance functions (iquilezles.org). MDN, Canvas API and SVG filter primitives.
