"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Shipment, ShipmentException } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { Modal } from "@/components/Modal";
import { KV, StatusBadge } from "@/components/ui";

export function ExceptionQuickView({
  workspace,
  exception: e,
  shipment,
}: {
  workspace: string;
  exception: ShipmentException;
  shipment?: Shipment;
}) {
  const router = useRouter();
  const close = () => router.replace(`/w/${workspace}/exceptions`, { scroll: false });
  return (
    <Modal
      title={`${e.id} · ${e.type}`}
      onClose={close}
      footer={
        <>
          <Link className="btn" href={`/w/${workspace}/shipments/${e.shipmentId}`}>
            Open shipment
          </Link>
          <a className="btn btn-primary" href={`/w/${workspace}/exceptions/${e.id}`}>
            Open full exception
          </a>
        </>
      }
    >
      <KV
        rows={[
          ["Status", <StatusBadge key="s" status={e.status} />],
          ["Severity", <StatusBadge key="v" status={e.severity} />],
          ["Opened", shortDate(e.openedAt)],
          ["Owner", e.owner],
          ["Shipment", shipment ? `${shipment.id} · ${shipment.customer}` : e.shipmentId],
          ["Lane", shipment ? `${shipment.origin} → ${shipment.destination}` : "-"],
        ]}
      />
      <p style={{ marginTop: 12 }}>{e.summary}</p>
    </Modal>
  );
}
