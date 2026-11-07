#!/bin/sh
# Build an installable release: a self-contained marketplace folder with the plugin inside, as a .tgz.
# Usage: npm run package   →   dist/experience-architecture-<version>.tgz
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERSION="$(node -p "require('$ROOT/plugins/experience-architecture/.claude-plugin/plugin.json').version")"
STAGE="$(mktemp -d)/experience-architecture"
mkdir -p "$STAGE/plugins" "$ROOT/dist"
cp -R "$ROOT/.claude-plugin" "$STAGE/"
rsync -a --exclude 'evals/results' --exclude 'node_modules' --exclude '.DS_Store' --exclude '.next' \
  "$ROOT/plugins/experience-architecture" "$STAGE/plugins/"
cp "$ROOT/plugins/experience-architecture/README.md" "$STAGE/README.md"
# Nothing but the current plugin goes out: no nested archives, and every manifest names this version.
NESTED="$(find "$STAGE" -type f \( -name '*.zip' -o -name '*.tgz' -o -name '*.tar' -o -name '*.tar.gz' \) | sed "s|$STAGE/||")"
[ -z "$NESTED" ] || { echo "Refusing to package nested archives: $NESTED" >&2; exit 1; }
node -e "
  const m = require('$STAGE/.claude-plugin/marketplace.json');
  const bad = (m.plugins || []).filter((p) => p.version && p.version !== '$VERSION');
  if (bad.length) { console.error('marketplace.json lists version ' + bad[0].version + ', plugin.json is $VERSION'); process.exit(1); }
"
claude plugin validate "$STAGE" >/dev/null
claude plugin validate "$STAGE/plugins/experience-architecture" >/dev/null
OUT="$ROOT/dist/experience-architecture-$VERSION.tgz"
tar -czf "$OUT" -C "$(dirname "$STAGE")" experience-architecture
rm -rf "$(dirname "$STAGE")"
echo "$OUT ($(du -h "$OUT" | cut -f1))"
