# Product

<!-- impeccable:product-schema 1 -->

## Platform

Web, installable Agent Skills / CLI plugins and public read-only MCP. [atlasscope.dev](https://www.atlasscope.dev).

## Users

People who know the outcome they want but not how to ask a coding agent, from first-time builders to experienced developers. Returning users can save and share collections.

## Product Purpose

Build beyond what you know. Agent Kit by AtlasScope gives AI-native builders access to the creative and technical capabilities of an experienced product team. A person can find a useful prompt, install a capability, or ask for an outcome in plain language and get excellent work without mastering a vocabulary of commands.

## Positioning

Free, open, agent-agnostic and useful immediately. Keen is the flagship creative capability: original ideas, working alternatives, decisive execution and craft, not a generic anti-slop checklist. Engineer and Database should bring the same depth to professional investigation and implementation. Skills perform work; prompts stand alone; recipes combine capabilities; a local workspace makes the work tangible.

## What It Is Today

Five distributed kits (design, motion, engineering, experience architecture and working style), original and credited borrowed skills, a standalone prompt/recipe library, a public Next.js site, optional accounts and collections, and read-only MCP retrieval. Keen includes its creative kernel and local compare/revise/apply workspace. Actual capabilities, names, counts and versions come from manifests, skill files and library source, not this document.

## What's Next

Grow original capabilities around the existing Keen workspace, with shared evidence and safe acceptance. Develop Engineer and Database into substantive, source-backed instruments; validate them on real work. Expand prompts and recipes where they provide distinct value. The intended distribution direction is one simple install of original skills; retire a borrowed capability only after an approved, validated replacement, preserving attribution and compatibility until then. Research prototypes are not shipped functionality. Current priorities and research live in the existing Keen/product and website Spaces, separately.

## Key Decisions

- Public access: all library content remains readable and copyable without sign-in. Accounts add sync and sharing, not a gate.
- Next.js on Vercel; Clerk and Neon handle optional accounts and private-by-default collections. Keep production data safe.
- Public MCP stays read-only, rate-limited, capped and disableable. See [operations](site/README.md).
- One coherent local workspace; reuse its contracts instead of inventing a new runtime for every skill. Product skills and prompts must work for people outside this repository.
- Router behavior is opt-in where supported; do not hijack ordinary chat. Respect existing installation and command compatibility.

## Operating Context

People arrive from search, a shared link or their agent and want to act quickly. The site, Markdown twins and MCP serve the same source content. Public IDs, install commands, copy payloads and credit records are contracts. A first-time user's path should get them to a working result, not teach unnecessary setup.

## Capabilities and Constraints

Build site content from `library/library.json`, shipped skill files, manifests and credits. Keep standalone exports and shipped generated references reproducible. Never claim a provider install, test or benchmark that was not demonstrated. Keep borrowed licenses and named sources.

## Brand Commitments

AtlasScope is the brand; Agent Kit is its first product. Plain, specific language; no invented proof or patronizing developer jargon. The public site should demonstrate exceptional developer-tool craft. [DESIGN.md](DESIGN.md) describes the current visual direction.

## Product Principles

Make it easy to find, understand, copy or install the right thing. Build capabilities with judgment, not scripts of compulsory steps. Retain evidence that changes a decision; remove overlapping or weak work. Make complex engineering feel effortless. Preserve user agency and truthful feedback.

## Accessibility & Inclusion

Keyboard and touch access, visible focus, readable contrast, responsive layouts, reduced motion and useful fallbacks. Verify on real devices when device behavior matters.
