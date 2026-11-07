# Comparison harness

Runs the same prompt against the same app in three setups and keeps every transcript:

- `baseline`: Claude with no plugin and no skill;
- `skill`: the standalone experience-architecture skill, copied into the run's `.claude/skills/`;
- `plugin`: this plugin, loaded with `--plugin-dir`.

Every run gets a fresh copy of the app (git-initialised so source edits show up as a diff), a copy of Playwright, `--setting-sources project` and `--strict-mcp-config` so the user's own instructions and connectors do not leak in, and a settings file that denies reads of personal folders (`isolate.example.json`; adjust the paths). Runs use Sonnet.

```bash
export EA_COMPARE_DIR=/path/to/scratch          # holds runs/, plugin/, pwrt/node_modules, isolate.json
export EA_STANDALONE_SKILL=/path/to/standalone/experience-architecture
# one line per run: scenario arm rep port app_dir prompt_file
xargs -P 6 -L 1 tests/compare/run_one.sh < jobs.txt
```

Before a batch: copy the plugin without `evals/` into `$EA_COMPARE_DIR/plugin`, Playwright into `$EA_COMPARE_DIR/pwrt/node_modules`, and the isolation settings into `$EA_COMPARE_DIR/isolate.json`. Prompts may contain `{{PORT}}`.

Scoring is done by fresh agents that see the answer key and the reports with the setup names replaced by letters. Results from the v0.2 comparison are in `tests/results/v0.2-comparison/`.
