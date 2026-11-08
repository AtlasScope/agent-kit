import Link from "next/link";
import { InstallTabs } from "@/components/InstallTabs";
import { RunDemo } from "@/components/RunDemo";
import { HeroHeadline } from "@/components/HeroHeadline";
import { revealBootScript } from "@/lib/reveal";
import { JsonLd } from "@/components/Crumbs";
import { HERO, SITE } from "@/lib/site";
import { counts, fixes, kits, authors } from "@/lib/content";

export default function Home() {
  const a = authors();
  return (
    <main>
      <script dangerouslySetInnerHTML={{ __html: revealBootScript }} />
      <section className="hero">
        <Link className="badge rise" href={HERO.badge.href}>{HERO.badge.text}&nbsp;<code>{HERO.badge.code}</code>&nbsp;{HERO.badge.rest}</Link>
        <HeroHeadline text={HERO.headline} drafts={HERO.drafts} />
        <p className="lead rise">{HERO.subhead}</p>
        <InstallTabs className="rise" note={HERO.license}><a className="btn btn--lg" href={SITE.repo}>View on GitHub</a></InstallTabs>
        <div className="run-wrap rise"><RunDemo /></div>
      </section>

      <section className="page" aria-label="Browse the library">
        <div className="section">
          <h2>Who wrote the skills</h2>
          <p className="credits-row">
            <span>{counts.borrowed} of the {counts.skills} skills come from other authors:</span>
            {a.map((x) => <a key={x.author} href={x.url}>{x.author} ({x.skills.length})</a>)}
            <a href={`${SITE.repo}/blob/main/CREDITS.md`}>Full credits</a>
          </p>
        </div>
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
