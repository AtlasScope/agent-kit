import Link from "next/link";
import type { ReactNode } from "react";
import { statusTone, STATUS_LABEL } from "@/lib/format";
import type { ShipmentStatus } from "@/lib/data";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p className="page-sub">{subtitle}</p> : null}
      </div>
      {actions ? <div className="actions">{actions}</div> : null}
    </div>
  );
}

export function Card({
  title,
  action,
  children,
  pad = true,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  pad?: boolean;
}) {
  return (
    <section className="card">
      {title ? (
        <div className="card-head">
          <h2>{title}</h2>
          {action}
        </div>
      ) : null}
      <div className={pad ? "card-pad" : undefined}>{children}</div>
    </section>
  );
}

export function Badge({ tone, children }: { tone?: string; children: ReactNode }) {
  return <span className={`badge tone-${tone ?? "neutral"}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const label = (STATUS_LABEL as Record<string, string>)[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
  return <Badge tone={statusTone(status)}>{label}</Badge>;
}

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus }) {
  return <StatusBadge status={status} />;
}

export function Kpi({ label, value, delta, tone }: { label: string; value: ReactNode; delta?: string; tone?: "good" | "bad" }) {
  return (
    <div className="card card-pad">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {delta ? (
        <div className="kpi-delta" style={{ color: tone === "bad" ? "var(--bad)" : "var(--good)" }}>
          {delta}
        </div>
      ) : null}
    </div>
  );
}

export function Bar({ label, value, max, suffix = "" }: { label: string; value: number; max: number; suffix?: string }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="bar-row">
      <span title={label} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </span>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="muted">
        {value}
        {suffix}
      </span>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>;
}

export function KV({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="kv">
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: "contents" }}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SubNav({ items, current }: { items: { href: string; label: string }[]; current: string }) {
  return (
    <nav className="tabs" aria-label="Section">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className={`tab${current === i.href ? " active" : ""}`}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}
