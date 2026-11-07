import Link from "next/link";
import { members, getWorkspace } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { Card, Badge } from "@/components/ui";

export default function OrgMembers() {
  return (
    <Card title={`Members (${members.length})`} pad={false}>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th className="hide-sm">Workspaces</th>
            <th className="hide-sm">Last active</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td>
                <Link href={`/org/members/${m.id}`}>{m.name}</Link>
                <div className="small muted">{m.email}</div>
              </td>
              <td>
                <Badge>{m.role}</Badge>
              </td>
              <td className="hide-sm">{m.workspaces.map((w) => getWorkspace(w)?.name).join(", ")}</td>
              <td className="hide-sm">{shortDate(m.lastActive)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
