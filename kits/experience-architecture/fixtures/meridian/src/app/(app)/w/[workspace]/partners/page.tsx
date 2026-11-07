import Link from "next/link";
import type { Metadata } from "next";
import { carriersFor, shipmentsFor } from "@/lib/data";
import { Badge, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Partners" };

export default async function PartnersPage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const list = [...carriersFor(workspace)].sort((a, b) => a.name.localeCompare(b.name));
  const ships = shipmentsFor(workspace);
  return (
    <>
      <PageHeader title="Partners" subtitle="Transportation partners in your network." />
      <section className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Partner</th>
                <th>SCAC</th>
                <th>Services</th>
                <th className="hide-sm">Loads</th>
                <th>Service level</th>
                <th className="hide-sm">Contact</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/w/${workspace}/carriers/${c.id}`}>{c.name}</Link>
                  </td>
                  <td className="mono">{c.scac}</td>
                  <td>{c.modes.join(" / ")}</td>
                  <td className="hide-sm">{ships.filter((s) => s.carrierId === c.id).length}</td>
                  <td>
                    <Badge tone={c.onTimePct >= 92 ? "good" : c.onTimePct >= 87 ? "warn" : "bad"}>{c.onTimePct}% on time</Badge>
                  </td>
                  <td className="hide-sm">{c.contact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
