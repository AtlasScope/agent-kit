import Link from "next/link";
import type { Metadata } from "next";
import { dashboards } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { Badge, PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Dashboards" };

export default async function DashboardsPage({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const list = dashboards.filter((d) => d.workspace === workspace);
  return (
    <>
      <PageHeader title="Dashboards" subtitle="Saved views of your operation that your team checks every day." actions={<button className="btn btn-primary">New dashboard</button>} />
      <div className="grid grid-2">
        {list.map((d) => (
          <Link key={d.id} href={`/w/${workspace}/dashboards/${d.id}`} className="card card-pad stack" style={{ color: "inherit" }}>
            <h2>{d.name}</h2>
            <div className="row" style={{ gap: 4 }}>
              {d.widgets.map((w) => (
                <Badge key={w}>{w}</Badge>
              ))}
            </div>
            <p className="small muted">
              {d.owner} · updated {shortDate(d.updatedAt)}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
