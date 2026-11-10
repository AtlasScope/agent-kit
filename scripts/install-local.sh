#!/usr/bin/env bash
# Points Claude Code, Codex and Cursor at this clone, so edits show up in the next session
# without pushing first. Safe to rerun; rerun after adding or removing a skill. Mac and Linux.
#
#   Claude Code  registers this clone as the agent-kit catalog and installs the five plugins as
#                <plugin>@agent-kit, the same IDs repos enable for cloud sessions, so a session
#                never loads a kit twice. Claude Code keeps its own copy of each plugin, so the
#                script reinstalls them whenever the clone changes (commits or uncommitted edits)
#   Codex        registers this clone as a local plugin catalog and adds the five plugins
#   Cursor       links each skill folder into ~/.cursor/skills (experience-architecture uses its
#                own installer, because its skills call scripts elsewhere in the plugin)
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
plugins=(design-kit motion-kit engineering-kit experience-architecture working-style)
claude_dir="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
cursor_dir="${CURSOR_SKILLS_DIR:-$HOME/.cursor/skills}"

link() { # link <source> <target>; replaces only an existing link, never a real folder
  local src="$1" dst="$2"
  if [ -L "$dst" ]; then rm "$dst"
  elif [ -e "$dst" ]; then echo "Skipping $dst: a real folder is there, not a link" >&2; return 0
  fi
  ln -s "$src" "$dst"
}

if command -v claude >/dev/null 2>&1; then
  # Earlier versions linked the plugins into ~/.claude/skills, which loaded them a second time
  # under <plugin>@skills-dir. Remove those links.
  for p in "${plugins[@]}"; do
    if [ -L "$claude_dir/$p" ] && [ "$(readlink "$claude_dir/$p")" = "$root/kits/$p/plugins/$p" ]; then rm "$claude_dir/$p"; fi
  done
  claude plugin marketplace list 2>/dev/null | grep -q "Folder ($root)" || claude plugin marketplace add "$root" >/dev/null
  stamp="$HOME/.claude/plugins/data/agent-kit-local.stamp"
  now="$( { git -C "$root" rev-parse HEAD; git -C "$root" status --porcelain=v1 --untracked-files=all; git -C "$root" diff HEAD; } | shasum | cut -d' ' -f1)"
  if [ "$(cat "$stamp" 2>/dev/null)" != "$now" ]; then
    for p in "${plugins[@]}"; do
      claude plugin uninstall "$p@agent-kit" --scope user --keep-data >/dev/null 2>&1 || true
      claude plugin install "$p@agent-kit" --scope user >/dev/null || echo "Claude Code: could not install $p@agent-kit" >&2
    done
    mkdir -p "$(dirname "$stamp")" && echo "$now" > "$stamp"
    echo "Claude Code: reinstalled ${plugins[*]} from this clone as <plugin>@agent-kit"
  else
    echo "Claude Code: agent-kit plugins already match this clone"
  fi
fi

if command -v codex >/dev/null 2>&1; then
  codex plugin marketplace add "$root" >/dev/null 2>&1 || true
  for p in "${plugins[@]}"; do codex plugin add "$p@agent-kit" >/dev/null 2>&1 || echo "Codex: could not add $p@agent-kit" >&2; done
  echo "Codex: agent-kit catalog points at this clone"
fi

if [ -d "$HOME/.cursor" ]; then
  mkdir -p "$cursor_dir"
  for p in design-kit motion-kit engineering-kit working-style; do
    for s in "$root/kits/$p/plugins/$p/skills"/*/; do link "${s%/}" "$cursor_dir/$(basename "$s")"; done
  done
  node "$root/kits/experience-architecture/plugins/experience-architecture/scripts/install-skills.mjs" >/dev/null
  echo "Cursor: skills linked into $cursor_dir"
fi
