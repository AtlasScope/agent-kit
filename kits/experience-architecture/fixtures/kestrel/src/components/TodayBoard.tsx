"use client";

import Link from "next/link";
import { formatTime } from "@/lib/dates";
import { APPT_STATUS_LABEL } from "@/lib/labels";
import type { Appointment, ApptStatus } from "@/lib/types";
import { useClinic } from "./ClinicStore";

export interface TodayRow {
  appt: Appointment;
  patientName: string;
  clinician: string;
  flags: string[];
  intakeDone: boolean;
  insuranceOk: boolean;
}

const GROUPS: Array<{ title: string; statuses: ApptStatus[] }> = [
  { title: "Expected", statuses: ["booked"] },
  { title: "Waiting", statuses: ["arrived", "ready"] },
  { title: "With clinician", statuses: ["in_room"] },
  { title: "Finished", statuses: ["done", "no_show", "cancelled"] },
];

export function TodayBoard({ rows }: { rows: TodayRow[] }) {
  const { apptStatus } = useClinic();
  const withStatus = rows.map((r) => ({ ...r, status: apptStatus[r.appt.id] ?? r.appt.status }));

  return (
    <div className="today-groups">
      {GROUPS.map((group) => {
        const items = withStatus.filter((r) => group.statuses.includes(r.status));
        return (
          <section key={group.title} className="today-group">
            <h2>{group.title} <span className="muted">{items.length}</span></h2>
            {items.length === 0 && <p className="empty">Nobody here.</p>}
            <ul className="today-list">
              {items.map((r) => (
                <li key={r.appt.id} className="today-item">
                  <div className="today-time">{formatTime(r.appt.start)}</div>
                  <div className="today-who">
                    <strong>{r.patientName}</strong>
                    <div className="muted">
                      {r.clinician}
                      {r.flags.length > 0 && ` · ${r.flags.join(", ")}`}
                    </div>
                    <div className="today-checks">
                      <span className={r.insuranceOk ? "check ok" : "check todo"}>Insurance</span>
                      <span className={r.intakeDone ? "check ok" : "check todo"}>Forms</span>
                    </div>
                  </div>
                  <div className="today-action">
                    {r.status === "booked" ? (
                      <Link href={`/today/${r.appt.id}/arrived`} className="btn primary big">Check in</Link>
                    ) : (
                      <span className="pill neutral">{APPT_STATUS_LABEL[r.status]}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
