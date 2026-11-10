#!/bin/sh
# Prints a fixed note only when the person chose automatic start at install.
# Any other value, including none, prints nothing, so the routers keep their
# typed default and a saved setting never reaches the session as text.
[ "$CLAUDE_PLUGIN_OPTION_START_MODE" = "automatic" ] || exit 0
echo "Agent Kit preference: the person set /engineer and /database to start automatically. This applies to this session; a change in /config takes effect in the next one. They want engineering problems described in their own words (a symptom, a worry, a plan) handled as if they had typed /engineer, and PostgreSQL problems as if they had typed /database."
