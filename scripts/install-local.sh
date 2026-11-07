#!/usr/bin/env bash
# Points Claude Code, Codex and Cursor at this clone, so edits show up in the next session
# without pushing first. Safe to rerun; rerun after adding or removing a skill. Mac and Linux.
#
#   Claude Code  links each plugin folder into ~/.claude/skills/<plugin>, which Claude Code loads
#                as <plugin>@skills-dir straight from this clone
#   Codex        registers this clone as a local plugin catalog and adds the four plugins
#   Cursor       links each skill folder into ~/.cursor/skills (experience-architecture uses its
#                own installer, because its skills call scripts elsewhere in the plugin)
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
plugins=(design-kit engineering-kit experience-architecture working-style)
claude_dir="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
cursor_dir="${CURSOR_SKILLS_DIR:-$HOME/.cursor/skills}"

link() { # link <source> <target>; replaces only an existing link, never a real folder
  local src="$1" dst="$2"
  if [ -L "$dst" ]; then rm "$dst"
  elif [ -e "$dst" ]; then echo "Skipping $dst: a real folder is there, not a link" >&2; return 0
  fi
  ln -s "$src" "$dst"
}

mkdir -p "$claude_dir"
for p in "${plugins[@]}"; do link "$root/kits/$p/plugins/$p" "$claude_dir/$p"; done
echo "Claude Code: ${plugins[*]} load from this clone as <plugin>@skills-dir"

if command -v codex >/dev/null 2>&1; then
  codex plugin marketplace add "$root" >/dev/null 2>&1 || true
  for p in "${plugins[@]}"; do codex plugin add "$p@agent-kit" >/dev/null 2>&1 || echo "Codex: could not add $p@agent-kit" >&2; done
  echo "Codex: agent-kit catalog points at this clone"
fi

if [ -d "$HOME/.cursor" ]; then
  mkdir -p "$cursor_dir"
  for p in design-kit engineering-kit working-style; do
    for s in "$root/kits/$p/plugins/$p/skills"/*/; do link "${s%/}" "$cursor_dir/$(basename "$s")"; done
  done
  node "$root/kits/experience-architecture/plugins/experience-architecture/scripts/install-skills.mjs" >/dev/null
  echo "Cursor: skills linked into $cursor_dir"
fi
