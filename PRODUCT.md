# Product

<!-- impeccable:product-schema 1 -->

## Platform

web, CLI plugins, and read-only MCP

## Users

- **Working developer (primary).** Uses a coding agent such as Claude Code, Codex, or Cursor most days. Arrives wanting a specific prompt or skill, or to install the kits, and wants to copy or install and get back to work.
- **Beginner.** Has never used an AI coding agent and doesn't know what an agent, skill, or prompt is. Needs a guided path from nothing installed to a first working result.
- **Returning signed-in user.** Has starred items and collections on atlasscope.dev and comes back to reuse or share them.

## Product Purpose

Agent Kit by AtlasScope is a free, MIT-licensed library of skills and prompts for AI coding agents, shipped as five installable plugins, a standalone prompt library, a public website (`atlasscope.dev`), and a read-only MCP server. It exists so an agent given a plain request produces a better result than the person's own prompt would have. Success is kits installed, prompts copied, and AtlasScope becoming known as a maker of serious tools for AI coding.

## Positioning

Every skill and prompt is written with a specific user and job in mind, so beginners and experienced developers both get more out of the same request. The router skills (`/design`, `/engineer`, `/database`) take a request in plain words, pick the skill that fits, and name their pick before acting. The skill files work in any agent that reads Agent Skills.

The main hero headline ("Give your coding agent better instructions.") was chosen on 2026-11-09. The broader positioning tagline is still open.

## What It Is Today

- **Five plugins, 64 skills.** `design-kit` (38 skills), `motion-kit` (1), `engineering-kit` (17), `experience-architecture` (4), and `working-style` (4). Fifteen skills are original to Agent Kit; 49 are borrowed at pinned commits from 10 authors and credited in `CREDITS.md` and each kit's `THIRD_PARTY.md`.
- **Prompt library.** 254 entries in `library/library.json` (56 investigations, 23 database prompts and workflows, 12 thinking prompts, 35 engineering commands, 105 design commands, 23 design recipes), audited in `library/audit.json` and compiled to `library/dist/prompt-library.html` and `prompt-library.md`.
- **Public website (`site/`).** Live Next.js App Router site on Vercel (`https://www.atlasscope.dev`) with a one-screen orbit hero and WebGL scene, `/install`, `/start` (8-step beginner guide) and `/learn` (5 lessons), `/prompts`, `/skills`, `/kits`, `/fix`, `/about`, draft `/privacy` and `/terms`, `.md` twins, `llms.txt`, Clerk sign-in + Neon collections, Vercel Web Analytics, and a read-only `/mcp` server.

## What's Next

