import Link from "next/link";
import { getPrompt, getPromptById, getSkill, copyText, copyLabel, whatOf, whenOf, type Prompt } from "@/lib/content";
import { CHANGES, type Start } from "@/lib/starts";
import { KITS } from "@/lib/site";
import { CopyButton } from "./CopyButton";
import { Star } from "./Star";
import { ScardMore } from "./ScardMore";
import { modeOf, marksChange } from "./prompts/browse/mode";

// A kit named in a Requires line links to that kit's page, where its install command is.
const KIT_NAME = new RegExp(`\\b(${KITS.join("|")})\\b`);
const withKitLinks = (text: string) =>
  text.split(KIT_NAME).map((part, i) => (i % 2 ? <Link key={i} href={`/kits/${part}`}>{part}</Link> : part));


// One row per prompt: id, title and what it finds, when to use it, what it changes, then Star and Copy.
// The whole row opens the prompt (the title link stretches over it); Star and Copy sit above that link.
export function PromptCard({ p, best }: { p: Prompt; best?: boolean }) {
  const mode = modeOf(p);
  return (
    <article className={`prow${best ? " prow--best" : ""}`} data-sec={p.sec} data-mode={mode || undefined}>
      <code className="pid prow__id" translate="no">{p.id}</code>
      <div className="prow__main">
        <h3 className="prow__t"><Link className="stretch" href={`/prompts/${p.slug}`} translate={p.t.startsWith("/") ? "no" : undefined}>{p.t}</Link></h3>
        {whatOf(p) && <p className="prow__d">{whatOf(p)}</p>}
        {whenOf(p) && <p className="prow__w"><b>Use it when:</b> {whenOf(p)}</p>}
      </div>
      <p className="prow__m">
        {best && <span className="best">Best first</span>}
        {p.fresh && <span className="best">New</span>}
        {p.sec === "dcmd" && <span>By {p.group}</span>}
        {mode && <span className={marksChange(p) ? "warn" : undefined}>{mode}</span>}
      </p>
      <div className="prow__a">
        <Star kind="prompt" refId={p.id} title={p.t} />
        <CopyButton className="btn btn--sm" text={copyText(p)} label={copyLabel(p)} name={`${copyLabel(p)}: ${p.t}`} icon />
      </div>
    </article>
  );
}

// A list of prompt rows. With rank, the list is ordered (the Fix pages: "Prompts to try, in order") and the first
// is marked Best first. Each item carries its mode so the area filter can show or hide it.
export function PromptCards({ slugs, rank }: { slugs: string[]; rank?: boolean }) {
  const list = slugs.map(getPrompt).filter((p): p is Prompt => Boolean(p));
  const items = list.map((p, i) => <li key={p.slug} data-mode={modeOf(p) || undefined}><PromptCard p={p} best={rank && i === 0} /></li>);
  return rank ? <ol className="prows prows--ranked">{items}</ol> : <ul className="prows">{items}</ul>;
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
      <ScardMore
        qa={
          <dl className="scard__qa">
            <dt>Use when</dt><dd>{s.useWhen}</dd>
            <dt>You get</dt><dd>{s.youGet}</dd>
            <dt>Requires</dt><dd>{withKitLinks(s.requires)}</dd>
            <dt>Changes code?</dt><dd>{CHANGES[s.changes]}</dd>
          </dl>
        }
        actions={
          <div className="pcard__a">
            <CopyButton className="btn btn--tint" text={copyText(p)} label={copyLabel(p)} name={`${copyLabel(p)}: ${p.t}`} icon />
            <Link className="btn" href={`/prompts/${p.slug}`} aria-label={`Details: ${p.t}`}>Details</Link>
          </div>
        }
        alts={s.alts.length > 0 && (
          <ul className="scard__alts">
            {s.alts.map((a) => {
              const x = getPromptById(a.id);
              return x ? <li key={a.id}><Link href={`/prompts/${x.slug}`}>{x.t}</Link>: {a.when}</li> : null;
            })}
          </ul>
        )}
      />
    </article>
  );
}
