import { notFound } from "next/navigation";
import Link from "next/link";
import { members, workspaces } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { Card, KV } from "@/components/ui";
import { MemberAccess } from "./MemberAccess";

export default async function MemberDetail({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = await params;
  const m = members.find((x) => x.id === memberId);
  if (!m) notFound();
  return (
    <div className="stack">
      <Link href="/org/members" className="small">
        ← All members
      </Link>
      <Card title={m.name}>
        <KV
          rows={[
            ["Email", m.email],
            ["Organization role", m.role],
            ["Last active", shortDate(m.lastActive)],
          ]}
        />
      </Card>
      <MemberAccess member={m} all={workspaces} />
    </div>
  );
}