- **Test `/start` with a first-time user.** The beginner guide is live but untested (`TESTED = null` in `site/lib/start.ts`). `docs/site-rethink/02-plan.md` also proposes reordering steps so "Make the app" runs before setting up GitHub and Vercel.
- **Finalize `/privacy` and `/terms` and add account controls.** Both pages carry a `Draft, 10 Nov 2026` notice awaiting review, and `/privacy` still says the site runs no analytics even though Vercel Web Analytics (`@vercel/analytics`) was added in PR #80. `/account/settings` (export and delete account) is still unbuilt.
- **Record real-project trials for `/motion` and `walkthrough`.** Per ADR 0005 and ADR 0006, neither is promoted as a default router pick or primary site path until compared against baselines on real projects.
- **Continue building original skills (`docs/own-skills/01-plan.md`).** Next planned commands are `/interview`, `/test-first`, and `/design setup` (which needs a decision on staying compatible with Impeccable's `PRODUCT.md` and `DESIGN.md` schemas).
- **Test non-Claude install paths and record routing baselines.** Verify Codex, Cursor, Gemini CLI, and GitHub Copilot installs in clean setups, and record baseline runs for `tests/routing/cases.json`.

## Key Decisions

- **Public library first (ADR 0001).** Every prompt and skill stays readable and copyable without signing in; accounts add syncing and sharing, never gating.
- **Next.js from the start with Clerk + Neon (ADR 0002, ADR 0004).** Library pages pre-render statically; sign-in and collections run through Clerk and Neon Postgres.
- **MCP guardrails in the app (ADR 0003).** Per-IP rate limiting, a Neon-backed daily call cap, an Edge Config off switch, and webhook alerts protect the public `/mcp` endpoint instead of Vercel's team-wide auto-pause.
- **Where new skills live (ADR 0005, ADR 0006).** Product Experience (`walkthrough`) grows inside `experience-architecture` so runs don't need two installs; `/motion` ships as its own `motion-kit` plugin because it works standalone with its own measurement scripts.
- **Install defaults and safety.** Routers default to `typed` so they never hijack normal chat; `/design`, `/engineer`, and `/database` support opt-in `automatic` start and local `router_log` in Claude Code only.
- **Brand and terminology.** Published as "Agent Kit by AtlasScope" (`design/atlasscope/SPEC.md` and `DESIGN.md`). Content nouns follow `GLOSSARY.md`.

## Operating Context

- Developers use the site beside their agent: they copy a prompt or install command, paste it, and leave. Many visits arrive from search or a shared link to one prompt or skill page.
- Agents and AI crawlers read the same content through `.md` twins (`/index.md`, `/prompts.md`, `/skills.md`, `/kits.md`, `/fix.md`, and `/<section>/<slug>.md`), `llms.txt`, and `/mcp`.
- The `/start` guide takes roughly an hour with the Claude desktop app, GitHub Desktop, and Vercel.

## Capabilities and Constraints

- Site content is generated at build time from `library/library.json`, each kit's `SKILL.md` files, `THIRD_PARTY.md`, and `CREDITS.md`. Counts and entries are never edited by hand in `site/`.
- Words for the content are fixed in `GLOSSARY.md`.
- Library pages are static and public; Clerk middleware runs only on `/account`, `/collections`, `/sign-in`, and `/api`.
- The MCP server is public and read-only, with a per-minute limit, a daily cap, and an Edge Config off switch.
- Vercel Web Analytics is enabled in `site/app/layout.tsx`; `/privacy` needs to reflect that before the draft notice comes off.

## Brand Commitments

- Name: "Agent Kit by AtlasScope". AtlasScope is the brand; Agent Kit is its first product.
- The AtlasScope identity is specified in `design/atlasscope/SPEC.md` (v0.4) and `DESIGN.md`: Orbit symbol, Montserrat 600 display and wordmark, ink `#0B0C12`, white `#FFFFFF`, slate `#151821`, muted `#A3A6AD`. The logo is only ever ink or white and never sits on a photograph.
- The homepage hero uses the orbit photograph (and live WebGL scene) below a solid ink header, with no mark on the photo, as a stated exception to the spec.
- Header shows the AtlasScope lockup, a hairline divider, then "Agent Kit" in text.
- Voice: plain, direct, and specific. No oversold claims ("Build like you have a senior team" was rejected).

## Evidence on Hand

- Prompt, skill, and kit counts read at build time from `site/content/generated.json` and `library/library.json`.
- Named authors and licenses for every borrowed skill in `CREDITS.md` and each kit's `THIRD_PARTY.md`.
- Real `/design` routing example shown in the hero (`DS31` in `tests/routing/cases.json`).
- Install commands and verified test dates in `site/lib/site.ts`.
- None exist and none may be invented: testimonials, customer names, usage numbers, or benchmarks. `/start` hasn't been tested with a first-time user and says so.

## Product Principles

1. Say what a thing does and what it returns before asking anyone to install it.
2. One name for each kind of content, the same everywhere.
3. Credit every author and keep every license visible.
4. The fastest path wins: copy or install in one action from wherever the visitor lands.
5. Never claim more than was tested.

## Accessibility & Inclusion

Keyboard and screen-reader use throughout, visible focus, `prefers-reduced-motion` respected, and text contrast checked wherever it sits over the photograph. Layouts hold from 360 px to 2560 px wide, including Windows at 125% and 150% scaling.
