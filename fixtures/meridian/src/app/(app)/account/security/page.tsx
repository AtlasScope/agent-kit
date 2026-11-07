import { Card, KV, Badge } from "@/components/ui";

export default function SecurityPage() {
  return (
    <div className="stack">
      <Card title="Sign-in">
        <KV
          rows={[
            ["Method", "Password (single sign-on not enforced)"],
            ["Two-step verification", <Badge key="2fa" tone="good">On · authenticator app</Badge>],
            ["Last password change", "Aug 14"],
          ]}
        />
      </Card>
      <Card title="Active sessions">
        <table className="table">
          <thead>
            <tr>
              <th>Device</th>
              <th>Location</th>
              <th>Last seen</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Chrome on macOS (this device)</td>
              <td>Chicago, IL</td>
              <td>Now</td>
            </tr>
            <tr>
              <td>Meridian for iPhone</td>
              <td>Chicago, IL</td>
              <td>Yesterday</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  );
}
