import Link from "next/link";
import { CopyButton } from "./CopyButton";
import { Crumbs } from "./Crumbs";
import { firstSentence } from "./Cards";
import { resolve, installFor } from "@/lib/items";
import type { Item } from "@/lib/collections";
import type { ActionState } from "@/app/account/actions";
import { ActionForm, Submit } from "./ActionForm";
import { Pop } from "./Pop";
import { SITE } from "@/lib/site";

export type CollectionData = { id: string; name: string; is_starred: boolean; is_public: boolean; items: Item[] };
type Action = (s: ActionState, f: FormData) => Promise<ActionState>;
type Actions = Record<"create" | "rename" | "share" | "remove" | "removeItem", Action>;

const X = <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>;

// The signed-in Collections page: a form to make a collection, then one panel per collection with its items,
// its sharing state and its actions. Rename, Delete and Remove open in place; Delete and Remove ask once first.
export function CollectionsView({ cols, actions }: { cols: CollectionData[]; actions: Actions }) {
  return (
    <>
      <ActionForm action={actions.create} className="col-new" reset>
        <input className="input" name="name" placeholder="Name it, for example Design reviews…" aria-label="New collection name" maxLength={80} autoComplete="off" required />
        <Submit className="btn btn--solid" busy="Creating…">Create collection</Submit>
      </ActionForm>
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
          <span className="col__meta">{items.length} {items.length === 1 ? "item" : "items"} <span aria-hidden="true">·</span> {c.is_starred ? "Only you" : c.is_public ? "Shared" : "Private"}</span>
        </div>
        {!c.is_starred && (
          <div className="col__acts">
            <ActionForm action={actions.share} className="col__inline">
              <input type="hidden" name="id" value={c.id} /><input type="hidden" name="public" value={c.is_public ? "0" : "1"} />
              <Submit busy={c.is_public ? "Stopping…" : "Sharing…"} label={`${c.is_public ? "Stop sharing" : "Share"} ${c.name}`}>{c.is_public ? "Stop sharing" : "Share"}</Submit>
            </ActionForm>
            <Pop summary="Rename" label={`Rename ${c.name}`}>
              <ActionForm action={actions.rename} className="col__popform">
                <input type="hidden" name="id" value={c.id} />
                <input className="input" name="name" defaultValue={c.name} aria-label={`New name for ${c.name}`} maxLength={80} autoComplete="off" required />
                <Submit className="btn btn--sm btn--solid" busy="Saving…">Save name</Submit>
              </ActionForm>
            </Pop>
            <Pop summary="Delete" label={`Delete ${c.name}`}>
              <ActionForm action={actions.remove} className="col__popform">
                <input type="hidden" name="id" value={c.id} />
                <p>Delete this collection? Its items stay in the library. This can’t be undone.</p>
                <Submit className="btn btn--sm btn--danger" busy="Deleting…">Delete collection</Submit>
              </ActionForm>
            </Pop>
          </div>
        )}
      </header>

      {c.is_public && (
        <div className="cmdline col__link"><code translate="no">{url.replace(/^https?:\/\//, "")}</code><CopyButton text={url} label="Copy link" name={`Copy the link to ${c.name}`} /></div>
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
              <Link href={i.href} className={i.kind === "skill" ? "col__name col__name--cmd" : "col__name"} translate={i.kind === "skill" ? "no" : undefined}>{i.title}</Link>
              <Pop summary={X} summaryClass="col__rm" label={`Remove ${i.title} from ${c.name}`}>
                <ActionForm action={actions.removeItem} className="col__popform">
                  <input type="hidden" name="id" value={c.id} /><input type="hidden" name="kind" value={i.kind} /><input type="hidden" name="ref" value={i.ref} />
                  <p>Remove {i.title} from {c.name}? It stays in the library.</p>
                  <Submit busy="Removing…">Remove</Submit>
                </ActionForm>
              </Pop>
            </li>
          ))}
        </ul>
      )}

      {install && (
        <div className="col__install">
          <p>Install its skills in any agent</p>
          <div className="cmdline"><code translate="no">{install}</code><CopyButton text={install} name={`Copy the install command for ${c.name}`} /></div>
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
        <p className="lead ink2">{parts.length ? `A collection of ${parts.join(" and ")} from the Agent Kit library.` : <>This collection is empty. Browse the <Link className="lic" href="/prompts">prompts</Link> and <Link className="lic" href="/skills">skills</Link> to find something to save.</>}</p>
        <p className="kicker">{c.is_public ? "Shared collection" : "Private collection, only you can see it"}</p>
      </div>
      {install && (
        <section className="col__install col__install--lead" aria-labelledby="install-h">
          <h2 id="install-h">Install its skills</h2>
          <p>One command, in any agent that reads skills.</p>
          <div className="cmdline"><code translate="no">{install}</code><CopyButton text={install} name={`Copy the install command for ${c.name}`} /></div>
        </section>
      )}
      {items.length > 0 && (
        <ul className="col__items col__items--full">
          {items.map((i) => (
            <li key={i.kind + i.ref}>
              <span className="col__kind">{i.kind === "skill" ? "Skill" : "Prompt"}</span>
              <span className="col__body">
                <Link href={i.href} className={i.kind === "skill" ? "col__name col__name--cmd" : "col__name"} translate={i.kind === "skill" ? "no" : undefined}>{i.title}</Link>
                {i.summary && <span className="col__sum">{i.kind === "skill" ? firstSentence(i.summary) : i.summary}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
