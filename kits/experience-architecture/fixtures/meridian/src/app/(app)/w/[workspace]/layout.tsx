import { notFound } from "next/navigation";
import { exceptionsFor, getWorkspace } from "@/lib/data";
import { WorkspaceSidebar } from "@/components/WorkspaceSidebar";
import { MobileNav } from "@/components/MobileNav";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DraftProvider } from "@/components/DraftProvider";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const workspace = getWorkspace(slug);
  if (!workspace) notFound();
  const openExceptions = exceptionsFor(slug).filter((e) => e.status !== "resolved").length;

  return (
    <DraftProvider>
      <div className="ws-frame">
        <WorkspaceSidebar workspace={workspace} openExceptions={openExceptions} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <MobileNav workspace={workspace} />
          <div className="content">
            <Breadcrumbs />
            {children}
          </div>
        </div>
      </div>
    </DraftProvider>
  );
}
