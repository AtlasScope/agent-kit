"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";

export function LaneTargets({ lanes }: { lanes: string[] }) {
  const toast = useToast();
  const [targets, setTargets] = useState<Record<string, string>>(Object.fromEntries(lanes.map((l, i) => [l, String(2 + (i % 4))])));
  return (
    <>
      <table className="table">
        <thead>
          <tr>
            <th>Lane</th>
            <th>Target transit (days)</th>
          </tr>
        </thead>
        <tbody>
          {lanes.map((l) => (
            <tr key={l}>
              <td>{l}</td>
              <td>
                <input className="input" style={{ width: 90 }} value={targets[l]} onChange={(e) => setTargets((t) => ({ ...t, [l]: e.target.value }))} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn btn-primary" onClick={() => toast("Lane targets saved")}>
          Save targets
        </button>
      </div>
    </>
  );
}
