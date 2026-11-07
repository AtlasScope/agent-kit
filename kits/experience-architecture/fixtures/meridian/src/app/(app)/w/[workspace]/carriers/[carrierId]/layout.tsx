import { notFound } from "next/navigation";
import { getCarrier } from "@/lib/data";
import { Badge, PageHeader } from "@/components/ui";
import { RecordTabs } from "@/components/RecordTabs";

export default async function CarrierLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string; carrierId: string }>;
}) {
  const { workspace, carrierId } = await params;
  const c = getCarrier(carrierId);
  if (!c || !c.workspaces.includes(workspace as never)) notFound();
  return (
    <>
      <PageHeader
        title={c.name}
        subtitle={
          <>
            <span className="mono">{c.scac}</span> · {c.hq} · {c.contact}
          </>
        }
        actions={<Badge tone="info">{c.onTimePct}% on time</Badge>}
      />
      <RecordTabs
        base={`/w/${workspace}/carriers/${c.id}`}
        tabs={[
          { slug: "", label: "Profile" },
          { slug: "lanes", label: "Lanes" },
          { slug: "performance", label: "Performance" },
        ]}
      />
      {children}
    </>
  );
}
