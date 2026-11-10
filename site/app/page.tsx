import Link from "next/link";
import { InstallRail } from "@/components/InstallRail";
import { HERO_BLUR } from "@/lib/hero-blur";
import { JsonLd } from "@/components/Crumbs";
import { HERO, SITE } from "@/lib/site";
import { counts, kits, authors } from "@/lib/content";

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
          <InstallRail />
        </div>
      </section>

      <div className="home-close">
        <ul className="ledger">
          <li>
            <h2>Prompts</h2>
            <p>A piece of text you paste into your agent, with notes on why it exists, what it returns and when to skip it.</p>
            <Link href="/prompts">Browse {counts.prompts} prompts{ARROW}</Link>
          </li>
          <li>
            <h2>Skills</h2>
            <p>A folder with a SKILL.md that your agent loads to do one kind of job.</p>
            <Link href="/skills">Browse {counts.skills} skills{ARROW}</Link>
          </li>
          <li>
            <h2>Kits</h2>
            <p>One installable plugin that groups related skills, such as {kits[0].name} or {kits[1].name}.</p>
            <Link href="/kits">See the {kits.length} kits{ARROW}</Link>
          </li>
        </ul>
        <p className="authors">
          {counts.borrowed} of the {counts.skills} skills come from other authors, and each one keeps its author&apos;s license:{" "}
          {a.map((x, n) => <span key={x.author}><a href={x.url}>{x.author}</a>{n < a.length - 1 ? ", " : ". "}</span>)}
          <a href={`${SITE.repo}/blob/main/CREDITS.md`}>Full credits and licenses</a>
        </p>
      </div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "AtlasScope", url: SITE.url, sameAs: [SITE.repo] }} />
    </main>
  );
}
