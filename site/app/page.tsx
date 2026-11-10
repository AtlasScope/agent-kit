import Link from "next/link";
import { InstallRail } from "@/components/InstallRail";
import { RunDemo } from "@/components/RunDemo";
import { HERO_BLUR } from "@/lib/hero-blur";
import { JsonLd } from "@/components/Crumbs";
import { HERO, SITE } from "@/lib/site";
import { counts, fixes, kits, authors, skills } from "@/lib/content";

const WIDE = [960, 1440, 1920, 2560, 3840];
const TALL = [780, 1170];
const set = (name: string, widths: number[], ext: string) => widths.map((w) => `/hero/${name}-${w}.${ext} ${w}w`).join(", ");

export default function Home() {
  const a = authors();
  return (
    <main className="home">
      <section className="orbit" aria-labelledby="hero-h">
        <div className="orbit__stage">
          {/* Decorative: the horizon carries no information, so it has no text alternative. */}
          <picture className="orbit__photo" style={{ backgroundImage: `url(${HERO_BLUR})` }}>
            <source media="(max-width: 720px)" type="image/avif" srcSet={set("orbit-tall", TALL, "avif")} sizes="100vw" />
            <source media="(max-width: 720px)" type="image/webp" srcSet={set("orbit-tall", TALL, "webp")} sizes="100vw" />
            <source type="image/avif" srcSet={set("orbit", WIDE, "avif")} sizes="100vw" />
            <source type="image/webp" srcSet={set("orbit", WIDE, "webp")} sizes="100vw" />
            <img src="/hero/orbit-1920.webp" alt="" width={3840} height={2160} fetchPriority="high" decoding="async" />
          </picture>
          <div className="container orbit__body">
            <h1 id="hero-h">{HERO.headline}</h1>
            <p className="orbit__lede">Agent Kit is a library of {counts.skills} skills and {counts.prompts} prompts for Claude Code, Codex and Cursor. Install it once, describe the job in plain words, and your agent follows a written method for it.</p>
            <div className="orbit__cta">
              <a className="btn btn--lg btn--solid" href="#install">Install Agent Kit<svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></a>
              <Link className="btn btn--lg" href="/start">New to coding agents? Start here</Link>
            </div>
            <p className="orbit__by">{HERO.by}</p>
          </div>
        </div>
        <div className="orbit__rail" id="install">
          <InstallRail stats={[{ label: "Skills", value: counts.skills }, { label: "Prompts", value: counts.prompts }, { label: "Kits", value: kits.length }]} />
        </div>
      </section>

      <section className="page run-wrap" aria-label="See it pick a skill"><RunDemo /></section>

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
