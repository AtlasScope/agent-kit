"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DEFAULT_WORKSPACE, getWorkspace, notifications as seed } from "@/lib/data";
import { shortDate } from "@/lib/format";
import { LAST_WORKSPACE_COOKIE, readCookie } from "@/lib/session";
import { Badge } from "@/components/ui";

export function InboxList() {
  const [items, setItems] = useState(seed);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [ws, setWs] = useState<string>(DEFAULT_WORKSPACE);

  useEffect(() => {
    setWs(readCookie(LAST_WORKSPACE_COOKIE) ?? DEFAULT_WORKSPACE);
  }, []);

  const shown = filter === "unread" ? items.filter((n) => !n.read) : items;

  return (
    <section className="card">
      <div className="filters">
        <button className={`btn${filter === "all" ? " btn-primary" : ""}`} onClick={() => setFilter("all")}>
          All
        </button>
        <button className={`btn${filter === "unread" ? " btn-primary" : ""}`} onClick={() => setFilter("unread")}>
          Unread ({items.filter((n) => !n.read).length})
        </button>
        <span style={{ flex: 1 }} />
        <button className="btn" onClick={() => setItems((all) => all.map((n) => ({ ...n, read: true })))}>
          Mark all read
        </button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Alert</th>
            <th className="hide-sm">Workspace</th>
            <th>Date</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {shown.map((n) => (
            <tr key={n.id} style={{ fontWeight: n.read ? 400 : 600 }}>
              <td>
                <Link
                  href={`/w/${ws}/shipments/${n.shipmentId}`}
                  onClick={() => setItems((all) => all.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
                >
                  {n.title}
                </Link>
                <div className="small muted" style={{ fontWeight: 400 }}>
                  {n.body}
                </div>
              </td>
              <td className="hide-sm">
                <Badge>{getWorkspace(n.workspace)?.name}</Badge>
              </td>
              <td>{shortDate(n.at)}</td>
              <td>{n.read ? null : <Badge tone="info">New</Badge>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
