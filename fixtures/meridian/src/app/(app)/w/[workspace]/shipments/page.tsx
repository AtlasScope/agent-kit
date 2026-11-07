import type { Metadata } from "next";
import { carriersFor, shipmentsFor } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import Link from "next/link";
import { ShipmentsTable } from "./ShipmentsTable";

export const metadata: Metadata = { title: "Shipments" };

export default async function ShipmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{ status?: string; carrier?: string; q?: string }>;
}) {
  const { workspace } = await params;
  const initial = await searchParams;
  return (
    <>
      <PageHeader
        title="Shipments"
        subtitle="Every load booked in this workspace, newest pickup first."
        actions={
          <Link className="btn btn-primary" href={`/w/${workspace}/shipments/new`}>
            New shipment
          </Link>
        }
      />
      <ShipmentsTable
        workspace={workspace}
        rows={shipmentsFor(workspace)}
        carriers={carriersFor(workspace)}
        initialStatus={initial.status}
        initialCarrier={initial.carrier}
        initialQuery={initial.q}
      />
    </>
  );
}
