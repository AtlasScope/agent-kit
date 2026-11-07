import type { Metadata } from "next";
import { TodayBoard, type TodayRow } from "@/components/TodayBoard";
import { PageHeader } from "@/components/ui";
import { appointmentsOn, coverageFor, findClinician, findPatient, fullName, intakeFor } from "@/lib/data";
import { clinicDay, formatDate } from "@/lib/dates";

export const metadata: Metadata = { title: "Today" };

export default function TodayPage() {
  const today = clinicDay(0);
  const rows: TodayRow[] = appointmentsOn(today).flatMap((appt) => {
    const pt = findPatient(appt.patientId);
    if (!pt) return [];
    const cov = coverageFor(pt.id);
    return [
      {
        appt,
        patientName: fullName(pt),
        clinician: findClinician(appt.clinicianId)?.shortName ?? "",
        flags: pt.flags,
        intakeDone: intakeFor(pt.id)?.status === "complete",
        insuranceOk: cov?.eligibility === "verified" || cov?.eligibility === "self_pay",
      },
    ];
  });

  return (
    <div className="today">
      <PageHeader title="Today" subtitle={`Check-in desk · ${formatDate(today, { weekday: "long", month: "long" })}`} />
      <TodayBoard rows={rows} />
    </div>
  );
}
