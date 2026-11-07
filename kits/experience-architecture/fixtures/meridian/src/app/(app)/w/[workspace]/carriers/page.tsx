import Link from "next/link";
import type { Metadata } from "next";
import { carriersFor, shipmentsFor } from "@/lib/data";
import { Badge, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Carriers" };

export default async function CarriersPage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const list = carriersFor(workspace);
  const ships = shipmentsFor(workspace);
  return (
    <>
      <PageHeader title="Carriers" subtitle="Carriers contracted by this workspace, with 90-day service levels." />
      <section className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Carrier</th>
                <th>Modes</th>
                <th>On time</th>
                <th className="hide-sm">Claims rate</th>
                <th className="hide-sm">Active loads</th>
                <th className="hide-sm">HQ</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/w/${workspace}/carriers/${c.id}`}>{c.name}</Link>
                    <div className="small muted mono">{c.scac}</div>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 4 }}>
                      {c.modes.map((m) => (
                        <Badge key={m}>{m}</Badge>
                      ))}
                    </div>
                  </td>
                  <td>
                    <Badge tone={c.onTimePct >= 92 ? "good" : c.onTimePct >= 87 ? "warn" : "bad"}>{c.onTimePct}%</Badge>
                  </td>
                  <td className="hide-sm">{c.claimsRate}%</td>
                  <td className="hide-sm">{ships.filter((s) => s.carrierId === c.id && s.status !== "delivered").length}</td>
                  <td className="hide-sm">{c.hq}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
