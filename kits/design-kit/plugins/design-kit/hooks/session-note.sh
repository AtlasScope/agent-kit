#!/bin/sh
# Prints fixed notes for the session, and only for the exact values offered at
# install. Any other value, including none, prints nothing, so /design keeps its
# defaults and a saved setting never reaches the session as text.
if [ "$CLAUDE_PLUGIN_OPTION_START_MODE" = "automatic" ]; then
  echo "Agent Kit preference: the person set /design to start automatically. This applies to this session; a change in /config takes effect in the next one. They want design requests made in their own words (a new page, a change to one, a review, copy, color, type, motion) handled as if they had typed /design."
fi
if [ "$CLAUDE_PLUGIN_OPTION_ASK_BEFORE_EDITS" = "true" ]; then
  echo "Agent Kit preference: the person turned on ask before edits for /design. They want /design to name its pick and wait for their yes before running any skill that changes files."
fi
exit 0
