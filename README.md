# Agent Kit

Skills for AI coding agents, plus a prompt library you can open beside any of them. Every command runs only when you call it.

| Plugin | What it does |
|---|---|
| [design-kit](kits/design-kit) | `/design` routes to the right design skill or recipe: typography, color, motion, UX writing, usability, landing copy, native iOS and more. |
| [engineering-kit](kits/engineering-kit) | `/engineer` routes to bug diagnosis, test-first work, architecture scans, plan interviews, retros and research. |
| [experience-architecture](kits/experience-architecture) | Diagnose, rethink and verify how a web app's pages, navigation, URLs and Back button hang together. |
| [working-style](kits/working-style) | `/ceo` explains in plain English, `/recommend` makes the call, `/harsh-review` gives direct critique, `/viewport-proof` judges a screen across viewports. |

## Install

**Claude Code**

```sh
claude plugin marketplace add AtlasScope/agent-kit
claude plugin install design-kit@agent-kit
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

**Cursor** reads plain skill folders. Clone this repo and run `scripts/install-local.sh` (Mac and Linux), which links the skills into `~/.cursor/skills`.

**Working from a clone.** `scripts/install-local.sh` points Claude Code, Codex and Cursor at your clone, so an edit shows up in the next session without pushing first. Run it once after cloning; rerun it after adding or removing a skill.

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

## License

MIT, except third-party skills, which keep their own licenses as listed in each kit's `THIRD_PARTY.md`.
