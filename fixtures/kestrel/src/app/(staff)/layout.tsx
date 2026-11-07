import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { ClinicStoreProvider } from "@/components/ClinicStore";
import { threads } from "@/lib/data";
import { getRole, getUserName } from "@/lib/session";

export default async function StaffLayout({ children }: { children: ReactNode }) {
  const role = await getRole();
  const userName = await getUserName();
  const unread = threads.filter((t) => t.unread).length;
  return (
    <ClinicStoreProvider>
      <AppShell role={role} userName={userName} unread={unread}>
        {children}
      </AppShell>
    </ClinicStoreProvider>
  );
}
