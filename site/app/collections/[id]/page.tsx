import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Crumbs } from "@/components/Crumbs";
import { CopyButton } from "@/components/CopyButton";
import { authEnabled, dbEnabled } from "@/lib/site";
import { getCollection } from "@/lib/collections";
import { resolve, installFor } from "@/lib/items";

export const dynamic = "force-dynamic";

async function load(id: string) {
  if (!authEnabled() || !dbEnabled()) return null;
  const c = await getCollection(id);
  if (!c) return null;
  if (c.is_public) return c;
  const { userId } = await auth();
  return userId === c.user_id ? c : null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const c = await load((await params).id);
  if (!c) return { robots: { index: false } };
  return { title: `${c.name}: a collection of agent prompts and skills`, description: resolve(c.items).slice(0, 4).map((i) => i.title).join(", "), robots: { index: c.is_public } };
}

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const c = await load((await params).id);
  if (!c) notFound();
  const items = resolve(c.items);
  const install = installFor(c.items);
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[["Collections", "/account"], [c.name, `/collections/${c.id}`]]} />
        <p className="kicker">{c.is_public ? "Shared collection" : "Private collection, only you can see it"}</p>
        <h1>{c.name}</h1>
        <p className="lead ink2">{items.length} {items.length === 1 ? "item" : "items"}.</p>
      </div>
      {install && (
        <section className="section"><h2>Install its skills</h2><div className="cmdline"><code>{install}</code><CopyButton text={install} /></div></section>
      )}
      <ul className="list">
        {items.map((i) => (
          <li key={i.kind + i.ref}><Link href={i.href}><span className="list__t">{i.title}</span><span className="list__n">{i.kind}</span>{i.summary && <span className="list__d">{i.summary}</span>}</Link></li>
        ))}
      </ul>
    </main>
  );
}
