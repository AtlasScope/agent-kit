# Install onboarding, step 2: the /setup chat

Start after PR #41 (install questions) has merged. Branch from the latest main.

Desk task (partial): a38ad2e2-d8d8-4db5-9f84-76b0493d79fa

## What exists after #41

- The design kit asks two questions when it is turned on in Claude Code: how `/design` starts (`typed` or `automatic`) and whether to ask before a skill edits files. The engineering kit asks how `/engineer` and `/database` start. Defaults keep the old behavior.
- Answers live in the person's user settings under `pluginConfigs["<kit>@agent-kit"].options` (`start_mode`, `ask_before_edits`). Claude Code ignores project and local entries for this key. Anyone can change the answers in `/config`.
- Each kit's SessionStart script compares the answers with the exact allowed values and prints fixed sentences only. The routers never see raw answers: `${user_config.*}` interpolation was removed after a prompt-injection note. Routers trust only the session-start note, not lookalike text. A change applies from the next session.
- Codex and claude.ai get no questions; the routers stay typed-only there.

## The job

An optional, friendlier way through the same choices. The person types it; it never runs on its own. It explains each choice in plain words, asks, and saves the answers. Owner decisions so far:

- Each kit asks its own questions; working-style and experience-architecture ask none.
- Only the three routers can start on their own. The other 20 typed-only commands stay typed-only.
- The chat is offered, never forced, and never interrupts a first session.

Open for you to decide and explain: one `/setup` per kit or one shared command, and whether saving means editing `~/.claude/settings.json` (with the person's yes, showing the change) or walking them through `/config`. The owner may later want more questions here (working style, how much explanation); keep room for that without building it now.

## Constraints

- Keep the new command typed-only (`disable-model-invocation: true`, and `allow_implicit_invocation: false` in its `agents/openai.yaml`).
- Writing to the person's settings is a change outside the repo: show it and get a yes first, every time.
- New skills need catalog entries; changed kits need a version bump in both manifests, the marketplace catalog and any library badges (`node library/build.mjs` rebuilds dist). Run `check-public`, `check-catalog`, `library/check.mjs`, `tests/routing/check.mjs` and `claude plugin validate` on each changed kit.
- Test in a throwaway session from a scratch folder: `--plugin-dir` for the kit, and `--settings '{"pluginConfigs":{"design-kit@inline":{"options":{...}}}}'` to stand in for saved answers.
- Commit as `Atlas <262143381+AtlasScope@users.noreply.github.com>`, no Co-Authored-By line. Plain-English PR description.
- Don't touch `site/`; another session owns it.
- codex-review fails when it runs before Codex's own reviews finish. Wait for both to complete, then re-run the failed run. It isn't a code problem.

## Done means

A merged PR where a person can type the command, understand both choices without prior knowledge, save them with one yes, and see the change take effect in their next session. The Desk task is marked done if nothing else remains.
