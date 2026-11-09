import type { Metadata } from "next";
import Link from "next/link";
import { Crumbs } from "@/components/Crumbs";
import { LESSONS, STARTER } from "@/lib/lessons";

export const metadata: Metadata = {
  title: "Five short lessons on working with a coding agent",
  description: "What an agent does, how to ask, what a prompt is, when a skill helps, and how to check a change. One action each, on the same small app.",
  alternates: { canonical: "/learn" },
};

export default function Learn() {
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[["Lessons", "/learn"]]} />
        <h1>Five short lessons</h1>
        <p className="lead">Each one explains one idea and gives you one thing to try on the reading-list app from the <Link href="/start">first-app guide</Link>. Do them in order; each takes a few minutes.</p>
      </div>

      <ol className="start-list">
        {LESSONS.map((l, i) => (
          <li key={l.slug}><Link href={`/learn/${l.slug}`}><span className="start-list__n">{String(i + 1).padStart(2, "0")}</span><span><strong>{l.title}</strong></span></Link></li>
        ))}
      </ol>

      <section className="section">
        <h2>Where to start in the library</h2>
        <p className="start-body">Install <Link href={`/kits/${STARTER.kit}`}>{STARTER.kit}</Link> and use these three skills first. The full catalog is there when you need more.</p>
        <dl className="facts">
          {STARTER.skills.flatMap(([name, d]) => [<dt key={name + "t"}><Link href={`/skills/${name}`}>/{name}</Link></dt>, <dd key={name + "d"}>{d}</dd>])}
        </dl>
      </section>
    </main>
  );
}
