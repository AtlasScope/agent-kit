import type { Metadata } from "next";
import { PatientForm } from "@/components/PatientForm";
import { PageHeader } from "@/components/ui";
import { clinicians } from "@/lib/data";

export const metadata: Metadata = { title: "Add patient" };

export default function NewPatientPage() {
  return (
    <div>
      <PageHeader title="Add patient" back={{ href: "/patients", label: "Patients" }} />
      <PatientForm clinicians={clinicians} />
    </div>
  );
}
