#!/bin/sh
# Prints fixed notes only for the exact values offered at install. Any other
# value, including none, prints nothing, so the routers keep their defaults
# and a saved setting never reaches the session as text.
if [ "$CLAUDE_PLUGIN_OPTION_START_MODE" = "automatic" ]; then
  echo "Agent Kit preference: the person set /engineer and /database to start automatically. This applies to this session; a change in /config takes effect in the next one. They want engineering problems described in their own words (a symptom, a worry, a plan) handled as if they had typed /engineer, and PostgreSQL problems as if they had typed /database. The Skill tool cannot start either; read $CLAUDE_PLUGIN_ROOT/skills/engineer/SKILL.md or $CLAUDE_PLUGIN_ROOT/skills/database/SKILL.md and follow it."
fi
if [ "$CLAUDE_PLUGIN_OPTION_ROUTER_LOG" = "true" ]; then
  echo "Agent Kit preference: the person turned on the local router log for /engineer and /database. Each time /engineer or /database names its route, append one JSON line to .artifacts/agent-kit/router-log.jsonl in the primary checkout (the parent of git rev-parse --path-format=absolute --git-common-dir). If that folder is new, create it with a .gitignore that holds a single *, so the log is never committed. The line: {\"at\": the time in ISO 8601, \"router\": \"/engineer\" or \"/database\", \"request\": their words up to 300 characters, \"route\": the pick as you named it, or ask, \"auto\": true if it started without being typed}. After their next message, append {\"at\", \"router\", \"outcome\": accepted, redirected or stopped, \"to\": what they asked for instead, if anything}. Outside a git repository, or if the write fails, skip it without comment. The log never changes or delays the pick, and is never sent anywhere."
fi
exit 0
