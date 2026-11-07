"use client";

import { formatDate, isoDate } from "@/lib/dates";
import { ELIGIBILITY_LABEL } from "@/lib/labels";
import type { Coverage, Payer } from "@/lib/types";
import { useClinic } from "./ClinicStore";
import { Pill, Field } from "./ui";

function money(n: number) {
  return n ? `$${n}` : "None";
}

export function CoverageCard({ coverage, payer }: { coverage?: Coverage; payer?: Payer }) {
  const clinic = useClinic();
  if (!coverage) return <p className="empty">No coverage on file.</p>;
  const eligibility = clinic.eligibility[coverage.patientId] ?? coverage.eligibility;
  const checked = clinic.eligibility[coverage.patientId] ? isoDate(new Date()) : coverage.checkedAt;

  return (
    <div className="card">
      <div className="card-head">
        <h2>{payer?.name ?? "Self-pay"}</h2>
        <Pill value={eligibility} label={ELIGIBILITY_LABEL[eligibility]} />
      </div>
      <dl className="fields">
        <Field label="Member ID">
          <span className="mono">{coverage.memberId || "—"}</span>
        </Field>
        <Field label="Group">
          <span className="mono">{coverage.groupNumber || "—"}</span>
        </Field>
        <Field label="Subscriber">{coverage.subscriber}</Field>
        <Field label="Copay">{money(coverage.copay)}</Field>
        <Field label="Last checked">{checked ? formatDate(checked) : "Never"}</Field>
        {payer && <Field label="Payer line">{payer.phone}</Field>}
      </dl>
      {payer && (
        <div className="btn-row">
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              clinic.setEligibility(coverage.patientId, "verified");
              clinic.notify("Eligibility verified");
            }}
          >
            Run eligibility check
          </button>
        </div>
      )}
    </div>
  );
}
