# Studio Kit

One command, `/studio`, for choosing how your interface looks. It opens a live page on your computer where you see finished looks and every option drawn for real, for a button, a colour palette or typography. Pick one or more of those studios and work in one workspace. Compare options, fine-tune them, undo, ask the agent for more, then send a proposal back to chat.

| You type | What happens | Changes files |
|---|---|---|
| `/studio button` | Opens the studio for your buttons, starting from the buttons the project already has | No |
| `/studio palette type` | Opens one workspace with a colour palette studio and a typography studio side by side | No |
| `/studio` | Asks which studios you want, then opens them | No |

Nothing in your application changes while you explore. When you send a proposal to chat, the agent applies it only after you approve it. The command runs only when you type it.

## What is different about it

- **Finished looks first.** You start from complete looks, then go into the detail. You do not build a design one setting at a time from nothing.
- **Every option drawn for real.** Each choice is rendered on the page, not described in words.
- **Compare and undo.** Put options next to each other, change your mind and step back.
- **Ask for more.** If nothing fits, ask the agent. It adds options to the page and the page keeps every pick you have made.
- **A proposal, then your approval.** What you chose goes to chat as a written proposal. The application is untouched until you say to build it.
- **Local and light.** The page is served from your own computer. It needs only Node 18 or later and installs nothing.

## Install

**Claude Code on a computer (Mac, Windows, Linux)**

```sh
claude plugin marketplace add AtlasScope/agent-kit
claude plugin install studio-kit@agent-kit
```

Update later with `claude plugin marketplace update agent-kit` and `claude plugin update studio-kit@agent-kit`.

**Codex on a computer**

```sh
codex plugin marketplace add AtlasScope/agent-kit
codex plugin add studio-kit@agent-kit
```

Then type `/studio` in a project. The page opens on `127.0.0.1` and works offline: everything it needs, including its fonts, is inside the plugin.

## The scripts on their own

They work without the skill. Node 18 or later, no dependencies to install.

```sh
node kits/studio-kit/plugins/studio-kit/skills/studio/scripts/studio.mjs new|open|wait|check|state|refresh|stop|cloud <dir>

# choose which studios the page includes
node kits/studio-kit/plugins/studio-kit/skills/studio/scripts/studio.mjs new <dir> --modules button,palette,type
```

`new` writes the page, `open` serves it and prints its address, `wait` reports what you send from the page, `check` confirms the page still parses after an edit, `state` prints your current choices, `refresh` rebuilds the page from the skill and keeps your work, `stop` ends the server, and `cloud` writes a copy meant for a cloud session.

## Layout

| Path | What |
|---|---|
| `skills/studio/SKILL.md` | The command: what it does, the rules that hold every time |
| `skills/studio/src/` | The page: shared workspace code and one folder per studio |
| `skills/studio/scripts/` | `studio.mjs`, which builds, serves and updates the page |
| `skills/studio/agents/openai.yaml` | Codex display name and invocation policy |

## What has and has not been tested

- Version 0.1.0 is early. It has been run only on Windows, with Claude Code, in local sessions, in Chromium.
- Codex, Cursor, Mac, Safari, a real phone and cloud sessions are not yet tested.
- `skills/studio/tests/studio.test.mjs` checks that a built page passes its own check, that new categories follow the page's rules, and that the colour maths matches Palette Builder's. It runs in CI when the kit changes.

## Sources

The skill is original to Agent Kit and MIT licensed. The studio's own frame carries the AtlasScope symbol and wordmark (© AtlasScope) and a Latin subset of Geist and Geist Mono (Vercel with basement.studio, SIL Open Font License 1.1, licence in `skills/studio/src/studio/fonts/OFL.txt`). The designs inside it use the project's own fonts and colours.
