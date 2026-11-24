import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Crumbs } from "@/components/Crumbs";
import { CopyButton } from "@/components/CopyButton";
import { GuideRail, StepMeter } from "@/components/GuideProgress";
import { Checkpoint, StepNav, Troubles } from "@/components/guide/Parts";
import { STEPS, stepIndex, type Action } from "@/lib/start";

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const OUT = <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>;

export const dynamicParams = false;
export const generateStaticParams = () => STEPS.map((s) => ({ step: s.slug }));

export async function generateMetadata({ params }: { params: Promise<{ step: string }> }): Promise<Metadata> {
  const { step } = await params;
  const s = STEPS[stepIndex(step)];
  if (!s) return {};
  return { title: `${s.title}: first app, step ${stepIndex(step) + 1}`, description: s.goal, alternates: { canonical: `/start/${s.slug}` } };
}

export default async function StartStep({ params }: { params: Promise<{ step: string }> }) {
  const { step } = await params;
  const i = stepIndex(step);
  if (i < 0) notFound();
  const s = STEPS[i], prev = STEPS[i - 1], next = STEPS[i + 1];
  // Actions in their written order; neighbouring links share one row.
  const groups = s.actions.reduce<Action[][]>((acc, a) => {
    const last = acc.at(-1);
    if (last && a.kind === "link" && last[0].kind === "link") last.push(a); else acc.push([a]);
    return acc;
  }, []);
  return (
    <main className="page">
      <div className="guide">
        <article className="guide__main">
          <header className="page-head guide__head">
            <Crumbs items={[["Get started", "/start"], [`Step ${i + 1} of ${STEPS.length}`, `/start/${s.slug}`]]} />
            <StepMeter items={STEPS} base="/start" store="start" current={s.slug} noun="Step" />
            <h1>{s.title}</h1>
            {s.body.map((p) => <p className="lead start-body" key={p.slice(0, 24)}>{p}</p>)}
          </header>

          {s.os && (
            <dl className="os">
              <div><dt>Mac</dt><dd>{s.os.mac}</dd></div>
              <div><dt>Windows</dt><dd>{s.os.windows}</dd></div>
            </dl>
          )}

          {groups.map((g) => g[0].kind === "copy" ? g.map((a) => a.kind === "copy" && (
            <div className="block" key={a.label}>
              <div className="block__head"><span>{cap(a.label.replace(/^Copy (the )?/, ""))}</span><CopyButton text={a.text} label={a.label} /></div>
              <pre>{a.text}</pre>
            </div>
          )) : (
            <ul className="golinks" aria-label="Links for this step" key={g[0].label}>
              {g.map((a) => a.kind === "link" && <li key={a.label}><a className="btn" href={a.href}>{a.label}{OUT}</a></li>)}
            </ul>
          ))}

          <Checkpoint>{s.expect}</Checkpoint>
          <Troubles items={s.wrong} />

          <StepNav label="Guide steps" store="start" current={s.slug}
            back={prev ? [`Back: ${prev.title}`, `/start/${prev.slug}`] : ["All steps", "/start"]}
            next={next ? [`Next: ${next.title}`, `/start/${next.slug}`] : ["Next: five short lessons", "/learn"]} />
        </article>
        <aside className="guide__aside">
          <p className="guide__aside-h">First app</p>
          <GuideRail items={STEPS} base="/start" store="start" current={s.slug} label="All guide steps" />
        </aside>
      </div>
    </main>
  );
}
