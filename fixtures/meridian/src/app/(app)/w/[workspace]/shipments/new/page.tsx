import { carriersFor, locations } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { NewShipmentForm } from "./NewShipmentForm";

export default async function NewShipmentPage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  return (
    <>
      <PageHeader title="New shipment" subtitle="Book a load. It is tendered to the carrier when you save." />
      <NewShipmentForm
        workspace={workspace}
        carriers={carriersFor(workspace)}
        locations={locations.filter((l) => l.workspace === workspace)}
      />
    </>
  );
}
