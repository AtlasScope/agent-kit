import Link from "next/link";
import { notFound } from "next/navigation";
import { getCarrier, getShipment, shipmentsFor } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { ShipmentStatusBadge } from "@/components/ui";
import { RecordTabs } from "@/components/RecordTabs";
import { ShareButton } from "@/components/ShareButton";

const TABS = [
  { slug: "", label: "Summary" },
  { slug: "tracking", label: "Tracking" },
  { slug: "documents", label: "Documents" },
  { slug: "charges", label: "Charges" },
  { slug: "activity", label: "Activity" },
];

export default async function ShipmentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string; id: string }>;
}) {
  const { workspace, id } = await params;
  const s = getShipment(workspace, id);
  if (!s) notFound();
  const list = shipmentsFor(workspace);
  const idx = list.findIndex((x) => x.id === s.id);
  const prev = list[idx - 1];
  const next = list[idx + 1];
  const base = `/w/${workspace}/shipments/${s.id}`;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="row">
            <h1>{s.id}</h1>
            <ShipmentStatusBadge status={s.status} />
          </div>
          <p className="page-sub">
            {s.customer} · {s.origin} → {s.destination} · {getCarrier(s.carrierId)?.name} · ETA {shortDate(s.etaDate)}
          </p>
        </div>
        <div className="actions">
          <ShareButton code={s.shareCode} />
          {prev ? (
            <Link className="btn" href={`/w/${workspace}/shipments/${prev.id}`} aria-label="Previous shipment">
              ← {prev.id}
            </Link>
          ) : null}
          {next ? (
            <Link className="btn" href={`/w/${workspace}/shipments/${next.id}`} aria-label="Next shipment">
              {next.id} →
            </Link>
          ) : null}
        </div>
      </div>
      <RecordTabs base={base} tabs={TABS} />
      {children}
    </>
  );
}
