import Link from "next/link";
import { getPrompt, getPromptById, getSkill, copyText, MODES, type Prompt } from "@/lib/content";
import { CHANGES, type Start } from "@/lib/starts";
import { CopyButton } from "./CopyButton";
import { Star } from "./Star";

const copyLabel = (p: Prompt) => (p.steps ? "Copy recipe" : p.sec === "ecmd" ? "Copy command" : "Copy prompt");

// One card per prompt: title and star, id and what it changes, one line on what it finds, then Copy and Details.
export function PromptCard({ p, best }: { p: Prompt; best?: boolean }) {
  const mode = p.mode ? (p.iso ? "Tests on a copy" : MODES[p.mode]) : p.dmode;
  return (
    <article className={`pcard${best ? " pcard--best" : ""}`} data-sec={p.sec}>
      <div className="pcard__top">
        <h3 className="pcard__t"><Link href={`/prompts/${p.slug}`}>{p.t}</Link></h3>
        <Star kind="prompt" refId={p.id} title={p.t} />
      </div>
      <p className="pcard__m">
        <code className="pid">{p.id}</code>
        {best && <span className="best">Best first</span>}
        {mode && <span className={(p.mode && p.mode !== "read") || p.dmode === "Changes code" ? "warn" : undefined}>{mode}</span>}
      </p>
      {(p.why || p.use) && <p className="pcard__d">{p.why || p.use}</p>}
      <div className="pcard__a">
        <CopyButton className="btn btn--tint" text={copyText(p)} label={copyLabel(p)} icon />
        <Link className="btn" href={`/prompts/${p.slug}`}>Details</Link>
      </div>
    </article>
  );
}

export function PromptCards({ slugs, rank }: { slugs: string[]; rank?: boolean }) {
  return (
    <div className="pgrid">
      {slugs.map(getPrompt).filter((p): p is Prompt => Boolean(p)).map((p, i) => <PromptCard key={p.slug} p={p} best={rank && i === 0} />)}
    </div>
  );
}

export function SkillCards({ names }: { names: string[] }) {
  return (
    <div className="pgrid">
      {names.map((n) => getSkill(n)).filter(Boolean).map((s) => (
        <article key={s!.name} className="pcard" data-kit={s!.kit}>
          <div className="pcard__top">
            <h3 className="pcard__t"><Link className="stretch" href={`/skills/${s!.name}`}>{s!.name}</Link></h3>
            <Star kind="skill" refId={s!.name} title={s!.name} />
          </div>
          <p className="pcard__m"><span>{s!.kit}</span><span>{s!.credit ? s!.credit.author : "Agent Kit"}</span></p>
          <p className="pcard__d">{s!.description}</p>
        </article>
      ))}
    </div>
  );
}

// A best-starting-point card: the visitor's job, the recommended entry, the same four answers in the
// same order, then alternatives with when to choose each.
export function StartCard({ s }: { s: Start }) {
  const p = getPromptById(s.pick);
  if (!p) return null;
  return (
    <article className="pcard scard" data-sec={p.sec} id={s.slug}>
      <div className="pcard__top">
        <h3 className="pcard__t"><i className="dot" />{s.job}</h3>
        <Star kind="prompt" refId={p.id} title={p.t} />
      </div>
      <p className={p.t.startsWith("/") ? "scard__pick scard__pick--cmd" : "scard__pick"}><Link href={`/prompts/${p.slug}`}>{p.t}</Link></p>
      <dl className="scard__qa">
        <dt>Use when</dt><dd>{s.useWhen}</dd>
        <dt>You get</dt><dd>{s.youGet}</dd>
        <dt>Requires</dt><dd>{s.requires}</dd>
        <dt>Changes code?</dt><dd>{CHANGES[s.changes]}</dd>
      </dl>
      <div className="pcard__a">
        <CopyButton className="btn btn--tint" text={copyText(p)} label={copyLabel(p)} icon />
        <Link className="btn" href={`/prompts/${p.slug}`}>Details</Link>
      </div>
      {s.alts.length > 0 && (
        <ul className="scard__alts">
          {s.alts.map((a) => {
            const x = getPromptById(a.id);
            return x ? <li key={a.id}><Link href={`/prompts/${x.slug}`}>{x.t}</Link>: {a.when}</li> : null;
          })}
        </ul>
      )}
    </article>
  );
}
