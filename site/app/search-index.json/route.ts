import { paletteIndex } from "@/lib/palette-index";

// Everything the command palette searches, built once at build time. The palette fetches it the first time it
// opens (or when the pointer reaches the search button) and ranks in the browser, so typing never waits on the network.
export const dynamic = "force-static";
export function GET() {
  return Response.json(paletteIndex(), { headers: { "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } });
}
