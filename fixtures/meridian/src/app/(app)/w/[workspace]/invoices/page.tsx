import type { Metadata } from "next";
import Link from "next/link";
import { getCarrier, invoicesFor } from "@/lib/data";
import { money, shortDate } from "@/lib/format";
import { Kpi, PageHeader, StatusBadge } from "@/components/ui";

export const metadata: Metadata = { title: "Invoices" };

export default async function InvoicesPage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const list = [...invoicesFor(workspace)].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const sum = (st: string) => list.filter((i) => i.status === st).reduce((a, i) => a + i.amountUsd, 0);
  return (
    <>
      <PageHeader title="Invoices" subtitle="Carrier freight bills matched to shipments." />
      <div className="grid grid-4" style={{ marginBottom: 14 }}>
        <Kpi label="Pending approval" value={money(sum("pending"))} />
        <Kpi label="Disputed" value={money(sum("disputed"))} tone="bad" />
        <Kpi label="Approved" value={money(sum("approved"))} />
        <Kpi label="Paid this month" value={money(sum("paid"))} />
      </div>
      <section className="card">
        <div className="scroll-pane">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th className="hide-sm">Carrier</th>
                <th className="hide-sm">Shipments</th>
                <th>Issued</th>
                <th className="hide-sm">Due</th>
                <th style={{ textAlign: "right" }}>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((i) => (
                <tr key={i.id}>
                  <td>
                    <Link href={`/w/${workspace}/invoices/${i.id}`}>{i.id}</Link>
                  </td>
                  <td className="hide-sm">{getCarrier(i.carrierId)?.name}</td>
                  <td className="hide-sm mono">{i.shipmentIds.join(", ")}</td>
                  <td>{shortDate(i.issuedAt)}</td>
                  <td className="hide-sm">{shortDate(i.dueAt)}</td>
                  <td style={{ textAlign: "right" }}>{money(i.amountUsd)}</td>
                  <td>
                    <StatusBadge status={i.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
