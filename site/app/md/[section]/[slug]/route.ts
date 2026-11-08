import { notFound } from "next/navigation";
import { prompts, areas, skills, kits, fixes, getPrompt, getArea, getSkill, getKit, getFix } from "@/lib/content";
import { promptMd, areaMd, skillMd, kitMd, fixMd } from "@/lib/markdown";
import { mdResponse } from "@/lib/md-response";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return [
    ...prompts.map((p) => ({ section: "prompts", slug: p.slug })),
    ...areas.map((a) => ({ section: "prompts", slug: a.slug })),
    ...skills.map((s) => ({ section: "skills", slug: s.name })),
    ...kits.map((k) => ({ section: "kits", slug: k.name })),
    ...fixes.map((f) => ({ section: "fix", slug: f.slug })),
  ];
}

export async function GET(_: Request, ctx: { params: Promise<{ section: string; slug: string }> }) {
  const { section, slug } = await ctx.params;
  const body =
    section === "prompts" ? (getPrompt(slug) ? promptMd(getPrompt(slug)!) : getArea(slug) ? areaMd(getArea(slug)!) : null)
    : section === "skills" ? (getSkill(slug) ? skillMd(getSkill(slug)!) : null)
    : section === "kits" ? (getKit(slug) ? kitMd(getKit(slug)!) : null)
    : section === "fix" ? (getFix(slug) ? fixMd(getFix(slug)!) : null)
    : null;
  if (!body) notFound();
  return mdResponse(body);
}
