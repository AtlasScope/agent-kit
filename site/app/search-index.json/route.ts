import { paletteIndex } from "@/lib/palette-index";

// Everything the command palette searches, built once at build time, without the Copy texts (those are served one
// at a time by /search-copy). The palette fetches it on the first sign someone means to search (the pointer or
// focus reaching the search button, a tap on it, ⌘K or "/") and ranks in the browser, so typing never waits on the network.
export const dynamic = "force-static";
export function GET() {
  return Response.json(paletteIndex(), { headers: { "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } });
}
