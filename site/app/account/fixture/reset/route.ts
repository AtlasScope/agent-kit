import { fixturesEnabled, reset } from "../store";

// Puts the sample collections back as they started. The smoke journeys call it first, so they pass on any
// server that has sample data on, however many times they have run. 404 wherever sample data is off.
export const dynamic = "force-dynamic";

export function POST() {
  if (!fixturesEnabled()) return new Response("Not found", { status: 404 });
  reset();
  return new Response(null, { status: 204 });
}
