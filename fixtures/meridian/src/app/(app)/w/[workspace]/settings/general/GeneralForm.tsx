"use client";

import { useState } from "react";
import type { Workspace } from "@/lib/data";
import { Card } from "@/components/ui";
import { useToast } from "@/components/Toast";

const zones = ["America/Chicago", "America/New_York", "America/Los_Angeles", "America/Denver"];

export function GeneralForm({ initial }: { initial: Workspace }) {
  const toast = useToast();
  const [name, setName] = useState(initial.name);
  const [tz, setTz] = useState(initial.timezone);
  const [cutoff, setCutoff] = useState("15:00");
  const [autoTender, setAutoTender] = useState(true);
  return (
    <Card title="General">
      <div className="grid grid-3">
        <div className="field">
          <label>Workspace name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Time zone</label>
          <select className="select" value={tz} onChange={(e) => setTz(e.target.value)}>
            {zones.map((z) => (
              <option key={z}>{z}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Same-day tender cutoff</label>
          <input className="input" type="time" value={cutoff} onChange={(e) => setCutoff(e.target.value)} />
        </div>
      </div>
      <label className="row" style={{ marginTop: 14 }}>
        <input type="checkbox" checked={autoTender} onChange={(e) => setAutoTender(e.target.checked)} /> Tender to the next carrier automatically when a tender is rejected
      </label>
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn btn-primary" onClick={() => toast("Workspace settings saved")}>
          Save
        </button>
      </div>
    </Card>
  );
}
