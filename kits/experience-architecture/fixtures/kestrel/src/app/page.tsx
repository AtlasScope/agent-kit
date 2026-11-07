import { redirect } from "next/navigation";
import { getRole } from "@/lib/session";

export default async function Home() {
  const role = await getRole();
  redirect(role === "clinician" ? "/schedule" : "/today");
}
