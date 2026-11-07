"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { useToast } from "@/components/Toast";

interface Token {
  id: string;
  label: string;
  created: string;
  lastUsed: string;
}

export default function ApiTokensPage() {
  const toast = useToast();
  const [tokens, setTokens] = useState<Token[]>([
    { id: "tok_1", label: "TMS sync (acme)", created: "Jun 02", lastUsed: "Today" },
    { id: "tok_2", label: "Spreadsheet export", created: "Sep 19", lastUsed: "Oct 30" },
  ]);
  const [label, setLabel] = useState("");
  return (
    <Card title="Personal API tokens">
      <p className="muted small" style={{ marginBottom: 12 }}>
        Tokens act as you. Workspace-wide integrations belong under each workspace&apos;s Integrations settings.
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>Label</th>
            <th>Created</th>
            <th>Last used</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {tokens.map((t) => (
            <tr key={t.id}>
              <td>{t.label}</td>
              <td>{t.created}</td>
              <td>{t.lastUsed}</td>
              <td>
                <button className="btn btn-danger" onClick={() => setTokens((all) => all.filter((x) => x.id !== t.id))}>
                  Revoke
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="row" style={{ marginTop: 14 }}>
        <input className="input" placeholder="Token label" value={label} onChange={(e) => setLabel(e.target.value)} />
        <button
          className="btn btn-primary"
          disabled={!label.trim()}
          onClick={() => {
            setTokens((all) => [...all, { id: `tok_${all.length + 3}`, label: label.trim(), created: "Today", lastUsed: "Never" }]);
            setLabel("");
            toast("Token created (demo)");
          }}
        >
          Create token
        </button>
      </div>
    </Card>
  );
}
