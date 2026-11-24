import { notFound } from "next/navigation";
import { CollectionsView } from "@/components/CollectionsView";
import { Crumbs } from "@/components/Crumbs";
import { store, fixturesEnabled, SAMPLE_PATH } from "./store";
import { create, rename, share, remove, removeItem } from "./actions";

export const metadata = { title: "Collections (sample data)", robots: { index: false } };
export const dynamic = "force-dynamic";

// The signed-in Collections page drawn from sample data, for previews and local review. See store.ts.
export default function AccountFixture() {
  if (!fixturesEnabled()) notFound();
  return (
    <main className="page">
      <div className="page-head">
        <Crumbs items={[["Collections", SAMPLE_PATH]]} />
        <h1>Collections</h1>
        <p className="lead ink2">Starred holds everything you star. Make your own collections to group prompts and skills; each stays private until you share it, and a shared one with skills gets a single install command.</p>
      </div>
      <CollectionsView cols={store()} actions={{ create, rename, share, remove, removeItem }} sharedHref={(id) => `${SAMPLE_PATH}/shared?id=${id}`} />
    </main>
  );
}
