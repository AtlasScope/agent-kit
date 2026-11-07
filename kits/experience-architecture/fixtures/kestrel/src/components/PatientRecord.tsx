"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDate, formatTime } from "@/lib/dates";
import { APPT_STATUS_LABEL } from "@/lib/labels";
import type { Appointment, Patient, Role } from "@/lib/types";
import { useClinic } from "./ClinicStore";
import { PatientSummary } from "./PatientSummary";
import { Field } from "./ui";

type Tab = "details" | "appointments" | "contacts";

export function PatientRecord({
  patientId,
  patient: serverPatient,
  appointments,
  clinicianNames,
  role,
}: {
  patientId: string;
  patient: Patient | null;
  appointments: Appointment[];
  clinicianNames: Record<string, string>;
  role: Role;
}) {
  const clinic = useClinic();
  const [tab, setTab] = useState<Tab>("details");
  const base = serverPatient ?? clinic.addedPatients.find((p) => p.id === patientId) ?? null;

  if (!base) {
    return (
      <div className="skeleton" aria-busy="true"><p className="muted">Loading patient…</p></div>
    );
  }

  const patient = { ...base, ...clinic.patientEdits[patientId] };
  const upcoming = appointments.filter((a) => a.status === "booked" || a.status === "arrived");

  return (
    <div>
      <div className="page-header">
        <div>
          <Link href="/patients" className="back-link">← Patients</Link>
          <h1>{patient.firstName} {patient.lastName}</h1>
        </div>
        <div className="page-actions">
          <Link href={`/patients/${patientId}/edit`} className="btn">Edit</Link>
          <Link href={`/schedule/new?patient=${patientId}`} className="btn primary">Book appointment</Link>
        </div>
      </div>

      <PatientSummary patient={patient} clinicianName={clinicianNames[patient.preferredClinicianId]} />

      <div className="tabs" role="tablist">
        {(["details", "appointments", "contacts"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? "tab-btn active" : "tab-btn"}
            onClick={() => setTab(t)}
          >
            {t === "details" ? "Details" : t === "appointments" ? `Appointments (${appointments.length})` : "Contacts"}
          </button>
        ))}
      </div>

      {tab === "details" && (
        <dl className="fields card">
          <Field label="Phone">{patient.phone}</Field>
          <Field label="Email">{patient.email}</Field>
          <Field label="Address">{patient.address}</Field>
          <Field label="Language">{patient.language}</Field>
          <Field label="Next visit">{upcoming[0] ? `${formatDate(upcoming[0].date)} ${formatTime(upcoming[0].start)}` : "None booked"}</Field>
        </dl>
      )}

      {tab === "appointments" && (
        <table className="table card">
          <thead>
            <tr>
              <th>Date</th>
              <th>Clinician</th>
              <th>Reason</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id}>
                <td><Link href={`/schedule/appointments/${a.id}`}>{formatDate(a.date)} {formatTime(a.start)}</Link></td>
                <td>{clinicianNames[a.clinicianId]}</td>
                <td>{a.reason}</td>
                <td>{APPT_STATUS_LABEL[clinic.apptStatus[a.id] ?? a.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {tab === "contacts" && (
        <dl className="fields card">
          <div className="field">
            <dt>Emergency contact</dt>
            <dd>{patient.emergencyContact.name} ({patient.emergencyContact.relation})</dd>
          </div>
          <Field label="Their phone">{patient.emergencyContact.phone}</Field>
        </dl>
      )}

      <section className="card related">
        <h2>Also on file</h2>
        <ul className="link-list">
          <li><Link href={`/intake/${patientId}`}>Intake form →</Link></li>
          <li><Link href={`/insurance/${patientId}`}>Insurance and eligibility →</Link></li>
          {role === "clinician" && (
            <li><Link href={`/notes/${patientId}`}>Visit notes →</Link></li>
          )}
        </ul>
      </section>
    </div>
  );
}
