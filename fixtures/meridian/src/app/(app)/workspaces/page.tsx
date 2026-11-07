import Link from "next/link";
import type { Metadata } from "next";
import { exceptionsFor, shipmentsFor, workspaces } from "@/lib/data";
import { PageHeader, Badge } from "@/components/ui";

export const metadata: Metadata = { title: "Workspaces" };

export default function WorkspacesPage() {
  return (
    <div className="content">
      <PageHeader title="Workspaces" subtitle="Each workspace is one operating unit with its own shipments, carriers and invoices." />
      <div className="grid grid-3">
        {workspaces.map((w) => {
          const ships = shipmentsFor(w.slug);
          const open = exceptionsFor(w.slug).filter((e) => e.status !== "resolved").length;
          const moving = ships.filter((s) => s.status === "in_transit" || s.status === "at_customs").length;
          return (
            <Link key={w.slug} href={`/w/${w.slug}/overview`} className="card card-pad stack" style={{ color: "inherit" }}>
              <div className="row">
                <span className="switcher-dot" style={{ background: w.color }} />
                <h2>{w.name}</h2>
              </div>
              <p className="muted small">
                {w.region} · {w.timezone}
              </p>
              <div className="row">
                <Badge tone="info">{moving} moving</Badge>
                <Badge tone={open > 0 ? "bad" : "good"}>{open} open exceptions</Badge>
                <Badge>{w.plan}</Badge>
              </div>
            </Link>
          );
        })}
      </div>
      <p className="small muted" style={{ marginTop: 18 }}>
        Need a view across every workspace? Use <Link href="/org/shipments">All shipments</Link> in the organization area.
      </p>
    </div>
  );
}
