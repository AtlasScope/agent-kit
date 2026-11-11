import Link from "next/link";
import { getPrompt, getPromptById, getSkill, copyText, MODES, type Prompt } from "@/lib/content";
import { CHANGES, type Start } from "@/lib/starts";
import { KITS } from "@/lib/site";
import { CopyButton } from "./CopyButton";
import { Star } from "./Star";

// A kit named in a Requires line links to that kit's page, where its install command is.
const KIT_NAME = new RegExp(`\\b(${KITS.join("|")})\\b`);
const withKitLinks = (text: string) =>
  text.split(KIT_NAME).map((part, i) => (i % 2 ? <Link key={i} href={`/kits/${part}`}>{part}</Link> : part));

const copyLabel = (p: Prompt) => (p.steps ? "Copy recipe" : p.sec === "ecmd" ? "Copy command" : "Copy prompt");

// One card per prompt: title and star, id and what it changes, one line on what it finds, then Copy and Details.
export function PromptCard({ p, best }: { p: Prompt; best?: boolean }) {
  const mode = p.mode ? (p.iso ? "Tests on a copy" : MODES[p.mode]) : p.dmode;
  return (
    <article className={`pcard${best ? " pcard--best" : ""}`} data-sec={p.sec}>
      <div className="pcard__top">
        <h3 className="pcard__t"><Link className="stretch" href={`/prompts/${p.slug}`}>{p.t}</Link></h3>
        <Star kind="prompt" refId={p.id} title={p.t} />
      </div>
      {(p.why || p.use) && <p className="pcard__d">{p.why || p.use}</p>}
      <div className="pcard__foot">
        <p className="pcard__m">
          <code className="pid">{p.id}</code>
          {best && <span className="best">Best first</span>}
          {p.sec === "dcmd" && <span>By {p.group}</span>}
          {mode && <span className={(p.mode && p.mode !== "read") || p.dmode === "Changes code" ? "warn" : undefined}>{mode}</span>}
        </p>
        <CopyButton className="btn btn--sm" text={copyText(p)} label={copyLabel(p)} name={`${copyLabel(p)}: ${p.t}`} icon />
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

// The first whole sentence of a skill's description, so a card never stops mid-thought.
export const firstSentence = (d: string) => {
  const parts = d.split(/(?<=[.!?])\s+(?=[A-Z/"(])/);
  // A very short opener ("Stop.", "Test-driven development.") reads better with the sentence after it.
  const s = parts[0].length < 30 && parts[1] ? `${parts[0]} ${parts[1]}` : parts[0];
  const cut = s.search(/\s[—–-]\s|;\s/);
  return cut > 20 ? s.slice(0, cut).replace(/[,:]$/, "") + "." : s;
};

export function SkillCards({ names, kit = true }: { names: string[]; kit?: boolean }) {
  return (
    <div className="pgrid">
      {names.map((n) => getSkill(n)).filter(Boolean).map((s) => (
        <article key={s!.name} className="pcard" data-kit={s!.kit}>
          <div className="pcard__top">
            <h3 className="pcard__t"><Link className="stretch" href={`/skills/${s!.name}`}>{s!.name}</Link></h3>
            <Star kind="skill" refId={s!.name} title={s!.name} />
          </div>
          <p className="pcard__m">{kit && <span>{s!.kit}</span>}<span>{s!.credit ? `By ${s!.credit.author}` : "By Agent Kit"}</span></p>
          <p className="pcard__d">{firstSentence(s!.description)}</p>
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
      <p className={p.t.startsWith("/") ? "scard__pick scard__pick--cmd" : "scard__pick"}><Link href={`/prompts/${p.slug}`} translate={p.t.startsWith("/") ? "no" : undefined}>{p.t}</Link></p>
      <dl className="scard__qa">
        <dt>Use when</dt><dd>{s.useWhen}</dd>
        <dt>You get</dt><dd>{s.youGet}</dd>
        <dt>Requires</dt><dd>{withKitLinks(s.requires)}</dd>
        <dt>Changes code?</dt><dd>{CHANGES[s.changes]}</dd>
      </dl>
      <div className="pcard__a">
        <CopyButton className="btn btn--tint" text={copyText(p)} label={copyLabel(p)} name={`${copyLabel(p)}: ${p.t}`} icon />
        <Link className="btn" href={`/prompts/${p.slug}`} aria-label={`Details: ${p.t}`}>Details</Link>
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
