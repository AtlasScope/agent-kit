import Link from "next/link";
import type { Metadata } from "next";
import { Crumbs } from "@/components/Crumbs";
import { fixes } from "@/lib/content";

export const metadata: Metadata = {
  title: "Fix a problem with an AI coding agent",
  description: "Pick the symptom you see in your app or PostgreSQL database and get the agent prompts to try first.",
  alternates: { canonical: "/fix", types: { "text/markdown": "/fix.md" } },
};

export default function Fix() {
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[["Fix a problem", "/fix"]]} />
        <h1>Fix a problem</h1>
        <p className="lead ink2">Pick what you see. Each page lists the prompts to try first, in order.</p>
      </div>
      {(["code", "database"] as const).map((scope) => (
        <section key={scope} className="section">
          <h2>{scope === "code" ? "In your app" : "In your PostgreSQL database"}</h2>
          <div className="rows">
            {fixes.filter((f) => f.scope === scope).map((f) => (
              <Link key={f.slug} className="row" href={`/fix/${f.slug}`}><span>{f.title}</span><span className="row__n">{f.prompts.length}<span className="sr"> prompts</span></span></Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
