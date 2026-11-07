import { workspaces, shipmentsFor } from "@/lib/data";
import { money } from "@/lib/format";
import { Card, KV, Badge } from "@/components/ui";

export default function OrgBilling() {
  const seats = 10;
  return (
    <div className="stack">
      <Card title="Subscription">
        <KV
          rows={[
            ["Plan", <Badge key="p" tone="info">Enterprise annual</Badge>],
            ["Seats", `${seats} of 15 used`],
            ["Renews", "Mar 1, 2027"],
            ["Billing contact", "ap@meridian-demo.example"],
          ]}
        />
      </Card>
      <Card title="Usage by workspace" pad={false}>
        <table className="table">
          <thead>
            <tr>
              <th>Workspace</th>
              <th>Tracked shipments</th>
              <th>Estimated usage charge</th>
            </tr>
          </thead>
          <tbody>
            {workspaces.map((w) => {
              const n = shipmentsFor(w.slug).length;
              return (
                <tr key={w.slug}>
                  <td>{w.name}</td>
                  <td>{n}</td>
                  <td>{money(n * 1.85)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
