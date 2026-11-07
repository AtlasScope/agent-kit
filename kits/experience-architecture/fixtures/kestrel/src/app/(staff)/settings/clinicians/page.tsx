import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { clinicians, patients } from "@/lib/data";

export const metadata: Metadata = { title: "Clinicians" };

export default function CliniciansPage() {
  return (
    <div>
      <PageHeader title="Clinicians" back={{ href: "/settings", label: "Settings" }} />
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Patients</th>
          </tr>
        </thead>
        <tbody>
          {clinicians.map((c) => (
            <tr key={c.id}>
              <td><span className="swatch" style={{ background: c.color }} /> {c.name}</td>
              <td>{c.title}</td>
              <td>{patients.filter((p) => p.preferredClinicianId === c.id).length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
