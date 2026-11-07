"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Carrier, Shipment } from "@/lib/data";
import { shortDate, STATUS_LABEL, kg } from "@/lib/format";
import { ShipmentStatusBadge } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";

const PAGE = 15;

export function ShipmentsTable({
  workspace,
  rows,
  carriers,
  initialStatus,
  initialCarrier,
  initialQuery,
}: {
  workspace: string;
  rows: Shipment[];
  carriers: Carrier[];
  initialStatus?: string;
  initialCarrier?: string;
  initialQuery?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState(initialStatus ?? "all");
  const [carrier, setCarrier] = useState(initialCarrier ?? "all");
  const [query, setQuery] = useState(initialQuery ?? "");
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<"pickup" | "eta">("pickup");
  const [assigning, setAssigning] = useState<Shipment | null>(null);
  const [assignTo, setAssignTo] = useState("");
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  const carrierName = (id: string) => carriers.find((c) => c.id === id)?.name ?? id;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .map((r) => (overrides[r.id] ? { ...r, carrierId: overrides[r.id] } : r))
      .filter((r) => status === "all" || r.status === status)
      .filter((r) => carrier === "all" || r.carrierId === carrier)
      .filter((r) => !q || [r.id, r.reference, r.customer, r.origin, r.destination].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => (sort === "pickup" ? b.pickupDate.localeCompare(a.pickupDate) : a.etaDate.localeCompare(b.etaDate)));
  }, [rows, status, carrier, query, sort, overrides]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const visible = filtered.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <section className="card">
      <div className="filters">
        <input
          className="input"
          placeholder="Search ID, PO, customer or city"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          style={{ minWidth: 240 }}
        />
        <select
          className="select"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
          aria-label="Status"
        >
          <option value="all">Any status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          className="select"
          value={carrier}
          onChange={(e) => {
            setCarrier(e.target.value);
            setPage(0);
          }}
          aria-label="Carrier"
        >
          <option value="all">Any carrier</option>
          {carriers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select className="select" value={sort} onChange={(e) => setSort(e.target.value as "pickup" | "eta")} aria-label="Sort">
          <option value="pickup">Newest pickup</option>
          <option value="eta">Soonest ETA</option>
        </select>
        <span className="muted small" style={{ alignSelf: "center" }}>
          {filtered.length} shipments
        </span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Shipment</th>
              <th className="hide-sm">Lane</th>
              <th className="hide-sm">Carrier</th>
              <th>Status</th>
              <th className="hide-sm">Pickup</th>
              <th>ETA</th>
              <th className="hide-sm">Weight</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map((s) => (
              <tr key={s.id} className="clickable" onClick={() => router.push(`/w/${workspace}/shipments/${s.id}`)}>
                <td>
                  <strong>{s.id}</strong>
                  <div className="small muted">
                    {s.reference} · {s.customer}
                  </div>
                </td>
                <td className="hide-sm">
                  {s.origin} → {s.destination}
                </td>
                <td className="hide-sm">{carrierName(s.carrierId)}</td>
                <td>
                  <ShipmentStatusBadge status={s.status} />
                </td>
                <td className="hide-sm">{shortDate(s.pickupDate)}</td>
                <td>{shortDate(s.etaDate)}</td>
                <td className="hide-sm">{kg(s.weightKg)}</td>
                <td>
                  <button
                    className="btn btn-ghost small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAssigning(s);
                      setAssignTo(s.carrierId);
                    }}
                  >
                    Assign
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="row" style={{ padding: 12, justifyContent: "space-between" }}>
        <span className="muted small">
          Page {page + 1} of {pages}
        </span>
        <div className="pager">
          <button className="btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <button className="btn" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      </div>
      {assigning ? (
        <Modal
          title={`Assign carrier · ${assigning.id}`}
          onClose={() => setAssigning(null)}
          footer={
            <>
              <button className="btn" onClick={() => setAssigning(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setOverrides((o) => ({ ...o, [assigning.id]: assignTo }));
                  toast(`${assigning.id} tendered to ${carrierName(assignTo)}`);
                  setAssigning(null);
                }}
              >
                Tender load
              </button>
            </>
          }
        >
          <div className="stack">
            <p className="muted small">
              {assigning.origin} → {assigning.destination} · {kg(assigning.weightKg)} · {assigning.pieces} pieces
            </p>
            <div className="field">
              <label>Carrier</label>
              <select className="select" value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
                {carriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.onTimePct}% on time
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
