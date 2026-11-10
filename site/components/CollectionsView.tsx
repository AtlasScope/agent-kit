import Link from "next/link";
import { CopyButton } from "./CopyButton";
import { Crumbs } from "./Crumbs";
import { firstSentence } from "./Cards";
import { resolve, installFor } from "@/lib/items";
import type { Item } from "@/lib/collections";
import { SITE } from "@/lib/site";

export type CollectionData = { id: string; name: string; is_starred: boolean; is_public: boolean; items: Item[] };
type Actions = Record<"create" | "rename" | "share" | "remove" | "removeItem", (form: FormData) => void | Promise<void>>;

const X = <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>;

// The signed-in Collections page: a form to make a collection, then one panel per collection with its items,
// its sharing state and its actions. Rename and Delete open in place; Delete asks once before it acts.
export function CollectionsView({ cols, actions }: { cols: CollectionData[]; actions: Actions }) {
  return (
    <>
      <form action={actions.create} className="col-new">
        <input className="input" name="name" placeholder="Name a new collection" aria-label="New collection name" maxLength={80} required />
        <button className="btn btn--solid" type="submit">Create collection</button>
      </form>
      <div className="cols">
        {cols.map((c) => <CollectionPanel key={c.id} c={c} actions={actions} />)}
      </div>
    </>
  );
}

function CollectionPanel({ c, actions }: { c: CollectionData; actions: Actions }) {
  const items = resolve(c.items);
  const install = installFor(c.items);
  const url = `${SITE.url}/collections/${c.id}`;
  return (
    <section className="col" aria-labelledby={`col-${c.id}`}>
      <header className="col__head">
        <div className="col__title">
          <h2 id={`col-${c.id}`}>{c.name}</h2>
          <span className="col__meta">{items.length} {items.length === 1 ? "item" : "items"} · {c.is_starred ? "Only you" : c.is_public ? "Shared" : "Private"}</span>
        </div>
        {!c.is_starred && (
          <div className="col__acts">
            <form action={actions.share}>
              <input type="hidden" name="id" value={c.id} /><input type="hidden" name="public" value={c.is_public ? "0" : "1"} />
              <button className="btn btn--sm" type="submit">{c.is_public ? "Stop sharing" : "Share"}</button>
            </form>
            <details className="col__pop">
              <summary className="btn btn--sm">Rename</summary>
              <form action={actions.rename} className="col__popbody">
                <input type="hidden" name="id" value={c.id} />
                <input className="input" name="name" defaultValue={c.name} aria-label={`New name for ${c.name}`} maxLength={80} required />
                <button className="btn btn--sm btn--solid" type="submit">Save</button>
              </form>
            </details>
            <details className="col__pop">
              <summary className="btn btn--sm">Delete</summary>
              <form action={actions.remove} className="col__popbody col__popbody--warn">
                <input type="hidden" name="id" value={c.id} />
                <p>Delete this collection? Its items stay in the library. This can&apos;t be undone.</p>
                <button className="btn btn--sm btn--danger" type="submit">Delete collection</button>
              </form>
            </details>
          </div>
        )}
      </header>

      {c.is_public && (
        <div className="cmdline col__link"><code>{url.replace(/^https?:\/\//, "")}</code><CopyButton text={url} label="Copy link" /></div>
      )}

      {items.length === 0 ? (
        <p className="col__empty">
          {c.is_starred
            ? <>Press the star on any <Link className="lic" href="/prompts">prompt</Link> or <Link className="lic" href="/skills">skill</Link> and it shows up here.</>
            : <>Empty for now. Use <strong>Save to</strong> on any prompt or skill page to add it here.</>}
        </p>
      ) : (
        <ul className="col__items">
          {items.map((i) => (
            <li key={i.kind + i.ref}>
              <span className="col__kind">{i.kind === "skill" ? "Skill" : "Prompt"}</span>
              <Link href={i.href} className={i.kind === "skill" ? "col__name col__name--cmd" : "col__name"}>{i.title}</Link>
              <form action={actions.removeItem}>
                <input type="hidden" name="id" value={c.id} /><input type="hidden" name="kind" value={i.kind} /><input type="hidden" name="ref" value={i.ref} />
                <button className="col__rm" type="submit" aria-label={`Remove ${i.title} from ${c.name}`} title="Remove">{X}</button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {install && (
        <div className="col__install">
          <p>Install its skills in any agent</p>
          <div className="cmdline"><code>{install}</code><CopyButton text={install} /></div>
        </div>
      )}
    </section>
  );
}

// The page for one collection: shared ones are public, private ones only open for their owner.
export function SharedCollection({ c }: { c: Omit<CollectionData, "is_starred"> }) {
  const items = resolve(c.items);
  const install = installFor(c.items);
  const n = (k: string) => items.filter((i) => i.kind === k).length;
  const parts = [n("prompt") && `${n("prompt")} ${n("prompt") === 1 ? "prompt" : "prompts"}`, n("skill") && `${n("skill")} ${n("skill") === 1 ? "skill" : "skills"}`].filter(Boolean);
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[["Collections", "/account"], [c.name, `/collections/${c.id}`]]} />
        <h1>{c.name}</h1>
        <p className="lead ink2">{parts.length ? `A collection of ${parts.join(" and ")} from the Agent Kit library.` : "This collection is empty."}</p>
        <p className="kicker">{c.is_public ? "Shared collection" : "Private collection, only you can see it"}</p>
      </div>
      {install && (
        <section className="col__install col__install--lead" aria-labelledby="install-h">
          <h2 id="install-h">Install its skills</h2>
          <p>One command, in any agent that reads skills.</p>
          <div className="cmdline"><code>{install}</code><CopyButton text={install} /></div>
        </section>
      )}
      {items.length > 0 && (
        <ul className="col__items col__items--full">
          {items.map((i) => (
            <li key={i.kind + i.ref}>
              <span className="col__kind">{i.kind === "skill" ? "Skill" : "Prompt"}</span>
              <span className="col__body">
                <Link href={i.href} className={i.kind === "skill" ? "col__name col__name--cmd" : "col__name"}>{i.title}</Link>
                {i.summary && <span className="col__sum">{i.kind === "skill" ? firstSentence(i.summary) : i.summary}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
