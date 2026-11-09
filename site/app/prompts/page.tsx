import Link from "next/link";
import type { Metadata } from "next";
import { Crumbs } from "@/components/Crumbs";
import { PromptCards } from "@/components/Cards";
import { areas, sections, prompts, counts } from "@/lib/content";

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
      <nav className="tiles" aria-label="Prompt sections">
        {sections.map((s) => (
          <a key={s.id} className="tile" data-sec={s.id} href={`#${s.id}`}>
            <span className="tile__t"><i className="dot" />{s.title}</span>
            <span className="tile__n">{prompts.filter((p) => p.sec === s.id).length}</span>
          </a>
        ))}
      </nav>
      {sections.map((s) => {
        const as = areas.filter((a) => a.sec === s.id);
        return (
          <section key={s.id} id={s.id} className="section" data-sec={s.id} aria-labelledby={`h-${s.id}`}>
            <h2 id={`h-${s.id}`}><i className="dot" />{s.title}</h2>
            <p className="note">{s.blurb}</p>
            {as.length > 1 && (
              <div className="chips">
                {as.map((a) => <Link key={a.slug} className="chip" href={`/prompts/${a.slug}`}>{a.title} <span className="chip__n">{a.prompts.length}</span></Link>)}
              </div>
            )}
            <PromptCards slugs={as.flatMap((a) => a.prompts)} />
          </section>
        );
      })}
    </main>
  );
}
