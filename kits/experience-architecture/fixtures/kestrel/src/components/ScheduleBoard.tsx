"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { endTime, formatTime } from "@/lib/dates";
import { APPT_STATUS_LABEL, ELIGIBILITY_LABEL, INTAKE_STATUS_LABEL } from "@/lib/labels";
import type { Appointment, ApptStatus, Clinician, Eligibility, IntakeStatus, Patient, Role } from "@/lib/types";
import { useClinic } from "./ClinicStore";
import { Drawer } from "./Drawer";
import { PatientSummary } from "./PatientSummary";
import { Field } from "./ui";

export interface BoardAppt {
  appt: Appointment;
  patient: Patient;
  roomName: string;
  intake: IntakeStatus;
  eligibility: Eligibility;
}

const NEXT_STATUS: Partial<Record<ApptStatus, { to: ApptStatus; label: string }>> = {
  booked: { to: "arrived", label: "Mark arrived" },
  arrived: { to: "ready", label: "Mark ready" },
  ready: { to: "in_room", label: "Room patient" },
  in_room: { to: "done", label: "Check out" },
};

function minutesFrom(open: string, t: string) {
  const [oh, om] = open.split(":").map(Number);
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m - (oh * 60 + om);
}

export function ScheduleBoard({
  items,
  clinicians,
  role,
  opens,
  closes,
}: {
  items: BoardAppt[];
  clinicians: Clinician[];
  role: Role;
  opens: string;
  closes: string;
}) {
  const clinic = useClinic();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const close = useCallback(() => setSelectedId(null), []);
  const selected = items.find((i) => i.appt.id === selectedId) ?? null;
  const total = minutesFrom(opens, closes);
  const hours: string[] = [];
  for (let m = 0; m < total; m += 60) {
    const h = Number(opens.split(":")[0]) + m / 60;
    hours.push(`${h < 10 ? "0" : ""}${h}:00`);
  }

  return (
    <>
      <div className="board" style={{ gridTemplateColumns: `4rem repeat(${clinicians.length}, minmax(9rem, 1fr))` }}>
        <div className="board-corner" />
        {clinicians.map((c) => (
          <div key={c.id} className="board-col-head" style={{ borderColor: c.color }}>{c.name}</div>
        ))}
        <div className="board-hours" style={{ height: `${total * 1.2}px` }}>
          {hours.map((h) => (
            <div key={h} className="board-hour" style={{ top: `${minutesFrom(opens, h) * 1.2}px` }}>{formatTime(h)}</div>
          ))}
        </div>
        {clinicians.map((c) => (
          <div key={c.id} className="board-col" style={{ height: `${total * 1.2}px` }}>
            {items
              .filter((i) => i.appt.clinicianId === c.id)
              .map((i) => {
                const status = clinic.apptStatus[i.appt.id] ?? i.appt.status;
                return (
                  <button
                    key={i.appt.id}
                    type="button"
                    className={`appt-block status-${status}`}
                    style={{
                      top: `${minutesFrom(opens, i.appt.start) * 1.2}px`,
                      height: `${Math.max(i.appt.minutes * 1.2, 26)}px`,
                      borderLeftColor: c.color,
                    }}
                    onClick={() => setSelectedId(i.appt.id)}
                  >
                    <span className="appt-time">{formatTime(i.appt.start)}</span>
                    <span className="appt-name">{i.patient.firstName} {i.patient.lastName}</span>
                    <span className="appt-meta">{i.roomName} · {APPT_STATUS_LABEL[status]}</span>
                  </button>
                );
              })}
          </div>
        ))}
      </div>

      {selected && (
        <Drawer title="Appointment" onClose={close}>
          <PatientSummary patient={selected.patient} />
          <dl className="fields">
            <div className="field">
              <dt>When</dt>
              <dd>{formatTime(selected.appt.start)}–{formatTime(endTime(selected.appt.start, selected.appt.minutes))}</dd>
            </div>
            <Field label="Room">{selected.roomName}</Field>
            <Field label="Reason">{selected.appt.reason}</Field>
            <Field label="Status">{APPT_STATUS_LABEL[clinic.apptStatus[selected.appt.id] ?? selected.appt.status]}</Field>
            <Field label="Intake">{INTAKE_STATUS_LABEL[clinic.intakeStatus[selected.patient.id] ?? selected.intake]}</Field>
            <Field label="Insurance">{ELIGIBILITY_LABEL[clinic.eligibility[selected.patient.id] ?? selected.eligibility]}</Field>
          </dl>
          {(() => {
            const status = clinic.apptStatus[selected.appt.id] ?? selected.appt.status;
            const next = NEXT_STATUS[status];
            return (
              next && (
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    clinic.setApptStatus(selected.appt.id, next.to);
                    clinic.notify(`${selected.patient.firstName}: ${APPT_STATUS_LABEL[next.to]}`);
                  }}
                >
                  {next.label}
                </button>
              )
            );
          })()}
          <ul className="link-list">
            <li><Link href={`/schedule/appointments/${selected.appt.id}`}>Open appointment</Link></li>
            <li><Link href={`/patients/${selected.patient.id}`}>Patient details</Link></li>
            <li><Link href={`/intake/${selected.patient.id}`}>Intake form</Link></li>
            <li><Link href={`/insurance/${selected.patient.id}`}>Insurance</Link></li>
            {role === "clinician" && (
              <li><Link href={`/notes/${selected.patient.id}`}>Visit notes</Link></li>
            )}
          </ul>
        </Drawer>
      )}
    </>
  );
}
