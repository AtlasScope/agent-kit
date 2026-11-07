#!/bin/bash
# run_one.sh <scenario> <arm> <rep> <port> <fixture_src_dir> <prompt_file>
set -u
SP=${EA_COMPARE_DIR:?set EA_COMPARE_DIR to a scratch folder outside your repos}
SC=$1; ARM=$2; REP=$3; PORT=$4; SRC=$5; PROMPT_FILE=$6
W=$SP/cmp/runs/$SC/$ARM-$REP
rm -rf "$W"; mkdir -p "$W"
rsync -a --exclude node_modules --exclude .next --exclude dist "$SRC/" "$W/"
cp -R $SP/pwrt/node_modules "$W/node_modules" 2>/dev/null || true
EXTRA=()
case $ARM in
  skill) mkdir -p "$W/.claude/skills" && rsync -a --exclude evals ${EA_STANDALONE_SKILL:-$SP/standalone/experience-architecture} "$W/.claude/skills/" ;;
  plugin) EXTRA=(--plugin-dir $SP/cmp/plugin) ;;
esac
(cd "$W" && git init -q && git add -A >/dev/null 2>&1 && git -c user.email=t@t -c user.name=t commit -qm base >/dev/null 2>&1)
PROMPT="$(sed "s/{{PORT}}/$PORT/g" "$PROMPT_FILE")"
START=$(date +%s)
cd "$W" && timeout 1800 claude -p "$PROMPT" --model sonnet --max-turns 80 --setting-sources project --strict-mcp-config \
  --settings $SP/isolate.json --output-format stream-json --verbose \
  --allowedTools "Read,Glob,Grep,Skill,Write,Edit,Bash" ${EXTRA[@]+"${EXTRA[@]}"} > "$SP/cmp/runs/$SC/$ARM-$REP.jsonl" 2>&1
echo "$SC $ARM $REP exit=$? secs=$(( $(date +%s) - START ))" >> $SP/cmp/done.log
# stop anything left listening on the port
lsof -ti tcp:$PORT | xargs kill 2>/dev/null || true
