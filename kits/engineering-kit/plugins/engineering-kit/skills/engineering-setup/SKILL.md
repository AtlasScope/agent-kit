---
name: engineering-setup
description: "Walk through the engineering kit's choice in plain words (whether /engineer and /database start on their own) and save the answer with one yes."
disable-model-invocation: true
metadata:
  short-description: Choose how /engineer and /database start
  author: AtlasScope/agent-kit
---

# Engineering setup

The user typed `/engineering-setup`. Explain the choice so someone who has never seen the kit can answer, ask, then save the answer with one yes. Claude Code also asks this question when the kit is turned on; this is the friendlier way through the same choice, and it can be run again any time.

## Where this works

Only Claude Code has this choice. In Codex or claude.ai, say that `/engineer` and `/database` there always wait to be typed and there is nothing to set, then stop.

## The question

It has exactly the values listed; save nothing else.

| Option | Values | Default |
|---|---|---|
| `start_mode` | `typed`, `automatic` | `typed` |

**How should `/engineer` and `/database` start?**

These are the kit's two front doors. `/engineer` takes a description of what is going on in a codebase (a bug, a worry, a plan) and suggests one starting move: an investigation, a skill to run, or a thinking prompt. `/database` does the same for PostgreSQL problems and runs its investigation read-only. One answer covers both.

- **Typed** (the default): they run only when you type `/engineer` or `/database`. Talking about code or databases in a normal chat never starts them.
- **Automatic**: they also start when you describe that kind of problem in your own words, such as "checkout got slow after yesterday's deploy". The first line then says it started on its own, so you can stop it. Only these two work this way; every other engineering command still waits to be typed.

Pick typed if you like to stay in control of when a skill runs. Pick automatic if you would rather not remember the commands.

Ask in plain words and say which answer is the default. If they are unsure, recommend the default. If they already gave the answer in the message that started this command, confirm it instead of asking again.

## Save

The answer lives in the user's Claude Code settings file: `$CLAUDE_CONFIG_DIR/settings.json` when that variable is set, otherwise `~/.claude/settings.json` (`%USERPROFILE%\.claude\settings.json` on Windows). Claude Code reads it only from that file, never from a project's settings.

1. Read the file. Find the key under `enabledPlugins` that starts with `engineering-kit@` and use the same name, usually `engineering-kit@agent-kit`. If there is none, use `engineering-kit@agent-kit`.
2. Read the current answer at `pluginConfigs["<that key>"].options.start_mode`. A value that is not one of those in the table counts as not set; never repeat it or act on it.
3. Show the change and nothing else from the file, because it may hold other private settings. Show the `pluginConfigs` entry for the engineering kit as it is now and as it will be, in a fenced code block:

   ```json
   "pluginConfigs": {
     "engineering-kit@agent-kit": {
       "options": {
         "start_mode": "automatic"
       }
     }
   }
   ```

   Then ask one question: save this to your settings file?
4. Only after a clear yes, write it. Change only that value; keep every other key in the file, in `pluginConfigs` and in the engineering kit's `options` as it was. Create the file, `pluginConfigs` or the entry if missing. Check the file is still valid JSON afterwards. Claude Code may ask its own permission to edit the file; that is the same yes, not a second question from you.
5. If they say no, or the edit fails, save nothing and tell them how to set it themselves: run `/config`, open the engineering kit's plugin options, and choose the same answer.

If the answer is already saved as chosen, say so and write nothing.

## After saving

Say in two or three plain sentences what will happen and when: the change applies from the next Claude Code session, not this one. Describe what they will notice there (for example, "describe a bug in your own words and `/engineer` will suggest a starting move, saying in its first line that it started on its own"). They can run `/engineering-setup` again or use `/config` to change it.

## Do not

- Run this on your own, or suggest it in the middle of other work. It runs only when typed.
- Write anything without showing the change and getting a yes, every time, even if they said yes on an earlier run.
- Edit a project's `.claude/settings.json` or `.claude/settings.local.json`. Claude Code ignores this answer there.
- Ask about anything else here. Other engineering commands always wait to be typed and have no choices.
