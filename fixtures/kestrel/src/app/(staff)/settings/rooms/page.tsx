import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { rooms } from "@/lib/data";

export const metadata: Metadata = { title: "Rooms" };

export default function RoomsPage() {
  return (
    <div>
      <PageHeader title="Rooms" back={{ href: "/settings", label: "Settings" }} />
      <table className="table">
        <thead>
          <tr>
            <th>Room</th>
            <th>Equipment</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((r) => (
            <tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.equipment.length ? r.equipment.join(", ") : <span className="muted">Standard</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
