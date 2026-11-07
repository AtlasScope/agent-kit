"use client";

import Link from "next/link";
import { formatDate } from "@/lib/dates";
import type { WaitlistEntry } from "@/lib/types";
import { useClinic } from "./ClinicStore";

export function WaitlistTable({
  entries,
  names,
  clinicianNames,
}: {
  entries: WaitlistEntry[];
  names: Record<string, string>;
  clinicianNames: Record<string, string>;
}) {
  const clinic = useClinic();
  const rank = { urgent: 0, soon: 1, routine: 2 } as const;
  const sorted = [...entries].sort((a, b) => rank[a.priority] - rank[b.priority] || a.addedOn.localeCompare(b.addedOn));

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Patient</th>
          <th>Wants</th>
          <th className="hide-sm">Clinician</th>
          <th>Priority</th>
          <th className="hide-sm">Added</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {sorted.map((e) => (
          <tr key={e.id}>
            <td><Link href={`/patients/${e.patientId}`}>{names[e.patientId]}</Link></td>
            <td>{e.wants}</td>
            <td className="hide-sm">{e.clinicianId ? clinicianNames[e.clinicianId] : "Anyone"}</td>
            <td><span className={`pill ${e.priority === "urgent" ? "bad" : e.priority === "soon" ? "warn" : "neutral"}`}>{e.priority}</span></td>
            <td className="hide-sm">{formatDate(e.addedOn)}</td>
            <td>
              {clinic.offered[e.id] ? (
                <span className="muted">Offered</span>
              ) : (
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    clinic.offerSlot(e.id);
                    clinic.notify(`Slot offered to ${names[e.patientId]}`);
                  }}
                >
                  Offer next slot
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
