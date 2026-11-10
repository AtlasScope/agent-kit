import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { Crumbs } from "@/components/Crumbs";
import { CollectionsView } from "@/components/CollectionsView";
import { authEnabled, dbEnabled } from "@/lib/site";
import { listCollections, getCollection } from "@/lib/collections";
import { create, rename, share, remove, removeItem } from "./actions";

export const metadata = { title: "Collections", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Account() {
  if (!authEnabled()) notFound();
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/account");
  if (!dbEnabled()) return <main className="page"><div className="page-head"><Crumbs items={[["Collections", "/account"]]} /><h1>Collections</h1><p className="lead ink2">Collections need the database, which isn’t connected yet. Everything in the library still works without it.</p></div></main>;
  const cols = await listCollections(userId);
  const full = (await Promise.all(cols.map((c) => getCollection(c.id)))).filter((c) => c !== null);
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[["Collections", "/account"]]} />
        <h1>Collections</h1>
        <p className="lead ink2">Starred holds everything you star. Make your own collections to group prompts and skills; each stays private until you share it, and a shared one with skills gets a single install command.</p>
      </div>
      <CollectionsView cols={full} actions={{ create, rename, share, remove, removeItem }} />
    </main>
  );
}
