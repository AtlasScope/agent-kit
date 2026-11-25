import Link from "next/link";
import { Suspense } from "react";
import { Crumbs } from "@/components/Crumbs";
import { PromptCards } from "@/components/Cards";
import { AreaFilter } from "@/components/prompts/browse/AreaFilter";
import { modeOf } from "@/components/prompts/browse/mode";
import { areas, getPrompt, sectionOf, type Area, type Prompt } from "@/lib/content";

// An area page: one job's prompts as rows, with the other pages of its section beside it, a filter by what an
// entry changes, and the next page of the section at the end. Owned by the prompt-browsing lane.
export function AreaPage({ a }: { a: Area }) {
  const s = sectionOf(a.sec);
  const siblings = areas.filter((x) => x.sec === a.sec);
  const at = siblings.findIndex((x) => x.slug === a.slug);
  const next = siblings[at + 1];
  const list = a.prompts.map(getPrompt).filter((p): p is Prompt => Boolean(p));
  const tally = new Map<string, number>();
  for (const p of list) { const m = modeOf(p); if (m) tally.set(m, (tally.get(m) || 0) + 1); }
  const count = <p className="lib__count">{list.length} {list.length === 1 ? "prompt" : "prompts"}</p>;
  const options = [...tally].map(([label, n]) => ({ label, n })).sort((x, y) => y.n - x.n);
  return (
    <main className="page lib">
      <div className="page-head">
        <Crumbs items={[["Prompts", "/prompts"], [a.title, `/prompts/${a.slug}`]]} />
        <p className="kicker" data-sec={a.sec}><Link href={`/prompts#${a.sec}`}>{s.title}</Link></p>
        <h1>{a.title}</h1>
        <p className="lead ink2">{a.blurb || s.blurb}</p>
        {a.sec === "work" && <p className="note">Write your request as usual, then paste one of these after it.</p>}
      </div>
      <div className={siblings.length > 1 ? "area-body area-body--rail" : "area-body"}>
        {siblings.length > 1 && (
          <nav className="sibs" aria-label={`Pages in ${s.title}`} data-sec={a.sec}>
            {/* A phone shows only the current page, as a selector that opens the rest; a computer shows the rail. */}
            <details className="sibs__pick">
              <summary><span className="sibs__in">In {s.title}</span> <span className="sibs__cur">{a.title}</span></summary>
              <SibList siblings={siblings} at={a.slug} />
            </details>
            <div className="sibs__rail"><p className="sibs__h">{s.title}</p><SibList siblings={siblings} at={a.slug} /></div>
          </nav>
        )}
        <div className="area-main">
          <section className="section" aria-labelledby="h-list">
            <h2 id="h-list" className="sr">{a.title} prompts</h2>
            <div className="lib__bar">
              {options.length > 1 ? (
                <Suspense fallback={count}><AreaFilter listId="area-list" options={options} total={list.length} /></Suspense>
              ) : count}
            </div>
            <div id="area-list"><PromptCards slugs={a.prompts} /></div>
          </section>
          {next && (
            <Link className="nextarea" href={`/prompts/${next.slug}`} data-sec={a.sec}>
              <span className="nextarea__k">Next in {s.title}</span>
              <span className="nextarea__t">{next.title} <span className="sibs__n">{next.prompts.length}<span className="sr"> prompts</span></span></span>
              <svg className="nextarea__go" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

function SibList({ siblings, at }: { siblings: Area[]; at: string }) {
  return (
    <ul className="sibs__list">
      {siblings.map((x) => (
        <li key={x.slug}>
          <Link className="sibs__a" href={`/prompts/${x.slug}`} aria-current={x.slug === at ? "page" : undefined}>
            {x.title} <span className="sibs__n">{x.prompts.length}<span className="sr"> prompts</span></span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
