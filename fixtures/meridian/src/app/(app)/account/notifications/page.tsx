"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { SaveBar } from "../SaveBar";

const digestOptions = ["Off", "Daily at 07:00", "Daily at 17:00", "Weekly on Monday"];

export default function AccountNotificationsPage() {
  const [digest, setDigest] = useState(digestOptions[1]);
  const [mentions, setMentions] = useState(true);
  const [assigned, setAssigned] = useState(true);
  const [invoiceApprovals, setInvoiceApprovals] = useState(false);
  return (
    <div className="stack">
      <Card title="Email">
        <div className="stack">
          <div className="field" style={{ maxWidth: 320 }}>
            <label>Shipment digest</label>
            <select className="select" value={digest} onChange={(e) => setDigest(e.target.value)}>
              {digestOptions.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <label className="row">
            <input type="checkbox" checked={mentions} onChange={(e) => setMentions(e.target.checked)} /> Someone mentions me in a shipment note
          </label>
          <label className="row">
            <input type="checkbox" checked={assigned} onChange={(e) => setAssigned(e.target.checked)} /> An exception is assigned to me
          </label>
          <label className="row">
            <input type="checkbox" checked={invoiceApprovals} onChange={(e) => setInvoiceApprovals(e.target.checked)} /> An invoice is waiting for my approval
          </label>
        </div>
        <SaveBar message="Email preferences saved" />
      </Card>
      <Card title="In-app">
        <p className="muted">Inbox alerts are always on. Exception alert rules for each workspace are managed by workspace admins.</p>
      </Card>
    </div>
  );
}
