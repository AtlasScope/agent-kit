import type { Metadata } from "next";
import Link from "next/link";
import { Crumbs } from "@/components/Crumbs";
import { GuideList, GuideResume } from "@/components/GuideProgress";
import { STEPS, TESTED } from "@/lib/start";
import { LESSONS } from "@/lib/lessons";

export const metadata: Metadata = {
  title: "Build and publish your first app with a coding agent",
  description: "Eight steps from no coding agent to a reading-list app at a public address. One file, no database, no API keys, no terminal.",
  alternates: { canonical: "/start" },
};

export default function Start() {
  return (
    <main className="page">
      <div className="two two--wide">
        <div className="page-head">
          <Crumbs items={[["Get started", "/start"]]} />
          <h1>Build and publish your first app</h1>
          <p className="lead">Eight steps from nothing installed to a small reading-list app at a public address you can open on your phone. It’s one file with no database, no API keys and no terminal, so the only setup is the agent, GitHub and Vercel.</p>
          <p className="note">{TESTED ? `Tested with ${TESTED}.` : "Written against the official sign-up and download pages on 9 Nov 2026. Not yet tested with a first-time user, so tell us where it goes wrong."}</p>
        </div>
        <aside className="need" aria-labelledby="need-h">
          <h2 id="need-h">What you need</h2>
          <ul>
            <li><strong>About an hour.</strong> Most of it is account setup.</li>
            <li><strong>A Mac or Windows computer.</strong></li>
            <li><strong>A paid Claude plan,</strong> or a coding agent you already pay for.</li>
            <li><strong>Free GitHub and Vercel accounts.</strong> You make them in step 2.</li>
          </ul>
        </aside>
      </div>

      <div className="tiles tiles--start">
        <Link className="tile tile--lead" href={`/start/${STEPS[0].slug}`}><span className="tile__t">I haven’t installed an agent</span><span className="tile__d">Start at step 1.</span></Link>
        <Link className="tile" href="/start/create"><span className="tile__t">I already use an agent</span><span className="tile__d">Make sure you have GitHub Desktop and a Vercel account, then start at step 3.</span></Link>
      </div>

      <section className="section" aria-labelledby="steps-h">
        <div className="sec-row"><h2 id="steps-h">The steps</h2><GuideResume items={STEPS} base="/start" store="start" /></div>
        <GuideList items={STEPS} base="/start" store="start" />
      </section>

      <section className="section" id="lessons" aria-labelledby="lessons-h">
        <div className="sec-head">
          <h2 id="lessons-h">Then, five short lessons</h2>
          <p>Each explains one idea and gives you one thing to try on the same reading-list app. A few minutes each.</p>
        </div>
        <GuideList items={LESSONS} base="/learn" store="learn" />
      </section>
    </main>
  );
}
