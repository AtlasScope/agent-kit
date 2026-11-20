# Agent instructions

Agent Kit ships skills for coding agents (`kits/`), a prompt library (`library/`), and a Next.js website (`site/`). [CONTRIBUTING.md](CONTRIBUTING.md) has the rules for adding prompts and skills; follow it alongside the rules below. `CLAUDE.md` points here via `@AGENTS.md`, so this file is the single source of truth for agent rules.

## Repository layout

- `kits/<kit>/plugins/<kit>/`: installable plugin (`design-kit`, `motion-kit`, `engineering-kit`, `experience-architecture`, `working-style`), with `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, `README.md`, and `skills/<name>/SKILL.md`.
- `kits/<kit>/`: kit wrapper README, `LICENSE`, `THIRD_PARTY.md` (when the kit holds borrowed skills), build scripts, and kit-specific tests.
- `.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json`: root catalogs for Claude Code and Codex.
- `library/`: `library.json`, `audit.json`, `template.html`, `EDITORIAL.md`, `check.mjs`, `build.mjs`, and generated files in `library/dist/`.
- `site/`: Next.js App Router site and `/mcp` server. `site/content/generated.json` (gitignored, built by `npm run content`) and `site/components/AtlasScopeLogo.tsx` are generated; don't edit them by hand.
- `scripts/`: `check-public.mjs`, `check-catalog.mjs`, `install-local.sh`, `lanes.mjs`.
- `tests/routing/`: routing test cases (`cases.json`) and validation (`check.mjs`, `from-log.test.mjs`).
- `docs/`: ADRs (`docs/adr/`), design notes, and handoffs (`docs/handoffs/`).

## One worktree per session

Every writing session works in its own worktree and branch, started from current `origin/main`. Never write in the primary checkout, and keep it on `main`. Never switch, stash, reset, or clean a worktree another session may be using.

- **Claude Code** creates the session's worktree through the `WorktreeCreate` hook in `.claude/settings.json`. It fetches `origin/main` and puts the lane in `.worktrees/<name>` on branch `claude/<name>`.
- **Other agents** run `node scripts/lanes.mjs new <branch>` from any checkout and work in the folder it prints.
- **Check before editing files another lane may touch:** `node scripts/lanes.mjs list` shows every lane, its uncommitted work, and overlapping files.
- **Scratch output** (screenshots, notes, review files) goes in `.artifacts/`. In a lane that links to the primary checkout's `.artifacts/`, so it survives the lane's removal. Handoffs another session must read are committed under `docs/handoffs/`.

## One pull request at a time, then a fresh lane

A lane carries one pull request. After it merges:

1. Leave the lane. In Claude Code, `ExitWorktree` with removal runs the `WorktreeRemove` hook; elsewhere run `node scripts/lanes.mjs finish <lane path>` from another checkout.
2. For the next change in the same session, open a new lane (`EnterWorktree` or `lanes.mjs new`). It starts from the newly merged `main`.

Removal refuses a lane with uncommitted changes, or with commits that aren't on `main` and aren't the exact head of a merged pull request. Never delete a lane by hand to get around that.

## Adding or changing skills and prompts

- **Skill files:** every skill folder under `skills/<name>/` needs `SKILL.md` whose YAML frontmatter `name` matches `<name>`. Command-only skills also set `disable-model-invocation: true` in `SKILL.md` and `allow_implicit_invocation: false` in `agents/openai.yaml`.
- **Borrowed skills:** copy at a pinned commit, keep the upstream `LICENSE` in the skill folder, add a row to the kit's `THIRD_PARTY.md` and to `CREDITS.md`, and keep the Markdown table row formats intact (`site/scripts/build-content.mjs` parses them with regexes).
- **Plugin READMEs:** every `kits/<kit>/plugins/<kit>/README.md` must stay at 40+ words outside code blocks (`scripts/check-catalog.mjs` enforces it).
- **Version bumps are required:** Any change to a kit's shipped files means raising its version in both plugin manifests (`kits/<kit>/plugins/<kit>/.claude-plugin/plugin.json` and `.codex-plugin/plugin.json`), `.claude-plugin/marketplace.json`, and any library badges in `library/library.json`, then running `node library/build.mjs`.
- **Rebuilding generated files:**
  - Prompt library: `node library/build.mjs`
  - `/design` router refs: `node kits/design-kit/scripts/build_references.mjs` (design command jobs live in `site/scripts/design-jobs.mjs`)
  - `/engineer` router refs: `node kits/engineering-kit/scripts/build_references.mjs`
  - `/database` router refs: `node kits/engineering-kit/scripts/build_database_references.mjs`

## Boundaries

- **Public repo:** never put secrets, personal names used as "the user", local home paths (`/Users/...`), machine notes (`on this Mac`), or private project names in shipped files. `node scripts/check-public.mjs` enforces this.
- **Honest claims:** never invent counts, benchmarks, testimonials, or test status. Site counts come from `site/content/generated.json`.
- **Separate concerns:** keep kit or library PRs apart from `site/` PRs, and keep each PR focused on one outcome.

## Verification commands

Run every check that covers the files you changed, from the repo root unless noted:

```sh
node scripts/check-public.mjs
node scripts/check-catalog.mjs
node library/check.mjs
node tests/routing/check.mjs
node --test tests/routing/from-log.test.mjs
node --test "kits/motion-kit/plugins/motion-kit/skills/motion/tests/*.test.mjs"
(cd kits/experience-architecture && npm test)
(cd site && npm ci && npm run content && npm run typecheck && npm test)
(cd site && npx next build)
```

Browser tests need Playwright:
- `site/` smoke tests: `(cd site && npx playwright install chromium && npx next build && npm run smoke)`
- `motion-kit` full capture suite: runs in CI with `MOTION_PLAYWRIGHT_DIR` set outside the repo and `MOTION_REQUIRE_BROWSER=1`. Without Playwright installed, browser subtests skip cleanly and the non-browser unit tests run.
- `experience-architecture` browser tests: require the `fixtures/northwind` app running on `:3100`; without it, browser subtests skip cleanly and the remaining unit tests run.

## Pull requests

- Describe the problem, the change, how you verified it (exact commands and results), and anything unverified, in plain English.
- Required checks: `ci`, `osv`, `codeql`. Codex reviews each pull request once when it opens; its notes are review threads like any other.
- Every review thread must be resolved before merge: fix it, or reply with why it stays and resolve it.
