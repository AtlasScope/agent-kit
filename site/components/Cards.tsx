import Link from "next/link";
import { getPrompt, getSkill, copyText, MODES, type Prompt } from "@/lib/content";
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
        {mode && <span className={p.mode && p.mode !== "read" ? "warn" : undefined}>{mode}</span>}
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
