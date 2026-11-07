"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { useToast } from "@/components/Toast";

interface Channel {
  id: string;
  kind: "SMS" | "Webhook" | "Slack";
  target: string;
  events: string[];
  enabled: boolean;
}

const allEvents = ["Exception opened", "Exception escalated", "Shipment delivered", "Invoice disputed"];

export default function OrgNotificationChannels() {
  const toast = useToast();
  const [channels, setChannels] = useState<Channel[]>([
    { id: "ch1", kind: "SMS", target: "+1 312 555 0199 (on-call dispatcher)", events: ["Exception escalated"], enabled: true },
    { id: "ch2", kind: "Webhook", target: "https://tms.meridian-demo.example/hooks/exceptions", events: ["Exception opened", "Exception escalated"], enabled: true },
    { id: "ch3", kind: "Slack", target: "#freight-finance", events: ["Invoice disputed"], enabled: false },
  ]);
  const toggle = (id: string, ev: string) =>
    setChannels((all) =>
      all.map((c) => (c.id === id ? { ...c, events: c.events.includes(ev) ? c.events.filter((x) => x !== ev) : [...c.events, ev] } : c)),
    );
  return (
    <Card title="Notification channels" pad={false}>
      <p className="muted small" style={{ padding: "12px 16px 0" }}>
        Channels deliver alerts outside Meridian. They apply to every workspace in the organization.
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>Channel</th>
            <th>Events</th>
            <th>Enabled</th>
          </tr>
        </thead>
        <tbody>
          {channels.map((c) => (
            <tr key={c.id}>
              <td>
                <strong>{c.kind}</strong>
                <div className="small muted">{c.target}</div>
              </td>
              <td>
                <div className="stack" style={{ gap: 4 }}>
                  {allEvents.map((ev) => (
                    <label key={ev} className="row small">
                      <input type="checkbox" checked={c.events.includes(ev)} onChange={() => toggle(c.id, ev)} /> {ev}
                    </label>
                  ))}
                </div>
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={c.enabled}
                  onChange={(e) => setChannels((all) => all.map((x) => (x.id === c.id ? { ...x, enabled: e.target.checked } : x)))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row" style={{ padding: 16 }}>
        <button className="btn btn-primary" onClick={() => toast("Channels saved")}>
          Save channels
        </button>
      </div>
    </Card>
  );
}
