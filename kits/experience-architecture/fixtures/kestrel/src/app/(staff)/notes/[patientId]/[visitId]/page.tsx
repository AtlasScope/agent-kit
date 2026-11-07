import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, PageHeader } from "@/components/ui";
import { findClinician, findPatient, fullName, visits } from "@/lib/data";
import { formatDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Visit note" };

export default async function VisitNotePage({ params }: { params: Promise<{ patientId: string; visitId: string }> }) {
  const { patientId, visitId } = await params;
  const patient = findPatient(patientId);
  const visit = visits.find((v) => v.id === visitId && v.patientId === patientId);
  if (!patient || !visit) notFound();

  return (
    <div>
      <PageHeader
        title={visit.reason}
        subtitle={`${fullName(patient)} · ${formatDate(visit.date, { year: "numeric" })} · ${findClinician(visit.clinicianId)?.name}`}
        back={{ href: `/notes/${patientId}`, label: "Visit notes" }}
      />
      <Card title={visit.signed ? "Signed note" : "Unsigned note"}>
        <pre className="note-pre">{visit.note}</pre>
      </Card>
    </div>
  );
}
