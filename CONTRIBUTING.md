# Contributing

Agent Kit is a curated library, so a new entry has to earn its place. Before adding anything, check whether an existing prompt or skill already does the job. A clearer version of an existing entry is more useful than a near-duplicate.

## Add or change a prompt

1. Edit [`library/library.json`](library/library.json). Each entry needs a stable `id`, a title (`t`), the text people copy (`p` or `cmd`), and a `why` line that says what it finds. Database prompts also need `ev` (evidence to ask for), `skip`, `avoid`, `tools` and `mode`.
2. Run the checks and rebuild the generated files:

   ```sh
   node library/check.mjs
   node library/build.mjs
   ```

3. Keep an entry's `id` when you rewrite it. Pages, stars and links depend on it.

## Add a skill

- **Written by you:** put it in the kit it belongs to under `kits/<kit>/plugins/<kit>/skills/<name>/SKILL.md`, list it in that kit's README, and say what it does that no existing skill does.
- **Written by someone else:** copy it at a pinned commit, keep its LICENSE file in the skill folder, and add a row to the kit's `THIRD_PARTY.md` (source, commit, license) and to [CREDITS.md](CREDITS.md). Read the whole skill, including any scripts, before adding it, and note every change you make under "Changes from upstream". Don't reword someone else's skill to make it look original.
- Address the person running the agent as "the user". Public skills must not assume one person's name, machine, accounts or projects.

## Run the checks

```sh
node scripts/check-public.mjs   # no personal names, paths or machine notes in shipped files
node library/check.mjs          # prompt library IDs, links and required fields
node scripts/check-catalog.mjs  # both plugin catalogs, kit manifests and skill folders agree
cd site && npm ci && npm run typecheck && npm test
npx playwright install chromium && npx next build && npm run smoke   # browser journeys
```

CI runs the same checks on every pull request.

## What reviewers look for

- A distinct job: someone can tell in one line when to use this instead of what's already here.
- Usable text: it names the evidence it wants and when to stop, instead of "be thorough" or "act as an expert".
- Honest scope: read-only versus changes code is stated, and optional tools it calls are named as optional.
- Clear source and license for anything not written here.

Keep pull requests small and about one outcome. Say what problem it fixes, what changed, how you checked it, and what is still unverified.
