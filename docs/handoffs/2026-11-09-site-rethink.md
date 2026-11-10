# Site rethink: finish the build

Written 2026-11-09 for a new session. The site is `site/` in this repo, live at https://www.atlasscope.dev.

## Goal

Make every page of the Agent Kit site look and behave like the new homepage hero: consistent, clean, and built from one written set of design rules. Work through the remaining pull requests below, one at a time.

## Where things stand

- Merged: AtlasScope/agent-kit#40, the pixel-fitted header logo.
- Open: AtlasScope/agent-kit#42, the orbit hero and brand colours. Three Codex findings are fixed and their threads resolved. It was waiting on checks when this was written. Merge it first; fix anything new Codex raises.
- Nothing else is started.

## Read first, in this order

All of these arrive on `main` with #42.

1. `DESIGN.md`: the design rules, written from the built hero. Build every page from it.
2. `PRODUCT.md`: who the site is for and what counts as success.
3. `docs/site-rethink/02-plan.md`: the page-by-page plan and the PR list in section 5. Its closing section, "Added after review", overrides earlier sections where they disagree.
4. `docs/site-rethink/01-audit.md`: what is wrong with each page today.
5. `.impeccable/surfaces/site-app-page-tsx.md`: the homepage brief.

## Decisions Austin has made

- AtlasScope is the brand. Agent Kit is its first product. atlasscope.dev is the Agent Kit site.
- Header: AtlasScope lockup, hairline divider, "Agent Kit". The logo is never placed on a photo.
- Dark surfaces use four colours only: ink `#0B0C12`, white, slate `#151821`, muted `#A3A6AD`. Muted stays `#A3A6AD`, not the `#A9A0A0` printed on the brand board. No accent colour.
- Homepage composition A ("Horizon rail"), headline "Give your coding agent better instructions.", photo used as supplied.
- Austin accepted every recommendation in the plan, including the new `/start` order and taking Kits out of the header links.
- Use the Impeccable skill for design work. Austin liked reviewing layouts on a Claude Design canvas before anything is built; offer that for pages with a real layout choice.

## Remaining work, in order

One PR each. The numbers match section 5 of the plan.

1. **Rest of the homepage (4).** Everything below the hero strip. Known problems: the solid green "Fix a problem" tile, section-coloured Copy buttons, shadows on dark cards, the old hero's unused styles in `globals.css`, and a `js-reveal` check in `RunDemo.tsx` that no longer does anything.
2. **Header and phone menu (5).** One 56px row on phones with a menu sheet; Kits out of the links. The header logo's sharpness depends on its top edge sitting on a multiple of 4px, so re-measure after any header height change.
3. **`/start` rebuilt (6).**
4. **Footer, About, Privacy, Terms (7).** `/privacy` and `/terms` 404 today. Austin has not said who reads the legal text; ask before it ships.
5. **Collections and account (8).** Never designed. The Clerk sign-in screens still use the old warm black.
6. **Library browsing (9).** Move light mode off the old warm paper colours, and remove the small label above the title on skill, prompt, kit, fix and collection pages.
7. **Analytics (10).** Needs Austin to switch Web Analytics and Speed Insights on in the Vercel project first. Ask.

## Rules that are easy to break

- Counts of skills, prompts and kits come from `site/content/generated.json` through `site/lib/content.ts`. Never type one.
- `site/components/AtlasScopeLogo.tsx` is generated. Change `design/atlasscope/source/export_site.py` and re-run it.
- Hero images are made by `site/scripts/build-hero-images.mjs` from `design/hero/inputs/`, which is ignored by git and exists only on Austin's Mac.
- Search was tuned in AtlasScope/agent-kit#27. Run `npm test` after any change to search or the header.
- No small label above a heading. Impeccable bans it.
- Stop for Austin's review with screenshots at 390, 1440 and 2560 wide before opening a PR for a page he has not seen.
- Do not change repository settings, production environment variables, Vercel project settings or DNS without asking.

## Git and pull requests

- Fresh branch from up-to-date `main` for each PR.
- Commit as `Atlas <262143381+AtlasScope@users.noreply.github.com>`. No Claude or Co-Authored-By trailer on commits or PRs.
- Before pushing, in `site/`: `npm run typecheck`, `npm test`, `npm run build`.
- Merge once `ci`, `codex-review`, `osv` and `codeql` are green and every review thread is resolved. Ignore the Vercel Security Review check.
- `codex-review` fails by design while Codex is still reviewing, and re-runs itself when Codex posts. Wait for it; do not treat that failure as a bug.

## Not available to a new session

- The Claude Design pages (design system and the three hero layouts) are private to the Claude account that made them. `DESIGN.md` and the built hero replace them. A new account will need to publish its own canvas for future layouts.
- Screenshots and measurement scripts from this work were in ignored and temporary folders. The measurements that matter are in the PR descriptions of #40 and #42.
- No image generator was available, so Impeccable's picture-based comparison step was never run. Layouts were compared by eye.

## Local setup

`.claude/launch.json` (untracked, on Austin's Mac) starts the dev server with `npm --prefix site run dev` on port 3000. Playwright is in `site/node_modules`; the pinned browser build was not installed, so earlier runs pointed `executablePath` at the cached `chromium_headless_shell-1254`.

## Open questions for Austin

- Should section headings inside a page use Montserrat, or only page titles as now?
- Keep soft shadows on dark cards, or go flat?
- Is "Monolithic Minimal" the name he wants for the look in `DESIGN.md`?
