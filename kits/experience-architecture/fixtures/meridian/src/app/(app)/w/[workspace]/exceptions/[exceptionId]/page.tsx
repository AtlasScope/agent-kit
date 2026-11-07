import Link from "next/link";
import { notFound } from "next/navigation";
import { exceptions, getCarrier, getShipment } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { Card, KV, PageHeader, StatusBadge } from "@/components/ui";
import { ExceptionWorkbench } from "./ExceptionWorkbench";

export default async function ExceptionDetail({ params }: { params: Promise<{ workspace: string; exceptionId: string }> }) {
  const { workspace, exceptionId } = await params;
  const e = exceptions.find((x) => x.id === exceptionId && x.workspace === workspace);
  if (!e) notFound();
  const s = getShipment(workspace, e.shipmentId);
  return (
    <>
      <PageHeader
        title={`${e.id} · ${e.type}`}
        subtitle={<>Opened {shortDate(e.openedAt)} on <Link href={`/w/${workspace}/shipments/${e.shipmentId}`}>{e.shipmentId}</Link></>}
        actions={
          <Link className="btn" href={`/w/${workspace}/exceptions`}>
            All exceptions
          </Link>
        }
      />
      <div className="grid grid-2">
        <Card title="Details">
          <KV
            rows={[
              ["Status", <StatusBadge key="s" status={e.status} />],
              ["Severity", <StatusBadge key="v" status={e.severity} />],
              ["Owner", e.owner],
              ["Customer", s?.customer ?? "-"],
              ["Carrier", s ? getCarrier(s.carrierId)?.name : "-"],
              ["Lane", s ? `${s.origin} → ${s.destination}` : "-"],
            ]}
          />
          <p style={{ marginTop: 12 }}>{e.summary}</p>
        </Card>
        <ExceptionWorkbench exceptionId={e.id} initialStatus={e.status} initialOwner={e.owner} />
      </div>
    </>
  );
}
