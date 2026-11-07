import Link from "next/link";
import { members } from "@/lib/data";
import { Badge, Card } from "@/components/ui";

export default async function WorkspaceMembers({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const list = members.filter((m) => m.workspaces.includes(workspace as never));
  return (
    <Card title={`Members (${list.length})`} action={<Link href="/org/members">Manage in organization</Link>} pad={false}>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th className="hide-sm">Email</th>
          </tr>
        </thead>
        <tbody>
          {list.map((m) => (
            <tr key={m.id}>
              <td>{m.name}</td>
              <td>
                <Badge>{m.role}</Badge>
              </td>
              <td className="hide-sm">{m.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
