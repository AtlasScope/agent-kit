import { notFound } from "next/navigation";
import { promptsIndexMd, skillsIndexMd, kitsIndexMd, fixIndexMd, homeMd } from "@/lib/markdown";
import { mdResponse } from "@/lib/md-response";

export const dynamic = "force-static";
export const dynamicParams = false;
const PAGES: Record<string, () => string> = { index: homeMd, prompts: promptsIndexMd, skills: skillsIndexMd, kits: kitsIndexMd, fix: fixIndexMd };
export const generateStaticParams = () => Object.keys(PAGES).map((section) => ({ section }));

export async function GET(_: Request, ctx: { params: Promise<{ section: string }> }) {
  const { section } = await ctx.params;
  if (!PAGES[section]) notFound();
  return mdResponse(PAGES[section]());
}
