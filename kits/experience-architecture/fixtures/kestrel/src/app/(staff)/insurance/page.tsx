import type { Metadata } from "next";
import Link from "next/link";
import { PatientListTable } from "@/components/PatientListTable";
import { PageHeader } from "@/components/ui";
import { clinicians, coverages, patients } from "@/lib/data";
import { ELIGIBILITY_LABEL } from "@/lib/labels";
import type { Eligibility } from "@/lib/types";

export const metadata: Metadata = { title: "Insurance" };

export default function InsurancePage() {
  const clinicianNames = Object.fromEntries(clinicians.map((c) => [c.id, c.shortName]));
  const values = Object.fromEntries(coverages.map((c) => [c.patientId, { value: c.eligibility, label: ELIGIBILITY_LABEL[c.eligibility] }]));
  const options = (Object.keys(ELIGIBILITY_LABEL) as Eligibility[]).map((k) => ({ value: k, label: ELIGIBILITY_LABEL[k] }));

  return (
    <div>
      <PageHeader
        title="Insurance"
        subtitle="Coverage and eligibility checks"
        actions={
          <Link href="/insurance/payers" className="btn">Payers</Link>
        }
      />
      <PatientListTable
        patients={patients}
        hrefBase="/insurance"
        clinicianNames={clinicianNames}
        column={{ header: "Eligibility", values }}
        filterOptions={options}
      />
    </div>
  );
}
