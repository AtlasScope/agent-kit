"use client";

import { useState } from "react";
import { Card, Badge } from "@/components/ui";
import { useToast } from "@/components/Toast";

export default function OrgSso() {
  const toast = useToast();
  const [enforced, setEnforced] = useState(false);
  const [provider, setProvider] = useState("Okta");
  return (
    <Card title="Single sign-on">
      <div className="stack">
        <div className="row">
          Status: <Badge tone="warn">Configured, not enforced</Badge>
        </div>
        <div className="field" style={{ maxWidth: 280 }}>
          <label>Identity provider</label>
          <select className="select" value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option>Okta</option>
            <option>Microsoft Entra ID</option>
            <option>Google Workspace</option>
          </select>
        </div>
        <label className="row">
          <input type="checkbox" checked={enforced} onChange={(e) => setEnforced(e.target.checked)} /> Require single sign-on for all members
        </label>
        <div>
          <button className="btn btn-primary" onClick={() => toast("SSO settings saved (demo)")}>
            Save
          </button>
        </div>
      </div>
    </Card>
  );
}
