---
name: design-setup
description: "Walk through the design kit's two choices in plain words (how /design starts, and whether it asks before editing files) and save the answers with one yes."
disable-model-invocation: true
metadata:
  short-description: Choose how /design starts and whether it asks first
  author: AtlasScope/agent-kit
---

# Design setup

The user typed `/design-setup`. Explain each choice so someone who has never seen the kit can answer, ask, then save the answers with one yes. Claude Code also asks these questions when the kit is turned on; this is the friendlier way through the same choices, and it can be run again any time.

## Where this works

Only Claude Code has these choices. In Codex or claude.ai, say that `/design` there always waits to be typed and there is nothing to set, then stop.

## Check first

Do both checks before asking anything, and mention a result only when it changes what they should expect.

- **Organisation settings.** An organisation can set these answers for everyone, and its setting wins over the user's file. Read whichever of these exist: `/Library/Application Support/ClaudeCode/managed-settings.json` (macOS), `/etc/claude-code/managed-settings.json` (Linux and WSL), `C:\Program Files\ClaudeCode\managed-settings.json` (Windows), and any `*.json` in the `managed-settings.d` folder beside it. Look only at `pluginConfigs` entries whose key starts with `design-kit@`. If one sets these options, say their organisation has already chosen, name the values only if they are ones in the table below, and stop without writing.
- **Windows.** The answers reach each session through a small script that needs Git for Windows (Git Bash). On Windows, check that `bash` runs or that `CLAUDE_CODE_GIT_BASH_PATH` is set. If neither, tell them plainly that until Git for Windows is installed the kit keeps the defaults: `/design` waits to be typed and does not ask before edits, whatever is saved. They can still save their answers now.

## The questions

Ask them in this order. Each has exactly the values listed; save nothing else.

| Option | Values | Default |
|---|---|---|
| `start_mode` | `typed`, `automatic` | `typed` |
| `ask_before_edits` | `true`, `false` | `false` |

**1. How should `/design` start?**

`/design` is the kit's front door: you describe design work in your own words and it picks the one right skill for the job, says why, and starts it.

- **Typed** (the default): it runs only when you type `/design`. Talking about design in a normal chat never starts it.
- **Automatic**: it also starts when you ask for design work in your own words, such as "the settings page feels cramped". Its first line then says it started on its own, so you can stop it. Only `/design` works this way; every other design command still waits to be typed.

Pick typed if you like to stay in control of when a skill runs. Pick automatic if you would rather not remember the command.

**2. Should `/design` ask before a skill edits files?**

Some design skills change files in the project, some only report, and some only advise.

- **Off** (the default): `/design` names its pick and starts it right away.
- **On**: when the pick will change files, `/design` names it and waits for your yes first. A multi-step recipe counts as editing. Picks that only report or advise still start right away.

Pick on if you want a moment to say no before anything changes.

Ask one question at a time, in plain words, and say which answer is the default. If they are unsure, recommend the default. If they already gave both answers in the message that started this command, confirm them instead of asking again.

## Save

The answers live in the user's Claude Code settings file: `$CLAUDE_CONFIG_DIR/settings.json` when that variable is set, otherwise `~/.claude/settings.json` (`%USERPROFILE%\.claude\settings.json` on Windows). Claude Code reads these answers only from that file, never from a project's settings.

1. Read the file. Find the key under `enabledPlugins` that starts with `design-kit@` and use the same name, usually `design-kit@agent-kit`. If there is none, use `design-kit@agent-kit`.
2. Read the current answers at `pluginConfigs["<that key>"].options`. A value that is not one of those in the table counts as not set; never repeat it or act on it.
3. Show the change and nothing else from the file, because it may hold other private settings. Show the `pluginConfigs` entry for the design kit as it is now and as it will be, in a fenced code block:

   ```json
   "pluginConfigs": {
     "design-kit@agent-kit": {
       "options": {
         "start_mode": "automatic",
         "ask_before_edits": true
       }
     }
   }
   ```

   Then ask one question: save this to your settings file?
4. Only after a clear yes, write it. Change only those two values; keep every other key in the file, in `pluginConfigs` and in the design kit's `options` as it was. Create the file, `pluginConfigs` or the entry if missing. Check the file is still valid JSON afterwards. Claude Code may ask its own permission to edit the file; that is the same yes, not a second question from you.
5. If they say no, or the edit fails, save nothing and tell them how to set it themselves: run `/config`, open the design kit's plugin options, and choose the same answers.

If the answers are already saved as chosen, say so and write nothing.

## After saving

Say in two or three plain sentences what will happen and when: the change applies from the next Claude Code session, not this one. Describe what they will notice there (for example, "ask for design work in your own words and `/design` will start, saying so in its first line"). If it does not show up there, an organisation setting this command cannot read (a device profile or the admin console) may be overriding it. They can run `/design-setup` again or use `/config` to change it.

## Do not

- Run this on your own, or suggest it in the middle of other work. It runs only when typed.
- Write anything without showing the change and getting a yes, every time, even if they said yes on an earlier run.
- Edit a project's `.claude/settings.json` or `.claude/settings.local.json`. Claude Code ignores these answers there.
- Ask about anything else here. Other design commands always wait to be typed and have no choices.
