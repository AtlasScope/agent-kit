"use client";

import { useState } from "react";
import { Badge, Card } from "@/components/ui";
import { useToast } from "@/components/Toast";

const initial = [
  { id: "edi", name: "EDI 204/214/210 (via SPS gateway)", status: "Connected", detail: "Tenders, status updates and invoices" },
  { id: "p44", name: "Carrier tracking API", status: "Connected", detail: "Real-time location pings for FTL loads" },
  { id: "erp", name: "ERP purchase orders", status: "Not connected", detail: "Import POs as draft shipments" },
  { id: "hook", name: "Outbound webhooks", status: "Connected", detail: "Shipment and exception events to your TMS" },
];

export default function Integrations() {
  const toast = useToast();
  const [items, setItems] = useState(initial);
  return (
    <Card title="Integrations" pad={false}>
      <table className="table">
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>
                <strong>{i.name}</strong>
                <div className="small muted">{i.detail}</div>
              </td>
              <td>
                <Badge tone={i.status === "Connected" ? "good" : "neutral"}>{i.status}</Badge>
              </td>
              <td>
                <button
                  className="btn"
                  onClick={() => {
                    setItems((all) => all.map((x) => (x.id === i.id ? { ...x, status: x.status === "Connected" ? "Not connected" : "Connected" } : x)));
                    toast(i.status === "Connected" ? `${i.name} disconnected (demo)` : `${i.name} connected (demo)`);
                  }}
                >
                  {i.status === "Connected" ? "Disconnect" : "Connect"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
