---
name: Agent Kit by AtlasScope
description: Expressive minimalism from the orbital stage, carried through a calm, precise library.
colors:
  canvas: "oklch(98.6% .0015 260)"
  surface: "oklch(100% 0 0)"
  foreground: "oklch(18.5% .006 265)"
  signal: "oklch(55% .13 155)"
  brand: "oklch(76% .175 154)"
  focus: "oklch(55% .19 258)"
  danger: "#B42318"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
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

Expressive minimalism: the sophisticated engineering is beneath the surface. The public site should feel like an exceptional developer tool, not a template or graphics demo. Home and Install share a dark cinematic stage. The orbital artwork has visual energy; words and controls have space and clarity. The interiors are a fast, calm library in the same language: the stage's black (dark) or near-white (light), its green material, its glass and its headline type, used sparingly: one lit action and one glass payload where a page has them, none where it doesn't. They follow system light/dark. Preserve the AtlasScope identity; [brand assets](design/atlasscope/SPEC.md) and their source are separate from the website tokens.

## Colors

`site/app/styles/tokens.css` is authoritative for both themes, not duplicated hex tables. Dark is the stage's pure black with cool, nearly neutral greys; light is the same greys on near-white. Brand green (`--c-brand*`) is light and material: the satin pill (`.btn--brand`), at most one per page and only where the page has one thing it is for (a payload's Copy, Install all, the first step); reading and browsing pages have none, and the header's Install is quiet on interiors. The header's small light and lit lower edge carry the brand everywhere. The homepage's Install is the one exception: a cyan neon tile with a turning green, white and blue ring (`.launch__go`, stage.css), not green. It carries the visitor to the install page, which says Copied and offers to open an agent without showing the message. Truthful state stays separate: green signal (copied, tested, finished, current) appears only once true. Other buttons are neutral; amber marks selections and real caution, blue is keyboard focus, red is danger. No colour for categories: section hues are retired on interiors, type carries the hierarchy. Compose type over black sky rather than darkening the artwork behind it.

## Typography

Geist 600, set tight, for page titles as on the homepage; Geist for interface and prose; Geist Mono for code, identifiers and copyable payloads. Use the live type scale. One clear hierarchy, real content immediately visible, no decorative excess.

## Layout & components

Start with the shared tokens and primitives in `site/app/styles/`; the live `/design-system` page renders them. Use route-local styles for actual route needs. Prefer hairlines, precise spacing and restraint. Three surfaces only: the canvas (lists, prose, headings), a solid utility surface (fields, menus, tabs, ordinary code snippets) and glass (`.glass`, `.block.glass`: lit rim, deep shadow, faint green underglow) for the page's principal payload only. Atmosphere is a maximum, not a requirement: most interiors have none, never the planet's renderer. No card shells, decorative glows or self-running animation on interiors; motion answers intent. Home → Install should feel continuous, with exact payloads and honest clipboard feedback. Keep copy, search and install paths fast; preserve public URLs, attribution and accessibility.

## Motion and device quality

Motion clarifies a change. Honor reduced motion, static artwork fallbacks, background/offscreen pauses and responsive quality budgets. Prioritize Mac/Safari/Retina, iPhone and iPad while remaining compatible with other platforms. Verify meaningful changes in the actual affected experience, not by mandatory screenshots. See [the implementation contract](DESIGN-CONTRACT.md) for shared hooks, then read the relevant renderer or component source.
