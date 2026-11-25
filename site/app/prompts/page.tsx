import Link from "next/link";
import type { Metadata } from "next";
import { Crumbs } from "@/components/Crumbs";
import { StartCard } from "@/components/Cards";
import { SectionRail } from "@/components/prompts/browse/SectionRail";
import { STARTS } from "@/lib/starts";
import { areas, sections, counts } from "@/lib/content";

export const metadata: Metadata = {
  title: "Prompts for AI coding agents",
  description: `${counts.prompts} copyable prompts, commands and recipes for Claude Code, Codex and Cursor: investigations, database checks, thinking prompts and design recipes.`,
  alternates: { canonical: "/prompts", types: { "text/markdown": "/prompts.md" } },
};

// The library index, job first: the best starting point for each common job, then every section with its area
// pages as rows. A rail under the header jumps between them. Owned by the prompt-browsing lane.
export default function Prompts() {
  const index = sections.map((s) => {
    const as = areas.filter((a) => a.sec === s.id);
    return { s, as, n: as.reduce((t, a) => t + a.prompts.length, 0) };
  });
  return (
    <main className="page lib">
      <div className="page-head">
        <Crumbs items={[["Prompts", "/prompts"]]} />
        <h1>Prompts for AI coding agents</h1>
        <p className="lead">{counts.prompts} prompts, commands and recipes. Copy one and paste it into your agent, or star it to find it later.</p>
      </div>
      <SectionRail
        label="Library sections"
        items={[{ id: "starting-points", label: "Best starting points" }, ...index.map(({ s, n }) => ({ id: s.id, label: s.title, n, sec: s.id }))]}
      />
      <section className="section lib__starts" id="starting-points" aria-labelledby="h-starts">
        <div className="sec-head">
          <h2 id="h-starts">Best starting points</h2>
          <p>Pick the job you have. Each names one place to start.</p>
        </div>
        <div className="starts">
          {STARTS.map((s) => <StartCard key={s.slug} s={s} />)}
        </div>
      </section>
      {/* The rest of the library lives on its area pages. This page lists them, so it stays short on a phone. */}
      <section className="section" aria-labelledby="h-browse">
        <div className="sec-head">
          <h2 id="h-browse">Browse the library</h2>
          <p>Every prompt sits on one of these pages, grouped by the job it does.</p>
        </div>
        {index.map(({ s, as, n }) => (
          <div key={s.id} id={s.id} className="browse" data-sec={s.id}>
            <div className="browse__head">
              <h3 className="browse__h">{s.title} <span className="browse__n">{n}<span className="sr"> prompts</span></span></h3>
              <p className="browse__d">{s.blurb}</p>
            </div>
            <nav className="areas" aria-label={s.title}>
              {as.map((a) => (
                <Link key={a.slug} className="area" href={`/prompts/${a.slug}`}>
                  <span className="area__t">{a.title}</span>
                  <span className="area__n">{a.prompts.length}<span className="sr"> prompts</span></span>
                  <svg className="area__go" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3.5 10.5 8 6 12.5" /></svg>
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </section>
    </main>
  );
}
