"use client";

import { useState } from "react";
import { useDraft } from "@/components/DraftProvider";
import { Card } from "@/components/ui";
import { shortDate } from "@/lib/format";

interface Note {
  by: string;
  at: string;
  text: string;
}

export function ShipmentNotes({ shipmentId, seed }: { shipmentId: string; seed: Note[] }) {
  const [notes, setNotes] = useState<Note[]>(seed);
  const [draft, setDraft, clearDraft] = useDraft("shipment-note");

  return (
    <Card title="Notes">
      <div className="stack">
        {notes.map((n, i) => (
          <div key={i} className="note">
            <div className="small muted">
              {n.by} · {shortDate(n.at)}
            </div>
            {n.text}
          </div>
        ))}
        <div className="field">
          <label htmlFor="note">Add a note to {shipmentId}</label>
          <textarea
            id="note"
            className="textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Visible to everyone in this workspace. Use @name to mention."
          />
        </div>
        <div className="row">
          <button
            className="btn btn-primary"
            disabled={!draft.trim()}
            onClick={() => {
              setNotes((all) => [...all, { by: "Dana Ruiz", at: "2026-11-06", text: draft.trim() }]);
              clearDraft();
            }}
          >
            Post note
          </button>
          {draft ? <span className="small muted">Draft kept while you move between tabs</span> : null}
        </div>
      </div>
    </Card>
  );
}
