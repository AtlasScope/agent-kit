import { OrgNav } from "./OrgNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="content">
      <Breadcrumbs extra={{ org: "Organization" }} />
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <h1>Meridian Demo Holdings</h1>
        <span className="muted small">Organization · 3 workspaces</span>
      </div>
      <OrgNav />
      {children}
    </div>
  );
}
