"use server";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createCollection, deleteCollection, updateCollection, setItem, validItem } from "@/lib/collections";

async function user() {
  const { userId } = await auth();
  if (!userId) throw new Error("Sign in first.");
  return userId;
}

export async function create(form: FormData) {
  await createCollection(await user(), String(form.get("name") || ""));
  revalidatePath("/account");
}
export async function rename(form: FormData) {
  await updateCollection(await user(), String(form.get("id")), { name: String(form.get("name") || "") });
  revalidatePath("/account");
}
export async function share(form: FormData) {
  const id = String(form.get("id"));
  await updateCollection(await user(), id, { is_public: form.get("public") === "1" });
  revalidatePath("/account"); revalidatePath(`/collections/${id}`);
}
export async function remove(form: FormData) {
  await deleteCollection(await user(), String(form.get("id")));
  revalidatePath("/account");
}
export async function removeItem(form: FormData) {
  const kind = String(form.get("kind")), ref = String(form.get("ref")), id = String(form.get("id"));
  if (validItem(kind, ref)) await setItem(await user(), id, kind, ref, false);
  revalidatePath("/account"); revalidatePath(`/collections/${id}`);
}
