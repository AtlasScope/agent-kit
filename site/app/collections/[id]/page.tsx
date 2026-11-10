import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { SharedCollection } from "@/components/CollectionsView";
import { authEnabled, dbEnabled } from "@/lib/site";
import { getCollection } from "@/lib/collections";
import { resolve } from "@/lib/items";

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
  return { title: `${c.name}: a collection of agent prompts and skills`, description: resolve(c.items).slice(0, 4).map((i) => i.title).join(", ") || `${c.name}, a collection on Agent Kit.`, robots: { index: c.is_public } };
}

export default async function CollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const c = await load((await params).id);
  if (!c) notFound();
  return <SharedCollection c={c} />;
}
