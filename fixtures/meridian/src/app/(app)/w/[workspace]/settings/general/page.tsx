import { notFound } from "next/navigation";
import { getWorkspace } from "@/lib/data";
import { GeneralForm } from "./GeneralForm";

export default async function WorkspaceGeneral({ params }: { params: Promise<{ workspace: string }> }) {
  const { workspace } = await params;
  const ws = getWorkspace(workspace);
  if (!ws) notFound();
  return <GeneralForm initial={ws} />;
}
