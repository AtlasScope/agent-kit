import Link from "next/link";
import { InstallTabs } from "@/components/InstallTabs";
import { RunDemo } from "@/components/RunDemo";
import { HeroHeadline } from "@/components/HeroHeadline";
import { revealBootScript } from "@/lib/reveal";
import { JsonLd } from "@/components/Crumbs";
import { HERO, SITE } from "@/lib/site";
import { counts, fixes, kits, authors, skills } from "@/lib/content";

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
        <nav className="tiles tiles--start" aria-label="Start here">
          <Link className="tile tile--lead" data-sec="inv" href="/fix"><span className="tile__t"><i className="dot" />Fix a problem</span><span className="tile__d">Pick what you see and get the prompts that look into it, best first.</span></Link>
          <Link className="tile" data-sec="think" href="/prompts"><span className="tile__t"><i className="dot" />Browse prompts</span><span className="tile__d">{counts.prompts} prompts, commands and recipes, each with a Copy button.</span></Link>
          <Link className="tile" data-sec="dcmd" href="/skills"><span className="tile__t"><i className="dot" />Agent skills</span><span className="tile__d">{skills.length} skills with their full instructions and one-line installs.</span></Link>
          <Link className="tile" data-sec="db" href="/kits"><span className="tile__t"><i className="dot" />Kits</span><span className="tile__d">{kits.length} plugins that install a set of skills together.</span></Link>
        </nav>
        <div className="section">
          <h2>Something is wrong in the code</h2>
          <p className="note">Pick what you see. Each opens the prompts to try, best first.</p>
          <div className="rows">
            {fixes.filter((f) => f.scope === "code").map((f) => (
              <Link key={f.slug} className="row" href={`/fix/${f.slug}`}><span>{f.title}</span><svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg></Link>
            ))}
          </div>
        </div>
        <div className="section">
          <h2>Who wrote the skills</h2>
          <p className="credits-row">
            <span>{counts.borrowed} of the {counts.skills} skills come from other authors:</span>
            {a.map((x) => <a key={x.author} href={x.url}>{x.author} ({x.skills.length})</a>)}
            <a href={`${SITE.repo}/blob/main/CREDITS.md`}>Full credits</a>
          </p>
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
