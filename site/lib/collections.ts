import "server-only";
import { sql } from "./db";
import { getPromptById, getSkill } from "./content";

export type Kind = "prompt" | "skill";
export type Collection = { id: string; name: string; is_starred: boolean; is_public: boolean; count: number };
export type Item = { kind: Kind; ref: string };

const MAX_COLLECTIONS = 100;
const MAX_ITEMS = 500;

export function validItem(kind: string, ref: string): kind is Kind {
  return (kind === "prompt" && Boolean(getPromptById(ref))) || (kind === "skill" && Boolean(getSkill(ref)));
}

export async function starredId(userId: string) {
  const db = sql();
  const rows = await db`
    insert into collections (user_id, name, is_starred) values (${userId}, 'Starred', true)
    on conflict (user_id) where is_starred do update set user_id = excluded.user_id
    returning id`;
  return rows[0].id as string;
}

export async function listCollections(userId: string): Promise<Collection[]> {
  await starredId(userId);
  const rows = await sql()`
    select c.id, c.name, c.is_starred, c.is_public, count(i.ref)::int as count
    from collections c left join collection_items i on i.collection_id = c.id
    where c.user_id = ${userId}
    group by c.id order by c.is_starred desc, c.created_at`;
  return rows as Collection[];
}

export async function getCollection(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = sql();
  const [c] = await db`select id, user_id, name, is_starred, is_public, updated_at from collections where id = ${id}`;
  if (!c) return null;
  const items = (await db`select kind, ref from collection_items where collection_id = ${id} order by added_at`) as Item[];
  return { ...(c as { id: string; user_id: string; name: string; is_starred: boolean; is_public: boolean; updated_at: string }), items };
}

export async function myItems(userId: string) {
  const rows = await sql()`
    select c.id as collection_id, i.kind, i.ref from collections c
    join collection_items i on i.collection_id = c.id where c.user_id = ${userId}`;
  return rows as (Item & { collection_id: string })[];
}

async function owns(userId: string, id: string) {
  const r = await sql()`select 1 from collections where id = ${id} and user_id = ${userId}`;
  return r.length > 0;
}

export async function createCollection(userId: string, name: string) {
  const clean = name.trim().slice(0, 80);
  if (!clean) throw new Error("Give the collection a name.");
  const db = sql();
  const [{ n }] = await db`select count(*)::int as n from collections where user_id = ${userId}`;
  if (n >= MAX_COLLECTIONS) throw new Error("You have the most collections allowed.");
  const [row] = await db`insert into collections (user_id, name) values (${userId}, ${clean}) returning id`;
  return row.id as string;
}

export async function setItem(userId: string, collectionId: string, kind: Kind, ref: string, on: boolean) {
  if (!(await owns(userId, collectionId))) throw new Error("Not your collection.");
  const db = sql();
  if (on) {
    const [{ n }] = await db`select count(*)::int as n from collection_items where collection_id = ${collectionId}`;
    if (n >= MAX_ITEMS) throw new Error("This collection is full.");
    await db`insert into collection_items (collection_id, kind, ref) values (${collectionId}, ${kind}, ${ref}) on conflict do nothing`;
  } else {
    await db`delete from collection_items where collection_id = ${collectionId} and kind = ${kind} and ref = ${ref}`;
  }
  await db`update collections set updated_at = now() where id = ${collectionId}`;
}

export async function updateCollection(userId: string, id: string, patch: { name?: string; is_public?: boolean }) {
  const db = sql();
  if (patch.name !== undefined) {
    const clean = patch.name.trim().slice(0, 80);
    if (clean) await db`update collections set name = ${clean}, updated_at = now() where id = ${id} and user_id = ${userId} and not is_starred`;
  }
  if (patch.is_public !== undefined)
    await db`update collections set is_public = ${patch.is_public}, updated_at = now() where id = ${id} and user_id = ${userId} and not is_starred`;
}

export async function deleteCollection(userId: string, id: string) {
  await sql()`delete from collections where id = ${id} and user_id = ${userId} and not is_starred`;
}

export async function publicCollections(limit = 1000) {
  return (await sql()`select id, updated_at from collections where is_public order by updated_at desc limit ${limit}`) as { id: string; updated_at: string }[];
}
