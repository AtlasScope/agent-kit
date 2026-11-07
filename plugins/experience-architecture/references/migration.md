# Playbook: migration and regression engineering

Loaded by Rethink once the owner has chosen an option, or whenever URLs are about to move.

Read `${CLAUDE_PLUGIN_ROOT}/references/evidence.md`, `${CLAUDE_PLUGIN_ROOT}/references/formats.md` (mapping format) and `${CLAUDE_PLUGIN_ROOT}/references/frameworks.md`.

## Procedure

1. **Mapping.** From the chosen proposal (or the owner's described change), write `<out>/migration/mapping.json`. Give every current page an explicit decision (`keepRest: false`). Run `ea migrate <model.json> <mapping.json> --out <out>/migration` and resolve every reported problem: unmapped pages, dropped params, chains, missing targets, existing redirects that will point at moved URLs, unknown sources.

2. **Blast radius.** From `migration.md` and the code:
   - in-code links to update (listed with file:line), including URL helpers and nav config arrays, which are the cheapest place to fix many links;
   - shared layouts and providers that move, split or merge, and what state they own;
   - route guards and permission checks attached to old paths (middleware matchers, loaders, layout checks). Every new path must be protected at least as strongly;
   - analytics events and dashboards keyed by path;
   - external contracts: emails, docs, partner links, SEO-indexed public pages (canonical tags, sitemap.xml), mobile app deep links.

3. **Sequence.** Prefer steps that ship independently and keep the app working:
   1. Introduce shared primitives first (a URL-state hook, a route builder, an overlay pattern) with no URL changes.
   2. Add new routes beside old ones; redirect old to new with temporary redirects (307) and `replace` semantics for client redirects.
   3. Update in-code links so the app never redirects itself.
   4. Move chrome to the new model.
   5. Remove old routes and switch redirects to permanent (308) once metrics show no traffic surprises. Browsers cache 308s.

   Favour simplifying shared architecture over adding compatibility layers. Each permanent special case needs a reason and an owner.

4. **Regression tests.** Combine:
   - `regression-journeys.json` from `ea migrate` (every old URL lands correctly; Back does not bounce through the redirect);
   - the journeys that exposed the original problems, now with expectations that encode the fix (`sameAs`, `activeNav`, `historyDelta`, `field`);
   - core loops at desktop and mobile.

   These run as `ea journey <spec> --base <url> --ci` in CI against a preview deployment. If the project already uses Playwright Test, also translate the specs into its style.

5. **Verification criteria.** Per step: what must be true before shipping it (journeys green, zero in-app links to old paths per `ea map`, guards covering new paths, redirects returning the right status), and what to watch after (404 rate, redirect hits, support tickets about "can't find").

## Output

`<out>/migration/` holds `mapping.json`, `migration.md` (coverage, problems, code updates, redirect config), `plan.md` (sequence, blast radius, verification criteria) and `regression-journeys.json`.

## Implementation only on request

If the user explicitly asks you to implement, confirm the scope and the first step, work on a new branch, and make one step per commit, running the regression journeys after each. Never delete old routes and add redirects in the same step without the journeys passing in between.
