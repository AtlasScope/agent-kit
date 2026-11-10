"use server";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createCollection, deleteCollection, updateCollection, setItem, validItem, UserError } from "@/lib/collections";

// Every action returns its result to the form that sent it: an error to show beside the form, or ok with a
// fresh stamp so the form can close its panel. A session that ended sends the visitor back to sign in.
export type ActionState = { error?: string; ok?: number } | null;

async function run(fn: (userId: string) => Promise<unknown>, paths: string[]): Promise<ActionState> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/account");
  try {
    await fn(userId);
  } catch (e) {
    if (e instanceof UserError) return { error: e.message };
    console.error("account action", e);
    return { error: "That didn’t work. Try again in a moment." };
  }
  for (const p of paths) revalidatePath(p);
  return { ok: Date.now() };
}

const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();

export async function create(_: ActionState, form: FormData) {
  return run((u) => createCollection(u, text(form, "name")), ["/account"]);
}
export async function rename(_: ActionState, form: FormData) {
  if (!text(form, "name")) return { error: "Give the collection a name." };
  return run((u) => updateCollection(u, text(form, "id"), { name: text(form, "name") }), ["/account"]);
}
export async function share(_: ActionState, form: FormData) {
  const id = text(form, "id");
  return run((u) => updateCollection(u, id, { is_public: form.get("public") === "1" }), ["/account", `/collections/${id}`]);
}
export async function remove(_: ActionState, form: FormData) {
  return run((u) => deleteCollection(u, text(form, "id")), ["/account"]);
}
export async function removeItem(_: ActionState, form: FormData) {
  const kind = text(form, "kind"), ref = text(form, "ref"), id = text(form, "id");
  if (!validItem(kind, ref)) return { error: "That item is no longer in the library." };
  return run((u) => setItem(u, id, kind, ref, false), ["/account", `/collections/${id}`]);
}
