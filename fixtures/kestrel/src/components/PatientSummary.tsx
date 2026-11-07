import Link from "next/link";
import { ageFrom, formatDate } from "@/lib/dates";
import type { Patient } from "@/lib/types";

export function PatientSummary({ patient, clinicianName }: { patient: Patient; clinicianName?: string }) {
  return (
    <div className="patient-summary">
      <div className="avatar" aria-hidden>
        {patient.firstName[0]}
        {patient.lastName[0]}
      </div>
      <div>
        <div className="patient-name"><Link href={`/patients/${patient.id}`}>{patient.firstName} {patient.lastName}</Link></div>
        <div className="muted">
          {patient.mrn} · {formatDate(patient.dob, { weekday: undefined, year: "numeric" })} ({ageFrom(patient.dob)}) · {patient.language}
        </div>
        {clinicianName && <div className="muted">Usual clinician: {clinicianName}</div>}
        <div>
          {patient.flags.map((f) => (
            <span key={f} className="flag">{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
