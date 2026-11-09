import type { Metadata } from "next";
import Link from "next/link";
import { Crumbs } from "@/components/Crumbs";
import { STEPS, TESTED } from "@/lib/start";

export const metadata: Metadata = {
  title: "Build and publish your first app with a coding agent",
  description: "Eight steps from no coding agent to a reading-list app at a public address. One file, no database, no API keys, no terminal.",
  alternates: { canonical: "/start" },
};

export default function Start() {
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[["Get started", "/start"]]} />
        <h1>Build and publish your first app</h1>
        <p className="lead">Eight steps from nothing installed to a small reading-list app at a public address you can open on your phone. It&apos;s one file with no database, no API keys and no terminal, so the only setup is the agent, GitHub and Vercel.</p>
        <p className="note">{TESTED ? `Tested with ${TESTED}.` : "Written against the official sign-up and download pages on 9 Nov 2026. Not yet tested with a first-time user, so tell us where it goes wrong."}</p>
      </div>

      <div className="tiles tiles--start">
        <Link className="tile tile--lead" data-sec="inv" href={`/start/${STEPS[0].slug}`}><span className="tile__t">I haven&apos;t installed an agent</span><span className="tile__d">Start at step 1. About an hour, most of it account setup.</span></Link>
        <Link className="tile" href="/start/create"><span className="tile__t">I already use an agent</span><span className="tile__d">Make sure you have GitHub Desktop and a Vercel account, then start at step 3.</span></Link>
      </div>

      <section className="section">
        <h2>The steps</h2>
        <ol className="start-list">
          {STEPS.map((s, i) => (
            <li key={s.slug}><Link href={`/start/${s.slug}`}><span className="start-list__n">{String(i + 1).padStart(2, "0")}</span><span><strong>{s.title}</strong><span className="note">{s.goal}</span></span></Link></li>
          ))}
        </ol>
      </section>

      <p className="note">Done, or already past this? <Link className="lic" href="/learn">Five short lessons</Link> explain prompts, skills and how to check a change, using the same app.</p>
    </main>
  );
}
