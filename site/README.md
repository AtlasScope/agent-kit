# Agent Kit site

The public library at www.atlasscope.dev: one page per prompt, skill, kit and problem, a markdown twin of each, search files for crawlers, optional accounts, and a read-only MCP server. Next.js on Vercel.

## Run it

```sh
cd site
npm install
npm run dev        # builds content/generated.json from the repo, then starts Next.js
npm run build      # the same build Vercel runs
```

Everything is read from the repo at build time by `scripts/build-content.mjs`: `library/library.json`, every `kits/*/plugins/*/skills/*/SKILL.md`, each kit's `THIRD_PARTY.md` and the root `CREDITS.md`. Edit those, not the site, to change what a page says. The build stops if two pages would get the same URL.

The headline and badge live in `lib/site.ts` (`HERO`). The headline is still being decided; change it there only.

## Pages

| URL | What it is |
|---|---|
| `/prompts`, `/prompts/<slug>` | Hub, area pages and one page per library entry. Old ids (`/prompts/A01`) redirect. |
| `/skills`, `/skills/<name>` | Every skill with its full SKILL.md, install commands, credit and license. |
| `/kits`, `/kits/<kit>` | The five plugins. |
| `/fix`, `/fix/<problem>` | Symptom pages that list the prompts to try first. |
| any of the above + `.md` | Markdown twin, for agents. |
| `/llms.txt`, `/llms-full.txt`, `/sitemap.xml`, `/robots.txt` | Search and AI crawler files. Every crawler is allowed. |
| `/mcp`, `/mcp-setup` | Public read-only MCP server and its setup page. |
| `/account`, `/collections/<id>` | Starred and collections (needs Clerk and Neon). |

Library pages are static. Clerk's middleware runs only on `/account`, `/collections`, `/sign-in` and `/api`.

## Accounts

Without Clerk keys the site builds and runs with accounts hidden. To turn them on, install Clerk and Neon from the Vercel Marketplace on this project; they set these variables:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `DATABASE_URL`

Then create the tables once: `vercel env pull .env.local && npm run db:migrate`. The schema is `db/schema.sql`, and rerunning it is safe.

Sign-in methods (GitHub, Google, email code) are switched on in the Clerk dashboard, not in code.

## MCP server limits

The server at `/mcp` is public and read-only. Four limits keep a runaway client from costing money (ADR 0003):

1. **Per-visitor rate limit**: a Vercel Firewall rule on `/mcp` (rate limit, 60 requests per minute per IP, then 429). The server also keeps a rough per-instance limit (`MCP_PER_MINUTE`, default 60) as a backstop.
2. **Daily cap**: `MCP_DAILY_CAP` calls per UTC day across everyone (default 20000), counted in Neon `mcp_usage`. Past it, calls get an error until midnight UTC.
3. **Off switch**: set the Edge Config item `mcp_enabled` to `false` and the server stops within about 10 seconds, with no redeploy. Needs an Edge Config store connected to the project (`EDGE_CONFIG`). `MCP_ENABLED=false` does the same with a redeploy.
4. **Alerts**: at 50%, 80% and 100% of the daily cap the server logs a warning and posts to `MCP_ALERT_WEBHOOK` (a Slack or Discord incoming webhook URL) if set. Vercel spend alerts run at 50, 75 and 100% of the team budget with auto-pause off, because auto-pause would stop every project on the team.

## Vercel project settings

- Root directory: `site`. Framework: Next.js. Keep "Include files outside the root directory" on, since the content build reads `library/` and `kits/`.
- Domain: `atlasscope.dev` redirects to `www.atlasscope.dev`, so pages use `https://www.atlasscope.dev` as their canonical URL. If the redirect is flipped to the bare domain, set `NEXT_PUBLIC_SITE_URL=https://atlasscope.dev`.
