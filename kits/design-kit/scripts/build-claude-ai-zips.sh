#!/bin/sh
# Builds one zip per skill for upload at claude.ai > Settings > Capabilities > Skills.
# Usage: scripts/build-claude-ai-zips.sh             one zip, design-kit.zip, with the whole library (recommended)
#        scripts/build-claude-ai-zips.sh <skill ...>  one zip per named skill
set -e
cd "$(dirname "$0")/.."
out=dist/claude-ai
mkdir -p "$out"
if [ $# -eq 0 ]; then
  b=$(mktemp -d)/design-kit
  mkdir -p "$b/skills"
  cp claude-ai/SKILL.md "$b/SKILL.md"
  cp -R plugins/design-kit/skills/design/references "$b/references"
  # claude.ai allows at most 200 files per skill, so each specialist becomes one Markdown file:
  # its SKILL.md first, then every other text file under a "## File: <path>" heading.
  for d in plugins/design-kit/skills/*/; do
    n=$(basename "$d")
    [ "$n" = design ] && continue
    [ "$n" = design-setup ] && continue  # Claude Code settings; nothing to set on claude.ai
    f="$b/skills/$n.md"
    cat "$d/SKILL.md" > "$f"
    (cd "$d" && find . -type f ! -name SKILL.md ! -path './scripts/*' ! -path './agents/*' \( -name '*.md' -o -name '*.json' -o -name '*.txt' -o -name 'LICENSE' \) | sort) | while read -r x; do
      printf '\n\n---\n\n## File: %s\n\n' "${x#./}" >> "$f"
      cat "$d/$x" >> "$f"
    done
  done
  cp THIRD_PARTY.md "$b/THIRD_PARTY.md"
  rm -f "$out/design-kit.zip"
  (cd "$(dirname "$b")" && zip -qr "$OLDPWD/$out/design-kit.zip" design-kit -x '*/.DS_Store')
  echo "$out/design-kit.zip"
  exit 0
fi
for s in "$@"; do
  [ -d "plugins/design-kit/skills/$s" ] || { echo "no skill named $s" >&2; exit 1; }
  rm -f "$out/$s.zip"
  (cd plugins/design-kit/skills && zip -qr "../../../$out/$s.zip" "$s" -x '*/.DS_Store')
  echo "$out/$s.zip"
done
