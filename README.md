# Agent Kit

Skills for AI coding agents, plus a prompt library you can open beside any of them. Every command runs only when you call it.

It's for people who already use a coding agent such as Claude Code, Codex or Cursor and want it to do design, engineering and database work the way an experienced person would.

Most of these skills are other people's work: 49 of the 62 come from Emil Kowalski, Matt Pocock, Wondel.ai and seven other authors. Agent Kit routes between them and adds 13 of its own. See [CREDITS.md](CREDITS.md).

## Get one result

In Claude Code:

1. `claude plugin marketplace add AtlasScope/agent-kit` registers the catalog. It doesn't install anything yet.
2. `claude plugin install design-kit@agent-kit` installs one kit. Start a new session so it loads.
3. Type `/design` followed by the job, for example `/design the settings page looks generic, fix the hierarchy`. It names the skill it picked and why in one line, then starts.

Some `/design` recipes hand steps to plugins Agent Kit doesn't ship, such as Impeccable. Those are listed under [Plugins the routers call but don't ship](CREDITS.md#plugins-the-routers-call-but-dont-ship) and install separately.

| Plugin | What it does |
|---|---|
| [design-kit](kits/design-kit) | `/design` routes to the right design skill or recipe: typography, color, motion, UX writing, usability, landing copy, native iOS and more. |
| [motion-kit](kits/motion-kit) | `/motion` sets up a product's motion system, storyboards a sequence, builds an animation, and reviews or fixes existing motion. It checks its work with a code inventory and frame-by-frame captures from a real browser. |
| [engineering-kit](kits/engineering-kit) | `/engineer` routes to bug diagnosis, test-first work, architecture scans, plan interviews, retros and research. `/database` picks and runs a read-only PostgreSQL investigation. |
| [experience-architecture](kits/experience-architecture) | Diagnose, rethink and verify how a web app's pages, navigation, URLs and Back button hang together. |
| [working-style](kits/working-style) | `/ceo` explains in plain English, `/recommend` makes the call, `/harsh-review` gives direct critique, `/viewport-proof` judges a screen across viewports. |

## Install

**Claude Code**

```sh
claude plugin marketplace add AtlasScope/agent-kit
claude plugin install design-kit@agent-kit
claude plugin install motion-kit@agent-kit
claude plugin install engineering-kit@agent-kit
claude plugin install experience-architecture@agent-kit
claude plugin install working-style@agent-kit
```

**Claude Code cloud sessions.** Add this to the repository's `.claude/settings.json`, keeping only the plugins you want:

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

**Codex**

```sh
codex plugin marketplace add AtlasScope/agent-kit
codex plugin add design-kit@agent-kit
```

Repeat `codex plugin add` for each plugin you want.

**Any agent that reads Agent Skills.** `npx skills add AtlasScope/agent-kit` copies the skill folders into the current project's `.agents/skills`, and `npx skills remove --all` takes them out again (tested with skills 1.7.6). That copies files only. It doesn't register the slash commands the way a plugin install does, and it doesn't install the companion plugins that some recipes call.

Tested on 9 Nov 2026 in a clean config: the Claude Code steps above, plus `claude plugin update` and `claude plugin uninstall` (Claude Code 2.1.321), and `npx skills add` and `remove` (skills 1.7.6). The Codex, Cursor, Gemini CLI and Copilot paths are documented but haven't been tested yet.

**Cursor** reads plain skill folders. Clone this repo and run `scripts/install-local.sh` (Mac and Linux), which links the skills into `~/.cursor/skills`.

**Working from a clone.** `scripts/install-local.sh` points Claude Code, Codex and Cursor at your clone, so an edit shows up in the next session without pushing first. Claude Code keeps a copy of each plugin, so rerun the script after editing (a session-start hook can run it for you); it reinstalls only when the clone has changed.

## Website

`site/` is the public library: one page for every prompt, skill and kit, a read-only MCP server, and optional accounts for Starred and collections. It is a Next.js app deployed on Vercel; see [`site/README.md`](site/README.md) to run it.

## Prompt library

[`library/dist/prompt-library.html`](library/dist/prompt-library.html) is one self-contained page with over 200 prompts, commands and recipes, a symptom finder, a prompt composer and stars that stay in your browser. Use it any of these ways:

- Upload it as a Claude artifact.
- Open it in a browser, or in the side browser in Codex or Cursor.
- Read [`prompt-library.md`](library/dist/prompt-library.md), the same entries as a plain cheat sheet.

The content lives in [`library/library.json`](library/library.json) and the layout in [`library/template.html`](library/template.html). After editing either, rebuild both files:

```sh
node library/build.mjs
```

`--overlay <file>` merges extra fields into a private copy (for example your own saved-prompt IDs or project notes) and `--out <dir>` writes it somewhere else. Keep private builds out of this repo.

## Layout

Each kit keeps its own README, credits, licenses and build scripts under `kits/<name>/`, with the plugin itself in `kits/<name>/plugins/<name>/`. The catalogs at `.claude-plugin/marketplace.json` (Claude Code) and `.agents/plugins/marketplace.json` (Codex) list all four. design-kit, engineering-kit and experience-architecture were separate repos until November 2026 and keep their history here.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) to add or improve a prompt or skill, and [SECURITY.md](SECURITY.md) to report a problem privately.

## License

[MIT](LICENSE) covers what was written for Agent Kit: the routers, the 12 original skills, the prompt library and the website. Third-party skills keep their own licenses (MIT, and CC BY 4.0 for `color-expert`), shipped in each skill's folder and listed in [CREDITS.md](CREDITS.md) and each kit's `THIRD_PARTY.md`. The MIT license here does not replace them.
