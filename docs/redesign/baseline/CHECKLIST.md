# Redesign regression checklist (baseline 2026-11-24)

The redesign must keep everything below working. The data in `data/` was captured from production as it stood on 2026-11-24: commit `118506c` ("Site: the homepage planet is drawn from code"), Vercel production deployment `dpl_D3fRumQAEQw1XmWjBTYCY6G4XwhM`.

Run the automated part against any build before a page-family PR goes ready:

```sh
cd site && npm ci && npx next build && (npx next start -p 3000 &)
BASE=http://localhost:3000 node ../docs/redesign/baseline/scripts/verify.mjs
```

`verify.mjs` waits up to a minute for the server to answer, then exits 1 and lists each regression. Against the baseline build itself it printed `OK: 430 pages, 1438 copy buttons, 8 install payloads, 6 files match the baseline.` (about 9 minutes in a cloud container). It printed the same against `redesign/integration` at `9b4c0cc`.

## How this was captured

- The cloud container's network policy blocks `atlasscope.dev`, so the pages were rendered from a local production build (`next build && next start`) of the exact commit that production serves. Spot checks against production through the Vercel connector matched: `/` (title, description, markdown alternate, and no canonical tag in both), `/collections` (404 in both), and `/sign-in` (200 in production).
- All browser work is **Chromium emulation in Playwright 1.63**, not physical Apple devices and not WebKit. WebKit could not be downloaded in this environment. iPad and iPhone results use Playwright's `iPad Pro 11` and `iPhone 15 Pro` descriptors (viewport, device scale factor, touch, mobile user agent) on Chromium. Safari-specific behaviour is unverified.
- Account pages (`/account`, `/sign-in`, `/collections/[id]`) need Clerk keys and a database, which the local build doesn't have, so they returned 404 locally and are not in the screenshots or the verify run. In production `/sign-in` returns 200. They need a separate check against a preview with auth configured.

## Routes

`data/routes.txt` lists all 426 sitemap URLs (paths only; the sitemap host is `https://www.atlasscope.dev`). Composition: 1 home, `/install`, 4 index pages (`/prompts`, `/skills`, `/kits`, `/fix`), `/start` plus 8 steps, `/learn` plus 5 lessons, 19 fix pages, 5 kits, 33 prompt areas, 275 prompt and command pages, 66 skills. Routes outside the sitemap that must keep working: `/about`, `/privacy`, `/terms`, `/mcp-setup`, `/mcp` (MCP server), `/install.md`, `/llms.txt`, `/llms-full.txt`, `/robots.txt`, `/sitemap.xml`, the `*.md` alternate of each page, `/account`, `/sign-in`, `/collections/[id]`, and the 404 page.

- [ ] Every path in `data/routes.txt` returns 200 (no new redirects; URLs are public and indexed).
- [ ] Every path stays in `sitemap.xml`.
- [ ] Unknown paths still return a real 404 status.

## SEO and metadata

`data/pages.json` holds, for the 426 sitemap URLs plus `/about`, `/mcp-setup`, `/privacy` and `/terms` (`data/extra-routes.txt`, marked `inSitemap: false`): title, meta description, canonical, `og:title`, `og:image`, `twitter:card`, `lang`, h1 text, JSON-LD `@type`s, the `text/markdown` alternate, and the number of copy buttons.

- [ ] Titles, descriptions and canonicals unchanged unless a change is intended and listed in the PR.
- [ ] Exactly one `h1` per page (true on all 430 today).
- [ ] JSON-LD kept: `Organization` on `/`, `BreadcrumbList` on 428 pages, `SoftwareSourceCode` on the 66 skill pages.
- [ ] `twitter:card` = `summary_large_image` and the shared OG image on every page.
- [ ] Markdown alternates (`<link rel="alternate" type="text/markdown">`) kept on the 410 pages that have one.
- [ ] `robots.txt`, `llms.txt`, `llms-full.txt` and `install.md` byte-identical (hashes in `data/files.json`) unless the PR intends a content change.

Existing gaps, recorded so nobody mistakes them for regressions (present in production too): `/` has no canonical tag; no page sets `og:url`; 57 titles are over 65 characters and 5 descriptions over 160; one description is shared by four pages (`/prompts/engineering-kit`, `/prompts/trail-of-bits`, `/prompts/experience-architecture`, `/prompts/other-commands-that-help`).

## Copy payloads (exact text)

`data/copy-buttons.json` lists all 1,438 visible copy buttons in `<main>` on those 430 pages (`/install` is covered separately below): page, order, accessible label, and the SHA-256 and length of what the click put on the clipboard. `data/copy-payloads-by-sha256.json` holds the full text of each of the 389 distinct payloads.

