import { cookies } from "next/headers";
import type { Role } from "./types";

export async function getRole(): Promise<Role> {
  const store = await cookies();
  return store.get("kestrel_role")?.value === "clinician" ? "clinician" : "frontdesk";
}

export async function getUserName(): Promise<string> {
  const role = await getRole();
  return role === "clinician" ? "Dr. Adaeze Okafor" : "Maria Gonzalez";
}
