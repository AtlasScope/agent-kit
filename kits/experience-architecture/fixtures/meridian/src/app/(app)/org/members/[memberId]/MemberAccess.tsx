"use client";

import { useState } from "react";
import type { Member, Workspace } from "@/lib/data";
import { Card } from "@/components/ui";
import { useToast } from "@/components/Toast";

export function MemberAccess({ member, all }: { member: Member; all: Workspace[] }) {
  const toast = useToast();
  const [access, setAccess] = useState<string[]>(member.workspaces);
  return (
    <Card title="Workspace access">
      <div className="stack">
        {all.map((w) => (
          <label key={w.slug} className="row">
            <input
              type="checkbox"
              checked={access.includes(w.slug)}
              onChange={(e) => setAccess((a) => (e.target.checked ? [...a, w.slug] : a.filter((x) => x !== w.slug)))}
            />
            {w.name}
          </label>
        ))}
      </div>
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn btn-primary" onClick={() => toast(`Access updated for ${member.name}`)}>
          Save access
        </button>
      </div>
    </Card>
  );
}
