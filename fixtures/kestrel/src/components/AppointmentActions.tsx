"use client";

import Link from "next/link";
import { useState } from "react";
import { APPT_STATUS_LABEL } from "@/lib/labels";
import type { ApptStatus } from "@/lib/types";
import { useClinic } from "./ClinicStore";
import { ConfirmDialog } from "./ConfirmDialog";

export function AppointmentActions({
  apptId,
  initialStatus,
  patientFirstName,
  whenLabel,
}: {
  apptId: string;
  initialStatus: ApptStatus;
  patientFirstName: string;
  whenLabel: string;
}) {
  const clinic = useClinic();
  const status = clinic.apptStatus[apptId] ?? initialStatus;
  const [confirm, setConfirm] = useState<null | "cancel" | "no_show">(null);
  const closed = status === "cancelled" || status === "no_show" || status === "done";

  function apply(to: ApptStatus) {
    clinic.setApptStatus(apptId, to);
    clinic.notify(`${patientFirstName}'s appointment: ${APPT_STATUS_LABEL[to]}`);
    setConfirm(null);
  }

  return (
    <div className="actions">
      <p>Status: <span className="pill neutral">{APPT_STATUS_LABEL[status]}</span></p>
      {!closed && (
        <div className="btn-row">
          {status === "booked" && (
            <button type="button" className="btn primary" onClick={() => apply("arrived")}>
              Mark arrived
            </button>
          )}
          <Link href={`/schedule/appointments/${apptId}/reschedule`} className="btn">Reschedule</Link>
          <button type="button" className="btn" onClick={() => setConfirm("no_show")}>
            No-show
          </button>
          <button type="button" className="btn danger" onClick={() => setConfirm("cancel")}>
            Cancel appointment
          </button>
        </div>
      )}
      {confirm && (
        <ConfirmDialog
          title={confirm === "cancel" ? "Cancel this appointment?" : "Mark as no-show?"}
          confirmLabel={confirm === "cancel" ? "Cancel appointment" : "Mark no-show"}
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={() => apply(confirm === "cancel" ? "cancelled" : "no_show")}
        >
          <p>{patientFirstName} · {whenLabel}</p>
          <p className="muted">
            {confirm === "cancel"
              ? "The slot goes back on the schedule and the waitlist is offered it."
              : "A no-show is recorded on the patient's history."}
          </p>
        </ConfirmDialog>
      )}
    </div>
  );
}
