import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CoverageCard } from "@/components/CoverageCard";
import { PatientSummary } from "@/components/PatientSummary";
import { PageHeader } from "@/components/ui";
import { coverageFor, findClinician, findPatient, findPayer } from "@/lib/data";

export const metadata: Metadata = { title: "Insurance" };

export default async function InsuranceDetailPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  const patient = findPatient(patientId);
  if (!patient) notFound();
  const coverage = coverageFor(patientId);

  return (
    <div>
      <PageHeader title={`Insurance · ${patient.firstName} ${patient.lastName}`} back={{ href: "/insurance", label: "Insurance" }} />
      <PatientSummary patient={patient} clinicianName={findClinician(patient.preferredClinicianId)?.name} />
      <CoverageCard coverage={coverage} payer={findPayer(coverage?.payerId ?? null)} />
      <p className="muted"><Link href={`/intake/${patientId}`}>Intake form for this patient →</Link></p>
    </div>
  );
}
