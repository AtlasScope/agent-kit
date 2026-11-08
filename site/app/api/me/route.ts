import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { listCollections, myItems, setItem, starredId, createCollection, validItem } from "@/lib/collections";

export const dynamic = "force-dynamic";

// Signed-in state for the Star and Save buttons on public pages.
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ signedIn: false });
  const [collections, items] = await Promise.all([listCollections(userId), myItems(userId)]);
  return NextResponse.json({ signedIn: true, collections, items }, { headers: { "cache-control": "private, no-store" } });
}

// { kind, ref, on, collectionId? | newCollection? }: star, save to a collection or remove.
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const body = await req.json().catch(() => null) as { kind?: string; ref?: string; on?: boolean; collectionId?: string; newCollection?: string } | null;
  if (!body?.kind || !body.ref || !validItem(body.kind, body.ref)) return NextResponse.json({ error: "Unknown prompt or skill." }, { status: 400 });
  try {
    const id = body.newCollection ? await createCollection(userId, body.newCollection) : body.collectionId || (await starredId(userId));
    await setItem(userId, id, body.kind, body.ref, body.on !== false);
    return NextResponse.json({ ok: true, collectionId: id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
