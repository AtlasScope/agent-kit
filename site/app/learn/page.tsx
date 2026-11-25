import type { Metadata } from "next";
import Link from "next/link";
import { Crumbs } from "@/components/Crumbs";
import { GuideList, GuideResume } from "@/components/GuideProgress";
import { JourneyPath } from "@/components/guide/JourneyPath";
import { lessonItems } from "@/components/guide/items";
import { LESSONS, STARTER } from "@/lib/lessons";

export const metadata: Metadata = {
  title: "Five short lessons on working with a coding agent",
  description: "What an agent does, how to ask, what a prompt is, when a skill helps, and how to check a change. One action each, on the same small app.",
  alternates: { canonical: "/learn" },
};

export default function Learn() {
  return (
    <main className="page learn-hub">
      <div className="hub-top">
        <Crumbs items={[["Lessons", "/learn"]]} />
        <JourneyPath current="/learn" />
      </div>
      <div className="page-head">
        <h1>Five short lessons</h1>
        <p className="lead">Each one explains one idea and gives you one thing to try on the reading-list app from the <Link href="/start">first-app guide</Link>. Do them in order; each takes a few minutes.</p>
      </div>

      <section className="section" aria-labelledby="lessons-h">
        <h2 id="lessons-h" className="sr">The lessons</h2>
        <GuideResume items={LESSONS} base="/learn" store="learn" lead after={["Fix a real problem", "/fix"]} />
        <GuideList items={lessonItems} base="/learn" store="learn" />
      </section>

      <section className="section starter" aria-labelledby="starter-h">
        <h2 id="starter-h">Where to start in the library</h2>
        <p className="note">Install <Link href={`/kits/${STARTER.kit}`}>{STARTER.kit}</Link> and use these three skills first. The full catalog is there when you need more.</p>
        <ul className="starter__list">
          {STARTER.skills.map(([name, d]) => (
            <li key={name}><Link href={`/skills/${name}`}><code>/{name}</code><span>{d}</span></Link></li>
          ))}
        </ul>
      </section>
    </main>
  );
}
