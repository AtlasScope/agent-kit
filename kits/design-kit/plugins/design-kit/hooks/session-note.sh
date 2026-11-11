#!/bin/sh
# Prints fixed notes for the session, and only for the exact values offered at
# install. Any other value, including none, prints nothing, so /design keeps its
# defaults and a saved setting never reaches the session as text.
if [ "$CLAUDE_PLUGIN_OPTION_START_MODE" = "automatic" ]; then
  echo "Agent Kit preference: the person set /design to start automatically. This applies to this session; a change in /config takes effect in the next one. They want design requests made in their own words (a new page, a change to one, a review, copy, color, type, motion) handled as if they had typed /design. The Skill tool cannot start /design; read $CLAUDE_PLUGIN_ROOT/skills/design/SKILL.md and follow it."
fi
if [ "$CLAUDE_PLUGIN_OPTION_ASK_BEFORE_EDITS" = "true" ]; then
  echo "Agent Kit preference: the person turned on ask before edits for /design. They want /design to name its pick and wait for their yes before running any skill that changes files."
fi
if [ "$CLAUDE_PLUGIN_OPTION_ROUTER_LOG" = "true" ]; then
  echo "Agent Kit preference: the person turned on the local router log for /design. Each time /design names its route, append one JSON line to .artifacts/agent-kit/router-log.jsonl in the primary checkout (the parent of git rev-parse --path-format=absolute --git-common-dir). If that folder is new, create it with a .gitignore that holds a single *, so the log is never committed. The line: {\"at\": the time in ISO 8601, \"router\": \"/design\", \"request\": their words up to 300 characters, \"route\": the pick as you named it, or ask, \"auto\": true if it started without being typed}. After their next message, append {\"at\", \"router\", \"outcome\": accepted, redirected or stopped, \"to\": what they asked for instead, if anything}. Outside a git repository, or if the write fails, skip it without comment. The log never changes or delays the pick, and is never sent anywhere."
fi
exit 0
