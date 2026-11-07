import { PageHeader } from "@/components/ui";

export default function WorkspaceSettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader title="Workspace settings" subtitle="Applies to everyone in this workspace." />
      {children}
    </>
  );
}
