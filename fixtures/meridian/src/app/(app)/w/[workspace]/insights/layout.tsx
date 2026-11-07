import { PageHeader } from "@/components/ui";
import { InsightsNav } from "./InsightsNav";

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader title="Insights" subtitle="How the network is performing, updated every hour." />
      <InsightsNav />
      {children}
    </>
  );
}
