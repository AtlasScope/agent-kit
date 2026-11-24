import { paletteIndexWithTexts } from "@/lib/palette-index";

// The old index URL, with the Copy texts inside, for tabs still running a build from before /search-index.v2.json.
// Remove a week after v2 ships.
export const dynamic = "force-static";
export function GET() {
  return Response.json(paletteIndexWithTexts(), { headers: { "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } });
}
