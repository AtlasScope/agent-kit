"use client";

import { useState } from "react";
import { useDraft } from "@/components/DraftProvider";
import { Card, StatusBadge } from "@/components/ui";
import { useToast } from "@/components/Toast";
import type { ShipmentException } from "@/lib/data";

const owners = ["Dana Ruiz", "Marcus Lee", "Priya Natarajan", "Tom Becker", "Aisha Grant", "Unassigned"];

export function ExceptionWorkbench({
  exceptionId,
  initialStatus,
  initialOwner,
}: {
  exceptionId: string;
  initialStatus: ShipmentException["status"];
  initialOwner: string;
}) {
  const toast = useToast();
  const [status, setStatus] = useState(initialStatus);
  const [owner, setOwner] = useState(initialOwner);
  const [log, setLog] = useState<string[]>([]);
  const [draft, setDraft, clearDraft] = useDraft(`exception-note:${exceptionId}`);

  return (
    <Card title="Work this exception">
      <div className="stack">
        <div className="row">
          Current status <StatusBadge status={status} />
        </div>
        <div className="field" style={{ maxWidth: 260 }}>
          <label>Owner</label>
          <select
            className="select"
            value={owner}
            onChange={(e) => {
              setOwner(e.target.value);
              toast(`Assigned to ${e.target.value}`);
            }}
          >
            {owners.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Resolution note</label>
          <textarea className="textarea" value={draft} onChange={(e) => setDraft(e.target.value)} />
        </div>
        <div className="row">
          <button
            className="btn"
            onClick={() => {
              setStatus("investigating");
              toast("Marked as investigating");
            }}
          >
            Investigating
          </button>
          <button
            className="btn btn-primary"
            disabled={!draft.trim()}
            onClick={() => {
              setStatus("resolved");
              setLog((l) => [...l, draft.trim()]);
              clearDraft();
              toast(`${exceptionId} resolved`);
            }}
          >
            Resolve
          </button>
        </div>
        {log.map((l, i) => (
          <div key={i} className="note">
            {l}
          </div>
        ))}
      </div>
    </Card>
  );
}
