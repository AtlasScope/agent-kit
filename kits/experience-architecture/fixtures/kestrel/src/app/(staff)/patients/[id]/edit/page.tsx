import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PatientForm } from "@/components/PatientForm";
import { PageHeader } from "@/components/ui";
import { clinicians, findPatient } from "@/lib/data";

export const metadata: Metadata = { title: "Edit patient" };

export default async function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = findPatient(id);
  if (!patient) notFound();
  return (
    <div>
      <PageHeader title={`Edit ${patient.firstName} ${patient.lastName}`} back={{ href: `/patients/${id}`, label: "Patient" }} />
      <PatientForm patient={patient} clinicians={clinicians} />
    </div>
  );
}
