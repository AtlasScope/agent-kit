import Link from "next/link";
import type { ReactNode } from "react";
import { NoteDraftProvider } from "@/components/NoteDraft";
import { getRole } from "@/lib/session";

export default async function NotesLayout({ children }: { children: ReactNode }) {
  const role = await getRole();
  if (role !== "clinician") {
    return (
      <div className="center-page inset">
        <h1>Visit notes are for clinicians</h1>
        <p className="muted">Front desk accounts can see appointments, intake and insurance but not clinical notes.</p>
        <Link href="/patients" className="btn">Go to Patients</Link>
      </div>
    );
  }
  return <NoteDraftProvider>{children}</NoteDraftProvider>;
}
