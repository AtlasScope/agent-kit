# Agent Kit

Agent Kit by AtlasScope is a free, open set of skills and prompts for AI coding agents. It ships as five installable kits, a standalone prompt library, a public website at [atlasscope.dev](https://www.atlasscope.dev), and a read-only MCP server.

It's for people who use Claude Code, Codex, Cursor, or another coding agent and want it to follow a clear method for design, motion, engineering, database, and product structure work. If you've never used a coding agent before, the site also has an eight-step [first-app guide](https://www.atlasscope.dev/start).

Most of the skills come from other authors: 49 of the 66 come from Emil Kowalski, Matt Pocock, Wondel.ai, and seven other authors. Agent Kit routes between them and adds 17 skills of its own. See [CREDITS.md](CREDITS.md).

## Get one result

In Claude Code:

1. `claude plugin marketplace add AtlasScope/agent-kit` registers the catalog without installing anything yet.
2. `claude plugin install design-kit@agent-kit` installs one kit. Start a new session so it loads.
3. Type `/design` followed by what you need, like `/design the settings page looks generic, fix the hierarchy`. It names the skill it picked and why in one line, then starts.

Some `/design` recipes hand steps to external plugins Agent Kit doesn't ship, like Impeccable. Those are listed under [Plugins the routers call but don't ship](CREDITS.md#plugins-the-routers-call-but-dont-ship) and install separately.

## What's inside

Agent Kit has 5 kits (66 skills total) and 255 library entries.

| Kit | Skills | What it does |
|---|---|---|
| [design-kit](kits/design-kit) | 40 | `/design` routes to the right design skill or recipe: layout, typography, color, motion, UX writing, usability, landing copy, native iOS, and more. Includes `/design-setup`, `/palette-builder`, `fix-writing` and an early `/keen`, Agent Kit's own design command. |
| [motion-kit](kits/motion-kit) | 1 | `/motion` sets up a motion system, storyboards a sequence, builds an animation, and reviews or fixes existing motion using code scans and browser frame captures. |
| [engineering-kit](kits/engineering-kit) | 17 | `/engineer` routes to bug diagnosis, test-first work, architecture scans, plan interviews, retros, and research. `/database` picks and runs a read-only PostgreSQL investigation. Includes `/engineering-setup`. |
| [experience-architecture](kits/experience-architecture) | 4 | `diagnose`, `rethink`, `verify`, and `walkthrough` (preview) inspect and test how a web app's pages, navigation, URLs, and Back button hang together. |
| [working-style](kits/working-style) | 4 | `/ceo` explains in plain English, `/recommend` makes the call, `/harsh-review` gives direct critique, and `/viewport-proof` checks a screen across sizes. |

## Install

Commands in `design-kit`, `motion-kit`, `engineering-kit`, and `working-style` wait to be typed unless you turn on automatic start for `/design`, `/engineer`, or `/database`. The four `experience-architecture` skills, `fix-writing`, five borrowed design skills, and four engineering helper skills can also be picked by the agent when your request calls for them.

### Claude Code

```sh
claude plugin marketplace add AtlasScope/agent-kit
claude plugin install design-kit@agent-kit
claude plugin install motion-kit@agent-kit
claude plugin install engineering-kit@agent-kit
claude plugin install experience-architecture@agent-kit
claude plugin install working-style@agent-kit
```

**Choices at install.** Claude Code asks three short questions when you turn on `design-kit` and two for `engineering-kit`. All default to how the kit has always worked, and you can change them later (changes take effect in the next session):

- **How should the router start?** `typed` (the default) runs `/design`, `/engineer`, or `/database` only when you type it. `automatic` also starts it when you ask for that kind of work in plain words. Other commands still wait to be typed.
- **Ask before a design skill edits files?** (`design-kit` only, off by default.) When on, `/design` names its pick and waits for your yes before changing files.
- **Keep a local log of what the router picks?** Off by default. When on, each pick adds a line to `.artifacts/agent-kit/router-log.jsonl` in that project with your request, the pick, and what you did next. That folder gitignores itself, and nothing is sent anywhere.

To change an answer, type `/design-setup` or `/engineering-setup`. Both explain the choices in plain words and update your settings only after you confirm. `/config` works too. On Windows these choices need Git for Windows (Git Bash); without it the kits keep their defaults. Codex and claude.ai don't ask, so routers there stay typed-only.

**Claude Code cloud sessions.** Add this to the repo's `.claude/settings.json`, keeping only the kits you want:

```json
{
  "extraKnownMarketplaces": {
    "agent-kit": { "source": { "source": "github", "repo": "AtlasScope/agent-kit" } }
  },
  "enabledPlugins": {
    "design-kit@agent-kit": true,
    "motion-kit@agent-kit": true,
    "engineering-kit@agent-kit": true,
    "experience-architecture@agent-kit": true,
    "working-style@agent-kit": true
  }
}
```

### Codex

```sh
codex plugin marketplace add AtlasScope/agent-kit
codex plugin add design-kit@agent-kit
```

Repeat `codex plugin add` for each kit you want.

### Any agent that reads Agent Skills

```sh
npx skills add AtlasScope/agent-kit
```

This copies the skill folders into `.agents/skills` in the current project (`npx skills remove --all` removes them). For Cursor, Gemini CLI, or GitHub Copilot, pass `-a cursor`, `-a gemini-cli`, or `-a github-copilot`. This copies files only: it doesn't register Claude Code's install choices or install companion plugins that some recipes call.

**What's been tested.** On 9 Nov 2026 in a clean config: the Claude Code marketplace add, `design-kit` install, update, and uninstall (Claude Code 2.1.321), and `npx skills add` and `remove` (skills 1.7.6). Codex installation and Cursor skill copying were tested on 23 Nov 2026 (codex-cli 0.171.0 and cursor-agent 2026.11.19). Gemini CLI and GitHub Copilot remain documented but untested.

### Working from a local clone

Run `scripts/install-local.sh` on Mac or Linux to point Claude Code, Codex, and Cursor at your local clone so edits show up in your next session without pushing first. Claude Code keeps a copy of each plugin, so rerun the script after editing; it reinstalls only when the clone has changed. For Cursor, the script links skill folders into `~/.cursor/skills` and runs `experience-architecture`'s installer.

### Connect via MCP

You can also connect your agent to the read-only MCP server at `https://www.atlasscope.dev/mcp` to search and read prompts and skills without installing a plugin. See [atlasscope.dev/mcp-setup](https://www.atlasscope.dev/mcp-setup) for client configs.

## Prompt library

[`library/dist/prompt-library.html`](library/dist/prompt-library.html) is a single self-contained HTML page. It opens on "What's wrong?", a short list of plain problems that each point to up to three things to try, and sorts everything else into the kit's areas (Design with Keen, Motion, Bugs and speed, Data and so on). Copying a prompt gives the agent everything it needs, including what it may change and what to bring back. Commands written by other people sit on an Other tools page that names the Agent Kit job doing the same work. You can:

- Open it in a browser or in the side browser in Codex or Cursor.
- Upload it as a Claude artifact.
- Read [`library/dist/prompt-library.md`](library/dist/prompt-library.md) as a plain Markdown cheat sheet.

The data lives in [`library/library.json`](library/library.json) and the layout in [`library/template.html`](library/template.html). After editing either, rebuild the generated files:

```sh
node library/build.mjs
```

`--overlay <file>` merges extra fields into a private copy, and `--out <dir>` writes to another folder. Keep private builds out of this repository.

## Website

[`site/`](site/README.md) is the public Next.js library deployed on Vercel at [atlasscope.dev](https://www.atlasscope.dev). It builds static pages for every prompt, skill, kit, and symptom directly from `library/` and `kits/`, adds `.md` twins and `llms.txt` for agents, hosts an eight-step beginner guide at `/start`, provides optional accounts (Clerk + Neon) for Starred items and collections, and serves the read-only `/mcp` endpoint. See [`site/README.md`](site/README.md) to run and test it.

## Layout

- `kits/<name>/`: each kit's README, license, scripts, tests, and `THIRD_PARTY.md` (when it carries borrowed skills), with the installable plugin under `kits/<name>/plugins/<name>/`. `design-kit`, `engineering-kit`, and `experience-architecture` were separate repos until November 2026 and keep their git history here.
- `.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json`: catalogs listing all five plugins.
- `library/`: prompt library source (`library.json`, `template.html`), editorial standard, shared build and check scripts, and public generated `dist/` exports.
- `site/`: the Next.js website and MCP server.
- `scripts/`: repo-wide checks and the optional local installer.
- `tests/`: router test cases and log-to-case converter (`tests/routing/`).
- [`PRODUCT.md`](PRODUCT.md), [`DESIGN.md`](DESIGN.md), [`AGENTS.md`](AGENTS.md) and [`CONTRIBUTING.md`](CONTRIBUTING.md): current product and engineering context.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) to add or improve a prompt or skill, [GLOSSARY.md](GLOSSARY.md) for the terms we use, and [SECURITY.md](SECURITY.md) to report a security issue privately.

## License

[MIT](LICENSE) covers everything written for Agent Kit: the routers, the original skills, the prompt library, and the website. Borrowed skills keep their own licenses (MIT, and CC BY 4.0 for `color-expert`), shipped in each skill's folder and listed in [CREDITS.md](CREDITS.md) and each kit's `THIRD_PARTY.md`. The MIT license here does not replace them.
