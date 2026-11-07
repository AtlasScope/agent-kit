"use client";

import Link from "next/link";
import { useState } from "react";
import type { Invoice } from "@/lib/data";
import { money, shortDate } from "@/lib/format";
import { Card, KV, StatusBadge } from "@/components/ui";
import { useToast } from "@/components/Toast";

type Tab = "summary" | "lines" | "disputes" | "history";

const TABS: { key: Tab; label: string }[] = [
  { key: "summary", label: "Summary" },
  { key: "lines", label: "Line items" },
  { key: "disputes", label: "Disputes" },
  { key: "history", label: "History" },
];

export function InvoiceTabs({
  workspace,
  invoice,
  lines,
}: {
  workspace: string;
  invoice: Invoice;
  lines: { shipmentId: string; label: string; amount: number }[];
}) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("summary");
  const [status, setStatus] = useState(invoice.status);
  const [reason, setReason] = useState("");
  const [disputes, setDisputes] = useState<string[]>(invoice.status === "disputed" ? ["Detention billed without driver check-in time."] : []);
  const billed = lines.reduce((a, l) => a + l.amount, 0);

  return (
    <>
      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} className={`tab${tab === t.key ? " active" : ""}`} onClick={() => setTab(t.key)}>
            {t.label}
            {t.key === "disputes" && disputes.length ? ` (${disputes.length})` : ""}
          </button>
        ))}
      </div>
      {tab === "summary" ? (
        <div className="grid grid-2">
          <Card title="Match">
            <KV
              rows={[
                ["Invoice total", money(invoice.amountUsd)],
                ["Rated charges", money(billed)],
                ["Variance", money(invoice.amountUsd - billed)],
                ["Status", <StatusBadge key="s" status={status} />],
              ]}
            />
            <div className="row" style={{ marginTop: 14 }}>
              <button
                className="btn btn-primary"
                disabled={status === "approved" || status === "paid"}
                onClick={() => {
                  setStatus("approved");
                  toast(`${invoice.id} approved`);
                }}
              >
                Approve
              </button>
              <button className="btn" onClick={() => setTab("disputes")}>
                Dispute
              </button>
            </div>
          </Card>
          <Card title="Shipments" pad={false}>
            <table className="table">
              <tbody>
                {invoice.shipmentIds.map((id) => (
                  <tr key={id}>
                    <td>
                      <Link href={`/w/${workspace}/shipments/${id}/charges`}>{id}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      ) : null}
      {tab === "lines" ? (
        <Card title="Line items" pad={false}>
          <table className="table">
            <thead>
              <tr>
                <th>Shipment</th>
                <th>Charge</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i}>
                  <td className="mono">{l.shipmentId}</td>
                  <td>{l.label}</td>
                  <td style={{ textAlign: "right" }}>{money(l.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}
      {tab === "disputes" ? (
        <Card title="Disputes">
          <div className="stack">
            {disputes.length === 0 ? <p className="muted">No disputes raised.</p> : disputes.map((d, i) => <div key={i} className="note">{d}</div>)}
            <div className="field">
              <label>Reason</label>
              <textarea className="textarea" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div>
              <button
                className="btn btn-danger"
                disabled={!reason.trim()}
                onClick={() => {
                  setDisputes((d) => [...d, reason.trim()]);
                  setReason("");
                  setStatus("disputed");
                  toast("Dispute sent to carrier (demo)");
                }}
              >
                Raise dispute
              </button>
            </div>
          </div>
        </Card>
      ) : null}
      {tab === "history" ? (
        <Card title="History">
          <ul className="timeline">
            <li>
              <span className="muted">{shortDate(invoice.issuedAt)}</span>
              <span>Received from carrier via EDI 210</span>
            </li>
            <li>
              <span className="muted">{shortDate(invoice.issuedAt)}</span>
              <span>Auto-matched to {invoice.shipmentIds.length} shipment(s)</span>
            </li>
          </ul>
        </Card>
      ) : null}
    </>
  );
}
