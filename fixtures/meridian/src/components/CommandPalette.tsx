"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { SIDEBAR_GROUPS } from "@/lib/nav";
import { DEFAULT_WORKSPACE, workspaces } from "@/lib/data";
import { readCookie, LAST_WORKSPACE_COOKIE } from "@/lib/session";

interface SearchHit {
  kind: "shipment" | "carrier" | "invoice";
  id: string;
  label: string;
  detail: string;
  href: string;
}

interface Command {
  group: string;
  label: string;
  hint?: string;
  href: string;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const params = useParams<{ workspace?: string }>();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const ws = params.workspace ?? readCookie(LAST_WORKSPACE_COOKIE) ?? DEFAULT_WORKSPACE;

  const commands = useMemo<Command[]>(() => {
    const nav: Command[] = SIDEBAR_GROUPS.flatMap((g) =>
      g.items.map((i) => ({ group: "Go to", label: i.label, hint: g.label, href: `/w/${ws}${i.path}` })),
    );
    const switches: Command[] = workspaces
      .filter((w) => w.slug !== ws)
      .map((w) => ({ group: "Switch workspace", label: w.name, href: `/w/${w.slug}/overview` }));
    const other: Command[] = [
      { group: "Go to", label: "Inbox", href: "/inbox" },
      { group: "Go to", label: "Organization", href: "/org" },
      { group: "Go to", label: "All shipments (organization)", href: "/org/shipments" },
      { group: "Create", label: "New shipment", href: `/w/${ws}/shipments/new` },
      { group: "Account", label: "Profile", href: "/account/profile" },
      { group: "Account", label: "Sign out", href: "/logout" },
    ];
    return [...nav, ...other, ...switches];
  }, [ws]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setHits([]);
    setSel(0);
    window.setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  useEffect(() => {
    if (!open || q.trim().length < 2) {
      setHits([]);
      return;
    }
    const ctrl = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : { hits: [] }))
      .then((d: { hits: SearchHit[] }) => setHits(d.hits))
      .catch(() => {});
    return () => ctrl.abort();
  }, [q, open]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const cmds = needle ? commands.filter((c) => c.label.toLowerCase().includes(needle)) : commands.slice(0, 12);
    return [
      ...hits.map((h) => ({ group: h.kind === "shipment" ? "Shipments" : h.kind === "carrier" ? "Carriers" : "Invoices", label: h.label, hint: h.detail, href: h.href })),
      ...cmds,
    ];
  }, [q, commands, hits]);

  if (!open) return null;

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  let lastGroup = "";
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal palette" role="dialog" aria-label="Command palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="palette-input"
          placeholder="Search shipments, carriers, invoices or jump to a page"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSel(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSel((s) => Math.min(s + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSel((s) => Math.max(s - 1, 0));
            } else if (e.key === "Enter" && filtered[sel]) {
              go(filtered[sel].href);
            } else if (e.key === "Escape") {
              onClose();
            }
          }}
        />
        <ul className="palette-list">
          {filtered.length === 0 ? <li className="empty">No matches</li> : null}
          {filtered.map((c, i) => {
            const header = c.group !== lastGroup ? c.group : null;
            lastGroup = c.group;
            return (
              <li key={c.group + c.href + c.label}>
                {header ? <div className="palette-group">{header}</div> : null}
                <div
                  className={`palette-item${i === sel ? " selected" : ""}`}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => go(c.href)}
                >
                  <span>{c.label}</span>
                  {c.hint ? <span className="muted small">{c.hint}</span> : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
