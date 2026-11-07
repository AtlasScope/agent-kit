import type { Metadata } from "next";
import { PatientRecord } from "@/components/PatientRecord";
import { appointmentsFor, clinicians, findPatient } from "@/lib/data";
import { getRole } from "@/lib/session";

export const metadata: Metadata = { title: "Patient" };

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = findPatient(id) ?? null;
  const role = await getRole();
  const clinicianNames = Object.fromEntries(clinicians.map((c) => [c.id, c.name]));

  return (
    <PatientRecord patientId={id} patient={patient} appointments={patient ? appointmentsFor(id) : []} clinicianNames={clinicianNames} role={role} />
  );
}
