import Link from "next/link";
import type { ReactNode } from "react";
import { getPrompt, getPromptById, getSkill, copyText, copyLabel, whatOf, whenOf, type Prompt, type Skill } from "@/lib/content";
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


// Row titles are h3 by default; pass `as="h4"` when rows sit under h3 group headings (collections).
export type RowHeading = "h3" | "h4";

// The one prompt row, used wherever the site lists prompts: area pages, Fix, prompt and skill detail, collections.
// Id, title and what it finds, when to use it, what it changes, then Star and Copy. The title link stretches over the
// row; Star and Copy sit above it. `n` numbers the row (ordered lists such as Fix); `best` marks it Best first.
// `action` adds one control after Copy (collections use it for Remove); it sits above the row link.
// Put rows in PromptRows, or in a <ul className="prows"> / <ol className="prows prows--ranked"> of <li>s.
export function PromptRow({ p, n, best, action, as: H = "h3" }: { p: Prompt; n?: number; best?: boolean; action?: ReactNode; as?: RowHeading }) {
  const mode = modeOf(p);
  return (
    <article className={`prow${n != null ? " prow--n" : ""}${best ? " prow--best" : ""}${action ? " prow--action" : ""}`} data-sec={p.sec} data-mode={mode || undefined}>
      {n != null && <span className="prow__n" aria-hidden="true">{n}</span>}
      <code className="pid prow__id" translate="no">{p.id}</code>
      <div className="prow__main">
        <H className="prow__t"><Link className="stretch" href={`/prompts/${p.slug}`} translate={p.t.startsWith("/") ? "no" : undefined}>{p.t}</Link></H>
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
        {action}
      </div>
    </article>
  );
}

// A list of prompt rows. `ordered` makes it an <ol> with numbered rows and the first marked Best first (Fix pages:
// "Prompts to try, in order"). `action` gives each row its trailing control. Each item carries its mode so the
// area filter can show or hide it.
export function PromptRows({ slugs, ordered, action, as }: { slugs: string[]; ordered?: boolean; action?: (p: Prompt) => ReactNode; as?: RowHeading }) {
  const list = slugs.map(getPrompt).filter((p): p is Prompt => Boolean(p));
  const items = list.map((p, i) => (
    <li key={p.slug} data-mode={modeOf(p) || undefined}><PromptRow p={p} n={ordered ? i + 1 : undefined} best={ordered && i === 0} action={action?.(p)} as={as} /></li>
  ));
  return ordered ? <ol className="prows prows--ranked">{items}</ol> : <ul className="prows">{items}</ul>;
}

// Older names, kept so existing pages keep working. PromptCard is PromptRow; PromptCards is PromptRows with `rank`
// for `ordered`.
export function PromptCard({ p, best }: { p: Prompt; best?: boolean }) {
  return <PromptRow p={p} best={best} />;
}
export function PromptCards({ slugs, rank }: { slugs: string[]; rank?: boolean }) {
  return <PromptRows slugs={slugs} ordered={rank} />;
}

// The first whole sentence of a skill's description, so a card never stops mid-thought.
export const firstSentence = (d: string) => {
  const parts = d.split(/(?<=[.!?])\s+(?=[A-Z/"(])/);
  // A very short opener ("Stop.", "Test-driven development.") reads better with the sentence after it.
  const s = parts[0].length < 30 && parts[1] ? `${parts[0]} ${parts[1]}` : parts[0];
  const cut = s.search(/\s[—–-]\s|;\s/);
  return cut > 20 ? s.slice(0, cut).replace(/[,:]$/, "") + "." : s;
};

// One skill row: name and Star, kit and author, then the first sentence of what it does. `action` adds one control
// after Star (collections use it for Remove). Put rows in SkillCards, or in a <ul className="srows"> of <li>s.
export function SkillRow({ s, kit = true, action, as: H = "h3" }: { s: Skill; kit?: boolean; action?: ReactNode; as?: RowHeading }) {
  return (
    <article className={action ? "srow srow--action" : "srow"} data-kit={s.kit}>
      <div className="srow__top">
        <H className="srow__t"><Link className="stretch" href={`/skills/${s.name}`} translate="no">{s.name}</Link></H>
        <div className="srow__a">
          <Star kind="skill" refId={s.name} title={s.name} />
          {action}
        </div>
      </div>
      <p className="srow__m">{kit && <span>{s.kit}</span>}<span>{s.credit ? `By ${s.credit.author}` : "By Agent Kit"}</span></p>
      <p className="srow__d">{firstSentence(s.description)}</p>
    </article>
  );
}

// Skills as rows, on the skills index, kit, Fix, prompt and collection pages. `action` gives each row its trailing
// control.
export function SkillCards({ names, kit = true, action, as }: { names: string[]; kit?: boolean; action?: (s: Skill) => ReactNode; as?: RowHeading }) {
  const list = names.map((n) => getSkill(n)).filter((s): s is Skill => Boolean(s));
  return (
    <ul className="srows">
      {list.map((s) => <li key={s.name}><SkillRow s={s} kit={kit} action={action?.(s)} as={as} /></li>)}
    </ul>
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
