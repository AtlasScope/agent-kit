import { fixturesEnabled, reset } from "../store";

// Puts the sample collections back as they started. The smoke journeys call it first, so they pass however many
// times they have run. The store lives in one process's memory, so this (and the journeys) hold on a single
// long-lived server: `next dev`, or `next start` with ACCOUNT_FIXTURES=1. On a serverless preview each request can
// land on a different instance, so changes there may not stick; browse previews, don't run the smoke against them.
// 404 wherever sample data is off.
export const dynamic = "force-dynamic";

export function POST() {
  if (!fixturesEnabled()) return new Response("Not found", { status: 404 });
  reset();
  return new Response(null, { status: 204 });
}
