import Link from "next/link";
import { InstallRail } from "@/components/InstallRail";
import { RunDemo } from "@/components/RunDemo";
import { HERO_BLUR } from "@/lib/hero-blur";
import { JsonLd } from "@/components/Crumbs";
import { CopyButton } from "@/components/CopyButton";
import { SearchDoor, YourCollections } from "@/components/HomeDoors";
import { HERO, SITE, authEnabled } from "@/lib/site";
import { STEPS } from "@/lib/start";
import { counts, fixes, kits, authors } from "@/lib/content";

const WIDE = [960, 1440, 1920, 2560, 3840];
const TALL = [780, 1170];
const set = (name: string, widths: number[], ext: string) => widths.map((w) => `/hero/${name}-${w}.${ext} ${w}w`).join(", ");

const ARROW = <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

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

      <div className="home-body">
        <section className="home-sec" aria-labelledby="h-start">
          <div className="home-sec__row">
            <h2 id="h-start">Where to start</h2>
            {authEnabled() && <YourCollections />}
          </div>
          <div className="doors">
            <Link className="door" href="/fix">
              <h3 className="door__t">I have a problem in my code</h3>
              <span className="door__d">Pick what you see from {fixes.length} common problems and get the prompts that look into it, best first.</span>
              <span className="door__go"><span>Fix a problem{ARROW}</span></span>
            </Link>
            <div className="door">
              <h3 className="door__t">I know what I want</h3>
              <span className="door__d">Search every prompt and skill by its name or by the job you have.</span>
              <span className="door__go">
                <SearchDoor>Search the library{ARROW}</SearchDoor>
                <span className="door__alt"><Link href="/prompts">Prompts</Link><Link href="/skills">Skills</Link></span>
              </span>
            </div>
            <Link className="door" href="/start">
              <h3 className="door__t">I&apos;ve never used a coding agent</h3>
              <span className="door__d">{STEPS.length} steps from nothing installed to a small app you can open on your phone. About an hour.</span>
              <span className="door__go"><span>Start the guide{ARROW}</span></span>
            </Link>
          </div>
        </section>

        <section className="home-sec split" aria-labelledby="h-in">
          <div className="split__head">
            <h2 id="h-in">What is in the library</h2>
            <p className="home-sec__lede">Every prompt and skill can be read and copied without an account.</p>
          </div>
          <ul className="ledger">
            <li>
              <h3>Prompts</h3>
              <p>A piece of text you paste into your agent, with notes on why it exists, what it returns and when to skip it.</p>
              <Link href="/prompts">Browse {counts.prompts} prompts{ARROW}</Link>
            </li>
            <li>
              <h3>Skills</h3>
              <p>A folder with a SKILL.md that your agent loads to do one kind of job.</p>
              <Link href="/skills">Browse {counts.skills} skills{ARROW}</Link>
            </li>
            <li>
              <h3>Kits</h3>
              <p>One installable plugin that groups related skills, such as {kits[0].name} or {kits[1].name}.</p>
              <Link href="/kits">See the {kits.length} kits{ARROW}</Link>
            </li>
          </ul>
        </section>

        <section className="home-sec split" aria-labelledby="h-run">
          <div className="split__head">
            <h2 id="h-run">What using it looks like</h2>
            <p className="home-sec__lede">Type one command and say what you want in plain words. It picks the method that fits and tells you which one it picked.</p>
          </div>
          <RunDemo />
        </section>

        <section className="home-sec split" aria-labelledby="h-who">
          <div className="split__head">
            <h2 id="h-who">Who wrote the skills</h2>
            <p className="home-sec__lede">{counts.borrowed} of the {counts.skills} skills come from other authors. Each one keeps its author&apos;s license.</p>
          </div>
          <div className="home-sec__stack">
            <ul className="authors">
              {a.map((x) => <li key={x.author}><a href={x.url}>{x.author}</a><span>{x.skills.length} {x.skills.length === 1 ? "skill" : "skills"}</span></li>)}
            </ul>
            <p className="note"><a className="lic" href={`${SITE.repo}/blob/main/CREDITS.md`}>Full credits and licenses</a></p>
          </div>
        </section>

        <section className="home-sec split" aria-labelledby="h-mcp">
          <div className="split__head">
            <h2 id="h-mcp">Use it from your agent</h2>
            <p className="home-sec__lede">Add this address as a remote MCP server and your agent can search the library and fetch any prompt or skill. It is read-only.</p>
          </div>
          <div className="home-sec__stack">
            <div className="rail__cmd rail__cmd--url">
              <div className="rail__steps"><code>{SITE.url}/mcp</code></div>
              <CopyButton className="rail__copy" text={`${SITE.url}/mcp`} label="Copy" />
            </div>
            <p className="note"><Link className="lic" href="/mcp-setup">Setup for each agent</Link></p>
          </div>
        </section>
      </div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "AtlasScope", url: SITE.url, sameAs: [SITE.repo] }} />
    </main>
  );
}
