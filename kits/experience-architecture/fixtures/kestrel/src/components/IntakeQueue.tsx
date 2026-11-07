"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDate } from "@/lib/dates";
import { INTAKE_STATUS_LABEL, tone } from "@/lib/labels";
import type { IntakeStatus } from "@/lib/types";
import { useClinic } from "./ClinicStore";

export interface IntakeRow {
  patientId: string;
  name: string;
  mrn: string;
  template: string;
  status: IntakeStatus;
  sentAt?: string;
  nextVisit?: string;
}

const ORDER: IntakeStatus[] = ["not_sent", "sent", "in_progress", "complete"];

export function IntakeQueue({ rows }: { rows: IntakeRow[] }) {
  const router = useRouter();
  const clinic = useClinic();
  const [show, setShow] = useState<"open" | "all">("open");
  const list = rows
    .map((r) => ({ ...r, status: clinic.intakeStatus[r.patientId] ?? r.status }))
    .filter((r) => show === "all" || r.status !== "complete")
    .sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || (a.nextVisit ?? "9").localeCompare(b.nextVisit ?? "9"));

  return (
    <div>
      <div className="toolbar">
        <div className="segmented">
          <button type="button" className={show === "open" ? "seg active" : "seg"} onClick={() => setShow("open")}>
            Needs attention
          </button>
          <button type="button" className={show === "all" ? "seg active" : "seg"} onClick={() => setShow("all")}>
            All patients
          </button>
        </div>
        <span className="muted">{list.length} shown</span>
      </div>
      <table className="table clickable">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Form</th>
            <th>Status</th>
            <th className="hide-sm">Sent</th>
            <th>Next visit</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.patientId} onClick={() => router.push(`/intake/${r.patientId}`)}>
              <td>
                <strong>{r.name}</strong>
                <div className="muted mono">{r.mrn}</div>
              </td>
              <td>{r.template}</td>
              <td><span className={`pill ${tone(r.status)}`}>{INTAKE_STATUS_LABEL[r.status]}</span></td>
              <td className="hide-sm">{r.sentAt ? formatDate(r.sentAt) : "—"}</td>
              <td>{r.nextVisit ? formatDate(r.nextVisit) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
