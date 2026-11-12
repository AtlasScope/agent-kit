import type { Metadata } from "next";
import Link from "next/link";
import { Crumbs } from "@/components/Crumbs";
import { GuideList, GuideResume } from "@/components/GuideProgress";
import { StartWelcome } from "@/components/StartWelcome";
import { STEPS, TESTED } from "@/lib/start";
import { LESSONS } from "@/lib/lessons";
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

// The first-app guide's hub, in the same quiet black as /install (`.quiet` in globals.css, the rest in start.css):
// one centred column with the promise, the two ways in, what you need as a terminal-style card, then the eight steps
// and the five lessons as numbered rows that remember what you have finished.
export default function Start() {
  return (
    <main className="quiet hub">
      <div className="hub__in">
        <header className="hub__head">
          <Crumbs items={[["Get started", "/start"]]} />
          <h1>Build and publish your first app</h1>
          <p className="hub__lede">Eight steps from nothing installed to a small reading-list app at a public address you can open on your phone. One file, no database, no API keys and no terminal.</p>
          <p className="hub__tested">{TESTED ? `Tested with ${TESTED}.` : "Written against the official sign-up and download pages on 9 Nov 2026. Not yet tested with a first-time user, so tell us where it goes wrong."}</p>
        </header>

        <StartWelcome enabled={authEnabled()} />

        <nav className="hub__ways" aria-label="Where to begin">
          <Link className="hub__way hub__way--lead" href={`/start/${STEPS[0].slug}`}>
            <span className="hub__way-t">I haven’t installed an agent</span>
            <span className="hub__way-d">Start at step 1, choosing your agent.</span>
            <span className="hub__go">Start at step 1{ARROW}</span>
          </Link>
          <Link className="hub__way" href="/start/create">
            <span className="hub__way-t">I already use an agent</span>
            <span className="hub__way-d">Have GitHub Desktop and a Vercel account ready, then start at step 3.</span>
            <span className="hub__go hub__go--ghost">Go to step 3{ARROW}</span>
          </Link>
        </nav>

        <section className="hub__card" aria-labelledby="need-h">
          <div className="hub__bar"><h2 id="need-h">What you need</h2><span>before step 1</span></div>
          <ul className="hub__need">
            {NEED.map(([t, d]) => <li key={t}><span aria-hidden="true">✓</span><p><b>{t}.</b>{d && ` ${d}`}</p></li>)}
          </ul>
        </section>

        <section className="hub__sec" aria-labelledby="steps-h">
          <div className="hub__row"><h2 id="steps-h">The steps</h2><GuideResume items={STEPS} base="/start" store="start" /></div>
          <GuideList items={STEPS} base="/start" store="start" />
        </section>

        <section className="hub__sec" id="lessons" aria-labelledby="lessons-h">
          <div className="hub__row">
            <h2 id="lessons-h">Then, five short lessons</h2>
            <GuideResume items={LESSONS} base="/learn" store="learn" />
          </div>
          <p className="hub__sub">Each explains one idea and gives you one thing to try on the same reading-list app. A few minutes each.</p>
          <GuideList items={LESSONS} base="/learn" store="learn" />
        </section>
      </div>
    </main>
  );
}
