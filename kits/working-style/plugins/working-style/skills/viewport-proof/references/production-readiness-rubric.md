# Production-readiness rubric

Judge the surface in three layers. Mechanical survival is necessary but not sufficient.

## 1. Works

- The intended route and meaningful state load without an error or permanent skeleton.
- Navigation, scrolling, sticky elements, drawers, inspectors, filters, tabs, tables, forms, focus, and touch behavior work where present.
- Primary content is not clipped, hidden, overlapped, pushed outside the viewport, or trapped behind an overlay.
- Horizontal scrolling exists only where the product intentionally provides a scanning surface.

## 2. Remains consistent

- Information priority and hierarchy survive recomposition.
- Typography, spacing rhythm, component treatment, alignment, control language, and data semantics remain recognizably part of the same product.
- Mobile is not a shrunken desktop and wide desktop is not a stretched laptop, but neither becomes a different product.
- Comparable elements align and repeat consistently; responsive transitions do not create unexplained exceptions.

## 3. Looks intentionally composed

- Placement, proportion, density, line length, grouping, whitespace, and visual balance feel deliberate at the inspected size.
- Nothing looks awkwardly parked, orphaned, accidentally centered, needlessly cramped, over-stretched, or isolated in an unearned empty canvas.
- Tables retain scanability; labels do not collapse into one-word columns; controls do not float away from the content they affect.
- The eye has a clear entry point and reading path without depending on hover to reveal hierarchy.
- Wide-screen space follows an intentional model: capped editorial composition, useful workbench context, or a fluid visual canvas.

## Severity

- **Blocker:** broken route or primary interaction, inaccessible content, severe clipping/overlap, page-level sideways scroll on a phone, or proof captured from the wrong commit.
- **Material:** visible inconsistency, awkward composition, unreadable density, broken hierarchy, or a viewport-specific treatment that would make the product feel unfinished.
- **Minor:** a localized polish issue that does not impair use or the overall composition.

## Verdicts

- **Production ready:** no blockers or material issues; interactions, cross-viewport consistency, and composition meet the bar. Any remaining minor observation is genuinely optional polish.
- **Minor fixes required:** the product works and the direction is coherent, but named localized corrections remain before the reviewed change should be called finished.
- **Not production ready:** any blocker, material inconsistency, unresolved awkward placement, or missing required evidence remains.

## Evidence rule

Every issue names its route, state, viewport, and element, and points at the frame that shows it. An issue you cannot point at in a frame or a geometry result is a hunch; check it or drop it.

Geometry results feed this rubric; they do not decide it. A `fail` from `geometry_check.js` is usually a blocker or material issue unless the frame shows it is intentional (say why in the frame note). A clean geometry run says nothing about layers 2 and 3.

State what is already strong briefly, then the exact failures. Avoid generic taste judgments and do not manufacture redesign work when the surface already meets the bar.
