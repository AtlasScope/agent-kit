"use client";
import { useSyncExternalStore } from "react";

export type Me = { signedIn: boolean; collections?: { id: string; name: string; is_starred: boolean }[]; items?: { collection_id: string; kind: string; ref: string }[] };

// One shared copy of the signed-in state, so every star on a page loads it once and updates together.
let me: Me | null = null;
let inflight: Promise<Me> | null = null;
let startedAt = 0;
let gen = 0;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
export const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
export const getMe = () => me;
// Cards mounted together share one request; a later mount (after navigating back, or after
// changing collections on /account) fetches again so stars never show stale state.
export function loadMe(fresh = false) {
  if (!fresh && inflight && Date.now() - startedAt < 2000) return inflight;
  startedAt = Date.now();
  const mine = ++gen;
  // Only the newest request may update the snapshot, so a slow older read can't undo a newer star.
  inflight = fetch("/api/me", { cache: "no-store" }).then((r) => r.json() as Promise<Me>).catch(() => ({ signedIn: false }))
    .then((m) => { if (mine === gen) { me = m; emit(); } return m; });
  return inflight;
}
export async function saveItem(body: Record<string, unknown>) {
  const r = await fetch("/api/me", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const err = r.ok ? "" : ((await r.json().catch(() => ({}))) as { error?: string }).error || "That didn’t save. Try again.";
  await loadMe(true);
  return err;
}
export const useMe = () => useSyncExternalStore(subscribe, getMe, () => null);
export const isIn = (m: Me | null, collectionId: string | undefined, kind: string, ref: string) =>
  Boolean(collectionId && m?.items?.some((i) => i.collection_id === collectionId && i.kind === kind && i.ref === ref));
