import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { findPatient, fullName, threads } from "@/lib/data";

export const metadata: Metadata = { title: "Messages" };

export default function MessagesPage() {
  return (
    <div>
      <PageHeader title="Messages" subtitle="Patient and staff messages" />
      <ul className="thread-list">
        {threads.map((t) => {
          const last = t.messages[t.messages.length - 1];
          const pt = t.patientId ? findPatient(t.patientId) : undefined;
          return (
            <li key={t.id} className={t.unread ? "thread unread" : "thread"}>
              <Link href={`/messages/${t.id}`}>
                <div className="thread-subject">{t.subject}</div>
                <div className="muted">{pt ? fullName(pt) : "Internal"} · {t.assignedTo}</div>
                <div className="thread-preview">{last.body}</div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
