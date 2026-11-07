import Link from "next/link";
import type { ReactNode } from "react";
import { CLINIC } from "@/lib/data";
import type { Role } from "@/lib/types";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";

export function AppShell({ role, userName, unread, children }: { role: Role; userName: string; unread: number; children: ReactNode }) {
  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden>K</span>
          Kestrel
          <span className="brand-clinic">{CLINIC.name}</span>
        </Link>
        <div className="topbar-user">
          <span className={`role-chip ${role}`}>{role === "clinician" ? "Clinician" : "Front desk"}</span>
          <span className="user-name">{userName}</span>
        </div>
      </header>
      <div className="body">
        <Sidebar role={role} unread={unread} />
        <main className="main">{children}</main>
      </div>
      <MobileNav role={role} />
    </div>
  );
}
