"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatTime } from "@/lib/dates";
import { ELIGIBILITY_LABEL, INTAKE_STATUS_LABEL } from "@/lib/labels";
import type { Appointment, Coverage, IntakeForm, Patient } from "@/lib/types";
import { CHECKIN_STEPS, type CheckInStepId } from "@/lib/checkin";
import { useClinic } from "./ClinicStore";


export function CheckInStep({
  step,
  appt,
  patient,
  coverage,
  payerName,
  intake,
  clinicianName,
}: {
  step: CheckInStepId;
  appt: Appointment;
  patient: Patient;
  coverage?: Coverage;
  payerName?: string;
  intake?: IntakeForm;
  clinicianName: string;
}) {
  const router = useRouter();
  const clinic = useClinic();
  const [phoneConfirmed, setPhoneConfirmed] = useState(false);
  const index = CHECKIN_STEPS.findIndex((s) => s.id === step);
  const next = CHECKIN_STEPS[index + 1];
  const base = `/today/${appt.id}`;
  const eligibility = clinic.eligibility[patient.id] ?? coverage?.eligibility ?? "pending";
  const intakeStatus = clinic.intakeStatus[patient.id] ?? intake?.status ?? "not_sent";

  function finish() {
    clinic.setApptStatus(appt.id, "arrived");
    clinic.notify(`${patient.firstName} is checked in`);
    router.push("/today");
  }

  return (
    <div className="checkin">
      <ol className="stepper">
        {CHECKIN_STEPS.map((s, i) => (
          <li key={s.id} className={i === index ? "current" : i < index ? "done" : ""}><Link href={`${base}/${s.id}`}>{s.label}</Link></li>
        ))}
      </ol>

      <div className="card checkin-card">
        <div className="checkin-who">
          <h2>{patient.firstName} {patient.lastName}</h2>
          <p className="muted">{formatTime(appt.start)} with {clinicianName}</p>
        </div>

        {step === "arrived" && (
          <div className="checkin-body">
            <p>Ask the patient to confirm:</p>
            <ul className="big-list">
              <li>Date of birth: {patient.dob}</li>
              <li>Phone: {patient.phone}</li>
              <li>Address: {patient.address}</li>
            </ul>
            <label className="big-check">
              <input type="checkbox" checked={phoneConfirmed} onChange={(e) => setPhoneConfirmed(e.target.checked)} />
              Details confirmed with patient
            </label>
          </div>
        )}

        {step === "insurance" && (
          <div className="checkin-body">
            <p><strong>{payerName ?? "Self-pay"}</strong> {coverage?.memberId && <span className="mono">· {coverage.memberId}</span>}</p>
            <p>Eligibility: <span className="pill neutral">{ELIGIBILITY_LABEL[eligibility]}</span></p>
            {coverage && coverage.copay > 0 && <p>Collect copay: ${coverage.copay}</p>}
            {eligibility !== "verified" && eligibility !== "self_pay" && (
              <button
                type="button"
                className="btn big"
                onClick={() => {
                  clinic.setEligibility(patient.id, "verified");
                  clinic.notify("Eligibility verified");
                }}
              >
                Run eligibility check
              </button>
            )}
          </div>
        )}

        {step === "forms" && (
          <div className="checkin-body">
            <p>Intake form: <span className="pill neutral">{INTAKE_STATUS_LABEL[intakeStatus]}</span></p>
            {intakeStatus !== "complete" && (
              <button
                type="button"
                className="btn big"
                onClick={() => {
                  clinic.setIntakeStatus(patient.id, "complete");
                  clinic.notify("Form marked complete on tablet");
                }}
              >
                Patient completed form on tablet
              </button>
            )}
          </div>
        )}

        {step === "ready" && (
          <div className="checkin-body">
            <p>All set. Ask {patient.firstName} to take a seat; their first name will show on the waiting board.</p>
            <button type="button" className="btn primary big" onClick={finish}>Finish check-in</button>
          </div>
        )}
      </div>

      <div className="checkin-nav">
        <Link href="/today" className="btn ghost big">Back to Today</Link>
        {next && (
          <Link href={`${base}/${next.id}`} className="btn primary big">Next: {next.label}</Link>
        )}
      </div>
    </div>
  );
}
