"use client";

import { useState } from "react";
import { Card, Badge } from "@/components/ui";
import { useToast } from "@/components/Toast";

interface Rule {
  id: string;
  when: string;
  threshold: string;
  notify: string;
  on: boolean;
}

export default function AlertRules() {
  const toast = useToast();
  const [rules, setRules] = useState<Rule[]>([
    { id: "r1", when: "Shipment ETA slips", threshold: "more than 4 hours", notify: "Shipment owner", on: true },
    { id: "r2", when: "Exception opened", threshold: "severity high", notify: "On-call dispatcher", on: true },
    { id: "r3", when: "No tracking update", threshold: "for 12 hours", notify: "Workspace admins", on: true },
    { id: "r4", when: "Invoice variance", threshold: "over 5%", notify: "Finance", on: false },
  ]);
  return (
    <Card title="Alert rules" pad={false}>
      <p className="muted small" style={{ padding: "12px 16px 0" }}>
        Rules decide when Meridian raises an alert in this workspace.
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>When</th>
            <th>Threshold</th>
            <th>Who is alerted</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id}>
              <td>{r.when}</td>
              <td>{r.threshold}</td>
              <td>
                <Badge>{r.notify}</Badge>
              </td>
              <td>
                <input type="checkbox" checked={r.on} onChange={(e) => setRules((all) => all.map((x) => (x.id === r.id ? { ...x, on: e.target.checked } : x)))} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row" style={{ padding: 16 }}>
        <button className="btn btn-primary" onClick={() => toast("Alert rules saved")}>
          Save rules
        </button>
      </div>
    </Card>
  );
}
