import type { Metadata } from "next";
import Link from "next/link";
import { PatientListTable } from "@/components/PatientListTable";
import { PageHeader } from "@/components/ui";
import { clinicians, patients } from "@/lib/data";

export const metadata: Metadata = { title: "Patients" };

export default function PatientsPage() {
  const clinicianNames = Object.fromEntries(clinicians.map((c) => [c.id, c.shortName]));
  return (
    <div>
      <PageHeader
        title="Patients"
        subtitle="Demographics and contact details"
        actions={
          <Link href="/patients/new" className="btn primary">Add patient</Link>
        }
      />
      <PatientListTable patients={patients} hrefBase="/patients" clinicianNames={clinicianNames} />
    </div>
  );
}
