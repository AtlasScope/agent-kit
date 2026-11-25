import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Crumbs } from "@/components/Crumbs";
import { CopyButton } from "@/components/CopyButton";
import { GuideRail, StepMeter } from "@/components/GuideProgress";
import { Checkpoint, StepNav, Troubles } from "@/components/guide/Parts";
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
      <div className="guide">
        <article className="guide__main">
          <header className="page-head guide__head">
            <Crumbs items={[["Lessons", "/learn"], [`Lesson ${i + 1} of ${LESSONS.length}`, `/learn/${l.slug}`]]} />
            <StepMeter items={LESSONS} base="/learn" store="learn" current={l.slug} noun="Lesson" />
            <h1>{l.title}</h1>
            {l.idea.map((p) => <p className="lead start-body" key={p.slice(0, 24)}>{p}</p>)}
          </header>

          {l.terms && (
            <dl className="terms" aria-label="Words in this lesson">
              {l.terms.map(([t, d]) => <div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}
            </dl>
          )}

          <section className="tryit" aria-labelledby="try-h">
            <h2 id="try-h">Try it</h2>
            {l.action.note && <p className="note">{l.action.note}</p>}
            <div className="block glass">
              <div className="block__head"><span>Paste into your agent</span><CopyButton className="btn btn--sm btn--brand lead-act" text={l.action.text} label={l.action.label} /></div>
              <pre>{l.action.text}</pre>
            </div>
            {l.contrast && (
              <p className="contrast"><span className="contrast__k">{l.contrast.label}, for comparison:</span> <code>{l.contrast.text}</code> {l.contrast.note}</p>
            )}
          </section>

          <Checkpoint>{l.expect}</Checkpoint>
          <Troubles items={[l.wrong]} />

          <StepNav label="Lessons" store="learn" current={l.slug}
            back={prev ? [`Back: ${prev.title}`, `/learn/${prev.slug}`] : ["All lessons", "/learn"]}
            next={next ? [`Next: ${next.title}`, `/learn/${next.slug}`] : ["Fix a real problem", "/fix"]} />
        </article>
        <aside className="guide__aside">
          <p className="guide__aside-h">Lessons</p>
          <GuideRail items={LESSONS} base="/learn" store="learn" current={l.slug} label="All lessons" />
        </aside>
      </div>
    </main>
  );
}
