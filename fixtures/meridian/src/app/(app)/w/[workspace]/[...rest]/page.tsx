import { redirect } from "next/navigation";

export default async function WorkspaceFallback({ params }: { params: Promise<{ workspace: string; rest: string[] }> }) {
  const { workspace } = await params;
  redirect(`/w/${workspace}/overview`);
}
