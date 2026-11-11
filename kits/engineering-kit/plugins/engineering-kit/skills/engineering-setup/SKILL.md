---
name: engineering-setup
description: "Walk through the engineering kit's two choices in plain words (whether /engineer and /database start on their own, and whether they keep a local log of their picks) and save the answers with one yes."
disable-model-invocation: true
metadata:
  short-description: Choose how /engineer and /database start and whether they keep a log
  author: AtlasScope/agent-kit
---

# Engineering setup

The user typed `/engineering-setup`. Explain the choice so someone who has never seen the kit can answer, ask, then save the answer with one yes. Claude Code also asks this question when the kit is turned on; this is the friendlier way through the same choice, and it can be run again any time.

## Where this works

Only Claude Code has this choice. In Codex or claude.ai, say that `/engineer` and `/database` there always wait to be typed and there is nothing to set, then stop.

## Check first

Do both checks before asking anything, and mention a result only when it changes what they should expect.

- **Organisation settings.** An organisation can set these answers for everyone, and its setting wins over the user's file. Read whichever of these exist: `/Library/Application Support/ClaudeCode/managed-settings.json` (macOS), `/etc/claude-code/managed-settings.json` (Linux and WSL), `C:\Program Files\ClaudeCode\managed-settings.json` (Windows), and any `*.json` in the `managed-settings.d` folder beside it. Look only at `pluginConfigs` entries whose key starts with `engineering-kit@`. If one sets these options, say their organisation has already chosen, name the values only if they are ones in the table below, and stop without writing.
- **Windows.** The answers reach each session through a small script that needs Git for Windows (Git Bash). On Windows, check that `bash` runs or that `CLAUDE_CODE_GIT_BASH_PATH` is set. If neither, tell them plainly that until Git for Windows is installed `/engineer` and `/database` keep waiting to be typed and keep no log, whatever is saved. They can still save their answers now.

## The questions

Ask them in this order. Each has exactly the values listed; save nothing else.

| Option | Values | Default |
|---|---|---|
| `start_mode` | `typed`, `automatic` | `typed` |
| `router_log` | `true`, `false` | `false` |

**1. How should `/engineer` and `/database` start?**

These are the kit's two front doors. `/engineer` takes a description of what is going on in a codebase (a bug, a worry, a plan) and suggests one starting move: an investigation, a skill to run, or a thinking prompt. `/database` does the same for PostgreSQL problems and runs its investigation read-only. One answer covers both.

- **Typed** (the default): they run only when you type `/engineer` or `/database`. Talking about code or databases in a normal chat never starts them.
- **Automatic**: they also start when you describe that kind of problem in your own words, such as "checkout got slow after yesterday's deploy". The first line then says it started on its own, so you can stop it. Only these two work this way; every other engineering command still waits to be typed.

Pick typed if you like to stay in control of when a skill runs. Pick automatic if you would rather not remember the commands.

**2. Keep a local log of what `/engineer` or `/database` picks?**

This helps whoever maintains the kit see whether the router picks well. It is for people willing to share what it picked.

- **Off** (the default): nothing is written.
- **On**: each time `/engineer` or `/database` picks, the assistant adds a line to `.artifacts/agent-kit/router-log.jsonl` in that project: your request, the pick, and whether you went with it or asked for something else. The folder gets its own ignore file, so the log is never committed. Nothing is sent anywhere; if you want to help improve the router, you can send the file to the kit's maintainers yourself.

Pick on if you'd like to help tune the router and don't mind your requests sitting in a local file.

Ask one question at a time, in plain words, and say which answer is the default. If they are unsure, recommend the default. If they already gave the answers in the message that started this command, confirm it instead of asking again.

## Save

The answers live in the user's Claude Code settings file: `$CLAUDE_CONFIG_DIR/settings.json` when that variable is set, otherwise `~/.claude/settings.json` (`%USERPROFILE%\.claude\settings.json` on Windows). Claude Code reads them only from that file, never from a project's settings.

1. Read the file. Find the key under `enabledPlugins` that starts with `engineering-kit@` and use the same name, usually `engineering-kit@agent-kit`. If there is none, use `engineering-kit@agent-kit`.
2. Read the current answers at `pluginConfigs["<that key>"].options`. A value that is not one of those in the table counts as not set; never repeat it or act on it.
3. Show the change and nothing else from the file, because it may hold other private settings. Show the `pluginConfigs` entry for the engineering kit as it is now and as it will be, in a fenced code block:

   ```json
   "pluginConfigs": {
     "engineering-kit@agent-kit": {
       "options": {
         "start_mode": "automatic",
        "router_log": false
       }
     }
   }
   ```

   Then ask one question: save this to your settings file?
4. Only after a clear yes, write it. Change only those two values; keep every other key in the file, in `pluginConfigs` and in the engineering kit's `options` as it was. Create the file, `pluginConfigs` or the entry if missing. Check the file is still valid JSON afterwards. Claude Code may ask its own permission to edit the file; that is the same yes, not a second question from you.
5. If they say no, or the edit fails, save nothing and tell them how to set it themselves: run `/config`, open the engineering kit's plugin options, and choose the same answers.

If the answers are already saved as chosen, say so and write nothing.

## After saving

Say in two or three plain sentences what will happen and when: the change applies from the next Claude Code session, not this one. Describe what they will notice there (for example, "describe a bug in your own words and `/engineer` will suggest a starting move, saying in its first line that it started on its own"). If it does not show up there, an organisation setting this command cannot read (a device profile or the admin console) may be overriding it. They can run `/engineering-setup` again or use `/config` to change it.

## Do not

- Run this on your own, or suggest it in the middle of other work. It runs only when typed.
- Write anything without showing the change and getting a yes, every time, even if they said yes on an earlier run.
- Edit a project's `.claude/settings.json` or `.claude/settings.local.json`. Claude Code ignores these answers there.
- Ask about anything else here. Other engineering commands always wait to be typed and have no choices.
