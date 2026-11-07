import type { Metadata } from "next";
import { PatientListTable } from "@/components/PatientListTable";
import { PageHeader } from "@/components/ui";
import { clinicians, patients, visitsFor } from "@/lib/data";
import { formatDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Visit notes" };

export default function NotesPage() {
  const clinicianNames = Object.fromEntries(clinicians.map((c) => [c.id, c.shortName]));
  const values = Object.fromEntries(
    patients.map((pt) => {
      const last = visitsFor(pt.id)[0];
      return [pt.id, last ? { value: "done", label: formatDate(last.date, { year: "numeric" }) } : { value: "none", label: "No visits" }];
    }),
  );

  return (
    <div>
      <PageHeader title="Visit notes" subtitle="Signed notes by patient" />
      <PatientListTable patients={patients} hrefBase="/notes" clinicianNames={clinicianNames} column={{ header: "Last visit", values }} />
    </div>
  );
}
