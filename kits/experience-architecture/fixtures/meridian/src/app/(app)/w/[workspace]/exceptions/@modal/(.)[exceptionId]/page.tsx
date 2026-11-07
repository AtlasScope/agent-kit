import { notFound } from "next/navigation";
import { exceptions, getShipment } from "@/lib/data";
import { ExceptionQuickView } from "../../ExceptionQuickView";

export default async function ExceptionModal({ params }: { params: Promise<{ workspace: string; exceptionId: string }> }) {
  const { workspace, exceptionId } = await params;
  const e = exceptions.find((x) => x.id === exceptionId && x.workspace === workspace);
  if (!e) notFound();
  const s = getShipment(workspace, e.shipmentId);
  return <ExceptionQuickView workspace={workspace} exception={e} shipment={s} />;
}
