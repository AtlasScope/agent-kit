# Agent Kit engineering

Own the outcome. Agent Kit gives people the creative and technical capabilities of an experienced product team, without needing to know the right words. Ship useful software, not evidence that work happened.

## Find your way

- [PRODUCT.md](PRODUCT.md): what we ship, where it is going and the promises we keep.
- [CONTRIBUTING.md](CONTRIBUTING.md): content, plugin compatibility, versions and generated releases.
- [DESIGN.md](DESIGN.md) and [DESIGN-CONTRACT.md](DESIGN-CONTRACT.md): current site direction and actual shared interfaces.
- `kits/`: shipped skills, manifests, references and their supporting code. `library/`: prompt and recipe source, standalone exports. `site/`: Next.js website and public read-only MCP; [operations](site/README.md).
- `.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json`: distribution catalogs. `CLAUDE.md` imports this file.

Current code and explicit user direction outrank historical plans. Use the existing project Spaces for ongoing strategy and research when accessible; do not replicate them in the public repo. Git is the history.

## Work like an owner

Start from current main. Inspect the relevant code and its consumers, not the entire repo by default. Make the smallest coherent change that actually solves the problem; replace bad abstractions instead of building more around them. Prefer independent parallel work when it speeds delivery; give each worker a distinct outcome and avoid overlapping investigations or repeated builds, reviews and tests.

For concurrent writing, use separate branches/worktrees from current `origin/main` (native `git worktree add -b <branch> <path> origin/main` or the agent's native isolation). Coordinate shared files; never reset, stash, switch, force-remove or delete someone else's work. A clean, merged worktree can be removed without force. Keep temporary experiments, screenshots, traces and scratch scripts in ignored `.artifacts/` or outside the repo. Install the working-copy plugins only when dogfooding; see the README's local installer.

A script, hook, dependency, test or document must earn its ongoing maintenance. Remove obsolete tooling rather than polishing it. If a temporary investigation is needed again, write the right tool for that problem then. Preserve product functionality, public contracts, security, privacy, licenses and authoritative source/evidence; trace consumers before deleting shipped files or generated assets.

## Ship

- Keep public library access ungated; accounts are optional. Never expose secrets, private project names, local paths or personal data. Never invent test results, counts, claims or provenance.
- Follow the contribution guide for versions, credits, stable IDs and rebuilds. Do not hand-edit generated files.
- Run the narrowest useful checks for the changed behavior; CI is not a reason to run every command locally first. Add a test when it protects a meaningful behavior, not to count coverage. Use a real browser/device when the risk warrants it, not mandatory screenshots or arbitrary scores.
- Keep pull requests coherent. Describe the outcome, actual verification and genuine remaining risk briefly. Use current required checks and resolve review threads; merge authorized work without bypassing safeguards. No mandatory handoff document, review committee or repeated proof.
