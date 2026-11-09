import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Crumbs } from "@/components/Crumbs";
import { CopyButton } from "@/components/CopyButton";
import { STEPS, stepIndex } from "@/lib/start";

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

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
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[["Get started", "/start"], [s.title, `/start/${s.slug}`]]} />
        <p className="note">Step {i + 1} of {STEPS.length}</p>
        <h1>{s.title}</h1>
        {s.body.map((p) => <p className="lead start-body" key={p.slice(0, 24)}>{p}</p>)}
      </div>

      {s.os && (
        <dl className="facts">
          <dt>Mac</dt><dd>{s.os.mac}</dd>
          <dt>Windows</dt><dd>{s.os.windows}</dd>
        </dl>
      )}

      {s.actions.length > 0 && (
        <section className="section">
          {s.actions.map((a) => a.kind === "copy" ? (
            <div className="block" key={a.label}>
              <div className="block__head"><span>{cap(a.label.replace(/^Copy (the )?/, ""))}</span><CopyButton text={a.text} label={a.label} /></div>
              <pre>{a.text}</pre>
            </div>
          ) : (
            <p key={a.label}><a className="btn" href={a.href}>{a.label}</a></p>
          ))}
        </section>
      )}

      <section className="section">
        <h2>You should see</h2>
        <p className="start-body">{s.expect}</p>
      </section>

      <section className="section">
        <h2>If something&apos;s off</h2>
        <dl className="facts">
          {s.wrong.flatMap(([see, fix]) => [<dt key={see + "t"}>{see}</dt>, <dd key={see + "d"}>{fix}</dd>])}
        </dl>
      </section>

      <nav className="start-nav" aria-label="Guide steps">
        {prev ? <Link className="btn" href={`/start/${prev.slug}`}>Back: {prev.title}</Link> : <Link className="btn" href="/start">All steps</Link>}
        {next ? <Link className="btn btn--solid" href={`/start/${next.slug}`}>Next: {next.title}</Link> : <Link className="btn btn--solid" href="/prompts">Find your next prompt</Link>}
      </nav>
    </main>
  );
}
