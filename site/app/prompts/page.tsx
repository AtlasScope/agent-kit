import Link from "next/link";
import type { Metadata } from "next";
import { Crumbs } from "@/components/Crumbs";
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
        <p className="lead">{counts.prompts} prompts, commands and recipes. Each one says what it returns and when to skip it. Copy one and paste it into your agent.</p>
      </div>
      {sections.map((s) => (
        <section key={s.id} className="section" aria-labelledby={`s-${s.id}`}>
          <h2 id={`s-${s.id}`}>{s.title}</h2>
          <p className="note">{s.blurb}</p>
          <div className="grid">
            {areas.filter((a) => a.sec === s.id).map((a) => (
              <Link key={a.slug} className="card" href={`/prompts/${a.slug}`}>
                <span className="card__t">{a.title}</span>
                {a.blurb && <span className="card__d">{a.blurb}</span>}
                <span className="card__m">{a.prompts.length} {a.prompts.length === 1 ? "entry" : "entries"}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
