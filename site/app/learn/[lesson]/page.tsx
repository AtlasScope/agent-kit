import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Crumbs } from "@/components/Crumbs";
import { CopyButton } from "@/components/CopyButton";
import { LESSONS, lessonIndex } from "@/lib/lessons";

export const dynamicParams = false;
export const generateStaticParams = () => LESSONS.map((l) => ({ lesson: l.slug }));

export async function generateMetadata({ params }: { params: Promise<{ lesson: string }> }): Promise<Metadata> {
  const { lesson } = await params;
  const l = LESSONS[lessonIndex(lesson)];
  if (!l) return {};
  return { title: `${l.title}: lesson ${lessonIndex(lesson) + 1}`, description: l.idea[0], alternates: { canonical: `/learn/${l.slug}` } };
}

export default async function LessonPage({ params }: { params: Promise<{ lesson: string }> }) {
  const { lesson } = await params;
  const i = lessonIndex(lesson);
  if (i < 0) notFound();
  const l = LESSONS[i], prev = LESSONS[i - 1], next = LESSONS[i + 1];
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[["Lessons", "/learn"], [l.title, `/learn/${l.slug}`]]} />
        <p className="note">Lesson {i + 1} of {LESSONS.length}</p>
        <h1>{l.title}</h1>
        {l.idea.map((p) => <p className="lead start-body" key={p.slice(0, 24)}>{p}</p>)}
      </div>

      {l.terms && (
        <dl className="facts">
          {l.terms.flatMap(([t, d]) => [<dt key={t + "t"}>{t}</dt>, <dd key={t + "d"}>{d}</dd>])}
        </dl>
      )}

      <section className="section">
        <h2>Try it</h2>
        {l.action.note && <p className="note">{l.action.note}</p>}
        <div className="block">
          <div className="block__head"><span>Paste into your agent</span><CopyButton text={l.action.text} label={l.action.label} /></div>
          <pre>{l.action.text}</pre>
        </div>
        {l.contrast && (
          <>
            <p className="note">{l.contrast.label}, for comparison: <code>{l.contrast.text}</code> {l.contrast.note}</p>
          </>
        )}
      </section>

      <section className="section">
        <h2>You should see</h2>
        <p className="start-body">{l.expect}</p>
      </section>

      <section className="section">
        <h2>If something&apos;s off</h2>
        <dl className="facts"><dt>{l.wrong[0]}</dt><dd>{l.wrong[1]}</dd></dl>
      </section>

      <nav className="start-nav" aria-label="Lessons">
        {prev ? <Link className="btn" href={`/learn/${prev.slug}`}>Back: {prev.title}</Link> : <Link className="btn" href="/learn">All lessons</Link>}
        {next ? <Link className="btn btn--solid" href={`/learn/${next.slug}`}>Next: {next.title}</Link> : <Link className="btn btn--solid" href="/fix">Fix a real problem</Link>}
      </nav>
    </main>
  );
}
