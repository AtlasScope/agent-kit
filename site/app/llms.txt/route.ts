import { llmsTxt } from "@/lib/markdown";
export const dynamic = "force-static";
export const GET = () => new Response(llmsTxt() + "\n", { headers: { "content-type": "text/plain; charset=utf-8" } });
