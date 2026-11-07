import type { Metadata } from "next";
import { InboxList } from "./InboxList";
import { PageHeader } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = { title: "Inbox" };

export default function InboxPage() {
  return (
    <div className="content">
      <Breadcrumbs />
      <PageHeader title="Inbox" subtitle="Exception alerts and mentions from every workspace you belong to." />
      <InboxList />
    </div>
  );
}
