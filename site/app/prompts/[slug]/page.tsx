import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AreaPage } from "./AreaPage";
import { PromptPage } from "./PromptPage";
import { prompts, areas, getPrompt, getArea, sectionOf, whatOf, type Prompt } from "@/lib/content";

export const dynamicParams = false;
export const generateStaticParams = () => [...prompts.map((p) => ({ slug: p.slug })), ...areas.map((a) => ({ slug: a.slug }))];

const clip = (s: string, n = 155) => (s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s);

// Titles match the words people search with: the job, then what the page is.
function promptTitle(p: Prompt) {
  if (p.sec === "ecmd" || p.sec === "dcmd") return `${p.t}: ${p.sub || p.group} command`;
  if (p.sec === "recipe") return `${p.t}: design recipe for AI agents`;
  if (p.sec === "plan") return `${p.t}: recipe for AI coding agents`;
  if (p.sec === "think") return `${p.t}: a way of working for AI coding agents`;
  if (p.sec === "db") return `${p.t}: PostgreSQL prompt for AI agents`;
  return `${p.t}: prompt for AI coding agents`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = getPrompt(slug);
  if (p) return { title: { absolute: promptTitle(p) }, description: clip(whatOf(p) || p.p || p.t), alternates: { canonical: p.replacedBy ? `/prompts/${p.replacedBy}` : `/prompts/${slug}`, types: { "text/markdown": `/prompts/${slug}.md` } } };
  const a = getArea(slug);
  if (a) return { title: `${a.title} prompts`, description: clip(a.blurb || sectionOf(a.sec).blurb), alternates: { canonical: `/prompts/${slug}`, types: { "text/markdown": `/prompts/${slug}.md` } } };
  return {};
}

// This one route serves two page types, because both live at /prompts/<slug>: a prompt (PromptPage.tsx) and an
// area of the library (AreaPage.tsx). Routing, static params and metadata stay here.
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPrompt(slug);
  if (p) return <PromptPage p={p} />;
  const a = getArea(slug);
  if (a) return <AreaPage a={a} />;
  notFound();
}
