import type { Metadata } from "next";
import { SlotPicker } from "@/components/SlotPicker";
import { PageHeader } from "@/components/ui";
import { appointments, CLINIC, clinicians, patients } from "@/lib/data";
import { clinicDay, isValidDate } from "@/lib/dates";

export const metadata: Metadata = { title: "New appointment" };

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ patient?: string; clinician?: string; date?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div>
      <PageHeader title="New appointment" back={{ href: "/schedule", label: "Schedule" }} />
      <SlotPicker
        mode="new"
        startDate={isValidDate(sp.date) ? sp.date : clinicDay(0)}
        clinicians={clinicians}
        patients={[...patients].sort((a, b) => a.lastName.localeCompare(b.lastName))}
        booked={appointments}
        initialClinicianId={sp.clinician}
        initialPatientId={sp.patient}
        returnTo="/schedule"
        opens={CLINIC.opens}
        closes={CLINIC.closes}
      />
    </div>
  );
}
