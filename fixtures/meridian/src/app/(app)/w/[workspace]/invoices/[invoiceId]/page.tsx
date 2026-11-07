import { notFound } from "next/navigation";
import { chargesFor, getCarrier, getShipment, invoices } from "@/lib/data";
import { money, shortDate } from "@/lib/format";
import { PageHeader, StatusBadge } from "@/components/ui";
import { InvoiceTabs } from "./InvoiceTabs";

export default async function InvoiceDetail({ params }: { params: Promise<{ workspace: string; invoiceId: string }> }) {
  const { workspace, invoiceId } = await params;
  const inv = invoices.find((i) => i.id === invoiceId && i.workspace === workspace);
  if (!inv) notFound();
  const ships = inv.shipmentIds.map((id) => getShipment(workspace, id)).filter((s) => s !== undefined);
  const lines = ships.flatMap((s) => chargesFor(s).map((c) => ({ shipmentId: s.id, ...c })));
  return (
    <>
      <PageHeader
        title={
          <span className="row">
            {inv.id} <StatusBadge status={inv.status} />
          </span>
        }
        subtitle={`${getCarrier(inv.carrierId)?.name} · issued ${shortDate(inv.issuedAt)} · due ${shortDate(inv.dueAt)} · ${money(inv.amountUsd)}`}
      />
      <InvoiceTabs workspace={workspace} invoice={inv} lines={lines} />
    </>
  );
}
