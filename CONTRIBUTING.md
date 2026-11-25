# Contributing

Every addition must do a job better than what already exists. Improve or replace overlapping content before adding another entry. Read the relevant consumers; preserve compatibility and attribution.

## Prompts and recipes

Edit `library/library.json` (including its category and recipe references). Keep existing IDs stable: URLs, stars, recipes and router references depend on them. Supply the text people copy, why it exists, expected evidence or output, actual scope and stop conditions. Do not invent usage or testing history. Existing `library/audit.json` records editorial evidence and overlap; add a note there only if it helps a real decision, not a score for every entry.

Rebuild affected public exports and shipped references:

```sh
node library/build.mjs
node kits/design-kit/scripts/build_references.mjs
node kits/engineering-kit/scripts/build_references.mjs
node kits/engineering-kit/scripts/build_database_references.mjs
node library/check.mjs
```

The last command checks reproducibility without rewriting tracked files. Run only the generators that affect your change; Keen job/menu changes also feed the library.

## Skills and plugins

- Put a skill in `kits/<kit>/plugins/<kit>/skills/<name>/SKILL.md` with matching frontmatter name and `agents/openai.yaml`. For explicitly invoked commands, set `disable-model-invocation: true` and `allow_implicit_invocation: false`. Keep plugin README prose at 40+ words for the catalog validator.
- Design command jobs also use `site/scripts/design-jobs.mjs` and library entries as applicable. Preserve the command and install contracts.
- For borrowed skills, pin the upstream commit, retain its LICENSE, record the source, changes and license in the kit's THIRD_PARTY.md and CREDITS.md; their table formats are parsed by the site. Never disguise another author's work as original.
- Changing shipped kit files requires bumping the version in both plugin manifests, the Claude marketplace and library badges where applicable, then rebuilding library outputs. A removed public command is a breaking change.
- Address the person running the skill as "the user". Public content must be portable and free of personal setup or secret information.

## Verify the outcome

```sh
node scripts/check-public.mjs
node scripts/check-catalog.mjs
node library/check.mjs
node tests/routing/check.mjs
```

Run these only for relevant changes; [CI](.github/workflows/ci.yml) selects checks by path. For changed runnable skill code, run the affected kit's tests; browser-dependent tests require a browser as described in the workflow or kit README. For site work see [site/README.md](site/README.md).

Do not repeat a full production build or browser suite for a wording-only change when CI already covers the real risk. Reserve expensive comparison runs for decisions they can change. Submit one coherent pull request, explaining what changed, what was actually verified and what remains uncertain.
