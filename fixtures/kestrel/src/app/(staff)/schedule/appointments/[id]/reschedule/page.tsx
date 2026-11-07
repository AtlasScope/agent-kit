import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SlotPicker } from "@/components/SlotPicker";
import { PageHeader } from "@/components/ui";
import { appointments, CLINIC, clinicians, findAppointment, findPatient, patients } from "@/lib/data";
import { clinicDay, formatDate, formatTime } from "@/lib/dates";

export const metadata: Metadata = { title: "Reschedule" };

export default async function ReschedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appt = findAppointment(id);
  const patient = appt && findPatient(appt.patientId);
  if (!appt || !patient) notFound();

  return (
    <div>
      <PageHeader
        title={`Reschedule ${patient.firstName} ${patient.lastName}`}
        subtitle={`Currently ${formatDate(appt.date)} ${formatTime(appt.start)}`}
        back={{ href: `/schedule/appointments/${appt.id}`, label: "Appointment" }}
      />
      <SlotPicker
        mode="reschedule"
        startDate={appt.date < clinicDay(0) ? clinicDay(0) : appt.date}
        clinicians={clinicians}
        patients={patients}
        booked={appointments}
        initialClinicianId={appt.clinicianId}
        initialPatientId={patient.id}
        minutes={appt.minutes}
        returnTo={`/schedule/appointments/${appt.id}`}
        opens={CLINIC.opens}
        closes={CLINIC.closes}
      />
    </div>
  );
}
