import Link from "next/link";
import { CopyButton } from "./CopyButton";
import { Crumbs } from "./Crumbs";
import { PromptRows, SkillCards } from "./Cards";
import { resolve, installFor } from "@/lib/items";
import { getPromptById } from "@/lib/content";
import type { Item } from "@/lib/collections";
import type { ActionState } from "@/app/account/actions";
import { ActionForm, Submit } from "./ActionForm";
import { Pop } from "./Pop";
import { Workspace, type RailEntry } from "./account/Workspace";
import { BOOT, selectionCss } from "./account/boot";
import { SITE } from "@/lib/site";

export type CollectionData = { id: string; name: string; is_starred: boolean; is_public: boolean; items: Item[] };
type Action = (s: ActionState, f: FormData) => Promise<ActionState>;
type Actions = Record<"create" | "rename" | "share" | "remove" | "removeItem", Action>;
type Resolved = ReturnType<typeof resolve>[number];

const PLUS = <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;
const X = <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>;
const BACK = <svg className="i" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>;

// Without JavaScript nothing picks a collection, so every one shows, stacked, and the rail (whose links only
// change the hash) steps aside. Server-action forms and the Pop panels still work.
const NOSCRIPT = ":root .ws .ws__panel{display:grid !important;padding-bottom:var(--space-10)}:root .ws .ws__rail,.ws__back{display:none !important}.ws{grid-template-columns:minmax(0,1fr)}.ws__main{padding-left:0;border-left:0}";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const split = (items: Resolved[]) => ({ prompts: items.filter((i) => i.kind === "prompt"), skills: items.filter((i) => i.kind === "skill") });
const summaryOf = (items: Resolved[]) => {
  const { prompts, skills } = split(items);
  return [prompts.length && plural(prompts.length, "prompt", "prompts"), skills.length && plural(skills.length, "skill", "skills")].filter(Boolean).join(" · ") || "Empty";
};
const stateOf = (c: CollectionData) => (c.is_starred ? "Only you" : c.is_public ? "Shared" : "Private");

// The signed-in Collections page, laid out as a workspace: a rail that lists every collection, and the open
// collection beside it. On phones the rail is the first screen and a collection opens in its place. Which
// collection is open lives in the URL hash, so Back works and a link can open one; the last one opened is
// remembered on this device. `sharedHref` points the "Open page" link elsewhere (the sample-data pages use it).
export function CollectionsView({ cols, actions, sharedHref = (id) => `/collections/${id}` }: { cols: CollectionData[]; actions: Actions; sharedHref?: (id: string) => string }) {
  const resolved = cols.map((c) => ({ c, items: resolve(c.items) }));
  const rail: RailEntry[] = resolved.map(({ c, items }) => ({ id: c.id, name: c.name, count: items.length, starred: c.is_starred, state: stateOf(c) }));
  return (
    <Workspace
      rail={rail}
      boot={<><style>{selectionCss(rail.map((r) => r.id))}</style><script dangerouslySetInnerHTML={{ __html: BOOT }} /><noscript><style>{NOSCRIPT}</style></noscript></>}
      newCollection={
        <Pop summary={<>{PLUS}New collection</>} summaryClass="btn btn--sm ws__new">
          <ActionForm action={actions.create} className="col__popform" reset>
            <label className="col__poplabel" htmlFor="new-col">Name the collection</label>
            <input id="new-col" className="input" name="name" placeholder="For example, Design reviews" maxLength={80} autoComplete="off" required autoFocus />
            <Submit className="btn btn--sm btn--solid" busy="Creating…">Create</Submit>
          </ActionForm>
        </Pop>
      }
    >
      {resolved.map(({ c, items }) => <CollectionPanel key={c.id} c={c} items={items} actions={actions} sharedHref={sharedHref(c.id)} />)}
    </Workspace>
  );
}

