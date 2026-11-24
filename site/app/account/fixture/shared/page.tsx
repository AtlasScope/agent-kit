import { notFound } from "next/navigation";
import { SharedCollection } from "@/components/CollectionsView";
import { store, fixturesEnabled, SAMPLE_PATH } from "../store";

export const metadata = { title: "Shared collection (sample data)", robots: { index: false } };
export const dynamic = "force-dynamic";

// A shared collection page drawn from sample data. ?id= picks one (an unknown id is a 404, as on /collections/[id]);
// with no id it shows the shared sample.
export default async function SharedFixture({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  if (!fixturesEnabled()) notFound();
  const { id } = await searchParams;
  const c = id ? store().find((x) => x.id === id) : store().find((x) => x.is_public);
  if (!c) notFound();
  return <SharedCollection c={c} own manageHref={SAMPLE_PATH} selfHref={`${SAMPLE_PATH}/shared?id=${c.id}`} />;
}
