import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Crumbs } from "@/components/Crumbs";
import { PromptCard, SkillCards } from "@/components/Cards";
import { fixes, getFix, getPrompt } from "@/lib/content";
import "../fix.css";

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

// An ordered route, not a grid: the prompts run top to bottom on a numbered line, the first marked to start with,
// so the order the page promises is the order you read. Related symptoms in the same scope close the page.
export default async function FixPage({ params }: { params: Promise<{ problem: string }> }) {
  const { problem } = await params;
  const f = getFix(problem);
  if (!f) notFound();
  const ps = f.prompts.map(getPrompt).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const skillNames = [...new Set(f.prompts.flatMap((s) => getPrompt(s)?.skills || []))];
  const others = fixes.filter((x) => x.scope === f.scope && x.slug !== f.slug);
  return (
    <main className="page fix-page">
      <div className="page-head">
        <Crumbs items={[["Fix a problem", "/fix"], [f.title, `/fix/${f.slug}`]]} />
        <p className="kicker">{f.scope === "database" ? "PostgreSQL" : "Your app"}</p>
        <h1>{f.title}</h1>
        <p className="lead ink2">Start with the first prompt. Each one says what proof the agent should bring back and when to skip it.</p>
      </div>
      <div className="fix-page__body">
        <section className="section" aria-labelledby="try-h">
          <h2 id="try-h">Prompts to try, in order</h2>
          <ol className="route">
            {ps.map((p, i) => (
              <li key={p.slug} className="route__step">
                <span className="route__n" aria-hidden="true">{i + 1}</span>
                <PromptCard p={p} best={i === 0} />
              </li>
            ))}
          </ol>
        </section>
        <aside className="fix-page__aside">
          {skillNames.length > 0 && <section className="section"><h2>Skills that help</h2><SkillCards names={skillNames} /></section>}
          {others.length > 0 && <nav className="section others" aria-labelledby="others-h">
            <h2 id="others-h">{f.scope === "database" ? "Other database symptoms" : "Other symptoms in your app"}</h2>
            <ul>{others.map((x) => <li key={x.slug}><Link href={`/fix/${x.slug}`}>{x.title}</Link></li>)}</ul>
          </nav>}
        </aside>
      </div>
      <p className="note">Not quite your problem? <Link className="lic" href="/fix">See every symptom</Link>.</p>
    </main>
  );
}
