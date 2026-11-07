import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IntakeFormView } from "@/components/IntakeFormView";
import { PatientSummary } from "@/components/PatientSummary";
import { PageHeader } from "@/components/ui";
import { findClinician, findPatient, intakeFor, intakeTemplates } from "@/lib/data";

export const metadata: Metadata = { title: "Intake form" };

export default async function IntakeDetailPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  const patient = findPatient(patientId);
  if (!patient) notFound();
  const form = intakeFor(patientId);
  const template = intakeTemplates.find((t) => t.id === form?.templateId);

  return (
    <div>
      <PageHeader title={`Intake · ${patient.firstName} ${patient.lastName}`} back={{ href: "/intake", label: "Intake forms" }} />
      <PatientSummary patient={patient} clinicianName={findClinician(patient.preferredClinicianId)?.name} />
      <IntakeFormView patientId={patientId} firstName={patient.firstName} form={form} template={template} />
      <p className="muted"><Link href={`/insurance/${patientId}`}>Insurance for this patient →</Link></p>
    </div>
  );
}
