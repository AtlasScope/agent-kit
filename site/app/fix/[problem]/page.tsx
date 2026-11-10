import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Crumbs } from "@/components/Crumbs";
import { PromptCards, SkillCards } from "@/components/Cards";
import { fixes, getFix, getPrompt } from "@/lib/content";

export const dynamicParams = false;
export const generateStaticParams = () => fixes.map((f) => ({ problem: f.slug }));

export async function generateMetadata({ params }: { params: Promise<{ problem: string }> }): Promise<Metadata> {
  const { problem } = await params;
  const f = getFix(problem);
  if (!f) return {};
  const first = f.prompts.map(getPrompt).filter(Boolean).slice(0, 3).map((p) => p!.t.toLowerCase());
  return {
    title: { absolute: `${f.title}: how to find the cause with an AI agent` },
    description: `${f.prompts.length} prompts to paste into Claude Code, Codex or Cursor when ${f.scope === "database" ? "your database shows this" : "your app shows this"}, starting with ${first.join(", ")}.`.slice(0, 160),
    alternates: { canonical: `/fix/${problem}`, types: { "text/markdown": `/fix/${problem}.md` } },
  };
}

export default async function FixPage({ params }: { params: Promise<{ problem: string }> }) {
  const { problem } = await params;
  const f = getFix(problem);
  if (!f) notFound();
  const skillNames = [...new Set(f.prompts.flatMap((s) => getPrompt(s)?.skills || []))];
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[["Fix a problem", "/fix"], [f.title, `/fix/${f.slug}`]]} />
        <h1>{f.title}</h1>
        <p className="lead ink2">Start with the first prompt. Each one says what proof the agent should bring back and when to skip it.</p>
        <p className="kicker">{f.scope === "database" ? "PostgreSQL" : "Your app"}</p>
      </div>
      <PromptCards slugs={f.prompts} rank />
      {skillNames.length > 0 && <section className="section"><h2>Skills that help</h2><SkillCards names={skillNames} /></section>}
      <p className="note">Not quite your problem? <Link className="lic" href="/fix">See every symptom</Link>.</p>
    </main>
  );
}
