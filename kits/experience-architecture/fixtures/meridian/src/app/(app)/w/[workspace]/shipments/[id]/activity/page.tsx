import { notFound } from "next/navigation";
import { getShipment, trackingEvents } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { Card } from "@/components/ui";
import { ShipmentNotes } from "./ShipmentNotes";

export default async function ShipmentActivity({ params }: { params: Promise<{ workspace: string; id: string }> }) {
  const { workspace, id } = await params;
  const s = getShipment(workspace, id);
  if (!s) notFound();
  const seedNotes = [
    { by: "Marcus Lee", at: s.pickupDate, text: `Confirmed dock appointment with ${s.customer}.` },
    { by: "System", at: s.pickupDate, text: `Tendered to carrier, PRO ${s.proNumber}.` },
  ];
  return (
    <div className="grid grid-2">
      <ShipmentNotes shipmentId={s.id} seed={seedNotes} />
      <Card title="Change history">
        <ul className="timeline">
          {trackingEvents(s).map((e, i) => (
            <li key={i}>
              <span className="muted">{shortDate(e.at)}</span>
              <span>{e.label}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
