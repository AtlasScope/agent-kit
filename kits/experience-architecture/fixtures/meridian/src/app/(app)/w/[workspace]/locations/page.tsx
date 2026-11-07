import Link from "next/link";
import { locations } from "@/lib/data";
import { Badge, PageHeader } from "@/components/ui";

export default async function LocationsPage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const list = locations.filter((l) => l.workspace === workspace);
  return (
    <>
      <PageHeader title="Locations" subtitle="Warehouses, docks and customer DCs this workspace ships from or to." />
      <div className="grid grid-3">
        {list.map((l) => (
          <Link key={l.id} href={`/w/${workspace}/locations/${l.id}`} className="card card-pad stack" style={{ color: "inherit" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2>{l.name}</h2>
              <Badge>{l.kind}</Badge>
            </div>
            <p className="muted small">
              {l.city} · {l.dockDoors} dock doors · {l.hours}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
