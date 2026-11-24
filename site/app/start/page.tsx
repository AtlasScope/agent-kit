import type { Metadata } from "next";
import Link from "next/link";
import { Crumbs } from "@/components/Crumbs";
import { GuideList, GuideResume } from "@/components/GuideProgress";
import { StartWelcome } from "@/components/StartWelcome";
import { JourneyPath } from "@/components/guide/JourneyPath";
import { STEPS, TESTED } from "@/lib/start";
import { LESSONS } from "@/lib/lessons";
import { lessonItems } from "@/components/guide/items";
import { authEnabled } from "@/lib/site";
import "./start.css";

export const metadata: Metadata = {
  title: "Build and publish your first app with a coding agent",
  description: "Eight steps from no coding agent to a reading-list app at a public address. One file, no database, no API keys, no terminal.",
  alternates: { canonical: "/start" },
};

const ARROW = <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
const NEED: [string, string][] = [
  ["About an hour", "Most of it is account setup."],
  ["A Mac or Windows computer", ""],
  ["A paid Claude plan", "or a coding agent you already pay for."],
  ["Free GitHub and Vercel accounts", "You make them in step 2."],
];

// The first-app guide's hub, on the same light/dark library surface as every interior page. The head pairs the
// promise and the two ways in with what you need; below it, the eight steps run as one numbered route that remembers
// what you have finished, and the five lessons follow as the next stage.
export default function Start() {
  return (
    <main className="page start-hub">
      <JourneyPath current="/start" />
      <div className="start-hub__top">
        <header className="page-head start-hub__head">
          <Crumbs items={[["Get started", "/start"]]} />
          <h1>Build and publish your first app</h1>
          <p className="lead">Eight steps from nothing installed to a small reading-list app at a public address you can open on your phone. One file, no database, no API keys and no terminal.</p>
          <p className="tested"><i className={`led${TESTED ? " is-on" : ""}`} aria-hidden="true" /> {TESTED ? `Tested with ${TESTED}.` : "Written against the official sign-up and download pages on 9 Nov 2026. Not yet tested with a first-time user, so tell us where it goes wrong."}</p>
          <nav className="ways" aria-label="Where to begin">
            <Link className="way way--lead" href={`/start/${STEPS[0].slug}`}>
              <span className="way__t">I haven’t installed an agent</span>
              <span className="way__d">Start at step 1, choosing your agent.</span>
              <span className="way__go" aria-hidden="true">Step 1{ARROW}</span>
            </Link>
            <Link className="way" href="/start/create">
              <span className="way__t">I already use an agent</span>
              <span className="way__d">Have GitHub Desktop and a Vercel account ready, then start at step 3.</span>
              <span className="way__go" aria-hidden="true">Step 3{ARROW}</span>
            </Link>
          </nav>
        </header>

        <section className="need" aria-labelledby="need-h">
          <h2 id="need-h">What you need <span>before step 1</span></h2>
          <ul>
            {NEED.map(([t, d]) => <li key={t}><strong>{t}.</strong>{d && ` ${d}`}</li>)}
          </ul>
        </section>
      </div>

      <StartWelcome enabled={authEnabled()} />

      <section className="section" aria-labelledby="steps-h">
        <div className="sec-row"><h2 id="steps-h">The steps</h2><GuideResume items={STEPS} base="/start" store="start" /></div>
        <GuideList items={STEPS} base="/start" store="start" />
      </section>

      <section className="section" id="lessons" aria-labelledby="lessons-h">
        <div className="sec-row">
          <h2 id="lessons-h">Then, five short lessons</h2>
          <GuideResume items={LESSONS} base="/learn" store="learn" />
        </div>
        <p className="note">Each explains one idea and gives you one thing to try on the same reading-list app. A few minutes each.</p>
        <GuideList items={lessonItems} base="/learn" store="learn" />
      </section>
    </main>
  );
}
