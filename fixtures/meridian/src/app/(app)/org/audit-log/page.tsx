import { members, workspaces } from "@/lib/data";
import { Card } from "@/components/ui";

const actions = [
  "changed workspace settings",
  "invited a member",
  "approved an invoice",
  "edited an alert rule",
  "revoked an API token",
  "changed a member role",
  "connected an integration",
];

export default function AuditLog() {
  const rows = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    who: members[i % members.length].name,
    what: actions[i % actions.length],
    where: workspaces[i % workspaces.length].name,
    when: `Nov ${6 - Math.floor(i / 5)}, ${String(17 - (i % 9)).padStart(2, "0")}:${String((i * 13) % 60).padStart(2, "0")}`,
  }));
  return (
    <Card title="Audit log" pad={false}>
      <table className="table">
        <thead>
          <tr>
            <th>When</th>
            <th>Who</th>
            <th>What</th>
            <th className="hide-sm">Where</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="mono">{r.when}</td>
              <td>{r.who}</td>
              <td>{r.what}</td>
              <td className="hide-sm">{r.where}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