function CollectionPanel({ c, items, actions, sharedHref }: { c: CollectionData; items: Resolved[]; actions: Actions; sharedHref: string }) {
  const install = installFor(c.items);
  const url = `${SITE.url}/collections/${c.id}`;
  const { prompts, skills } = split(items);
  return (
    <section className="ws__panel" id={`panel-${c.id}`} data-col={c.id} aria-labelledby={`col-${c.id}`}>
      <a className="ws__back" href="#all">{BACK}All collections</a>
      <header className="cpanel__head">
        <div className="cpanel__title">
          <h2 id={`col-${c.id}`} tabIndex={-1}>{c.name}</h2>
          <p className="cpanel__meta">
            <span>{summaryOf(items)}</span>
            <span className={`cpanel__state${c.is_public ? " is-shared" : ""}`}>{c.is_public && <span className="led is-on" aria-hidden="true" />}{stateOf(c)}</span>
          </p>
        </div>
        {!c.is_starred && (
          <div className="cpanel__acts">
            <ActionForm action={actions.share} className="col__inline">
              <input type="hidden" name="id" value={c.id} /><input type="hidden" name="public" value={c.is_public ? "0" : "1"} />
              <Submit busy={c.is_public ? "Stopping…" : "Sharing…"} label={`${c.is_public ? "Stop sharing" : "Share"} ${c.name}`}>{c.is_public ? "Stop sharing" : "Share"}</Submit>
            </ActionForm>
            <Pop summary="Rename" label={`Rename ${c.name}`}>
              <ActionForm action={actions.rename} className="col__popform">
                <input type="hidden" name="id" value={c.id} />
                <label className="col__poplabel" htmlFor={`rn-${c.id}`}>New name</label>
                <input id={`rn-${c.id}`} className="input" name="name" defaultValue={c.name} maxLength={80} autoComplete="off" required />
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
        <div className="cpanel__share">
          <p className="cpanel__label">Anyone with this link can open it</p>
          <div className="cmdline"><code translate="no">{url.replace(/^https?:\/\//, "")}</code><span className="cpanel__sharebtns"><Link className="copy" href={sharedHref}>Open page</Link><CopyButton text={url} label="Copy link" name={`Copy the link to ${c.name}`} /></span></div>
        </div>
      )}

      {install && (
        <div className="cpanel__install">
          <p className="cpanel__label">Install {skills.length === 1 ? "its skill" : `its ${skills.length} skills`} in any agent</p>
          <div className="cmdline"><code translate="no">{install}</code><CopyButton text={install} name={`Copy the install command for ${c.name}`} /></div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="cpanel__empty">
          {c.is_starred
            ? <p>Press the star on any <Link className="lic" href="/prompts">prompt</Link> or <Link className="lic" href="/skills">skill</Link> and it shows up here.</p>
            : <p>Empty for now. Use <strong>Save to</strong> on any prompt or skill page to add it here.</p>}
          <p className="cpanel__emptylinks"><Link className="btn btn--sm" href="/prompts">Browse prompts</Link><Link className="btn btn--sm" href="/skills">Browse skills</Link></p>
        </div>
      ) : (
        <>
          {prompts.length > 0 && <ItemGroup title="Prompts" items={prompts} c={c} actions={actions} />}
          {skills.length > 0 && <ItemGroup title="Skills" items={skills} c={c} actions={actions} />}
        </>
      )}
    </section>
  );
}

// Items use the site's shared rows (PromptRows, SkillCards), so a saved prompt reads and copies exactly as it does in
// the library. In the workspace each row's action slot holds a Remove control; on the shared page the rows stand alone.
function ItemGroup({ title, items, c, actions }: { title: string; items: Resolved[]; c: CollectionData; actions?: Actions }) {
  const hid = `${c.id}-${title.toLowerCase()}`;
  // In the workspace the panel's name is the h2; on the shared page the group itself is the next level under h1.
  const H = actions ? "h3" : "h2";
  const rowH = actions ? "h4" : "h3";
  const skills = items.filter((i) => i.kind === "skill");
  // Prompt refs are matched without regard to case, so a stored "a01" shows as A01. Remove must send the ref as
  // stored (the delete is exact), and two stored spellings of one prompt show once.
  const storedRef = new Map<string, string>();
  for (const i of items) {
    const p = i.kind === "prompt" ? getPromptById(i.ref) : undefined;
    if (p && !storedRef.has(p.id)) storedRef.set(p.id, i.ref);
  }
  const slugs = [...storedRef.keys()].map((id) => getPromptById(id)!.slug);
  const remove = actions && ((kind: "prompt" | "skill", ref: string, name: string) => (
    <Pop summary={X} summaryClass="col__rm" label={`Remove ${name} from ${c.name}`}>
      <ActionForm action={actions.removeItem} className="col__popform">
        <input type="hidden" name="id" value={c.id} /><input type="hidden" name="kind" value={kind} /><input type="hidden" name="ref" value={ref} />
        <p>Remove {name} from {c.name}? It stays in the library.</p>
        <Submit busy="Removing…">Remove</Submit>
      </ActionForm>
    </Pop>
  ));
  return (
    <section className="cgroup" aria-labelledby={hid}>
      <H id={hid}>{title} <span className="cgroup__n">{items.length}</span></H>
      {slugs.length > 0
        ? <PromptRows as={rowH} slugs={slugs} action={remove && ((p) => remove("prompt", storedRef.get(p.id) ?? p.id, p.t))} />
        : <SkillCards as={rowH} names={skills.map((i) => i.ref)} action={remove && ((sk) => remove("skill", sk.name, sk.name))} />}
    </section>
  );
}

// The page for one collection: shared ones are public, private ones only open for their owner. The owner
// also gets a way back to the workspace with this collection open.
export function SharedCollection({ c, own = false, manageHref = "/account", selfHref = `/collections/${c.id}` }: { c: Omit<CollectionData, "is_starred">; own?: boolean; manageHref?: string; selfHref?: string }) {
  const items = resolve(c.items);
  const install = installFor(c.items);
  const { prompts, skills } = split(items);
  const parts = [prompts.length && plural(prompts.length, "prompt", "prompts"), skills.length && plural(skills.length, "skill", "skills")].filter(Boolean);
  const row = { id: c.id, name: c.name, is_starred: false, is_public: c.is_public, items: c.items };
  return (
    <main className="page shared">
      <div className="page-head">
        <Crumbs items={[["Collections", manageHref], [c.name, selfHref]]} />
        <p className="kicker shared__kicker">
          <span className={`cpanel__state${c.is_public ? " is-shared" : ""}`}>{c.is_public && <span className="led is-on" aria-hidden="true" />}{c.is_public ? "Shared collection" : "Private collection, only you can see it"}</span>
        </p>
        <h1>{c.name}</h1>
        <p className="lead ink2">{parts.length ? `A collection of ${parts.join(" and ")} from the Agent Kit library.` : <>This collection is empty. Browse the <Link className="lic" href="/prompts">prompts</Link> and <Link className="lic" href="/skills">skills</Link> to find something to save.</>}</p>
        {/* A plain link: Collections' boot script only runs on a full page load, and it picks this collection before paint. */}
        {own && <p className="shared__own"><a className="btn btn--sm" href={`${manageHref}#${c.id}`}>Manage in Collections</a></p>}
      </div>
      {install && (
        <section className="shared__install" aria-labelledby="install-h">
          <div className="sec-head">
            <h2 id="install-h">Install its skills</h2>
            <p>One command, in any agent that reads skills.</p>
          </div>
          <div className="cmdline"><code translate="no">{install}</code><CopyButton text={install} name={`Copy the install command for ${c.name}`} /></div>
        </section>
      )}
      {items.length > 0 && (
        <div className="shared__groups">
          {prompts.length > 0 && <ItemGroup title="Prompts" items={prompts} c={row} />}
          {skills.length > 0 && <ItemGroup title="Skills" items={skills} c={row} />}
        </div>
      )}
    </main>
  );
}
