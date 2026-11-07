import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { ThreadView } from "@/components/ThreadView";
import { findPatient, fullName, threads } from "@/lib/data";
import { getUserName } from "@/lib/session";

export const metadata: Metadata = { title: "Message" };

export default async function ThreadPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const thread = threads.find((t) => t.id === threadId);
  if (!thread) notFound();
  const pt = thread.patientId ? findPatient(thread.patientId) : undefined;
  const me = await getUserName();

  return (
    <div>
      <PageHeader
        title={thread.subject}
        subtitle={pt ? <Link href={`/patients/${pt.id}`}>{fullName(pt)}</Link> : "Internal"}
        back={{ href: "/messages", label: "Messages" }}
      />
      <ThreadView threadId={thread.id} messages={thread.messages} me={me} />
    </div>
  );
}
