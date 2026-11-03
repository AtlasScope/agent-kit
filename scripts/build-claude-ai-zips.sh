#!/bin/sh
# Builds one zip per skill for upload at claude.ai > Settings > Capabilities > Skills.
# Usage: scripts/build-claude-ai-zips.sh [skill ...]   (no names: the recommended core set)
set -e
cd "$(dirname "$0")/.."
out=dist/claude-ai
mkdir -p "$out"
set -- ${@:-design web-typography oklch-skill refactoring-ui ux-writing ux-heuristics microinteractions design-everyday-things copywriting emil-design-eng}
for s in "$@"; do
  [ -d "plugins/design-kit/skills/$s" ] || { echo "no skill named $s" >&2; exit 1; }
  rm -f "$out/$s.zip"
  (cd plugins/design-kit/skills && zip -qr "../../../$out/$s.zip" "$s" -x '*/.DS_Store')
  echo "$out/$s.zip"
done
