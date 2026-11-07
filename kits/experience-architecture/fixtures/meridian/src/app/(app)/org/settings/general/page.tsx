"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { useToast } from "@/components/Toast";

export default function OrgGeneral() {
  const toast = useToast();
  const [name, setName] = useState("Meridian Demo Holdings");
  const [domain, setDomain] = useState("meridian-demo.example");
  const [retention, setRetention] = useState("24");
  return (
    <Card title="Organization">
      <div className="grid grid-3">
        <div className="field">
          <label>Legal name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Verified email domain</label>
          <input className="input" value={domain} onChange={(e) => setDomain(e.target.value)} />
        </div>
        <div className="field">
          <label>Keep shipment history (months)</label>
          <select className="select" value={retention} onChange={(e) => setRetention(e.target.value)}>
            <option value="12">12</option>
            <option value="24">24</option>
            <option value="60">60</option>
          </select>
        </div>
      </div>
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn btn-primary" onClick={() => toast("Organization settings saved")}>
          Save
        </button>
      </div>
    </Card>
  );
}
