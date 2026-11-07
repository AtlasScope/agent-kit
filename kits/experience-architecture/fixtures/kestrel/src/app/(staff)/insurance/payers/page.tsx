import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { coverages, payers } from "@/lib/data";

export const metadata: Metadata = { title: "Payers" };

export default function PayersPage() {
  return (
    <div>
      <PageHeader title="Payers" back={{ href: "/insurance", label: "Insurance" }} />
      <table className="table">
        <thead>
          <tr>
            <th>Payer</th>
            <th>Phone</th>
            <th>Portal</th>
            <th>Patients</th>
          </tr>
        </thead>
        <tbody>
          {payers.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.phone}</td>
              <td className="mono">{p.portal}</td>
              <td>{coverages.filter((c) => c.payerId === p.id).length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
