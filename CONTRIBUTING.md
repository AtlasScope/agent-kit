# Contributing

Agent Kit is a curated library, so a new entry has to earn its place. Before adding anything, check whether an existing prompt or skill already does the job. A clearer version of an existing entry is more useful than a near-duplicate.

## Add or change a prompt

1. Edit [`library/library.json`](library/library.json) (and [`library/audit.json`](library/audit.json) for new entries). Each entry needs a stable `id`, a title (`t`), the text people copy (`p` or `cmd`), a `dmode` or `mode`, and a `why` line that says what it finds. Database prompts also need `ev` (evidence to ask for), `skip`, `avoid`, `tools`, `plat`, and `tags`.
2. Run the checks and rebuild the generated files (including router references if you touched `/design`, `/engineer`, or `/database` entries):

```sh
node library/build.mjs
node kits/design-kit/scripts/build_references.mjs
node kits/engineering-kit/scripts/build_references.mjs
node kits/engineering-kit/scripts/build_database_references.mjs
node library/check.mjs
```

3. Keep an entry's `id` when you rewrite it. Pages, stars, and links depend on it.

## Add a skill

- **Written by you:** put it in the kit it belongs to under `kits/<kit>/plugins/<kit>/skills/<name>/SKILL.md` (with `name` matching `<name>`), add `agents/openai.yaml` for Codex, list it in `kits/<kit>/plugins/<kit>/README.md` (keeping 40+ words outside code blocks), and say what it does that no existing skill does. If it's a command in `design-kit`, add its job entry in `site/scripts/design-jobs.mjs` and its `library/library.json` entry.
- **Borrowed from someone else:** copy it at a pinned commit, keep its `LICENSE` file in the skill folder, and add a row to the kit's `THIRD_PARTY.md` (source, commit, license) and to [CREDITS.md](CREDITS.md). Read the whole skill, including any scripts, before adding it, and note every change you make under "Changes from upstream". Don't reword someone else's skill to make it look original.
- Address the person running the agent as "the user". Public skills must not assume one person's name, machine, accounts, or projects.

## Run the checks

```sh
node scripts/check-public.mjs   # no personal names, paths, or machine notes in shipped files
node scripts/check-catalog.mjs  # both plugin catalogs, kit manifests, and skill folders agree
node library/check.mjs          # prompt library IDs, links, audit rows, and generated refs
node tests/routing/check.mjs    # routing test cases resolve to real entries and skills
node --test "kits/motion-kit/plugins/motion-kit/skills/motion/tests/*.test.mjs"
cd kits/experience-architecture && npm test
cd site && npm ci && npm run content && npm run typecheck && npm test
cd site && npx playwright install chromium && npx next build && npm run smoke
```

CI runs the checks that cover the files your pull request touches.

## What reviewers look for

- A distinct job: someone can tell in one line when to use this instead of what's already here.
- Usable text: it names the evidence it wants and when to stop, instead of "be thorough" or "act as an expert".
- Honest scope: read-only versus changes code is stated, and optional tools it calls are named as optional.
- Clear source and license for anything not written here.

Keep pull requests small and about one outcome (and keep kit or library changes separate from `site/` changes). Say what problem it fixes, what changed, how you checked it, and what is still unverified.
