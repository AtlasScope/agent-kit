#!/bin/sh
# Prints a note for the session only when the person chose automatic start
# at install. Typed, the default, prints nothing and costs no context.
[ "$CLAUDE_PLUGIN_OPTION_START_MODE" = "automatic" ] || exit 0
echo "Agent Kit preference: the person set /design to start automatically. They want design requests made in their own words (a new page, a change to one, a review, copy, color, type, motion) handled as if they had typed /design."
