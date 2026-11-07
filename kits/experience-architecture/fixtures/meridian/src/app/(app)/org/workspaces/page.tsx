import Link from "next/link";
import { members, shipmentsFor, workspaces } from "@/lib/data";
import { Card, Badge } from "@/components/ui";

export default function OrgWorkspaces() {
  return (
    <Card title="Workspaces" pad={false}>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Region</th>
            <th>Plan</th>
            <th>Members</th>
            <th>Shipments</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {workspaces.map((w) => (
            <tr key={w.slug}>
              <td>
                <strong>{w.name}</strong>
                <div className="small muted mono">/w/{w.slug}</div>
              </td>
              <td>{w.region}</td>
              <td>
                <Badge tone={w.plan === "Enterprise" ? "info" : "neutral"}>{w.plan}</Badge>
              </td>
              <td>{members.filter((m) => m.workspaces.includes(w.slug)).length}</td>
              <td>{shipmentsFor(w.slug).length}</td>
              <td>
                <Link href={`/w/${w.slug}/settings/general`}>Workspace settings</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
