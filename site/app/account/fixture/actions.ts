"use server";
import { revalidatePath } from "next/cache";
import { store, fixturesEnabled, reset, SAMPLE_PATH } from "./store";
import type { ActionState } from "../actions";

// The same five actions as ../actions.ts, against the sample store. A short wait lets the busy labels show.
async function run(fn: () => string | void): Promise<ActionState> {
  if (!fixturesEnabled()) return { error: "Sample data is off on this server." };
  await new Promise((r) => setTimeout(r, 450));
  const err = fn();
  if (err) return { error: err };
  revalidatePath(SAMPLE_PATH);
  revalidatePath(`${SAMPLE_PATH}/shared`);
  return { ok: Date.now() };
}
const text = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const find = (id: string) => store().find((c) => c.id === id && !c.is_starred);

export async function create(_: ActionState, f: FormData) {
  return run(() => {
    const name = text(f, "name").slice(0, 80);
    if (!name) return "Give the collection a name.";
    if (name.toLowerCase() === "fail") return "That didn’t work. Try again in a moment.";
    store().push({ id: crypto.randomUUID(), name, is_starred: false, is_public: false, items: [] });
  });
}
export async function rename(_: ActionState, f: FormData) {
  if (!text(f, "name")) return { error: "Give the collection a name." };
  return run(() => { const c = find(text(f, "id")); if (c) c.name = text(f, "name").slice(0, 80); });
}
export async function share(_: ActionState, f: FormData) {
  return run(() => { const c = find(text(f, "id")); if (c) c.is_public = f.get("public") === "1"; });
}
export async function remove(_: ActionState, f: FormData) {
  return run(() => { const s = store(); const i = s.findIndex((c) => c.id === text(f, "id") && !c.is_starred); if (i >= 0) s.splice(i, 1); });
}
export async function removeItem(_: ActionState, f: FormData) {
  return run(() => {
    const c = store().find((x) => x.id === text(f, "id"));
    if (c) c.items = c.items.filter((i) => !(i.kind === text(f, "kind") && i.ref === text(f, "ref")));
  });
}
export async function resetSample() {
  if (fixturesEnabled()) { reset(); revalidatePath(SAMPLE_PATH); }
}
