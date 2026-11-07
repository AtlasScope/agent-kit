import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { WaitlistTable } from "@/components/WaitlistTable";
import { clinicians, fullName, patients, waitlist } from "@/lib/data";

export const metadata: Metadata = { title: "Waitlist" };

export default function WaitlistPage() {
  const names = Object.fromEntries(patients.map((p) => [p.id, fullName(p)]));
  const clinicianNames = Object.fromEntries(clinicians.map((c) => [c.id, c.shortName]));
  return (
    <div>
      <PageHeader title="Waitlist" subtitle="Patients who want an earlier slot" />
      <WaitlistTable entries={waitlist} names={names} clinicianNames={clinicianNames} />
    </div>
  );
}
