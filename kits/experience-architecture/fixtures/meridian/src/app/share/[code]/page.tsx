import { notFound, redirect } from "next/navigation";
import { shipments } from "@/lib/data";

export default async function SharedShipment({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const s = shipments.find((x) => x.shareCode === code);
  if (!s) notFound();
  redirect(`/w/${s.workspace}/shipments/${s.id}`);
}
