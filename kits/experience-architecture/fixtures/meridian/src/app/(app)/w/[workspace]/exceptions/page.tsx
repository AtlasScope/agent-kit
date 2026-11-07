import type { Metadata } from "next";
import Link from "next/link";
import { exceptionsFor, getShipment } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { ExceptionsList } from "./ExceptionsList";

export const metadata: Metadata = { title: "Exceptions" };

const FILTERS = [
  { key: "open", label: "Open" },
  { key: "investigating", label: "Investigating" },
  { key: "resolved", label: "Resolved" },
  { key: "all", label: "All" },
];

export default async function ExceptionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { workspace } = await params;
  const { status = "open" } = await searchParams;
  const all = exceptionsFor(workspace);
  const rows = all
    .filter((e) => status === "all" || e.status === status)
    .map((e) => ({ ...e, customer: getShipment(workspace, e.shipmentId)?.customer ?? "" }));
  return (
    <>
      <PageHeader title="Exceptions" subtitle="Problems on loads that need someone to act." />
      <nav className="tabs" aria-label="Exception status">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "open" ? `/w/${workspace}/exceptions` : `/w/${workspace}/exceptions?status=${f.key}`}
            className={`tab${status === f.key ? " active" : ""}`}
          >
            {f.label} ({f.key === "all" ? all.length : all.filter((e) => e.status === f.key).length})
          </Link>
        ))}
      </nav>
      <ExceptionsList workspace={workspace} rows={rows} />
    </>
  );
}
