"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { addDays, endTime, formatDate, formatTime, slotsBetween } from "@/lib/dates";
import type { Appointment, Clinician, Patient } from "@/lib/types";
import { useClinic } from "./ClinicStore";

export function SlotPicker({
  mode,
  startDate,
  clinicians,
  patients,
  booked,
  initialClinicianId,
  initialPatientId,
  minutes = 20,
  returnTo,
  opens,
  closes,
}: {
  mode: "new" | "reschedule";
  startDate: string;
  clinicians: Clinician[];
  patients: Patient[];
  booked: Appointment[];
  initialClinicianId?: string;
  initialPatientId?: string;
  minutes?: number;
  returnTo: string;
  opens: string;
  closes: string;
}) {
  const router = useRouter();
  const clinic = useClinic();
  const [clinicianId, setClinicianId] = useState(initialClinicianId ?? clinicians[0].id);
  const [patientId, setPatientId] = useState(initialPatientId ?? "");
  const [date, setDate] = useState(startDate);
  const [slot, setSlot] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const free = useMemo(() => {
    const taken = booked.filter((a) => a.clinicianId === clinicianId && a.date === date && a.status !== "cancelled");
    return slotsBetween(opens, closes).filter((s) => {
      const end = endTime(s, minutes);
      if (end > closes) return false;
      return !taken.some((a) => s < endTime(a.start, a.minutes) && end > a.start);
    });
  }, [booked, clinicianId, date, minutes, opens, closes]);

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!slot || (mode === "new" && !patientId)) return;
    clinic.notify(mode === "new" ? `Booked ${formatDate(date)} ${formatTime(slot)}` : `Moved to ${formatDate(date)} ${formatTime(slot)}`);
    router.push(returnTo);
  }

  return (
    <form className="card form" onSubmit={save}>
      {mode === "new" && (
        <label className="label">
          Patient
          <select className="input" value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
            <option value="">Choose a patient…</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{p.lastName}, {p.firstName} ({p.mrn})</option>
            ))}
          </select>
        </label>
      )}
      <label className="label">
        Clinician
        <select className="input" value={clinicianId} onChange={(e) => setClinicianId(e.target.value)}>
          {clinicians.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>
      <div className="label">
        Day
        <div className="btn-row">
          {Array.from({ length: 5 }, (_, i) => addDays(startDate, i)).map((d) => (
            <button key={d} type="button" className={d === date ? "chip active" : "chip"} onClick={() => setDate(d)}>
              {formatDate(d)}
            </button>
          ))}
        </div>
      </div>
      <div className="label">
        Time
        <div className="slot-grid">
          {free.map((s) => (
            <button key={s} type="button" className={s === slot ? "chip active" : "chip"} onClick={() => setSlot(s)}>
              {formatTime(s)}
            </button>
          ))}
          {free.length === 0 && <p className="empty">No free slots that day.</p>}
        </div>
      </div>
      {mode === "new" && (
        <label className="label">
          Reason
          <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Follow-up" />
        </label>
      )}
      <div className="btn-row">
        <button type="submit" className="btn primary" disabled={!slot}>{mode === "new" ? "Book appointment" : "Move appointment"}</button>
        <button type="button" className="btn ghost" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
    </form>
  );
}
