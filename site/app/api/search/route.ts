import { NextResponse } from "next/server";
import { search } from "@/lib/content";

// The header search box. Same ranking the MCP server uses; results are cached at the edge per query.
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") || "").slice(0, 120);
  const results = q.trim() ? search(q, 8) : [];
  return NextResponse.json({ results }, { headers: { "cache-control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
}
