"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Clinician, Patient } from "@/lib/types";
import { useClinic } from "./ClinicStore";

const EMPTY: Omit<Patient, "id" | "mrn"> = {
  firstName: "",
  lastName: "",
  dob: "",
  phone: "",
  email: "",
  address: "",
  preferredClinicianId: "",
  language: "English",
  flags: [],
  emergencyContact: { name: "", relation: "", phone: "" },
};

export function PatientForm({ patient, clinicians }: { patient?: Patient; clinicians: Clinician[] }) {
  const router = useRouter();
  const clinic = useClinic();
  const start = patient ? { ...patient, ...clinic.patientEdits[patient.id] } : EMPTY;
  const [form, setForm] = useState(start);
  const set = (key: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (patient) {
      clinic.editPatient(patient.id, form);
      clinic.notify("Patient details saved");
      router.push(`/patients/${patient.id}`);
    } else {
      const id = `p-${900 + clinic.addedPatients.length}`;
      clinic.addPatient({ ...(form as Patient), id, mrn: `KF-NEW-${clinic.addedPatients.length + 1}` });
      clinic.notify(`${form.firstName} ${form.lastName} added`);
      router.push("/patients");
    }
  }

  return (
    <form className="card form" onSubmit={submit}>
      <div className="grid-2">
        <label className="label">
          First name
          <input className="input" value={form.firstName} onChange={set("firstName")} required />
        </label>
        <label className="label">
          Last name
          <input className="input" value={form.lastName} onChange={set("lastName")} required />
        </label>
        <label className="label">
          Date of birth
          <input className="input" type="date" value={form.dob} onChange={set("dob")} required />
        </label>
        <label className="label">
          Preferred language
          <input className="input" value={form.language} onChange={set("language")} />
        </label>
        <label className="label">
          Phone
          <input className="input" type="tel" value={form.phone} onChange={set("phone")} />
        </label>
        <label className="label">
          Email
          <input className="input" type="email" value={form.email} onChange={set("email")} />
        </label>
        <label className="label wide">
          Address
          <input className="input" value={form.address} onChange={set("address")} />
        </label>
        <label className="label">
          Usual clinician
          <select className="input" value={form.preferredClinicianId} onChange={set("preferredClinicianId")}>
            <option value="">No preference</option>
            {clinicians.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="btn-row">
        <button type="submit" className="btn primary">{patient ? "Save changes" : "Add patient"}</button>
        <button type="button" className="btn ghost" onClick={() => router.back()}>
          Cancel
        </button>
      </div>
    </form>
  );
}
