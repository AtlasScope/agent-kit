# Agent instructions

Agent Kit ships skills for coding agents (`kits/`), the prompt library (`library/`), and the website (`site/`). [CONTRIBUTING.md](CONTRIBUTING.md) has the checks and the rules for adding prompts and skills; follow it.

## One worktree per session

Every writing session works in its own worktree and branch, started from current `origin/main`. Never write in the primary checkout, and keep it on `main`. Never switch, stash, reset or clean a worktree another session may be using.

- **Claude Code** creates the session's worktree through the `WorktreeCreate` hook in `.claude/settings.json`. It fetches `origin/main` and puts the lane in `.worktrees/<name>` on branch `claude/<name>`.
- **Other agents** run `node scripts/lanes.mjs new <branch>` from any checkout and work in the folder it prints.
- **Check before editing files another lane may touch:** `node scripts/lanes.mjs list` shows every lane, its uncommitted work and the files that overlap.
- **Scratch output** (screenshots, notes, review files) goes in `.artifacts/`. In a lane that is a link to the primary checkout's `.artifacts/`, so it survives the lane's removal. Handoffs another session must read are committed under `docs/handoffs/`.

## One pull request at a time, then a fresh lane

A lane carries one pull request. After it merges:

1. Leave the lane. In Claude Code, `ExitWorktree` with removal runs the `WorktreeRemove` hook; elsewhere run `node scripts/lanes.mjs finish <lane path>` from another checkout.
2. For the next change in the same session, open a new lane (`EnterWorktree`, or `lanes.mjs new`). It starts from the newly merged `main`.

Removal refuses a lane with uncommitted changes, or with commits that are not on `main` and are not the exact head of a merged pull request. Never delete a lane by hand to get around that.

## Pull requests

- Keep each one to one outcome, and keep kit or library changes apart from `site/` changes.
- Describe the problem, the change, how it was checked and what is unverified, in plain English.
- Required checks: `ci`, `osv`, `codeql`. Codex reviews each pull request once, when it opens; its notes are review threads like any other.
- Every review thread must be resolved before merge: fix it, or reply with the reason it stays and resolve it.
- Changing a kit means raising its version in both plugin manifests, `.claude-plugin/marketplace.json` and any library badges, then running `node library/build.mjs`.
