import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppointmentActions } from "@/components/AppointmentActions";
import { PatientSummary } from "@/components/PatientSummary";
import { Card, PageHeader } from "@/components/ui";
import { findAppointment, findClinician, findPatient, findRoom } from "@/lib/data";
import { endTime, formatDate, formatTime } from "@/lib/dates";
import { getRole } from "@/lib/session";

export const metadata: Metadata = { title: "Appointment" };

export default async function AppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appt = findAppointment(id);
  const patient = appt && findPatient(appt.patientId);
  if (!appt || !patient) notFound();
  const clinician = findClinician(appt.clinicianId);
  const role = await getRole();
  const when = `${formatDate(appt.date)} ${formatTime(appt.start)}`;

  return (
    <div>
      <PageHeader
        title={appt.reason}
        subtitle={`${when}–${formatTime(endTime(appt.start, appt.minutes))} · ${clinician?.name} · ${findRoom(appt.roomId)?.name}`}
        back={{ href: `/schedule?date=${appt.date}`, label: "Schedule" }}
      />
      <div className="grid-2">
        <Card title="Patient">
          <PatientSummary patient={patient} clinicianName={findClinician(patient.preferredClinicianId)?.name} />
          <ul className="link-list">
            <li><Link href={`/intake/${patient.id}`}>Intake form</Link></li>
            <li><Link href={`/insurance/${patient.id}`}>Insurance</Link></li>
            {role === "clinician" && (
              <li><Link href={`/notes/${patient.id}`}>Visit notes</Link></li>
            )}
          </ul>
        </Card>
        <Card title="Appointment">
          <AppointmentActions apptId={appt.id} initialStatus={appt.status} patientFirstName={patient.firstName} whenLabel={when} />
        </Card>
      </div>
    </div>
  );
}
