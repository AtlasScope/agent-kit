import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckInStep } from "@/components/CheckInStep";
import { CHECKIN_STEPS, type CheckInStepId } from "@/lib/checkin";
import { coverageFor, findAppointment, findClinician, findPatient, findPayer, intakeFor } from "@/lib/data";

export const metadata: Metadata = { title: "Check-in" };

export default async function CheckInPage({ params }: { params: Promise<{ apptId: string; step: string }> }) {
  const { apptId, step } = await params;
  const appt = findAppointment(apptId);
  const patient = appt && findPatient(appt.patientId);
  if (!appt || !patient || !CHECKIN_STEPS.some((s) => s.id === step)) notFound();
  const coverage = coverageFor(patient.id);

  return (
    <CheckInStep
      step={step as CheckInStepId}
      appt={appt}
      patient={patient}
      coverage={coverage}
      payerName={findPayer(coverage?.payerId ?? null)?.name}
      intake={intakeFor(patient.id)}
      clinicianName={findClinician(appt.clinicianId)?.name ?? ""}
    />
  );
}
