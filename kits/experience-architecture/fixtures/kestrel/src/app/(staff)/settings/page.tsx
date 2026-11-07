import type { Metadata } from "next";
import Link from "next/link";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { SignOut } from "@/components/SignOut";
import { Card, PageHeader } from "@/components/ui";
import { CLINIC } from "@/lib/data";
import { getRole, getUserName } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const role = await getRole();
  const name = await getUserName();
  return (
    <div>
      <PageHeader title="Settings" />
      <div className="grid-2">
        <Card title="You">
          <p>{name}</p>
          <RoleSwitcher role={role} />
          <p className="muted">Demo only: switching role changes what this browser can see.</p>
          <SignOut />
        </Card>
        <Card title="Clinic">
          <p>{CLINIC.name}</p>
          <p className="muted">Open {CLINIC.opens}–{CLINIC.closes} · {CLINIC.phone}</p>
          <ul className="link-list">
            <li><Link href="/settings/clinicians">Clinicians</Link></li>
            <li><Link href="/settings/rooms">Rooms</Link></li>
            <li><Link href="/board">Open waiting-room board</Link></li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
