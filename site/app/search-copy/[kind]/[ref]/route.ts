import { notFound } from "next/navigation";
import { paletteCopies, paletteCopy } from "@/lib/palette-index";

// The Copy text of one palette result (a prompt with its rules, an install message or command), as plain text.
// The palette's index leaves these out to stay small; it fetches one when a result is previewed or copied.
export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => paletteCopies();

export async function GET(_: Request, ctx: { params: Promise<{ kind: string; ref: string }> }) {
  const { kind, ref } = await ctx.params;
  const text = paletteCopy(kind, ref);
  if (text === undefined) notFound();
  return new Response(text, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } });
}
