import { redirect } from "next/navigation";

export default async function CheckInStart({ params }: { params: Promise<{ apptId: string }> }) {
  const { apptId } = await params;
  redirect(`/today/${apptId}/arrived`);
}
