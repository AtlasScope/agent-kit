import Link from "next/link";
import type { Metadata } from "next";
import { Crumbs } from "@/components/Crumbs";
import { FixFilter } from "@/components/guide/FixFilter";
import { JourneyPath } from "@/components/guide/JourneyPath";
import { fixes, getPrompt } from "@/lib/content";
import "./fix.css";

export const metadata: Metadata = {
  title: "Fix a problem with an AI coding agent",
  description: "Pick the symptom you see in your app or PostgreSQL database and get the agent prompts to try first.",
  alternates: { canonical: "/fix", types: { "text/markdown": "/fix.md" } },
};

const SCOPES = [["code", "In your app"], ["database", "In your PostgreSQL database"]] as const;

// Symptom first: two columns of what you might be seeing, each row naming the prompt the route starts with and how
// many prompts it holds. A filter narrows the rows as you type.
export default function Fix() {
  return (
    <main className="page fix-hub">
      <div className="hub-top">
        <Crumbs items={[["Fix a problem", "/fix"]]} />
        <JourneyPath current="/fix" />
      </div>
      <div className="page-head">
        <h1>Fix a problem</h1>
        <p className="lead ink2">Pick what you see. Each page lists the prompts to try first, in order.</p>
      </div>
      <FixFilter total={fixes.length} />
      <div className="symptoms">
        {SCOPES.map(([scope, label]) => {
          const list = fixes.filter((f) => f.scope === scope);
          return (
            <section key={scope} className="symptoms__group" data-fix-group aria-labelledby={`fix-${scope}`}>
              <h2 id={`fix-${scope}`}>{label} <span data-fix-count>{list.length}</span></h2>
              <ul>
                {list.map((f) => {
                  const first = getPrompt(f.prompts[0]);
                  return (
                    <li key={f.slug} data-fix={`${f.title} ${f.prompts.map((s) => getPrompt(s)?.t || "").join(" ")}`.toLowerCase()}>
                      <Link href={`/fix/${f.slug}`}>
                        <span className="symptom__t">{f.title}</span>
                        {first && <span className="symptom__d">Starts with {first.t}</span>}
                        <span className="symptom__n">{f.prompts.length}<span className="sr"> prompts</span></span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}
