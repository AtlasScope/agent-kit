# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Working developer (primary).** Uses a coding agent such as Claude Code, Codex or Cursor most days. Arrives wanting one specific prompt or skill, or wanting to install the kits, and wants to copy or install and get back to work.
- **Beginner.** Has never used an AI coding agent and does not know what an agent, a skill or a prompt is. Needs a guided path from nothing installed to a first working result.
- **Returning signed-in user.** Has starred items and collections and comes back to reuse or share them.

## Product Purpose

Agent Kit is a free, open library of skills and prompts for AI coding agents, published as installable kits, as a public website and as a read-only MCP server. It exists so that an agent given a plain request produces a better result than the person's own prompt would have. Success is, in Austin's words: kits installed, prompts copied, and AtlasScope becoming known as a maker of serious tools for AI coding.

## Positioning

Every skill and prompt is written with a specific user and job in mind, so beginners and experienced developers both get more out of the same request. The router skills (`/design`, `/engineer`, `/database`) take a request in plain words, pick the skill that fits and say which one they picked. It works in any agent that reads Agent Skills.

Austin said this was hard to state and gave the gist above (2026-11-09). The exact positioning line is still open.

## Operating Context

- People use the site beside their agent: they copy a prompt or an install command, paste it, and leave. Many visits start from search or a shared link to one prompt or skill page.
- Agents and AI crawlers read the same content through markdown twins, `llms.txt` and the MCP server.
- The beginner guide at `/start` is followed over about an hour with the Claude desktop app, GitHub Desktop and Vercel open.

## Capabilities and Constraints

- Content is generated at build time from `library/library.json` and each kit's `SKILL.md` files. Counts and entries are never edited by hand in the site.
- Words for the content are fixed in `GLOSSARY.md`: prompt, skill, kit, and the terms to avoid.
- Library pages are static and public. Accounts (Clerk) and collections (Neon) are optional; collections are private until shared.
- The MCP server is public and read-only, with a rate limit, a daily cap and an off switch.
- Next.js App Router on Vercel. Header search was tuned and has tests that must keep passing.
- Privacy and terms pages do not exist yet. There is no analytics or monitoring yet.
- Settled 2026-11-09: AtlasScope is the brand and Agent Kit is its first product. `atlasscope.dev` is the Agent Kit site. The header shows the AtlasScope lockup with "Agent Kit" named beside it, so a second product can sit under the same brand later.

## Brand Commitments

- Name: "Agent Kit by AtlasScope". AtlasScope is Austin's personal identity; Agent Kit is its first product.
- The AtlasScope identity is specified in `design/atlasscope/SPEC.md` (v0.4): Orbit symbol, Montserrat 600 wordmark as outlines, ink `#0B0C12`, white, slate `#151821`, muted `#A3A6AD`. The logo is only ever ink or white and never sits on a photograph.
- Austin's reference is the "Monolithic Minimal" board: black and white, a lit planet horizon, white pill buttons.
- The homepage hero uses the supplied orbit photograph as a backdrop, as a stated exception to the spec: solid ink header, photo below it, no mark on the photo.
- Voice: plain and specific. The earlier headline "Build like you have a senior team" was rejected as oversold. Feel named by Austin: modern, simple, slightly futuristic, in the manner of Linear and Resend.
- Header shows the AtlasScope lockup, a hairline divider, then "Agent Kit" in text.

## Evidence on Hand

- The library itself: prompt, skill and kit counts read from `site/content/generated.json`.
- Named authors of the borrowed skills with licences, in `CREDITS.md` and each kit's `THIRD_PARTY.md`.
- A real example run of `/design` routing a request (the homepage demo).
- Install commands per agent with the CLI version and date each was last tested, in `site/lib/site.ts`.
- The orbit photograph (`design/hero/inputs/`, not committed) and the brand masters in `design/atlasscope/`.
- None exist and none may be invented: testimonials, customer names, usage numbers, benchmarks.
- `/start` has not been tested with a first-time user and says so.

## Product Principles

1. Say what a thing does and what it returns before asking anyone to install it.
2. One name for each kind of content, the same everywhere.
3. Credit every author and keep every licence visible.
4. The fastest path wins: copy or install in one action from wherever the visitor lands.
5. Never claim more than was tested.

## Accessibility & Inclusion

Keyboard and screen-reader use throughout, visible focus, `prefers-reduced-motion` respected, and text contrast checked wherever it sits over the photograph. Layouts hold from 360 px to 2560 px wide, including Windows at 125% and 150% scaling.
