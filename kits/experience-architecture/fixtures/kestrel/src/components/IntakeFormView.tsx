"use client";

import { INTAKE_STATUS_LABEL } from "@/lib/labels";
import type { IntakeForm, IntakeTemplate } from "@/lib/types";
import { useClinic } from "./ClinicStore";

export function IntakeFormView({
  patientId,
  firstName,
  form,
  template,
}: {
  patientId: string;
  firstName: string;
  form?: IntakeForm;
  template?: IntakeTemplate;
}) {
  const clinic = useClinic();
  const status = clinic.intakeStatus[patientId] ?? form?.status ?? "not_sent";

  return (
    <div className="card">
      <div className="card-head">
        <h2>{template?.name ?? "Intake"} form</h2>
        <span className="pill neutral">{INTAKE_STATUS_LABEL[status]}</span>
      </div>
      {template && (
        <dl className="fields">
          {template.questions.map((q) => (
            <div key={q} className="field">
              <dt>{q}</dt>
              <dd>{form?.answers[q] ?? <span className="muted">Not answered</span>}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="btn-row">
        {status === "not_sent" && (
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              clinic.setIntakeStatus(patientId, "sent");
              clinic.notify(`Form texted to ${firstName}`);
            }}
          >
            Text form to patient
          </button>
        )}
        {(status === "sent" || status === "in_progress") && (
          <>
            <button type="button" className="btn" onClick={() => clinic.notify(`Reminder sent to ${firstName}`)}>
              Send reminder
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                clinic.setIntakeStatus(patientId, "complete");
                clinic.notify("Marked complete");
              }}
            >
              Mark complete
            </button>
          </>
        )}
      </div>
    </div>
  );
}
