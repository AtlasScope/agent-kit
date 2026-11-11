import Link from "next/link";
import { InstallRail } from "@/components/InstallRail";
import { HERO_BLUR } from "@/lib/hero-blur";
import { JsonLd } from "@/components/Crumbs";
import { HERO, KITS, SITE } from "@/lib/site";
import { counts, fixes, authors } from "@/lib/content";
import { KitRows } from "@/components/KitRows";
import { LaunchHero } from "@/components/LaunchHero";
import "./launch.css";

const ARROW = <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

export default function Home() {
  const a = authors();
  return (
    <main className="home">
      <LaunchHero headline={HERO.headline} blur={HERO_BLUR} />
      <div className="orbit__rail" id="install">
        <InstallRail />
      </div>

      <div className="home-close">
        <section className="adds" aria-labelledby="adds-h">
          <div className="adds__head">
            <h2 id="adds-h">What the install adds</h2>
            <p>{KITS.length} kits and {counts.skills} skills. Type a command, then say what you want in plain words. Commands are shown as you type them in Claude Code.</p>
          </div>
          <KitRows />
        </section>

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
            <h2>Fix a problem</h2>
            <p>Start from what you see going wrong in your code. Each problem lists the prompts to try first, in order.</p>
            <Link href="/fix">See {fixes.length} problems{ARROW}</Link>
          </li>
        </ul>
        <p className="authors">
          {counts.borrowed} of the {counts.skills} skills come from other authors:{" "}
          {a.map((x, n) => <span key={x.author}><a href={x.url}>{x.author}</a>{n < a.length - 1 ? ", " : ". "}</span>)}
          <a href={`${SITE.repo}/blob/main/CREDITS.md`}>Credits and licenses</a>
        </p>
      </div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "AtlasScope", url: SITE.url, sameAs: [SITE.repo] }} />
    </main>
  );
}
