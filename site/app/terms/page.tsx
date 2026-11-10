import type { Metadata } from "next";
import { DocPage } from "@/components/DocPage";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms for using Agent Kit, its skills and prompts, and its MCP server.",
  alternates: { canonical: "/terms" },
};

// Draft. It has not been reviewed; keep the notice until it has.
export default function Terms() {
  return (
    <DocPage
      path="/terms"
      title="Terms"
      lead="Agent Kit is free to use. These are the few conditions that come with it."
      notice={<><strong>Draft, 10 Nov 2026.</strong> It has not been reviewed yet, so don’t rely on it as final terms.</>}
      sections={[
        {
          id: "as-is", title: "Provided as is",
          body: <p>The site, the kits, the skills and the prompts are provided as they are, without any warranty. We work to keep them accurate, but we can’t promise that an agent following them will produce a correct or safe result.</p>,
        },
        {
          id: "licenses", title: "Licenses",
          body: <>
            <p>Agent Kit’s own skills, prompts and site code are MIT licensed, © AtlasScope. You can use, copy and change them, including in commercial work, as long as the license notice stays with them.</p>
            <p>Borrowed skills keep their authors’ licenses. Each skill page shows its author and license, and <a href={`${SITE.repo}/blob/main/CREDITS.md`}>the credits</a> list every one.</p>
          </>,
        },
        {
          id: "agent", title: "Your agent, your call",
          body: <p>A skill or prompt is written instructions. Your coding agent runs it with whatever permissions you have given that agent. Review what it proposes before you approve changes, especially to live systems or data.</p>,
        },
        {
          id: "mcp", title: "The MCP server",
          body: <p>The MCP server is public and read-only. It has a per-visitor rate limit and a daily cap, and it can be paused at any time. Use it from your agent as intended; don’t try to get around its limits.</p>,
        },
        {
          id: "accounts", title: "Accounts and collections",
          body: <p>Accounts are optional. You are responsible for what you put in collection names. A shared collection is public to anyone with its link. We may remove a collection that is used for abuse.</p>,
        },
        {
          id: "changes", title: "Changes",
          body: <p>If these terms change, this page will show the new date. The current version always applies.</p>,
        },
      ]}
    />
  );
}
