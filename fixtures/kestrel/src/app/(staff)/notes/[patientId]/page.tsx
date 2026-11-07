import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NoteEditor } from "@/components/NoteEditor";
import { PatientSummary } from "@/components/PatientSummary";
import { Card, PageHeader } from "@/components/ui";
import { appointmentsOn, findClinician, findPatient, fullName, patients, visitsFor } from "@/lib/data";
import { clinicDay, formatDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Visit notes" };

export default async function PatientNotesPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  const patient = findPatient(patientId);
  if (!patient) notFound();
  const history = visitsFor(patientId);

  const todayList = appointmentsOn(clinicDay(0))
    .filter((a) => a.status !== "cancelled" && a.status !== "no_show")
    .map((a) => findPatient(a.patientId)!)
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);
  const idx = todayList.findIndex((p) => p.id === patientId);
  const next = idx >= 0 ? todayList[idx + 1] : todayList[0];
  const switcher = [...patients]
    .sort((a, b) => a.lastName.localeCompare(b.lastName))
    .map((p) => ({ id: p.id, name: `${p.lastName}, ${p.firstName}` }));

  return (
    <div>
      <PageHeader title={`Visit notes · ${fullName(patient)}`} back={{ href: "/notes", label: "Visit notes" }} />
      <PatientSummary patient={patient} clinicianName={findClinician(patient.preferredClinicianId)?.name} />
      <div className="grid-2 wide-left">
        <NoteEditor
          patientId={patientId}
          patientFirstName={patient.firstName}
          nextPatient={next && next.id !== patientId ? { id: next.id, name: fullName(next) } : undefined}
          switcher={switcher}
        />
        <Card title="History">
          {history.length === 0 && <p className="empty">No signed visits yet.</p>}
          <ul className="link-list">
            {history.map((v) => (
              <li key={v.id}>
                <Link href={`/notes/${patientId}/${v.id}`}>{formatDate(v.date, { year: "numeric" })} · {v.reason}</Link>
                <div className="muted">{findClinician(v.clinicianId)?.shortName}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
