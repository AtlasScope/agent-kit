import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { Crumbs } from "@/components/Crumbs";
import { CopyButton } from "@/components/CopyButton";
import { authEnabled, dbEnabled } from "@/lib/site";
import { listCollections, getCollection } from "@/lib/collections";
import { resolve, installFor } from "@/lib/items";
import { create, rename, share, remove, removeItem } from "./actions";

export const metadata = { title: "Your collections", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Account() {
  if (!authEnabled()) notFound();
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/account");
  if (!dbEnabled()) return <main className="page"><p className="note">Collections need the database, which isn’t connected yet.</p></main>;
  const cols = await listCollections(userId);
  const full = await Promise.all(cols.map((c) => getCollection(c.id)));
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[["Your collections", "/account"]]} />
        <h1>Your collections</h1>
        <p className="lead ink2">Collections are private until you share one. A shared collection gets a public page, and if it holds skills, one install command for all of them.</p>
      </div>
      <form action={create} className="search">
        <input name="name" placeholder="New collection name" aria-label="New collection name" maxLength={80} required />
        <button className="btn" type="submit">Create</button>
      </form>
      {full.map((c) => c && (
        <section key={c.id} className="section">
          <div className="toolbar" style={{ justifyContent: "space-between" }}>
            <h2 className="h2">{c.name} <span className="muted">· {c.items.length}</span></h2>
            {!c.is_starred && (
              <div className="toolbar">
                {c.is_public && <Link className="btn btn--sm" href={`/collections/${c.id}`}>Public page</Link>}
                <form action={share}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="public" value={c.is_public ? "0" : "1"} />
                  <button className="btn btn--sm" type="submit" aria-pressed={c.is_public}>{c.is_public ? "Shared" : "Share"}</button></form>
                <form action={rename} className="toolbar"><input type="hidden" name="id" value={c.id} />
                  <input className="field" name="name" defaultValue={c.name} aria-label="Rename" maxLength={80} style={{ minHeight: 32, padding: "0 10px", border: "1px solid var(--color-rule-2)", borderRadius: 999, background: "var(--color-paper-2)", color: "inherit", font: "inherit", fontSize: 13 }} />
                  <button className="btn btn--sm" type="submit">Rename</button></form>
                <form action={remove}><input type="hidden" name="id" value={c.id} /><button className="btn btn--sm" type="submit">Delete</button></form>
              </div>
            )}
          </div>
          {c.items.length === 0 ? <p className="note">{c.is_starred ? "Star a prompt or skill and it shows up here." : "Empty. Use Save to… on any prompt or skill page."}</p> : (
            <ul className="list">
              {resolve(c.items).map((i) => (
                <li key={i.kind + i.ref} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", alignItems: "center" }}>
                  <Link href={i.href}><span className="list__t">{i.title}</span><span className="list__n">{i.kind}</span></Link>
                  <form action={removeItem}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="kind" value={i.kind} /><input type="hidden" name="ref" value={i.ref} />
                    <button className="btn btn--sm" type="submit" aria-label={`Remove ${i.title}`}>Remove</button></form>
                </li>
              ))}
            </ul>
          )}
          {installFor(c.items) && <div className="cmdline"><code>{installFor(c.items)}</code><CopyButton text={installFor(c.items)!} /></div>}
        </section>
      ))}
    </main>
  );
}