- [ ] Every payload a page could copy is still copyable from that page, byte for byte. Button order, labels, tabs and disclosures may change; the text may not. The script records every clipboard write, opens closed `<details>`, and clicks each tab in `<main>` before reading what each Copy control produces, so text behind a tab or a closed "Or run it yourself" section still counts. Controls whose name contains "copy" but carry `aria-pressed` (filters such as "Tests on a copy") are not clicked.
- [ ] A copy button still reports success in an accessible way (today the label changes to "Copied" in an `aria-live` region and a toast appears on `/install`).

## Install commands

`data/install-commands.json` holds the install page payloads per agent tab, plus every copy block on the five kit pages. Current text:

The homepage "Install Agent Kit" button and the install page's first box copy:

```text
Install Agent Kit for me from https://github.com/AtlasScope/agent-kit. Follow the steps for the agent you are at https://www.atlasscope.dev/install.md, then tell me what you installed and how to start it.
```

Claude Code:

```sh
claude plugin marketplace add AtlasScope/agent-kit
claude plugin install design-kit@agent-kit
claude plugin install motion-kit@agent-kit
claude plugin install engineering-kit@agent-kit
claude plugin install experience-architecture@agent-kit
claude plugin install working-style@agent-kit
```

Codex:

```sh
codex plugin marketplace add AtlasScope/agent-kit
codex plugin add design-kit@agent-kit
codex plugin add motion-kit@agent-kit
codex plugin add engineering-kit@agent-kit
codex plugin add experience-architecture@agent-kit
codex plugin add working-style@agent-kit
```

Cursor: `npx skills add AtlasScope/agent-kit -a cursor`. Any agent: `npx skills add AtlasScope/agent-kit`.

Each kit page copies a kit-only message ("Install only the design-kit kit from Agent Kit for me (…)") plus the Claude Code and Codex command pair for that kit.

- [ ] Homepage install button copies the message above and lands on `/install`.
- [ ] `/install` has the four agent tabs (Claude Code, Codex, Cursor, Any agent) with arrow, Home and End keys moving between them (per `InstallPage.tsx`; not exercised in the recordings); the chosen agent is remembered across visits (`localStorage`) with no layout jump on load.
- [ ] Each tab copies its exact commands.
- [ ] Kit pages copy their exact message and commands.
- [ ] MCP setup page keeps `claude mcp add --transport http agent-kit https://www.atlasscope.dev/mcp` and the other agent snippets (covered by the copy-button data).

## Journeys

Recorded in `journeys/` of the Before set (desktop 1440 dark and iPhone 15 Pro light). Results from `data/journey-results.tsv`:

- [ ] **Search.** `/` focuses search on desktop; the search icon opens it on phones. Typing "slow" gave 8 results; arrow keys move the highlighted option (`aria-activedescendant`), Enter opens it (went to `/prompts/impeccable-optimize`), Escape closes. Result count is announced in an `aria-live` region.
- [ ] **Browse prompts and copy.** `/prompts` scrolls through areas; a prompt page's "Copy prompt" puts the exact prompt on the clipboard (979 characters for `status-hidden-in-a-pile-of-flags`).
- [ ] **Skills.** `/skills` lists all 66 skills grouped by kit with author credit; a skill page links its Markdown and GitHub folder and keeps its license and attribution text.
- [ ] **Kits.** `/kits` lists five kits; a kit page copies its install message (387 characters for design-kit).
- [ ] **Install.** See above.
- [ ] **Phone menu.** The menu button opens a dialog sheet and Escape closes it. Focus return was not checked.
- [ ] **Keyboard order on `/`:** Skip to content, logo (home), Start, Prompts, Skills, Fix a problem, search, GitHub, Install Agent Kit, "New to coding agents? Start here", About, Privacy, Terms, Credits. A skip link must stay first.

## Appearance

- [ ] Light and dark follow `prefers-color-scheme`. Today the home page, `/install` and `/start` render dark in both schemes, and the header is dark in light mode. Keep or change that deliberately.
- [ ] Reduced motion: not captured in this baseline. Check that the homepage planet and any transitions respect `prefers-reduced-motion`.
- [ ] Very long pages: on iPhone, `/skills` is about 16,700 CSS pixels tall, `/kits/design-kit` about 11,600 and `/skills/animate` about 10,800.

## Re-capturing

The scripts in `scripts/` produced this data. Run each from `site/` against a running build (`BASE` defaults to `http://localhost:3200`, except `verify.mjs`, which defaults to `http://localhost:3000`):

- `shots.mjs <out> [prompt-slug]` (default `status-hidden-in-a-pile-of-flags`): above-the-fold and full-page screenshots of 24 templates at 1440 and 1728 (2x), iPad Pro 11 and iPhone 15 Pro, light and dark.
- `journeys.mjs <out>`: the recorded journeys.
- `manifest.mjs <out>`: `pages.json` (the `routes.txt` paths plus `extra-routes.txt`, marked `inSitemap: false`), install commands and file hashes.
- `copies.mjs <out>`: `copy-buttons.json` and the payload texts (needs `pages.json` in `<out>`).
- `verify.mjs`: the regression check above.
