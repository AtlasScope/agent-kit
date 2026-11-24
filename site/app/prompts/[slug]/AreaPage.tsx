import { Crumbs } from "@/components/Crumbs";
import { PromptCards } from "@/components/Cards";
import { sectionOf, type Area } from "@/lib/content";

// An area page: one job's prompts as cards. Owned by the prompt-browsing lane.
export function AreaPage({ a }: { a: Area }) {
  const s = sectionOf(a.sec);
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[["Prompts", "/prompts"], [a.title, `/prompts/${a.slug}`]]} />
        <h1>{a.title}</h1>
        <p className="lead ink2">{a.blurb || s.blurb}</p>
        <p className="kicker" data-sec={a.sec}><i className="dot" />{s.title}</p>
        {a.sec === "work" && <p className="note">Write your request as usual, then paste one of these after it.</p>}
      </div>
      <PromptCards slugs={a.prompts} />
    </main>
  );
}
