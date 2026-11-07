import { NextResponse, type NextRequest } from "next/server";
import { carriers, invoices, shipments } from "@/lib/data";

export function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
  if (q.length < 2) return NextResponse.json({ hits: [] });

  const shipmentHits = shipments
    .filter((s) => [s.id, s.reference, s.proNumber, s.customer].some((v) => v.toLowerCase().includes(q)))
    .slice(0, 8)
    .map((s) => ({
      kind: "shipment" as const,
      id: s.id,
      label: `${s.id} · ${s.customer}`,
      detail: `${s.origin} → ${s.destination}`,
      href: `/w/${s.workspace}/shipments/${s.id}`,
    }));

  const carrierHits = carriers
    .filter((c) => c.name.toLowerCase().includes(q) || c.scac.toLowerCase().includes(q))
    .slice(0, 4)
    .map((c) => ({
      kind: "carrier" as const,
      id: c.id,
      label: c.name,
      detail: c.scac,
      href: `/w/${c.workspaces[0]}/carriers/${c.id}`,
    }));

  const invoiceHits = invoices
    .filter((i) => i.id.toLowerCase().includes(q))
    .slice(0, 4)
    .map((i) => ({
      kind: "invoice" as const,
      id: i.id,
      label: i.id,
      detail: i.status,
      href: `/w/${i.workspace}/invoices/${i.id}`,
    }));

  return NextResponse.json({ hits: [...shipmentHits, ...carrierHits, ...invoiceHits] });
}
