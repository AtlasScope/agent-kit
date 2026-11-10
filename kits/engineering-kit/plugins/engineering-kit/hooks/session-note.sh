#!/bin/sh
# Prints a note for the session only when the person chose automatic start
# at install. Typed, the default, prints nothing and costs no context.
[ "$CLAUDE_PLUGIN_OPTION_START_MODE" = "automatic" ] || exit 0
echo "Agent Kit preference: the person set /engineer and /database to start automatically. They want engineering problems described in their own words (a symptom, a worry, a plan) handled as if they had typed /engineer, and PostgreSQL problems as if they had typed /database."
