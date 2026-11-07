import { notFound } from "next/navigation";
import { documentsFor, getShipment } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { Card } from "@/components/ui";
import { UploadButton } from "./UploadButton";

export default async function ShipmentDocuments({ params }: { params: Promise<{ workspace: string; id: string }> }) {
  const { workspace, id } = await params;
  const s = getShipment(workspace, id);
  if (!s) notFound();
  const docs = documentsFor(s);
  return (
    <Card title="Documents" action={<UploadButton />} pad={false}>
      <table className="table">
        <thead>
          <tr>
            <th>File</th>
            <th>Type</th>
            <th>Uploaded</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <tr key={d.name}>
              <td className="mono">{d.name}</td>
              <td>{d.kind}</td>
              <td>{shortDate(d.uploadedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
