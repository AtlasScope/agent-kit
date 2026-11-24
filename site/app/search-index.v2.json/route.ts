import { paletteIndex } from "@/lib/palette-index";

// v2: the Copy texts moved out. A tab still running the build before that would break on an index without them,
// so the new shape has a new URL and the old one (search-index.json) keeps serving the texts for now.
// Everything the command palette searches, built once at build time, without the Copy texts (those are served one
// at a time by /search-copy). The palette fetches it on the first sign someone means to search (the pointer or
// focus reaching the search button, a tap on it, ⌘K or "/") and ranks in the browser, so typing never waits on the network.
export const dynamic = "force-static";
// Browsers keep it 5 minutes and no longer (no stale-while-revalidate), so after a deploy a reload soon gets the new
// list; it is fetched only when someone searches, so the revalidations are rare. Vercel purges its CDN on deploy.
export function GET() {
  return Response.json(paletteIndex(), { headers: { "cache-control": "public, max-age=300, s-maxage=86400" } });
}
