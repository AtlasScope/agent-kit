# Agent Kit site

The public library at [www.atlasscope.dev](https://www.atlasscope.dev): one page per prompt, skill, kit, and problem, a markdown twin for the library index and item pages, search files for crawlers, an eight-step beginner guide, optional accounts, Vercel Web Analytics, and a read-only MCP server. Next.js App Router on Vercel.

## Run and test

```sh
cd site
npm ci
npm run dev        # builds content/generated.json from the repo, then starts Next.js
npm run typecheck  # TypeScript check (requires content/generated.json)
npm test           # unit tests for copy, hero, install, search, starting points, and the orbit scene's arithmetic
npm run build      # builds content/generated.json and runs next build
npx playwright install chromium && npm run smoke   # shared public server + isolated account fixture server
npm run lab        # local graphics lab (development only)
```

For a targeted smoke suite, run `node --test tests/smoke/install.smoke.mjs` against a built app. `SMOKE_URL` and `SMOKE_ACCOUNT_URL` can point to existing servers; the latter must be a long-lived sample-data server, not production or a serverless preview.

Everything is read from the repo at build time by `scripts/build-content.mjs`: `library/library.json`, every `kits/*/plugins/*/skills/*/SKILL.md`, each kit's `THIRD_PARTY.md`, and the root `CREDITS.md`. Edit those, not `site/content/generated.json`, to change what a page says. The build stops if two pages would get the same URL.

The homepage headline and install payloads live in `lib/site.ts`; preserve the shared Home/Install handoff in `components/install-choice.ts`. See the root [site contract](../DESIGN-CONTRACT.md).

Home and Install share the Horizon stage (`app/(stage)/`, `components/stage/`, `components/horizon/`). See the Horizon README, PRODUCTION.md and SOURCES.md for the live renderer, historical imagery provenance, map generation and static fallbacks. The earlier procedural orbit and its lab remain available for graphics development.

## Pages

| URL | What it is |
|---|---|
| `/` | Shared cinematic stage with the Install handoff. |
| `/install` | Agent-specific install commands, test status, and next steps. |
| `/start`, `/start/<step>` | Eight-step guide from no coding agent to a deployed reading-list app (untested with first-time users). |
| `/learn`, `/learn/<lesson>` | Five short lessons on working with a coding agent. |
| `/prompts`, `/prompts/<slug>` | Hub, area pages, and one page per library entry. Old IDs (`/prompts/A01`) redirect. |
| `/skills`, `/skills/<name>` | Every skill with its full `SKILL.md`, install commands, credit, and license. |
| `/kits`, `/kits/<kit>` | The five plugins. |
| `/fix`, `/fix/<problem>` | Symptom pages that list the prompts to try first. |
| `/index.md`, `/prompts.md`, `/skills.md`, `/kits.md`, `/fix.md`, and `/<section>/<slug>.md` | Markdown twins of the library index and item pages, for agents. |
| `/llms.txt`, `/llms-full.txt`, `/sitemap.xml`, `/robots.txt` | Search and AI crawler files. Every crawler is allowed. |
| `/mcp`, `/mcp-setup` | Public read-only MCP server and its setup page. |
| `/about`, `/privacy`, `/terms` | About AtlasScope, plus draft Privacy and Terms pages (`Draft, 10 Nov 2026`). |
| `/account`, `/collections/<id>` | Starred items and collections (needs Clerk and Neon). |

Library pages are static. Clerk's middleware (`proxy.ts`) runs only on `/account`, `/collections`, `/sign-in`, and `/api`.

## Accounts

Without Clerk keys, the site builds and runs with accounts hidden. To turn them on, install Clerk and Neon from the Vercel Marketplace on this project; they set:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `DATABASE_URL`

Then create the tables once: `vercel env pull .env.local && npm run db:migrate`. The schema is `db/schema.sql`, and rerunning it is safe.

Sign-in methods (GitHub, Google, email code) are switched on in the Clerk dashboard, not in code.

## MCP server limits

The server at `/mcp` is public and read-only. Four limits keep a runaway client from costing money:

1. **Per-visitor rate limit:** a Vercel Firewall rule on `/mcp` (rate limit, 60 requests per minute per IP, then 429). The server also keeps a rough per-instance limit (`MCP_PER_MINUTE`, default 60) as a backstop.
2. **Daily cap:** `MCP_DAILY_CAP` calls per UTC day across everyone (default 20000), counted in Neon `mcp_usage`. Past it, calls get an error until midnight UTC.
3. **Off switch:** set the Edge Config item `mcp_enabled` to `false` and the server stops within about 10 seconds, with no redeploy. Needs an Edge Config store connected to the project (`EDGE_CONFIG`). `MCP_ENABLED=false` does the same with a redeploy.
4. **Alerts:** at 50%, 80%, and 100% of the daily cap, the server logs a warning and posts to `MCP_ALERT_WEBHOOK` (a Slack or Discord incoming webhook URL) if set. Vercel spend alerts run at 50%, 75%, and 100% of the team budget with auto-pause off, because auto-pause would stop every project on the team.

## Vercel project settings

- Root directory: `site`. Framework: Next.js. Keep "Include files outside the root directory" on, since the content build reads `library/` and `kits/`.
- Domain: `atlasscope.dev` redirects to `www.atlasscope.dev`, so pages use `https://www.atlasscope.dev` as their canonical URL. If the redirect is flipped to the bare domain, set `NEXT_PUBLIC_SITE_URL=https://atlasscope.dev`.
