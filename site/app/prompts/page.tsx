import Link from "next/link";
import type { Metadata } from "next";
import { Crumbs } from "@/components/Crumbs";
import { StartCard } from "@/components/Cards";
import { STARTS } from "@/lib/starts";
import { areas, sections, counts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Prompts for AI coding agents",
  description: `${counts.prompts} copyable prompts, commands and recipes for Claude Code, Codex and Cursor: investigations, database checks, thinking prompts and design recipes.`,
  alternates: { canonical: "/prompts", types: { "text/markdown": "/prompts.md" } },
};

export default function Prompts() {
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[["Prompts", "/prompts"]]} />
        <h1>Prompts for AI coding agents</h1>
        <p className="lead">{counts.prompts} prompts, commands and recipes. Copy one and paste it into your agent, or star it to find it later.</p>
      </div>
      <section className="section" aria-labelledby="h-starts">
        <h2 id="h-starts">Best starting points</h2>
        <p className="note">Pick the job you have. Each card names one place to start and when to choose something else. Anything that changes code should run on a branch or a copy, never straight on production.</p>
        <div className="pgrid">
          {STARTS.map((s) => <StartCard key={s.slug} s={s} />)}
        </div>
      </section>
      {/* The rest of the library lives on its area pages. This page lists them, so it stays short on a phone. */}
      <section className="section" aria-labelledby="h-browse">
        <h2 id="h-browse">Browse the library</h2>
        <p className="note">Every prompt sits on one of these pages, grouped by the job it does.</p>
        {sections.map((s) => {
          const as = areas.filter((a) => a.sec === s.id);
          const n = as.reduce((t, a) => t + a.prompts.length, 0);
          return (
            <div key={s.id} id={s.id} className="browse" data-sec={s.id}>
              <h3 className="browse__h"><i className="dot" />{s.title} <span className="browse__n">{n}<span className="sr"> prompts</span></span></h3>
              <p className="browse__d">{s.blurb}</p>
              <nav className="tiles" aria-label={s.title}>
                {as.map((a) => (
                  <Link key={a.slug} className="tile" href={`/prompts/${a.slug}`}>
                    <span className="tile__t">{a.title}</span>
                    <span className="tile__n">{a.prompts.length}<span className="sr"> prompts</span></span>
                  </Link>
                ))}
              </nav>
            </div>
          );
        })}
      </section>
    </main>
  );
}
