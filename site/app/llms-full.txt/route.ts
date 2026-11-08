import { llmsFullTxt } from "@/lib/markdown";
export const dynamic = "force-static";
export const GET = () => new Response(llmsFullTxt() + "\n", { headers: { "content-type": "text/plain; charset=utf-8" } });
