---
name: Agent Kit by AtlasScope
description: Expressive minimalism on the orbital stage; precise, calm developer tooling everywhere else.
colors:
  canvas: "oklch(98.6% .0015 260)"
  surface: "oklch(100% 0 0)"
  foreground: "oklch(18.5% .006 265)"
  signal: "oklch(55% .13 155)"
  focus: "oklch(55% .19 258)"
  danger: "#B42318"
typography:
  display:
    fontFamily: "Montserrat, Geist, system-ui, sans-serif"
    fontWeight: 600
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontWeight: 400
  code:
    fontFamily: "Geist Mono, monospace"
    fontWeight: 400
---

# Design System: Agent Kit by AtlasScope

## Overview

Expressive minimalism: the sophisticated engineering is beneath the surface. The public site should feel like an exceptional developer tool, not a template or graphics demo. Home and Install share a dark cinematic stage. The orbital artwork has visual energy; words and controls have space and clarity. The interiors are a fast, calm library that follows system light/dark. Preserve the AtlasScope identity; [brand assets](design/atlasscope/SPEC.md) and their source are separate from the website tokens.

## Colors

`site/app/styles/tokens.css` is authoritative for both themes, not duplicated hex tables. Interior surfaces are cool, nearly neutral; primary actions are ink on light and white on dark. Green means a true state (copied, tested, finished, current); amber marks selections, blue is keyboard focus, red is danger. Section hues are small wayfinding marks. The shared dark stage is the deliberate exception: green is light and material, a lit Install object, while truthful confirmation remains distinct. Compose type over black sky rather than darkening the artwork behind it.

## Typography

Montserrat 600 for display/page titles, Geist for interface and prose, Geist Mono for code, identifiers and copyable payloads. Use the live type scale. One clear hierarchy, real content immediately visible, no decorative excess.

## Layout & components

Start with the shared tokens and primitives in `site/app/styles/`; the live `/design-system` page renders them. Use route-local styles for actual route needs. Prefer hairlines, precise spacing and restraint; no generic cards, decorative glows or self-running animation on interiors. Home → Install should feel continuous, with exact payloads and honest clipboard feedback. Keep copy, search and install paths fast; preserve public URLs, attribution and accessibility.

## Motion and device quality

Motion clarifies a change. Honor reduced motion, static artwork fallbacks, background/offscreen pauses and responsive quality budgets. Prioritize Mac/Safari/Retina, iPhone and iPad while remaining compatible with other platforms. Verify meaningful changes in the actual affected experience, not by mandatory screenshots. See [the implementation contract](DESIGN-CONTRACT.md) for shared hooks, then read the relevant renderer or component source.
