import { fixturesEnabled, store } from "../store";

// Stands in for what a Star button does to the database: adds or removes one item in Starred. The real Star needs
// Clerk, which the sample pages don't have, so the smoke journey calls this and then fires the same browser event
// the Star fires after saving. 404 wherever sample data is off.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!fixturesEnabled()) return new Response("Not found", { status: 404 });
  const { kind, ref, on } = (await req.json()) as { kind: string; ref: string; on: boolean };
  const starred = store().find((c) => c.is_starred)!;
  starred.items = starred.items.filter((i) => !(i.kind === kind && i.ref === ref));
  if (on) starred.items.push({ kind, ref } as (typeof starred.items)[number]);
  return new Response(null, { status: 204 });
}
