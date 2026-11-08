import Link from "next/link";
import { InstallTabs } from "@/components/InstallTabs";
import { RunDemo } from "@/components/RunDemo";
import { JsonLd } from "@/components/Crumbs";
import { HERO, SITE } from "@/lib/site";
import { counts, fixes, kits, authors } from "@/lib/content";

export default function Home() {
  const a = authors();
  const named = a.slice(0, 3).map((x) => x.author);
  return (
    <main>
      <section className="hero">
        <Link className="badge" href={HERO.badge.href}>{HERO.badge.text}&nbsp;<code>{HERO.badge.code}</code>&nbsp;{HERO.badge.rest}</Link>
        <h1>{HERO.headline[0]} <span className="h1-2">{HERO.headline[1]}</span></h1>
        <p className="lead">
          {counts.skills} skills and {counts.prompts} prompts for design, engineering and code review. {named.join(", ")} and {a.length - named.length} other
          authors wrote {counts.borrowed} of the skills. Works in Claude Code, Codex, Cursor and any agent that supports Agent Skills.{" "}
          <a className="lic" href={`${SITE.repo}/blob/main/CREDITS.md`}>Free, and each skill keeps its author’s license.</a>
        </p>
        <InstallTabs><a className="btn btn--lg" href={SITE.repo}>View on GitHub</a></InstallTabs>
        <RunDemo />
      </section>

      <section className="page" aria-label="Browse the library">
        <div className="section">
          <h2>Fix a problem</h2>
          <p className="note">Start from what you see. Each page lists the prompts to try first.</p>
          <div className="chips">
            {fixes.map((f) => <Link key={f.slug} className="chip" href={`/fix/${f.slug}`}>{f.title}</Link>)}
          </div>
        </div>
        <div className="section">
          <h2>Kits</h2>
          <div className="grid">
            {kits.map((k) => (
              <Link key={k.name} className="card" href={`/kits/${k.name}`}>
                <span className="card__t">{k.title}</span>
                <span className="card__d">{k.description}</span>
                <span className="card__m">{k.skills.length} skills</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="section">
          <h2>Use it from your agent</h2>
          <p className="note">Add <code>{SITE.url}/mcp</code> as a remote MCP server and your agent can search and fetch any prompt or skill. <Link className="lic" href="/mcp-setup">Setup for each agent</Link>.</p>
        </div>
      </section>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "AtlasScope", url: SITE.url, sameAs: [SITE.repo] }} />
    </main>
  );
}
