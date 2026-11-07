"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ageFrom, formatDate } from "@/lib/dates";
import { tone } from "@/lib/labels";
import type { Patient } from "@/lib/types";
import { useClinic } from "./ClinicStore";

export interface ListColumn {
  header: string;
  values: Record<string, { label: string; value: string }>;
}

export interface FilterOption {
  value: string;
  label: string;
}

export function PatientListTable({
  patients,
  hrefBase,
  column,
  filterOptions,
  clinicianNames,
  emptyLabel = "No patients match.",
}: {
  patients: Patient[];
  hrefBase: string;
  column?: ListColumn;
  filterOptions?: FilterOption[];
  clinicianNames: Record<string, string>;
  emptyLabel?: string;
}) {
  const { addedPatients, patientEdits } = useClinic();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [clinician, setClinician] = useState("all");

  const rows = useMemo(() => {
    const merged = [...patients, ...(hrefBase === "/patients" ? addedPatients : [])].map((pt) => ({
      ...pt,
      ...patientEdits[pt.id],
    }));
    const q = query.trim().toLowerCase();
    return merged
      .filter((pt) => {
        if (!q) return true;
        return (
          `${pt.firstName} ${pt.lastName}`.toLowerCase().includes(q) ||
          pt.mrn.toLowerCase().includes(q) ||
          pt.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "") || "~")
        );
      })
      .filter((pt) => filter === "all" || column?.values[pt.id]?.value === filter)
      .filter((pt) => clinician === "all" || pt.preferredClinicianId === clinician)
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
  }, [patients, addedPatients, patientEdits, hrefBase, query, filter, clinician, column]);

  return (
    <div>
      <div className="toolbar">
        <input
          type="search"
          className="input"
          placeholder="Search name, MRN or phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search patients"
        />
        {filterOptions && (
          <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label={`Filter by ${column?.header ?? "status"}`}>
            <option value="all">All statuses</option>
            {filterOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}
        <select className="input" value={clinician} onChange={(e) => setClinician(e.target.value)} aria-label="Filter by clinician">
          <option value="all">Any clinician</option>
          {Object.entries(clinicianNames).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>
        <span className="muted">{rows.length} shown</span>
      </div>
      {rows.length === 0 ? (
        <p className="empty">{emptyLabel}</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>MRN</th>
              <th>DOB</th>
              <th className="hide-sm">Clinician</th>
              {column && <th>{column.header}</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((pt) => {
              const extra = column?.values[pt.id];
              return (
                <tr key={pt.id}>
                  <td>
                    <Link href={`${hrefBase}/${pt.id}`} className="row-link">{pt.lastName}, {pt.firstName}</Link>
                    {pt.flags.map((f) => (
                      <span key={f} className="flag">{f}</span>
                    ))}
                  </td>
                  <td className="mono">{pt.mrn}</td>
                  <td>{formatDate(pt.dob, { weekday: undefined, year: "numeric" })} <span className="muted">({ageFrom(pt.dob)})</span></td>
                  <td className="hide-sm">{clinicianNames[pt.preferredClinicianId] ?? "—"}</td>
                  {column && <td>{extra ? <span className={`pill ${tone(extra.value)}`}>{extra.label}</span> : "—"}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
