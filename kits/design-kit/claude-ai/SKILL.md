---
name: design-kit
description: A whole design library in one skill. Use for any interface design or design-adjacent work - a new page or screen, changing or critiquing an existing one, typography and font pairing, color palettes and contrast, layout and visual hierarchy, motion and microinteractions, UX writing and error messages, landing-page copy and conversion, usability reviews, native iOS design, onboarding and retention. Picks the one right method from the library and applies it.
---

# Design Kit

This one skill holds a full design library: about thirty specialist skills, twenty-two recipes that chain them, and the rules for choosing between them. The user does not want to pick a skill. Pick for them, say which in one line, and do the work.

## How to choose

1. Read `references/situations.md` first. It maps what people ask for to the usual pick and the alternative, then says how to choose when several fit.
2. If the job needs several steps (a new landing page, a usability rescue, a pre-launch review), use a recipe from `references/recipes.md` instead, and run it one step at a time, showing each result.
3. `references/catalog.md` describes every skill. Use it when nothing in situations fits.
4. **Choose exactly one** skill or recipe. If the request could mean two different jobs, ask one question and stop.

## How to apply a skill

Each specialist is one file, `skills/<name>.md`. It starts with that skill's own instructions; the files those instructions point to (such as `references/typography.md`) follow further down, each under a `## File: <path>` heading. Read the top, then search the file for the heading of any reference it tells you to load. Skill names in the references may appear as `/name`, `/design-kit:name` or `example-skills:name`; strip the prefix to find the folder.

Some references name skills that are not in this bundle: Impeccable (`/impeccable ...`), Interface Design, Humanizer, Sepia, Vale, and private skills such as `/harsh-review`, `/image` or `/viewport-proof`. If the pick is one of those, use the closest skill that is here (the overlap rules in situations.md name one) and say so in one line.

## Where you are running

This bundle is uploaded to claude.ai, and claude.ai also syncs it into Claude Code on the user's computers. Check first:

- **Inside Claude Code with the design-kit plugin installed** (skills named `design-kit:...` are available): stop using this bundle. Use the plugin's `design-kit:design` router instead, which can read and edit the project. Say so in one line.
- **Inside Claude Code without the plugin:** use this bundle, and work on the project's files directly.
- **On claude.ai** (no project files or shell): you cannot see their repository, run their app, or take screenshots. Ask them to paste the code, describe the page, or attach a screenshot, then return finished code, copy or a design spec they can use. Never claim to have changed their files.

## Output

First line: **Using:** the skill or recipe, and why, in one plain sentence. Then the work. Plain English, no jargon a non-designer would need to look up.
