---
name: Agent Kit by AtlasScope
description: Expressive minimalism from the orbital stage, carried through a calm, precise library in one cyan light.
colors:
  canvas: "oklch(98.6% .0015 260)"
  surface: "oklch(100% 0 0)"
  foreground: "oklch(18.5% .006 265)"
  signal: "oklch(55% .13 155)"
  brand: "oklch(80% .145 212)"
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

Expressive minimalism: the sophisticated engineering is beneath the surface. The public site should feel like an exceptional developer tool, not a template or graphics demo. Home and Install share a dark cinematic stage. The orbital artwork has visual energy; words and controls have space and clarity. The interiors are a fast, calm library in the same language: the stage's black (dark) or near-white (light), its cyan light, its glass and its headline type, used sparingly: one lit action and one glass payload where a page has them, none where it doesn't. They follow system light/dark. Preserve the AtlasScope identity; [brand assets](design/atlasscope/SPEC.md) and their source are separate from the website tokens.

## Colors

`site/app/styles/tokens.css` is authoritative for both themes, not duplicated hex tables. Dark is the stage's pure black with cool, nearly neutral greys; light is the same greys on near-white. The brand is the homepage Install button's cyan (`--c-brand*`), used as light in a ladder from loud to quiet:

1. The signature: the homepage's Install tile (`.launch__go`, stage.css), a cyan neon tile with a turning green, white and blue ring. Its inner light is clipped to its rounded shape; hover charges it (brighter ring and glow, light under the pointer) instead of turning it white. Only on the homepage.
2. The lit action: the cyan satin pill (`.btn--brand`) and the install page's lit agent key, at most one per page and only where the page has one thing it is for.
3. Quiet controls: neutral buttons, chips, search and cards take the brand only as a faint edge on hover (`--c-brand-line`); a current nav link or tab gets a short brand marker (`--c-brand-ink`). The header carries the small cyan light and lit lower edge.
4. Glass: the page's principal payload, with a faint cyan underglow.

Truthful state stays separate: green signal (copied, tested, finished, current) appears only once true (the install page shows it in cyan, its own light). Amber marks selections and real caution, blue is keyboard focus, red is danger. No colour for categories: type carries the hierarchy. Compose type over black sky rather than darkening the artwork behind it.

## Typography

Geist 600, set tight, for page titles as on the homepage; Geist for interface and prose; Geist Mono for code, identifiers and copyable payloads. Use the live type scale. One clear hierarchy, real content immediately visible, no decorative excess.

## Layout & components

Start with the shared tokens and primitives in `site/app/styles/`; the live `/design-system` page renders them. Use route-local styles for actual route needs. Prefer hairlines, precise spacing and restraint. Three surfaces only: the canvas (lists, prose, headings), a solid utility surface (fields, menus, tabs, ordinary code snippets) and glass (`.glass`, `.block.glass`: lit rim, deep shadow, faint cyan underglow) for the page's principal payload only. Atmosphere is a maximum, not a requirement: most interiors have none, never the planet's renderer. No card shells, decorative glows or self-running animation on interiors; motion answers intent. Home → Install should feel continuous, with exact payloads and honest clipboard feedback. Install is a short welcome built around one glass panel on a cyan floor whose horizon is where the homepage button's light lands. The panel's heading is the page's: Copied (Install Agent Kit on a direct visit). Claude Code, Codex and Cursor are three equal lit tiles in the homepage button's family, each in its own light (warm, silver, ice blue); they open in a new tab, and the page then says where the agent went and brings the account row forward. Under the panel, two full-width rows: Create a free account (lit cyan) and Explore Agent Kit, a drawer that introduces each part of the site. Sign-in continues the same stage: dark, one glass card holding Clerk's form, and a way on without an account. It never says the kits are installed. Keep copy, search and install paths fast; preserve public URLs, attribution and accessibility.

## Motion and device quality

Motion clarifies a change. Honor reduced motion, static artwork fallbacks, background/offscreen pauses and responsive quality budgets. Prioritize Mac/Safari/Retina, iPhone and iPad while remaining compatible with other platforms. Verify meaningful changes in the actual affected experience, not by mandatory screenshots. See [the implementation contract](DESIGN-CONTRACT.md) for shared hooks, then read the relevant renderer or component source.
