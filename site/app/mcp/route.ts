import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { guard, switchSource } from "@/lib/mcp-guard";
import { SITE } from "@/lib/site";
import { areas, fixes, getArea, getFix, getPrompt, getPromptById, getSkill, search, counts } from "@/lib/content";
import { promptMd, skillMd, areaMd, fixMd } from "@/lib/markdown";

export const maxDuration = 30;

const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });
const READ = { readOnlyHint: true, openWorldHint: false } as const;

const handler = createMcpHandler(
  (server) => {
    server.registerTool("find", {
      title: "Find prompts and skills",
      description: `Search Agent Kit's ${counts.prompts} prompts and ${counts.skills} skills with a task in plain words (for example "my API is slow" or "review typography"). Returns the best matches with links; fetch one with get_prompt or get_skill.`,
      inputSchema: z.object({
        query: z.string().min(1).max(200),
        kind: z.enum(["prompt", "skill", "any"]).optional(),
        limit: z.number().int().min(1).max(20).optional(),
      }),
      annotations: READ,
    }, async ({ query, kind, limit }) => {
      const n = limit ?? 8;
      const hits = search(query, 60).filter((h) => !kind || kind === "any" || h.kind === kind).slice(0, n);
      if (!hits.length) return text(`Nothing matched "${query}". Try fewer or plainer words, or use fix to start from a symptom.`);
      return text(hits.map((h, i) => {
        const path = `/${h.kind === "prompt" ? "prompts" : "skills"}/${h.ref}`;
        return `${i + 1}. ${h.title} (${h.kind}, ${h.kind === "prompt" ? "get_prompt" : "get_skill"} "${h.ref}")\n   ${SITE.url}${path} · ${SITE.url}${path}.md\n   ${h.summary}`;
      }).join("\n"));
    });

    server.registerTool("get_prompt", {
      title: "Get a prompt",
      description: "Return one prompt, command or recipe in full: the text to paste, why it exists, what it returns and when to skip it. Takes the slug from find or a library id such as A01.",
      inputSchema: z.object({ slug: z.string().min(1).max(120) }),
      annotations: READ,
    }, async ({ slug }) => {
      const p = getPrompt(slug) || getPromptById(slug);
      return p ? text(promptMd(p)) : text(`No prompt called "${slug}". Use find to search.`);
    });

    server.registerTool("get_skill", {
      title: "Get a skill",
      description: "Return a skill's full SKILL.md with its author credit, license and install commands.",
      inputSchema: z.object({ name: z.string().min(1).max(120) }),
      annotations: READ,
    }, async ({ name }) => {
      const s = getSkill(name.replace(/^\//, ""));
      return s ? text(skillMd(s, true)) : text(`No skill called "${name}". Use find with kind "skill" to search.`);
    });

    server.registerTool("list_area", {
      title: "List an area",
      description: "List the prompts in one area, such as performance-and-scale. Without an area, lists every area.",
      inputSchema: z.object({ area: z.string().max(120).optional() }),
      annotations: READ,
    }, async ({ area }) => {
      const a = area ? getArea(area) : undefined;
      if (a) return text(areaMd(a));
      return text(`${area ? `No area called "${area}". ` : ""}Areas:\n${areas.map((x) => `- ${x.slug}: ${x.title} (${x.prompts.length})`).join("\n")}`);
    });

    server.registerTool("fix", {
      title: "Start from a symptom",
      description: "List the problems Agent Kit has starting points for (\"tests are green but production keeps breaking\"), or, given one, the prompts to try first.",
      inputSchema: z.object({ problem: z.string().max(120).optional() }),
      annotations: READ,
    }, async ({ problem }) => {
      const f = problem ? getFix(problem) : undefined;
      if (f) return text(fixMd(f));
      return text(`${problem ? `No problem page called "${problem}". ` : ""}Problems:\n${fixes.map((x) => `- ${x.slug}: ${x.title}`).join("\n")}`);
    });
  },
  {
    serverInfo: { name: "agent-kit", version: "1.0.0" },
    instructions: `Read-only access to the Agent Kit library (${SITE.url}). Use find first, then get_prompt or get_skill. Nothing here runs code or changes anything.`,
  },
);

async function guarded(req: Request) {
  const res = (await guard(req)) ?? (await handler(req));
  try { res.headers.set("x-mcp-switch", switchSource()); } catch { /* immutable headers */ }
  return res;
}

export { guarded as GET, guarded as POST, guarded as DELETE };
