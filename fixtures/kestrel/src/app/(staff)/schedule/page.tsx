import type { Metadata } from "next";
import Link from "next/link";
import { ScheduleBoard, type BoardAppt } from "@/components/ScheduleBoard";
import { ScheduleNav } from "@/components/ScheduleNav";
import { PageHeader } from "@/components/ui";
import { appointmentsOn, CLINIC, clinicians, coverageFor, findPatient, findRoom, intakeFor } from "@/lib/data";
import { clinicDay, isValidDate } from "@/lib/dates";
import { getRole } from "@/lib/session";

export const metadata: Metadata = { title: "Schedule" };

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ date?: string; clinician?: string }> }) {
  const sp = await searchParams;
  const date = isValidDate(sp.date) ? sp.date : clinicDay(0);
  const role = await getRole();
  const cols = sp.clinician ? clinicians.filter((c) => c.id === sp.clinician) : clinicians;
  const items: BoardAppt[] = appointmentsOn(date)
    .filter((a) => a.status !== "cancelled")
    .flatMap((appt) => {
      const patient = findPatient(appt.patientId);
      if (!patient) return [];
      return [
        {
          appt,
          patient,
          roomName: findRoom(appt.roomId)?.name ?? "",
          intake: intakeFor(patient.id)?.status ?? "not_sent",
          eligibility: coverageFor(patient.id)?.eligibility ?? "pending",
        },
      ];
    });

  return (
    <div>
      <PageHeader
        title="Schedule"
        subtitle={`${items.length} appointments`}
        actions={
          <Link href="/schedule/new" className="btn primary">New appointment</Link>
        }
      />
      <ScheduleNav date={date} view="day" clinician={sp.clinician} />
      <div className="chip-row" aria-label="Clinician">
        <Link href={`/schedule?date=${date}`} className={!sp.clinician ? "chip active" : "chip"}>Everyone</Link>
        {clinicians.map((c) => (
          <Link key={c.id} href={`/schedule?date=${date}&clinician=${c.id}`} className={sp.clinician === c.id ? "chip active" : "chip"}>{c.shortName}</Link>
        ))}
      </div>
      <ScheduleBoard items={items} clinicians={cols} role={role} opens={CLINIC.opens} closes={CLINIC.closes} />
    </div>
  );
}
